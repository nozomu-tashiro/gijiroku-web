import prisma from '../utils/prisma';
import logger from '../utils/logger';

export class OrganizationService {
  /**
   * ボード情報を取得（全部門一覧）
   */
  static async getBoard() {
    const departments = await prisma.department.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { teams: true },
        },
      },
    });

    return {
      name: 'ボード（経営層）',
      departments: departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        teamsCount: dept._count.teams,
      })),
    };
  }

  /**
   * 部門一覧を取得
   */
  static async getDepartments() {
    const departments = await prisma.department.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { teams: true, users: true },
        },
      },
    });

    return departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      teamsCount: dept._count.teams,
      usersCount: dept._count.users,
      createdAt: dept.createdAt,
    }));
  }

  /**
   * 部門詳細を取得
   */
  static async getDepartmentById(departmentId: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        teams: {
          orderBy: { displayOrder: 'asc' },
          include: {
            _count: {
              select: { meetings: true, users: true },
            },
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    return {
      id: department.id,
      name: department.name,
      description: department.description,
      teams: department.teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        meetingsCount: team._count.meetings,
        usersCount: team._count.users,
      })),
      usersCount: department._count.users,
      createdAt: department.createdAt,
    };
  }

  /**
   * 部門を作成
   */
  static async createDepartment(data: {
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    const department = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder ?? 0,
      },
    });

    logger.info(`Department created: ${department.name} (${department.id})`);

    return department;
  }

  /**
   * 部門を更新
   */
  static async updateDepartment(
    departmentId: string,
    data: {
      name?: string;
      description?: string;
      displayOrder?: number;
    }
  ) {
    const department = await prisma.department.update({
      where: { id: departmentId },
      data,
    });

    logger.info(`Department updated: ${department.name} (${department.id})`);

    return department;
  }

  /**
   * 部門を削除
   */
  static async deleteDepartment(departmentId: string) {
    await prisma.department.delete({
      where: { id: departmentId },
    });

    logger.info(`Department deleted: ${departmentId}`);
  }

  /**
   * チーム一覧を取得
   */
  static async getTeams(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};

    const teams = await prisma.team.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        department: true,
        _count: {
          select: { meetings: true, users: true },
        },
      },
    });

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      department: {
        id: team.department.id,
        name: team.department.name,
      },
      meetingsCount: team._count.meetings,
      usersCount: team._count.users,
    }));
  }

  /**
   * チーム詳細を取得
   */
  static async getTeamById(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        department: true,
        meetings: {
          where: { isArchived: false },
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { minutes: true },
            },
          },
        },
        users: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      department: {
        id: team.department.id,
        name: team.department.name,
      },
      meetings: team.meetings.map((meeting) => ({
        id: meeting.id,
        name: meeting.name,
        description: meeting.description,
        isArchived: meeting.isArchived,
        minutesCount: meeting._count.minutes,
        createdAt: meeting.createdAt,
      })),
      members: team.users,
      createdAt: team.createdAt,
    };
  }

  /**
   * チームを作成
   */
  static async createTeam(data: {
    departmentId: string;
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    const team = await prisma.team.create({
      data: {
        departmentId: data.departmentId,
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder ?? 0,
      },
      include: {
        department: true,
      },
    });

    logger.info(`Team created: ${team.name} (${team.id}) in ${team.department.name}`);

    return team;
  }

  /**
   * チームを更新
   */
  static async updateTeam(
    teamId: string,
    data: {
      name?: string;
      description?: string;
      displayOrder?: number;
    }
  ) {
    const team = await prisma.team.update({
      where: { id: teamId },
      data,
    });

    logger.info(`Team updated: ${team.name} (${team.id})`);

    return team;
  }

  /**
   * チームを削除
   */
  static async deleteTeam(teamId: string) {
    await prisma.team.delete({
      where: { id: teamId },
    });

    logger.info(`Team deleted: ${teamId}`);
  }
}
