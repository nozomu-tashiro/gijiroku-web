# 会議議事録管理システム (Meeting Minutes Management System)

## プロジェクト概要

企業内の各部署・チームの会議議事録を一元管理し、テキスト入力からAI自動フォーマット化、3階層ツリー構造での組織管理に対応するWebアプリケーション

## 主要機能

### 1. 組織階層管理
- **階層1: ボード（経営層）**
- **階層2: 部門（5部門）**
  - 営業部（営業債権管理部）
  - 債権管理部（営業債権管理部）
  - 審査契約管理部
  - システム部
  - 人事管理部
- **階層3: チーム**
  - 営業部: 東日本、西日本
  - 債権管理部: コンサルティングデスク、エリア担当東①、エリア担当東②、エリア担当西①、エリア担当西②、法務、求償、サポートデスク通常事務チーム、サポートデスク保証実行チーム
  - 審査契約管理部: 審査、契約管理、国際チーム
  - 人事管理部: 経理、人事、管理
  - システム部: （別途指定）

### 2. AI自動フォーマット機能
- GPT-4を活用した議事録テキストの自動構造化
- 以下の項目を自動抽出:
  - 議題
  - 決定事項
  - 課題
  - 期日（期限）
  - 担当者
  - 実行内容
  - 理由・背景情報
  - その他の関連情報

### 3. 会議・議事録管理
- 会議の追加・削除・アーカイブ
- 日付ごとの議事録管理
- スプレッドシート形式での表示・編集

### 4. 検索・フィルタリング
- キーワード検索
- 日付範囲検索
- 部門・チーム別フィルタリング
- 担当者別フィルタリング
- ステータス検索

### 5. セキュリティ・認証
- ユーザー認証（JWT）
- 部署・チーム別アクセス権限管理
- 退職者の自動閲覧制限
- データ暗号化

### 6. レスポンシブデザイン
- デスクトップ対応
- スマートフォン対応
- タブレット対応

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- React Router
- Axios

### バックエンド
- Node.js 20+
- Express + TypeScript
- PostgreSQL
- Prisma ORM
- JWT認証
- bcrypt
- OpenAI API (GPT-4)

## プロジェクト構造

```
webapp/
├── frontend/                 # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/       # UIコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── services/        # API通信サービス
│   │   ├── stores/          # 状態管理
│   │   ├── types/           # TypeScript型定義
│   │   ├── utils/           # ユーティリティ関数
│   │   └── App.tsx          # メインアプリケーション
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                  # バックエンドAPI
│   ├── src/
│   │   ├── controllers/     # リクエストハンドラ
│   │   ├── routes/          # APIルート定義
│   │   ├── services/        # ビジネスロジック
│   │   ├── middleware/      # ミドルウェア
│   │   ├── models/          # データモデル
│   │   ├── utils/           # ユーティリティ関数
│   │   └── server.ts        # サーバーエントリーポイント
│   ├── prisma/
│   │   └── schema.prisma    # データベーススキーマ
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/                     # ドキュメント
│   ├── ARCHITECTURE.md       # アーキテクチャ設計書
│   ├── DATABASE.md           # データベース設計書
│   ├── API.md                # API仕様書
│   └── DEPLOYMENT.md         # デプロイメント手順
│
└── README.md                 # このファイル
```

## セットアップ手順

### 前提条件
- Node.js 20以上
- PostgreSQL 14以上
- OpenAI APIキー

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd webapp
```

### 2. バックエンドのセットアップ
```bash
cd backend
npm install
cp .env.example .env
# .envファイルを編集してデータベース接続情報とOpenAI APIキーを設定
npx prisma migrate dev
npx prisma generate
npm run dev
```

### 3. フロントエンドのセットアップ
```bash
cd frontend
npm install
npm run dev
```

### 4. アクセス
- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3000

## 開発ガイドライン

### コーディング規約
- TypeScriptの厳格モード有効化
- ESLintとPrettierの使用
- コンポーネントの単一責任原則
- 再利用可能なコンポーネント設計

### Git ワークフロー
- mainブランチは保護
- 機能開発はfeatureブランチで実施
- プルリクエスト必須
- コードレビュー後にマージ

### テスト方針
- 単体テスト: Jest
- E2Eテスト: Playwright
- APIテスト: Supertest

## ライセンス

Private/Internal Use Only

## 作成者

Created for enterprise meeting minutes management
