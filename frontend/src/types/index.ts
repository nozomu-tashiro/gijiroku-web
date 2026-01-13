export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  department: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  teamsCount?: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  department: {
    id: string;
    name: string;
  };
  meetingsCount?: number;
}

export interface Meeting {
  id: string;
  name: string;
  description?: string;
  team: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    };
  };
  minutesCount: number;
  latestMinuteDate?: string;
  isArchived: boolean;
  archivedAt?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface Minute {
  id: string;
  meeting: {
    id: string;
    name: string;
    team: {
      id: string;
      name: string;
      department: {
        id: string;
        name: string;
      };
    };
  };
  meetingDate: string;
  title?: string;
  itemsCount: number;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface MinuteItem {
  id: string;
  rowOrder: number;
  agenda?: string;
  decision?: string;
  issue?: string;
  deadline?: string;
  assignee?: string;
  actionItem?: string;
  reason?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'pending' | 'cancelled';
  otherInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MinuteDetail extends Minute {
  rawText?: string;
  items: MinuteItem[];
}

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

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
