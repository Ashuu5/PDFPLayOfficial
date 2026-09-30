// ============================================================
// AI DESIGN GENERATOR — HTML/CSS design banao AI se
// ============================================================

export interface DesignRequest {
  documentType: string; // "resume", "invoice", "certificate", etc.
  userData: Record<string, string>;
  styleHint?: string; // "modern", "minimal", "professional", etc.
}

// ============================================================
// GENERATE HTML DESIGN
// ============================================================
export async function generateHTMLDesign(
  request: DesignRequest
): Promise<string | null> {
  const { documentType, userData, styleHint } = request;

  const systemPrompt = `You are an expert document designer. Generate a BEAUTIFUL, PROFESSIONAL HTML document for a ${documentType}.

STYLE: ${styleHint || 'modern, professional, clean'}

USER DATA (use ALL of this — do not invent fake data):
${JSON.stringify(userData, null, 2)}

REQUIREMENTS:
1. Return ONLY the HTML code inside a <div> — no <html>, <head>, or <body> tags.
2. Include inline CSS via <style> tag inside the div.
3. A4 page size: 210mm × 297mm. Total width must be 210mm, height flexible (min 297mm).
4. Use the user data exactly as provided. If a field is empty, leave that section out.
5. Use professional design: proper spacing, typography, colors.
6. NO external fonts or images — use system fonts only (Arial, Georgia, Calibri).
7. Colors: use a professional palette (blues, grays, purples).
8. Include the following sections typical for a ${documentType}.

DESIGN IDEAS for ${documentType}:
- ${getDesignIdeas(documentType)}

Return ONLY the HTML. No explanation. No markdown code blocks.`;

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Generate a ${documentType} using this data: ${JSON.stringify(userData)}`,
          },
        ],
        systemPrompt,
        model: 'openai/gpt-oss-120b',
        maxTokens: 4000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    // Clean up code fences if AI added them
    const cleaned = content
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();

    // Extract only the <div>...</div> part
    const divMatch = cleaned.match(/<div[\s\S]*<\/div>/);
    return divMatch ? divMatch[0] : cleaned;
  } catch (error) {
    console.error('Design generation failed:', error);
    return null;
  }
}

// ============================================================
// DESIGN IDEAS PER DOCUMENT TYPE
// ============================================================
function getDesignIdeas(documentType: string): string {
  const ideas: Record<string, string> = {
    resume: `
      - Two-column layout (sidebar + main)
      - Header with name in large bold text, contact info below
      - Sidebar: photo placeholder, contact, skills, languages
      - Main: summary, experience (with dates), education, projects
      - Accent color for headings and dividers
      - Use icons or bullets for contact info`,

    invoice: `
      - Top header with company name (left) and "INVOICE" title (right)
      - Company address block and client address block
      - Invoice number, date, due date — neatly arranged
      - Items table with borders and alternate row colors
      - Total section with subtotal, tax, grand total (bold)
      - Payment terms at bottom
      - Professional blue or purple accent`,

    certificate: `
      - Landscape or portrait orientation
      - Elegant border (double line or decorative)
      - Title "CERTIFICATE OF ACHIEVEMENT" centered in large serif font
      - Recipient name in extra-large elegant text
      - Event name and description below
      - Date and signature lines at bottom
      - Gold or navy accent colors
      - Ornamental dividers`,

    'cover-letter': `
      - Single column, A4 format
      - Top: sender name and contact info (right-aligned)
      - Date below
      - Recipient name and address (left-aligned)
      - Salutation "Dear ..."
      - 3-4 body paragraphs
      - Closing "Sincerely," and signature
      - Clean, professional, minimal`,

    'business-proposal': `
      - Cover-style header with title
      - Company name and date
      - Sections: Executive Summary, Objectives, Scope, Timeline, Investment
      - Use tables for timeline and budget
      - Bullet points for objectives
      - Professional purple or blue theme`,

    'report-card': `
      - School header with name and logo placeholder
      - Student information block
      - Subjects table with grades
      - GPA and remarks section
      - Teacher/Principal signature lines
      - Clean, formal design`,

    default: `
      - Clean single or two-column layout
      - Professional header with document title
      - Well-organized sections
      - Use accent color for headings
      - Plenty of white space
      - Modern typography`,
  };

  return ideas[documentType] || ideas.default;
}

// ============================================================
// GENERATE DOCX-COMPATIBLE SIMPLE HTML
// (for the DOCX fallback — simple structure only)
// ============================================================
export function generateSimpleHTML(
  documentType: string,
  userData: Record<string, string>
): string {
  const entries = Object.entries(userData).filter(([_, v]) => v && v.trim());

  let html = `<div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 210mm;">`;

  // Title
  html += `<h1 style="color: #6D28D9; text-align: center; font-size: 28px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">${documentType}</h1>`;

  // Entries as table
  html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">`;

  entries.forEach(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

    html += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #6D28D9; width: 35%; vertical-align: top;">${label}</td>
        <td style="padding: 10px; color: #374151;">${value}</td>
      </tr>
    `;
  });

  html += `</table>`;

  // Footer
  html += `<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #6D28D9; text-align: center; font-size: 11px; color: #9CA3AF;">Generated by PDFplayOfficial AI</div>`;

  html += `</div>`;
  return html;
}

// ============================================================
// DOCUMENT TYPE MATCHER
// ============================================================
export function getDocumentTypeFromTemplate(templateId: string): string {
  const map: Record<string, string> = {
    'ats-resume': 'resume',
    'modern-resume': 'resume',
    'europass-cv': 'resume',
    'cover-letter': 'cover-letter',
    'invoice': 'invoice',
    'quotation': 'invoice',
    'purchase-order': 'invoice',
    'business-proposal': 'business-proposal',
    'contract': 'business-proposal',
    'letterhead': 'cover-letter',
    'meeting-minutes': 'business-proposal',
    'report-card': 'report-card',
    'certificate': 'certificate',
    'admission-form': 'report-card',
    'transfer-certificate': 'certificate',
    'character-certificate': 'certificate',
    'bonafide': 'certificate',
    'fee-receipt': 'invoice',
    'student-id': 'certificate',
    'reference-letter': 'cover-letter',
    'experience-letter': 'certificate',
    'resignation-letter': 'cover-letter',
  };

  return map[templateId] || 'document';
}