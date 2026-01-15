#!/bin/bash

echo "=================================="
echo "GenSpark APIキー診断ツール"
echo "=================================="
echo ""

# Check OPENAI_API_KEY
if [ -n "$OPENAI_API_KEY" ]; then
    if [[ "$OPENAI_API_KEY" == gsk-* ]]; then
        echo "✅ OPENAI_API_KEY: 有効なGenSparkトークン (${OPENAI_API_KEY:0:15}...)"
    else
        echo "⚠️  OPENAI_API_KEY: 無効な形式 (${OPENAI_API_KEY:0:15}...)"
    fi
else
    echo "❌ OPENAI_API_KEY: 未設定"
fi

# Check GENSPARK_TOKEN
if [ -n "$GENSPARK_TOKEN" ]; then
    if [[ "$GENSPARK_TOKEN" == gsk-* ]]; then
        echo "✅ GENSPARK_TOKEN: 有効なGenSparkトークン (${GENSPARK_TOKEN:0:15}...)"
    else
        echo "⚠️  GENSPARK_TOKEN: 無効な形式 (${GENSPARK_TOKEN:0:15}...)"
    fi
else
    echo "❌ GENSPARK_TOKEN: 未設定"
fi

# Check config file
echo ""
echo "Config File (~/.genspark_llm.yaml):"
if [ -f ~/.genspark_llm.yaml ]; then
    cat ~/.genspark_llm.yaml
else
    echo "❌ 設定ファイルが存在しません"
fi

echo ""
echo "=================================="
echo "診断完了"
echo "=================================="
