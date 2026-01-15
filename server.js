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
                const config = loadOpenAIConfig();
                const requestData = JSON.parse(body);
                
                // Make request to OpenAI API
                const https = require('https');
                const url = require('url');
                const apiUrl = new url.URL(config.base_url + '/chat/completions');
                
                const options = {
                    hostname: apiUrl.hostname,
                    port: 443,
                    path: apiUrl.pathname,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.api_key}`
                    }
                };
                
                const proxyReq = https.request(options, (proxyRes) => {
                    let responseData = '';
                    proxyRes.on('data', chunk => {
                        responseData += chunk;
                    });
                    proxyRes.on('end', () => {
                        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(responseData);
                    });
                });
                
                proxyReq.on('error', (error) => {
                    console.error('Proxy request error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                });
                
                proxyReq.write(JSON.stringify(requestData));
                proxyReq.end();
            } catch (error) {
                console.error('Error handling proxy request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
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
