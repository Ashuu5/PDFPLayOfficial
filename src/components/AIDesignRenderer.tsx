// ============================================================
// AI DESIGN RENDERER — AI HTML ko render + DOCX/PDF/PNG download
// ============================================================

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Download,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingDOCX, setIsDownloadingDOCX] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const renderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renderRef.current) {
      renderRef.current.scrollTop = 0;
    }
  }, [html]);

  // ============================================================
  // CAPTURE CANVAS (shared for PNG and PDF)
  // ============================================================
  const captureCanvas = async () => {
    if (!renderRef.current) return null;
    return await html2canvas(renderRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  };

  // ============================================================
  // DOWNLOAD PNG
  // ============================================================
  const handleDownloadPNG = async () => {
    setIsDownloadingPNG(true);
    setMessage(null);

    try {
      const canvas = await captureCanvas();
      if (!canvas) throw new Error('Canvas failed');

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `${documentType}_${Date.now()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');

      setMessage('✅ PNG downloaded (high-quality image)');
    } catch {
      setMessage('❌ PNG failed. Please try again.');
    } finally {
      setIsDownloadingPNG(false);
    }
  };

  // ============================================================
  // DOWNLOAD PDF
  // ============================================================
  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    setMessage(null);

    try {
      const canvas = await captureCanvas();
      if (!canvas) throw new Error('Canvas failed');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${documentType}_${Date.now()}.pdf`);
      setMessage('✅ PDF downloaded (print-ready)');
    } catch {
      setMessage('❌ PDF failed. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // ============================================================
  // DOWNLOAD DOCX
  // ============================================================
  const handleDownloadDOCX = async () => {
    setIsDownloadingDOCX(true);
    setMessage(null);

    try {
      await generateDocx(template, userData);
      setMessage('✅ DOCX downloaded (editable in Word/WPS)');
    } catch {
      setMessage('❌ DOCX failed. Please try again.');
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
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Your AI Document
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {documentType.charAt(0).toUpperCase() + documentType.slice(1)} · Ready to download
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

        {/* INFO BAR */}
        <div className="px-5 py-3 bg-purple-500/[0.06] border-b border-purple-500/20 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <strong className="text-gray-700 dark:text-gray-300">PDF</strong>
              <span className="text-gray-500 dark:text-gray-400">· Perfect design, print-ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <strong className="text-gray-700 dark:text-gray-300">DOCX</strong>
              <span className="text-gray-500 dark:text-gray-400">· Editable in Word</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <strong className="text-gray-700 dark:text-gray-300">PNG</strong>
              <span className="text-gray-500 dark:text-gray-400">· Image format</span>
            </div>
          </div>
        </div>

        {/* PREVIEW */}
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

        {/* MESSAGE */}
        {message && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-t border-emerald-500/20 shrink-0">
            <p className="text-[12px] text-emerald-700 dark:text-emerald-300">
              {message}
            </p>
          </div>
        )}

        {/* ACTIONS — All 3 downloads + regenerate */}
        <div className="p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
            Download Options
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            {/* PDF — primary */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[12px] font-bold hover:scale-[1.02] transition-all disabled:opacity-60 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]"
            >
              {isDownloadingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  PDF
                </>
              )}
            </button>

            {/* DOCX — editable */}
            <button
              onClick={handleDownloadDOCX}
              disabled={isDownloadingDOCX}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-[12px] font-bold hover:scale-[1.02] transition-all disabled:opacity-60 shadow-[0_8px_20px_-6px_rgba(59,130,246,0.5)]"
            >
              {isDownloadingDOCX ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  DOCX...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  DOCX
                </>
              )}
            </button>

            {/* PNG — image */}
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloadingPNG}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 text-white text-[12px] font-bold hover:scale-[1.02] transition-all disabled:opacity-60 shadow-[0_8px_20px_-6px_rgba(249,115,22,0.5)]"
            >
              {isDownloadingPNG ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PNG...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  PNG
                </>
              )}
            </button>
          </div>

          {/* Regenerate */}
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-purple-400/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[12px] font-bold hover:bg-purple-500/20 transition-all disabled:opacity-60"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating new design...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Generate a Different Design
              </>
            )}
          </button>
        </div>
      </div>

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