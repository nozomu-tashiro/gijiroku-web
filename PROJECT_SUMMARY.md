# 会議議事録管理システム - プロジェクトサマリー

## 📋 プロジェクト概要

企業内の各部署・チームの会議議事録を一元管理し、AI自動フォーマット機能と3階層ツリー構造での組織管理に対応したフルスタックWebアプリケーション。

## ✅ 実装完了機能

### 1. プロジェクト設計 ✅
- 完全なアーキテクチャ設計書（ARCHITECTURE.md）
- データベース設計書（DATABASE.md）
- API仕様書（API.md）
- セットアップガイド（SETUP.md）

### 2. バックエンドAPI ✅
- **認証システム**
  - JWT認証（アクセストークン + リフレッシュトークン）
  - bcryptによるパスワードハッシュ化
  - 役割ベースアクセス制御（admin, manager, member）
  
- **組織階層管理API**
  - ボード（経営層）情報取得
  - 部門CRUD操作
  - チームCRUD操作
  - 3階層ツリー構造サポート
  
- **会議管理API**
  - 会議CRUD操作
  - アーカイブ/復元機能
  - チーム別フィルタリング
  
- **議事録管理API**
  - 議事録CRUD操作
  - AI自動フォーマット機能（GPT-4統合）
  - 議事録項目（スプレッドシート形式）管理
  - ステータス管理（未着手、進行中、完了、保留、中止）
  
- **セキュリティ機能**
  - Helmetによるセキュリティヘッダー
  - CORS設定
  - レート制限
  - 入力バリデーション
  - エラーハンドリング

### 3. データベース ✅
- PostgreSQL + Prisma ORM
- 完全なスキーマ定義（7テーブル）
  - users（ユーザー）
  - departments（部門）
  - teams（チーム）
  - meetings（会議）
  - minutes（議事録）
  - minute_items（議事録項目）
  - access_logs（アクセスログ）
- 初期データ投入SQL
- インデックス最適化

### 4. AI自動フォーマット機能 ✅
- OpenAI GPT-4統合
- 音声テキストから構造化データへの自動変換
- 以下の項目を自動抽出：
  - 議題
  - 決定事項
  - 課題
  - 期日（相対表現→具体的日付に変換）
  - 担当者
  - 実行内容
  - 理由・背景情報

### 5. フロントエンド ✅
- React 18 + TypeScript + Vite
- Tailwind CSS スタイリング
- React Router DOM（ルーティング）
- Zustand（状態管理）
- React Query（データフェッチング）
- ログインページ実装
- ダッシュボードページ実装
- 自動トークンリフレッシュ機能
- 保護されたルート

## 📁 プロジェクト構造

```
webapp/
├── backend/                      # Node.js + Express バックエンド
│   ├── src/
│   │   ├── controllers/          # リクエストハンドラ
│   │   ├── routes/               # APIルート
│   │   │   ├── auth.ts           # 認証API
│   │   │   ├── organization.ts   # 組織階層API
│   │   │   ├── meetings.ts       # 会議管理API
│   │   │   └── minutes.ts        # 議事録管理API
│   │   ├── services/             # ビジネスロジック
│   │   │   ├── authService.ts    # 認証サービス
│   │   │   ├── aiService.ts      # AI自動フォーマット
│   │   │   ├── organizationService.ts
│   │   │   ├── meetingService.ts
│   │   │   └── minutesService.ts
│   │   ├── middleware/           # ミドルウェア
│   │   ├── utils/                # ユーティリティ
│   │   └── server.ts             # サーバーエントリーポイント
│   └── prisma/
│       ├── schema.prisma         # データベーススキーマ
│       └── seed.sql              # 初期データ
│
├── frontend/                     # React フロントエンド
│   ├── src/
│   │   ├── components/           # UIコンポーネント
│   │   ├── pages/                # ページコンポーネント
│   │   │   ├── LoginPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── services/             # API通信サービス
│   │   │   ├── api.ts
│   │   │   └── authService.ts
│   │   ├── stores/               # Zustand状態管理
│   │   │   └── authStore.ts
│   │   ├── types/                # TypeScript型定義
│   │   └── App.tsx               # メインアプリケーション
│   └── tailwind.config.js
│
└── docs/                         # ドキュメント
    ├── ARCHITECTURE.md           # アーキテクチャ設計書
    ├── DATABASE.md               # データベース設計書
    ├── API.md                    # API仕様書
    └── SETUP.md                  # セットアップガイド
```

## 🚀 セットアップ手順

### 前提条件
- Node.js 20+
- PostgreSQL 14+
- OpenAI APIキー

### 1. バックエンド

```bash
cd backend
npm install

# 環境変数設定
cp .env.example .env
# .envファイルを編集（DATABASE_URL, JWT_SECRET, OPENAI_API_KEY）

# データベース作成
createdb meeting_minutes

# Prismaマイグレーション
npx prisma generate
npx prisma migrate dev --name init

# 初期データ投入
psql -d meeting_minutes -f prisma/seed.sql

# サーバー起動
npm run dev
```

### 2. フロントエンド

```bash
cd frontend
npm install

# 環境変数設定
cp .env.example .env

# 開発サーバー起動
npm run dev
```

### 3. アクセス
- **バックエンド**: http://localhost:3000/api
- **フロントエンド**: http://localhost:5173
- **デモアカウント**: admin@example.com / Admin@123

## 🎯 主要技術スタック

### バックエンド
- Node.js 20+
- Express.js + TypeScript
- PostgreSQL + Prisma ORM
- OpenAI API (GPT-4)
- JWT認証
- bcrypt

### フロントエンド
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Zustand (状態管理)
- React Query (データフェッチング)
- Axios

## 📊 データベース概要

### 組織階層
```
ボード（経営層）
├── 部門1（営業部）
│   ├── チーム1（東日本）
│   └── チーム2（西日本）
├── 部門2（債権管理部）
│   ├── チーム1（コンサルティングデスク）
│   ├── チーム2（エリア担当東①）
│   └── ...
├── 部門3（審査契約管理部）
│   ├── チーム1（審査）
│   ├── チーム2（契約管理）
│   └── チーム3（国際チーム）
├── 部門4（システム部）
└── 部門5（人事管理部）
    ├── チーム1（経理）
    ├── チーム2（人事）
    └── チーム3（管理）
```

### 主要テーブル
1. **users** - ユーザー情報
2. **departments** - 部門情報
3. **teams** - チーム情報
4. **meetings** - 会議情報
5. **minutes** - 議事録ヘッダー
6. **minute_items** - 議事録項目（スプレッドシート形式）
7. **access_logs** - アクセスログ（監査用）

## 🔒 セキュリティ機能

- JWT認証（アクセストークン + リフレッシュトークン）
- bcryptパスワードハッシュ化
- 役割ベースアクセス制御
- レート制限（100リクエスト/分）
- Helmetセキュリティヘッダー
- CORS設定
- 入力バリデーション

## 📝 API エンドポイント概要

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/refresh` - トークンリフレッシュ
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報

### 組織階層
- `GET /api/organization/board` - ボード情報
- `GET /api/departments` - 部門一覧
- `GET /api/departments/:id` - 部門詳細
- `GET /api/teams` - チーム一覧
- `GET /api/teams/:id` - チーム詳細

### 会議管理
- `GET /api/meetings` - 会議一覧
- `POST /api/meetings` - 会議作成
- `PUT /api/meetings/:id` - 会議更新
- `DELETE /api/meetings/:id` - 会議削除
- `POST /api/meetings/:id/archive` - アーカイブ
- `POST /api/meetings/:id/restore` - 復元

### 議事録管理
- `GET /api/minutes` - 議事録一覧
- `POST /api/minutes` - 議事録作成
- `POST /api/minutes/ai-format` - AI自動フォーマット
- `PUT /api/minutes/:id` - 議事録更新
- `DELETE /api/minutes/:id` - 議事録削除
- `PUT /api/minutes/items/:itemId` - 項目更新

## 🎨 UI/UX

- **レスポンシブデザイン**: デスクトップ、タブレット、スマートフォン対応
- **Tailwind CSS**: 一貫したデザインシステム
- **保護されたルート**: 未認証ユーザーを自動的にログインページへリダイレクト
- **自動トークンリフレッシュ**: シームレスな認証体験

## 🔄 今後の拡張予定

1. **検索・フィルタリング機能**
   - 全文検索
   - 高度なフィルタ
   - ファセット検索

2. **UIコンポーネント拡充**
   - 組織階層ツリービュー
   - 会議一覧・詳細画面
   - 議事録スプレッドシート表示
   - AI自動フォーマット入力画面

3. **追加機能**
   - ファイル添付
   - 通知機能
   - リアルタイム更新（WebSocket）
   - エクスポート機能（PDF, Excel）

4. **テストとデプロイ**
   - 単体テスト（Jest）
   - E2Eテスト（Playwright）
   - CI/CD パイプライン
   - Docker化

## 📚 ドキュメント

- **README.md** - プロジェクト概要
- **docs/ARCHITECTURE.md** - アーキテクチャ設計書
- **docs/DATABASE.md** - データベース設計書
- **docs/API.md** - API仕様書
- **docs/SETUP.md** - セットアップガイド

## 💡 使用方法

1. システムにログイン（admin@example.com / Admin@123）
2. ダッシュボードで組織階層を確認
3. 部門→チーム→会議の順に選択
4. 新規議事録を作成
5. テキスト入力 or AI自動フォーマット
6. 議事録をスプレッドシート形式で管理

## 👥 対象ユーザー

- **管理者（admin）**: 全機能アクセス、組織管理、ユーザー管理
- **マネージャー（manager）**: 自部門の会議・議事録管理
- **メンバー（member）**: 自チームの会議・議事録閲覧

## 🎉 まとめ

このプロジェクトは、企業の会議議事録管理を効率化するための包括的なWebアプリケーションです。AI自動フォーマット機能により、手間のかかる議事録作成作業を大幅に削減し、組織全体での情報共有を促進します。

**実装完了率**: 約70%（コア機能完了、UI拡充・検索機能は今後実装）
