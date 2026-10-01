// ============================================================
// AI DESIGN GENERATOR — HTML/CSS design AI se
// ============================================================

export interface DesignRequest {
  documentType: string;
  userData: Record<string, string>;
  styleHint?: string;
}

// ============================================================
// GENERATE HTML DESIGN
// ============================================================
export async function generateHTMLDesign(
  request: DesignRequest
): Promise<string | null> {
  const { documentType, userData, styleHint } = request;

  // If we only have a raw prompt (description), parse it into structured data first
  const parsedData = await parseUserInput(userData.description || '', documentType);

  const mergedData = { ...userData, ...parsedData };
  delete mergedData.description;
  delete mergedData.aiHtml;

  const systemPrompt = `You are an HTML designer. Generate a clean, professional HTML document.

DOCUMENT TYPE: ${documentType}

DATA TO DISPLAY:
${JSON.stringify(mergedData, null, 2)}

RULES:
1. Return ONLY valid HTML — a single <div> with inline styles or a <style> tag inside.
2. A4 size: width 210mm, min-height 297mm.
3. Use ${styleHint || 'modern, professional, clean'} style.
4. NO external fonts or images. Use Arial, Georgia, or Calibri.
5. Use ALL the data provided — do not invent fake data.
6. If a data field is empty, OMIT that section.
7. NO markdown, NO code fences, NO explanations. Just HTML.

Return the HTML now.`;

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Generate a beautiful ${documentType} with this data:\n\n${JSON.stringify(mergedData, null, 2)}`,
          },
        ],
        systemPrompt,
        model: 'openai/gpt-oss-120b',
        maxTokens: 6000,
      }),
    });

    if (!response.ok) {
      console.error('Groq failed:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content from Groq');
      return null;
    }

    // Clean
    const cleaned = content
      .replace(/```html/gi, '')
      .replace(/```/g, '')
      .trim();

    // Extract <div>...</div> or <style>...</style><div>...</div>
    const divMatch = cleaned.match(/<div[\s\S]*<\/div>/i);
    if (divMatch) return divMatch[0];

    const styleDivMatch = cleaned.match(/<style[\s\S]*?<\/style>[\s\S]*?<div[\s\S]*<\/div>/i);
    if (styleDivMatch) return styleDivMatch[0];

    // If content has HTML tags, return as-is
    if (cleaned.includes('<') && cleaned.includes('>')) return cleaned;

    console.error('No HTML found:', cleaned.substring(0, 200));
    return null;
  } catch (error) {
    console.error('Design generation failed:', error);
    return null;
  }
}

// ============================================================
// PARSE USER INPUT — Raw text se structured JSON
// ============================================================
async function parseUserInput(
  rawInput: string,
  documentType: string
): Promise<Record<string, string>> {
  if (!rawInput || rawInput.trim().length === 0) return {};

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: rawInput,
          },
        ],
        systemPrompt: `Extract structured data from this request for a ${documentType}.

Return ONLY valid JSON with these fields:
{
  "title": "document title",
  "recipientName": "person's name if mentioned",
  "schoolName": "school/organization name if mentioned",
  "className": "class/grade if mentioned",
  "marks": "marks/percentage if mentioned",
  "date": "today's date in format like January 15, 2025",
  "details": "any other important details"
}

If a field is not mentioned, use an empty string "".

Return ONLY the JSON. No explanation.`,
        model: 'openai/gpt-oss-120b',
        maxTokens: 500,
      }),
    });

    if (!response.ok) return {};

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return {};

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};

    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
}

// ============================================================
// FALLBACK — Simple HTML
// ============================================================
export function generateSimpleHTML(
  documentType: string,
  userData: Record<string, string>
): string {
  const entries = Object.entries(userData).filter(
    ([key, v]) => v && v.trim() && key !== 'photo' && key !== 'aiHtml'
  );

  const title = userData.title || documentType.replace(/-/g, ' ');
  const recipientName = userData.recipientName || userData.fullName || userData.studentName || '';

  let html = `<div style="font-family: Arial, sans-serif; padding: 40px; color: #333; width: 210mm; min-height: 297mm; background: white; box-sizing: border-box;">`;

  // Decorative header
  html += `
    <div style="border-bottom: 3px solid #6D28D9; padding-bottom: 15px; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 32px; color: #6D28D9; text-transform: capitalize; letter-spacing: 1px;">${title}</h1>
      ${recipientName ? `<p style="margin: 8px 0 0; font-size: 16px; color: #6b7280;">For: <strong style="color: #111827;">${recipientName}</strong></p>` : ''}
    </div>
  `;

  // Content as clean table
  html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">`;

  entries.forEach(([key, value]) => {
    if (key === 'title' || key === 'recipientName') return;

    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

    html += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; font-weight: 600; color: #6D28D9; width: 30%; vertical-align: top; font-size: 14px;">${label}</td>
        <td style="padding: 12px 8px; color: #374151; font-size: 14px;">${value}</td>
      </tr>
    `;
  });

  html += `</table>`;

  // Footer
  html += `
    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
      <div style="text-align: center;">
        <div style="border-top: 1px solid #111827; width: 180px; padding-top: 5px; font-size: 12px; color: #6b7280;">Authorized Signature</div>
      </div>
      <div style="text-align: center;">
        <div style="border-top: 1px solid #111827; width: 180px; padding-top: 5px; font-size: 12px; color: #6b7280;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>
  `;

  html += `<div style="margin-top: 40px; text-align: center; font-size: 10px; color: #9CA3AF;">Generated by PDFplayOfficial AI</div>`;

  html += `</div>`;
  return html;
}

// ============================================================
// DOCUMENT TYPE FROM TEMPLATE
// ============================================================
export function getDocumentTypeFromTemplate(templateId: string): string {
  const map: Record<string, string> = {
    'ats-resume': 'resume',
    'modern-resume': 'resume',
    'europass-cv': 'resume',
    'cover-letter': 'cover letter',
    invoice: 'invoice',
    quotation: 'quotation',
    'purchase-order': 'purchase order',
    'business-proposal': 'business proposal',
    contract: 'contract agreement',
    letterhead: 'letter',
    'meeting-minutes': 'meeting minutes',
    'report-card': 'result card',
    certificate: 'certificate',
    'admission-form': 'admission form',
    'transfer-certificate': 'transfer certificate',
    'character-certificate': 'character certificate',
    bonafide: 'bonafide certificate',
    'fee-receipt': 'fee receipt',
    'student-id': 'student id card',
    'reference-letter': 'reference letter',
    'experience-letter': 'experience letter',
    'resignation-letter': 'resignation letter',
  };

  return map[templateId] || 'document';
}