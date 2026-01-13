import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { MeetingService } from '../services/meetingService';
import { sendSuccess, sendError } from '../utils/helpers';
import { AuthRequest, ErrorCode } from '../types';
import { authenticate } from '../middleware/auth';
import { calculatePagination } from '../utils/helpers';
import logger from '../utils/logger';

const router = Router();

// すべてのルートで認証必須
router.use(authenticate);

// 会議一覧取得
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teamId = req.query.teamId as string;
    const isArchived = req.query.isArchived === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!teamId) {
      sendError(res, ErrorCode.VALIDATION_ERROR, 'teamId is required', 400);
      return;
    }

    const result = await MeetingService.getMeetings({
      teamId,
      isArchived,
      page,
      limit,
    });

    sendSuccess(res, {
      meetings: result.meetings,
      pagination: calculatePagination(result.total, page, limit),
    });
  } catch (error: any) {
    logger.error('Get meetings failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 会議詳細取得
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingService.getMeetingById(req.params.id);
    sendSuccess(res, meeting);
  } catch (error: any) {
    logger.error('Get meeting failed:', error);
    sendError(res, ErrorCode.NOT_FOUND, error.message, 404);
  }
});

// 会議作成
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      return;
    }

    const meeting = await MeetingService.createMeeting({
      ...req.body,
      createdBy: authReq.user.id,
    });

    sendSuccess(res, meeting, 'Meeting created successfully', 201);
  } catch (error: any) {
    logger.error('Create meeting failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 会議更新
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingService.updateMeeting(req.params.id, req.body);
    sendSuccess(res, meeting, 'Meeting updated successfully');
  } catch (error: any) {
    logger.error('Update meeting failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 会議削除
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await MeetingService.deleteMeeting(req.params.id);
    sendSuccess(res, null, 'Meeting deleted successfully');
  } catch (error: any) {
    logger.error('Delete meeting failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 会議アーカイブ
router.post('/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingService.archiveMeeting(req.params.id);
    sendSuccess(res, meeting, 'Meeting archived successfully');
  } catch (error: any) {
    logger.error('Archive meeting failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 会議復元
router.post('/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await MeetingService.restoreMeeting(req.params.id);
    sendSuccess(res, meeting, 'Meeting restored successfully');
  } catch (error: any) {
    logger.error('Restore meeting failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;
