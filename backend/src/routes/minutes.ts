import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { MinutesService } from '../services/minutesService';
import { sendSuccess, sendError } from '../utils/helpers';
import { AuthRequest, ErrorCode } from '../types';
import { authenticate } from '../middleware/auth';
import { calculatePagination } from '../utils/helpers';
import logger from '../utils/logger';

const router = Router();
const minutesService = new MinutesService();

// すべてのルートで認証必須
router.use(authenticate);

// 議事録一覧取得
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const meetingId = req.query.meetingId as string | undefined;
    const teamId = req.query.teamId as string | undefined;
    const dateFrom = req.query.dateFrom
      ? new Date(req.query.dateFrom as string)
      : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const result = await minutesService.getMinutes({
      meetingId,
      teamId,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    sendSuccess(res, {
      minutes: result.minutes,
      pagination: calculatePagination(result.total, page, limit),
    });
  } catch (error: any) {
    logger.error('Get minutes failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 議事録詳細取得
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minute = await minutesService.getMinuteById(req.params.id);
    sendSuccess(res, minute);
  } catch (error: any) {
    logger.error('Get minute failed:', error);
    sendError(res, ErrorCode.NOT_FOUND, error.message, 404);
  }
});

// 議事録作成（手動）
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      return;
    }

    const minute = await minutesService.createMinute({
      ...req.body,
      createdBy: authReq.user.id,
    });

    sendSuccess(res, minute, 'Minute created successfully', 201);
  } catch (error: any) {
    logger.error('Create minute failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// AI自動フォーマットで議事録作成
router.post('/ai-format', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      return;
    }

    const { meetingId, meetingDate, rawText } = req.body;

    if (!meetingId || !meetingDate || !rawText) {
      sendError(
        res,
        ErrorCode.VALIDATION_ERROR,
        'meetingId, meetingDate, and rawText are required',
        400
      );
      return;
    }

    const minute = await minutesService.createMinuteWithAI({
      meetingId,
      meetingDate,
      rawText,
      createdBy: authReq.user.id,
    });

    sendSuccess(res, minute, 'AI formatting completed successfully', 201);
  } catch (error: any) {
    logger.error('AI format failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 議事録更新
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minute = await minutesService.updateMinute(req.params.id, req.body);
    sendSuccess(res, minute, 'Minute updated successfully');
  } catch (error: any) {
    logger.error('Update minute failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 議事録削除
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await minutesService.deleteMinute(req.params.id);
    sendSuccess(res, null, 'Minute deleted successfully');
  } catch (error: any) {
    logger.error('Delete minute failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

// 議事録項目を個別更新
router.put('/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await minutesService.updateMinuteItem(req.params.itemId, req.body);
    sendSuccess(res, item, 'Minute item updated successfully');
  } catch (error: any) {
    logger.error('Update minute item failed:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, error.message, 500);
  }
});

export default router;
