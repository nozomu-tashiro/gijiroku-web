# セットアップガイド

## 前提条件

以下のソフトウェアがインストールされている必要があります:

- **Node.js** 20以上
- **PostgreSQL** 14以上
- **npm** または **yarn**
- **Git**

## 1. リポジトリのクローン

```bash
git clone <repository-url>
cd webapp
```

## 2. バックエンドのセットアップ

### 2.1 依存関係のインストール

```bash
cd backend
npm install
```

### 2.2 環境変数の設定

`.env.example`ファイルをコピーして`.env`ファイルを作成します:

```bash
cp .env.example .env
```

`.env`ファイルを編集し、以下の値を設定します:

```env
# Environment
NODE_ENV=development

# Server
PORT=3000

# Database
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/meeting_minutes?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-please-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-please-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**重要な設定項目:**

1. **DATABASE_URL**: PostgreSQLデータベースの接続文字列
   - `your_username`: PostgreSQLのユーザー名
   - `your_password`: PostgreSQLのパスワード
   - `meeting_minutes`: データベース名

2. **JWT_SECRET**: JWTトークン署名用の秘密鍵（本番環境では必ず変更）
3. **JWT_REFRESH_SECRET**: リフレッシュトークン用の秘密鍵
4. **OPENAI_API_KEY**: OpenAI APIキー（GPT-4へのアクセスに必要）

### 2.3 PostgreSQLデータベースの作成

PostgreSQLにログインし、データベースを作成します:

```bash
# PostgreSQLにログイン
psql -U postgres

# データベース作成
CREATE DATABASE meeting_minutes;

# データベースに接続
\c meeting_minutes

# UUID拡張を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# 終了
\q
```

### 2.4 Prismaマイグレーションの実行

データベーススキーマを作成します:

```bash
# Prisma Clientを生成
npx prisma generate

# マイグレーションを実行（開発環境）
npx prisma migrate dev --name init
```

### 2.5 初期データの投入

組織階層の初期データを投入します:

```bash
# SQLファイルを直接実行
psql -U your_username -d meeting_minutes -f prisma/seed.sql
```

または、PostgreSQL CLIで:

```bash
psql -U your_username -d meeting_minutes

\i prisma/seed.sql

\q
```

### 2.6 デフォルト管理者ユーザー

初期データ投入後、以下の管理者アカウントでログインできます:

- **Email**: `admin@example.com`
- **Password**: `Admin@123`

**⚠️ 警告**: 本番環境では必ずパスワードを変更してください。

### 2.7 バックエンドサーバーの起動

```bash
# 開発モード（ホットリロード有効）
npm run dev

# 本番ビルド
npm run build
npm start
```

サーバーが正常に起動すると、以下のメッセージが表示されます:

```
[INFO] Database connected successfully
[INFO] Server is running on port 3000
[INFO] Environment: development
[INFO] API URL: http://localhost:3000/api
```

### 2.8 APIの動作確認

#### ヘルスチェック

```bash
curl http://localhost:3000/health
```

レスポンス:
```json
{
  "status": "ok",
  "timestamp": "2024-01-13T10:00:00.000Z",
  "uptime": 123.456
}
```

#### ログイン

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }'
```

## 3. フロントエンドのセットアップ（今後実装）

```bash
cd ../frontend
npm install
npm run dev
```

## 4. Prisma Studioでデータベースを確認

Prisma Studioを使用すると、ブラウザでデータベースを視覚的に確認・編集できます:

```bash
cd backend
npx prisma studio
```

ブラウザで `http://localhost:5555` が開きます。

## トラブルシューティング

### データベース接続エラー

```
Error: P1001: Can't reach database server
```

**解決策:**
1. PostgreSQLが起動しているか確認
   ```bash
   # macOS (Homebrew)
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   
   # Windows
   # PostgreSQLサービスを起動
   ```

2. DATABASE_URLの接続情報が正しいか確認
3. データベース `meeting_minutes` が作成されているか確認

### Prismaマイグレーションエラー

```bash
# マイグレーションをリセット（開発環境のみ）
npx prisma migrate reset

# 再度マイグレーション
npx prisma migrate dev --name init
```

### OpenAI API エラー

```
Error: Invalid API key
```

**解決策:**
1. `.env`ファイルのOPENAI_API_KEYが正しいか確認
2. OpenAIアカウントにクレジットが残っているか確認
3. APIキーの権限を確認

### ポート衝突

```
Error: Port 3000 is already in use
```

**解決策:**
1. `.env`ファイルでPORTを変更（例: `PORT=3001`）
2. または、既存のプロセスを終了
   ```bash
   # プロセスを確認
   lsof -i :3000
   
   # プロセスを終了
   kill -9 <PID>
   ```

## 開発コマンド一覧

### バックエンド

```bash
# 開発サーバー起動（ホットリロード）
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Prisma Client生成
npm run prisma:generate

# マイグレーション実行
npm run prisma:migrate

# Prisma Studio起動
npm run prisma:studio
```

### データベース管理

```bash
# マイグレーション作成
npx prisma migrate dev --name <migration_name>

# マイグレーションを本番環境に適用
npx prisma migrate deploy

# データベースをリセット（開発環境のみ）
npx prisma migrate reset

# Prisma Clientを生成
npx prisma generate

# データベーススキーマを確認
npx prisma db pull
```

## 次のステップ

1. ✅ バックエンドAPI実装完了
2. ⏳ フロントエンド実装
3. ⏳ 検索機能の実装
4. ⏳ テスト作成
5. ⏳ デプロイ設定

## サポート

問題が発生した場合は、以下を確認してください:

1. ログファイル: バックエンドのコンソール出力
2. Prisma Studio: データベースの状態を確認
3. API仕様書: `docs/API.md` を参照
4. データベース設計書: `docs/DATABASE.md` を参照
