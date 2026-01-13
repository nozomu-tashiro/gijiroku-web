import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for demo
  credentials: true,
}));
app.use(express.json());

// Mock data
const mockUser = {
  id: 'demo-user-123',
  email: 'admin@example.com',
  name: 'デモ管理者',
  role: 'admin',
  department: {
    id: 'dept-1',
    name: '営業部（営業債権管理部）',
  },
  team: {
    id: 'team-1',
    name: '東日本',
  },
};

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Demo mode - Database not connected',
    timestamp: new Date().toISOString(),
  });
});

// Login endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Demo credentials
  if (email === 'admin@example.com' && password === 'Admin@123') {
    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
      process.env.JWT_SECRET || 'demo-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        accessToken: token,
        refreshToken: token,
        user: mockUser,
      },
      message: 'Login successful',
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      },
    });
  }
});

// Get current user
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required',
      },
    });
  }

  try {
    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');

    res.json({
      success: true,
      data: mockUser,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      },
    });
  }
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Get board (organization)
app.get('/api/organization/board', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'ボード（経営層）',
      departments: [
        { id: 'dept-1', name: '営業部（営業債権管理部）', teamsCount: 2 },
        { id: 'dept-2', name: '債権管理部（営業債権管理部）', teamsCount: 9 },
        { id: 'dept-3', name: '審査契約管理部', teamsCount: 3 },
        { id: 'dept-4', name: 'システム部', teamsCount: 0 },
        { id: 'dept-5', name: '人事管理部', teamsCount: 3 },
      ],
    },
  });
});

// Get meetings
app.get('/api/meetings', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      meetings: [
        {
          id: 'meeting-1',
          name: '週次定例会議',
          description: '毎週月曜日の定例会議',
          team: {
            id: 'team-1',
            name: '東日本',
            department: {
              id: 'dept-1',
              name: '営業部',
            },
          },
          minutesCount: 5,
          isArchived: false,
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.path} not found`,
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 デモモードで起動しました');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('ℹ️  デモアカウント:');
  console.log('   Email: admin@example.com');
  console.log('   Password: Admin@123');
  console.log('');
  console.log('⚠️  データベース未接続 - デモデータを使用中');
  console.log('='.repeat(60));
});

export default app;
