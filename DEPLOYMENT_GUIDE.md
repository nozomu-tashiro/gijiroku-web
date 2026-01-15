# 会議議事録管理システム - Cloudflare Pagesデプロイガイド

## 🚀 デプロイ手順

### 1. Cloudflare Pagesプロジェクトの作成

1. **Cloudflare ダッシュボードにアクセス**
   - https://dash.cloudflare.com/
   - ログインしてください

2. **Workers & Pages に移動**
   - 左メニューから「Workers & Pages」をクリック
   - 「Create application」をクリック
   - 「Pages」タブを選択

3. **GitHubリポジトリと連携**
   - 「Connect to Git」をクリック
   - GitHubアカウントで認証
   - リポジトリ「gijiroku-web」を選択

4. **ビルド設定**
   ```
   Framework preset: None
   Build command: (空白)
   Build output directory: .
   Root directory: (空白)
   ```

5. **プロジェクト名**
   ```
   minutes-app
   ```
   または好きな名前を設定

### 2. 環境変数の設定

プロジェクト作成後、環境変数を設定します：

1. **Settings タブに移動**
2. **Environment Variables** セクション
3. 以下の環境変数を追加：

   | Variable Name | Value |
   |--------------|-------|
   | `GENSPARK_TOKEN` | あなたのGenSpark APIキー |
   | `OPENAI_API_KEY` | (オプション) OpenAI APIキー |

4. **Production** 環境に設定

### 3. デプロイ実行

1. **Save and Deploy** をクリック
2. デプロイが完了するまで待機（1-3分）
3. デプロイ完了後、URLが表示されます
   ```
   https://minutes-app.pages.dev
   ```
   ※ プロジェクト名によって変わります

### 4. カスタムドメインの設定（オプション）

独自ドメインを使用する場合：

1. **Custom domains** タブに移動
2. **Set up a custom domain** をクリック
3. ドメインを入力（例：`minutes.yourcompany.com`）
4. DNS設定の指示に従う

## 🔧 ローカル開発環境

### 前提条件
- Node.js 20.x以上

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/nozomu-tashiro/gijiroku-web.git
cd gijiroku-web

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm start
```

開発サーバー: http://localhost:8080

### 環境変数の設定（ローカル）

```bash
export GENSPARK_TOKEN="your-api-key-here"
```

または、`~/.genspark_llm.yaml` ファイルを作成：

```yaml
api_key: "your-api-key-here"
base_url: "https://www.genspark.ai/api/llm_proxy/v1"
```

## 📝 使い方

### ログイン情報（デモ）

```
Email: admin@example.com
Password: Admin@123
```

### 主な機能

1. **会議管理**
   - 会議の追加・編集・削除
   - 組織階層（ボード/部門/チーム）での管理

2. **議事録管理**
   - 議事録の追加・編集・削除
   - Google Sheets風の編集可能テーブル
   - 行の追加・削除

3. **AI解析機能**
   - テキストファイルアップロード（.txt, .docx）
   - 直接テキスト入力
   - 自動構造化（議題、アクション、担当者、期限など）
   - フォールバック機能（APIエラー時の簡易パーサー）

4. **ファイル添付**
   - PDF、Word、Excel、画像など
   - ファイルプレビュー機能

5. **エクスポート機能**
   - PDF、Word、Excel、CSV、TXT形式

6. **データ永続化**
   - LocalStorageによる自動保存
   - ページリロード後もデータ保持

## 🔐 セキュリティ

### APIキーの管理

- **本番環境**: Cloudflare Pagesの環境変数に設定
- **開発環境**: 環境変数または設定ファイルに保存
- **注意**: APIキーをGitにコミットしないこと

### データ保存

- すべてのデータはブラウザのLocalStorageに保存
- サーバーにはデータを送信しない
- ユーザーごとに独立したデータ管理

## 🛠️ トラブルシューティング

### AI解析が動作しない

1. **環境変数の確認**
   ```bash
   # ローカル
   echo $GENSPARK_TOKEN
   
   # Cloudflare Pages
   Settings > Environment Variables を確認
   ```

2. **APIキーの有効性確認**
   - GenSparkダッシュボードでAPIキーを確認
   - 必要に応じて新しいAPIキーを生成

3. **フォールバック機能**
   - APIエラー時、簡易パーサーが自動的に動作
   - 基本的なテキスト解析は継続可能

### デプロイエラー

1. **ビルドログの確認**
   - Cloudflare Pagesのデプロイログを確認
   - エラーメッセージを確認

2. **ファイル構造の確認**
   ```bash
   # 必須ファイル
   - index.html
   - wrangler.toml
   - functions/
     - load-openai-config.js
     - api/openai/chat/completions.js
   ```

## 📞 サポート

問題が発生した場合：

1. [GitHub Issues](https://github.com/nozomu-tashiro/gijiroku-web/issues)
2. デプロイログを確認
3. ブラウザのコンソールログを確認（F12 → Console）

## 🎯 次のステップ

- [ ] Cloudflare Pagesプロジェクトを作成
- [ ] 環境変数を設定
- [ ] デプロイを実行
- [ ] URLを社員と共有
- [ ] カスタムドメインを設定（オプション）
- [ ] 使い方マニュアルを社内展開

---

**リポジトリ**: https://github.com/nozomu-tashiro/gijiroku-web
**デプロイ先**: Cloudflare Pages
