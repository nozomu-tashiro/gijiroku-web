import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from '../services/organizationService';
import { sendSuccess, sendError } from '../utils/helpers';
import { ErrorCode } from '../types';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// すべてのルートで認証必須
router.use(authenticate);

// ボード情報取得
router.get('/board', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const board = await OrganizationService.getBoard();
    sendSuccess(res, board);
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 部門一覧取得
router.get('/departments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await OrganizationService.getDepartments();
    sendSuccess(res, departments);
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 部門詳細取得
router.get('/departments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const department = await OrganizationService.getDepartmentById(req.params.id);
    sendSuccess(res, department);
  } catch (error: any) {
    sendError(res, ErrorCode.NOT_FOUND, error.message, 404);
  }
});

// 部門作成（管理者のみ）
router.post(
  '/departments',
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const department = await OrganizationService.createDepartment(req.body);
      sendSuccess(res, department, 'Department created successfully', 201);
    } catch (error: any) {
      sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
    }
  }
);

// 部門更新（管理者のみ）
router.put(
  '/departments/:id',
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const department = await OrganizationService.updateDepartment(
        req.params.id,
        req.body
      );
      sendSuccess(res, department, 'Department updated successfully');
    } catch (error: any) {
      sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
    }
  }
);

// 部門削除（管理者のみ）
router.delete(
  '/departments/:id',
  authorize('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await OrganizationService.deleteDepartment(req.params.id);
      sendSuccess(res, null, 'Department deleted successfully');
    } catch (error: any) {
      sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
    }
  }
);

// チーム一覧取得
router.get('/teams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const teams = await OrganizationService.getTeams(departmentId);
    sendSuccess(res, teams);
  } catch (error: any) {
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// チーム詳細取得
router.get('/teams/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await OrganizationService.getTeamById(req.params.id);
    sendSuccess(res, team);
  } catch (error: any) {
    sendError(res, ErrorCode.NOT_FOUND, error.message, 404);
  }
});

// チーム作成（管理者・マネージャー）
router.post(
  '/teams',
  authorize('admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await OrganizationService.createTeam(req.body);
      sendSuccess(res, team, 'Team created successfully', 201);
    } catch (error: any) {
      sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
    }
  }
);

// チーム更新（管理者・マネージャー）
router.put(
  '/teams/:id',
  authorize('admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await OrganizationService.updateTeam(req.params.id, req.body);
      sendSuccess(res, team, 'Team updated successfully');
    } catch (error: any) {
      sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
    }
  }
);

// チーム削除（管理者・マネージャー）
router.delete(
  '/teams/:id',
  authorize('admin', 'manager'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await OrganizationService.deleteTeam(req.params.id);
      sendSuccess(res, null, 'Team deleted successfully');
    } catch (error: any) {
      sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
    }
  }
);

export default router;
