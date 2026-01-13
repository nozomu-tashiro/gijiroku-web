# API仕様書

## ベースURL

```
開発環境: http://localhost:3000/api
本番環境: https://your-domain.com/api
```

## 認証

すべての保護されたエンドポイントは、HTTPヘッダーに認証トークンが必要です。

```
Authorization: Bearer <access_token>
```

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

## エラーコード

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| UNAUTHORIZED | 401 | 認証が必要です |
| FORBIDDEN | 403 | アクセス権限がありません |
| NOT_FOUND | 404 | リソースが見つかりません |
| VALIDATION_ERROR | 400 | 入力値が不正です |
| INTERNAL_ERROR | 500 | サーバー内部エラー |

---

## 認証エンドポイント

### POST /api/auth/login
ユーザーログイン

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田太郎",
      "role": "member",
      "department": {
        "id": "uuid",
        "name": "営業部"
      },
      "team": {
        "id": "uuid",
        "name": "東日本"
      }
    }
  }
}
```

### POST /api/auth/refresh
トークンのリフレッシュ

**リクエスト:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST /api/auth/logout
ログアウト

**ヘッダー:** Authorization: Bearer <token>

**レスポンス (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/me
現在のユーザー情報取得

**ヘッダー:** Authorization: Bearer <token>

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田太郎",
    "role": "member",
    "department": { ... },
    "team": { ... },
    "isActive": true
  }
}
```

---

## ユーザー管理エンドポイント

### GET /api/users
ユーザー一覧取得

**クエリパラメータ:**
- `page` (number): ページ番号（デフォルト: 1）
- `limit` (number): 1ページあたりの件数（デフォルト: 20）
- `departmentId` (uuid): 部門IDでフィルタ
- `teamId` (uuid): チームIDでフィルタ
- `isActive` (boolean): アクティブ状態でフィルタ

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "山田太郎",
        "role": "member",
        "department": { "id": "uuid", "name": "営業部" },
        "team": { "id": "uuid", "name": "東日本" },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

### GET /api/users/:id
ユーザー詳細取得

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田太郎",
    "role": "member",
    "department": { ... },
    "team": { ... },
    "isActive": true,
    "lastLoginAt": "2024-01-13T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-13T10:30:00Z"
  }
}
```

### POST /api/users
ユーザー作成（管理者のみ）

**リクエスト:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "name": "新規ユーザー",
  "role": "member",
  "departmentId": "uuid",
  "teamId": "uuid"
}
```

**レスポンス (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "新規ユーザー",
    ...
  }
}
```

### PUT /api/users/:id
ユーザー更新

**リクエスト:**
```json
{
  "name": "更新後の名前",
  "departmentId": "uuid",
  "teamId": "uuid",
  "role": "manager"
}
```

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE /api/users/:id
ユーザー削除（論理削除）

**レスポンス (200 OK):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## 組織階層エンドポイント

### GET /api/organization/board
ボード（経営層）情報取得

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "name": "ボード（経営層）",
    "departments": [
      {
        "id": "uuid",
        "name": "営業部（営業債権管理部）",
        "teamsCount": 2
      },
      ...
    ]
  }
}
```

### GET /api/departments
部門一覧取得

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "営業部（営業債権管理部）",
      "description": "営業活動と債権管理を担当",
      "teamsCount": 2,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    ...
  ]
}
```

### GET /api/departments/:id
部門詳細取得

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "営業部（営業債権管理部）",
    "description": "営業活動と債権管理を担当",
    "teams": [
      {
        "id": "uuid",
        "name": "東日本",
        "description": null,
        "meetingsCount": 5
      },
      ...
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/departments
部門作成（管理者のみ）

**リクエスト:**
```json
{
  "name": "新規部門",
  "description": "部門の説明"
}
```

### PUT /api/departments/:id
部門更新

### DELETE /api/departments/:id
部門削除

### GET /api/teams
チーム一覧取得

**クエリパラメータ:**
- `departmentId` (uuid): 部門IDでフィルタ

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "東日本",
      "department": {
        "id": "uuid",
        "name": "営業部"
      },
      "meetingsCount": 5
    },
    ...
  ]
}
```

### GET /api/teams/:id
チーム詳細取得

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "東日本",
    "description": null,
    "department": { ... },
    "meetings": [
      {
        "id": "uuid",
        "name": "週次定例会議",
        "isArchived": false,
        "minutesCount": 12
      },
      ...
    ],
    "members": [
      {
        "id": "uuid",
        "name": "山田太郎",
        "role": "manager"
      },
      ...
    ]
  }
}
```

### POST /api/teams
チーム作成

**リクエスト:**
```json
{
  "departmentId": "uuid",
  "name": "新規チーム",
  "description": "チームの説明"
}
```

### PUT /api/teams/:id
チーム更新

### DELETE /api/teams/:id
チーム削除

---

## 会議管理エンドポイント

### GET /api/meetings
会議一覧取得

**クエリパラメータ:**
- `teamId` (uuid): チームIDでフィルタ（必須）
- `isArchived` (boolean): アーカイブ状態でフィルタ（デフォルト: false）
- `page` (number): ページ番号
- `limit` (number): 1ページあたりの件数

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "meetings": [
      {
        "id": "uuid",
        "name": "週次定例会議",
        "description": "毎週月曜日の定例会議",
        "team": {
          "id": "uuid",
          "name": "東日本"
        },
        "minutesCount": 12,
        "latestMinuteDate": "2024-01-13",
        "isArchived": false,
        "createdBy": {
          "id": "uuid",
          "name": "山田太郎"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      },
      ...
    ],
    "pagination": { ... }
  }
}
```

### GET /api/meetings/:id
会議詳細取得

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "週次定例会議",
    "description": "毎週月曜日の定例会議",
    "team": { ... },
    "minutes": [
      {
        "id": "uuid",
        "meetingDate": "2024-01-13",
        "title": "第12回 週次定例会議",
        "itemsCount": 5,
        "createdAt": "2024-01-13T10:00:00Z"
      },
      ...
    ],
    "isArchived": false,
    "createdBy": { ... },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/meetings
会議作成

**リクエスト:**
```json
{
  "teamId": "uuid",
  "name": "新規会議",
  "description": "会議の説明"
}
```

**レスポンス (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "新規会議",
    ...
  }
}
```

### PUT /api/meetings/:id
会議更新

### DELETE /api/meetings/:id
会議削除

### POST /api/meetings/:id/archive
会議アーカイブ

**レスポンス (200 OK):**
```json
{
  "success": true,
  "message": "Meeting archived successfully",
  "data": {
    "id": "uuid",
    "isArchived": true,
    "archivedAt": "2024-01-13T10:00:00Z"
  }
}
```

### POST /api/meetings/:id/restore
会議復元（アーカイブ解除）

**レスポンス (200 OK):**
```json
{
  "success": true,
  "message": "Meeting restored successfully",
  "data": {
    "id": "uuid",
    "isArchived": false,
    "archivedAt": null
  }
}
```

---

## 議事録管理エンドポイント

### GET /api/minutes
議事録一覧取得

**クエリパラメータ:**
- `meetingId` (uuid): 会議IDでフィルタ
- `teamId` (uuid): チームIDでフィルタ
- `dateFrom` (date): 開始日（YYYY-MM-DD）
- `dateTo` (date): 終了日（YYYY-MM-DD）
- `page` (number): ページ番号
- `limit` (number): 1ページあたりの件数

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "minutes": [
      {
        "id": "uuid",
        "meeting": {
          "id": "uuid",
          "name": "週次定例会議",
          "team": {
            "name": "東日本",
            "department": {
              "name": "営業部"
            }
          }
        },
        "meetingDate": "2024-01-13",
        "title": "第12回 週次定例会議",
        "itemsCount": 5,
        "createdBy": {
          "name": "山田太郎"
        },
        "createdAt": "2024-01-13T10:00:00Z"
      },
      ...
    ],
    "pagination": { ... }
  }
}
```

### GET /api/minutes/:id
議事録詳細取得（項目含む）

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "meeting": { ... },
    "meetingDate": "2024-01-13",
    "title": "第12回 週次定例会議",
    "rawText": "元のテキスト...",
    "items": [
      {
        "id": "uuid",
        "rowOrder": 1,
        "agenda": "新規プロジェクトの進捗確認",
        "decision": "来週までにプロトタイプを完成させる",
        "issue": "リソース不足が懸念される",
        "deadline": "2024-01-20",
        "assignee": "佐藤次郎",
        "actionItem": "プロトタイプの実装",
        "reason": "顧客への提案が迫っているため",
        "status": "in_progress",
        "otherInfo": null,
        "createdAt": "2024-01-13T10:00:00Z",
        "updatedAt": "2024-01-13T15:00:00Z"
      },
      ...
    ],
    "createdBy": { ... },
    "createdAt": "2024-01-13T10:00:00Z",
    "updatedAt": "2024-01-13T15:00:00Z"
  }
}
```

### POST /api/minutes
議事録作成（手動入力）

**リクエスト:**
```json
{
  "meetingId": "uuid",
  "meetingDate": "2024-01-13",
  "title": "第12回 週次定例会議",
  "items": [
    {
      "agenda": "議題1",
      "decision": "決定事項1",
      "issue": "課題1",
      "deadline": "2024-01-20",
      "assignee": "山田太郎",
      "actionItem": "実行内容1",
      "reason": "理由1",
      "status": "not_started"
    }
  ]
}
```

**レスポンス (201 Created):**
```json
{
  "success": true,
  "data": { ... }
}
```

### POST /api/minutes/ai-format
AI自動フォーマット

**リクエスト:**
```json
{
  "meetingId": "uuid",
  "meetingDate": "2024-01-13",
  "rawText": "本日の会議では、新規プロジェクトについて話し合いました。佐藤さんが来週までにプロトタイプを完成させることになりました。リソース不足が懸念されるため、追加のメンバーをアサインすることを検討します。..."
}
```

**レスポンス (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "meeting": { ... },
    "meetingDate": "2024-01-13",
    "title": null,
    "rawText": "本日の会議では...",
    "items": [
      {
        "id": "uuid",
        "rowOrder": 1,
        "agenda": "新規プロジェクトの進捗確認",
        "decision": "来週までにプロトタイプを完成させる",
        "issue": "リソース不足が懸念される",
        "deadline": "2024-01-20",
        "assignee": "佐藤次郎",
        "actionItem": "プロトタイプの実装",
        "reason": "顧客への提案が迫っているため",
        "status": "not_started",
        "otherInfo": null
      },
      ...
    ],
    "createdAt": "2024-01-13T10:00:00Z"
  },
  "message": "AI formatting completed successfully"
}
```

### PUT /api/minutes/:id
議事録更新

**リクエスト:**
```json
{
  "title": "更新後のタイトル",
  "items": [
    {
      "id": "existing-uuid",
      "agenda": "更新された議題",
      "status": "completed"
    },
    {
      // idがない場合は新規追加
      "agenda": "新しい議題",
      "decision": "新しい決定事項",
      "status": "not_started"
    }
  ]
}
```

### DELETE /api/minutes/:id
議事録削除

### PUT /api/minutes/items/:itemId
議事録項目の個別更新

**リクエスト:**
```json
{
  "status": "completed",
  "actionItem": "更新された実行内容"
}
```

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 検索エンドポイント

### GET /api/search
統合検索

**クエリパラメータ:**
- `q` (string): 検索キーワード（必須）
- `type` (string): 検索対象（'minutes', 'meetings', 'all'）デフォルト: 'all'
- `departmentId` (uuid): 部門IDでフィルタ
- `teamId` (uuid): チームIDでフィルタ
- `dateFrom` (date): 開始日
- `dateTo` (date): 終了日
- `status` (string): ステータスでフィルタ
- `assignee` (string): 担当者でフィルタ
- `page` (number): ページ番号
- `limit` (number): 1ページあたりの件数

**レスポンス (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "minute_item",
        "id": "uuid",
        "minute": {
          "id": "uuid",
          "meetingDate": "2024-01-13",
          "meeting": {
            "name": "週次定例会議",
            "team": {
              "name": "東日本",
              "department": {
                "name": "営業部"
              }
            }
          }
        },
        "agenda": "新規プロジェクト...",
        "decision": "プロトタイプを...",
        "issue": "リソース不足...",
        "status": "in_progress",
        "matchedFields": ["agenda", "decision"]
      },
      ...
    ],
    "pagination": { ... },
    "facets": {
      "departments": [
        { "id": "uuid", "name": "営業部", "count": 15 }
      ],
      "teams": [...],
      "statuses": [
        { "value": "in_progress", "count": 8 }
      ]
    }
  }
}
```

---

## ステータス値

議事録項目のステータスは以下の値を取ります:

| 値 | 日本語 | 説明 |
|----|--------|------|
| not_started | 未着手 | まだ開始していない |
| in_progress | 進行中 | 作業中 |
| completed | 完了 | 完了済み |
| pending | 保留 | 一時的に保留 |
| cancelled | 中止 | 中止された |

## レート制限

```
認証済みユーザー: 100リクエスト/分
未認証: 10リクエスト/分
```

レート制限を超えた場合、429 Too Many Requestsが返されます。

## CORS設定

以下のオリジンからのアクセスを許可:
- http://localhost:5173 (開発環境)
- https://your-domain.com (本番環境)

## WebSocket（将来実装予定）

リアルタイム通知機能のためのWebSocketエンドポイント:

```
ws://localhost:3000/ws
```
