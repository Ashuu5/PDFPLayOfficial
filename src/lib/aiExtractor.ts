// ============================================================
// AI EXTRACTOR — User ki short details se POORA professional content
// ============================================================

export interface ExtractedData {
  [key: string]: string;
}

// Har template ke liye expected fields
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
// MAIN EXTRACTION — User prompt se POORA content generate karo
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
        messages: [
          { role: 'user', content: userPrompt },
        ],
        systemPrompt,
        model: 'openai/gpt-oss-120b',
        maxTokens: 3000,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error');
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error('Extraction failed:', error);
    return null;
  }
}

// ============================================================
// SYSTEM PROMPT BUILDER — Different types ke liye alag prompt
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
3. Fill EVERY field with professional, realistic content.
4. If user provided a value, USE IT EXACTLY as given.
5. If user did NOT provide a value, GENERATE a professional, realistic value based on context.
6. NEVER leave fields empty. NEVER use placeholders like "[Your Name]" or "{{name}}".
7. Output must be valid JSON parseable by JSON.parse().
`;

  if (isResume) {
    return `${baseRules}

You are an expert CV/Resume writer with 15+ years of experience. Your job: take the user's SHORT input and generate a COMPLETE, PROFESSIONAL, WORLD-CLASS resume.

═══ HOW TO GENERATE CONTENT ═══

USER PROVIDES: name, job title, years of experience, location, maybe email/phone.

YOU MUST GENERATE:
• summary: 4-5 line professional summary in THIRD PERSON. Highlight years of experience, key skills, and value proposition. Make it compelling.
  Example for "React Developer, 5 years":
  "Results-driven React Developer with 5+ years of experience building scalable, high-performance web applications. Expert in modern JavaScript frameworks, state management, and responsive UI design. Proven track record of leading development teams and delivering projects on time. Passionate about clean code, performance optimization, and user-centric design."

• experience: 3-4 detailed job entries. For EACH entry use this format:
  "Senior [Job Title] | [Realistic Company Name] | [Year Range]\\n• Responsibility with action verb and measurable result\\n• Responsibility with action verb and measurable result\\n• Responsibility with action verb and measurable result\\n• Responsibility with action verb and measurable result"
  
  Use REALISTIC company names (like "TechCorp Solutions", "Digital Innovations Inc.", "GlobalSoft Systems") — NEVER Google/Facebook/Microsoft unless user mentioned them.
  
  Each bullet should:
  - Start with strong action verb (Led, Developed, Architected, Implemented, Reduced, Improved, Managed, Designed)
  - Include specific numbers (%, $, #)
  - Show impact and results

• skills: comma-separated list of 12-15 relevant technical and soft skills for the job title.
  For React Developer: "React, JavaScript (ES6+), TypeScript, Redux, React Hooks, Next.js, Node.js, REST APIs, GraphQL, HTML5, CSS3, Tailwind CSS, Git, Jest, Agile/Scrum, Team Leadership"

• education: 1-2 entries in this format:
  "Bachelor of Science in [Relevant Field] | [Realistic University Name] | [Year Range]\\nGPA: [Realistic GPA]/4.0 | [Honor/Achievement]"

• certifications: comma-separated list of 3-4 relevant certifications.
  For React Developer: "AWS Certified Developer - Associate (2023), Meta Front-End Developer Professional Certificate (2022), MongoDB Certified Developer (2021)"

• projects: 2 detailed project entries in this format:
  "Project Name (Year)\\nDescription of what it does and technologies used with measurable impact."

• linkedin: A realistic LinkedIn URL like "linkedin.com/in/[lowercase-name]"

═══ STYLE GUIDE ═══
- Professional tone, third person
- Action verbs, quantified results
- No fluff, no exaggeration
- ATS-friendly keywords
- Realistic companies and dates

Return ONLY the JSON.`;
  }

  if (isInvoice) {
    return `${baseRules}

You are an accountant. Generate a professional invoice.

USER PROVIDES: company name, client name, items/services, prices.

YOU MUST GENERATE:
• Realistic invoice number (e.g., "INV-2025-042")
• Today's date for "date"
• 30 days from today for "dueDate"
• "Net 30" for paymentTerms
• 5 line items with descriptions matching the business context
• Calculate subtotal, tax (10%), and total
• Payment details (bank name, account number, SWIFT)
• Professional notes

Return ONLY the JSON.`;
  }

  if (isSchool) {
    return `${baseRules}

You are a school administrator. Generate a professional school document.

USER PROVIDES: student name, class, school name, etc.

YOU MUST GENERATE:
• Realistic roll numbers, admission numbers
• Realistic dates
• Professional remarks and comments
• Complete school details
• Realistic grades, marks, percentages

Return ONLY the JSON.`;
  }

  return `${baseRules}

You are a professional document writer. Generate realistic, professional content for the given document type.

Fill every field with authentic, appropriate content based on the user's input. If user didn't specify, generate realistic values.

Return ONLY the JSON.`;
}