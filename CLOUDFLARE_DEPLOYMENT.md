# 🚀 Cloudflare Pagesへのデプロイ - ステップバイステップガイド

## ✅ 準備完了項目

- ✅ GitHubリポジトリ作成: https://github.com/nozomu-tashiro/gijiroku-web
- ✅ コードをpush済み
- ✅ `wrangler.toml` 設定完了
- ✅ `index.html` エントリーポイント作成
- ✅ Cloudflare Functions 実装済み
  - `/load-openai-config` - APIキー設定取得
  - `/api/openai/chat/completions` - OpenAI APIプロキシ

## 📋 デプロイ手順

### ステップ1: Cloudflareダッシュボードにアクセス

1. **Cloudflareにログイン**
   ```
   https://dash.cloudflare.com/
   ```

2. **Workers & Pages セクションに移動**
   - 左メニューから「Workers & Pages」をクリック

### ステップ2: 新しいプロジェクトを作成

1. **「Create application」ボタンをクリック**

2. **「Pages」タブを選択**

3. **「Connect to Git」を選択**

### ステップ3: GitHubと連携

1. **GitHubアカウントで認証**
   - 必要に応じてGitHub認証を実施

2. **リポジトリを選択**
   ```
   nozomu-tashiro/gijiroku-web
   ```

3. **「Begin setup」をクリック**

### ステップ4: ビルド設定

以下の設定を入力してください：

| 設定項目 | 値 |
|---------|---|
| **Project name** | `minutes-app` (または任意の名前) |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | (空白) |
| **Build output directory** | `.` (ピリオド) |
| **Root directory** | (空白) |

### ステップ5: 環境変数の設定

**重要**: デプロイ前に環境変数を設定する必要があります。

1. **「Environment variables (advanced)」を展開**

2. **以下の変数を追加**:

   **変数1: GENSPARK_TOKEN**
   ```
   Variable name: GENSPARK_TOKEN
   Value: [あなたのGenSpark APIキー]
   ```

   **変数2: OPENAI_API_KEY** (オプション)
   ```
   Variable name: OPENAI_API_KEY
   Value: [あなたのOpenAI APIキー]
   ```

3. **Environment** を「Production」に設定

### ステップ6: デプロイ実行

1. **「Save and Deploy」ボタンをクリック**

2. **デプロイプロセスを監視**
   - ビルドログが表示されます
   - 通常1-3分で完了

3. **デプロイ完了を確認**
   - ✅ Success! と表示されます
   - 自動的に生成されたURLが表示されます

### ステップ7: デプロイ完了後の確認

1. **公開URLにアクセス**
   ```
   https://minutes-app.pages.dev
   ```
   ※ プロジェクト名によってURLは異なります

2. **ログインテスト**
   ```
   Email: admin@example.com
   Password: Admin@123
   ```

3. **AI解析機能のテスト**
   - 会議を追加
   - 議事録を追加
   - 「AI解析」ボタンをクリック
   - サンプルテキストを貼り付けて実行

## 🔧 環境変数の追加・変更（デプロイ後）

デプロイ後に環境変数を追加・変更する場合：

1. **プロジェクトページに移動**
   - Workers & Pages > minutes-app

2. **「Settings」タブをクリック**

3. **「Environment variables」セクション**

4. **「Add variable」をクリック**
   - Variable name: `GENSPARK_TOKEN`
   - Value: あなたのAPIキー
   - Environment: Production

5. **「Deploy site」をクリック**
   - 設定変更を反映するため再デプロイ

## 🌐 カスタムドメインの設定

独自ドメインを使用する場合：

### オプションA: Cloudflareで管理されているドメイン

1. **「Custom domains」タブに移動**

2. **「Set up a custom domain」をクリック**

3. **ドメインを入力**
   ```
   minutes.yourcompany.com
   ```

4. **「Continue」をクリック**
   - Cloudflareが自動的にDNSレコードを設定

### オプションB: 外部ドメイン

1. **「Custom domains」タブに移動**

2. **「Set up a custom domain」をクリック**

3. **ドメインを入力**

4. **DNSレコードを手動で設定**
   - タイプ: CNAME
   - 名前: minutes (またはサブドメイン)
   - ターゲット: minutes-app.pages.dev

## 🔐 セキュリティのベストプラクティス

### APIキーの管理

1. **GenSpark APIキーの取得**
   ```
   https://www.genspark.ai/dashboard
   → API Keys タブ
   → Generate New API Key
   ```

2. **定期的なキーローテーション**
   - 3-6ヶ月ごとにAPIキーを再生成
   - Cloudflareの環境変数を更新

3. **アクセス制限**
   - 必要最小限の権限のみ付与

### データ保護

- すべてのデータはLocalStorage（ブラウザ）に保存
- サーバーにはデータを送信しない
- HTTPSで暗号化された通信

## 📊 監視とログ

### デプロイログの確認

1. **Deploymentsタブ**
   - 各デプロイの履歴
   - ビルドログ
   - ステータス

### リアルタイムログ

1. **「Real-time logs」を有効化**
   - Settings > Functions
   - Enable logging

2. **ログストリームの確認**
   - リクエスト/レスポンス
   - エラーメッセージ
   - パフォーマンス指標

## 🚨 トラブルシューティング

### デプロイエラー

**症状**: デプロイが失敗する

**解決策**:
1. ビルドログを確認
2. ファイル構造を確認
   ```bash
   # 必須ファイル
   - index.html
   - wrangler.toml
   - functions/load-openai-config.js
   - functions/api/openai/chat/completions.js
   ```
3. GitHubリポジトリを確認

### AI解析が動作しない

**症状**: 「Failed to fetch」エラー

**解決策**:
1. 環境変数を確認
   - Settings > Environment variables
   - GENSPARK_TOKEN が設定されているか

2. APIキーの有効性を確認
   ```bash
   curl -X POST https://www.genspark.ai/api/llm_proxy/v1/chat/completions \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-5","messages":[{"role":"user","content":"test"}]}'
   ```

3. Cloudflare Functionsのログを確認

### 401 Unauthorized エラー

**症状**: APIキーが無効

**解決策**:
1. GenSparkダッシュボードで新しいAPIキーを生成
2. Cloudflareの環境変数を更新
3. サイトを再デプロイ

## 📱 社内展開

### URLの共有

デプロイ完了後、以下の情報を社員に共有：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 会議議事録管理システム 公開のお知らせ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 アクセスURL:
https://minutes-app.pages.dev
(または https://minutes.yourcompany.com)

🔐 ログイン情報:
Email: admin@example.com
Password: Admin@123

✨ 主な機能:
• 会議管理（追加・編集・削除）
• 議事録作成（Google Sheets風テーブル）
• AI自動解析（議事録の自動構造化）
• ファイル添付（PDF/Word/Excel等）
• エクスポート（複数形式対応）

📖 使い方ガイド:
[社内マニュアルURLまたは添付資料]

❓ 質問・サポート:
[担当者連絡先]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 使い方マニュアル

詳細な使い方は `USER_GUIDE.md` を参照してください。

## 🔄 更新とメンテナンス

### コードの更新

1. **ローカルで変更を加える**
   ```bash
   cd /path/to/gijiroku-web
   # ファイルを編集
   ```

2. **GitHubにpush**
   ```bash
   git add .
   git commit -m "feat: 新機能を追加"
   git push origin main
   ```

3. **自動デプロイ**
   - Cloudflare Pagesが自動的に検知
   - 自動的に再ビルド・デプロイ

### ロールバック

問題が発生した場合：

1. **Deploymentsタブに移動**
2. **以前のデプロイを選択**
3. **「Rollback to this deployment」をクリック**

## 📈 パフォーマンス最適化

### キャッシュ設定

Cloudflare Pagesは自動的に静的ファイルをキャッシュします。

### CDN配信

- グローバルCDNで高速配信
- 世界中のユーザーに低レイテンシ

## 🎯 次のステップ

- [ ] Cloudflare Pagesプロジェクトを作成
- [ ] 環境変数（GENSPARK_TOKEN）を設定
- [ ] 初回デプロイを実行
- [ ] 動作確認（ログイン・AI解析）
- [ ] カスタムドメインを設定（オプション）
- [ ] 社内に使い方を共有
- [ ] フィードバック収集
- [ ] 継続的な改善

---

## 📞 サポート情報

**リポジトリ**: https://github.com/nozomu-tashiro/gijiroku-web

**ドキュメント**:
- README.md - プロジェクト概要
- DEPLOYMENT_GUIDE.md - 一般的なデプロイガイド
- USER_GUIDE.md - ユーザーマニュアル

**問題報告**:
- GitHub Issues: https://github.com/nozomu-tashiro/gijiroku-web/issues

---

## 🎉 デプロイ成功後

おめでとうございます！🎊

社員全員が使える会議議事録管理システムが完成しました！

- ✅ AI自動解析機能
- ✅ ファイル添付機能
- ✅ エクスポート機能
- ✅ データ永続化
- ✅ 高速グローバルCDN配信
- ✅ HTTPS標準対応
- ✅ 無料ホスティング

ぜひ社内で活用してください！🚀
