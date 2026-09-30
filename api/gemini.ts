// ============================================================
// GEMINI API — Serverless Function
// Deployed on Vercel at /api/gemini
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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server',
      });
    }

    const { messages, systemPrompt, model = 'gemini-3.8-flash' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'messages array is required',
      });
    }

    // Convert OpenAI-style messages to Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Build request body
    const requestBody: any = {
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return res.status(geminiResponse.status).json({
        error: 'Gemini API error',
        details: errorText,
      });
    }

    const data = await geminiResponse.json();

    // Convert Gemini response to OpenAI-compatible format
    const textContent =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: textContent,
          },
          finish_reason: data?.candidates?.[0]?.finishReason || 'stop',
        },
      ],
      usage: data?.usageMetadata || {},
      raw: data,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}