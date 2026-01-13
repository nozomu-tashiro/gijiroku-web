import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError } from '../utils/helpers';
import { ErrorCode } from '../types';

/**
 * バリデーション結果をチェックするミドルウェア
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // バリデーションを実行
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // エラーを整形
    const extractedErrors: any[] = [];
    errors.array().map((err: any) =>
      extractedErrors.push({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })
    );

    sendError(res, ErrorCode.VALIDATION_ERROR, 'Validation failed', 400, extractedErrors);
  };
};
