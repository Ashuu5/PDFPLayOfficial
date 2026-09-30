// ============================================================
// AI DESIGN RENDERER — AI HTML ko render + download
// ============================================================

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { generateDocx } from '../lib/docEngine';
import type { DocTemplate } from '../lib/docTemplates';

interface Props {
  html: string;
  documentType: string;
  userData: Record<string, string>;
  template: DocTemplate;
  onClose: () => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export default function AIDesignRenderer({
  html,
  documentType,
  userData,
  template,
  onClose,
  onRegenerate,
  isRegenerating = false,
}: Props) {
  const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const renderRef = useRef<HTMLDivElement>(null);

  // Reset scroll when html changes
  useEffect(() => {
    if (renderRef.current) {
      renderRef.current.scrollTop = 0;
    }
  }, [html]);

  // ============================================================
  // DOWNLOAD PNG (perfect design)
  // ============================================================
  const handleDownloadPNG = async () => {
    if (!renderRef.current) return;
    setIsDownloadingPNG(true);
    setMessage(null);

    try {
      const canvas = await html2canvas(renderRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `${documentType}_${Date.now()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');

      setMessage('✅ PNG downloaded (high-quality, ready to print)');
    } catch (err: any) {
      setMessage('❌ Failed to generate PNG. Please try again.');
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  // ============================================================
  // DOWNLOAD DOCX (editable, simple)
  // ============================================================
  const handleDownloadDOCX = async () => {
    setIsDownloadingDOCX(true);
    setMessage(null);

    try {
      await generateDocx(template, userData);
      setMessage('✅ DOCX downloaded (editable in Word/WPS)');
    } catch (err: any) {
      setMessage('❌ Failed to generate DOCX. Please try again.');
    } finally {
      setIsDownloadingDOCX(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl border border-purple-500/30 bg-white dark:bg-[#0d0f14] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* ============ HEADER ============ */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                AI Custom Design
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {documentType.charAt(0).toUpperCase() + documentType.slice(1)} · Generated from your data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============ INFO BAR ============ */}
        <div className="px-5 py-3 bg-purple-500/[0.06] border-b border-purple-500/20 shrink-0">
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
            💡 <strong>PNG</strong> = Perfect design (ready to print, not editable) · 
            <strong className="ml-1">DOCX</strong> = Editable in Word (simpler layout)
          </p>
        </div>

        {/* ============ PREVIEW ============ */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-black/30 p-4">
          <div className="flex justify-center">
            <div
              ref={renderRef}
              className="ai-design-render bg-white"
              style={{
                width: '210mm',
                minHeight: '297mm',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>

        {/* ============ MESSAGE ============ */}
        {message && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-t border-emerald-500/20 shrink-0">
            <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
              {message}
            </p>
          </div>
        )}

        {/* ============ ACTIONS ============ */}
        <div className="p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Regenerate */}
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-purple-400/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[12px] font-bold hover:bg-purple-500/20 transition-all disabled:opacity-60"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Another Design
                </>
              )}
            </button>

            {/* Download PNG */}
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloadingPNG}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg ai-purple-btn text-white text-[12px] font-bold hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {isDownloadingPNG ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  PNG...
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  Download PNG
                </>
              )}
            </button>

            {/* Download DOCX */}
            <button
              onClick={handleDownloadDOCX}
              disabled={isDownloadingDOCX}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg ai-purple-btn text-white text-[12px] font-bold hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {isDownloadingDOCX ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  DOCX...
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  Download DOCX
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-3">
            For best print quality, use PNG. For editing, use DOCX.
          </p>
        </div>
      </div>

      {/* Global style — A4 render fix */}
      <style>{`
        .ai-design-render {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
        }
        .ai-design-render * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}