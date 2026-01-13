import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, ErrorCode } from '../types';
import { sendError } from '../utils/helpers';
import logger from '../utils/logger';

/**
 * JWT認証ミドルウェア
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'Authentication token required', 401);
      return;
    }

    const token = authHeader.substring(7); // "Bearer " を除去

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured');
      sendError(res, ErrorCode.INTERNAL_ERROR, 'Server configuration error', 500);
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // AuthRequestにユーザー情報を追加
    (req as AuthRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      departmentId: (decoded as any).departmentId,
      teamId: (decoded as any).teamId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'Invalid token', 401);
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'Token expired', 401);
      return;
    }
    logger.error('Authentication error:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, 'Authentication failed', 500);
  }
};

/**
 * 役割ベースの認可ミドルウェア
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      sendError(
        res,
        ErrorCode.FORBIDDEN,
        'You do not have permission to access this resource',
        403
      );
      return;
    }

    next();
  };
};

/**
 * 部門・チームベースのアクセス制御ミドルウェア
 */
export const checkResourceAccess = (
  resourceDepartmentId?: string,
  resourceTeamId?: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      sendError(res, ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      return;
    }

    // 管理者は全てにアクセス可能
    if (authReq.user.role === 'admin') {
      next();
      return;
    }

    // マネージャーは自部門と配下のチームにアクセス可能
    if (authReq.user.role === 'manager') {
      if (
        authReq.user.departmentId === resourceDepartmentId ||
        authReq.user.teamId === resourceTeamId
      ) {
        next();
        return;
      }
    }

    // メンバーは自チームのみアクセス可能
    if (authReq.user.role === 'member') {
      if (authReq.user.teamId === resourceTeamId) {
        next();
        return;
      }
    }

    sendError(
      res,
      ErrorCode.FORBIDDEN,
      'You do not have permission to access this resource',
      403
    );
  };
};
