// ============================================================
// GROQ API — Serverless Function
// Deployed on Vercel at /api/groq
// ============================================================

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GROQ_API_KEY is not configured on the server',
      });
    }

const { messages, systemPrompt, model = 'openai/gpt-oss-120b' } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'messages array is required',
      });
    }

    // Build the message array with optional system prompt
    const groqMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    // Call Groq API
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 2048,
          response_format: { type: 'json_object' },
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      return res.status(groqResponse.status).json({
        error: 'Groq API error',
        details: errorText,
      });
    }

    const data = await groqResponse.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}