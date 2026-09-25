import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

interface LayoutProps { children: React.ReactNode; }

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function BrandLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="starBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" /><stop offset="25%" stopColor="#e5e7eb" />
          <stop offset="50%" stopColor="#9ca3af" /><stop offset="75%" stopColor="#6b7280" /><stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
        <linearGradient id="starSweep" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" /><stop offset="30%" stopColor="white" stopOpacity="0" />
          <stop offset="42%" stopColor="white" stopOpacity="0.6" /><stop offset="48%" stopColor="white" stopOpacity="1" />
          <stop offset="58%" stopColor="white" stopOpacity="0.6" /><stop offset="100%" stopColor="white" stopOpacity="0" />
          <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="1.2s" repeatCount="indefinite" />
        </linearGradient>
        <clipPath id="starClip"><path d="M24 2 Q26 20 46 24 Q26 28 24 46 Q22 28 2 24 Q22 20 24 2 Z" /></clipPath>
      </defs>
      <path d="M24 2 Q26 20 46 24 Q26 28 24 46 Q22 28 2 24 Q22 20 24 2 Z" fill="#d1d5db" opacity="0.35" />
      <path d="M24 2 Q26 20 46 24 Q26 28 24 46 Q22 28 2 24 Q22 20 24 2 Z" fill="url(#starBody)" />
      <circle cx="24" cy="24" r="9" fill="#111" />
      <rect x="20" y="19" width="8" height="10" rx="1.5" fill="url(#starBody)" />
      <g clipPath="url(#starClip)"><rect x="2" y="2" width="44" height="44" fill="url(#starSweep)" /></g>
    </svg>
  );
}

function OfficialBadge() {
  return (
    <span className="official-badge inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.2em] uppercase text-black border-[2px] border-black rounded-full px-2.5 py-[2px] w-fit relative overflow-hidden bg-[#D4FF32]">
      <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> Official
    </span>
  );
}

function BrandBlock({ logoSize = 40, textSize = 'text-[30px]' }: { logoSize?: number; textSize?: string; }) {
  return (
    <div className="flex items-center gap-3 group shrink-0">
      <div className="transition-transform duration-200 group-hover:rotate-3 group-hover:scale-105 border-[2.5px] border-black rounded-xl p-1 bg-white shadow-[3px_3px_0_#000]">
        <BrandLogo size={logoSize} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${textSize} font-black tracking-tight leading-none font-['Syne']`}>
          <span className="text-black">PDF</span><span className="bg-black text-white px-1.5 ml-1 rounded-md">play</span>
        </span>
        <div className="mt-1"><OfficialBadge /></div>
      </div>
    </div>
  );
}

function NavLink({ to, label, isActive }: { to: string; label: string; isActive: boolean }) {
  return (
    <Link to={to} className={`px-3.5 py-2 rounded-full border-[2.5px] font-bold text-[13px] transition-all ${isActive? 'bg-black text-white border-black shadow-[3px_3px_0_#000]' : 'bg-white text-black border-black hover:bg-[#D4FF32] hover:shadow-[3px_3px_0_#000] hover:-translate-y-[1px]'}`}>
      {label}
    </Link>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const closeAll = () => { setMobileMenuOpen(false); setConvertOpen(false); setAllToolsOpen(false); };

  const convertLinks = [
    { to: '/pdf-to-word', label: 'PDF to Word' }, { to: '/pdf-to-excel', label: 'PDF to Excel' },
    { to: '/pdf-to-powerpoint', label: 'PDF to PowerPoint' }, { to: '/pdf-to-jpg', label: 'PDF to JPG' },
    { to: '/word-to-pdf', label: 'Word to PDF' }, { to: '/excel-to-pdf', label: 'Excel to PDF' },
    { to: '/powerpoint-to-pdf', label: 'PowerPoint to PDF' }, { to: '/jpg-to-pdf', label: 'JPG to PDF' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF0] text-black">
      <ScrollToTop />
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Playfair+Display:wght@700;900&display=swap');.font-syne{font-family:'Syne', sans-serif}`}</style>

      {/* NAVBAR - BS STUDIO LIGHT */}
      <nav className="sticky top-0 z-50 bg-white border-b-[3px] border-black">
        <div className="max-w-[1280px] mx-auto px-[5%]">
          <div className="flex justify-between items-center h-[72px]">
            <Link to="/"><BrandBlock logoSize={38} textSize="text-[22px]" /></Link>

            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/merge-pdf" label="Merge" isActive={isActive('/merge-pdf')} />
              <NavLink to="/split-pdf" label="Split" isActive={isActive('/split-pdf')} />

              <div className="relative" onMouseEnter={() => setConvertOpen(true)} onMouseLeave={() => setConvertOpen(false)}>
                <button className={`px-3.5 py-2 rounded-full border-[2.5px] border-black font-bold text-[13px] flex items-center gap-1 transition-all ${convertOpen? 'bg-[#D4FF32] shadow-[3px_3px_0_#000]' : 'bg-white hover:bg-[#D4FF32]'}`}>
                  Convert <ChevronDown className={`w-3.5 h-3.5 transition-transform ${convertOpen? 'rotate-180' : ''}`} />
                </button>
                {convertOpen && (
                  <div className="absolute top-full right-0 mt-3 w-56 rounded-[16px] bg-white border-[3px] border-black shadow-[8px_8px_0_#000] py-2 z-50 overflow-hidden">
                    {convertLinks.map(item => (
                      <Link key={item.to} to={item.to} onClick={closeAll} className={`block px-4 py-2 text-[13px] font-bold ${isActive(item.to)? 'bg-[#D4FF32]' : 'hover:bg-[#FFFBF0]'}`}>{item.label}</Link>
                    ))}
                  </div>
                )}
              </div>

              <NavLink to="/compress-pdf" label="Compress" isActive={isActive('/compress-pdf')} />

              <div className="relative" onMouseEnter={() => setAllToolsOpen(true)} onMouseLeave={() => setAllToolsOpen(false)}>
                <button className={`px-4 py-2 rounded-full border-[2.5px] border-black font-extrabold text-[13px] flex items-center gap-1 ${allToolsOpen? 'bg-black text-white' : 'bg-[#D4FF32] text-black shadow-[3px_3px_0_#000]'}`}>
                  All Tools <ChevronDown className={`w-4 h-4 ${allToolsOpen? 'rotate-180' : ''}`} />
                </button>
                {allToolsOpen && (
                  <div className="absolute top-full right-0 mt-3 w-[580px] rounded-[20px] bg-white border-[3px] border-black shadow-[12px_12px_0_#000] p-5 z-50">
                    <div className="grid grid-cols-3 gap-5">
                      <div><p className="text-[11px] font-black tracking-widest mb-2 border-b-2 border-black pb-1">ORGANIZE</p>
                        {[{ to: '/merge-pdf', label: 'Merge PDF' }, { to: '/split-pdf', label: 'Split PDF' }, { to: '/extract-pages', label: 'Extract Pages' }, { to: '/organize-pdf', label: 'Organize PDF' }].map(item => (
                          <Link key={item.to} to={item.to} onClick={closeAll} className="block py-1.5 text-[13px] font-bold hover:translate-x-1 transition-transform">{item.label}</Link>
                        ))}
                      </div>
                      <div><p className="text-[11px] font-black tracking-widest mb-2 border-b-2 border-black pb-1">OPTIMIZE & SECURITY</p>
                        {[{ to: '/compress-pdf', label: 'Compress PDF' }, { to: '/protect-pdf', label: 'Protect PDF' }, { to: '/unlock-pdf', label: 'Unlock PDF' }, { to: '/pdf-sign', label: 'Sign PDF' }].map(item => (
                          <Link key={item.to} to={item.to} onClick={closeAll} className="block py-1.5 text-[13px] font-bold hover:translate-x-1 transition-transform">{item.label}</Link>
                        ))}
                      </div>
                      <div><p className="text-[11px] font-black tracking-widest mb-2 border-b-2 border-black pb-1">EDIT & CONVERT</p>
                        {[{ to: '/pdf-editor', label: 'PDF Editor' }, { to: '/pdf-to-word', label: 'PDF to Word' }, { to: '/pdf-to-jpg', label: 'PDF to JPG' }, { to: '/jpg-to-pdf', label: 'JPG to PDF' }].map(item => (
                          <Link key={item.to} to={item.to} onClick={closeAll} className="block py-1.5 text-[13px] font-bold hover:translate-x-1 transition-transform">{item.label}</Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2.5 rounded-full border-[2.5px] border-black bg-[#D4FF32] shadow-[3px_3px_0_#000]">
              {mobileMenuOpen? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t-[3px] border-black bg-[#FFFBF0] max-h-[80vh] overflow-y-auto">
            <div className="px-[5%] py-3 grid grid-cols-2 gap-2">
              {[{ to: '/', label: 'Home' }, { to: '/merge-pdf', label: 'Merge PDF' }, { to: '/split-pdf', label: 'Split PDF' }, { to: '/compress-pdf', label: 'Compress PDF' }, { to: '/pdf-to-word', label: 'PDF to Word' }, { to: '/protect-pdf', label: 'Protect PDF' }].map(item => (
                <Link key={item.to} to={item.to} onClick={closeAll} className={`px-4 py-3 rounded-full border-[2.5px] border-black font-bold text-center text-[13px] ${isActive(item.to)? 'bg-black text-white' : 'bg-white'}`}>{item.label}</Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t-[3px] border-black bg-black text-white mt-10">
        <div className="max-w-[1280px] mx-auto px-[5%] py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-4 bg-white rounded-xl px-3 py-2 border-[2.5px] border-white"><BrandBlock logoSize={36} textSize="text-[20px]" /></Link>
            <p className="text-[14px] text-zinc-400 max-w-md font-medium leading-relaxed">Every PDF tool you need, BS Studio wali premium look ke sath. 100% free, private, no signup. Files browser me hi process hoti hain.</p>
            <div className="mt-4 inline-flex gap-2"><span className="bg-[#D4FF32] text-black border-2 border-[#D4FF32] px-3 py-1 rounded-full text-xs font-black">100% FREE</span><span className="bg-white text-black px-3 py-1 rounded-full text-xs font-black">NO UPLOAD</span></div>
          </div>
          <div><h3 className="font-syne font-extrabold mb-3 text-[13px] tracking-widest">POPULAR TOOLS</h3><ul className="space-y-2 text-[13px] text-zinc-400 font-bold">
            <li><Link to="/merge-pdf" className="hover:text-[#D4FF32]">Merge PDF</Link></li><li><Link to="/split-pdf" className="hover:text-[#D4FF32]">Split PDF</Link></li><li><Link to="/compress-pdf" className="hover:text-[#D4FF32]">Compress PDF</Link></li></ul></div>
          <div><h3 className="font-syne font-extrabold mb-3 text-[13px] tracking-widest">COMPANY</h3><ul className="space-y-2 text-[13px] text-zinc-400 font-bold">
            <li><Link to="/privacy-policy" className="hover:text-[#D4FF32]">Privacy Policy</Link></li><li><Link to="/terms-of-service" className="hover:text-[#D4FF32]">Terms</Link></li><li><Link to="/contact" className="hover:text-[#D4FF32]">Contact</Link></li></ul></div>
        </div>
        <div className="border-t border-zinc-800 py-4 text-center text-[11px] font-bold tracking-widest text-zinc-500">© 2026 PDFPLAYOFFICIAL — VIDEO LOOK SE BEHTAR — MADE WITH BS STUDIO STYLE</div>
      </footer>
    </div>
  );
}