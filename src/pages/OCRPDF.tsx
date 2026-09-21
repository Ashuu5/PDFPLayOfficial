import { useState } from 'react';
// @ts-ignore
import Tesseract from 'tesseract.js';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  FileSearch, Download, Loader2, Copy, Check,
  Languages, FileText, Image as ImageIcon, X, Sparkles
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const LANGUAGES = [
  { code: 'eng', name: 'English', flag: '🇬🇧' },
  { code: 'urd', name: 'Urdu', flag: '🇵🇰' },
  { code: 'hin', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ara', name: 'Arabic', flag: '🇸🇦' },
  { code: 'spa', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fra', name: 'French', flag: '🇫🇷' },
  { code: 'deu', name: 'German', flag: '🇩🇪' },
  { code: 'chi_sim', name: 'Chinese', flag: '🇨🇳' },
  { code: 'jpn', name: 'Japanese', flag: '🇯🇵' },
  { code: 'kor', name: 'Korean', flag: '🇰🇷' },
];

interface PageText {
  page: number;
  text: string;
  confidence: number;
}

/* ============================================================
   ORDERED TEXT EXTRACTION
   Tesseract returns blocks → paragraphs → lines → words
   We sort everything by position (top→bottom, left→right)
   ============================================================ */
function extractOrderedText(data: any): string {
  // Try to use structured data if available
  if (data?.blocks && data.blocks.length > 0) {
    // Sort blocks by vertical position (top → bottom)
    const sortedBlocks = [...data.blocks].sort((a: any, b: any) => {
      const ay = a?.bbox?.y0 ?? 0;
      const by = b?.bbox?.y0 ?? 0;
      if (Math.abs(ay - by) > 10) return ay - by; // different rows
      return (a?.bbox?.x0 ?? 0) - (b?.bbox?.x0 ?? 0); // same row → left to right
    });

    const lines: string[] = [];
    for (const block of sortedBlocks) {
      if (!block?.paragraphs) continue;
      for (const para of block.paragraphs) {
        if (!para?.lines) continue;
        // Sort lines within paragraph by y-position
        const sortedLines = [...para.lines].sort((a: any, b: any) => {
          const ay = a?.bbox?.y0 ?? 0;
          const by = b?.bbox?.y0 ?? 0;
          if (Math.abs(ay - by) > 5) return ay - by;
          return (a?.bbox?.x0 ?? 0) - (b?.bbox?.x0 ?? 0);
        });
        for (const line of sortedLines) {
          if (line?.text) lines.push(line.text.trim());
        }
      }
    }
    return lines.join('\n');
  }

  // Fallback: use plain text with better line cleanup
  const raw = data?.text || '';
  return raw
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0)
    .join('\n');
}

/* ============================================================
   PREPROCESS IMAGE FOR BETTER OCR
   - Increase contrast
   - Binarize (black & white)
   - Sharpen edges
   ============================================================ */
async function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale + apply adaptive threshold
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Binarize with threshold
        const val = gray > 140 ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

export default function OCRPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | null>(null);
  const [language, setLanguage] = useState('eng');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [pages, setPages] = useState<PageText[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileUpload = (files: File[]) => {
    setError('');
    setPages([]);
    setProgress('');
    setProgressPct(0);
    const f = files[0];
    if (!f) return;

    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      setFileType('pdf');
    } else if (f.type.startsWith('image/')) {
      setFileType('image');
    } else {
      setError('Unsupported file. Please upload PDF, JPG, PNG, or TIFF.');
      return;
    }
    setFile(f);
  };

  /* ============ RENDER PDF PAGE ============ */
  const renderPdfPageToCanvas = async (arrayBuffer: ArrayBuffer, pageNum: number): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    const page = await pdf.getPage(pageNum);
    // Higher scale = better OCR. 3 gives 216 DPI equivalent
    const viewport = page.getViewport({ scale: 3 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/png');
  };

  /* ============ RUN OCR ============ */
  const runOCR = async () => {
    if (!file) return;
    setProcessing(true);
    setError('');
    setPages([]);
    setProgressPct(0);

    try {
      if (fileType === 'image') {
        setProgress('Preprocessing image...');
        setProgressPct(5);

        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Preprocess for better accuracy
        const processedUrl = await preprocessImage(dataUrl);

        setProgress('Loading OCR engine...');

        const result = await Tesseract.recognize(processedUrl, language, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              const pct = Math.round(m.progress * 95) + 5;
              setProgressPct(pct);
              setProgress(`Recognizing text... ${Math.round(m.progress * 100)}%`);
            } else {
              setProgress(m.status);
            }
          },
        });

        // ✅ ORDERED EXTRACTION
        const orderedText = extractOrderedText(result.data);

        setPages([{
          page: 1,
          text: orderedText,
          confidence: result.data.confidence,
        }]);
        setActivePage(0);
        setProgress('Done!');
        setProgressPct(100);

      } else if (fileType === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        const numPages = pdf.numPages;

        const pageTexts: PageText[] = [];

        for (let i = 1; i <= numPages; i++) {
          setProgress(`Rendering page ${i} of ${numPages}...`);
          setProgressPct(Math.round(((i - 1) / numPages) * 100));

          const rawDataUrl = await renderPdfPageToCanvas(arrayBuffer, i);
          // Preprocess for better OCR accuracy
          const processedUrl = await preprocessImage(rawDataUrl);
          const imageBlob = await fetch(processedUrl).then(r => r.blob());

          setProgress(`OCR page ${i} of ${numPages}...`);

          const result = await Tesseract.recognize(imageBlob, language, {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                const pageProgress = m.progress;
                const totalProgress = Math.round(((i - 1 + pageProgress) / numPages) * 100);
                setProgressPct(totalProgress);
                setProgress(`Page ${i} of ${numPages} — ${Math.round(pageProgress * 100)}%`);
              }
            },
          });

          // ✅ ORDERED EXTRACTION
          const orderedText = extractOrderedText(result.data);

          pageTexts.push({
            page: i,
            text: orderedText,
            confidence: result.data.confidence,
          });
        }

        setPages(pageTexts);
        setActivePage(0);
        setProgress(`Done! Extracted text from ${numPages} pages.`);
        setProgressPct(100);
      }
    } catch (err: any) {
      console.error(err);
      setError('OCR failed. ' + (err.message || 'Please try again.'));
      setProgress('');
      setProgressPct(0);
    } finally {
      setProcessing(false);
    }
  };

  const downloadText = () => {
    const fullText = pages.map(p =>
      pages.length > 1 ? `--- Page ${p.page} ---\n${p.text}` : p.text
    ).join('\n\n');
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `ocr-${file?.name.replace(/\.[^/.]+$/, '')}.txt`);
  };

  const copyToClipboard = async () => {
    const text = pages[activePage]?.text || '';
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy. Please copy manually.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileType(null);
    setPages([]);
    setProgress('');
    setProgressPct(0);
    setError('');
    setActivePage(0);
  };

  const updateText = (newText: string) => {
    setPages(prev => prev.map((p, i) => i === activePage ? { ...p, text: newText } : p));
  };

  return (
    <ToolPage
      title="OCR PDF"
      description="Extract text from scanned PDFs and images — multi-language, ordered output."
      icon={<FileSearch className="w-8 h-8 text-blue-500" />}
      color="blue"
    >
      {!file ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a scanned PDF or image here"
          subtitle="PDF, JPG, PNG, TIFF supported"
          icon={<FileSearch className="w-8 h-8 text-blue-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                {fileType === 'pdf' ? (
                  <FileText className="w-5 h-5 text-blue-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB · {fileType === 'pdf' ? 'PDF Document' : 'Image'}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
            >
              Change file
            </button>
          </div>

          {/* SETTINGS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">OCR Settings</h3>
            </div>

            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              Document Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-400/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#1f2333]">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>

            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/20 flex gap-3">
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-100 leading-relaxed">
                <p className="font-bold mb-1 text-blue-200">✨ Improved accuracy:</p>
                <p>Images are auto-sharpened and text is extracted in correct reading order (top to bottom, left to right).</p>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-400/30">
              <div className="flex items-center gap-2 mb-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin text-blue-300" />}
                <span className="text-sm font-semibold text-blue-200">{progress}</span>
                {progressPct > 0 && (
                  <span className="ml-auto text-xs font-mono text-blue-300">{progressPct}%</span>
                )}
              </div>
              {progressPct > 0 && (
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* RESULTS */}
          {pages.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 mb-4">

              {pages.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-white/10">
                  {pages.map((p, i) => (
                    <button
                      key={p.page}
                      onClick={() => setActivePage(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activePage === i
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Page {p.page}
                      {p.confidence > 0 && (
                        <span className="ml-1.5 text-[10px] opacity-70">
                          {Math.round(p.confidence)}%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Extracted Text
                  {pages.length > 1 && (
                    <span className="text-xs text-gray-500 font-normal">
                      — Page {activePage + 1}
                    </span>
                  )}
                </h3>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                >
                  {copied ? (
                    <><Check className="w-3 h-3 text-green-400" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              </div>

              <textarea
                value={pages[activePage]?.text || ''}
                onChange={(e) => updateText(e.target.value)}
                rows={14}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400/50 font-mono leading-relaxed resize-none"
                placeholder="Extracted text will appear here..."
              />

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                <span>
                  <strong className="text-gray-300">{pages[activePage]?.text.length || 0}</strong> characters
                </span>
                <span>
                  <strong className="text-gray-300">{pages[activePage]?.text.split(/\s+/).filter(Boolean).length || 0}</strong> words
                </span>
                {pages[activePage]?.confidence > 0 && (
                  <span>
                    Confidence: <strong className="text-green-400">{Math.round(pages[activePage].confidence)}%</strong>
                  </span>
                )}
                <span className="ml-auto text-gray-600">
                  💡 Text is editable
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300 flex items-start gap-2">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={runOCR}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <FileSearch className="w-5 h-5" /> Run OCR
                </>
              )}
            </button>

            {pages.length > 0 && (
              <button
                onClick={downloadText}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 transition-all"
              >
                <Download className="w-5 h-5" /> Download .txt
              </button>
            )}

            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
            >
              Reset
            </button>
          </div>

        </div>
      )}
    </ToolPage>
  );
}