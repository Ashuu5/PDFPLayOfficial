// ============================================================
// AI EXTRACTOR — User prompt se structured data nikaalo
// ============================================================

export interface ExtractedData {
  [key: string]: string;
}

// Har template ke liye expected fields
export const TEMPLATE_FIELDS: Record<string, string[]> = {
  'ats-resume': [
    'fullName', 'jobTitle', 'email', 'phone', 'location',
    'linkedin', 'summary', 'experience', 'education', 'skills',
  ],
  'modern-resume': [
    'fullName', 'jobTitle', 'email', 'phone', 'location',
    'about', 'experience', 'skills', 'education', 'awards',
  ],
  'europass-cv': [
    'fullName', 'address', 'phone', 'email', 'nationality',
    'dateOfBirth', 'workExperience', 'education', 'languageSkills', 'digitalSkills',
  ],
  'cover-letter': [
    'fullName', 'address', 'email', 'phone',
    'recipientName', 'recipientTitle', 'company', 'companyAddress',
    'jobTitle', 'bodyParagraphs',
  ],
  'invoice': [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
    'clientName', 'clientAddress', 'invoiceNumber', 'date', 'dueDate',
    'items', 'taxRate', 'notes',
  ],
  'business-proposal': [
    'companyName', 'clientName', 'projectTitle', 'date',
    'summary', 'objectives', 'scope', 'timeline', 'budget',
  ],
  'meeting-minutes': [
    'meetingTitle', 'date', 'time', 'location',
    'attendees', 'agenda', 'discussion', 'actionItems', 'nextMeeting',
  ],
  'contract': [
    'providerName', 'clientName', 'effectiveDate',
    'services', 'compensation', 'term', 'confidentiality',
  ],
  'letterhead': [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
    'recipientName', 'recipientTitle', 'subject', 'body',
  ],
  'report-card': [
    'schoolName', 'studentName', 'rollNumber', 'className',
    'section', 'dateOfBirth', 'fatherName', 'subjects', 'comments',
  ],
  'certificate': [
    'recipientName', 'eventName', 'date', 'location',
    'position', 'issuer', 'description',
  ],
  'admission-form': [
    'schoolName', 'studentName', 'dateOfBirth', 'gender',
    'fatherName', 'motherName', 'address', 'phone', 'lastSchool',
  ],
  'transfer-certificate': [
    'schoolName', 'studentName', 'fatherName', 'dateOfBirth',
    'admissionNumber', 'className', 'dateOfLeaving', 'reason',
  ],
  'character-certificate': [
    'schoolName', 'studentName', 'fatherName',
    'className', 'periodOfStudy', 'conduct',
  ],
  'bonafide': [
    'schoolName', 'studentName', 'fatherName', 'dateOfBirth',
    'className', 'session', 'purpose',
  ],
  'fee-receipt': [
    'schoolName', 'studentName', 'className', 'rollNumber',
    'receiptNumber', 'date', 'amount', 'paymentMethod',
  ],
  'reference-letter': [
    'recipientName', 'employeeName', 'companyName',
    'jobTitle', 'duration', 'relationship',
  ],
  'resignation-letter': [
    'fullName', 'companyName', 'managerName',
    'jobTitle', 'lastWorkingDay', 'reason',
  ],
  'experience-letter': [
    'companyName', 'employeeName', 'designation',
    'employeeId', 'dateOfJoining', 'dateOfLeaving', 'performance',
  ],
  'purchase-order': [
    'poNumber', 'date', 'expectedDelivery',
    'buyerName', 'buyerAddress', 'supplierName', 'supplierAddress',
    'items', 'shippingAddress', 'terms',
  ],
  'quotation': [
    'quoteNumber', 'date', 'validUntil',
    'companyName', 'clientName', 'items', 'terms',
  ],
  'student-id': [
    'schoolName', 'schoolTagline', 'schoolAddress', 'schoolPhone',
    'studentName', 'fatherName', 'className', 'rollNumber',
    'idNumber', 'academicYear', 'bloodGroup',
  ],
};

// ============================================================
// EXTRACT DATA — User prompt se structured JSON
// ============================================================
export async function extractDataFromPrompt(
  userPrompt: string,
  templateId: string
): Promise<ExtractedData | null> {
  const fields = TEMPLATE_FIELDS[templateId];
  if (!fields || fields.length === 0) return null;

  const systemPrompt = `You are a data extraction assistant. Extract structured information from the user's request.

Template: ${templateId}
Expected fields: ${fields.join(', ')}

Return ONLY a valid JSON object with the extracted fields. Use empty strings for fields not mentioned.
Do NOT include any explanation, markdown, or code blocks — ONLY the JSON object.

Example format:
{"field1": "value1", "field2": "value2", ...}`;

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: userPrompt },
        ],
        systemPrompt,
        model: 'openai/gpt-oss-120b',
        maxTokens: 800,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    // Parse JSON (strip markdown if present)
    const cleanJson = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    return parsed;
  } catch (error) {
    console.error('Extraction failed:', error);
    return null;
  }
}