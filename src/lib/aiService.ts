// ============================================================
// AI SERVICE — Groq API for AI Assistant
// ============================================================

// ============================================================
// TYPES
// ============================================================
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================
// SYSTEM PROMPT — ChatGPT-like behavior
// ============================================================
const SYSTEM_PROMPT = `You are a helpful, friendly, and knowledgeable AI assistant — like ChatGPT.

CORE BEHAVIOR:
1. Answer the user's question directly and completely.
2. Be conversational, warm, and natural.
3. Give detailed answers when helpful, short answers when appropriate.
4. Use proper formatting: markdown with **bold**, bullet points (•), numbered lists (1.), and clear paragraphs.
5. For long answers, break into sections with headings (## Section Title).
6. If the user asks for code, provide it in a clear format.
7. If you don't know something, be honest — don't make things up.
8. NEVER give robotic or template-like answers. Be human.
9. Match the user's tone — casual if they're casual, formal if they're formal.

LANGUAGE RULES:
1. Reply in the EXACT SAME language/script the user used.
2. Roman Urdu (English letters like "kesy ho") → reply in Roman Urdu.
3. English → English.
4. Urdu script (اردو) → Urdu script.
5. Hindi script (हिंदी) → Hindi script.
6. NEVER mix languages. Roman Urdu is NOT Hindi.

WHAT YOU CAN DO:
- Answer general knowledge questions
- Help with writing, editing, brainstorming
- Explain concepts clearly
- Provide coding help
- Give advice and recommendations
- Have natural conversations

Be helpful. Be natural. Be ChatGPT-like.`;

// ============================================================
// MAIN: Ask AI
// ============================================================
export async function askAI(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const finalSystemPrompt = systemPrompt || SYSTEM_PROMPT;

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt: finalSystemPrompt,
        model: 'openai/gpt-oss-120b',
        maxTokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return 'Sorry, I could not process your request. Please try again.';
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (content && content.trim()) {
      return content;
    }

    return 'Sorry, I received an empty response. Please try again.';
  } catch (error) {
    console.error('AI error:', error);
    return 'Sorry, something went wrong. Please try again.';
  }
}