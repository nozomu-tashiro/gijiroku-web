# 🔑 OpenAI API 連携セットアップ手順

## 📋 概要

GenSpark APIの代わりに、OpenAI（ChatGPT）の公式APIを使用します。

---

## ✅ メリット

1. **確実に動作**: OpenAI公式APIは安定している
2. **高品質な解析**: GPT-4o/GPT-4による高精度な議事録解析
3. **設定が簡単**: APIキーを設定するだけ
4. **コスト管理**: OpenAIダッシュボードで使用量を確認可能

---

## 📝 Step 1: OpenAI APIキーの取得（ユーザー様の作業）

### 1.1 OpenAI Platformにアクセス

```
https://platform.openai.com/api-keys
```

### 1.2 ログイン
- ChatGPTのアカウントでログイン

### 1.3 APIキーを作成
1. 「Create new secret key」をクリック
2. 名前を入力（例: "Minutes Management"）
3. 権限: "All" を選択（またはデフォルト）
4. 「Create secret key」をクリック
5. **表示されたキーをコピー**
   - 形式: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **重要**: 一度しか表示されないので必ずコピー

### 1.4 使用制限の確認
- ダッシュボードで使用可能なクレジットを確認
- 必要に応じてクレジットを追加（最初の利用で無料クレジットがあります）

---

## 🔧 Step 2: サーバー設定（私が実施）

### 2.1 環境変数の設定

OpenAI APIキーを環境変数に設定します：

```bash
export OPENAI_API_KEY="sk-proj-your-actual-api-key-here"
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

### 2.2 使用モデルの変更

`server.js`を修正して、OpenAI対応モデルを使用：

```javascript
const AI_MODELS = {
    primary: 'gpt-4o',           // GPT-4o (最新、高品質)
    fallback: [
        'gpt-4-turbo',           // GPT-4 Turbo
        'gpt-4',                 // GPT-4
        'gpt-3.5-turbo'          // GPT-3.5 (コスト重視)
    ]
};
```

### 2.3 サーバー再起動

```bash
cd /home/user/webapp
pkill -f "node server.js"
node server.js > server.log 2>&1 &
```

---

## 🧪 Step 3: 動作確認

### 3.1 サーバーログを確認

```bash
tail -20 /home/user/webapp/server.log
```

期待される出力:
```
✅ GenSpark LLM Config Loaded:
   API Key: sk-proj-... (length: 56)
   Base URL: https://api.openai.com/v1
   Primary Model: gpt-4o
```

### 3.2 APIテスト

```bash
curl -X POST http://localhost:8080/api/openai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "議事録解析"},
      {"role": "user", "content": "テスト: 明日の会議について、田中さんが資料を準備する。"}
    ]
  }'
```

成功すると、8項目の構造化データが返ってきます。

### 3.3 ブラウザでテスト

1. アプリにログイン
2. 議事録詳細ページへ
3. AI解析ボタンをクリック
4. テキストを貼り付けて「AI解析開始」
5. 結果確認

---

## 💰 コストについて

### OpenAI API 料金（2026年1月時点）

| モデル | 入力 (1M tokens) | 出力 (1M tokens) | 推奨用途 |
|--------|-----------------|-----------------|---------|
| GPT-4o | $2.50 | $10.00 | **推奨**: 高品質 |
| GPT-4 Turbo | $10.00 | $30.00 | 高品質（旧版） |
| GPT-3.5 Turbo | $0.50 | $1.50 | コスト重視 |

### 使用量の目安

- 1回の議事録解析（3000文字）: 約 4,000 tokens
- GPT-4o使用時: 約 **$0.05/回**（5円）
- GPT-3.5-turbo使用時: 約 **$0.005/回**（0.5円）

月間100件の議事録を解析しても **$5（約750円）** 程度です。

---

## 🎯 推奨設定

### 高品質重視
```javascript
primary: 'gpt-4o'
```
- 最新モデル
- 高精度な解析
- コストパフォーマンス良好

### コスト重視
```javascript
primary: 'gpt-3.5-turbo'
```
- 安価
- 基本的な解析には十分
- 10倍以上安い

---

## 🔒 セキュリティ

### APIキーの管理

1. **環境変数で管理**: コードに直接書かない
2. **定期的にローテーション**: 3-6ヶ月ごとに更新
3. **権限を最小限に**: 必要な権限のみ付与
4. **使用量を監視**: OpenAIダッシュボードで確認

### Gitへのコミット時の注意

- `.env`ファイルは`.gitignore`に追加
- APIキーは絶対にコミットしない
- 環境変数で管理する

---

## 🐛 トラブルシューティング

### 401 Unauthorized

**原因**: APIキーが無効または期限切れ

**解決策**:
1. APIキーを再確認
2. OpenAI Platformでキーが有効か確認
3. 新しいキーを生成して再設定

### 429 Too Many Requests

**原因**: レート制限に達した

**解決策**:
1. 使用量制限を確認
2. 必要に応じてTier（プラン）をアップグレード
3. リトライロジックを実装（自動で対応済み）

### 500 Internal Server Error

**原因**: サーバー側のエラー

**解決策**:
1. サーバーログを確認: `tail -100 server.log`
2. モデル名が正しいか確認
3. Base URLが正しいか確認

---

## 📞 次のステップ

1. **ユーザー様**: OpenAI APIキーを取得してコピー
2. **私**: 環境変数に設定してサーバー再起動
3. **一緒に**: 動作確認とテスト

---

## 🎉 完了後の状態

✅ OpenAI GPT-4o/GPT-4による高品質な議事録解析  
✅ 8項目への正確な分類  
✅ 安定した動作  
✅ コスト管理が容易  
✅ フォールバック機能も維持（万が一のため）

---

**作成日**: 2026-01-16  
**最終更新**: 2026-01-16
