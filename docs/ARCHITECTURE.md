# アーキテクチャ設計書

## システムアーキテクチャ概要

### アーキテクチャスタイル
本システムは **3層アーキテクチャ（Three-tier Architecture）** を採用しています。

```
┌─────────────────────────────────────────────────┐
│         Presentation Layer (プレゼンテーション層)          │
│                                                 │
│  React Frontend (SPA)                           │
│  - React Router (ルーティング)                   │
│  - Zustand (状態管理)                           │
│  - React Query (データキャッシング)              │
│  - Tailwind CSS (スタイリング)                   │
└─────────────────────────────────────────────────┘
                      ↕ HTTPS (REST API)
┌─────────────────────────────────────────────────┐
│         Application Layer (アプリケーション層)           │
│                                                 │
│  Node.js + Express (TypeScript)                 │
│  - JWT認証ミドルウェア                            │
│  - OpenAI API統合 (GPT-4)                       │
│  - ビジネスロジック層                             │
│  - バリデーション層                               │
└─────────────────────────────────────────────────┘
                      ↕ Prisma ORM
┌─────────────────────────────────────────────────┐
│         Data Layer (データ層)                           │
│                                                 │
│  PostgreSQL Database                            │
│  - ユーザー管理                                  │
│  - 組織階層管理                                  │
│  - 会議・議事録管理                               │
│  - アクセス権限管理                               │
└─────────────────────────────────────────────────┘
```

## コンポーネント詳細設計

### 1. フロントエンド（Presentation Layer）

#### ページ構成
```
/
├── /login                    # ログインページ
├── /dashboard                # ダッシュボード（ホーム）
├── /organization             # 組織階層管理
│   ├── /board                # ボード（経営層）
│   ├── /departments/:id      # 部門詳細
│   └── /teams/:id            # チーム詳細
├── /meetings                 # 会議一覧
│   ├── /new                  # 新規会議作成
│   ├── /:id                  # 会議詳細
│   └── /:id/minutes          # 議事録一覧
├── /minutes                  # 議事録管理
│   ├── /new                  # 新規議事録作成（AI入力）
│   ├── /:id                  # 議事録詳細
│   └── /:id/edit             # 議事録編集
├── /search                   # 検索ページ
├── /archive                  # アーカイブ
└── /settings                 # 設定
    ├── /profile              # プロフィール
    └── /permissions          # 権限管理（管理者のみ）
```

#### 主要コンポーネント
```typescript
// レイアウトコンポーネント
- Layout                      # 共通レイアウト
- Sidebar                     # サイドバーナビゲーション
- Header                      # ヘッダー（検索バー、ユーザーメニュー）
- Footer                      # フッター

// 組織階層コンポーネント
- OrganizationTree            # 3階層ツリー表示
- DepartmentCard              # 部門カード
- TeamCard                    # チームカード
- HierarchyBreadcrumb         # パンくずリスト

// 会議管理コンポーネント
- MeetingList                 # 会議一覧
- MeetingCard                 # 会議カード
- MeetingForm                 # 会議作成・編集フォーム
- MeetingArchiveButton        # アーカイブボタン

// 議事録コンポーネント
- MinutesInputForm            # テキスト入力フォーム
- MinutesTable                # 議事録表（スプレッドシート形式）
- MinutesRow                  # 議事録行
- MinutesDetailModal          # 議事録詳細モーダル
- AIFormatButton              # AI自動フォーマットボタン

// 検索・フィルタコンポーネント
- SearchBar                   # 検索バー
- FilterPanel                 # フィルタパネル
- DateRangePicker             # 日付範囲選択
- StatusFilter                # ステータスフィルタ

// 認証コンポーネント
- LoginForm                   # ログインフォーム
- ProtectedRoute              # 認証済みルート
- RoleBasedAccess             # 役割ベースアクセス制御
```

### 2. バックエンド（Application Layer）

#### APIエンドポイント設計

```
認証
POST   /api/auth/login              # ログイン
POST   /api/auth/logout             # ログアウト
POST   /api/auth/refresh            # トークンリフレッシュ
GET    /api/auth/me                 # 現在のユーザー情報

ユーザー管理
GET    /api/users                   # ユーザー一覧
GET    /api/users/:id               # ユーザー詳細
POST   /api/users                   # ユーザー作成
PUT    /api/users/:id               # ユーザー更新
DELETE /api/users/:id               # ユーザー削除（論理削除）

組織階層管理
GET    /api/organization/board      # ボード情報取得
GET    /api/departments             # 部門一覧
GET    /api/departments/:id         # 部門詳細
POST   /api/departments             # 部門作成
PUT    /api/departments/:id         # 部門更新
DELETE /api/departments/:id         # 部門削除
GET    /api/teams                   # チーム一覧
GET    /api/teams/:id               # チーム詳細
POST   /api/teams                   # チーム作成
PUT    /api/teams/:id               # チーム更新
DELETE /api/teams/:id               # チーム削除

会議管理
GET    /api/meetings                # 会議一覧（フィルタ・検索対応）
GET    /api/meetings/:id            # 会議詳細
POST   /api/meetings                # 会議作成
PUT    /api/meetings/:id            # 会議更新
DELETE /api/meetings/:id            # 会議削除
POST   /api/meetings/:id/archive    # 会議アーカイブ
POST   /api/meetings/:id/restore    # 会議復元

議事録管理
GET    /api/minutes                 # 議事録一覧（フィルタ・検索対応）
GET    /api/minutes/:id             # 議事録詳細
POST   /api/minutes                 # 議事録作成
PUT    /api/minutes/:id             # 議事録更新
DELETE /api/minutes/:id             # 議事録削除
POST   /api/minutes/ai-format       # AI自動フォーマット

検索
GET    /api/search                  # 統合検索
GET    /api/search/minutes          # 議事録検索
GET    /api/search/meetings         # 会議検索
```

#### ミドルウェア構成
```typescript
1. requestLogger          # リクエストログ
2. cors                   # CORS設定
3. helmet                 # セキュリティヘッダー
4. rateLimit              # レート制限
5. authenticate           # JWT認証
6. authorize              # 権限チェック
7. validateRequest        # リクエストバリデーション
8. errorHandler           # エラーハンドリング
```

### 3. データベース（Data Layer）

#### 主要テーブル設計

```sql
-- ユーザーテーブル
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── name (VARCHAR)
├── role (ENUM: 'admin', 'manager', 'member')
├── department_id (UUID, FK)
├── team_id (UUID, FK)
├── is_active (BOOLEAN)
├── last_login_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- 部門テーブル
departments
├── id (UUID, PK)
├── name (VARCHAR)
├── description (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- チームテーブル
teams
├── id (UUID, PK)
├── department_id (UUID, FK)
├── name (VARCHAR)
├── description (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- 会議テーブル
meetings
├── id (UUID, PK)
├── team_id (UUID, FK)
├── name (VARCHAR)
├── description (TEXT)
├── is_archived (BOOLEAN)
├── archived_at (TIMESTAMP)
├── created_by (UUID, FK)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- 議事録テーブル
minutes
├── id (UUID, PK)
├── meeting_id (UUID, FK)
├── meeting_date (DATE)
├── agenda (TEXT)
├── decisions (TEXT)
├── issues (TEXT)
├── deadline (DATE)
├── assignee (VARCHAR)
├── action_items (TEXT)
├── reason (TEXT)
├── status (ENUM: 'not_started', 'in_progress', 'completed', 'pending', 'cancelled')
├── other_info (TEXT)
├── created_by (UUID, FK)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- 議事録項目テーブル（正規化版・スプレッドシート行）
minute_items
├── id (UUID, PK)
├── minute_id (UUID, FK)
├── row_order (INTEGER)
├── agenda (TEXT)
├── decision (TEXT)
├── issue (TEXT)
├── deadline (DATE)
├── assignee (VARCHAR)
├── action_item (TEXT)
├── reason (TEXT)
├── status (ENUM)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## セキュリティ設計

### 認証・認可フロー

```
1. ログイン
   User → POST /api/auth/login (email, password)
   → Backend: パスワード検証 (bcrypt)
   → JWTトークン生成 (access token, refresh token)
   → Response: { accessToken, refreshToken, user }

2. 認証済みリクエスト
   User → Request with Authorization: Bearer <accessToken>
   → Middleware: JWT検証
   → トークン有効性チェック
   → ユーザー情報をreq.userに設定
   → 次のハンドラへ

3. 権限チェック
   → Middleware: 権限チェック (role, department, team)
   → アクセス可否判定
   → 許可: 次のハンドラへ
   → 拒否: 403 Forbidden
```

### アクセス権限マトリクス

```
役割             | 自部門  | 他部門  | ボード  | ユーザー管理
---------------- | ------- | ------- | ------- | ------------
admin            | 全権限  | 全権限  | 全権限  | 可
manager          | 全権限  | 閲覧    | 閲覧    | 不可（自部門のみ）
member           | 閲覧    | 不可    | 不可    | 不可
retired(退職者)   | 不可    | 不可    | 不可    | 不可
```

## AI統合設計

### GPT-4自動フォーマット処理フロー

```
1. ユーザー入力
   テキストエリアに音声テキスト化済みの議事録を貼り付け

2. AIフォーマットボタン押下
   POST /api/minutes/ai-format
   Body: { text: "生の議事録テキスト" }

3. バックエンド処理
   → OpenAI API呼び出し (GPT-4)
   → プロンプト: 
     "以下の会議議事録テキストから、議題、決定事項、課題、
      期日、担当者、実行内容、理由を抽出し、JSON形式で返してください"
   → レスポンス: 構造化されたJSON

4. データベース保存
   → minute_itemsテーブルに複数行として保存
   → ステータスは'not_started'で初期化

5. フロントエンド表示
   → スプレッドシート形式の表として表示
   → 編集可能な状態
```

### プロンプト設計

```typescript
const MINUTES_FORMAT_PROMPT = `
あなたは会議議事録を構造化するAIアシスタントです。
以下の会議議事録テキストから、下記の項目を抽出してJSON配列形式で返してください。

抽出項目:
- agenda: 議題（何について話し合われたか）
- decision: 決定事項（決まったこと）
- issue: 課題（問題点や懸念事項）
- deadline: 期日（YYYY-MM-DD形式、言及されていない場合はnull）
- assignee: 担当者（名前やチーム名）
- action_item: 実行内容（やるべきこと）
- reason: 理由・背景情報

複数の議題がある場合は、配列の要素として分けてください。
期日が「来週」「月末」などの表現の場合は、具体的な日付に変換してください（今日は${new Date().toISOString().split('T')[0]}です）。

出力形式:
[
  {
    "agenda": "...",
    "decision": "...",
    "issue": "...",
    "deadline": "2024-01-20",
    "assignee": "山田太郎",
    "action_item": "...",
    "reason": "..."
  }
]

議事録テキスト:
`;
```

## パフォーマンス最適化

### フロントエンド最適化
1. **Code Splitting**: React.lazy()による動的インポート
2. **Memoization**: React.memo, useMemo, useCallbackの活用
3. **仮想化**: 大量のリストはreact-windowで仮想化
4. **画像最適化**: WebP形式、遅延ロード
5. **キャッシング**: React Queryによるデータキャッシング

### バックエンド最適化
1. **データベースインデックス**: 頻繁に検索されるカラムにインデックス
2. **クエリ最適化**: N+1問題の回避、適切なJOIN
3. **キャッシング**: Redis（将来的に導入）
4. **ページネーション**: 大量データの分割取得
5. **圧縮**: gzip圧縮

## 監視・ログ設計

### ログレベル
- **ERROR**: エラー発生時（例外、データベースエラー）
- **WARN**: 警告（認証失敗、無効なリクエスト）
- **INFO**: 重要な操作（ログイン、データ作成・更新・削除）
- **DEBUG**: デバッグ情報（開発環境のみ）

### 監視項目
- APIレスポンスタイム
- エラーレート
- データベース接続数
- メモリ使用量
- ディスク使用量

## スケーラビリティ設計

### 水平スケーリング対応
1. ステートレスAPI設計（セッションをJWTで管理）
2. データベース接続プール
3. ロードバランサー対応

### 将来的な拡張性
1. マイクロサービス化の余地
2. キャッシュ層の追加（Redis）
3. CDNの導入
4. ファイルストレージの分離（S3等）
