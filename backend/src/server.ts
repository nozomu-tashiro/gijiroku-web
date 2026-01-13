import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// ミドルウェア
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// ルート
import authRoutes from './routes/auth';
import organizationRoutes from './routes/organization';
import minutesRoutes from './routes/minutes';

// ユーティリティ
import logger from './utils/logger';
import prisma from './utils/prisma';

// 環境変数の読み込み
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(helmet()); // セキュリティヘッダー
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
); // CORS
app.use(express.json({ limit: '10mb' })); // JSONパース
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL エンコード
app.use(morgan('combined')); // HTTPリクエストログ

// レート制限
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // デフォルト: 1分
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // デフォルト: 100リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/minutes', minutesRoutes);

// 404ハンドラー
app.use(notFoundHandler);

// エラーハンドラー
app.use(errorHandler);

// データベース接続チェック
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
}

// サーバー起動
async function startServer() {
  try {
    await checkDatabaseConnection();

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// サーバー起動
startServer();

export default app;
