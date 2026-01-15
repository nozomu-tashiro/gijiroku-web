export async function onRequest(context) {
  const { env } = context;
  
  return new Response(JSON.stringify({
    api_key: env.GENSPARK_TOKEN || env.OPENAI_API_KEY || '',
    base_url: 'https://www.genspark.ai/api/llm_proxy/v1'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
