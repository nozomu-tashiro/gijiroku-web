#!/bin/bash

echo "🔍 GenSpark LLM API 接続テスト"
echo "=================================="
echo ""

# Test with current credentials
echo "📡 テスト1: 現在の環境変数でAPI呼び出し"
curl -s -X POST https://www.genspark.ai/api/llm_proxy/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -d '{
    "model": "gpt-5",
    "messages": [{"role": "user", "content": "こんにちは"}],
    "max_tokens": 50
  }' > /tmp/api_test1.json

if grep -q "error" /tmp/api_test1.json; then
    echo "❌ 失敗: $(cat /tmp/api_test1.json)"
else
    echo "✅ 成功！"
    cat /tmp/api_test1.json | head -10
fi

echo ""
echo "=================================="

