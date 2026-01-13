import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/helpers';
import { AuthRequest, ErrorCode } from '../types';
import logger from '../utils/logger';

export class AuthController {
  /**
   * ログイン
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      logger.error('Login failed:', error);
      sendError(res, ErrorCode.UNAUTHORIZED, error.message || 'Login failed', 401);
    }
  }

  /**
   * トークンリフレッシュ
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        sendError(res, ErrorCode.VALIDATION_ERROR, 'Refresh token is required', 400);
        return;
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      sendError(res, ErrorCode.UNAUTHORIZED, 'Invalid refresh token', 401);
    }
  }

  /**
   * ログアウト
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // JWTはステートレスなので、クライアント側でトークンを削除するだけ
      // 将来的にはトークンブラックリストを実装することも可能
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error: any) {
      logger.error('Logout failed:', error);
      sendError(res, ErrorCode.INTERNAL_ERROR, 'Logout failed', 500);
    }
  }

  /**
   * 現在のユーザー情報取得
   */
  static async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.user) {
        sendError(res, ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
        return;
      }

      const user = await AuthService.getCurrentUser(authReq.user.id);

      sendSuccess(res, user);
    } catch (error: any) {
      logger.error('Get current user failed:', error);
      sendError(res, ErrorCode.NOT_FOUND, 'User not found', 404);
    }
  }
}
