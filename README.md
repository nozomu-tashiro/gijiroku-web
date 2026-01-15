# 会議議事録管理システム (Meeting Minutes Management System)

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-orange?logo=cloudflare)](https://dash.cloudflare.com/)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org/)

## 🎯 プロジェクト概要

企業内の各部署・チームの会議議事録を一元管理し、**AI自動解析**によるテキストの構造化、3階層ツリー構造での組織管理に対応したモダンなWebアプリケーション。

**現在稼働中**: LocalStorageベースの完全フロントエンドアプリケーションとして実装済み。Cloudflare Pagesでの展開が可能です。

### 🌟 主な特徴

- ✨ **AI自動解析**: OpenAI API (GPT-5)による議事録の自動構造化
- 📊 **Google Sheets風UI**: 直感的な編集可能テーブル
- 📎 **ファイル添付**: PDF、Word、Excel等のファイル管理
- 📥 **多形式エクスポート**: PDF/Word/Excel/CSV/TXT対応
- 💾 **データ永続化**: LocalStorageによる自動保存
- 🔐 **シンプル認証**: クライアントサイド認証
- 🚀 **高速デプロイ**: Cloudflare Pagesで即座に公開可能

## 🚀 クイックスタート

### デプロイ（推奨）

**Cloudflare Pagesへのデプロイ手順**: [`CLOUDFLARE_DEPLOYMENT.md`](CLOUDFLARE_DEPLOYMENT.md) を参照

1. GitHubリポジトリと連携
2. 環境変数 `GENSPARK_TOKEN` を設定
3. 自動デプロイ完了
4. 社員全員で利用開始！

### ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/nozomu-tashiro/gijiroku-web.git
cd gijiroku-web

# 依存関係をインストール
npm install

# 環境変数を設定
export GENSPARK_TOKEN="your-api-key-here"

# 開発サーバーを起動
npm start
```

**アクセス**: http://localhost:8080

**ログイン情報（デモ）**:
- Email: `admin@example.com`
- Password: `Admin@123`

## 📖 ドキュメント

- 📘 [Cloudflare Pagesデプロイガイド](CLOUDFLARE_DEPLOYMENT.md) - 完全なデプロイ手順
- 📙 [一般デプロイガイド](DEPLOYMENT_GUIDE.md) - その他のデプロイオプション
- 📗 [ユーザーガイド](USER_GUIDE.md) - 使い方マニュアル
- 📕 [プロジェクトサマリー](PROJECT_SUMMARY.md) - 技術詳細

## ✨ 主要機能

### 🤖 AI自動解析（NEW!）
- **テキストファイルアップロード**: .txt, .docx対応
- **直接入力**: テキストエリアに貼り付け
- **自動構造化**: 議題、アクション、担当者、期限を自動抽出
- **フォールバック機能**: APIエラー時も簡易パーサーで動作継続

### 📋 議事録管理
- **Google Sheets風テーブル**: 編集可能なセル
- **行の追加・削除**: リアルタイム編集
- **ステータス管理**: 未着手/進行中/完了/期限超過
- **データ永続化**: LocalStorageで自動保存

### 📎 ファイル管理
- **複数ファイル添付**: PDF、Word、Excel、画像等
- **ファイルプレビュー**: PDFや画像をブラウザで表示
- **ダウンロード機能**: すべてのファイル形式に対応

### 📥 エクスポート機能
- **PDF**: 印刷可能なフォーマット（ブラウザ印刷）
- **Word**: HTML形式で.doc出力
- **Excel**: CSV形式で表計算ソフト対応
- **CSV**: 汎用データ形式
- **TXT**: プレーンテキスト

### 🏢 組織階層管理
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

### 🔍 検索・フィルタリング
- キーワード検索
- 日付範囲検索
- 部門・チーム別フィルタリング
- 担当者別フィルタリング
- ステータス検索

### 🔐 認証・セキュリティ
- シンプルなクライアントサイド認証
- LocalStorageでのデータ管理
- HTTPSによる通信暗号化（Cloudflare経由）

### 📱 レスポンシブデザイン
- デスクトップ対応
- タブレット対応
- スマートフォン対応

## 🛠️ 技術スタック

### 現在の実装（Production Ready）
- **フロントエンド**: Pure JavaScript（バニラJS）
- **UI**: HTML5 + CSS3（モダンCSS Grid/Flexbox）
- **データ保存**: LocalStorage API
- **AI統合**: OpenAI API (GPT-5) + GenSparkプロキシ
- **デプロイ**: Cloudflare Pages + Cloudflare Functions
- **ファイル処理**: FileReader API, Blob API

### 将来の拡張オプション（参考）
以下のディレクトリには、将来的なフルスタック実装のサンプルコードがあります：

#### フロントエンド（参考実装）
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query
- Zustand
- React Router
- Axios

### バックエンド

#### バックエンド（参考実装）
- Node.js 20+
- Express + TypeScript
- PostgreSQL
- Prisma ORM
- JWT認証
- bcrypt
- OpenAI API (GPT-4)

## 📁 プロジェクト構造

```
webapp/
├── index.html                    # メインアプリケーション（Production）
├── minutes-app-enhanced.html     # 最新版HTMLファイル
├── server.js                     # Node.js開発サーバー + OpenAI プロキシ
├── wrangler.toml                 # Cloudflare Pages設定
├── package.json                  # Node.js依存関係
│
├── functions/                    # Cloudflare Functions
│   ├── load-openai-config.js    # API設定エンドポイント
│   └── api/openai/chat/
│       └── completions.js       # OpenAI APIプロキシ
│
├── frontend/                     # 参考実装（React版）
│   ├── src/
│   │   ├── components/          # UIコンポーネント
│   │   ├── pages/              # ページコンポーネント
│   │   ├── hooks/              # カスタムフック
│   │   ├── services/           # API通信サービス
│   │   ├── stores/             # 状態管理
│   │   ├── types/              # TypeScript型定義
│   │   ├── utils/              # ユーティリティ関数
│   │   └── App.tsx             # メインアプリケーション
│   └── ...
│
├── backend/                      # 参考実装（Express版）
│   ├── src/
│   │   ├── controllers/         # リクエストハンドラ
│   │   ├── routes/             # APIルート定義
│   │   ├── services/           # ビジネスロジック
│   │   └── ...
│   └── ...
│
├── docs/                         # ドキュメント
│   ├── ARCHITECTURE.md          # アーキテクチャ設計書
│   ├── DATABASE.md              # データベース設計書
│   └── ...
│
├── CLOUDFLARE_DEPLOYMENT.md      # Cloudflareデプロイガイド ★重要
├── DEPLOYMENT_GUIDE.md           # 一般デプロイガイド
├── USER_GUIDE.md                 # ユーザーマニュアル
└── README.md                     # このファイル
```

## 🎮 使い方

### 1. ログイン
```
Email: admin@example.com
Password: Admin@123
```

### 2. 会議を追加
1. 「👔 経営（ボード）」または他のセクションをクリック
2. 「+ 会議名称追加」ボタンをクリック
3. 会議名を入力して保存

### 3. 議事録を追加
1. 会議の「📋 詳細」ボタンをクリック
2. 「+ 議事録を追加」ボタンをクリック
3. フォームに入力して保存

### 4. AI解析で自動取り込み ✨
1. 議事録の「📋 詳細」ボタンをクリック
2. 「🤖 AI解析」ボタンをクリック
3. テキストファイルをアップロードまたは直接入力
4. 「AI解析開始」をクリック
5. 自動的にテーブルに構造化データが追加されます！

### 5. 手動編集
1. セルを直接クリックして編集
2. 「+ 行を追加」で新しい行を追加
3. 「💾 保存」ボタンで保存

### 6. ファイル添付
1. 「📎 ファイルを追加」ボタンをクリック
2. ファイルを選択（PDF/Word/Excel等）
3. ファイル名をクリックでプレビュー/ダウンロード

### 7. エクスポート
1. 「📥 エクスポート」ドロップダウンをクリック
2. 形式を選択（PDF/Word/Excel/CSV/TXT）
3. 自動的にダウンロード開始

## 🔧 設定

### GenSpark APIキーの取得

1. **GenSparkダッシュボードにアクセス**
   ```
   https://www.genspark.ai/dashboard
   ```

2. **API Keysタブに移動**

3. **新しいAPIキーを生成**
   - 「Generate New API Key」をクリック
   - 用途を入力（例：議事録管理システム）
   - APIキーをコピー

4. **環境変数に設定**
   
   **ローカル開発**:
   ```bash
   export GENSPARK_TOKEN="your-api-key-here"
   ```
   
   **Cloudflare Pages**:
   - Settings > Environment variables
   - Variable name: `GENSPARK_TOKEN`
   - Value: あなたのAPIキー
   - Environment: Production

## 🚀 デプロイ

### Cloudflare Pages（推奨）

詳細な手順は [`CLOUDFLARE_DEPLOYMENT.md`](CLOUDFLARE_DEPLOYMENT.md) を参照してください。

**簡易手順**:

1. **Cloudflareダッシュボード**にアクセス
   ```
   https://dash.cloudflare.com/
   ```

2. **Workers & Pages** → **Create application** → **Pages**

3. **GitHubと連携**
   - リポジトリ: `nozomu-tashiro/gijiroku-web`
   - Production branch: `main`

4. **ビルド設定**
   ```
   Framework preset: None
   Build command: (空白)
   Build output directory: .
   ```

5. **環境変数を追加**
   ```
   GENSPARK_TOKEN = your-api-key-here
   ```

6. **Save and Deploy**

7. **完成！** 🎉
   ```
   https://minutes-app.pages.dev
   ```

### その他のデプロイオプション

- **GitHub Pages**: 静的サイトホスティング
- **Vercel**: 自動デプロイ対応
- **Netlify**: ビルド・デプロイ自動化
- **社内サーバー**: 完全プライベート環境

詳細は [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) を参照。

## 🧪 開発

### ローカル開発サーバー

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動（Node.js）
npm start
# または
node server.js
```

**アクセス**: http://localhost:8080

### コードの変更

1. **ファイルを編集**
   - `index.html` または `minutes-app-enhanced.html`

2. **変更をコミット**
   ```bash
   git add .
   git commit -m "feat: 新機能を追加"
   ```

3. **GitHubにpush**
   ```bash
   git push origin main
   ```

4. **自動デプロイ**
   - Cloudflare Pagesが自動検知
   - 1-3分で本番環境に反映

## 🐛 トラブルシューティング

### AI解析が動作しない

**症状**: 「Failed to fetch」エラー

**解決策**:
1. 環境変数を確認
   ```bash
   echo $GENSPARK_TOKEN
   ```
2. APIキーの有効性を確認
3. Cloudflareの環境変数を確認
4. フォールバック機能が自動的に動作（簡易パーサー）

### ファイルが保存されない

**症状**: ページをリロードするとデータが消える

**解決策**:
1. ブラウザのLocalStorageが有効か確認
2. プライベートブラウジングモードを使用していないか確認
3. ブラウザのストレージ容量を確認

### PDFが開けない

**症状**: PDFファイルをクリックしても表示されない

**解決策**:
- すでに修正済み（Blob URL経由で表示）
- ファイルサイズが大きすぎる場合はダウンロード

## 📊 パフォーマンス

- **初回ロード**: < 1秒
- **AI解析**: 15-30秒（OpenAI API依存）
- **ファイルアップロード**: リアルタイム（LocalStorage）
- **データ保存**: 即座（LocalStorage）

## 🔒 セキュリティ

- **HTTPS**: Cloudflare経由で標準提供
- **API キー**: 環境変数で管理、フロントエンドに露出しない
- **データ保存**: ブラウザのLocalStorageのみ
- **サーバー送信**: なし（完全クライアントサイド）

## 🤝 コントリビューション

社内プロジェクトのため、コントリビューションは社員のみ可能です。

### 開発フロー

1. Issueを作成
2. Featureブランチを作成
3. 変更を実装
4. プルリクエストを作成
5. コードレビュー
6. mainにマージ

## 📜 ライセンス

Private/Internal Use Only

## 🙏 謝辞

- **OpenAI**: GPT-5 API提供
- **GenSpark**: AIプロキシサービス
- **Cloudflare**: Pages & Functions ホスティング

## 📞 サポート

**リポジトリ**: https://github.com/nozomu-tashiro/gijiroku-web

**Issue報告**: https://github.com/nozomu-tashiro/gijiroku-web/issues

**ドキュメント**:
- [Cloudflareデプロイガイド](CLOUDFLARE_DEPLOYMENT.md)
- [一般デプロイガイド](DEPLOYMENT_GUIDE.md)
- [ユーザーマニュアル](USER_GUIDE.md)

---

**作成者**: nozomu-tashiro  
**最終更新**: 2026-01-15  
**バージョン**: 2.0.0 (AI解析機能統合版)
