import prisma from '../utils/prisma';
import logger from '../utils/logger';

export class MeetingService {
  /**
   * 会議一覧を取得
   */
  static async getMeetings(params: {
    teamId: string;
    isArchived?: boolean;
    page: number;
    limit: number;
  }) {
    const { teamId, isArchived = false, page, limit } = params;

    const where: any = { teamId };
    if (isArchived !== undefined) {
      where.isArchived = isArchived;
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          team: {
            include: {
              department: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { minutes: true },
          },
          minutes: {
            orderBy: { meetingDate: 'desc' },
            take: 1,
            select: {
              meetingDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      meetings: meetings.map((meeting) => ({
        id: meeting.id,
        name: meeting.name,
        description: meeting.description,
        team: {
          id: meeting.team.id,
          name: meeting.team.name,
          department: {
            id: meeting.team.department.id,
            name: meeting.team.department.name,
          },
        },
        minutesCount: meeting._count.minutes,
        latestMinuteDate: meeting.minutes[0]?.meetingDate || null,
        isArchived: meeting.isArchived,
        archivedAt: meeting.archivedAt,
        createdBy: meeting.creator,
        createdAt: meeting.createdAt,
      })),
      total,
    };
  }

  /**
   * 会議詳細を取得
   */
  static async getMeetingById(meetingId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        team: {
          include: {
            department: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        minutes: {
          orderBy: { meetingDate: 'desc' },
          include: {
            _count: {
              select: { items: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return {
      id: meeting.id,
      name: meeting.name,
      description: meeting.description,
      team: {
        id: meeting.team.id,
        name: meeting.team.name,
        department: {
          id: meeting.team.department.id,
          name: meeting.team.department.name,
        },
      },
      minutes: meeting.minutes.map((minute) => ({
        id: minute.id,
        meetingDate: minute.meetingDate,
        title: minute.title,
        itemsCount: minute._count.items,
        createdAt: minute.createdAt,
      })),
      isArchived: meeting.isArchived,
      archivedAt: meeting.archivedAt,
      createdBy: meeting.creator,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }

  /**
   * 会議を作成
   */
  static async createMeeting(data: {
    teamId: string;
    name: string;
    description?: string;
    createdBy: string;
  }) {
    const meeting = await prisma.meeting.create({
      data: {
        teamId: data.teamId,
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
      },
      include: {
        team: {
          include: {
            department: true,
          },
        },
      },
    });

    logger.info(`Meeting created: ${meeting.name} (${meeting.id})`);

    return meeting;
  }

  /**
   * 会議を更新
   */
  static async updateMeeting(
    meetingId: string,
    data: {
      name?: string;
      description?: string;
    }
  ) {
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data,
    });

    logger.info(`Meeting updated: ${meeting.name} (${meeting.id})`);

    return meeting;
  }

  /**
   * 会議を削除
   */
  static async deleteMeeting(meetingId: string) {
    await prisma.meeting.delete({
      where: { id: meetingId },
    });

    logger.info(`Meeting deleted: ${meetingId}`);
  }

  /**
   * 会議をアーカイブ
   */
  static async archiveMeeting(meetingId: string) {
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    logger.info(`Meeting archived: ${meeting.name} (${meeting.id})`);

    return meeting;
  }

  /**
   * 会議を復元（アーカイブ解除）
   */
  static async restoreMeeting(meetingId: string) {
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        isArchived: false,
        archivedAt: null,
      },
    });

    logger.info(`Meeting restored: ${meeting.name} (${meeting.id})`);

    return meeting;
  }
}
