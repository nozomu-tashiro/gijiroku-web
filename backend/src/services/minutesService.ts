import prisma from '../utils/prisma';
import { AIService } from './aiService';
import { AIFormatRequest } from '../types';
import logger from '../utils/logger';

export class MinutesService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * 議事録一覧を取得
   */
  async getMinutes(params: {
    meetingId?: string;
    teamId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
  }) {
    const { meetingId, teamId, dateFrom, dateTo, page, limit } = params;

    const where: any = {};

    if (meetingId) {
      where.meetingId = meetingId;
    }

    if (teamId) {
      where.meeting = { teamId };
    }

    if (dateFrom || dateTo) {
      where.meetingDate = {};
      if (dateFrom) where.meetingDate.gte = dateFrom;
      if (dateTo) where.meetingDate.lte = dateTo;
    }

    const [minutes, total] = await Promise.all([
      prisma.minute.findMany({
        where,
        include: {
          meeting: {
            include: {
              team: {
                include: {
                  department: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { meetingDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.minute.count({ where }),
    ]);

    return {
      minutes: minutes.map((minute) => ({
        id: minute.id,
        meeting: {
          id: minute.meeting.id,
          name: minute.meeting.name,
          team: {
            id: minute.meeting.team.id,
            name: minute.meeting.team.name,
            department: {
              id: minute.meeting.team.department.id,
              name: minute.meeting.team.department.name,
            },
          },
        },
        meetingDate: minute.meetingDate,
        title: minute.title,
        itemsCount: minute._count.items,
        createdBy: minute.creator,
        createdAt: minute.createdAt,
      })),
      total,
    };
  }

  /**
   * 議事録詳細を取得（項目含む）
   */
  async getMinuteById(minuteId: string) {
    const minute = await prisma.minute.findUnique({
      where: { id: minuteId },
      include: {
        meeting: {
          include: {
            team: {
              include: {
                department: true,
              },
            },
          },
        },
        items: {
          orderBy: { rowOrder: 'asc' },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!minute) {
      throw new Error('Minute not found');
    }

    return minute;
  }

  /**
   * 議事録を手動作成
   */
  async createMinute(data: {
    meetingId: string;
    meetingDate: Date;
    title?: string;
    items: Array<{
      agenda?: string;
      decision?: string;
      issue?: string;
      deadline?: Date;
      assignee?: string;
      actionItem?: string;
      reason?: string;
      status?: string;
    }>;
    createdBy: string;
  }) {
    const minute = await prisma.minute.create({
      data: {
        meetingId: data.meetingId,
        meetingDate: data.meetingDate,
        title: data.title,
        createdBy: data.createdBy,
        items: {
          create: data.items.map((item, index) => ({
            rowOrder: index + 1,
            agenda: item.agenda,
            decision: item.decision,
            issue: item.issue,
            deadline: item.deadline,
            assignee: item.assignee,
            actionItem: item.actionItem,
            reason: item.reason,
            status: (item.status as any) || 'not_started',
          })),
        },
      },
      include: {
        items: {
          orderBy: { rowOrder: 'asc' },
        },
      },
    });

    logger.info(`Minute created: ${minute.id} for meeting ${data.meetingId}`);

    return minute;
  }

  /**
   * AI自動フォーマットで議事録を作成
   */
  async createMinuteWithAI(data: AIFormatRequest & { createdBy: string }) {
    const { meetingId, meetingDate, rawText, createdBy } = data;

    // 会議が存在するか確認
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // AIで構造化
    logger.info('Starting AI formatting for meeting minutes');
    const formattedItems = await this.aiService.formatMinutesText(
      rawText,
      new Date(meetingDate)
    );

    // データベースに保存
    const minute = await prisma.minute.create({
      data: {
        meetingId,
        meetingDate: new Date(meetingDate),
        rawText,
        createdBy,
        items: {
          create: formattedItems.map((item, index) => ({
            rowOrder: index + 1,
            agenda: item.agenda,
            decision: item.decision,
            issue: item.issue,
            deadline: item.deadline ? new Date(item.deadline) : null,
            assignee: item.assignee,
            actionItem: item.action_item,
            reason: item.reason,
            status: 'not_started',
          })),
        },
      },
      include: {
        meeting: {
          include: {
            team: {
              include: {
                department: true,
              },
            },
          },
        },
        items: {
          orderBy: { rowOrder: 'asc' },
        },
      },
    });

    logger.info(`AI-formatted minute created: ${minute.id} with ${formattedItems.length} items`);

    return minute;
  }

  /**
   * 議事録を更新
   */
  async updateMinute(
    minuteId: string,
    data: {
      title?: string;
      items?: Array<{
        id?: string;
        rowOrder?: number;
        agenda?: string;
        decision?: string;
        issue?: string;
        deadline?: Date;
        assignee?: string;
        actionItem?: string;
        reason?: string;
        status?: string;
      }>;
    }
  ) {
    // 既存の議事録を取得
    const existingMinute = await prisma.minute.findUnique({
      where: { id: minuteId },
      include: { items: true },
    });

    if (!existingMinute) {
      throw new Error('Minute not found');
    }

    // トランザクションで更新
    const minute = await prisma.$transaction(async (tx) => {
      // タイトルを更新
      if (data.title !== undefined) {
        await tx.minute.update({
          where: { id: minuteId },
          data: { title: data.title },
        });
      }

      // 項目を更新
      if (data.items) {
        // 既存の項目IDを取得
        const existingItemIds = existingMinute.items.map((item) => item.id);
        const updatingItemIds = data.items.filter((item) => item.id).map((item) => item.id!);

        // 削除する項目を特定
        const itemsToDelete = existingItemIds.filter(
          (id) => !updatingItemIds.includes(id)
        );

        // 削除
        if (itemsToDelete.length > 0) {
          await tx.minuteItem.deleteMany({
            where: { id: { in: itemsToDelete } },
          });
        }

        // 更新と新規作成
        for (const item of data.items) {
          if (item.id) {
            // 既存項目を更新
            await tx.minuteItem.update({
              where: { id: item.id },
              data: {
                rowOrder: item.rowOrder,
                agenda: item.agenda,
                decision: item.decision,
                issue: item.issue,
                deadline: item.deadline,
                assignee: item.assignee,
                actionItem: item.actionItem,
                reason: item.reason,
                status: (item.status as any) || 'not_started',
              },
            });
          } else {
            // 新規項目を作成
            await tx.minuteItem.create({
              data: {
                minuteId,
                rowOrder: item.rowOrder || 0,
                agenda: item.agenda,
                decision: item.decision,
                issue: item.issue,
                deadline: item.deadline,
                assignee: item.assignee,
                actionItem: item.actionItem,
                reason: item.reason,
                status: (item.status as any) || 'not_started',
              },
            });
          }
        }
      }

      // 更新後の議事録を取得
      return tx.minute.findUnique({
        where: { id: minuteId },
        include: {
          items: {
            orderBy: { rowOrder: 'asc' },
          },
        },
      });
    });

    logger.info(`Minute updated: ${minuteId}`);

    return minute;
  }

  /**
   * 議事録を削除
   */
  async deleteMinute(minuteId: string) {
    await prisma.minute.delete({
      where: { id: minuteId },
    });

    logger.info(`Minute deleted: ${minuteId}`);
  }

  /**
   * 議事録項目を個別更新
   */
  async updateMinuteItem(
    itemId: string,
    data: {
      agenda?: string;
      decision?: string;
      issue?: string;
      deadline?: Date;
      assignee?: string;
      actionItem?: string;
      reason?: string;
      status?: string;
    }
  ) {
    const item = await prisma.minuteItem.update({
      where: { id: itemId },
      data: {
        agenda: data.agenda,
        decision: data.decision,
        issue: data.issue,
        deadline: data.deadline,
        assignee: data.assignee,
        actionItem: data.actionItem,
        reason: data.reason,
        status: (data.status as any),
      },
    });

    logger.info(`Minute item updated: ${itemId}`);

    return item;
  }
}
