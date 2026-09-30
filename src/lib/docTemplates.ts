// ============================================================
// DOC TEMPLATES — 22 professional document templates
// ============================================================

export type DocCategory = 'business' | 'resume' | 'school' | 'personal';

export interface DocSection {
  type: 'heading' | 'subheading' | 'paragraph' | 'table' | 'list' | 'spacer' | 'divider' | 'logo-placeholder';
  text?: string;
  rows?: string[][];
  items?: string[];
  level?: 1 | 2 | 3;
  bold?: boolean;
  italic?: boolean;
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  size?: number;
}

export interface DocTemplate {
  id: string;
  name: string;
  category: DocCategory;
  description: string;
  keywords: string[];
  sections: DocSection[];
  fileName: string;
}

// ============================================================
// 1. PROFESSIONAL INVOICE
// ============================================================
const invoice: DocTemplate = {
  id: 'invoice',
  name: 'Professional Invoice',
  category: 'business',
  description: 'Standard business invoice with company details, line items, and totals',
  keywords: ['invoice', 'bill', 'billing', 'invoice doc', 'invoice document'],
  fileName: 'Invoice.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'left' },
    { type: 'spacer' },
    { type: 'heading', text: 'INVOICE', alignment: 'right', size: 32, color: '#6D28D9' },
    { type: 'spacer' },

    { type: 'heading', text: 'Acme Corporation', level: 2, color: '#111827' },
    { type: 'paragraph', text: '123 Business Street, Suite 100' },
    { type: 'paragraph', text: 'New York, NY 10001' },
    { type: 'paragraph', text: 'Phone: +1 (555) 123-4567' },
    { type: 'paragraph', text: 'Email: billing@acmecorp.com' },
    { type: 'spacer' },

    { type: 'divider' },
    { type: 'spacer' },

    { type: 'heading', text: 'Bill To:', level: 3, bold: true },
    { type: 'paragraph', text: 'Tech Solutions Inc.' },
    { type: 'paragraph', text: '456 Client Avenue' },
    { type: 'paragraph', text: 'San Francisco, CA 94102' },
    { type: 'paragraph', text: 'Email: accounts@techsolutions.com' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Invoice Number: INV-2025-001', bold: true },
    { type: 'paragraph', text: 'Invoice Date: January 15, 2025' },
    { type: 'paragraph', text: 'Due Date: February 14, 2025' },
    { type: 'paragraph', text: 'Payment Terms: Net 30' },
    { type: 'spacer' },
    { type: 'spacer' },

    {
      type: 'table',
      rows: [
        ['#', 'Description', 'Qty', 'Unit Price', 'Amount'],
        ['1', 'Website Design & Development', '1', '$1,500.00', '$1,500.00'],
        ['2', 'Logo Design & Branding', '1', '$300.00', '$300.00'],
        ['3', 'Hosting Setup (1 year)', '1', '$200.00', '$200.00'],
        ['4', 'Domain Registration', '1', '$15.00', '$15.00'],
        ['5', 'SEO Optimization', '1', '$500.00', '$500.00'],
      ],
    },
    { type: 'spacer' },

    { type: 'paragraph', text: '                                        Subtotal:      $2,515.00', alignment: 'right' },
    { type: 'paragraph', text: '                                        Tax (10%):     $251.50', alignment: 'right' },
    { type: 'paragraph', text: '                                        Discount:      $0.00', alignment: 'right' },
    { type: 'paragraph', text: '                                        TOTAL DUE:     $2,766.50', alignment: 'right', bold: true, size: 14, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'divider' },
    { type: 'heading', text: 'Payment Details', level: 3, bold: true },
    { type: 'paragraph', text: 'Bank Name: First National Bank' },
    { type: 'paragraph', text: 'Account Name: Acme Corporation' },
    { type: 'paragraph', text: 'Account Number: 1234567890' },
    { type: 'paragraph', text: 'Routing Number: 021000021' },
    { type: 'paragraph', text: 'SWIFT Code: FNBAUS33' },
    { type: 'spacer' },

    { type: 'heading', text: 'Notes', level: 3, bold: true },
    { type: 'paragraph', text: 'Thank you for your business. Payment is due within 30 days. Late payments may incur a 2% monthly service charge.' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Authorized Signature: _______________________', italic: true },
    { type: 'paragraph', text: 'Date: _______________________', italic: true },
  ],
};

// ============================================================
// 2. BUSINESS PROPOSAL
// ============================================================
const businessProposal: DocTemplate = {
  id: 'business-proposal',
  name: 'Business Proposal',
  category: 'business',
  description: 'Professional project proposal for clients and stakeholders',
  keywords: ['business proposal', 'proposal', 'project proposal', 'client proposal'],
  fileName: 'Business_Proposal.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'BUSINESS PROPOSAL', alignment: 'center', size: 28, color: '#6D28D9' },
    { type: 'paragraph', text: 'Digital Marketing Campaign for Q1 2025', alignment: 'center', italic: true, size: 14 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'heading', text: 'Prepared For', level: 3, bold: true },
    { type: 'paragraph', text: 'Tech Solutions Inc.' },
    { type: 'paragraph', text: '456 Client Avenue, San Francisco, CA 94102' },
    { type: 'spacer' },

    { type: 'heading', text: 'Prepared By', level: 3, bold: true },
    { type: 'paragraph', text: 'Acme Corporation' },
    { type: 'paragraph', text: '123 Business Street, New York, NY 10001' },
    { type: 'paragraph', text: 'Contact: John Smith, Director of Marketing' },
    { type: 'paragraph', text: 'Email: john@acmecorp.com | Phone: +1 (555) 123-4567' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'heading', text: '1. Executive Summary', level: 2, color: '#6D28D9' },
    { type: 'paragraph', text: 'This proposal outlines a comprehensive digital marketing strategy designed to increase Tech Solutions Inc.\'s online presence, drive qualified leads, and boost revenue by 35% over the next quarter. Our approach combines proven SEO techniques, targeted social media campaigns, and data-driven content marketing.' },
    { type: 'spacer' },

    { type: 'heading', text: '2. Project Objectives', level: 2, color: '#6D28D9' },
    { type: 'list', items: [
      'Increase organic website traffic by 50% within 90 days',
      'Generate 200+ qualified leads per month',
      'Improve conversion rate from 1.2% to 3%',
      'Establish strong brand presence on LinkedIn and Twitter',
      'Create 20 high-quality blog posts targeting key keywords',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: '3. Proposed Solution', level: 2, color: '#6D28D9' },
    { type: 'paragraph', text: 'Our solution includes the following components:' },
    { type: 'spacer' },
    { type: 'heading', text: '3.1 Search Engine Optimization', level: 3, bold: true },
    { type: 'paragraph', text: 'Complete on-page and off-page SEO audit, keyword research, technical optimization, and link-building strategy.' },
    { type: 'spacer' },
    { type: 'heading', text: '3.2 Social Media Marketing', level: 3, bold: true },
    { type: 'paragraph', text: 'LinkedIn and Twitter content strategy, community engagement, and paid advertising campaigns.' },
    { type: 'spacer' },
    { type: 'heading', text: '3.3 Content Marketing', level: 3, bold: true },
    { type: 'paragraph', text: 'Blog posts, whitepapers, case studies, and video content to establish thought leadership.' },
    { type: 'spacer' },

    { type: 'heading', text: '4. Project Timeline', level: 2, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Phase', 'Duration', 'Deliverable'],
        ['Discovery & Audit', 'Week 1-2', 'Audit report & strategy doc'],
        ['Implementation', 'Week 3-8', 'SEO fixes, content, campaigns'],
        ['Optimization', 'Week 9-11', 'A/B testing, refinement'],
        ['Reporting', 'Week 12', 'Final report & recommendations'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: '5. Investment', level: 2, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Service', 'Investment'],
        ['SEO Optimization', '$3,500'],
        ['Social Media Marketing', '$2,800'],
        ['Content Creation (20 posts)', '$2,000'],
        ['Analytics & Reporting', '$700'],
        ['TOTAL', '$9,000'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: '6. Why Choose Us', level: 2, color: '#6D28D9' },
    { type: 'list', items: [
      '10+ years of experience in digital marketing',
      'Proven track record with 200+ successful campaigns',
      'Dedicated account manager and 24/7 support',
      'Data-driven approach with transparent reporting',
      'No long-term contracts — cancel anytime',
    ] },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'We look forward to partnering with you.', italic: true },
    { type: 'paragraph', text: 'John Smith', bold: true },
    { type: 'paragraph', text: 'Director of Marketing, Acme Corporation' },
  ],
};

// ============================================================
// 3. MEETING MINUTES
// ============================================================
const meetingMinutes: DocTemplate = {
  id: 'meeting-minutes',
  name: 'Meeting Minutes',
  category: 'business',
  description: 'Professional meeting notes with attendees, agenda, and action items',
  keywords: ['meeting minutes', 'meeting notes', 'minutes of meeting', 'mom'],
  fileName: 'Meeting_Minutes.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'left' },
    { type: 'spacer' },
    { type: 'heading', text: 'MEETING MINUTES', alignment: 'center', size: 24, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Meeting Title: Q1 2025 Marketing Strategy Review', bold: true, size: 14 },
    { type: 'paragraph', text: 'Date: January 15, 2025' },
    { type: 'paragraph', text: 'Time: 10:00 AM – 11:30 AM (EST)' },
    { type: 'paragraph', text: 'Location: Conference Room A / Zoom' },
    { type: 'spacer' },

    { type: 'heading', text: 'Attendees', level: 3, bold: true },
    {
      type: 'table',
      rows: [
        ['Name', 'Role', 'Status'],
        ['John Smith', 'Director of Marketing', 'Present'],
        ['Sarah Johnson', 'Marketing Manager', 'Present'],
        ['Michael Chen', 'Content Lead', 'Present'],
        ['Emily Davis', 'SEO Specialist', 'Present'],
        ['David Wilson', 'Sales Director', 'Absent (Apologies)'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Agenda', level: 3, bold: true },
    { type: 'list', items: [
      'Review of Q4 2024 performance',
      'Q1 2025 strategy and objectives',
      'Budget allocation',
      'Team assignments and timelines',
      'Any other business (AOB)',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Discussion Points', level: 3, bold: true },
    { type: 'spacer' },

    { type: 'heading', text: '1. Q4 2024 Performance Review', level: 3, bold: true },
    { type: 'paragraph', text: 'Sarah presented Q4 results. Website traffic increased 28% YoY, but conversion rate dropped from 1.8% to 1.4%. Organic search remains the top traffic source at 52%.' },
    { type: 'spacer' },

    { type: 'heading', text: '2. Q1 2025 Strategy', level: 3, bold: true },
    { type: 'paragraph', text: 'John outlined three key priorities for Q1: (1) improve conversion rate optimization, (2) launch LinkedIn thought leadership campaign, (3) refresh top 10 underperforming blog posts.' },
    { type: 'spacer' },

    { type: 'heading', text: '3. Budget Allocation', level: 3, bold: true },
    { type: 'paragraph', text: 'The team agreed to allocate $15,000 for Q1: $6,000 for paid ads, $4,000 for content, $3,000 for tools, and $2,000 for training.' },
    { type: 'spacer' },

    { type: 'heading', text: 'Action Items', level: 3, bold: true },
    {
      type: 'table',
      rows: [
        ['#', 'Action', 'Owner', 'Due Date'],
        ['1', 'Complete CRO audit', 'Emily Davis', 'Jan 22, 2025'],
        ['2', 'Draft LinkedIn content calendar', 'Michael Chen', 'Jan 25, 2025'],
        ['3', 'Refresh 10 underperforming posts', 'Michael Chen', 'Feb 5, 2025'],
        ['4', 'Set up A/B testing framework', 'Sarah Johnson', 'Feb 10, 2025'],
        ['5', 'Book Q1 training sessions', 'John Smith', 'Jan 30, 2025'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Decisions Made', level: 3, bold: true },
    { type: 'list', items: [
      'Approved $15,000 Q1 budget',
      'Adopt weekly Monday standups for marketing team',
      'Shift 20% of ad budget from Google to LinkedIn',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Next Meeting', level: 3, bold: true },
    { type: 'paragraph', text: 'Date: January 22, 2025 at 10:00 AM EST' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Minutes prepared by: Sarah Johnson', italic: true },
    { type: 'paragraph', text: 'Approved by: John Smith', italic: true },
  ],
};

// ============================================================
// 4. ATS RESUME
// ============================================================
const atsResume: DocTemplate = {
  id: 'ats-resume',
  name: 'ATS Resume',
  category: 'resume',
  description: 'ATS-friendly resume optimized for applicant tracking systems',
  keywords: ['ats resume', 'resume', 'cv', 'ats cv', 'ats friendly resume'],
  fileName: 'ATS_Resume.docx',
  sections: [
    { type: 'heading', text: 'JOHN SMITH', alignment: 'center', size: 22, color: '#111827' },
    { type: 'paragraph', text: 'Senior Software Engineer', alignment: 'center', italic: true, size: 13 },
    { type: 'paragraph', text: 'john.smith@email.com | +1 (555) 123-4567 | San Francisco, CA', alignment: 'center', size: 10 },
    { type: 'paragraph', text: 'linkedin.com/in/johnsmith | github.com/johnsmith', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'heading', text: 'PROFESSIONAL SUMMARY', level: 2, color: '#111827' },
    { type: 'paragraph', text: 'Results-driven Senior Software Engineer with 8+ years of experience building scalable web applications. Expert in React, Node.js, and cloud architecture. Proven track record of leading teams and delivering projects on time. Seeking to leverage technical expertise in a challenging engineering role.' },
    { type: 'spacer' },

    { type: 'heading', text: 'CORE COMPETENCIES', level: 2, color: '#111827' },
    { type: 'paragraph', text: 'JavaScript • TypeScript • React • Node.js • Express • MongoDB • PostgreSQL • AWS • Docker • Kubernetes • GraphQL • REST APIs • CI/CD • Agile/Scrum • Team Leadership • System Design' },
    { type: 'spacer' },

    { type: 'heading', text: 'PROFESSIONAL EXPERIENCE', level: 2, color: '#111827' },
    { type: 'spacer' },

    { type: 'heading', text: 'Senior Software Engineer | Google Inc.', level: 3, bold: true },
    { type: 'paragraph', text: 'San Francisco, CA | January 2020 – Present', italic: true, size: 10 },
    { type: 'list', items: [
      'Led a team of 6 engineers to rebuild the search results page, improving load time by 45%',
      'Architected microservices handling 10M+ requests/day with 99.99% uptime',
      'Reduced infrastructure costs by $500K annually through optimization',
      'Mentored 4 junior engineers, 3 of whom were promoted within 18 months',
      'Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Software Engineer | Facebook', level: 3, bold: true },
    { type: 'paragraph', text: 'Menlo Park, CA | June 2017 – December 2019', italic: true, size: 10 },
    { type: 'list', items: [
      'Developed React components used by 2B+ monthly users',
      'Improved Instagram Stories performance by 30% through code optimization',
      'Collaborated with design teams to launch 12 major features',
      'Wrote comprehensive unit and integration tests achieving 95% coverage',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Junior Developer | StartupXYZ', level: 3, bold: true },
    { type: 'paragraph', text: 'Austin, TX | August 2015 – May 2017', italic: true, size: 10 },
    { type: 'list', items: [
      'Built REST APIs serving 50K+ daily active users',
      'Reduced database query time by 60% through indexing and caching',
      'Participated in on-call rotation, resolving 100+ production issues',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'EDUCATION', level: 2, color: '#111827' },
    { type: 'paragraph', text: 'Bachelor of Science in Computer Science', bold: true },
    { type: 'paragraph', text: 'Stanford University, Stanford, CA | 2011 – 2015', italic: true, size: 10 },
    { type: 'paragraph', text: 'GPA: 3.8/4.0 | Dean\'s List (all semesters) | ACM Chapter President' },
    { type: 'spacer' },

    { type: 'heading', text: 'CERTIFICATIONS', level: 2, color: '#111827' },
    { type: 'list', items: [
      'AWS Certified Solutions Architect – Professional (2023)',
      'Google Cloud Professional Developer (2021)',
      'Certified Kubernetes Administrator (2020)',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'PROJECTS', level: 2, color: '#111827' },
    { type: 'paragraph', text: 'OpenSource Dashboard (2023)', bold: true },
    { type: 'paragraph', text: 'Analytics dashboard with 5K+ GitHub stars. Built with React, D3.js, and Node.js.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Task Manager App (2022)', bold: true },
    { type: 'paragraph', text: 'Full-stack task management app. Used by 10K+ users worldwide.' },
  ],
};

// ============================================================
// 5. MODERN RESUME
// ============================================================
const modernResume: DocTemplate = {
  id: 'modern-resume',
  name: 'Modern Resume',
  category: 'resume',
  description: 'Creative and modern resume design for design and tech roles',
  keywords: ['modern resume', 'creative resume', 'designer resume', 'modern cv'],
  fileName: 'Modern_Resume.docx',
  sections: [
    { type: 'heading', text: 'SARAH JOHNSON', alignment: 'center', size: 28, color: '#6D28D9' },
    { type: 'paragraph', text: 'Product Designer', alignment: 'center', italic: true, size: 15, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'sarah.johnson@email.com  •  +1 (555) 987-6543  •  New York, NY', alignment: 'center', size: 10 },
    { type: 'paragraph', text: 'sarahjohnson.design  •  linkedin.com/in/sarahjohnson', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'heading', text: 'ABOUT ME', level: 2, color: '#6D28D9' },
    { type: 'paragraph', text: 'Award-winning Product Designer with 6+ years of experience creating delightful digital experiences. Specialized in user-centered design, design systems, and prototyping. Passionate about solving complex problems through elegant, accessible design.' },
    { type: 'spacer' },

    { type: 'heading', text: 'EXPERIENCE', level: 2, color: '#6D28D9' },
    { type: 'spacer' },

    { type: 'heading', text: 'Senior Product Designer', level: 3, bold: true },
    { type: 'paragraph', text: 'Airbnb • San Francisco, CA • 2021 – Present', italic: true, size: 10 },
    { type: 'list', items: [
      'Led redesign of host dashboard, increasing host engagement by 42%',
      'Created and maintained design system used by 50+ designers',
      'Conducted 100+ user interviews to inform product decisions',
      'Mentored 3 junior designers through design review process',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Product Designer', level: 3, bold: true },
    { type: 'paragraph', text: 'Spotify • New York, NY • 2019 – 2021', italic: true, size: 10 },
    { type: 'list', items: [
      'Designed personalized playlist feature used by 20M+ users',
      'Reduced onboarding drop-off by 35% through improved UX',
      'Collaborated with engineering and product teams to ship 15+ features',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'UX Designer', level: 3, bold: true },
    { type: 'paragraph', text: 'Design Studio NYC • New York, NY • 2017 – 2019', italic: true, size: 10 },
    { type: 'list', items: [
      'Designed mobile apps for clients in fintech, health, and e-commerce',
      'Won 3 design awards including Awwwards Site of the Day',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'SKILLS', level: 2, color: '#6D28D9' },
    { type: 'paragraph', text: 'Design:  Figma • Sketch • Adobe XD • Photoshop • Illustrator • InVision' },
    { type: 'paragraph', text: 'Prototyping:  Framer • Principle • ProtoPie • Marvel' },
    { type: 'paragraph', text: 'Research:  User interviews • Usability testing • A/B testing • Analytics' },
    { type: 'paragraph', text: 'Other:  HTML/CSS • Design systems • Accessibility (WCAG) • Agile' },
    { type: 'spacer' },

    { type: 'heading', text: 'EDUCATION', level: 2, color: '#6D28D9' },
    { type: 'paragraph', text: 'BFA in Graphic Design', bold: true },
    { type: 'paragraph', text: 'Parsons School of Design, New York, NY | 2013 – 2017', italic: true, size: 10 },
    { type: 'spacer' },

    { type: 'heading', text: 'AWARDS & RECOGNITION', level: 2, color: '#6D28D9' },
    { type: 'list', items: [
      'Awwwards Site of the Day (2023)',
      'CSS Design Awards - Best UI (2022)',
      'Adobe Design Achievement Award (2016)',
    ] },
  ],
};

// ============================================================
// 6. EUROPASS CV
// ============================================================
const europassCV: DocTemplate = {
  id: 'europass-cv',
  name: 'Europass CV',
  category: 'resume',
  description: 'Standard Europass CV format for European applications',
  keywords: ['europass', 'europass cv', 'european cv', 'eu cv'],
  fileName: 'Europass_CV.docx',
  sections: [
    { type: 'heading', text: 'Europass', alignment: 'left', size: 24, color: '#003399' },
    { type: 'paragraph', text: 'Curriculum Vitae', italic: true, size: 14 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'heading', text: 'PERSONAL INFORMATION', level: 2, color: '#003399' },
    { type: 'paragraph', text: 'Name:  John Smith', bold: true },
    { type: 'paragraph', text: 'Address:  123 Main Street, London, UK' },
    { type: 'paragraph', text: 'Phone:  +44 20 1234 5678' },
    { type: 'paragraph', text: 'Email:  john.smith@email.com' },
    { type: 'paragraph', text: 'Nationality:  British' },
    { type: 'paragraph', text: 'Date of Birth:  15/05/1990' },
    { type: 'paragraph', text: 'Gender:  Male' },
    { type: 'spacer' },

    { type: 'heading', text: 'WORK EXPERIENCE', level: 2, color: '#003399' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'March 2020 – Present', bold: true },
    { type: 'paragraph', text: 'Senior Software Engineer', bold: true },
    { type: 'paragraph', text: 'Google UK, London' },
    { type: 'list', items: [
      'Leading a team of 5 engineers building search infrastructure',
      'Reduced latency by 30% through architectural improvements',
      'Mentoring junior engineers and conducting code reviews',
    ] },
    { type: 'spacer' },

    { type: 'paragraph', text: 'June 2017 – February 2020', bold: true },
    { type: 'paragraph', text: 'Software Engineer', bold: true },
    { type: 'paragraph', text: 'Facebook UK, London' },
    { type: 'list', items: [
      'Developed React components for Facebook main app',
      'Improved performance of News Feed by 25%',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'EDUCATION AND TRAINING', level: 2, color: '#003399' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'September 2013 – June 2017', bold: true },
    { type: 'paragraph', text: 'Bachelor of Science in Computer Science', bold: true },
    { type: 'paragraph', text: 'University of Cambridge, UK' },
    { type: 'paragraph', text: 'Grade: First Class Honours' },
    { type: 'spacer' },

    { type: 'heading', text: 'LANGUAGE SKILLS', level: 2, color: '#003399' },
    {
      type: 'table',
      rows: [
        ['Language', 'Understanding', 'Speaking', 'Writing'],
        ['English', 'C2', 'C2', 'C2'],
        ['French', 'B2', 'B2', 'B1'],
        ['Spanish', 'B1', 'B1', 'B1'],
        ['German', 'A2', 'A2', 'A2'],
      ],
    },
    { type: 'paragraph', text: 'Levels: A1/A2 (Basic) • B1/B2 (Independent) • C1/C2 (Proficient)', italic: true, size: 9 },
    { type: 'spacer' },

    { type: 'heading', text: 'DIGITAL SKILLS', level: 2, color: '#003399' },
    { type: 'paragraph', text: 'Programming:  JavaScript, TypeScript, Python, Java, C++' },
    { type: 'paragraph', text: 'Frameworks:  React, Node.js, Express, Django' },
    { type: 'paragraph', text: 'Tools:  Git, Docker, Kubernetes, AWS, Jenkins' },
    { type: 'paragraph', text: 'Other:  Agile, Scrum, TDD, CI/CD, System Design' },
    { type: 'spacer' },

    { type: 'heading', text: 'ADDITIONAL INFORMATION', level: 2, color: '#003399' },
    { type: 'paragraph', text: 'Certifications: AWS Solutions Architect, Google Cloud Developer' },
    { type: 'paragraph', text: 'Publications: 3 papers in IEEE conferences on distributed systems' },
    { type: 'paragraph', text: 'Interests: Open source, tech meetups, hiking, photography' },
  ],
};

// ============================================================
// 7. COVER LETTER
// ============================================================
const coverLetter: DocTemplate = {
  id: 'cover-letter',
  name: 'Cover Letter',
  category: 'resume',
  description: 'Professional cover letter for job applications',
  keywords: ['cover letter', 'application letter', 'job letter'],
  fileName: 'Cover_Letter.docx',
  sections: [
    { type: 'paragraph', text: 'John Smith', bold: true, size: 14 },
    { type: 'paragraph', text: '123 Main Street, San Francisco, CA 94102' },
    { type: 'paragraph', text: 'john.smith@email.com | +1 (555) 123-4567' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'January 15, 2025' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Hiring Manager' },
    { type: 'paragraph', text: 'Tech Innovations Inc.' },
    { type: 'paragraph', text: '789 Enterprise Blvd, San Francisco, CA 94105' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Dear Hiring Manager,' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'I am writing to express my strong interest in the Senior Software Engineer position at Tech Innovations Inc., as advertised on your careers page. With over 8 years of experience in full-stack development and a proven track record of delivering scalable web applications, I am confident that I can make a significant contribution to your engineering team.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'In my current role at Google, I lead a team of 6 engineers responsible for rebuilding the search results page. By implementing modern architectural patterns and optimizing performance, we reduced page load time by 45% and improved user satisfaction scores measurably. This experience has honed my skills in both technical leadership and hands-on engineering.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Prior to Google, I worked at Facebook where I developed React components used by over 2 billion monthly users. This role taught me the importance of writing clean, maintainable code that scales. I also collaborated closely with designers and product managers to ship features that truly delighted users.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'What excites me most about Tech Innovations Inc. is your commitment to building products that make a real difference in people\'s lives. Your recent launch of the AI-powered analytics platform particularly caught my attention, as it aligns perfectly with my interests in machine learning integration and data-driven applications.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'I would welcome the opportunity to discuss how my experience and skills can benefit your team. I am available for an interview at your convenience and can be reached at +1 (555) 123-4567 or john.smith@email.com.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Thank you for considering my application. I look forward to the possibility of contributing to Tech Innovations Inc.\'s continued success.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Sincerely,' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'John Smith', bold: true },
  ],
};

// ============================================================
// 8. PURCHASE ORDER
// ============================================================
const purchaseOrder: DocTemplate = {
  id: 'purchase-order',
  name: 'Purchase Order',
  category: 'business',
  description: 'Professional purchase order for suppliers and vendors',
  keywords: ['purchase order', 'po', 'supplier order', 'vendor order'],
  fileName: 'Purchase_Order.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'left' },
    { type: 'spacer' },
    { type: 'heading', text: 'PURCHASE ORDER', alignment: 'center', size: 24, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'PO Number: PO-2025-001', bold: true },
    { type: 'paragraph', text: 'Date: January 15, 2025' },
    { type: 'paragraph', text: 'Expected Delivery: February 15, 2025' },
    { type: 'spacer' },

    { type: 'heading', text: 'Buyer Information', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Acme Corporation' },
    { type: 'paragraph', text: '123 Business Street, New York, NY 10001' },
    { type: 'paragraph', text: 'Contact: John Smith, Procurement Manager' },
    { type: 'paragraph', text: 'Email: procurement@acmecorp.com | Phone: +1 (555) 123-4567' },
    { type: 'spacer' },

    { type: 'heading', text: 'Supplier Information', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Office Supplies Co.' },
    { type: 'paragraph', text: '456 Supplier Lane, Chicago, IL 60601' },
    { type: 'paragraph', text: 'Contact: sales@officesupplies.com | Phone: +1 (555) 987-6543' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'heading', text: 'Order Details', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Item #', 'Description', 'Qty', 'Unit Price', 'Total'],
        ['001', 'A4 Printer Paper (500 sheets)', '20', '$5.00', '$100.00'],
        ['002', 'Blue Ballpoint Pens (Pack of 12)', '10', '$8.00', '$80.00'],
        ['003', 'Stapler Heavy Duty', '5', '$15.00', '$75.00'],
        ['004', 'File Folders (Pack of 50)', '8', '$12.00', '$96.00'],
        ['005', 'Printer Ink Cartridge (Black)', '10', '$25.00', '$250.00'],
        ['', '', '', 'Subtotal:', '$601.00'],
        ['', '', '', 'Tax (8%):', '$48.08'],
        ['', '', '', 'Shipping:', '$25.00'],
        ['', '', '', 'TOTAL:', '$674.08'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Shipping Address', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Acme Corporation — Warehouse' },
    { type: 'paragraph', text: '789 Warehouse Blvd, New York, NY 10002' },
    { type: 'paragraph', text: 'Attention: Receiving Department' },
    { type: 'spacer' },

    { type: 'heading', text: 'Terms & Conditions', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: '1. Delivery must be made by the date specified above.' },
    { type: 'paragraph', text: '2. Invoice must reference the PO number.' },
    { type: 'paragraph', text: '3. Payment terms: Net 30 days from delivery.' },
    { type: 'paragraph', text: '4. All items must be brand new and in original packaging.' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Authorized By: _______________________', italic: true },
    { type: 'paragraph', text: 'John Smith, Procurement Manager', italic: true },
    { type: 'paragraph', text: 'Date: _______________________', italic: true },
  ],
};

// ============================================================
// 9. QUOTATION
// ============================================================
const quotation: DocTemplate = {
  id: 'quotation',
  name: 'Quotation',
  category: 'business',
  description: 'Professional price quotation for potential clients',
  keywords: ['quotation', 'quote', 'price quote', 'estimate'],
  fileName: 'Quotation.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'left' },
    { type: 'spacer' },
    { type: 'heading', text: 'QUOTATION', alignment: 'center', size: 28, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Quote Number: QT-2025-001', bold: true },
    { type: 'paragraph', text: 'Date: January 15, 2025' },
    { type: 'paragraph', text: 'Valid Until: February 15, 2025' },
    { type: 'spacer' },

    { type: 'heading', text: 'From', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Acme Corporation' },
    { type: 'paragraph', text: '123 Business Street, New York, NY 10001' },
    { type: 'paragraph', text: 'Email: sales@acmecorp.com | Phone: +1 (555) 123-4567' },
    { type: 'spacer' },

    { type: 'heading', text: 'To', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Tech Solutions Inc.' },
    { type: 'paragraph', text: '456 Client Avenue, San Francisco, CA 94102' },
    { type: 'paragraph', text: 'Attention: Procurement Department' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'heading', text: 'Quotation Details', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['#', 'Item / Service', 'Qty', 'Rate', 'Amount'],
        ['1', 'Website Design (Custom)', '1', '$1,500.00', '$1,500.00'],
        ['2', 'Content Management System', '1', '$800.00', '$800.00'],
        ['3', 'Responsive Development', '1', '$600.00', '$600.00'],
        ['4', 'Basic SEO Setup', '1', '$400.00', '$400.00'],
        ['5', 'Analytics Integration', '1', '$200.00', '$200.00'],
        ['6', 'Training Session (2 hours)', '1', '$150.00', '$150.00'],
        ['', '', '', 'Subtotal:', '$3,650.00'],
        ['', '', '', 'Tax (10%):', '$365.00'],
        ['', '', '', 'Discount:', '-$150.00'],
        ['', '', '', 'TOTAL:', '$3,865.00'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Terms & Conditions', level: 3, bold: true, color: '#6D28D9' },
    { type: 'list', items: [
      'This quotation is valid for 30 days from the date above.',
      'Payment terms: 50% advance, 50% on completion.',
      'Delivery within 30 business days from project kickoff.',
      'Any changes to scope may affect pricing and timeline.',
      'All prices are in USD and exclude applicable taxes unless stated.',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Included in This Quotation', level: 3, bold: true, color: '#6D28D9' },
    { type: 'list', items: [
      'Complete source code and documentation',
      '3 months of free bug fixes',
      '30 days of email support',
      'Hosting setup assistance',
      'Basic training for your team',
    ] },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'We look forward to working with you.', italic: true },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Authorized Signature: _______________________', italic: true },
    { type: 'paragraph', text: 'John Smith, Sales Director', italic: true },
  ],
};

// ============================================================
// 10. COMPANY LETTERHEAD
// ============================================================
const companyLetterhead: DocTemplate = {
  id: 'letterhead',
  name: 'Company Letterhead',
  category: 'business',
  description: 'Professional company letterhead for official correspondence',
  keywords: ['letterhead', 'company letterhead', 'official letter', 'business letter'],
  fileName: 'Company_Letterhead.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ACME CORPORATION', alignment: 'center', size: 22, color: '#6D28D9' },
    { type: 'paragraph', text: 'Innovation • Excellence • Trust', alignment: 'center', italic: true, size: 10 },
    { type: 'paragraph', text: '123 Business Street, Suite 100, New York, NY 10001', alignment: 'center', size: 9 },
    { type: 'paragraph', text: 'Phone: +1 (555) 123-4567  •  Email: info@acmecorp.com  •  www.acmecorp.com', alignment: 'center', size: 9 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'January 15, 2025' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Mr. Robert Johnson' },
    { type: 'paragraph', text: 'Chief Executive Officer' },
    { type: 'paragraph', text: 'Tech Solutions Inc.' },
    { type: 'paragraph', text: '456 Client Avenue, San Francisco, CA 94102' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Dear Mr. Johnson,' },
    { type: 'spacer' },

    { type: 'heading', text: 'Re: Partnership Proposal for Digital Transformation Initiative', level: 3, bold: true },
    { type: 'spacer' },

    { type: 'paragraph', text: 'I hope this letter finds you well. I am writing to formally propose a strategic partnership between Acme Corporation and Tech Solutions Inc. for the upcoming Digital Transformation Initiative. This collaboration, we believe, would create significant value for both organizations.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Over the past year, we have observed Tech Solutions Inc.\'s remarkable growth in the enterprise software space. Your recent product launches demonstrate a clear commitment to innovation and customer-centric design — values that deeply resonate with our own mission at Acme Corporation.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'We are proposing a joint venture that would combine our expertise in cloud infrastructure with your strengths in application development. This partnership could potentially serve over 500 enterprise clients within the first 18 months.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'I would welcome the opportunity to discuss this proposal in person. Please let me know if you would be available for a meeting in the coming weeks. My assistant will follow up next week to coordinate schedules.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Thank you for your time and consideration. I look forward to the possibility of collaborating with you.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Sincerely,' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Michael Davis', bold: true },
    { type: 'paragraph', text: 'Chief Executive Officer' },
    { type: 'paragraph', text: 'Acme Corporation' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'paragraph', text: 'Acme Corporation  •  www.acmecorp.com  •  +1 (555) 123-4567', alignment: 'center', italic: true, size: 8 },
  ],
};

// ============================================================
// 11. CONTRACT AGREEMENT
// ============================================================
const contractAgreement: DocTemplate = {
  id: 'contract',
  name: 'Contract Agreement',
  category: 'business',
  description: 'Standard service contract agreement for clients',
  keywords: ['contract', 'agreement', 'service contract', 'legal contract'],
  fileName: 'Contract_Agreement.docx',
  sections: [
    { type: 'heading', text: 'SERVICE AGREEMENT CONTRACT', alignment: 'center', size: 20, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'This Service Agreement ("Agreement") is entered into as of January 15, 2025 ("Effective Date"), by and between:', italic: true },
    { type: 'spacer' },

    { type: 'paragraph', text: 'SERVICE PROVIDER:', bold: true },
    { type: 'paragraph', text: 'Acme Corporation, a corporation organized under the laws of New York, with its principal office at 123 Business Street, New York, NY 10001 ("Provider").' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'CLIENT:', bold: true },
    { type: 'paragraph', text: 'Tech Solutions Inc., a corporation organized under the laws of California, with its principal office at 456 Client Avenue, San Francisco, CA 94102 ("Client").' },
    { type: 'spacer' },

    { type: 'heading', text: '1. SCOPE OF SERVICES', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Provider agrees to perform the following services for the Client ("Services"):' },
    { type: 'list', items: [
      'Custom website design and development',
      'Content management system implementation',
      'Search engine optimization setup',
      'Analytics integration and reporting',
      'Team training and documentation',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: '2. TERM', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'This Agreement shall commence on the Effective Date and continue for a period of six (6) months, unless earlier terminated as provided herein.' },
    { type: 'spacer' },

    { type: 'heading', text: '3. COMPENSATION', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Client agrees to pay Provider a total fee of $18,000 (Eighteen Thousand US Dollars) for the Services, payable as follows:' },
    { type: 'list', items: [
      '$6,000 upon execution of this Agreement',
      '$6,000 upon completion of milestone 1 (design approval)',
      '$6,000 upon final delivery and acceptance',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: '4. CONFIDENTIALITY', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Both parties agree to maintain the confidentiality of any proprietary or confidential information disclosed during the term of this Agreement. This obligation shall survive termination of the Agreement for a period of three (3) years.' },
    { type: 'spacer' },

    { type: 'heading', text: '5. INTELLECTUAL PROPERTY', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'All work product, deliverables, and intellectual property created by Provider under this Agreement shall become the sole property of Client upon full payment of all fees.' },
    { type: 'spacer' },

    { type: 'heading', text: '6. TERMINATION', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Either party may terminate this Agreement with thirty (30) days written notice. In case of termination by Client, Client shall pay for all work completed up to the termination date.' },
    { type: 'spacer' },

    { type: 'heading', text: '7. LIMITATION OF LIABILITY', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'In no event shall either party be liable for any indirect, incidental, special, or consequential damages arising out of or related to this Agreement.' },
    { type: 'spacer' },

    { type: 'heading', text: '8. GOVERNING LAW', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'This Agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws principles.' },
    { type: 'spacer' },

    { type: 'heading', text: '9. ENTIRE AGREEMENT', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings relating to the subject matter hereof.' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'heading', text: 'SIGNATURES', level: 3, bold: true, color: '#6D28D9' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'FOR ACME CORPORATION:' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Signature: _____________________________' },
    { type: 'paragraph', text: 'Name: Michael Davis' },
    { type: 'paragraph', text: 'Title: Chief Executive Officer' },
    { type: 'paragraph', text: 'Date: _________________' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'FOR TECH SOLUTIONS INC.:' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Signature: _____________________________' },
    { type: 'paragraph', text: 'Name: Robert Johnson' },
    { type: 'paragraph', text: 'Title: Chief Executive Officer' },
    { type: 'paragraph', text: 'Date: _________________' },
  ],
};

// ============================================================
// 12. STUDENT ID CARD (Canvas placeholder - DOCX fallback)
// ============================================================
const studentIdCard: DocTemplate = {
  id: 'student-id',
  name: 'Student ID Card',
  category: 'school',
  description: 'Student identity card with photo placeholder (best as Canvas)',
  keywords: ['student id', 'id card', 'student card', 'identity card'],
  fileName: 'Student_ID_Card.docx',
  sections: [
    { type: 'heading', text: 'STUDENT IDENTITY CARD', alignment: 'center', size: 16, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC PUBLIC SCHOOL', alignment: 'center', size: 18, color: '#111827' },
    { type: 'paragraph', text: '123 Education Lane, Springfield, IL 62701', alignment: 'center' },
    { type: 'paragraph', text: 'Phone: (555) 100-2000  |  Email: info@abcschool.edu', alignment: 'center' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: '[ STUDENT PHOTO HERE ]', alignment: 'center', bold: true },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'heading', text: 'STUDENT INFORMATION', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Student Name:', 'Ali Khan'],
        ['Father\'s Name:', 'Ahmed Khan'],
        ['Date of Birth:', 'May 10, 2015'],
        ['Class:', '5-A'],
        ['Roll Number:', '15'],
        ['Session:', '2025-2026'],
        ['Blood Group:', 'O+'],
        ['Address:', '456 Student Lane, Springfield'],
        ['Emergency Contact:', '+1 (555) 100-9999'],
      ],
    },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: '_____________________              _____________________', alignment: 'center' },
    { type: 'paragraph', text: 'Principal Signature                        Valid Until: June 2026', alignment: 'center', italic: true, size: 9 },
  ],
};

// ============================================================
// 13. REPORT CARD
// ============================================================
const reportCard: DocTemplate = {
  id: 'report-card',
  name: 'Report Card',
  category: 'school',
  description: 'Student report card with grades and teacher comments',
  keywords: ['report card', 'marksheet', 'grade sheet', 'progress report'],
  fileName: 'Report_Card.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC PUBLIC SCHOOL', alignment: 'center', size: 20, color: '#6D28D9' },
    { type: 'paragraph', text: '123 Education Lane, Springfield, IL 62701', alignment: 'center', size: 10 },
    { type: 'paragraph', text: 'Phone: (555) 100-2000  |  Email: info@abcschool.edu', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'heading', text: 'STUDENT PROGRESS REPORT', alignment: 'center', size: 14, bold: true, color: '#111827' },
    { type: 'paragraph', text: 'Academic Year 2024-2025', alignment: 'center', italic: true, size: 11 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'heading', text: 'Student Information', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Student Name:', 'Ali Khan'],
        ['Roll Number:', '15'],
        ['Class:', '5-A'],
        ['Section:', 'A'],
        ['Date of Birth:', 'May 10, 2015'],
        ['Father\'s Name:', 'Ahmed Khan'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Academic Performance', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Subject', 'Term 1', 'Term 2', 'Final', 'Grade'],
        ['Mathematics', '85', '88', '92', 'A'],
        ['Science', '90', '92', '94', 'A+'],
        ['English', '78', '82', '85', 'A-'],
        ['Urdu', '80', '84', '86', 'A-'],
        ['Islamiat', '88', '90', '92', 'A'],
        ['Social Studies', '75', '80', '82', 'B+'],
        ['Computer', '92', '94', '95', 'A+'],
        ['Physical Education', '85', '86', '88', 'A'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Overall Performance', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Total Marks Obtained:', '714 / 800'],
        ['Percentage:', '89.25%'],
        ['Overall Grade:', 'A'],
        ['Class Rank:', '5 out of 45'],
        ['Attendance:', '178 / 180 days (98.9%)'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Co-Curricular Activities', level: 3, bold: true, color: '#6D28D9' },
    { type: 'list', items: [
      'Member of School Science Club',
      'Participated in Annual Sports Day (1st place in 100m race)',
      'Winner — Inter-school Quiz Competition 2024',
      'Regular participant in morning assembly',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Teacher\'s Comments', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'Ali is a diligent and well-behaved student who consistently performs at a high level. He shows particular aptitude for Science and Mathematics. His active participation in class discussions is commendable. Keep up the excellent work!' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'heading', text: 'Grading Scale', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'A+ = 90-100%  |  A = 80-89%  |  B+ = 75-79%  |  B = 70-74%  |  C = 60-69%  |  D = 50-59%  |  F = Below 50%', size: 10 },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: '_____________________              _____________________', alignment: 'center' },
    { type: 'paragraph', text: 'Class Teacher                              Principal', alignment: 'center', italic: true, size: 10 },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Date of Issue: January 15, 2025', alignment: 'center', italic: true, size: 9 },
  ],
};

// ============================================================
// 14. CERTIFICATE OF ACHIEVEMENT
// ============================================================
const certificateAchievement: DocTemplate = {
  id: 'certificate',
  name: 'Certificate of Achievement',
  category: 'school',
  description: 'Elegant certificate for awards and recognition',
  keywords: ['certificate', 'achievement', 'award', 'certificate of achievement'],
  fileName: 'Certificate_of_Achievement.docx',
  sections: [
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'CERTIFICATE OF ACHIEVEMENT', alignment: 'center', size: 32, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'This Certificate is Proudly Presented To', alignment: 'center', italic: true, size: 14 },
    { type: 'spacer' },
    { type: 'heading', text: 'ALI KHAN', alignment: 'center', size: 36, color: '#111827' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'For outstanding performance and dedication in', alignment: 'center', size: 13 },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Inter-School Science Olympiad 2024', alignment: 'center', bold: true, size: 18, color: '#6D28D9' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'held on December 15, 2024 at Springfield Convention Center', alignment: 'center', italic: true, size: 11 },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Ali demonstrated exceptional knowledge, critical thinking skills, and a true passion for science. His achievement of First Place among 150 participants reflects his hard work and dedication.' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: '_____________________              _____________________', alignment: 'center' },
    { type: 'paragraph', text: 'Dr. Sarah Johnson                        Michael Davis', alignment: 'center', italic: true, size: 10 },
    { type: 'paragraph', text: 'Event Director                                Principal', alignment: 'center', italic: true, size: 9 },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Date: December 20, 2024', alignment: 'center', italic: true, size: 10 },
  ],
};

// ============================================================
// 15. ADMISSION FORM
// ============================================================
const admissionForm: DocTemplate = {
  id: 'admission-form',
  name: 'Admission Form',
  category: 'school',
  description: 'Complete student admission form for schools',
  keywords: ['admission form', 'student admission', 'enrollment form', 'school admission'],
  fileName: 'Admission_Form.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC PUBLIC SCHOOL', alignment: 'center', size: 20, color: '#6D28D9' },
    { type: 'paragraph', text: '123 Education Lane, Springfield, IL 62701', alignment: 'center', size: 10 },
    { type: 'paragraph', text: 'Phone: (555) 100-2000  |  Email: admissions@abcschool.edu', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'heading', text: 'STUDENT ADMISSION FORM', alignment: 'center', size: 16, bold: true, color: '#111827' },
    { type: 'paragraph', text: 'Academic Year 2025-2026', alignment: 'center', italic: true, size: 11 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'heading', text: 'Section A: Student Information', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['1. Full Name of Student:', ''],
        ['2. Date of Birth (DD/MM/YYYY):', ''],
        ['3. Gender:', '☐ Male    ☐ Female    ☐ Other'],
        ['4. Nationality:', ''],
        ['5. CNIC / B-Form Number:', ''],
        ['6. Blood Group:', ''],
        ['7. Religion:', ''],
        ['8. Mother Tongue:', ''],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Section B: Parent / Guardian Information', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['9. Father\'s Name:', ''],
        ['10. Father\'s Occupation:', ''],
        ['11. Father\'s CNIC:', ''],
        ['12. Mother\'s Name:', ''],
        ['13. Mother\'s Occupation:', ''],
        ['14. Guardian Name (if different):', ''],
        ['15. Primary Contact Number:', ''],
        ['16. Alternate Contact Number:', ''],
        ['17. Email Address:', ''],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Section C: Address', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['18. Residential Address:', ''],
        ['19. City:', ''],
        ['20. Province / State:', ''],
        ['21. Postal Code:', ''],
        ['22. Permanent Address (if different):', ''],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Section D: Previous Education', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['23. Last School Attended:', ''],
        ['24. Class Completed:', ''],
        ['25. Percentage / Grade:', ''],
        ['26. Year of Completion:', ''],
        ['27. Reason for Leaving:', ''],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Section E: Admission Details', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['28. Class Applying For:', ''],
        ['29. Section (if applicable):', ''],
        ['30. Transport Required:', '☐ Yes    ☐ No'],
        ['31. Hostel Required:', '☐ Yes    ☐ No'],
        ['32. Any Special Medical Condition:', ''],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Section F: Declaration', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'I hereby declare that the information provided above is true and correct to the best of my knowledge. I understand that any false information may result in the cancellation of admission.' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'heading', text: 'Attached Documents (please tick):', level: 3, bold: true },
    { type: 'list', items: [
      '☐ Birth Certificate (copy)',
      '☐ Previous School Leaving Certificate',
      '☐ Last Report Card (copy)',
      '☐ 4 Passport-size Photographs',
      '☐ Parent/Guardian CNIC (copy)',
      '☐ Student B-Form (copy)',
      '☐ Medical Certificate (if applicable)',
    ] },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: '_____________________              _____________________' },
    { type: 'paragraph', text: 'Parent/Guardian Signature        Date', italic: true, size: 10 },
    { type: 'spacer' },
    { type: 'paragraph', text: '_____________________              _____________________' },
    { type: 'paragraph', text: 'For Office Use Only                              Admission Officer', italic: true, size: 10 },
  ],
};

// ============================================================
// 16. TRANSFER CERTIFICATE
// ============================================================
const transferCertificate: DocTemplate = {
  id: 'transfer-certificate',
  name: 'Transfer Certificate',
  category: 'school',
  description: 'School leaving / transfer certificate for students',
  keywords: ['transfer certificate', 'school leaving', 'tc', 'leaving certificate'],
  fileName: 'Transfer_Certificate.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC PUBLIC SCHOOL', alignment: 'center', size: 20, color: '#6D28D9' },
    { type: 'paragraph', text: '123 Education Lane, Springfield, IL 62701', alignment: 'center', size: 10 },
    { type: 'paragraph', text: 'Affiliated with State Board of Education', alignment: 'center', italic: true, size: 9 },
    { type: 'spacer' },
    { type: 'heading', text: 'TRANSFER CERTIFICATE', alignment: 'center', size: 18, bold: true, color: '#111827' },
    { type: 'paragraph', text: '(School Leaving Certificate)', alignment: 'center', italic: true, size: 11 },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Certificate No: TC-2025-015', bold: true, alignment: 'right' },
    { type: 'paragraph', text: 'Date of Issue: January 15, 2025', alignment: 'right' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'This is to certify that the following student has been a bonafide student of this institution and is hereby granted transfer certificate on request of the parent/guardian.' },
    { type: 'spacer' },

    {
      type: 'table',
      rows: [
        ['1. Name of Student', 'Ali Khan'],
        ['2. Father\'s Name', 'Ahmed Khan'],
        ['3. Mother\'s Name', 'Fatima Khan'],
        ['4. Date of Birth', 'May 10, 2015'],
        ['5. Admission Number', 'ADM-2020-158'],
        ['6. Date of Admission', 'April 1, 2020'],
        ['7. Class at Time of Leaving', '5-A'],
        ['8. Date of Leaving', 'January 14, 2025'],
        ['9. Reason for Leaving', 'Family relocating to another city'],
        ['10. Last Exam Passed', 'Class 4 (Final Exam 2024)'],
        ['11. Conduct', 'Excellent'],
        ['12. Character Certificate', 'Issued Separately'],
        ['13. Dues Cleared', 'Yes'],
        ['14. Any Other Remarks', 'Good academic record. Recommended for admission to new school.'],
      ],
    },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'This certificate is issued as per the school records. The student has cleared all dues and returned all school property.' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: '_____________________              _____________________', alignment: 'center' },
    { type: 'paragraph', text: 'Class Teacher                              Principal', alignment: 'center', italic: true, size: 10 },
    { type: 'spacer' },
    { type: 'paragraph', text: 'School Seal', alignment: 'center', italic: true, size: 10 },
  ],
};

// ============================================================
// 17. CHARACTER CERTIFICATE
// ============================================================
const characterCertificate: DocTemplate = {
  id: 'character-certificate',
  name: 'Character Certificate',
  category: 'school',
  description: 'Student character and conduct certificate',
  keywords: ['character certificate', 'conduct certificate', 'character'],
  fileName: 'Character_Certificate.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC PUBLIC SCHOOL', alignment: 'center', size: 20, color: '#6D28D9' },
    { type: 'paragraph', text: '123 Education Lane, Springfield, IL 62701', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'heading', text: 'CHARACTER CERTIFICATE', alignment: 'center', size: 20, bold: true, color: '#111827' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Certificate No: CC-2025-015', bold: true, alignment: 'right' },
    { type: 'paragraph', text: 'Date of Issue: January 15, 2025', alignment: 'right' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'TO WHOM IT MAY CONCERN', alignment: 'center', bold: true, size: 12 },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'This is to certify that Mr./Ms. Ali Khan, son/daughter of Mr. Ahmed Khan, was a student of this institution from April 1, 2020 to January 14, 2025. During this period, he/she was a student of Class 5-A.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'During his/her stay at our institution, we found him/her to be a student of excellent moral character and conduct. He/she was respectful towards teachers, cooperative with fellow students, and actively participated in both academic and co-curricular activities.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'His/her behavior throughout the period of study was exemplary, and he/she was never involved in any disciplinary issue. We wish him/her all the best for future endeavors.' },
    { type: 'spacer' },
    { type: 'spacer' },

    {
      type: 'table',
      rows: [
        ['Student Name:', 'Ali Khan'],
        ['Father\'s Name:', 'Ahmed Khan'],
        ['Class Last Attended:', '5-A'],
        ['Period of Study:', 'April 2020 – January 2025'],
        ['Overall Conduct:', 'Excellent'],
        ['Disciplinary Record:', 'Clean — No issues'],
      ],
    },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: '_____________________              _____________________', alignment: 'center' },
    { type: 'paragraph', text: 'Class Teacher                              Principal', alignment: 'center', italic: true, size: 10 },
    { type: 'spacer' },
    { type: 'paragraph', text: '(School Seal)', alignment: 'center', italic: true, size: 10 },
  ],
};

// ============================================================
// 18. BONAFIDE CERTIFICATE
// ============================================================
const bonafideCertificate: DocTemplate = {
  id: 'bonafide',
  name: 'Bonafide Certificate',
  category: 'school',
  description: 'Certificate confirming a student is enrolled in the school',
  keywords: ['bonafide', 'bonafide certificate', 'enrollment certificate'],
  fileName: 'Bonafide_Certificate.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC PUBLIC SCHOOL', alignment: 'center', size: 20, color: '#6D28D9' },
    { type: 'paragraph', text: '123 Education Lane, Springfield, IL 62701', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'heading', text: 'BONAFIDE CERTIFICATE', alignment: 'center', size: 20, bold: true, color: '#111827' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Certificate No: BC-2025-015', bold: true, alignment: 'right' },
    { type: 'paragraph', text: 'Date of Issue: January 15, 2025', alignment: 'right' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'This is to certify that Ali Khan, son/daughter of Ahmed Khan, is a bonafide student of ABC Public School, currently studying in Class 5-A during the academic session 2024-2025.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'This certificate is being issued on the request of the student/parent for the purpose of [passport application / bank account opening / scholarship application / other official purpose].' },
    { type: 'spacer' },
    { type: 'spacer' },

    {
      type: 'table',
      rows: [
        ['Student Name:', 'Ali Khan'],
        ['Father\'s Name:', 'Ahmed Khan'],
        ['Date of Birth:', 'May 10, 2015'],
        ['Admission Number:', 'ADM-2020-158'],
        ['Current Class:', '5-A'],
        ['Academic Session:', '2024-2025'],
        ['Enrollment Status:', 'Currently Enrolled — Active'],
      ],
    },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'We confirm that the student is attending regular classes at our institution as of the date of this certificate.' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: '_____________________              _____________________', alignment: 'center' },
    { type: 'paragraph', text: 'Class Teacher                              Principal', alignment: 'center', italic: true, size: 10 },
    { type: 'spacer' },
    { type: 'paragraph', text: '(School Seal)', alignment: 'center', italic: true, size: 10 },
  ],
};

// ============================================================
// 19. FEE RECEIPT
// ============================================================
const feeReceipt: DocTemplate = {
  id: 'fee-receipt',
  name: 'Fee Receipt',
  category: 'school',
  description: 'Student fee payment receipt',
  keywords: ['fee receipt', 'receipt', 'payment receipt', 'school fee'],
  fileName: 'Fee_Receipt.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC PUBLIC SCHOOL', alignment: 'center', size: 18, color: '#6D28D9' },
    { type: 'paragraph', text: '123 Education Lane, Springfield, IL 62701  •  (555) 100-2000', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'heading', text: 'FEE PAYMENT RECEIPT', alignment: 'center', size: 14, bold: true, color: '#111827' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Receipt No: FR-2025-0158', bold: true, alignment: 'right' },
    { type: 'paragraph', text: 'Date: January 15, 2025', alignment: 'right' },
    { type: 'spacer' },

    {
      type: 'table',
      rows: [
        ['Student Name:', 'Ali Khan'],
        ['Father\'s Name:', 'Ahmed Khan'],
        ['Class:', '5-A'],
        ['Roll Number:', '15'],
        ['Academic Session:', '2024-2025'],
        ['Payment For:', 'Monthly Tuition Fee — January 2025'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Fee Details', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Particulars', 'Amount'],
        ['Tuition Fee', '$150.00'],
        ['Transport Fee', '$50.00'],
        ['Library Fee', '$10.00'],
        ['Computer Lab Fee', '$15.00'],
        ['Examination Fee', '$25.00'],
        ['Subtotal:', '$250.00'],
        ['Previous Balance:', '$0.00'],
        ['Discount (if any):', '-$0.00'],
        ['Late Fine:', '$0.00'],
        ['TOTAL PAID:', '$250.00'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Payment Information', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Payment Method:', 'Cash'],
        ['Received By:', 'Mrs. Sarah Wilson (Accounts Office)'],
        ['Amount in Words:', 'Two Hundred Fifty US Dollars Only'],
        ['Balance Remaining:', '$0.00'],
      ],
    },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Thank you for your prompt payment.', alignment: 'center', italic: true },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: '_____________________              _____________________', alignment: 'center' },
    { type: 'paragraph', text: 'Cashier Signature                        School Stamp', alignment: 'center', italic: true, size: 10 },
  ],
};

// ============================================================
// 20. REFERENCE LETTER
// ============================================================
const referenceLetter: DocTemplate = {
  id: 'reference-letter',
  name: 'Reference Letter',
  category: 'personal',
  description: 'Professional reference letter for job or academic purposes',
  keywords: ['reference letter', 'recommendation letter', 'reference'],
  fileName: 'Reference_Letter.docx',
  sections: [
    { type: 'paragraph', text: 'ABC Corporation', bold: true, size: 14 },
    { type: 'paragraph', text: '123 Business Street, Suite 100, New York, NY 10001' },
    { type: 'paragraph', text: 'Phone: +1 (555) 123-4567  |  Email: hr@abccorp.com' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'January 15, 2025' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'To Whom It May Concern,' },
    { type: 'spacer' },
    { type: 'heading', text: 'Re: Reference for John Smith', level: 3, bold: true },
    { type: 'spacer' },
    { type: 'paragraph', text: 'I am pleased to write this letter of reference for John Smith, who worked under my supervision as a Senior Software Engineer at ABC Corporation from January 2020 to December 2024.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'During his four years with our organization, John consistently demonstrated exceptional technical skills, strong work ethic, and outstanding leadership abilities. He led several high-impact projects, including the redesign of our core platform which resulted in a 40% improvement in system performance.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'John has a rare combination of deep technical expertise and excellent communication skills. He mentored junior engineers, presented at team meetings, and collaborated effectively with cross-functional teams including product, design, and QA.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'In his time with us, John delivered every project on schedule and often exceeded expectations. His code was consistently high quality, well-documented, and easy to maintain. He was a trusted team member whom others could always count on.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'I recommend John without any reservations. He would be a valuable asset to any organization seeking a talented and dedicated engineer. Please feel free to contact me if you need any additional information.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Sincerely,' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Michael Davis', bold: true },
    { type: 'paragraph', text: 'Engineering Manager' },
    { type: 'paragraph', text: 'ABC Corporation' },
    { type: 'paragraph', text: 'Email: michael.davis@abccorp.com  |  Phone: +1 (555) 123-4567' },
  ],
};

// ============================================================
// 21. RESIGNATION LETTER
// ============================================================
const resignationLetter: DocTemplate = {
  id: 'resignation-letter',
  name: 'Resignation Letter',
  category: 'personal',
  description: 'Professional resignation letter for job separation',
  keywords: ['resignation', 'resignation letter', 'resign', 'notice letter'],
  fileName: 'Resignation_Letter.docx',
  sections: [
    { type: 'paragraph', text: 'John Smith', bold: true, size: 13 },
    { type: 'paragraph', text: '123 Main Street, San Francisco, CA 94102' },
    { type: 'paragraph', text: 'john.smith@email.com | +1 (555) 123-4567' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'January 15, 2025' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Mr. Michael Davis' },
    { type: 'paragraph', text: 'Engineering Manager' },
    { type: 'paragraph', text: 'ABC Corporation' },
    { type: 'paragraph', text: '123 Business Street, New York, NY 10001' },
    { type: 'spacer' },
    { type: 'heading', text: 'Re: Resignation from Position of Senior Software Engineer', level: 3, bold: true },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Dear Mr. Davis,' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'I am writing to formally resign from my position as Senior Software Engineer at ABC Corporation, effective February 15, 2025. This decision was not an easy one, as my time here has been both personally and professionally rewarding.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'I have had the privilege of working with an exceptional team and I am grateful for the opportunities I have been given during my four years with the company. The experience and skills I have gained here have been invaluable to my career growth.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Over the next four weeks, I am committed to ensuring a smooth transition. I will complete all pending work on my current projects, document my responsibilities thoroughly, and assist in training my replacement if needed.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'I wish ABC Corporation and all my colleagues continued success. I hope our paths cross again in the future.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Thank you for the support and guidance you have provided during my tenure.' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'Sincerely,' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: 'John Smith', bold: true },
  ],
};

// ============================================================
// 22. EXPERIENCE LETTER
// ============================================================
const experienceLetter: DocTemplate = {
  id: 'experience-letter',
  name: 'Experience Letter',
  category: 'personal',
  description: 'Work experience certificate for employees',
  keywords: ['experience letter', 'work experience', 'employment certificate'],
  fileName: 'Experience_Letter.docx',
  sections: [
    { type: 'logo-placeholder', alignment: 'center' },
    { type: 'spacer' },
    { type: 'heading', text: 'ABC CORPORATION', alignment: 'center', size: 20, color: '#6D28D9' },
    { type: 'paragraph', text: '123 Business Street, Suite 100, New York, NY 10001', alignment: 'center', size: 10 },
    { type: 'paragraph', text: 'Phone: +1 (555) 123-4567  |  Email: hr@abccorp.com', alignment: 'center', size: 10 },
    { type: 'spacer' },
    { type: 'heading', text: 'EXPERIENCE CERTIFICATE', alignment: 'center', size: 16, bold: true, color: '#111827' },
    { type: 'spacer' },
    { type: 'divider' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'Ref No: EXP-2025-0042', bold: true, alignment: 'right' },
    { type: 'paragraph', text: 'Date: January 15, 2025', alignment: 'right' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'TO WHOM IT MAY CONCERN', alignment: 'center', bold: true },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'This is to certify that Mr. John Smith was employed with ABC Corporation from January 1, 2020 to December 31, 2024. During this period, he served as a Senior Software Engineer in the Engineering Department.' },
    { type: 'spacer' },

    { type: 'heading', text: 'Employment Details', level: 3, bold: true, color: '#6D28D9' },
    {
      type: 'table',
      rows: [
        ['Employee Name:', 'John Smith'],
        ['Designation:', 'Senior Software Engineer'],
        ['Department:', 'Engineering — Platform Team'],
        ['Employee ID:', 'EMP-2020-0456'],
        ['Date of Joining:', 'January 1, 2020'],
        ['Date of Leaving:', 'December 31, 2024'],
        ['Employment Type:', 'Full-time Permanent'],
        ['Reporting Manager:', 'Michael Davis'],
      ],
    },
    { type: 'spacer' },

    { type: 'heading', text: 'Key Responsibilities', level: 3, bold: true, color: '#6D28D9' },
    { type: 'list', items: [
      'Led development of core platform features used by 1M+ customers',
      'Managed a team of 6 engineers',
      'Architected microservices infrastructure',
      'Conducted code reviews and mentored junior developers',
      'Collaborated with product and design teams',
    ] },
    { type: 'spacer' },

    { type: 'heading', text: 'Performance & Conduct', level: 3, bold: true, color: '#6D28D9' },
    { type: 'paragraph', text: 'During his tenure, Mr. Smith demonstrated exceptional technical skills, strong leadership qualities, and exemplary professional conduct. His performance was consistently rated as "Outstanding" in all annual reviews.' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'We wish him continued success in all future endeavors.' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'spacer' },

    { type: 'paragraph', text: 'For ABC Corporation,' },
    { type: 'spacer' },
    { type: 'spacer' },
    { type: 'paragraph', text: '_____________________', },
    { type: 'paragraph', text: 'Michael Davis', bold: true },
    { type: 'paragraph', text: 'Engineering Manager' },
    { type: 'spacer' },
    { type: 'paragraph', text: '(Company Seal)', italic: true, size: 9 },
  ],
};

// ============================================================
// EXPORT
// ============================================================
export const docTemplates: DocTemplate[] = [
  invoice,
  businessProposal,
  meetingMinutes,
  atsResume,
  modernResume,
  europassCV,
  coverLetter,
  purchaseOrder,
  quotation,
  companyLetterhead,
  contractAgreement,
  studentIdCard,
  reportCard,
  certificateAchievement,
  admissionForm,
  transferCertificate,
  characterCertificate,
  bonafideCertificate,
  feeReceipt,
  referenceLetter,
  resignationLetter,
  experienceLetter,
];

// ============================================================
// FIND TEMPLATE
// ============================================================
export function findDocTemplate(prompt: string): DocTemplate | null {
  const lower = prompt.toLowerCase();
  let best: DocTemplate | null = null;
  let score = 0;

  docTemplates.forEach((t) => {
    let s = 0;
    t.keywords.forEach((k) => {
      if (lower.includes(k.toLowerCase())) s += k.length;
    });
    if (s > score) {
      score = s;
      best = t;
    }
  });

  return best;
}