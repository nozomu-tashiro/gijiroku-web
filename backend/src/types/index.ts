import { Request } from 'express';
import { UserRole } from '@prisma/client';

// ユーザー情報を含むRequestの拡張
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    departmentId?: string;
    teamId?: string;
  };
}

// APIレスポンスの型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ページネーション型定義
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 検索・フィルタ型定義
export interface SearchParams {
  q?: string;
  departmentId?: string;
  teamId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  assignee?: string;
}

// AI自動フォーマット用の型定義
export interface AIFormattedItem {
  agenda?: string;
  decision?: string;
  issue?: string;
  deadline?: string | null;
  assignee?: string;
  action_item?: string;
  reason?: string;
}

export interface AIFormatRequest {
  meetingId: string;
  meetingDate: string;
  rawText: string;
}

// JWT Payload型定義
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// エラーコード定義
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
