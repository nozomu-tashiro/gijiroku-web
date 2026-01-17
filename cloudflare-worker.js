/**
 * Cloudflare Worker for OpenAI API Proxy
 * 
 * このWorkerは、GitHub PagesからOpenAI APIへのリクエストを中継します。
 * APIキーはCloudflare環境変数に保存され、フロントエンドには公開されません。
 */

export default {
  async fetch(request, env) {
    // CORSヘッダーを設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // プリフライトリクエストに対応
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // POSTリクエストのみ受け付ける
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // リクエストボディを取得
      const body = await request.json();
      const { text } = body;

      if (!text) {
        return new Response(JSON.stringify({ error: 'Text is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // OpenAI APIキーを環境変数から取得
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OPENAI_API_KEY is not set');
        return new Response(JSON.stringify({ error: 'API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // OpenAI APIにリクエストを送信
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `あなたは日本の企業の会議議事録を解析する専門家です。
以下のフォーマットで議事録を構造化データに変換してください：

各アイテムは以下の8つのフィールドを持ちます：
1. agenda: 議題・テーマ（何について話し合ったか）
2. action: 具体的なアクション（何をするか）
3. assignee: 担当者（誰がやるか）
4. deadline: 期限（いつまでにやるか、YYYY-MM-DD形式、不明な場合は空文字）
5. purpose: 目的・背景（なぜやるか）
6. status: ステータス（pending, in_progress, completed, overdue のいずれか、デフォルトはpending）
7. notes1: 補足情報1（追加の詳細）
8. notes2: 補足情報2（その他のメモ）

重要な注意点：
- 各アイテムは独立した、具体的な5W1Hが明確なアクションアイテムにする
- 抽象的な表現は避け、ビジネス文書として適切な表現にする
- statusはデフォルトでpendingにする
- deadlineは必ずYYYY-MM-DD形式、不明な場合は空文字""
- 出力は必ずJSON配列のみ（説明文は不要）

出力例：
[
  {
    "agenda": "営業目標の設定",
    "action": "2月の売上目標を300万円に設定し、営業戦略を立案する",
    "assignee": "営業部",
    "deadline": "2026-02-28",
    "purpose": "第1四半期の売上目標達成のため",
    "status": "pending",
    "notes1": "前年同月比120%を目指す",
    "notes2": "週次で進捗確認を実施"
  }
]`
            },
            {
              role: 'user',
              content: `以下の会議議事録を解析して、構造化データに変換してください：

${text}

JSON配列のみを返してください（説明文は不要）。`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        return new Response(JSON.stringify({ 
          error: 'OpenAI API error',
          details: errorText
        }), {
          status: openaiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const openaiData = await openaiResponse.json();
      
      // レスポンスから結果を抽出
      const content = openaiData.choices[0].message.content;
      
      // JSONをパース
      let parsedResult;
      try {
        parsedResult = JSON.parse(content);
      } catch (e) {
        // JSONパースに失敗した場合は、```json```で囲まれている可能性がある
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          // それでもダメな場合は、最初の[から最後の]までを抽出
          const arrayMatch = content.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            parsedResult = JSON.parse(arrayMatch[0]);
          } else {
            throw new Error('Failed to parse JSON from OpenAI response');
          }
        }
      }

      // 成功レスポンスを返す
      return new Response(JSON.stringify({
        success: true,
        data: parsedResult
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
