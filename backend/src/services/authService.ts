import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { JwtPayload } from '../types';
import logger from '../utils/logger';

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * パスワードをハッシュ化
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * パスワードを検証
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * アクセストークンを生成
   */
  static generateAccessToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * リフレッシュトークンを生成
   */
  static generateRefreshToken(payload: JwtPayload): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * リフレッシュトークンを検証
   */
  static verifyRefreshToken(token: string): JwtPayload {
    const secret = process.env.JWT_REFRESH_SECRET;

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    return jwt.verify(token, secret) as JwtPayload;
  }

  /**
   * ログイン処理
   */
  static async login(email: string, password: string) {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        team: true,
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // アクティブチェック
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // パスワード検証
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 最終ログイン日時を更新
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // JWTペイロード作成
    const payload: JwtPayload & { departmentId?: string; teamId?: string } = {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || undefined,
      teamId: user.teamId || undefined,
    };

    // トークン生成
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    logger.info(`User logged in: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
          ? { id: user.department.id, name: user.department.name }
          : null,
        team: user.team ? { id: user.team.id, name: user.team.name } : null,
      },
    };
  }

  /**
   * トークンリフレッシュ
   */
  static async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);

      // ユーザーがまだアクティブか確認
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // 新しいアクセストークンを生成
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.generateAccessToken(payload);

      return { accessToken };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * 現在のユーザー情報を取得
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        team: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department
        ? { id: user.department.id, name: user.department.name }
        : null,
      team: user.team ? { id: user.team.id, name: user.team.name } : null,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
