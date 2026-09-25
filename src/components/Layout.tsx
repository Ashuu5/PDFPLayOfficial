import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}

/* ============ BRAND LOGO ============ */
function BrandLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="starBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="25%"  stopColor="#e5e7eb" />
          <stop offset="50%"  stopColor="#9ca3af" />
          <stop offset="75%"  stopColor="#6b7280" />
          <stop offset="100%" stopColor="#d1d5db" />
        </linearGradient>
        <linearGradient id="starSweep" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="30%"  stopColor="white" stopOpacity="0" />
          <stop offset="42%"  stopColor="white" stopOpacity="0.6" />
          <stop offset="48%"  stopColor="white" stopOpacity="1" />
          <stop offset="50%"  stopColor="white" stopOpacity="1" />
          <stop offset="52%"  stopColor="white" stopOpacity="1" />
          <stop offset="58%"  stopColor="white" stopOpacity="0.6" />
          <stop offset="70%"  stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1 0"
            to="1 0"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="starClip">
          <path d="M24 2 Q26 20 46 24 Q26 28 24 46 Q22 28 2 24 Q22 20 24 2 Z" />
        </clipPath>
      </defs>
      <path
        d="M24 2 Q26 20 46 24 Q26 28 24 46 Q22 28 2 24 Q22 20 24 2 Z"
        fill="#d1d5db"
        opacity="0.35"
        filter="url(#starGlow)"
      />
      <path
        d="M24 2 Q26 20 46 24 Q26 28 24 46 Q22 28 2 24 Q22 20 24 2 Z"
        fill="url(#starBody)"
      />
      <path d="M24 2 Q26 20 46 24 Q26 28 24 46 Z" fill="white" opacity="0.15" />
      <circle cx="24" cy="24" r="9" fill="#08090d" />
      <rect x="20" y="19" width="8" height="10" rx="1.5" fill="url(#starBody)" />
      <rect x="22" y="22" width="4" height="0.9" rx="0.45" fill="#475569" />
      <rect x="22" y="24" width="4" height="0.9" rx="0.45" fill="#475569" />
      <rect x="22" y="26" width="2.5" height="0.9" rx="0.45" fill="#475569" />
      <g clipPath="url(#starClip)">
        <rect x="2" y="2" width="44" height="44" fill="url(#starSweep)" />
      </g>
    </svg>
  );
}

function OfficialBadge() {
  return (
    <span
      className="official-badge inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.28em] uppercase text-gray-200 border border-gray-400/50 rounded-full px-2 py-[2px] w-fit relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(203,213,225,0.22) 0%, rgba(100,116,139,0.12) 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 10px rgba(226,232,240,0.15)',
      }}
    >
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, transparent 30%, rgba(255,255,255,0.4) 42%, rgba(255,255,255,1) 48%, rgba(255,255,255,1) 52%, rgba(255,255,255,0.4) 58%, transparent 70%, transparent 100%)',
          transform: 'skewX(-20deg)',
          animation: 'badgeShine 1.2s ease-in-out infinite',
        }}
      />
      <span className="relative z-10 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-b from-white to-gray-400 shadow-[0_0_5px_rgba(255,255,255,1)]" />
        Official
      </span>
    </span>
  );
}

function BrandBlock({
  logoSize = 48,
  textSize = 'text-[30px]',
}: {
  logoSize?: number;
  textSize?: string;
}) {
  return (
    <div className="flex items-center gap-3 group shrink-0">
      <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        <BrandLogo size={logoSize} />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`${textSize} font-black tracking-tight leading-none`}
          style={{
            fontFamily: '"Playfair Display", "Georgia", "Times New Roman", serif',
            letterSpacing: '-0.02em',
          }}
        >
          <span
            style={{
              background: 'linear-gradient(180deg, #f87171 0%, #dc2626 45%, #7f1d1d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 1px 0 rgba(0,0,0,0.4)',
            }}
          >
            PDF
          </span>
          <span
            style={{
              background: 'linear-gradient(180deg, #fca5a5 0%, #ef4444 45%, #991b1b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 1px 0 rgba(0,0,0,0.4)',
            }}
          >
            play
          </span>
        </span>
        <div className="mt-1">
          <OfficialBadge />
        </div>
      </div>
    </div>
  );
}

function NavLink({
  to,
  label,
  isActive,
}: {
  to: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      className={`relative px-3 py-1.5 text-[13px] font-medium tracking-tight transition-all duration-200 ${
        isActive ? 'text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-red-500 to-red-400 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      )}
    </Link>
  );
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  /* ============ THEME STATE ============ */
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const closeAll = () => {
    setMobileMenuOpen(false);
    setConvertOpen(false);
    setAllToolsOpen(false);
  };

  const convertLinks = [
    { to: '/pdf-to-word',       label: 'PDF to Word' },
    { to: '/pdf-to-excel',      label: 'PDF to Excel' },
    { to: '/pdf-to-powerpoint', label: 'PDF to PowerPoint' },
    { to: '/pdf-to-jpg',        label: 'PDF to JPG' },
    { to: '/word-to-pdf',       label: 'Word to PDF' },
    { to: '/excel-to-pdf',      label: 'Excel to PDF' },
    { to: '/powerpoint-to-pdf', label: 'PowerPoint to PDF' },
    { to: '/jpg-to-pdf',        label: 'JPG to PDF' },
  ];

  return (
    <div className="min-h-screen flex flex-col text-gray-200 relative z-10">
      <ScrollToTop />

      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#08090d]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]'
            : 'bg-[#08090d]/60 backdrop-blur-md border-b border-white/[0.04]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[68px]">
            <Link to="/">
              <BrandBlock logoSize={44} textSize="text-[26px]" />
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              <NavLink to="/merge-pdf" label="Merge" isActive={isActive('/merge-pdf')} />
              <NavLink to="/split-pdf" label="Split" isActive={isActive('/split-pdf')} />

              <div
                className="relative"
                onMouseEnter={() => setConvertOpen(true)}
                onMouseLeave={() => setConvertOpen(false)}
              >
                <button
                  className={`relative inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors duration-150 ${
                    convertOpen || convertLinks.some(l => isActive(l.to))
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Convert
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      convertOpen ? 'rotate-180' : ''
                    }`}
                  />
                  {(convertOpen || convertLinks.some(l => isActive(l.to))) && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-red-500 to-red-400 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </button>

                {convertOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-[#0d0f14]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/60 py-1.5 z-50 animate-fade-in">
                    {convertLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={closeAll}
                        className={`block px-4 py-1.5 text-[13px] transition-colors ${
                          isActive(item.to)
                            ? 'text-red-400 bg-red-500/[0.08]'
                            : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <NavLink to="/compress-pdf" label="Compress" isActive={isActive('/compress-pdf')} />

              <div
                className="relative"
                onMouseEnter={() => setAllToolsOpen(true)}
                onMouseLeave={() => setAllToolsOpen(false)}
              >
                <button
                  className={`relative inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors duration-150 ${
                    allToolsOpen ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All Tools
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      allToolsOpen ? 'rotate-180' : ''
                    }`}
                  />
                  {allToolsOpen && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-red-500 to-red-400 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </button>

                {allToolsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[540px] rounded-xl bg-[#0d0f14]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/60 p-4 z-50 animate-fade-in">
                    <div className="grid grid-cols-3 gap-x-5 gap-y-3">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                          Organize
                        </p>
                        {[
                          { to: '/merge-pdf',     label: 'Merge PDF' },
                          { to: '/split-pdf',     label: 'Split PDF' },
                          { to: '/extract-pages', label: 'Extract Pages' },
                          { to: '/organize-pdf',  label: 'Organize PDF' },
                          { to: '/rotate-pdf',    label: 'Rotate PDF' },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeAll}
                            className="block px-2 py-1 text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                          Optimize
                        </p>
                        {[
                          { to: '/compress-pdf', label: 'Compress PDF' },
                          { to: '/ocr-pdf',      label: 'OCR PDF' },
                          { to: '/crop-pdf',     label: 'Crop PDF' },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeAll}
                            className="block px-2 py-1 text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mt-3 mb-2">
                          Security
                        </p>
                        {[
                          { to: '/protect-pdf', label: 'Protect PDF' },
                          { to: '/unlock-pdf',  label: 'Unlock PDF' },
                          { to: '/pdf-sign',    label: 'Sign PDF' },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeAll}
                            className="block px-2 py-1 text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                          Edit
                        </p>
                        {[
                          { to: '/pdf-editor',      label: 'PDF Editor' },
                          { to: '/watermark-pdf',   label: 'Watermark PDF' },
                          { to: '/metadata-editor', label: 'Metadata Editor' },
                          { to: '/pdf-to-jpg',      label: 'PDF to JPG' },
                          { to: '/jpg-to-pdf',      label: 'JPG to PDF' },
                        ].map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={closeAll}
                            className="block px-2 py-1 text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* ============ THEME TOGGLE WITH 3D TOOLTIP ============ */}
              <div className="relative group/theme">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-300 group-hover/theme:scale-110"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* 3D Tooltip */}
                <div
                  className="
                    absolute top-full left-1/2 -translate-x-1/2 mt-3
                    pointer-events-none
                    opacity-0 translate-y-1
                    group-hover/theme:opacity-100 group-hover/theme:translate-y-0
                    transition-all duration-300 ease-out
                    z-[100]
                  "
                >
                  {/* Arrow */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45
                               bg-gradient-to-br from-red-500 to-red-700
                               border-t border-l border-red-300/50"
                  />
                  {/* Body */}
                  <div
                    className="
                      px-3 py-1.5 rounded-lg
                      text-[11px] font-bold tracking-wider uppercase whitespace-nowrap
                      text-white
                      border border-red-400/40
                      backdrop-blur-xl
                    "
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(239,68,68,0.95) 0%, rgba(153,27,27,0.95) 100%)',
                      boxShadow:
                        '0 1px 0 rgba(255,255,255,0.3) inset, 0 -1px 0 rgba(0,0,0,0.3) inset, 0 10px 25px -8px rgba(239,68,68,0.7), 0 4px 12px -4px rgba(0,0,0,0.6)',
                      textShadow: '0 1px 0 rgba(0,0,0,0.4)',
                      transform: 'perspective(400px) rotateX(-8deg)',
                    }}
                  >
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </div>
                </div>
              </div>

              {/* Mobile menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#08090d]/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto animate-fade-in">
            <div className="px-4 py-2 space-y-0.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/merge-pdf', label: 'Merge PDF' },
                { to: '/split-pdf', label: 'Split PDF' },
                { to: '/compress-pdf', label: 'Compress PDF' },
                { to: '/pdf-editor', label: 'PDF Editor' },
                { to: '/rotate-pdf', label: 'Rotate PDF' },
                { to: '/pdf-to-word', label: 'PDF to Word' },
                { to: '/pdf-to-excel', label: 'PDF to Excel' },
                { to: '/pdf-to-jpg', label: 'PDF to JPG' },
                { to: '/jpg-to-pdf', label: 'JPG to PDF' },
                { to: '/word-to-pdf', label: 'Word to PDF' },
                { to: '/protect-pdf', label: 'Protect PDF' },
                { to: '/unlock-pdf', label: 'Unlock PDF' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeAll}
                  className={`block px-3 py-2 text-[13px] font-medium rounded-md transition ${
                    isActive(item.to)
                      ? 'text-red-400 bg-red-500/[0.08]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 relative z-10">{children}</main>

      <footer className="border-t border-white/[0.06] bg-[#08090d]/80 backdrop-blur-xl text-gray-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="inline-block mb-3">
                <BrandBlock logoSize={40} textSize="text-[24px]" />
              </Link>
              <p className="text-[13px] text-gray-500 max-w-md mb-3 leading-relaxed">
                Every PDF tool you need, completely free. No signup, no login, no hassle.
                Your files are processed locally in your browser for maximum privacy.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 text-[11px] uppercase tracking-[0.15em]">
                Popular Tools
              </h3>
              <ul className="space-y-2 text-[13px]">
                {[
                  ['/merge-pdf', 'Merge PDF'],
                  ['/split-pdf', 'Split PDF'],
                  ['/compress-pdf', 'Compress PDF'],
                  ['/pdf-to-jpg', 'PDF to JPG'],
                  ['/jpg-to-pdf', 'JPG to PDF'],
                  ['/pdf-editor', 'PDF Editor'],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="text-gray-500 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 text-[11px] uppercase tracking-[0.15em]">
                Company
              </h3>
              <ul className="space-y-2 text-[13px]">
                <li>
                  <Link to="/privacy-policy" className="text-gray-500 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="text-gray-500 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-500 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © 2026 PDFplayOfficial. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              Your files never leave your browser
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        @keyframes badgeShine {
          0%   { transform: translateX(-200%) skewX(-20deg); }
          60%  { transform: translateX(300%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}