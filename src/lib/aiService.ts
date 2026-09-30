// ============================================================
// AI SERVICE — Tool matching + Groq/Gemini API calls
// ============================================================

// ============================================================
// TOOL MAP — Website ke saare tools
// ============================================================
export interface ToolMatch {
  toolName: string;
  route: string;
  keywords: string[];
}

export const AVAILABLE_TOOLS: ToolMatch[] = [
  {
    toolName: 'Merge PDF',
    route: '/merge-pdf',
    keywords: ['merge', 'combine', 'join pdf', 'merge pdf', 'combine pdf'],
  },
  {
    toolName: 'Split PDF',
    route: '/split-pdf',
    keywords: ['split', 'split pdf', 'separate pdf', 'break pdf'],
  },
  {
    toolName: 'Compress PDF',
    route: '/compress-pdf',
    keywords: ['compress', 'reduce size', 'shrink pdf', 'compress pdf'],
  },
  {
    toolName: 'Rotate PDF',
    route: '/rotate-pdf',
    keywords: ['rotate', 'rotate pdf', 'turn pdf'],
  },
  {
    toolName: 'Protect PDF',
    route: '/protect-pdf',
    keywords: ['protect', 'password', 'protect pdf', 'encrypt pdf', 'lock pdf'],
  },
  {
    toolName: 'Unlock PDF',
    route: '/unlock-pdf',
    keywords: ['unlock', 'remove password', 'unlock pdf', 'decrypt pdf'],
  },
  {
    toolName: 'PDF to Word',
    route: '/pdf-to-word',
    keywords: ['pdf to word', 'pdf to doc', 'pdf to docx'],
  },
  {
    toolName: 'Word to PDF',
    route: '/word-to-pdf',
    keywords: ['word to pdf', 'doc to pdf', 'docx to pdf'],
  },
  {
    toolName: 'PDF to Excel',
    route: '/pdf-to-excel',
    keywords: ['pdf to excel', 'pdf to xls', 'pdf to xlsx'],
  },
  {
    toolName: 'Excel to PDF',
    route: '/excel-to-pdf',
    keywords: ['excel to pdf', 'xls to pdf', 'xlsx to pdf'],
  },
  {
    toolName: 'PDF to JPG',
    route: '/pdf-to-jpg',
    keywords: ['pdf to jpg', 'pdf to image', 'pdf to png', 'pdf to jpeg'],
  },
  {
    toolName: 'JPG to PDF',
    route: '/jpg-to-pdf',
    keywords: ['jpg to pdf', 'image to pdf', 'png to pdf', 'jpeg to pdf'],
  },
  {
    toolName: 'PDF to PowerPoint',
    route: '/pdf-to-powerpoint',
    keywords: ['pdf to powerpoint', 'pdf to ppt', 'pdf to pptx'],
  },
  {
    toolName: 'PowerPoint to PDF',
    route: '/powerpoint-to-pdf',
    keywords: ['powerpoint to pdf', 'ppt to pdf', 'pptx to pdf'],
  },
  {
    toolName: 'OCR PDF',
    route: '/ocr-pdf',
    keywords: ['ocr', 'extract text', 'ocr pdf', 'read text from pdf'],
  },
  {
    toolName: 'Sign PDF',
    route: '/pdf-sign',
    keywords: ['sign', 'signature', 'sign pdf', 'electronic signature'],
  },
  {
    toolName: 'Watermark PDF',
    route: '/watermark-pdf',
    keywords: ['watermark', 'watermark pdf', 'add watermark'],
  },
  {
    toolName: 'Crop PDF',
    route: '/crop-pdf',
    keywords: ['crop', 'crop pdf', 'trim pdf margins'],
  },
  {
    toolName: 'Organize PDF',
    route: '/organize-pdf',
    keywords: ['organize', 'reorder', 'organize pdf', 'rearrange pages'],
  },
  {
    toolName: 'Extract Pages',
    route: '/extract-pages',
    keywords: ['extract', 'extract pages', 'get pages'],
  },
  {
    toolName: 'PDF Editor',
    route: '/pdf-editor',
    keywords: ['edit pdf', 'pdf editor', 'modify pdf'],
  },
  {
    toolName: 'Metadata Editor',
    route: '/metadata-editor',
    keywords: ['metadata', 'pdf metadata', 'edit metadata'],
  },
  {
    toolName: 'AI Excel',
    route: '/ai-excel',
    keywords: [
      'ai excel', 'excel', 'excel file', 'excel report', 'excel sheet',
      'spreadsheet', 'make excel', 'create excel',
      'sales report', 'invoice sheet', 'data sheet',
    ],
  },
  {
    toolName: 'AI Doc',
    route: '/ai-doc',
    keywords: [
      'ai doc', 'document', 'cv', 'resume', 'invoice', 'proposal',
      'cover letter', 'ats resume', 'europass', 'contract',
      'report card', 'certificate', 'admission form', 'id card',
      'make cv', 'make resume', 'create document', 'make document',
    ],
  },
];

// ============================================================
// TOOL MATCHER
// ============================================================
export function findToolMatch(userInput: string): ToolMatch | null {
  const lower = userInput.toLowerCase().trim();

  let bestMatch: ToolMatch | null = null;
  let bestScore = 0;

  AVAILABLE_TOOLS.forEach((tool) => {
    let score = 0;
    tool.keywords.forEach((keyword) => {
      if (lower.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = tool;
    }
  });

  return bestScore >= 4 ? bestMatch : null;
}

// ============================================================
// SYSTEM PROMPT — ChatGPT-style assistant
// ============================================================
const SYSTEM_PROMPT = `You are a smart, friendly, helpful AI assistant — like ChatGPT or DeepSeek. You can answer ANY question on ANY topic: general knowledge, coding, math, science, history, writing, translation, business, health, education, and more.

LANGUAGE RULES (MOST IMPORTANT):
1. ALWAYS reply in the EXACT same language and script the user used.
2. If user writes in ROMAN URDU (English letters like "kesy ho", "kya haal hai", "bhai") → reply ONLY in ROMAN URDU (English letters). NEVER use Hindi Devanagari (हिंदी) script.
3. If user writes in ENGLISH → reply ONLY in ENGLISH.
4. If user writes in URDU script (اردو) → reply ONLY in URDU script.
5. If user writes in HINDI Devanagari (हिंदी) → reply in HINDI Devanagari.
6. If user writes in ARABIC script → reply in ARABIC.
7. NEVER mix scripts. Roman Urdu is NOT Hindi.

EXAMPLES:
- User: "kesy ho" → Reply: "Main theek hoon! Aap kaise hain? Kuch poochna hai ya koi madad chahiye?"
- User: "Hello" → Reply: "Hello! How can I help you today?"
- User: "آپ کیسے ہیں" → Reply: "میں ٹھیک ہوں! آپ کیسے ہیں؟"
- User: "आप कैसे हैं" → Reply: "मैं ठीक हूँ! आप कैसे हैं?"

BEHAVIOR:
- Answer the user's actual question directly and completely.
- Be conversational, warm, and helpful.
- For long answers, use clear structure with bullet points or numbered lists.
- If you don't know something, say so honestly.
- Do NOT redirect to PDF tools unless the user asks about PDFs.

You are a general-purpose assistant. Talk about anything.`;

// ============================================================
// AI CHAT
// ============================================================
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const finalSystemPrompt = systemPrompt || SYSTEM_PROMPT;

  // Try Gemini first
  try {
    const geminiResponse = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt: finalSystemPrompt,
      }),
    });

    if (geminiResponse.ok) {
      const data = await geminiResponse.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && content.trim()) return content;
    }
  } catch (err) {
    // Continue to Groq
  }

  // Fallback to Groq
  try {
    const groqResponse = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt: finalSystemPrompt,
        model: 'openai/gpt-oss-120b',
      }),
    });

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && content.trim()) return content;
    }
  } catch (err) {
    // Both failed
  }

  return 'Sorry, something went wrong. Please try again.';
}