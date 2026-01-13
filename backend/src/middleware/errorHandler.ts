import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/helpers';
import { ErrorCode } from '../types';
import logger from '../utils/logger';

/**
 * グローバルエラーハンドリングミドルウェア
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma エラー
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      sendError(res, ErrorCode.DUPLICATE_ERROR, 'Duplicate entry', 409, {
        field: err.meta?.target,
      });
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, ErrorCode.NOT_FOUND, 'Record not found', 404);
      return;
    }
    sendError(res, ErrorCode.DATABASE_ERROR, 'Database error', 500);
    return;
  }

  // バリデーションエラー
  if (err.name === 'ValidationError') {
    sendError(res, ErrorCode.VALIDATION_ERROR, err.message, 400, err.details);
    return;
  }

  // デフォルトエラー
  sendError(
    res,
    ErrorCode.INTERNAL_ERROR,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    500
  );
};

/**
 * 404 Not Found ハンドラー
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, ErrorCode.NOT_FOUND, `Route ${req.path} not found`, 404);
};
