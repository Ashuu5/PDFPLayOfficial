import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Zap, Globe, ArrowRight, Star,
  CheckCircle
} from 'lucide-react';

/* ============================================================
   UNIQUE SVG LOGOS — one per tool
   ============================================================ */

const MergePdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <rect x="14" y="10" width="12" height="16" rx="2" fill="white" opacity="0.55" />
    <rect x="22" y="22" width="12" height="16" rx="2" fill="white" />
    <path d="M22 18 L26 22 L22 26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const SplitPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <rect x="9"  y="12" width="12" height="24" rx="2" fill="white" opacity="0.9" />
    <rect x="27" y="12" width="12" height="24" rx="2" fill="white" opacity="0.55" />
    <line x1="24" y1="10" x2="24" y2="38" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
  </svg>
);

const CompressPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M14 16 L24 22 L34 16" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M14 24 L24 30 L34 24" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M14 32 L24 38 L34 32" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" />
  </svg>
);

const EditorPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M14 34 L14 26 L30 10 L38 18 L22 34 Z" fill="white" />
    <path d="M14 34 L22 34 L14 42 Z" fill="white" opacity="0.55" />
  </svg>
);

const RotatePdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M24 12 A12 12 0 1 1 13 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M10 12 L16 14 L13 20" fill="white" />
  </svg>
);

const OrganizePdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <rect x="11" y="12" width="12" height="12" rx="2" fill="white" />
    <rect x="25" y="12" width="12" height="12" rx="2" fill="white" opacity="0.55" />
    <rect x="11" y="26" width="12" height="12" rx="2" fill="white" opacity="0.55" />
    <rect x="25" y="26" width="12" height="12" rx="2" fill="white" />
  </svg>
);

const WatermarkPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <rect x="12" y="14" width="24" height="20" rx="2" fill="white" opacity="0.4" />
    <text x="24" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">WM</text>
  </svg>
);

const ProtectPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M24 10 L36 14 L36 24 C36 31 31 37 24 40 C17 37 12 31 12 24 L12 14 Z" fill="white" opacity="0.9" />
    <rect x="21" y="22" width="6" height="8" rx="1" fill="#E5252A" />
    <path d="M22 22 V20 A2 2 0 0 1 26 20 V22" stroke="#E5252A" strokeWidth="1.5" fill="none" />
  </svg>
);

const UnlockPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M24 10 L36 14 L36 24 C36 31 31 37 24 40 C17 37 12 31 12 24 L12 14 Z" fill="white" opacity="0.9" />
    <rect x="21" y="22" width="6" height="8" rx="1" fill="#E5252A" />
    <path d="M22 22 V20 A2 2 0 0 0 26 20" stroke="#E5252A" strokeWidth="1.5" fill="none" />
  </svg>
);

const SignPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M12 34 C14 28 16 30 18 26 C20 22 22 30 26 26 C30 22 32 28 36 24"
      stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    <line x1="12" y1="38" x2="36" y2="38" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
  </svg>
);

const ExtractPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <rect x="14" y="10" width="20" height="22" rx="2" fill="white" opacity="0.5" />
    <rect x="20" y="20" width="14" height="16" rx="2" fill="white" />
    <path d="M18 24 L20 24" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const OcrPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M12 16 V12 H16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M32 12 H36 V16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M36 32 V36 H32" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M16 36 H12 V32" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    <rect x="20" y="20" width="8" height="8" rx="1" fill="white" />
    <line x1="20" y1="24" x2="28" y2="24" stroke="#E5252A" strokeWidth="1.2" />
  </svg>
);

const CropPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <path d="M14 10 V30 A4 4 0 0 0 18 34 H38" stroke="white" strokeWidth="2" fill="none" />
    <path d="M10 14 H30 A4 4 0 0 1 34 18 V38" stroke="white" strokeWidth="2" fill="none" />
  </svg>
);

const MetadataPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx="10" fill="#E5252A" />
    <circle cx="24" cy="24" r="10" stroke="white" strokeWidth="2.2" fill="none" />
    <line x1="24" y1="18" x2="24" y2="25" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="24" cy="29" r="1.4" fill="white" />
  </svg>
);

const PdfToWordLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-p2w" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E5252A" />
        <stop offset="100%" stopColor="#2B579A" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-p2w)" />
    <text x="13" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
    <path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="36" y="29" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold">W</text>
  </svg>
);

const PdfToExcelLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-p2x" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E5252A" />
        <stop offset="100%" stopColor="#217346" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-p2x)" />
    <text x="13" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
    <path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="36" y="29" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold">X</text>
  </svg>
);

const PdfToPptLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-p2p" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E5252A" />
        <stop offset="100%" stopColor="#D24726" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-p2p)" />
    <text x="13" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
    <path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="36" y="29" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold">P</text>
  </svg>
);

const PdfToJpgLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-p2j" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E5252A" />
        <stop offset="100%" stopColor="#0891B2" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-p2j)" />
    <text x="10" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
    <path d="M21 24 L26 24 M24 21 L27 24 L24 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="29" y="18" width="13" height="12" rx="1.5" fill="white" opacity="0.9" />
    <circle cx="33" cy="22" r="1.5" fill="#0891B2" />
    <path d="M30 29 L34 24 L36 26 L39 22 L41 26 L41 29 Z" fill="#0891B2" />
  </svg>
);

const WordToPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-w2p" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2B579A" />
        <stop offset="100%" stopColor="#E5252A" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-w2p)" />
    <text x="13" y="29" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold">W</text>
    <path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="36" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
  </svg>
);

const ExcelToPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-x2p" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#217346" />
        <stop offset="100%" stopColor="#E5252A" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-x2p)" />
    <text x="13" y="29" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold">X</text>
    <path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="36" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
  </svg>
);

const PptToPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-ppt2p" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D24726" />
        <stop offset="100%" stopColor="#E5252A" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-ppt2p)" />
    <text x="13" y="29" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold">P</text>
    <path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="36" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
  </svg>
);

const JpgToPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <defs>
      <linearGradient id="hp-j2p" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#E5252A" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="10" fill="url(#hp-j2p)" />
    <rect x="6" y="18" width="12" height="12" rx="1.5" fill="white" opacity="0.9" />
    <circle cx="10" cy="22" r="1.5" fill="#7C3AED" />
    <path d="M7 29 L11 24 L13 26 L16 22 L18 26 L18 29 Z" fill="#7C3AED" />
    <path d="M22 24 L27 24 M25 21 L28 24 L25 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="38" y="30" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold">PDF</text>
  </svg>
);

/* ============================================================
   TOOLS DATA
   ============================================================ */
type Tool = {
  name: string;
  path: string;
  logo: React.ComponentType<{ size?: number }>;
  desc: string;
  category: 'organize' | 'optimize' | 'convert-to' | 'convert-from' | 'edit' | 'secure';
};

const tools: Tool[] = [
  { name: 'Merge PDF',       path: '/merge-pdf',         logo: MergePdfLogo,    desc: 'Combine multiple PDF files into one document', category: 'organize' },
  { name: 'Split PDF',       path: '/split-pdf',         logo: SplitPdfLogo,    desc: 'Extract pages or split PDF into files',        category: 'organize' },
  { name: 'Compress PDF',    path: '/compress-pdf',      logo: CompressPdfLogo, desc: 'Reduce PDF file size',                         category: 'optimize' },
  { name: 'PDF Editor',      path: '/pdf-editor',        logo: EditorPdfLogo,   desc: 'Edit PDF documents',                           category: 'edit' },
  { name: 'Rotate PDF',      path: '/rotate-pdf',        logo: RotatePdfLogo,   desc: 'Rotate PDF pages',                             category: 'edit' },
  { name: 'Organize PDF',    path: '/organize-pdf',      logo: OrganizePdfLogo, desc: 'Reorder and delete pages',                     category: 'organize' },
  { name: 'Watermark PDF',   path: '/watermark-pdf',     logo: WatermarkPdfLogo,desc: 'Add watermark to PDF',                         category: 'edit' },
  { name: 'Protect PDF',     path: '/protect-pdf',       logo: ProtectPdfLogo,  desc: 'Password protect PDF',                         category: 'secure' },
  { name: 'Unlock PDF',      path: '/unlock-pdf',        logo: UnlockPdfLogo,   desc: 'Remove PDF password',                          category: 'secure' },
  { name: 'Sign PDF',        path: '/pdf-sign',          logo: SignPdfLogo,     desc: 'Sign PDF documents',                           category: 'secure' },
  { name: 'Extract Pages',   path: '/extract-pages',     logo: ExtractPdfLogo,  desc: 'Extract specific pages',                       category: 'organize' },
  { name: 'OCR PDF',         path: '/ocr-pdf',           logo: OcrPdfLogo,      desc: 'Extract text from scanned PDF',                category: 'edit' },
  { name: 'Crop PDF',        path: '/crop-pdf',          logo: CropPdfLogo,     desc: 'Crop PDF margins',                             category: 'edit' },
  { name: 'Metadata Editor', path: '/metadata-editor',   logo: MetadataPdfLogo, desc: 'Edit PDF properties',                          category: 'edit' },
  { name: 'PDF to Word',     path: '/pdf-to-word',       logo: PdfToWordLogo,   desc: 'Convert PDF to Word files',                    category: 'convert-from' },
  { name: 'Word to PDF',     path: '/word-to-pdf',       logo: WordToPdfLogo,   desc: 'Convert Word to PDF',                          category: 'convert-to' },
  { name: 'PDF to Excel',    path: '/pdf-to-excel',      logo: PdfToExcelLogo,  desc: 'Convert PDF to Excel',                         category: 'convert-from' },
  { name: 'Excel to PDF',    path: '/excel-to-pdf',      logo: ExcelToPdfLogo,  desc: 'Convert Excel to PDF',                         category: 'convert-to' },
  { name: 'PDF to PPT',      path: '/pdf-to-powerpoint', logo: PdfToPptLogo,    desc: 'Convert PDF to PowerPoint',                    category: 'convert-from' },
  { name: 'PPT to PDF',      path: '/powerpoint-to-pdf', logo: PptToPdfLogo,    desc: 'Convert PowerPoint to PDF',                    category: 'convert-to' },
  { name: 'JPG to PDF',      path: '/jpg-to-pdf',        logo: JpgToPdfLogo,    desc: 'Convert images to PDF',                        category: 'convert-to' },
  { name: 'PDF to JPG',      path: '/pdf-to-jpg',        logo: PdfToJpgLogo,    desc: 'Convert PDF to images',                        category: 'convert-from' },
];

const trustItems = [
  { icon: Shield,      text: 'Private'   },
  { icon: Zap,         text: 'Instant'   },
  { icon: Globe,       text: 'Anywhere'  },
  { icon: Star,        text: 'Free'      },
  { icon: CheckCircle, text: 'No Signup' },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all',          label: 'All Tools' },
    { id: 'organize',     label: 'Organize' },
    { id: 'optimize',     label: 'Optimize' },
    { id: 'convert-to',   label: 'Convert to PDF' },
    { id: 'convert-from', label: 'Convert from PDF' },
    { id: 'edit',         label: 'Edit' },
    { id: 'secure',       label: 'Security' },
  ];

  const filteredTools = activeCategory === 'all'
    ? tools
    : tools.filter((t) => t.category === activeCategory);

  return (
    <div className="text-gray-200">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(239,68,68,0.15),transparent)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center px-6 pt-8 pb-6">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] backdrop-blur rounded-full px-3 py-1 mb-4">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em]">
              ALL TOOLS · 100% FREE
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white mb-3">
            Every PDF tool
            <br />
            <span className="text-gray-500">you'll ever need.</span>
          </h1>

          <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed mb-5">
            Merge, split, convert, compress, and edit PDFs.
            Everything runs <span className="text-white">locally in your browser</span> — nothing is ever uploaded to a server.
          </p>

          <div className="flex items-center justify-center gap-2">
            <a
              href="#tools"
              className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-all text-sm"
            >
              Browse Tools
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/merge-pdf"
              className="inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.03] text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/[0.08] transition-all text-sm"
            >
              <Zap className="w-3.5 h-3.5 text-red-400" />
              Start with Merge
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-white/5 bg-gradient-to-r from-red-500/[0.04] via-transparent to-red-500/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-2.5">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {trustItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 text-gray-400">
                  <Icon className="w-3 h-3 text-red-400" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase">
                    {item.text}
                  </span>
                  {i < trustItems.length - 1 && (
                    <span className="text-gray-700 ml-3 hidden sm:inline">•</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
            Tools
          </h2>
          <p className="text-gray-500 text-xs">
            {filteredTools.length} of {tools.length} tools shown
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredTools.map((tool) => {
            const Logo = tool.logo;
            return (
              <Link
                key={tool.path}
                to={tool.path}
                className="group flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
              >
                <div className="shrink-0">
                  <Logo size={34} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-white truncate mb-0.5">
                    {tool.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate">
                    {tool.desc}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="max-w-2xl mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
              Built for privacy and speed
            </h2>
            <p className="text-gray-500 text-xs">
              No servers, no tracking, no compromises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              { icon: Shield, title: '100% Private',    desc: 'Files never leave your device. Everything runs locally in your browser.' },
              { icon: Zap,    title: 'Instant Results', desc: 'No uploads or queues. Files process the moment you drop them in.' },
              { icon: Star,   title: 'Free Forever',    desc: 'No premium tiers, no hidden fees, no account required. Ever.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-[13px]">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="max-w-2xl mb-5">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-1">
              How it works
            </h2>
            <p className="text-gray-500 text-xs">
              Three steps. Zero friction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              { n: '1', title: 'Pick a tool',    desc: 'Choose from 22 utilities.' },
              { n: '2', title: 'Drop your file', desc: 'Files process right in your browser.' },
              { n: '3', title: 'Download',       desc: 'Grab your result instantly.' },
            ].map((s) => (
              <div
                key={s.n}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white font-bold text-xs mb-3">
                  {s.n}
                </div>
                <h3 className="font-semibold text-white mb-1 text-[13px]">{s.title}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
