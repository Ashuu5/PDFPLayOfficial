import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Globe, ArrowRight, Star, CheckCircle, BookOpen } from 'lucide-react';

// --- TUMHARI SARI SVG LOGOS WAISE HI RAKHI HAIN (yahan se) ---
const MergePdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><rect x="14" y="10" width="12" height="16" rx="2" fill="white" opacity="0.55" /><rect x="22" y="22" width="12" height="16" rx="2" fill="white" /><path d="M22 18 L26 22 L22 26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
);
const SplitPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><rect x="9" y="12" width="12" height="24" rx="2" fill="white" opacity="0.9" /><rect x="27" y="12" width="12" height="24" rx="2" fill="white" opacity="0.55" /><line x1="24" y1="10" x2="24" y2="38" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" /></svg>
);
const CompressPdfLogo = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M14 16 L24 22 L34 16" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M14 24 L24 30 L34 24" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M14 32 L24 38 L34 32" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55" /></svg>
);
const EditorPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M14 34 L14 26 L30 10 L38 18 L22 34 Z" fill="white" /><path d="M14 34 L22 34 L14 42 Z" fill="white" opacity="0.55" /></svg>);
const RotatePdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M24 12 A12 12 0 1 1 13 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M10 12 L16 14 L13 20" fill="white" /></svg>);
const OrganizePdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><rect x="11" y="12" width="12" height="12" rx="2" fill="white" /><rect x="25" y="12" width="12" height="12" rx="2" fill="white" opacity="0.55" /><rect x="11" y="26" width="12" height="12" rx="2" fill="white" opacity="0.55" /><rect x="25" y="26" width="12" height="12" rx="2" fill="white" /></svg>);
const WatermarkPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><rect x="12" y="14" width="24" height="20" rx="2" fill="white" opacity="0.4" /><text x="24" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">WM</text></svg>);
const ProtectPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M24 10 L36 14 L36 24 C36 31 31 37 24 40 C17 37 12 31 12 24 L12 14 Z" fill="white" opacity="0.9" /><rect x="21" y="22" width="6" height="8" rx="1" fill="#E5252A" /><path d="M22 22 V20 A2 2 0 0 1 26 20 V22" stroke="#E5252A" strokeWidth="1.5" fill="none" /></svg>);
const UnlockPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M24 10 L36 14 L36 24 C36 31 31 37 24 40 C17 37 12 31 12 24 L12 14 Z" fill="white" opacity="0.9" /><rect x="21" y="22" width="6" height="8" rx="1" fill="#E5252A" /><path d="M22 22 V20 A2 2 0 0 0 26 20" stroke="#E5252A" strokeWidth="1.5" fill="none" /></svg>);
const SignPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M12 34 C14 28 16 30 18 26 C20 22 22 30 26 26 C30 22 32 28 36 24" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" /><line x1="12" y1="38" x2="36" y2="38" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" /></svg>);
const ExtractPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><rect x="14" y="10" width="20" height="22" rx="2" fill="white" opacity="0.5" /><rect x="20" y="20" width="14" height="16" rx="2" fill="white" /></svg>);
const OcrPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M12 16 V12 H16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /><path d="M32 12 H36 V16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /><path d="M36 32 V36 H32" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /><path d="M16 36 H12 V32" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" /><rect x="20" y="20" width="8" height="8" rx="1" fill="white" /><line x1="20" y1="24" x2="28" y2="24" stroke="#E5252A" strokeWidth="1.2" /></svg>);
const CropPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><path d="M14 10 V30 A4 4 0 0 0 18 34 H38" stroke="white" strokeWidth="2" fill="none" /><path d="M10 14 H30 A4 4 0 0 1 34 18 V38" stroke="white" strokeWidth="2" fill="none" /></svg>);
const MetadataPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="#E5252A" /><circle cx="24" cy="24" r="10" stroke="white" strokeWidth="2.2" fill="none" /><line x1="24" y1="18" x2="24" y2="25" stroke="white" strokeWidth="2.4" strokeLinecap="round" /><circle cx="24" cy="29" r="1.4" fill="white" /></svg>);
const PdfToWordLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-p2w" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#E5252A" /><stop offset="100%" stopColor="#2B579A" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-p2w)" /><text x="13" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text><path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><text x="36" y="29" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="13" fontWeight="bold">W</text></svg>);
const PdfToExcelLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-p2x" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#E5252A" /><stop offset="100%" stopColor="#217346" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-p2x)" /><text x="13" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text><path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><text x="36" y="29" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="13" fontWeight="bold">X</text></svg>);
const PdfToPptLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-p2p" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#E5252A" /><stop offset="100%" stopColor="#D24726" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-p2p)" /><text x="13" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text><path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><text x="36" y="29" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="13" fontWeight="bold">P</text></svg>);
const PdfToJpgLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-p2j" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#E5252A" /><stop offset="100%" stopColor="#0891B2" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-p2j)" /><text x="10" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text><path d="M21 24 L26 24 M24 21 L27 24 L24 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><rect x="29" y="18" width="13" height="12" rx="1.5" fill="white" opacity="0.9" /><circle cx="33" cy="22" r="1.5" fill="#0891B2" /><path d="M30 29 L34 24 L36 26 L39 22 L41 26 L41 29 Z" fill="#0891B2" /></svg>);
const WordToPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-w2p" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2B579A" /><stop offset="100%" stopColor="#E5252A" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-w2p)" /><text x="13" y="29" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="13" fontWeight="bold">W</text><path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><text x="36" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text></svg>);
const ExcelToPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-x2p" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#217346" /><stop offset="100%" stopColor="#E5252A" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-x2p)" /><text x="13" y="29" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="13" fontWeight="bold">X</text><path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><text x="36" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text></svg>);
const PptToPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-ppt2p" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#D24726" /><stop offset="100%" stopColor="#E5252A" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-ppt2p)" /><text x="13" y="29" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="13" fontWeight="bold">P</text><path d="M20 24 L28 24 M26 21 L29 24 L26 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><text x="36" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text></svg>);
const JpgToPdfLogo = ({ size = 40 }: { size?: number }) => (<svg width={size} height={size} viewBox="0 0 48 48" fill="none"><defs><linearGradient id="hp-j2p" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#E5252A" /></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#hp-j2p)" /><rect x="6" y="18" width="12" height="12" rx="1.5" fill="white" opacity="0.9" /><circle cx="10" cy="22" r="1.5" fill="#7C3AED" /><path d="M7 29 L11 24 L13 26 L16 22 L18 26 L18 29 Z" fill="#7C3AED" /><path d="M22 24 L27 24 M25 21 L28 24 L25 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /><text x="38" y="30" textAnchor="middle" fill="white" fontFamily="Arial" fontSize="10" fontWeight="bold">PDF</text></svg>);
// --- LOGOS END ---

type Tool = { name: string; path: string; logo: any; desc: string; category: string; };

const tools: Tool[] = [
  { name: 'Merge PDF', path: '/merge-pdf', logo: MergePdfLogo, desc: 'Combine multiple PDF files into one document', category: 'organize' },
  { name: 'Split PDF', path: '/split-pdf', logo: SplitPdfLogo, desc: 'Extract pages or split PDF into files', category: 'organize' },
  { name: 'Compress PDF', path: '/compress-pdf', logo: CompressPdfLogo, desc: 'Reduce PDF file size up to 90%', category: 'optimize' },
  { name: 'PDF Editor', path: '/pdf-editor', logo: EditorPdfLogo, desc: 'Edit PDF documents directly', category: 'edit' },
  { name: 'Rotate PDF', path: '/rotate-pdf', logo: RotatePdfLogo, desc: 'Rotate PDF pages easily', category: 'edit' },
  { name: 'Organize PDF', path: '/organize-pdf', logo: OrganizePdfLogo, desc: 'Reorder and delete pages', category: 'organize' },
  { name: 'Watermark PDF', path: '/watermark-pdf', logo: WatermarkPdfLogo, desc: 'Add watermark to PDF', category: 'edit' },
  { name: 'Protect PDF', path: '/protect-pdf', logo: ProtectPdfLogo, desc: 'Password protect PDF files', category: 'secure' },
  { name: 'Unlock PDF', path: '/unlock-pdf', logo: UnlockPdfLogo, desc: 'Remove PDF password instantly', category: 'secure' },
  { name: 'Sign PDF', path: '/pdf-sign', logo: SignPdfLogo, desc: 'Sign PDF documents digitally', category: 'secure' },
  { name: 'Extract Pages', path: '/extract-pages', logo: ExtractPdfLogo, desc: 'Extract specific pages from PDF', category: 'organize' },
  { name: 'OCR PDF', path: '/ocr-pdf', logo: OcrPdfLogo, desc: 'Extract text from scanned PDF', category: 'edit' },
  { name: 'Crop PDF', path: '/crop-pdf', logo: CropPdfLogo, desc: 'Crop PDF margins perfectly', category: 'edit' },
  { name: 'Metadata Editor', path: '/metadata-editor', logo: MetadataPdfLogo, desc: 'Edit PDF properties & info', category: 'edit' },
  { name: 'PDF to Word', path: '/pdf-to-word', logo: PdfToWordLogo, desc: 'Convert PDF to editable Word', category: 'convert-from' },
  { name: 'Word to PDF', path: '/word-to-pdf', logo: WordToPdfLogo, desc: 'Convert Word docs to PDF', category: 'convert-to' },
  { name: 'PDF to Excel', path: '/pdf-to-excel', logo: PdfToExcelLogo, desc: 'Convert PDF tables to Excel', category: 'convert-from' },
  { name: 'Excel to PDF', path: '/excel-to-pdf', logo: ExcelToPdfLogo, desc: 'Convert Excel sheets to PDF', category: 'convert-to' },
  { name: 'PDF to PPT', path: '/pdf-to-powerpoint', logo: PdfToPptLogo, desc: 'Convert PDF to PowerPoint', category: 'convert-from' },
  { name: 'PPT to PDF', path: '/powerpoint-to-pdf', logo: PptToPdfLogo, desc: 'Convert PowerPoint to PDF', category: 'convert-to' },
  { name: 'JPG to PDF', path: '/jpg-to-pdf', logo: JpgToPdfLogo, desc: 'Convert images to PDF', category: 'convert-to' },
  { name: 'PDF to JPG', path: '/pdf-to-jpg', logo: PdfToJpgLogo, desc: 'Convert PDF pages to images', category: 'convert-from' },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 30, y: (e.clientY / window.innerHeight - 0.5) * -30 });
      document.querySelectorAll('.immersion-tool').forEach((card: any) => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const cx = e.clientX - rect.left - rect.width / 2;
          const cy = e.clientY - rect.top - rect.height / 2;
          const isHover = Math.abs(cx) < rect.width / 2 && Math.abs(cy) < rect.height / 2;
          if (isHover) {
            card.style.transform = `perspective(800px) rotateY(${cx / 12}deg) rotateX(${-cy / 12}deg) translateZ(20px) scale(1.04)`;
            card.style.boxShadow = `${-cx / 8}px ${-cy / 8}px 20px rgba(0,0,0,0.15)`;
          }
        }
      });
    };
    const handleLeave = () => {
      document.querySelectorAll('.immersion-tool').forEach((card: any) => {
        card.style.transform = `perspective(800px) rotateY(0) rotateX(0) translateZ(0) scale(1)`;
        card.style.boxShadow = `0 0 0 transparent`;
      });
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseleave', handleLeave); };
  }, []);

  const categories = [
    { id: 'all', label: 'All Tools' }, { id: 'organize', label: 'Organize' }, { id: 'optimize', label: 'Optimize' },
    { id: 'convert-to', label: 'Convert to PDF' }, { id: 'convert-from', label: 'Convert from PDF' }, { id: 'edit', label: 'Edit' }, { id: 'secure', label: 'Security' },
  ];

  const filtered = activeCategory === 'all'? tools : tools.filter(t => t.category === activeCategory);

  return (
    <div className="bg-[#FFFBF0] text-[#111] min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@500;700&display=swap');
       .font-syne{font-family:'Syne', sans-serif}
       .immersion-tool{transform-style:preserve-3d; transition: transform 0.18s cubic-bezier(0.23,1,0.32,1), box-shadow 0.18s ease;}
      `}</style>

      {/* HERO - VIDEO SE BEHTAR */}
      <section className="relative overflow-hidden border-b-[3px] border-black">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,#D4FF32_0%,transparent_50%),radial-gradient(circle_at_80%_70%,#FFB3B3_0%,transparent_50%)] opacity-40 pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-[5%] py-12 md:py-20 grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 border-[2.5px] border-black bg-white rounded-full px-4 py-1.5 font-bold text-[12px] tracking-widest shadow-[3px_3px_0_#000] mb-5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> 100% FREE • NO SIGNUP • PRIVATE
            </div>
            <h1 className="font-syne font-extrabold text-[44px] md:text-[68px] leading-[0.9] tracking-[-2px]">
              EVERY PDF<br />TOOL YOU<br /><span className="bg-[#D4FF32] border-[3px] border-black px-3 rounded-[12px] inline-block rotate-[-1.5deg] shadow-[5px_5px_0_#000]">NEED.</span>
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-zinc-700 max-w-[480px] font-medium">
              Merge, split, compress, convert & edit PDFs. Sab kuch browser me, file kahin upload nahi hoti. Video wali premium feel + tools clearly visible.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#tools" className="bg-black text-white border-[3px] border-black px-7 py-3 rounded-[14px] font-bold shadow-[6px_6px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#000] transition-all inline-flex items-center gap-2">Browse All Tools <ArrowRight size={18} /></a>
              <div className="border-[2.5px] border-black bg-white px-5 py-3 rounded-[14px] font-bold shadow-[4px_4px_0_#000] flex items-center gap-2"><Shield size={18} /> Private & Secure</div>
            </div>
          </div>

          {/* RIGHT IMMERSION CARD */}
          <div className="relative">
            <div className="bg-white border-[3px] border-black rounded-[28px] p-6 shadow-[14px_14px_0_#000] h-[440px] flex flex-col justify-between" style={{ transform: `perspective(1000px) rotateY(${mouse.x / 8}deg) rotateX(${mouse.y / 8}deg)` }}>
              <div className="flex justify-between items-center"><span className="border-2 border-black px-3 py-1 rounded-full text-xs font-extrabold">● LIVE EDITOR</span><span className="font-bold text-xs">pdfplayofficial.com</span></div>
              <div className="border-[3px] border-dashed border-black rounded-2xl h-[240px] flex flex-col items-center justify-center gap-3 bg-[#FFFBF0]">
                <div className="text-6xl">📄</div><p className="font-extrabold">Drop PDF Here</p>
                <div className="flex gap-2"><div className="w-20 h-2 bg-black rounded-full"></div><div className="w-12 h-2 bg-[#D4FF32] border border-black rounded-full"></div></div>
                <p className="text-[11px] font-bold text-zinc-500">Your files never leave your device</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#D4FF32] border-[2.5px] border-black rounded-xl p-3 font-extrabold text-[13px] text-center shadow-[3px_3px_0_#000]">Merge</div>
                <div className="bg-white border-[2.5px] border-black rounded-xl p-3 font-extrabold text-[13px] text-center">Split</div>
                <div className="bg-white border-[2.5px] border-black rounded-xl p-3 font-extrabold text-[13px] text-center">Compress</div>
              </div>
            </div>
            <div className="absolute -top-5 -right-5 w-20 h-20 bg-[#D4FF32] border-[3px] border-black rounded-full -z-10" style={{ transform: `translate(${mouse.x}px, ${mouse.y}px)` }}></div>
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-[#FF6B6B] border-[3px] border-black rounded-full -z-10" style={{ transform: `translate(${-mouse.x}px, ${-mouse.y}px)` }}></div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div className="border-b-[3px] border-black bg-[#D4FF32] py-2.5 overflow-hidden">
        <div className="flex items-center justify-center gap-8 text-[12px] font-extrabold tracking-widest whitespace-nowrap animate-pulse">
          <span className="flex items-center gap-1.5"><Shield size={14}/> PRIVATE</span>•<span className="flex items-center gap-1.5"><Zap size={14}/> INSTANT</span>•<span>NO UPLOAD</span>•<span className="flex items-center gap-1.5"><Globe size={14}/> ANYWHERE</span>•<span className="flex items-center gap-1.5"><Star size={14}/> FREE FOREVER</span>
        </div>
      </div>

      {/* TOOLS - CLEARLY VISIBLE */}
      <section id="tools" className="max-w-[1280px] mx-auto px-[5%] py-10">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <div>
            <h2 className="font-syne font-extrabold text-[34px] tracking-tight">All Tools <span className="bg-black text-white px-3 py-1 rounded-lg text-[20px] align-middle">{filtered.length}</span></h2>
            <p className="text-zinc-600 font-medium text-sm mt-1">Click any tool, drag your file, get instant result. Video wali 3D feel ke sath.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full border-[2.5px] border-black font-extrabold text-[12px] transition-all shadow-[3px_3px_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000] ${activeCategory === cat.id? 'bg-black text-white' : 'bg-white text-black'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((tool) => {
            const Logo = tool.logo;
            return (
              <Link key={tool.path} to={tool.path} className="immersion-tool group bg-white border-[3px] border-black rounded-[20px] p-5 shadow-[6px_6px_0_#000] hover:shadow-[10px_10px_0_#000] hover:border-black flex flex-col">
                <div className="flex justify-between items-start">
                  <Logo size={44} />
                  <ArrowRight className="w-5 h-5 border-2 border-black rounded-full p-1 group-hover:bg-black group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-syne font-extrabold text-[18px] mt-4 leading-tight">{tool.name}</h3>
                <p className="text-[13px] text-zinc-600 font-medium leading-snug mt-1.5 flex-1">{tool.desc}</p>
                <div className="mt-4 bg-[#FFFBF0] border-2 border-black rounded-full px-3 py-1.5 text-[11px] font-extrabold inline-flex self-start group-hover:bg-[#D4FF32] transition-colors">OPEN TOOL →</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y-[3px] border-black bg-white">
        <div className="max-w-[1280px] mx-auto px-[5%] py-10 grid md:grid-cols-3 gap-5">
          {[
            { icon: Shield, title: '100% Private', desc: 'Files never leave your device. Zero server upload, fully offline processing.' },
            { icon: Zap, title: 'Instant & Fast', desc: 'No queue, no waiting. Drop file and download result in 1 second.' },
            { icon: Star, title: 'Free Forever', desc: 'No premium, no limits, no account. All 22 tools always free.' },
          ].map((f, i) => (
            <div key={i} className="border-[3px] border-black rounded-[20px] p-5 bg-[#FFFBF0] shadow-[6px_6px_0_#000]">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center mb-3"><f.icon size={18} /></div>
              <h3 className="font-syne font-extrabold text-[16px]">{f.title}</h3><p className="text-[13px] text-zinc-600 font-medium mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-black text-white text-center py-6 font-bold tracking-widest text-[12px]">PDFPLAYOFFICIAL.COM — BUILT FOR SPEED & PRIVACY — VIDEO LOOK SE BHI BEHTAR</footer>
    </div>
  );
}