import { useState, useRef, useEffect } from 'react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
// @ts-ignore
import JSZip from 'jszip';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Image as ImageIcon, Download, Loader2, X, Check,
  FileText, Layers, Sparkles, RefreshCw, Settings2
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

type QualityOption = 'standard' | 'high' | 'veryhigh' | 'ultra';
type FormatOption = 'jpg' | 'png';
type PageRangeOption = 'all' | 'custom';

interface QualityPreset {
  value: QualityOption;
  label: string;
  sub: string;
  scale: number;
}

const QUALITY_OPTIONS: QualityPreset[] = [
  { value: 'standard', label: 'Standard', sub: '72 DPI',  scale: 1   },
  { value: 'high',     label: 'High',     sub: '108 DPI', scale: 1.5 },
  { value: 'veryhigh', label: 'Very High', sub: '144 DPI', scale: 2   },
  { value: 'ultra',    label: 'Ultra',    sub: '216 DPI', scale: 3   },
];

export default function PDFToJPG() {
  const [pdfFile, setPdfFile] = useState<{
    name: string;
    arrayBuffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [quality, setQuality] = useState<QualityOption>('high');
  const [format, setFormat] = useState<FormatOption>('jpg');
  const [pageRange, setPageRange] = useState<PageRangeOption>('all');
  const [customRange, setCustomRange] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qualityOpen, setQualityOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setQualityOpen(false);
      }
    };
    if (qualityOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [qualityOpen]);

  const handleFileUpload = async (files: File[]) => {
    setError('');
    setSuccess('');
    const file = files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
      }).promise;
      setPdfFile({ name: file.name, arrayBuffer, pageCount: pdf.numPages });
      setProgress('');
      setProgressPercent(0);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load PDF. It may be corrupted or password-protected.');
    }
  };

  const openChangeFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileUpload(Array.from(target.files));
      }
    };
    input.click();
  };

  const getPagesToConvert = (): number[] => {
    if (!pdfFile) return [];
    if (pageRange === 'all') {
      return Array.from({ length: pdfFile.pageCount }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    const parts = customRange.split(',').map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map((n) => parseInt(n.trim()));
        if (!isNaN(a) && !isNaN(b)) {
          for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
            if (i >= 1 && i <= pdfFile.pageCount && !pages.includes(i)) {
              pages.push(i);
            }
          }
        }
      } else {
        const n = parseInt(part);
        if (!isNaN(n) && n >= 1 && n <= pdfFile.pageCount && !pages.includes(n)) {
          pages.push(n);
        }
      }
    }
    return pages.sort((a, b) => a - b);
  };

  const convertToImages = async () => {
    if (!pdfFile) return;

    const pages = getPagesToConvert();
    if (pages.length === 0) {
      setError('Please enter a valid page range (e.g. 1-3, 5, 7-9).');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    setProgress('');
    setProgressPercent(0);

    try {
      const pdf = await pdfjsLib.getDocument({
        data: pdfFile.arrayBuffer.slice(0),
      }).promise;

      const scale = QUALITY_OPTIONS.find((q) => q.value === quality)?.scale ?? 1.5;
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const ext = format === 'png' ? 'png' : 'jpg';

      if (pages.length === 1 && pdfFile.pageCount === 1) {
        setProgress('Converting page 1...');
        setProgressPercent(50);

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport }).promise;

        await new Promise<void>((resolve) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                saveAs(blob, `page-1.${ext}`);
                resolve();
              }
            },
            mime,
            0.95
          );
        });

        setProgressPercent(100);
        setProgress('Done!');
        setSuccess(`✅ Page converted and downloaded as page-1.${ext}`);
        return;
      }

      const zip = new JSZip();
      const total = pages.length;

      for (let idx = 0; idx < total; idx++) {
        const pageNum = pages[idx];
        setProgress(`Converting page ${pageNum} (${idx + 1} of ${total})...`);
        setProgressPercent(Math.round(((idx + 1) / total) * 100));

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
          }, mime, 0.95);
        });

        zip.file(`page-${pageNum}.${ext}`, blob);
      }

      setProgress('Generating ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `pdf-images-${Date.now()}.zip`);

      setProgressPercent(100);
      setProgress('Done!');
      setSuccess(`✅ ${total} pages converted and downloaded as ZIP.`);
    } catch (err: any) {
      console.error(err);
      setError('Failed to convert PDF. ' + (err.message || ''));
    } finally {
      setProcessing(false);
      setTimeout(() => setProgressPercent(0), 2000);
    }
  };

  const reset = () => {
    setPdfFile(null);
    setProgress('');
    setProgressPercent(0);
    setError('');
    setSuccess('');
    setCustomRange('');
    setPageRange('all');
  };

  const selectedQuality = QUALITY_OPTIONS.find((q) => q.value === quality);

  return (
    <ToolPage
      title="PDF to JPG"
      description="Convert PDF pages to JPG or PNG images with custom quality."
      icon={<ImageIcon className="w-7 h-7 text-red-500" />}
      color="red"
    >
      <canvas ref={canvasRef} className="hidden" />

      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          accept={{ 'application/pdf': ['.pdf'] }}
          title="Drop a PDF file here"
          subtitle="or click to browse • Single PDF supported"
          icon={<ImageIcon className="w-6 h-6 text-red-500" />}
        />
      ) : (
        <div className="space-y-4">

          {/* FILE INFO CARD */}
          <div className="relative rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-400/20 p-3 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate" title={pdfFile.name}>
                  {pdfFile.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-red-300 font-semibold">
                    <Layers className="w-3 h-3" />
                    {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {(pdfFile.arrayBuffer.byteLength / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <button
                onClick={openChangeFilePicker}
                disabled={processing}
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-xs font-semibold hover:bg-white/[0.1] hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Change file
              </button>
            </div>
          </div>

          {/* SETTINGS CARD */}
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-4">

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center">
                <Settings2 className="w-3 h-3 text-red-300" />
              </div>
              <h3 className="text-sm font-bold text-white">Conversion Settings</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Format */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Output Format
                </label>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-black/20 border border-white/5">
                  <button
                    onClick={() => setFormat('jpg')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      format === 'jpg'
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => setFormat('png')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      format === 'png'
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Image Quality
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setQualityOpen(!qualityOpen)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-red-400" />
                    <span className="flex-1 text-left">
                      {selectedQuality?.label}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {selectedQuality?.sub}
                    </span>
                    <svg
                      className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                        qualityOpen ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {qualityOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-2xl shadow-black/60 overflow-hidden py-1">
                      {QUALITY_OPTIONS.map((opt) => {
                        const isSelected = quality === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setQuality(opt.value);
                              setQualityOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-red-50 text-red-600'
                                : 'text-black hover:bg-red-500 hover:text-white'
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span className={isSelected ? 'text-red-600 font-bold' : 'text-black'}>
                                {opt.label}
                              </span>
                              <span
                                className={`text-[9px] font-normal ${
                                  isSelected ? 'text-red-500' : 'text-black'
                                }`}
                              >
                                {opt.sub}
                              </span>
                            </div>
                            {isSelected && (
                              <Check className="w-3 h-3 text-red-600" strokeWidth={3} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Page Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Pages to Convert
              </label>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-black/20 border border-white/5">
                <button
                  onClick={() => setPageRange('all')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    pageRange === 'all'
                      ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  All Pages
                </button>
                <button
                  onClick={() => setPageRange('custom')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    pageRange === 'custom'
                      ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Custom Range
                </button>
              </div>

              {pageRange === 'custom' && (
                <input
                  type="text"
                  value={customRange}
                  onChange={(e) => setCustomRange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-9"
                  className="mt-2 w-full px-3 py-1.5 rounded-lg bg-black/20 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-400/50 transition-colors"
                />
              )}
            </div>
          </div>

          {/* PROGRESS BAR */}
          {processing && (
            <div className="rounded-xl bg-white/[0.03] border border-red-400/20 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                  <span className="text-xs font-semibold text-white">{progress}</span>
                </div>
                <span className="text-xs font-bold text-red-300">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* ERROR / SUCCESS */}
          {error && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-400/30 text-sm text-red-300">
              <div className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <X className="w-3.5 h-3.5 text-red-300" strokeWidth={2.5} />
              </div>
              <span>{error}</span>
            </div>
          )}

          {success && !processing && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-400/30 text-sm text-green-300 font-semibold">
              <div className="w-6 h-6 rounded-md bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-green-300" strokeWidth={3} />
              </div>
              <span>{success}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={convertToImages}
              disabled={processing}
              className="group flex-1 relative flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin relative" />
                  <span className="relative">Converting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 relative group-hover:translate-y-0.5 transition-transform" />
                  <span className="relative">Convert to {format.toUpperCase()}</span>
                </>
              )}
            </button>

            <button
              onClick={reset}
              disabled={processing}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* HINT */}
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-red-500/10 border border-red-400/20 text-xs text-red-200 leading-relaxed">
            <Sparkles className="w-3.5 h-3.5 text-red-300 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300">Tip:</strong> Choose quality based on your needs.
              Single-page PDFs download directly as an image file; multi-page PDFs are packaged
              as a ZIP. Use custom range to extract specific pages only.
            </div>
          </div>

        </div>
      )}
    </ToolPage>
  );
}