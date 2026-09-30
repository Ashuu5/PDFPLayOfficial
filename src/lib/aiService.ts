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
  // PDF Tools
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
  // AI Tools
  {
    toolName: 'AI Excel',
    route: '/ai-excel',
    keywords: [
      'ai excel', 'excel', 'excel file', 'excel report', 'excel sheet',
      'spreadsheet', 'make excel', 'create excel', 'excel banao',
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
// TOOL MATCHER — Keyword se tool dhoondo
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

  // Kam se kam 4 characters match chahiye
  return bestScore >= 4 ? bestMatch : null;
}

// ============================================================
// AI CHAT — Groq/Gemini API call
// ============================================================
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  try {
    // Try Gemini first (longer context)
    const geminiResponse = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt:
          systemPrompt ||
          'You are PDFplayOfficial AI Assistant. You help users with PDF tools and document generation. Reply in the SAME LANGUAGE the user writes in (English, Roman Urdu, Urdu, Hindi, Arabic, etc). Be helpful, concise, and professional.',
      }),
    });

    if (geminiResponse.ok) {
      const data = await geminiResponse.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    }

    // Fallback to Groq
    const groqResponse = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        systemPrompt:
          systemPrompt ||
          'You are PDFplayOfficial AI Assistant. You help users with PDF tools and document generation. Reply in the SAME LANGUAGE the user writes in.',
        model: 'openai/gpt-oss-120b',
      }),
    });

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    }

    return 'Sorry, I could not process your request. Please try again.';
  } catch (error) {
    return 'Sorry, something went wrong. Please try again.';
  }
}