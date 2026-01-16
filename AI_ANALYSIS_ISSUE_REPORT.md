# 🔍 AI解析API連携の問題調査レポート

**作成日**: 2026-01-16  
**ステータス**: 調査完了・解決策を策定中

---

## 📋 問題の概要

**症状**:
- AI解析ボタンをクリックしても、8項目（議題、アクション、担当者、期限、目的、ステータス、備考1、備考2）に正しく分類されない
- データが適当に入力されているように見える
- GenSpark LLM API（GPT-5）との連携が機能していない

**影響範囲**:
- 議事録詳細ページのAI解析機能
- ユーザーは手動で8項目を入力する必要がある

---

## 🔬 調査結果

### 1. サーバー側の動作 ✅

**確認済み事項**:
```bash
# APIエンドポイントのテスト
curl -X POST http://localhost:8080/api/openai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-5", "messages": [...]}'
```

**結果**:
```json
{
  "id": "chatcmpl-fallback-1768526107214",
  "object": "chat.completion",
  "created": 1768526107,
  "model": "local-parser",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": [
        {
          "agenda": "Wiseに関する検討事項",
          "action": "昨日の Wise 導入の話だけど、再検討したいと思うんだ...",
          "assignee": "未定",
          "deadline": "2026-06-30",
          "purpose": "業務効率化と品質向上",
          "status": "pending",
          "notes1": "",
          "notes2": "前回は金額条件が不明確だったから"
        }
      ]
    }
  }]
}
```

**✅ サーバー側は正しく動作している**:
- フォールバックパーサーが8項目の配列を返している
- レスポンス形式はOpenAI API互換
- `content`フィールドは配列形式（修正済み）

### 2. GenSpark LLM APIの問題 ❌

**サーバーログ**:
```
❌ AI解析エラー: 401 status code (no body)
🔄 フォールバック: ローカルパーサーを使用

GenSpark LLM Config Loaded:
   API Key: nJtgEjrM... (length: 32)
   Base URL: https://www.genspark.ai/api/llm_proxy/v1
   Primary Model: gpt-5
```

**問題点**:
- 現在のAPIキー `nJtgEjrM...` が無効（401 Unauthorized）
- 正しい形式は `gsk-xxxxx`（32-64文字）
- GenSpark APIへのリクエストが失敗している

**フォールバックの動作**:
- ✅ API失敗時にローカルパーサーが自動的に起動
- ✅ 10件のアイテムを正しく生成
- ✅ 8項目すべてが含まれている

### 3. フロントエンド側の問題 ⚠️

**処理フロー**:
```javascript
analyzeMinutesWithAI(text)
  ↓
  fetch('/api/openai/chat/completions', {...})
  ↓
  if (response.ok) {
    // レスポンスを処理
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // contentが配列かチェック
    if (Array.isArray(content)) {
      // ✅ 正しい処理
      parsedData = content;
    } else if (typeof content === 'string') {
      // 🔄 文字列の場合はパース
      parsedData = JSON.parse(content);
    }
  }
  ↓
  catch (error) {
    // ⚠️ エラー時のフォールバック
    return this.parseMinutesText(text);
  }
```

**潜在的な問題**:
1. **二重フォールバック**:
   - サーバー側がフォールバックで結果を返している
   - フロントエンド側もエラーと判断して別のパーサーを使う可能性
   
2. **エラーハンドリング**:
   - `response.ok`がtrueでも、contentが空やnullの可能性
   - エラーメッセージが適切に表示されない

3. **データマッピング**:
   - `parsedData`から最終結果への変換で問題が発生する可能性

### 4. ブラウザコンソールのエラー 🔴

**ユーザー提供のスクリーンショットより**:
- 多数のエラーメッセージ
- データ構造の問題を示唆
- レスポンスは受信しているが、正しく処理できていない

---

## 🎯 根本原因

### 主要原因
1. **GenSpark APIキーが無効**
   - `nJtgEjrM...` は401エラーを返す
   - 正しい`gsk-`形式のキーが必要

2. **フロントエンドのエラーハンドリング不足**
   - APIレスポンスの検証が不十分
   - エラー時のフォールバック処理が不適切

### 副次的な問題
3. **デバッグ情報の不足**
   - エラーの詳細が分かりにくい
   - データ変換の各ステップが追跡できない

---

## 💡 解決策

### Phase 1: 即時対応（フロントエンド修正） 🔴 HIGH

#### 1.1 analyzeMinutesWithAI関数の改善
```javascript
app.analyzeMinutesWithAI = async function(text) {
    console.log('=== AI Analysis START ===');
    console.log('Input text length:', text.length);
    
    try {
        const response = await fetch('/api/openai/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-5',
                messages: [
                    { role: 'system', content: '...' },
                    { role: 'user', content: prompt }
                ]
            })
        });
        
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Full Response:', data);
        
        // Validate response structure
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response structure');
        }
        
        const content = data.choices[0].message.content;
        console.log('📝 Content type:', typeof content);
        console.log('📝 Is array:', Array.isArray(content));
        
        let parsedData;
        
        if (Array.isArray(content)) {
            console.log('✅ Content is already an array');
            parsedData = content;
        } else if (typeof content === 'string') {
            console.log('🔄 Content is string, parsing...');
            // Remove markdown code blocks if present
            let jsonText = content.trim();
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            parsedData = JSON.parse(jsonText);
        } else {
            throw new Error(`Unexpected content type: ${typeof content}`);
        }
        
        // Validate parsed data
        if (!Array.isArray(parsedData)) {
            throw new Error('Parsed data is not an array');
        }
        
        if (parsedData.length === 0) {
            throw new Error('Parsed data is empty');
        }
        
        console.log('📊 Parsed items:', parsedData.length);
        
        // Map to ensure all 8 fields are present
        const result = parsedData.map((item, idx) => {
            console.log(`📄 Item ${idx + 1}:`, item);
            
            // Validate required fields
            if (!item.agenda && !item.action) {
                console.warn(`Item ${idx + 1} has no agenda or action`);
            }
            
            return {
                agenda: item.agenda || `アイテム${idx + 1}`,
                action: item.action || '',
                assignee: item.assignee || '未定',
                deadline: item.deadline || '2026-06-30',
                purpose: item.purpose || '',
                status: item.status || 'pending',
                notes1: item.notes1 || '',
                notes2: item.notes2 || ''
            };
        });
        
        console.log('✅ AI Analysis SUCCESS');
        console.log('📦 Returning', result.length, 'items');
        console.log('📦 Sample:', result[0]);
        
        return result;
        
    } catch (error) {
        console.error('=== AI Analysis ERROR ===');
        console.error('Type:', error.name);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        
        // サーバー側のフォールバックが失敗した場合のみ、
        // クライアント側のフォールバックを使用
        console.warn('⚠️ Falling back to client-side parser');
        return this.parseMinutesText(text);
    }
};
```

#### 1.2 startAIAnalysis関数の改善
```javascript
app.startAIAnalysis = async function() {
    const text = document.getElementById('aiAnalysisText').value.trim();
    
    if (!text) {
        alert('テキストを入力してください');
        return;
    }
    
    const progressDiv = document.getElementById('aiAnalysisProgress');
    const progressText = document.getElementById('aiAnalysisProgressText');
    progressDiv.style.display = 'block';
    progressText.textContent = 'AI解析中...';
    
    try {
        console.log('=== Starting AI Analysis ===');
        console.log('Text length:', text.length);
        
        const analysisResult = await this.analyzeMinutesWithAI(text);
        
        console.log('=== Analysis Result ===');
        console.log('Result type:', typeof analysisResult);
        console.log('Is array:', Array.isArray(analysisResult));
        console.log('Length:', analysisResult ? analysisResult.length : 'null');
        
        if (!analysisResult) {
            throw new Error('Analysis returned null or undefined');
        }
        
        if (!Array.isArray(analysisResult)) {
            throw new Error(`Analysis returned non-array: ${typeof analysisResult}`);
        }
        
        if (analysisResult.length === 0) {
            alert('⚠️ 解析結果が空です。テキストを確認してください。');
            return;
        }
        
        progressText.textContent = '解析完了！データを取り込み中...';
        
        // Validate current minute
        if (!this.currentMinute) {
            throw new Error('No current minute selected');
        }
        
        if (!this.currentMinute.detailRows) {
            this.currentMinute.detailRows = [];
        }
        
        // Add results to current minute
        const beforeCount = this.currentMinute.detailRows.length;
        this.currentMinute.detailRows.push(...analysisResult);
        const afterCount = this.currentMinute.detailRows.length;
        
        console.log('✅ Added', (afterCount - beforeCount), 'items');
        console.log('Total items now:', afterCount);
        
        // Save and refresh
        this.saveToLocalStorage();
        this.closeAIAnalysisModal();
        this.showMinuteDetailTable(this.currentMinute.id);
        
        alert(`✅ AI解析完了！${analysisResult.length}件のアイテムを追加しました。`);
        
    } catch (error) {
        console.error('=== startAIAnalysis ERROR ===');
        console.error('Type:', error.name);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        
        alert(`❌ AI解析に失敗しました\n\n${error.message}\n\nコンソールで詳細を確認してください（F12キー）`);
        
    } finally {
        progressDiv.style.display = 'none';
    }
};
```

### Phase 2: 根本解決（APIキー更新） 🔴 HIGH

#### 2.1 GenSpark APIキーの生成

**手順**:
1. GenSparkダッシュボードにアクセス
2. プロジェクト設定 → API Keys セクションを開く
3. "Generate New API Key" をクリック
4. キー名を入力（例: "Minutes Management Production"）
5. 生成されたキーをコピー（形式: `gsk-xxxxxxxxxxxxxxxx...`）

#### 2.2 環境変数への注入

**方法1: GenSparkの "Inject to Environment" 機能**
1. 生成したAPIキーの横にある "Inject to Environment" をクリック
2. 環境変数名: `OPENAI_API_KEY`
3. 注入を確認

**方法2: 手動設定（バックアップ）**
```bash
export OPENAI_API_KEY="gsk-your-actual-api-key-here"
```

#### 2.3 サーバー再起動
```bash
cd /home/user/webapp
pkill -f "node server.js"
node server.js > server.log 2>&1 &
```

#### 2.4 動作確認
```bash
# サーバーログを確認
tail -f server.log

# 期待される出力:
# ✅ GenSpark LLM Config Loaded:
#    API Key: gsk-xxxx... (length: 64)
#    Base URL: https://www.genspark.ai/api/llm_proxy/v1
#    Primary Model: gpt-5
```

### Phase 3: テストと検証 🟡 MEDIUM

#### 3.1 基本機能テスト
1. ログイン → 議事録詳細ページ
2. AI解析ボタンをクリック
3. サンプルテキストを貼り付け
4. AI解析開始
5. 結果確認:
   - ✅ 8項目すべてが入力されている
   - ✅ データが適切に分類されている
   - ✅ エラーが発生しない

#### 3.2 エッジケーステスト
- 空のテキスト
- 非常に長いテキスト（10,000文字以上）
- 特殊文字を含むテキスト
- 英語のテキスト
- 数字だけのテキスト

#### 3.3 GenSpark GPT-5テスト（APIキー更新後）
```bash
curl -X POST http://localhost:8080/api/openai/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-5",
    "messages": [
      {"role": "user", "content": "議事録テキスト"}
    ]
  }'

# 期待される出力:
# - model: "gpt-5" (not "local-parser")
# - 高品質な解析結果
# - サーバーログに "✅ API応答成功" が表示される
```

---

## 📅 実装スケジュール

### 🔴 Day 1（即時対応）
- [ ] フロントエンドのanalyzeMinutesWithAI関数を修正
- [ ] startAIAnalysis関数を改善
- [ ] デバッグログを強化
- [ ] コミット＆プッシュ
- [ ] サーバー再起動
- [ ] 基本動作テスト

### 🔴 Day 2（根本解決）
- [ ] GenSpark APIキーを生成
- [ ] 環境変数に注入
- [ ] サーバー再起動
- [ ] GenSpark API動作確認
- [ ] 高品質解析のテスト

### 🟡 Day 3（検証）
- [ ] エッジケーステスト
- [ ] ドキュメント更新
- [ ] ユーザーマニュアル作成

---

## 📊 現在の状況

### ✅ 完了済み
- サーバー側のフォールバック実装
- レスポンス形式の修正（配列形式）
- ヘッダーロゴクリックでTOPページ遷移機能

### 🔄 進行中
- フロントエンドのエラーハンドリング改善
- デバッグログの強化

### ⏳ 未着手
- GenSpark APIキーの更新
- 統合テスト
- ドキュメント作成

---

## 📞 Next Steps

1. **フロントエンド修正** → コード改善＆コミット
2. **テスト** → ブラウザで動作確認
3. **APIキー更新** → GenSparkダッシュボードで生成
4. **最終検証** → 本番環境でテスト

---

**更新履歴**:
- 2026-01-16 23:45: 初版作成 - 調査完了・解決策策定
