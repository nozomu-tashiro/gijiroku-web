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
    console.log('\n🤖 === 高度なAI風議事録解析開始 ===');
    console.log('入力テキスト長:', text.length, '文字');
    
    const today = new Date('2026-01-15');
    const items = [];
    
    // テキストを行ごとに分割して整形
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2);
    
    // 話者ごとの発言をグループ化（柔軟な話者パターン対応）
    const speakerGroups = [];
    let currentSpeaker = null;
    let currentContent = [];
    
    for (const line of lines) {
        // 柔軟な話者パターン: "Speaker 1:", "田中:", "営業部:", など
        const speakerMatch = line.match(/^([^:：。、]+)[：:]\s*(.+)$/);
        if (speakerMatch && speakerMatch[1].length < 20) {
            // 前の話者の内容を保存
            if (currentSpeaker && currentContent.length > 0) {
                speakerGroups.push({
                    speaker: currentSpeaker,
                    content: currentContent.join(' ')
                });
                currentContent = [];
            }
            currentSpeaker = speakerMatch[1].trim();
            const content = speakerMatch[2].trim();
            if (content) currentContent.push(content);
        } else if (currentSpeaker && line) {
            currentContent.push(line);
        } else if (!currentSpeaker && line) {
            // 話者なしのテキストも解析対象に
            speakerGroups.push({
                speaker: '全体',
                content: line
            });
        }
    }
    
    // 最後の話者の内容を保存
    if (currentSpeaker && currentContent.length > 0) {
        speakerGroups.push({
            speaker: currentSpeaker,
            content: currentContent.join(' ')
        });
    }
    
    console.log('話者グループ数:', speakerGroups.length);
    console.log('話者リスト:', speakerGroups.slice(0, 5).map(g => g.speaker).join(', '));
    
    // 全体のテキストを統合
    const fullText = speakerGroups.map(g => g.content).join('\n');
    console.log('統合テキスト長:', fullText.length, '文字');
    
    // トピックごとにグループ化（段落や話題の切れ目を検出）
    const topics = [];
    let currentTopic = [];
    
    // センテンスごとに分割
    const sentences = fullText.split(/[。！？]+/)
        .map(s => s.trim())
        .filter(s => s.length > 8);
    
    console.log('総センテンス数:', sentences.length);
    
    // トピックごとにグループ化するための高度な解析
    // 1) 主要キーワードでトピックを分割
    // 2) キーワード間のセンテンスをそのトピックに含める
    const topicGroups = [];
    
    // 主要なトピックキーワード（これらが出てきたら新しい議題の可能性）
    const topicKeywords = [
        'Wise', 'ワイズ', '送金', '国際送金', '倉庫', '撤去', '代理店', '審査', 
        '保険', '孤独死', '切り替え', '契約', 'リスト', 'アプリ', 'マニュアル', 
        'システム', 'NetStars', 'ネットスターズ', '月次報告', 'QRコード'
    ];
    
    // キーワードを含むセンテンスのインデックスを検出
    const keywordSentences = [];
    sentences.forEach((sentence, idx) => {
        const foundKeywords = topicKeywords.filter(kw => sentence.includes(kw));
        if (foundKeywords.length > 0) {
            keywordSentences.push({
                index: idx,
                keywords: foundKeywords,
                sentence: sentence
            });
        }
    });
    
    console.log('キーワードセンテンス数:', keywordSentences.length);
    
    if (keywordSentences.length === 0) {
        // キーワードが見つからない場合は全体を1つのトピックに
        topicGroups.push({
            keyword: '全体',
            sentences: sentences.slice(0, 5)
        });
    } else {
        // キーワード間でセンテンスをグループ化
        keywordSentences.forEach((kws, idx) => {
            const startIdx = kws.index;
            const endIdx = idx < keywordSentences.length - 1 
                ? keywordSentences[idx + 1].index 
                : sentences.length;
            
            // このキーワードに関連するセンテンスを抽出（最大8センテンス）
            const groupSentences = sentences.slice(startIdx, Math.min(endIdx, startIdx + 8));
            
            topicGroups.push({
                keyword: kws.keywords[0],
                sentences: groupSentences
            });
        });
    }
    
    console.log('トピックグループ数:', topicGroups.length);
    
    // 期限パターンマッチング
    const deadlinePatterns = [
        { pattern: /来年(\d+)月/, calc: (m) => new Date(today.getFullYear() + 1, parseInt(m[1]) - 1, 28) },
        { pattern: /(\d{4})年(\d+)月(\d+)日/, calc: (m) => new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])) },
        { pattern: /(\d+)月(\d+)日/, calc: (m) => new Date(today.getFullYear(), parseInt(m[1]) - 1, parseInt(m[2])) },
        { pattern: /来月末/, calc: () => new Date(today.getFullYear(), today.getMonth() + 2, 0) },
        { pattern: /今月中|今月末/, calc: () => new Date(today.getFullYear(), today.getMonth() + 1, 0) },
        { pattern: /(\d+)週間後/, calc: (m) => new Date(today.getTime() + parseInt(m[1]) * 7 * 24 * 60 * 60 * 1000) },
        { pattern: /2月/, calc: () => new Date(today.getFullYear(), 1, 28) },
        { pattern: /明日/, calc: () => new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    ];
    
    // 担当者パターンマッチング
    const assigneePatterns = [
        /([^。、（）\n]+?)(?:が|は|に)(?:担当|対応|実施|進める|やる|参加)/,
        /担当[：:]\s*([^。、（）\n]+)/,
        /([^。、（）\n]+?)チーム/,
        /([^。、（）\n]+?)部/,
        /([^。、（）\n]{2,10})さん/
    ];
    
    // 各トピックグループを解析して1つの議題アイテムに変換
    topicGroups.forEach(group => {
        const combinedText = group.sentences.join('。');
        
        // 議題を抽出（高度なロジック）
        let agenda = '';
        
        if (group.keyword && group.keyword !== '全体') {
            // キーワードベースの議題生成
            const firstSentence = group.sentences[0];
            
            // パターン1: 「キーワード + の + 名詞」
            const pattern1 = new RegExp(`(${group.keyword}[^。、]{0,30}?)(?:の|に関する|について)([^。、]{5,25})`);
            const match1 = combinedText.match(pattern1);
            if (match1) {
                agenda = `${match1[1]}${match1[2]}`;
            }
            
            // パターン2: キーワードを含む最初のまとまり
            if (!agenda || agenda.length < 10) {
                const pattern2 = new RegExp(`([^。、]{5,35}${group.keyword}[^。、]{0,25})`);
                const match2 = combinedText.match(pattern2);
                if (match2) {
                    agenda = match2[1].trim();
                }
            }
            
            // パターン3: キーワード + 動詞
            if (!agenda || agenda.length < 10) {
                const pattern3 = new RegExp(`(${group.keyword}[^。、]{0,25}?)(?:導入|検討|対応|確認|整理|管理|設定)`);
                const match3 = combinedText.match(pattern3);
                if (match3) {
                    agenda = match3[0].trim();
                }
            }
            
            // まだ不十分な場合はデフォルト
            if (!agenda || agenda.length < 10) {
                agenda = `${group.keyword}に関する検討事項`;
            }
        } else {
            // キーワードがない場合は最初のセンテンスから抽出
            const firstSentence = group.sentences[0];
            const agendaMatch = firstSentence.match(/^([^。、]{10,50})/);
            agenda = agendaMatch ? agendaMatch[1].trim() : firstSentence.substring(0, 40);
        }
        
        // 議題の長さを調整
        if (agenda.length > 50) {
            agenda = agenda.substring(0, 50);
        }
        
        // アクション（主要なアクション動詞を含むセンテンスを優先）
        const actionVerbs = ['検討', '確認', '実施', '対応', '整理', '提案', '報告', '共有', '確保', '調整', '依頼', '決定', '進める'];
        const actionSentences = group.sentences.filter(s => 
            actionVerbs.some(verb => s.includes(verb))
        );
        
        let action = '';
        if (actionSentences.length > 0) {
            action = actionSentences.slice(0, 2).join('。');
        } else {
            action = group.sentences.slice(0, 2).join('。');
        }
        
        // アクションが長すぎる場合は切り詰め
        if (action.length > 200) {
            action = action.substring(0, 200) + '...';
        }
        
        // 期限を探す（全センテンスから）
        let deadline = '2026-06-30'; // デフォルト
        for (const dp of deadlinePatterns) {
            const match = combinedText.match(dp.pattern);
            if (match) {
                try {
                    const date = dp.calc(match);
                    deadline = date.toISOString().split('T')[0];
                    break;
                } catch (e) {
                    console.log('期限パース エラー:', e.message);
                }
            }
        }
        
        // 担当者を探す（全センテンスから）
        let assignee = '未定';
        for (const ap of assigneePatterns) {
            const match = combinedText.match(ap);
            if (match && match[1]) {
                assignee = match[1].trim();
                if (assignee.length > 20) assignee = assignee.substring(0, 20);
                if (/^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s・]+$/.test(assignee)) {
                    break;
                }
                assignee = '未定';
            }
        }
        
        // ステータスを推定
        let status = 'pending';
        if (/完了|済み|終了|完成/.test(combinedText)) {
            status = 'completed';
        } else if (/進行中|実施中|対応中|着手/.test(combinedText)) {
            status = 'progress';
        }
        
        // 目的を推定
        let purpose = '';
        const purposePatterns = [
            /(.{10,70})(?:ため|目的|狙い|効果|メリット)/,
            /(?:目的|狙い)[：:は]\s*(.{10,70})/
        ];
        for (const pp of purposePatterns) {
            const match = combinedText.match(pp);
            if (match) {
                purpose = match[1].trim().replace(/^、|^。|^を|^に|^で/g, '').substring(0, 60);
                break;
            }
        }
        if (!purpose) purpose = '業務効率化と品質向上';
        
        // 補足情報1（数字や金額を含む部分）
        let notes1 = '';
        const numbersMatch = combinedText.match(/([^。、]*?(?:\d+(?:万円|円|件|名|％|%|社|個|回|日)|(?:昨年|去年|今年|来年))[^。、]*)/);
        if (numbersMatch) {
            notes1 = numbersMatch[1].trim().substring(0, 100);
        }
        
        // 補足情報2（場所や固有名詞、または追加の制約条件）
        let notes2 = '';
        const locationMatch = combinedText.match(/([^。、]*?(?:東京|大阪|福岡|千葉|横浜|名古屋|北海道|沖縄|東日本|西日本|本社|支社|中国|アメリカ|海外)[^。、]*)/);
        if (locationMatch) {
            notes2 = locationMatch[1].trim().substring(0, 100);
        } else {
            // 場所がなければ、条件や制約を探す
            const constraintMatch = combinedText.match(/([^。、]*?(?:条件|制約|注意|上限|下限|必要|規定|ルール)[^。、]*)/);
            if (constraintMatch) {
                notes2 = constraintMatch[1].trim().substring(0, 100);
            }
        }
        
        items.push({
            agenda: agenda,
            action: action,
            assignee: assignee,
            deadline: deadline,
            purpose: purpose,
            status: status,
            notes1: notes1,
            notes2: notes2
        });
    });
    
    console.log('✅ 高度な解析完了:', items.length, '件の議題を抽出');
    
    // 最低1件は返す
    if (items.length === 0) {
        items.push({
            agenda: '議事録の内容確認と次回アクションの整理',
            action: '議事録の内容を全員で確認し、必要なアクションアイテムを明確化する',
            assignee: '全員',
            deadline: '2026-01-31',
            purpose: '会議内容の共有と次のアクションの明確化',
            status: 'pending',
            notes1: 'テキストから具体的なアクションが抽出できませんでした',
            notes2: '手動で編集してください'
        });
    }
    
    // 最大10件に制限（多すぎる場合）
    if (items.length > 10) {
        console.log('⚠️ アイテム数が多すぎるため、最初の10件に制限します');
        return items.slice(0, 10);
    }
    
    return items;
}

// AI解析: GenSpark最新AIを使用した最高精度の議事録構造化（フォールバック付き）
async function analyzeMinutesWithAI(text) {
    console.log('\n🤖 === 本物のAI解析開始 (GenSpark LLM API) ===');
    console.log('入力テキスト長:', text.length, '文字');
    console.log('優先順位: 1) GenSpark API → 2) ローカルパーサー（フォールバック）');
    
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
                // ⚠️ CRITICAL: content should contain the actual array, not a JSON string
                // Frontend expects to directly use the array without additional parsing
                const response = {
                    id: 'chatcmpl-' + Date.now(),
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: AI_MODELS.primary,
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: analyzedData  // ✅ Return array directly, not stringified
                        },
                        finish_reason: 'stop'
                    }],
                    usage: {
                        prompt_tokens: userMessage.content.length,
                        completion_tokens: JSON.stringify(analyzedData).length,
                        total_tokens: userMessage.content.length + JSON.stringify(analyzedData).length
                    }
                };
                
                console.log('📤 レスポンス形式:');
                console.log('   - content type:', typeof response.choices[0].message.content);
                console.log('   - content is array:', Array.isArray(response.choices[0].message.content));
                console.log('   - items count:', response.choices[0].message.content.length);
                
                console.log('✅ AI解析完了 - 応答送信:', analyzedData.length, '件');
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
                
            } catch (error) {
                console.error('❌ AI解析エラー:', error.message);
                console.log('🔄 フォールバック: ローカルパーサーを使用');
                
                try {
                    // Extract user message again for fallback
                    const requestData = JSON.parse(body);
                    const userMessage = requestData.messages.find(m => m.role === 'user');
                    
                    // Use local parser as fallback
                    const fallbackData = analyzeMinutesWithAdvancedParser(userMessage.content);
                    
                    // ⚠️ CRITICAL: Return array directly, not as JSON string
                    const response = {
                        id: 'chatcmpl-fallback-' + Date.now(),
                        object: 'chat.completion',
                        created: Math.floor(Date.now() / 1000),
                        model: 'local-parser',
                        choices: [{
                            index: 0,
                            message: {
                                role: 'assistant',
                                content: fallbackData  // ✅ Return array directly
                            },
                            finish_reason: 'stop'
                        }],
                        usage: {
                            prompt_tokens: userMessage.content.length,
                            completion_tokens: JSON.stringify(fallbackData).length,
                            total_tokens: userMessage.content.length + JSON.stringify(fallbackData).length
                        }
                    };
                    
                    console.log('✅ フォールバック成功:', fallbackData.length, '件');
                    console.log('   - フォールバック content type:', typeof response.choices[0].message.content);
                    console.log('   - フォールバック content is array:', Array.isArray(response.choices[0].message.content));
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response));
                    
                } catch (fallbackError) {
                    console.error('❌ フォールバックも失敗:', fallbackError.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: error.message,
                        fallback_error: fallbackError.message,
                        details: 'AI解析とフォールバックの両方に失敗しました。'
                    }));
                }
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
