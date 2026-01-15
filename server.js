const http = require('http');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');

const PORT = 8080;

// Load OpenAI config from ~/.genspark_llm.yaml
function loadOpenAIConfig() {
    try {
        const configPath = path.join(os.homedir(), '.genspark_llm.yaml');
        if (fs.existsSync(configPath)) {
            const fileContents = fs.readFileSync(configPath, 'utf8');
            const config = yaml.load(fileContents);
            
            // Expand environment variables
            let apiKey = config?.openai?.api_key || process.env.OPENAI_API_KEY;
            if (apiKey && apiKey.includes('${')) {
                // Replace ${VAR_NAME} with actual environment variable value
                apiKey = apiKey.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                    return process.env[varName] || match;
                });
            }
            
            let baseUrl = config?.openai?.base_url || process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1';
            if (baseUrl && baseUrl.includes('${')) {
                baseUrl = baseUrl.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                    return process.env[varName] || match;
                });
            }
            
            return {
                api_key: apiKey,
                base_url: baseUrl
            };
        }
    } catch (error) {
        console.error('Error loading OpenAI config:', error);
    }
    
    // Fallback to environment variables
    return {
        api_key: process.env.OPENAI_API_KEY || process.env.GENSPARK_TOKEN,
        base_url: process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
    };
}

// Simple text parser for meeting minutes
function parseMinutesText(text) {
    const result = [];
    
    // Extract lines
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentItem = null;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip headers and empty lines
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('議事録テキスト')) {
            continue;
        }
        
        // Check for bullet points (•, *, -, number.)
        const bulletMatch = trimmed.match(/^[•\*\-]|\d+\./);
        if (bulletMatch || trimmed.includes('：') || trimmed.includes(':')) {
            // Extract information
            let agenda = '';
            let assignee = '';
            let deadline = '';
            let action = '';
            
            // Remove bullet point
            let content = trimmed.replace(/^[•\*\-]\s*/, '').replace(/^\d+\.\s*/, '');
            
            // Extract assignee (担当:, 担当者:, etc.)
            const assigneeMatch = content.match(/担当[者]?[：:]\s*([^、,，。\s]+)/);
            if (assigneeMatch) {
                assignee = assigneeMatch[1];
                content = content.replace(assigneeMatch[0], '');
            }
            
            // Extract deadline (期限:, 期日:, etc.)
            const deadlineMatch = content.match(/期[限日][：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}[日]?|\d{4}-\d{2}-\d{2})/);
            if (deadlineMatch) {
                let dateStr = deadlineMatch[1];
                // Convert Japanese date to YYYY-MM-DD
                dateStr = dateStr.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');
                deadline = dateStr;
                content = content.replace(deadlineMatch[0], '');
            }
            
            // Extract action and agenda
            const colonMatch = content.match(/^([^：:]+)[：:](.+)/);
            if (colonMatch) {
                agenda = colonMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
                action = colonMatch[2].trim();
            } else {
                agenda = content.replace(/^\*\*|\*\*$/g, '').trim();
                action = content.replace(/^\*\*|\*\*$/g, '').trim();
            }
            
            // Clean up
            agenda = agenda.replace(/[。、，\s]+$/, '');
            action = action.replace(/[。、，\s]+$/, '');
            
            if (agenda) {
                result.push({
                    agenda: agenda,
                    action: action || agenda,
                    assignee: assignee || '',
                    deadline: deadline || '',
                    purpose: '',
                    status: 'pending',
                    notes1: '',
                    notes2: ''
                });
            }
        }
    }
    
    // If no items found, create a default item
    if (result.length === 0) {
        result.push({
            agenda: '議事録の内容',
            action: 'テキストから自動抽出できませんでした。手動で編集してください。',
            assignee: '',
            deadline: '',
            purpose: '',
            status: 'pending',
            notes1: '',
            notes2: ''
        });
    }
    
    return result;
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
    
    // Handle OpenAI API proxy
    if (req.url === '/api/openai/chat/completions' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const requestData = JSON.parse(body);
                const userMessage = requestData.messages.find(m => m.role === 'user')?.content || '';
                
                console.log('AI Analysis request received');
                console.log('User message length:', userMessage.length);
                
                // Simple rule-based parsing for demo purposes
                const parsedData = parseMinutesText(userMessage);
                
                // Return mock OpenAI-style response
                const response = {
                    id: 'chatcmpl-' + Date.now(),
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: 'gpt-5',
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: JSON.stringify(parsedData, null, 2)
                        },
                        finish_reason: 'stop'
                    }]
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            } catch (error) {
                console.error('Error handling AI analysis:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
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
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`OpenAI config loaded:`, loadOpenAIConfig().api_key ? 'API key found' : 'No API key');
});
