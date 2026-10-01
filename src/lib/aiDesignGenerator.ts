// ============================================================
// AI DESIGN GENERATOR — HTML/CSS design banao AI se
// User ki SAARI details include karo
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

  // Filter out empty fields
  const filledData: Record<string, string> = {};
  Object.entries(userData).forEach(([key, value]) => {
    if (value && value.trim() && key !== 'photo') {
      filledData[key] = value.trim();
    }
  });

  const hasPhoto = userData.photo && userData.photo.startsWith('data:image');

  const systemPrompt = `You are an expert document designer. Your job is to create a BEAUTIFUL, PROFESSIONAL, PRINT-READY document using the user's EXACT data.

═══════════════════════════════════════════════
DOCUMENT TYPE: ${documentType}
STYLE: ${styleHint || 'modern, elegant, professional, clean'}
═══════════════════════════════════════════════

USER'S DATA (USE EVERY SINGLE FIELD — DO NOT SKIP, DO NOT INVENT):
${JSON.stringify(filledData, null, 2)}

${hasPhoto ? '⭐ The user provided a photo (base64). Include it as: <img src="' + userData.photo + '" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;" />' : '⭐ User did NOT provide a photo. DO NOT add any photo placeholder.'}

═══════════════════════════════════════════════
CRITICAL RULES — FOLLOW EXACTLY:
═══════════════════════════════════════════════

1. ⚠️ USE THE USER'S EXACT DATA — every single field, every single value.
   - If user gave name "Ali Khan" → write "Ali Khan", NOT "John Smith"
   - If user gave email "ali@email.com" → write it, NOT a placeholder
   - DO NOT INVENT any data that user didn't provide
   - DO NOT USE sample names like "John Smith" or fake data

2. ⚠️ MISSING FIELDS — if a field is EMPTY in the data:
   - COMPLETELY OMIT that section/line from the design
   - Example: user has no email → don't show "Email:" line at all
   - Do NOT write placeholders like "[Your Email]" or "you@email.com"

3. ⚠️ Return ONLY the HTML — inside a <div> — no <html>, <head>, or <body> tags.

4. ⚠️ Use INLINE CSS via a <style> tag inside the div.

5. ⚠️ A4 page size: 210mm × 297mm (width 210mm, min-height 297mm).

6. ⚠️ NO external fonts or images — system fonts only (Arial, Georgia, Calibri).

7. ⚠️ Use professional design: proper spacing, typography, colors.
   - Colors: professional palette (navy blues, grays, purples, emerald greens)

8. ⚠️ NO markdown, NO code fences, NO explanations — just the HTML.

═══════════════════════════════════════════════
LAYOUT GUIDANCE FOR ${documentType.toUpperCase()}:
═══════════════════════════════════════════════
${getDesignGuidance(documentType)}

═══════════════════════════════════════════════
EXAMPLE STRUCTURE (adapt to user's data):
═══════════════════════════════════════════════
<div style="width: 210mm; min-height: 297mm; padding: 20mm; font-family: Arial; background: white;">
  <style>
    .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 15mm; color: white; }
    .section-title { color: #1e3a8a; font-size: 14pt; font-weight: bold; margin-top: 8mm; border-bottom: 2px solid #3b82f6; padding-bottom: 2mm; }
    .info-row { margin: 2mm 0; font-size: 11pt; color: #374151; }
    .info-label { color: #6b7280; font-weight: bold; }
  </style>

  <!-- Header with user's name -->
  <div class="header">
    <h1 style="margin: 0; font-size: 24pt;">${filledData.fullName || filledData.name || 'THEIR NAME'}</h1>
    <p style="margin: 2mm 0 0; opacity: 0.9;">${filledData.jobTitle || ''}</p>
  </div>

  <!-- Contact info — ONLY fields user provided -->
  <div style="margin-top: 5mm;">
    ${filledData.email ? `<div class="info-row"><span class="info-label">Email:</span> ${filledData.email}</div>` : ''}
    ${filledData.phone ? `<div class="info-row"><span class="info-label">Phone:</span> ${filledData.phone}</div>` : ''}
    ${filledData.location ? `<div class="info-row"><span class="info-label">Location:</span> ${filledData.location}</div>` : ''}
  </div>

  <!-- More sections based on data -->
</div>

Now generate the ${documentType} with ALL of the user's data above.`;

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Generate a beautiful ${documentType} using this data: ${JSON.stringify(filledData)}`,
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
// DESIGN GUIDANCE PER DOCUMENT TYPE
// ============================================================
function getDesignGuidance(documentType: string): string {
  const guidance: Record<string, string> = {
    resume: `
- Two-column layout (left sidebar 35%, main 65%) OR single-column elegant
- Header: full name in large bold, job title below, contact info
- Sections in main: Summary, Experience (with dates), Education, Skills, Projects
- Sidebar: contact info, skills, languages, certifications
- Accent color: navy blue or emerald green
- Use horizontal dividers between sections
- Dates on the right, job title in bold, company in italic
- Bullet points for achievements`,

    invoice: `
- Top row: company name (left) | "INVOICE" title (right, large)
- Below: company address block (left) | invoice # + date + due date (right)
- "Bill To" section with client name and address
- Items table: #, Description, Quantity, Unit Price, Amount — with borders
- Table styling: header row with dark background + white text, alternate row shading
- Subtotal, Tax, Discount, TOTAL — right-aligned
- Payment terms at bottom
- Accent: navy blue or purple`,

    certificate: `
- Elegant ornate border (double-line or decorative)
- Portrait or landscape
- Center: "CERTIFICATE OF ACHIEVEMENT" in large serif font
- Recipient name in extra-large elegant italic script-like font
- Below: description of achievement
- Date and signature lines at bottom
- Gold or navy accent colors
- Ornamental dividers (• ─ •) between sections`,

    'cover-letter': `
- Single column, A4 format
- Sender info at top (right-aligned or left)
- Date below sender info
- Recipient name and address (left)
- "Dear [Recipient]," salutation
- 3-4 body paragraphs with proper spacing (line-height 1.6)
- "Sincerely," closing
- Signature line
- Clean, minimal, professional`,

    'business-proposal': `
- Cover-style header with project title in large text
- Company name and date
- Sections: Executive Summary, Objectives (bullets), Scope of Work, Timeline (table), Investment (table), Why Choose Us
- Use tables for timeline and budget
- Use bullet points for objectives
- Purple or navy accent theme`,

    'report-card': `
- School header with name, tagline, logo placeholder
- Student info block (2-column table)
- Subjects table: Subject | Term 1 | Term 2 | Final | Grade
- Alternating row colors
- GPA and overall percentage
- Remarks section
- Teacher and Principal signature lines
- Clean, formal`,

    default: `
- Clean single or two-column layout
- Header with document title and user's name
- Well-organized sections with dividers
- Use accent color for headings
- Plenty of white space
- Modern typography with clear hierarchy`,
  };

  return guidance[documentType] || guidance.default;
}

// ============================================================
// FALLBACK — Simple HTML
// ============================================================
export function generateSimpleHTML(
  documentType: string,
  userData: Record<string, string>
): string {
  const entries = Object.entries(userData).filter(
    ([key, v]) => v && v.trim() && key !== 'photo'
  );

  const name =
    userData.fullName || userData.name || userData.companyName || documentType;

  let html = `<div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 210mm; min-height: 297mm; background: white;">`;

  // Header
  html += `
    <div style="background: linear-gradient(135deg, #6D28D9, #8B5CF6); padding: 30px; color: white; border-radius: 8px; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${name}</h1>
      <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">${documentType}</p>
    </div>
  `;

  // Data table
  html += `<table style="width: 100%; border-collapse: collapse;">`;

  entries.forEach(([key, value]) => {
    if (key === 'fullName' || key === 'name') return;

    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

    html += `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; font-weight: bold; color: #6D28D9; width: 35%; vertical-align: top;">${label}</td>
        <td style="padding: 12px; color: #374151;">${value}</td>
      </tr>
    `;
  });

  html += `</table>`;

  html += `<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #6D28D9; text-align: center; font-size: 11px; color: #9CA3AF;">Generated by PDFplayOfficial AI</div>`;

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
    'cover-letter': 'cover-letter',
    invoice: 'invoice',
    quotation: 'invoice',
    'purchase-order': 'invoice',
    'business-proposal': 'business-proposal',
    contract: 'business-proposal',
    letterhead: 'cover-letter',
    'meeting-minutes': 'business-proposal',
    'report-card': 'report-card',
    certificate: 'certificate',
    'admission-form': 'report-card',
    'transfer-certificate': 'certificate',
    'character-certificate': 'certificate',
    bonafide: 'certificate',
    'fee-receipt': 'invoice',
    'student-id': 'certificate',
    'reference-letter': 'cover-letter',
    'experience-letter': 'certificate',
    'resignation-letter': 'cover-letter',
  };

  return map[templateId] || 'document';
}