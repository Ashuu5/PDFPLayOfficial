// ============================================================
// AI EXTRACTOR — Medium-length professional content
// ============================================================

export interface ExtractedData {
  [key: string]: string;
}

export const TEMPLATE_FIELDS: Record<string, string[]> = {
  'ats-resume': [
    'fullName', 'jobTitle', 'email', 'phone', 'location',
    'linkedin', 'summary', 'skills', 'experience', 'education',
    'certifications', 'projects',
  ],
  'modern-resume': [
    'fullName', 'jobTitle', 'email', 'phone', 'location',
    'linkedin', 'about', 'experience', 'skills', 'education', 'awards',
  ],
  'europass-cv': [
    'fullName', 'address', 'phone', 'email', 'nationality',
    'dateOfBirth', 'workExperience', 'education',
    'languageSkills', 'digitalSkills', 'additionalInfo',
  ],
  'cover-letter': [
    'fullName', 'address', 'email', 'phone',
    'date', 'recipientName', 'recipientTitle', 'company',
    'companyAddress', 'bodyParagraphs',
  ],
  invoice: [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
    'clientName', 'clientAddress', 'clientEmail', 'invoiceNumber',
    'date', 'dueDate', 'paymentTerms',
    'item1Desc', 'item1Qty', 'item1Price', 'item1Amount',
    'item2Desc', 'item2Qty', 'item2Price', 'item2Amount',
    'item3Desc', 'item3Qty', 'item3Price', 'item3Amount',
    'item4Desc', 'item4Qty', 'item4Price', 'item4Amount',
    'item5Desc', 'item5Qty', 'item5Price', 'item5Amount',
    'subtotal', 'tax', 'total', 'paymentDetails', 'notes',
  ],
  'business-proposal': [
    'projectTitle', 'clientName', 'clientAddress', 'companyName',
    'companyAddress', 'contactPerson', 'companyEmail', 'companyPhone',
    'executiveSummary', 'objectives', 'scopeOfWork', 'timeline',
    'investment', 'whyChooseUs', 'contactTitle',
  ],
  'meeting-minutes': [
    'meetingTitle', 'date', 'time', 'location', 'attendees',
    'agenda', 'discussion', 'actionItems', 'decisions',
    'nextMeetingDate', 'preparedBy', 'approvedBy',
  ],
  'purchase-order': [
    'poNumber', 'date', 'expectedDelivery',
    'buyerName', 'buyerAddress', 'buyerContact', 'buyerEmail', 'buyerPhone',
    'supplierName', 'supplierAddress', 'supplierContact',
    'item1Desc', 'item1Qty', 'item1Price', 'item1Total',
    'item2Desc', 'item2Qty', 'item2Price', 'item2Total',
    'item3Desc', 'item3Qty', 'item3Price', 'item3Total',
    'item4Desc', 'item4Qty', 'item4Price', 'item4Total',
    'item5Desc', 'item5Qty', 'item5Price', 'item5Total',
    'subtotal', 'tax', 'shipping', 'total', 'shippingAddress', 'terms',
  ],
  quotation: [
    'quoteNumber', 'date', 'validUntil', 'companyName', 'companyAddress',
    'companyEmail', 'companyPhone', 'clientName', 'clientAddress', 'clientContact',
    'item1Desc', 'item1Qty', 'item1Rate', 'item1Amount',
    'item2Desc', 'item2Qty', 'item2Rate', 'item2Amount',
    'item3Desc', 'item3Qty', 'item3Rate', 'item3Amount',
    'item4Desc', 'item4Qty', 'item4Rate', 'item4Amount',
    'item5Desc', 'item5Qty', 'item5Rate', 'item5Amount',
    'subtotal', 'tax', 'discount', 'total', 'terms',
  ],
  letterhead: [
    'companyName', 'companyTagline', 'companyAddress', 'companyPhone',
    'companyEmail', 'companyWebsite', 'date', 'recipientName',
    'recipientTitle', 'recipientCompany', 'recipientAddress',
    'subject', 'body', 'senderName', 'senderTitle',
  ],
  contract: [
    'effectiveDate', 'providerName', 'providerAddress', 'clientName',
    'clientAddress', 'scopeOfServices', 'term', 'compensation',
    'confidentiality', 'intellectualProperty', 'termination', 'governingLaw',
    'providerSigner', 'providerTitle', 'clientSigner', 'clientTitle',
  ],
  'student-id': [
    'schoolName', 'schoolAddress', 'schoolPhone', 'schoolEmail',
    'studentName', 'fatherName', 'dateOfBirth', 'className',
    'rollNumber', 'session', 'bloodGroup', 'address',
    'emergencyContact', 'validUntil',
  ],
  'report-card': [
    'schoolName', 'schoolAddress', 'schoolPhone', 'schoolEmail',
    'academicYear', 'studentName', 'rollNumber', 'className', 'section',
    'dateOfBirth', 'fatherName',
    'subject1', 'marks1', 'grade1',
    'subject2', 'marks2', 'grade2',
    'subject3', 'marks3', 'grade3',
    'subject4', 'marks4', 'grade4',
    'subject5', 'marks5', 'grade5',
    'subject6', 'marks6', 'grade6',
    'totalMarks', 'percentage', 'overallGrade', 'classRank', 'attendance',
    'activities', 'comments', 'date',
  ],
  certificate: [
    'recipientName', 'eventName', 'eventDate', 'eventLocation',
    'description', 'signer1Name', 'signer1Title', 'signer2Name',
    'signer2Title', 'date',
  ],
  'admission-form': [
    'schoolName', 'schoolAddress', 'schoolPhone', 'schoolEmail', 'academicYear',
    'studentName', 'dateOfBirth', 'gender', 'nationality', 'cnic', 'bloodGroup',
    'religion', 'motherTongue', 'fatherName', 'fatherOccupation', 'fatherCnic',
    'motherName', 'motherOccupation', 'primaryContact', 'email', 'address',
    'city', 'province', 'postalCode', 'lastSchool', 'lastClass', 'lastGrade',
    'lastYear', 'applyingFor', 'transport', 'hostel',
  ],
  'transfer-certificate': [
    'schoolName', 'schoolAddress', 'affiliation', 'certificateNumber', 'date',
    'studentName', 'fatherName', 'motherName', 'dateOfBirth', 'admissionNumber',
    'dateOfAdmission', 'className', 'dateOfLeaving', 'reason', 'lastExam',
    'conduct', 'duesCleared', 'remarks',
  ],
  'character-certificate': [
    'schoolName', 'schoolAddress', 'certificateNumber', 'date',
    'studentName', 'fatherName', 'startDate', 'endDate', 'className',
    'conduct', 'disciplinaryRecord',
  ],
  bonafide: [
    'schoolName', 'schoolAddress', 'certificateNumber', 'date',
    'studentName', 'fatherName', 'dateOfBirth', 'admissionNumber',
    'className', 'session', 'purpose',
  ],
  'fee-receipt': [
    'schoolName', 'schoolAddress', 'schoolPhone', 'receiptNumber', 'date',
    'studentName', 'fatherName', 'className', 'rollNumber', 'session',
    'paymentFor', 'feeHead1', 'feeAmount1', 'feeHead2', 'feeAmount2',
    'feeHead3', 'feeAmount3', 'feeHead4', 'feeAmount4',
    'subtotal', 'previousBalance', 'discount', 'lateFine', 'total',
    'paymentMethod', 'receivedBy', 'amountInWords', 'balanceRemaining',
  ],
  'reference-letter': [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
    'date', 'employeeName', 'jobTitle', 'startDate', 'endDate',
    'bodyParagraphs', 'senderName', 'senderTitle', 'senderEmail', 'senderPhone',
  ],
  'resignation-letter': [
    'fullName', 'address', 'email', 'phone', 'date',
    'managerName', 'managerTitle', 'companyName', 'companyAddress',
    'jobTitle', 'lastWorkingDay', 'bodyParagraphs',
  ],
  'experience-letter': [
    'companyName', 'companyAddress', 'companyPhone', 'companyEmail',
    'refNumber', 'date', 'employeeName', 'designation', 'department',
    'employeeId', 'dateOfJoining', 'dateOfLeaving', 'employmentType',
    'reportingManager', 'responsibilities', 'performance',
    'senderName', 'senderTitle',
  ],
};

// ============================================================
// MAIN EXTRACTION
// ============================================================
export async function extractDataFromPrompt(
  userPrompt: string,
  templateId: string
): Promise<ExtractedData | null> {
  const fields = TEMPLATE_FIELDS[templateId];
  if (!fields || fields.length === 0) return null;

  const isResume = templateId.includes('resume') || templateId.includes('cv') || templateId === 'cover-letter';
  const isInvoice = templateId === 'invoice' || templateId === 'quotation' || templateId === 'purchase-order';
  const isSchool = ['report-card', 'certificate', 'admission-form', 'transfer-certificate', 'character-certificate', 'bonafide', 'fee-receipt', 'student-id'].includes(templateId);

  const systemPrompt = buildSystemPrompt(templateId, fields, isResume, isInvoice, isSchool);

  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userPrompt }],
        systemPrompt,
        model: 'openai/gpt-oss-120b',
        maxTokens: 2000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Extraction failed:', error);
    return null;
  }
}

// ============================================================
// SYSTEM PROMPT — MEDIUM length content
// ============================================================
function buildSystemPrompt(
  templateId: string,
  fields: string[],
  isResume: boolean,
  isInvoice: boolean,
  isSchool: boolean
): string {
  const baseRules = `
CRITICAL RULES:
1. Return ONLY a valid JSON object. No markdown, no code fences, no explanation.
2. Use EXACTLY these field names: ${fields.join(', ')}
3. If user provided a value, USE IT EXACTLY.
4. If user did NOT provide a value, GENERATE a short realistic value.
5. NEVER leave fields empty.
6. Output must be valid JSON parseable by JSON.parse().
`;

  if (isResume) {
    return `${baseRules}

You are an expert CV writer. Take the user's SHORT input and generate a CONCISE, PROFESSIONAL resume. Keep content MEDIUM length — not too short, not too long.

═══ CONTENT LENGTH GUIDE ═══

• summary: EXACTLY 2 lines. Concise, professional, focused on years + key skills.
  Example for "React Developer, 5 years":
  "React Developer with 5+ years of experience building scalable web applications. Skilled in React, TypeScript, and modern JavaScript frameworks with a proven track record of delivering high-quality projects."

• skills: 6-8 skills ONLY. Comma-separated, most relevant first.
  Example: "React, JavaScript, TypeScript, Redux, Node.js, HTML5, CSS3, Git"

• experience: 1-2 job entries ONLY. Each entry format:
  "[Job Title] | [Company Name] | [Year Range]\\n• Responsibility (1 line with action verb + result)\\n• Responsibility (1 line with action verb + result)\\n• Responsibility (1 line with action verb + result)"

  Use realistic company names. Each bullet = 1 line, concise, with numbers.

• education: 1 entry ONLY. Format:
  "[Degree] | [University] | [Year Range]\\nGPA: X.X/4.0 | [Honor]"

• certifications: 2-3 certifications ONLY.

• achievements (for awards field): 2 achievements ONLY.

• projects: 1 project ONLY.

• linkedin: "linkedin.com/in/[lowercase-name]"

═══ STYLE ═══
- Concise, punchy
- Action verbs (Led, Built, Improved, Managed)
- Realistic companies
- No fluff

Return ONLY the JSON.`;
  }

  if (isInvoice) {
    return `${baseRules}

You are an accountant. Generate a professional invoice.

• Realistic invoice number
• Today's date and 30-day due date
• 3-5 line items matching the business context
• Calculate subtotal, tax (10%), total

Return ONLY the JSON.`;
  }

  if (isSchool) {
    return `${baseRules}

You are a school administrator. Generate a professional school document with realistic details.

• Realistic roll numbers, admission numbers
• Realistic dates
• Professional comments
• Complete school info

Return ONLY the JSON.`;
  }

  return `${baseRules}

Generate realistic, professional content for the document. Keep it concise and appropriate.

Return ONLY the JSON.`;
}