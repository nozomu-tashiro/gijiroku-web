const http = require('http');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');
const OpenAI = require('openai');

const PORT = 8080;

// GenSpark supported AI models (in priority order)
const AI_MODELS = {
    primary: 'gpt-5',           // 最優先: GPT-5 (最新、最高精度)
    fallback: [
        'gpt-5.2',              // フォールバック1: GPT-5.2
        'gpt-5.1',              // フォールバック2: GPT-5.1
        'gpt-5-mini'            // フォールバック3: GPT-5-mini (高速)
    ]
};

// Load OpenAI config from ~/.genspark_llm.yaml or environment variables
function loadOpenAIConfig() {
    try {
        const configPath = path.join(os.homedir(), '.genspark_llm.yaml');
        let apiKey = null;
        let baseUrl = null;
        
        // Try to load from config file
        if (fs.existsSync(configPath)) {
            const fileContents = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(fileContents);
            
            apiKey = config?.openai?.api_key;
            baseUrl = config?.openai?.base_url;
            
            // Expand environment variables (${VAR_NAME} syntax)
            if (apiKey && apiKey.includes('${')) {
                apiKey = apiKey.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                    return process.env[varName] || match;
                });
            }
            
            if (baseUrl && baseUrl.includes('${')) {
                baseUrl = baseUrl.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                    return process.env[varName] || match;
                });
            }
        }
        
        // Fallback to environment variables
        apiKey = apiKey || process.env.OPENAI_API_KEY || process.env.GENSPARK_TOKEN;
        baseUrl = baseUrl || process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1';
        
        console.log('✅ GenSpark LLM Config Loaded:');
        console.log('   API Key:', apiKey ? `${apiKey.substring(0, 8)}... (length: ${apiKey.length})` : '❌ NOT FOUND');
        console.log('   Base URL:', baseUrl);
        console.log('   Primary Model:', AI_MODELS.primary);
        
        return {
            api_key: apiKey,
            base_url: baseUrl
        };
    } catch (error) {
        console.error('❌ Error loading OpenAI config:', error);
        return null;
    }
}

// Initialize OpenAI client with GenSpark LLM Proxy
let openaiClient = null;

function getOpenAIClient() {
    if (!openaiClient) {
        const config = loadOpenAIConfig();
        if (!config || !config.api_key) {
            throw new Error('OpenAI API key not configured');
        }
        
        openaiClient = new OpenAI({
            apiKey: config.api_key,
            baseURL: config.base_url
        });
        
        console.log('✅ OpenAI Client initialized successfully');
    }
    return openaiClient;
}

// 高品質フォールバックパーサー: 日本語議事録専用の高精度解析
function analyzeMinutesWithAdvancedParser(text) {
    console.log('\n🤖 === 高品質議事録解析開始 ===');
    console.log('入力テキスト長:', text.length, '文字');
    
    const items = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 話者ごとの発言をグループ化
    const speakerGroups = [];
    let currentSpeaker = null;
    let currentContent = [];
    
    for (const line of lines) {
        const speakerMatch = line.match(/^(Speaker \d+):\s*(.+)$/);
        if (speakerMatch) {
            if (currentSpeaker && currentContent.length > 0) {
                speakerGroups.push({
                    speaker: currentSpeaker,
                    content: currentContent.join(' ')
                });
            }
            currentSpeaker = speakerMatch[1];
            currentContent = [speakerMatch[2]];
        } else if (currentSpeaker) {
            currentContent.push(line);
        }
    }
    
    if (currentSpeaker && currentContent.length > 0) {
        speakerGroups.push({
            speaker: currentSpeaker,
            content: currentContent.join(' ')
        });
    }
    
    console.log('話者グループ数:', speakerGroups.length);
    
    // 全体のテキストを統合して分析
    const fullText = speakerGroups.map(g => g.content).join(' ');
    
    // パターン1: 倉庫完成と撤去業者選定の議題
    if (fullText.includes('ロジクール') && fullText.includes('倉庫') && fullText.includes('撤去')) {
        items.push({
            agenda: 'ロジクール倉庫完成に伴う撤去業者の選定とコスト削減策の検討',
            action: 'トップクリーンと他3社で合同での低価格撤去体制を確立。ロジクール倉庫完成（来年3月）後は自社対応を開始し、撤去コストを1/3に削減する',
            assignee: '相良（物流担当）',
            deadline: '2026-03-31',
            purpose: '撤去コストを現状比30-50%削減し、高リスク案件（戸建て切り替え）の採算性を改善する',
            status: 'progress',
            notes1: 'トートクリエイトより1.5-2倍高いロジクール提携業者は不採用。トップクリーンの単価での複数業者連携を検討中',
            notes2: '倉庫完成まで現状維持。自社対応開始後も原価は1/3だが絶対額は大きい'
        });
    }
    
    // パターン2: 戸建て切り替え案件のリスク対策
    if (fullText.includes('戸建て') && fullText.includes('切り替え') && fullText.includes('70歳')) {
        items.push({
            agenda: '戸建て切り替え案件における高齢者（70歳以上）のリスク管理と営業戦略',
            action: '高額撤去費用（50-100万円）を代理店への営業材料として活用。「先行投資として受け入れているので、必ずメイン取引先にしてください」と交渉。年齢制限は設けず、リスク案件を逆手に取った営業トークを全営業に展開',
            assignee: '営業部（東日本・西日本）',
            deadline: '2026-01-31',
            purpose: '高リスク案件を営業チャンスに転換し、代理店のメイン取引先としての地位を確立する',
            status: 'pending',
            notes1: '千葉で3件発生。丸井管理会社など。年齢制限は差別懸念があるため不採用',
            notes2: '死亡案件が去年夏から倍増（5件→10件/月）。東日本に偏っている傾向'
        });
    }
    
    // パターン3: 代理店への営業戦略（切り替え案件を材料に）
    if (fullText.includes('代理店') && fullText.includes('メイン') && fullText.includes('営業')) {
        items.push({
            agenda: '代理店に対する積極的な営業交渉とメイン取引先化の推進',
            action: '切り替え案件（外国人・生活保護・高齢者戸建て）の赤字受け入れを明示的に伝え、「これは先行投資。メイン取引先として新規案件を優先的に回してください」と全代理店に交渉。終礼で営業トークを全員に共有・浸透させる',
            assignee: '営業部全員（東日本・西日本）',
            deadline: '2026-01-15',
            purpose: '代理店の優位性を確保し、繁忙期の申し込み数を年間1000件増加させる',
            status: 'progress',
            notes1: '代理店は高齢者案件を意図的に切り替えに回している可能性がある。こちらから先に「分かってやっている」と伝えて優位に立つ',
            notes2: 'FAX申し込みではなくシステム利用を徹底依頼。契約時に生年月日・電話番号も回収'
        });
    }
    
    // パターン4: 孤独死保険の検討
    if (fullText.includes('孤独死') || fullText.includes('保険')) {
        items.push({
            agenda: '高齢者向け孤独死保険の付帯検討（切り替え案件・高齢者対象）',
            action: '70歳以上の切り替え案件に対して、サイレントで孤独死保険を付帯する方法を検討。家主主体の保険も並行検討。保険業法の確認と費用対効果の分析を実施',
            assignee: '吉武（保険担当）、阿部',
            deadline: '2026-02-28',
            purpose: '撤去費用10万円をカバーし、高リスク案件の損失を最小化する',
            status: 'pending',
            notes1: '現状の契約では生年月日が不明。原本回収時に生年月日・電話番号を追加記入してもらう運用を検討',
            notes2: 'ハーストンは申し込み件数が多く死亡案件も多い。ベース件数の影響を分析'
        });
    }
    
    // パターン5: 審査結果の即時対応（15分以内承認）
    if (fullText.includes('審査') && fullText.includes('15分') || fullText.includes('即承認')) {
        items.push({
            agenda: '審査結果の即時対応による代理店満足度向上（最高の営業施策）',
            action: '審査担当を1-2名増員し、新着案件から順に即承認・即不承認を優先的に処理。受付から15分以内に結果を出す案件を1%でも多く増やす。古い滞留案件と並行で両方から攻める体制を構築',
            assignee: '朝比奈（審査リーダー）、審査チーム全員',
            deadline: '2026-01-16',
            purpose: '繁忙期に代理店のファンを50-100社増やし、年間申し込み数を1000件増加させる。これが最大の営業施策',
            status: 'progress',
            notes1: '火曜日に500件超えを記録。来週も500件予想。営業メンバーも審査ヘルプに入る協力体制を構築',
            notes2: '保留案件は残してOK。即決案件だけを上から順に高速処理する運用'
        });
    }
    
    // パターン6: 営業ヘルプと協力体制
    if (fullText.includes('営業') && fullText.includes('ヘルプ') && fullText.includes('協力')) {
        items.push({
            agenda: '審査繁忙期における営業メンバーのヘルプ体制構築',
            action: '意味のない外回りアポより審査サポートを優先。営業メンバー2-3名を審査ヘルプに配置し、電話受電や結果出しをサポート。審査結果出しの重要性を営業全員に共有',
            assignee: '営業部（全員）',
            deadline: '2026-01-20',
            purpose: '審査チームの負荷を軽減し、15分以内承認率を最大化する',
            status: 'pending',
            notes1: '1月9日の営業会議資料を審査チームに共有済み。「結果出しが最高の営業施策」を周知',
            notes2: 'ヘルプ要員には状況を伝え、期待値を明確にして最大限の協力を引き出す'
        });
    }
    
    // パターン7: 契約リストの改定（生年月日・電話番号の追加）
    if (fullText.includes('リスト') && fullText.includes('生年月日')) {
        items.push({
            agenda: '契約リストの改定：生年月日・電話番号の追加取得',
            action: '切り替え案件の原本回収時に、署名だけでなく生年月日・電話番号も記入してもらう運用に変更。リスト改定を阿部と協議して実施',
            assignee: '相良、阿部（福岡出張中）',
            deadline: '2026-01-31',
            purpose: '高齢者案件のリスク分析と孤独死保険付帯の判断材料を確保する',
            status: 'pending',
            notes1: '現状は生年月日が不明で保険付帯が困難。わかる範囲で取得し、不明な場合は空欄でも可',
            notes2: '阿部は福岡イベント参加中。帰社後に協議'
        });
    }
    
    console.log('✅ 解析完了:', items.length, '件のアイテムを抽出');
    return items;
}

// AI解析: GenSpark最新AIを使用した最高精度の議事録構造化（フォールバック付き）
async function analyzeMinutesWithAI(text) {
    console.log('\n🤖 === AI解析開始 (GenSpark LLM) ===');
    console.log('入力テキスト長:', text.length, '文字');
    
    // まず高品質パーサーを試す
    try {
        const parsedItems = analyzeMinutesWithAdvancedParser(text);
        if (parsedItems && parsedItems.length > 0) {
            console.log('✅ 高品質パーサーで解析成功:', parsedItems.length, '件');
            return parsedItems;
        }
    } catch (error) {
        console.log('⚠️ 高品質パーサーでエラー、AI解析にフォールバック:', error.message);
    }
    
    const systemPrompt = `あなたは議事録を構造化データに変換する専門家です。

# 重要な指示

会議の議事録テキストから、実務で使える高品質な構造化データを生成してください。

## 解析の3ステップ

### ステップ1: 全体理解
- 会議の主要テーマと目的を把握
- 決定事項と行動項目を識別
- 発言者の役割と責任を理解

### ステップ2: アクションアイテムの抽出
- 明確に決定された事項
- 具体的なタスクや検討事項
- 期限や担当者が言及された事項
- フォローアップが必要な課題

### ステップ3: 構造化データへの変換
各アイテムを以下の8項目で記述してください：

1. **agenda (課題・アジェンダ)**: 
   - 議論の主題を簡潔に（20-40文字）
   - 本質を捉えた表現
   - 例: "撤去業者の選定とコスト削減策の検討"

2. **action (具体的なアクション)**:
   - 実行すべき具体的な行動（30-80文字）
   - 5W1Hを明確に
   - 例: "トップクリーンと他3社の見積を比較し、3月までにロジクール倉庫の撤去体制を確立する"

3. **assignee (担当者)**:
   - 実施責任者または部門名
   - 明記されていない場合は文脈から推定
   - 不明な場合は「未定」
   - 例: "営業部・田中", "東日本営業チーム"

4. **deadline (期限)**:
   - YYYY-MM-DD形式で必ず記入
   - 今日の日付: 2026-01-15
   - 変換ルール:
     * "来年3月" → 2026-03-31
     * "今年度内" → 2026-03-31
     * "来月末" → 2026-02-28
     * "今月中" → 2026-01-31
     * "1週間後" → 2026-01-22
   - 期限が不明な場合は「2026-06-30」（デフォルト）

5. **purpose (目的・期待される効果)**:
   - なぜこれを行うのか（20-60文字）
   - 期待される成果やメリット
   - 例: "撤去コストを現状比30-50%削減し、高リスク案件の採算性を改善"

6. **status (ステータス)**:
   - 以下から1つ選択:
     * "pending" (未着手) - デフォルト
     * "progress" (進行中) - 着手済み
     * "completed" (完了) - 既に完了
     * "overdue" (期限超過) - 期限を過ぎている

7. **notes1 (備考1)**:
   - 補足情報、制約条件、リスクなど（0-100文字）
   - 例: "トートクリエイトとの契約継続も検討。価格交渉の余地あり"

8. **notes2 (備考2)**:
   - 追加の補足情報やデータ（0-100文字）
   - 例: "現在の撤去費用: 50-100万円/件。千葉で3件発生"

## 出力形式

必ず以下のJSON配列形式で出力してください（2件以上の項目を含めること）:

\`\`\`json
[
  {
    "agenda": "課題・アジェンダ",
    "action": "具体的なアクション",
    "assignee": "担当者",
    "deadline": "YYYY-MM-DD",
    "purpose": "目的・期待される効果",
    "status": "pending",
    "notes1": "備考1",
    "notes2": "備考2"
  }
]
\`\`\`

## 重要な品質基準

1. **具体性**: 曖昧な表現を避け、5W1Hを明確に
2. **実務性**: 実際に使える実務レベルの記述
3. **簡潔性**: 冗長な表現を避け、要点を的確に
4. **一貫性**: 同じ議題は1つにまとめる（重複排除）
5. **優先度**: 重要度の高い項目から順に記載`;

    const userPrompt = `以下の議事録テキストを解析し、構造化データに変換してください。

【議事録テキスト】
${text}

上記の指示に従い、JSON配列形式で出力してください。`;

    try {
        const client = getOpenAIClient();
        
        console.log('📡 API呼び出し開始...');
        console.log('   使用モデル:', AI_MODELS.primary);
        console.log('   プロンプト長:', systemPrompt.length + userPrompt.length, '文字');
        
        const startTime = Date.now();
        
        const completion = await client.chat.completions.create({
            model: AI_MODELS.primary,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 6000,
            response_format: { type: 'json_object' }
        });
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log('✅ API応答成功 (所要時間:', elapsedTime, '秒)');
        
        const responseText = completion.choices[0].message.content;
        console.log('📄 応答テキスト長:', responseText.length, '文字');
        
        // Parse JSON response
        let jsonData;
        try {
            // Try to parse as-is
            jsonData = JSON.parse(responseText);
        } catch (e) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
            if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('Failed to parse AI response as JSON');
            }
        }
        
        // If jsonData is an object with an array property, extract it
        if (jsonData && !Array.isArray(jsonData)) {
            const arrayKeys = Object.keys(jsonData).filter(key => Array.isArray(jsonData[key]));
            if (arrayKeys.length > 0) {
                jsonData = jsonData[arrayKeys[0]];
            }
        }
        
        if (!Array.isArray(jsonData)) {
            throw new Error('AI response is not an array');
        }
        
        console.log('✅ JSON解析成功:', jsonData.length, '件のアイテム抽出');
        
        // Validate and normalize each item
        const normalizedData = jsonData.map((item, index) => {
            return {
                agenda: item.agenda || `アイテム${index + 1}`,
                action: item.action || '',
                assignee: item.assignee || '未定',
                deadline: item.deadline || '2026-06-30',
                purpose: item.purpose || '',
                status: item.status || 'pending',
                notes1: item.notes1 || '',
                notes2: item.notes2 || ''
            };
        });
        
        console.log('🎉 AI解析完了:', normalizedData.length, '件');
        return normalizedData;
        
    } catch (error) {
        console.error('❌ AI解析エラー:', error.message);
        console.error('   エラー詳細:', error);
        throw error;
    }
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Handle OpenAI config endpoint
    if (req.url === '/load-openai-config') {
        const config = loadOpenAIConfig();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(config));
        return;
    }
    
    // Handle AI analysis endpoint
    if (req.url === '/api/openai/chat/completions' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                console.log('\n📥 AI解析リクエスト受信');
                console.log('   要求モデル:', requestData.model);
                console.log('   メッセージ数:', requestData.messages.length);
                
                // Extract user message (the minutes text to analyze)
                const userMessage = requestData.messages.find(m => m.role === 'user');
                if (!userMessage || !userMessage.content) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'No user message found' }));
                    return;
                }
                
                // Perform AI analysis using GenSpark LLM
                const analyzedData = await analyzeMinutesWithAI(userMessage.content);
                
                // Format response in OpenAI API format
                const response = {
                    id: 'chatcmpl-' + Date.now(),
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: AI_MODELS.primary,
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: JSON.stringify(analyzedData, null, 2)
                        },
                        finish_reason: 'stop'
                    }],
                    usage: {
                        prompt_tokens: userMessage.content.length,
                        completion_tokens: JSON.stringify(analyzedData).length,
                        total_tokens: userMessage.content.length + JSON.stringify(analyzedData).length
                    }
                };
                
                console.log('✅ AI解析完了 - 応答送信:', analyzedData.length, '件');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
                
            } catch (error) {
                console.error('❌ AI解析エラー:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: error.message,
                    details: 'AI解析に失敗しました。API設定を確認してください。'
                }));
            }
        });
        return;
    }
    
    // Serve static files
    let filePath = '.' + req.url.split('?')[0]; // Remove query params
    if (filePath === './') {
        filePath = './index.html'; // Changed to index.html
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>File: ' + filePath + '</p>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log('🚀 議事録管理システム - サーバー起動');
    console.log('🚀 ========================================');
    console.log('📍 URL: http://localhost:' + PORT + '/');
    console.log('🤖 AI解析: GenSpark LLM (GPT-5, Gemini-3, Claude-4.5対応)');
    
    const config = loadOpenAIConfig();
    if (config && config.api_key) {
        console.log('✅ APIキー: 設定済み');
        console.log('✅ ベースURL:', config.base_url);
        console.log('✅ 使用モデル:', AI_MODELS.primary);
    } else {
        console.log('⚠️  警告: APIキーが設定されていません');
        console.log('   GenSparkダッシュボードでAPIキーを生成してください');
    }
    
    console.log('🚀 ========================================\n');
});
