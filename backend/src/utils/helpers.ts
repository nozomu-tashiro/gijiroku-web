import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * 成功レスポンスを返す
 */
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
};

/**
 * エラーレスポンスを返す
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  res.status(statusCode).json(response);
};

/**
 * ページネーション計算
 */
export const calculatePagination = (
  total: number,
  page: number,
  limit: number
) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * 日付文字列のバリデーション（YYYY-MM-DD形式）
 */
export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * UUID形式のバリデーション
 */
export const isValidUUID = (uuid: string): boolean => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

/**
 * 日付の相対表現を具体的な日付に変換
 * 例: "来週" -> "2024-01-20", "月末" -> "2024-01-31"
 */
export const parseRelativeDate = (dateStr: string, baseDate: Date = new Date()): string | null => {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  // "今日"
  if (dateStr.match(/今日|本日/)) {
    return formatDate(today);
  }

  // "明日"
  if (dateStr.match(/明日/)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }

  // "来週" (7日後)
  if (dateStr.match(/来週/)) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDate(nextWeek);
  }

  // "月末"
  if (dateStr.match(/月末/)) {
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return formatDate(lastDay);
  }

  // "来月"
  if (dateStr.match(/来月/)) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return formatDate(nextMonth);
  }

  // "N日後"
  const daysMatch = dateStr.match(/(\d+)日後/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    return formatDate(futureDate);
  }

  // "N週間後"
  const weeksMatch = dateStr.match(/(\d+)週間後/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + (weeks * 7));
    return formatDate(futureDate);
  }

  return null;
};

/**
 * Date を YYYY-MM-DD 形式にフォーマット
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 安全なJSON.parse
 */
export const safeJsonParse = <T = any>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};
