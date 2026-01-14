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
            return {
                api_key: config?.openai?.api_key || process.env.OPENAI_API_KEY,
                base_url: config?.openai?.base_url || process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
            };
        }
    } catch (error) {
        console.error('Error loading OpenAI config:', error);
    }
    
    // Fallback to environment variables
    return {
        api_key: process.env.OPENAI_API_KEY,
        base_url: process.env.OPENAI_BASE_URL || 'https://www.genspark.ai/api/llm_proxy/v1'
    };
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
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
    
    // Serve static files
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './minutes-app-enhanced.html';
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
                res.end('<h1>404 Not Found</h1>', 'utf-8');
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
