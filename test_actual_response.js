const http = require('http');

// Simulate actual API call
const postData = JSON.stringify({
  model: 'gpt-5',
  messages: [
    { role: 'system', content: 'Test system prompt' },
    { role: 'user', content: 'Speaker 1: Wise導入について再検討したい。\nSpeaker 2: 金額条件を整理して提案する。' }
  ]
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/openai/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('=== ACTUAL API RESPONSE ===');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('\n=== RESPONSE BODY ===');
    
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed successfully!');
      console.log('\nFull response structure:');
      console.log(JSON.stringify(parsed, null, 2));
      
      console.log('\n=== CONTENT FIELD ===');
      const content = parsed.choices[0].message.content;
      console.log('Content type:', typeof content);
      console.log('Content length:', content.length);
      console.log('\nContent value (first 500 chars):');
      console.log(content.substring(0, 500));
      
      console.log('\n=== PARSING CONTENT AS JSON ===');
      const contentParsed = JSON.parse(content);
      console.log('Content parsed successfully!');
      console.log('Is array:', Array.isArray(contentParsed));
      console.log('Items count:', contentParsed.length);
      console.log('\nFirst item:');
      console.log(JSON.stringify(contentParsed[0], null, 2));
      
    } catch (error) {
      console.error('Parse error:', error.message);
      console.log('\nRaw data:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();
