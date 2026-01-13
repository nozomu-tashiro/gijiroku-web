import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// ログイン
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  AuthController.login
);

// トークンリフレッシュ
router.post(
  '/refresh',
  validate([body('refreshToken').notEmpty().withMessage('Refresh token is required')]),
  AuthController.refresh
);

// ログアウト
router.post('/logout', authenticate, AuthController.logout);

// 現在のユーザー情報取得
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;
