# 🚀 Cloudflare Workers + GPT-4 API 実装手順書

## 📋 概要

この手順書に従って、GitHub PagesのフロントエンドとCloudflare WorkersのバックエンドをGPT-4 APIで接続します。

**所要時間**: 約30分  
**難易度**: ⭐⭐⭐（中級）

---

## 🎯 実装後の動作

```
[ユーザー] 
    ↓ 議事録テキストを入力
[GitHub Pages - フロントエンド]
    ↓ HTTPSリクエスト
[Cloudflare Workers - バックエンド]
    ↓ APIキーを使ってリクエスト（APIキーは隠される）
[OpenAI GPT-4 API]
    ↓ 構造化データを返す
[フロントエンド]
    ↓ 議事録に追加
[完了！]
```

---

## ✅ 事前準備

### 必要なもの
- [ ] Cloudflareアカウント（無料）
- [ ] OpenAI APIキー（有料、$5〜$20程度のクレジット）
- [ ] GitHubアカウント（既に持っている）

---

## 📝 Step 1: OpenAI APIキーを取得（5分）

### 1-1. OpenAI Platformにアクセス

```
https://platform.openai.com/api-keys
```

### 1-2. ログイン
- OpenAIアカウントでログイン
- アカウントがない場合は新規作成

### 1-3. APIキーを作成
1. 「Create new secret key」をクリック
2. 名前を入力：`gijiroku-web`
3. 「Create secret key」をクリック

### 1-4. APIキーをコピー
⚠️ **重要**: APIキーは二度と表示されません！必ずコピーして安全な場所に保存してください。

```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 1-5. クレジットを追加（初回のみ）
1. 左メニューの「Billing」をクリック
2. 「Add payment method」でクレジットカードを登録
3. 最低$5のクレジットを追加（月間数百回の解析が可能）

---

## 📝 Step 2: Cloudflare Workerを作成（15分）

### 2-1. Cloudflareにログイン

```
https://dash.cloudflare.com/
```

### 2-2. Workers & Pagesを開く
1. 左メニューの「Workers & Pages」をクリック
2. 「Create application」をクリック
3. 「Create Worker」を選択

### 2-3. Workerの名前を設定
```
名前: gijiroku-ai-worker
```

「Deploy」をクリック

### 2-4. Workerのコードを編集
1. デプロイ後、「Edit code」をクリック
2. 既存のコードをすべて削除
3. `cloudflare-worker.js`の内容をコピー＆ペースト
4. 「Save and Deploy」をクリック

### 2-5. 環境変数を設定
1. 「Settings」タブをクリック
2. 「Variables」セクションを開く
3. 「Add variable」をクリック
4. 以下を入力：
   - Variable name: `OPENAI_API_KEY`
   - Value: `sk-proj-xxxxx...`（Step 1で取得したAPIキー）
   - Type: `Secret`（重要！）
5. 「Save」をクリック

### 2-6. Worker URLを確認
以下の形式のURLが表示されます：

```
https://gijiroku-ai-worker.your-subdomain.workers.dev
```

このURLをコピーしておいてください（Step 3で使用）。

---

## 📝 Step 3: フロントエンドを修正（10分）

### 3-1. `analyzeMinutesWithAI`関数を修正

`index.html`の`app.analyzeMinutesWithAI`関数を以下のように修正します：

```javascript
app.analyzeMinutesWithAI = async function(text) {
    console.log('🤖 Starting AI analysis with Cloudflare Worker...');
    
    // Cloudflare Worker URL（Step 2-6で取得したURL）
    const WORKER_URL = 'https://gijiroku-ai-worker.your-subdomain.workers.dev';
    
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error}`);
        }
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            console.log('✅ AI analysis completed:', result.data.length, 'items');
            return result.data;
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('❌ AI analysis failed:', error);
        throw error;
    }
};
```

### 3-2. コミット＆プッシュ

```bash
cd /home/user/webapp
git add -A
git commit -m "feat: Cloudflare Workers + GPT-4 API統合"
git push origin main
```

---

## 📝 Step 4: 動作確認（5分）

### 4-1. GitHub Pagesを開く

```
https://nozomu-tashiro.github.io/gijiroku-web/?v=1768660637
```

**Ctrl + Shift + R**で強制リロード

### 4-2. テストデータで確認
1. ログイン（admin@ielove-partners.jp / Admin@123）
2. 新しい会議を作成
3. 議事録詳細画面で「🤖 AI解析」をクリック
4. 以下のテキストを入力：

```
Speaker 1: 今月の売上目標について確認します。担当：営業部、期限：2026-02-28

Speaker 2: 了解しました。新しいキャンペーンを開始します。担当：マーケティング部、期限：2026-02-15

Speaker 3: Webサイトの更新も必要です。担当：田中さん、期限：2026-02-10
```

5. 「🤖 AI解析開始」をクリック
6. 数秒後、解析結果が追加される

### 4-3. 成功の確認
- ✅ アラート「✅ AI解析完了！3件のアイテムを追加しました。」が表示される
- ✅ 議事録詳細テーブルに3件の行が追加される
- ✅ 担当者と期限が正しく抽出されている

---

## 🔍 トラブルシューティング

### ❌ エラー: "API key not configured"
**原因**: Cloudflare Workerの環境変数が設定されていない

**解決方法**:
1. Cloudflare Dashboardを開く
2. Workerの「Settings」→「Variables」を確認
3. `OPENAI_API_KEY`が設定されているか確認
4. 設定されていない場合はStep 2-5を再実行

---

### ❌ エラー: "Failed to fetch"
**原因**: Cloudflare Worker URLが間違っている

**解決方法**:
1. Cloudflare Dashboardを開く
2. Workerの詳細ページでURLを確認
3. フロントエンドの`WORKER_URL`を正しいURLに修正
4. 再デプロイ

---

### ❌ エラー: "OpenAI API error: 401"
**原因**: OpenAI APIキーが無効

**解決方法**:
1. OpenAI Platform（https://platform.openai.com/api-keys）を開く
2. APIキーが有効か確認
3. 新しいAPIキーを作成
4. Cloudflare Workerの環境変数を更新

---

### ❌ エラー: "OpenAI API error: 429"
**原因**: APIリクエスト制限に達した

**解決方法**:
1. OpenAI Platformの「Usage」を確認
2. クレジットを追加
3. レート制限を確認（無料プランは1分あたり3リクエスト）

---

## 💰 コスト見積もり

### OpenAI API（GPT-4）
- **入力トークン**: $0.03 / 1,000トークン
- **出力トークン**: $0.06 / 1,000トークン

### 1回の解析コスト例
- 入力: 500トークン（約1000文字の議事録）
- 出力: 300トークン（約3件のアイテム）
- **コスト**: 約$0.033（約5円）

### 月間コスト例
- 1日10回の解析 × 30日 = 300回
- **月間コスト**: 約$10（約1,500円）

### Cloudflare Workers
- **無料プラン**: 1日10万リクエストまで無料
- **議事録解析には十分**

---

## ✅ 完成後の機能

- ✅ GPT-4による高精度な議事録解析
- ✅ 自動的な担当者・期限の抽出
- ✅ 具体的なアクションアイテムの生成
- ✅ 5W1Hの明確化
- ✅ セキュアなAPIキー管理
- ✅ サーバーレスで高速

---

## 📞 サポート

問題が発生した場合は、以下の情報を提供してください：

1. エラーメッセージ（F12でコンソールを開く）
2. Cloudflare Worker URL
3. OpenAI APIの使用状況（https://platform.openai.com/usage）

---

**準備完了です！明日、この手順書に従って実装しましょう 🚀**
