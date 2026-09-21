import { useState } from 'react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import Tesseract from 'tesseract.js';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  FileEdit, Download, Loader2, FileText, CheckCircle,
  AlertCircle, Eye, Type, Sparkles
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface TextItem {
  text: string; x: number; y: number; width: number;
  fontSize: number; isBold: boolean; isItalic: boolean;
}

interface Line {
  y: number; items: TextItem[]; avgFontSize: number; text: string;
}

interface PageData {
  pageNumber: number; lines: Line[]; width: number; height: number;
}

/* ============ PDF TEXT EXTRACTION ============ */
async function extractPageText(page: any, pageNumber: number): Promise<PageData> {
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  const items: TextItem[] = textContent.items
    .filter((item: any) => item.str && item.str.trim())
    .map((item: any) => {
      const transform = item.transform;
      const x = transform[4];
      const y = viewport.height - transform[5];
      const fontSize = Math.abs(transform[3]) || transform[0] || 12;
      const fontName = (item.fontName || '').toLowerCase();
      return {
        text: item.str, x, y,
        width: item.width || 0,
        fontSize,
        isBold: fontName.includes('bold') || fontName.includes('black'),
        isItalic: fontName.includes('italic') || fontName.includes('oblique'),
      };
    });

  const sorted = [...items].sort((a, b) => a.y - b.y);
  const lines: Line[] = [];

  for (const item of sorted) {
    const existing = lines.find((l) => Math.abs(l.y - item.y) <= 4);
    if (existing) {
      existing.items.push(item);
      existing.avgFontSize = (existing.avgFontSize + item.fontSize) / 2;
    } else {
      lines.push({ y: item.y, items: [item], avgFontSize: item.fontSize, text: '' });
    }
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    let text = '';
    let lastEndX = 0;
    for (let i = 0; i < line.items.length; i++) {
      const item = line.items[i];
      if (i > 0 && item.x - lastEndX > 2) text += ' ';
      text += item.text;
      lastEndX = item.x + item.width;
    }
    line.text = text.trim();
  }

  lines.sort((a, b) => a.y - b.y);

  return {
    pageNumber,
    lines: lines.filter((l) => l.text.length > 0),
    width: viewport.width,
    height: viewport.height,
  };
}

/* ============ DETECT IF PDF IS TEXT-BASED ============ */
async function detectTextBased(pdf: any): Promise<{ isTextBased: boolean; avgCharsPerPage: number }> {
  let totalChars = 0;
  const samplePages = Math.min(pdf.numPages, 3);
  for (let i = 1; i <= samplePages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    totalChars += content.items.reduce(
      (sum: number, item: any) => sum + (item.str?.length || 0),
      0
    );
  }
  const avgCharsPerPage = totalChars / samplePages;
  return { isTextBased: avgCharsPerPage > 50, avgCharsPerPage };
}

/* ============ OCR FALLBACK ============ */
async function ocrPage(
  page: any,
  onProgress: (pct: number, status: string) => void
): Promise<string> {
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Preprocess: enhance contrast
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray > 140 ? 255 : 0;
    data[i] = val; data[i + 1] = val; data[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await fetch(dataUrl).then(r => r.blob());

  const result = await Tesseract.recognize(blob, 'eng', {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), `Recognizing text ${Math.round(m.progress * 100)}%`);
      } else {
        onProgress(0, m.status);
      }
    },
  });

  // Extract with better ordering from blocks
  const d: any = result.data;
  if (d?.blocks) {
    const lines: string[] = [];
    const sortedBlocks = [...d.blocks].sort((a: any, b: any) => (a?.bbox?.y0 ?? 0) - (b?.bbox?.y0 ?? 0));
    for (const block of sortedBlocks) {
      if (!block?.paragraphs) continue;
      for (const para of block.paragraphs) {
        if (!para?.lines) continue;
        const sortedLines = [...para.lines].sort((a: any, b: any) => (a?.bbox?.y0 ?? 0) - (b?.bbox?.y0 ?? 0));
        for (const line of sortedLines) {
          if (line?.text) lines.push(line.text.trim());
        }
      }
    }
    return lines.join('\n');
  }
  return d?.text || '';
}

/* ============ BUILD WORD HTML ============ */
function buildWordHtml(
  pages: { pageNumber: number; content: string; isOCR: boolean }[],
  fileName: string
): string {
  let html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(fileName.replace('.pdf', ''))}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
<![endif]-->
<style>
@page { size: A4; margin: 1in; }
body { font-family: 'Calibri','Arial',sans-serif; font-size: 11pt; line-height: 1.4; color: #000; }
.page { page-break-after: always; margin-bottom: 20px; }
.page:last-child { page-break-after: auto; }
p { margin: 0 0 6pt 0; white-space: pre-wrap; }
.page-number { color: #999; font-size: 9pt; font-style: italic; margin-bottom: 12pt; }
</style>
</head>
<body>
`;

  pages.forEach((page, idx) => {
    html += `<div class="page">\n`;
    html += `<p class="page-number">— Page ${page.pageNumber}${page.isOCR ? ' (OCR)' : ''} —</p>\n`;

    // Split content by lines, keep structure
    const lines = page.content.split('\n').filter(l => l.trim());
    for (const line of lines) {
      html += `<p>${escapeHtml(line)}</p>\n`;
    }

    html += `</div>\n`;
  });

  html += `</body></html>`;
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ============ BUILD PLAIN TEXT ============ */
function buildPlainText(pages: { pageNumber: number; content: string }[]): string {
  return pages.map((p) => `===== Page ${p.pageNumber} =====\n\n${p.content}`).join('\n\n');
}

export default function PDFToWord() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer; pageCount: number } | null>(null);
  const [useOCR, setUseOCR] = useState<boolean>(false);
  const [detectionInfo, setDetectionInfo] = useState<{ isTextBased: boolean; avgCharsPerPage: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [wordHtml, setWordHtml] = useState('');

  /* ============ LOAD ============ */
  const handleFileUpload = async (files: File[]) => {
    setError(''); setSuccess(''); setExtractedText(''); setWordHtml('');
    const file = files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;

      // Detect if text-based
      const detection = await detectTextBased(pdf);
      setDetectionInfo(detection);
      setUseOCR(!detection.isTextBased); // Auto-enable OCR if not text-based

      setPdfFile({
        name: file.name,
        arrayBuffer,
        pageCount: pdf.numPages,
      });
    } catch (err: any) {
      setError('Failed to load PDF. ' + err.message);
    }
  };

  /* ============ CONVERT ============ */
  const convertToWord = async () => {
    if (!pdfFile) return;

    setProcessing(true);
    setError('');
    setSuccess('');
    setProgressPct(0);
    setProgress('Loading PDF...');

    try {
      const pdf = await pdfjsLib.getDocument({ data: pdfFile.arrayBuffer.slice(0) }).promise;
      const pageResults: { pageNumber: number; content: string; isOCR: boolean }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`Processing page ${i} of ${pdf.numPages}...`);
        setProgressPct(Math.round(((i - 1) / pdf.numPages) * 90));

        const page = await pdf.getPage(i);

        if (useOCR) {
          // OCR approach
          setProgress(`OCR page ${i} of ${pdf.numPages}...`);
          const text = await ocrPage(page, (pct, status) => {
            const total = Math.round(((i - 1 + pct / 100) / pdf.numPages) * 90);
            setProgressPct(total);
            setProgress(`Page ${i}/${pdf.numPages} — ${status}`);
          });
          pageResults.push({ pageNumber: i, content: text, isOCR: true });
        } else {
          // Text extraction approach
          const pageData = await extractPageText(page, i);
          const content = pageData.lines.map(l => l.text).join('\n');
          pageResults.push({ pageNumber: i, content, isOCR: false });

          // Fallback: if no text found, use OCR for this page
          if (content.trim().length < 20 && detectionInfo && !detectionInfo.isTextBased) {
            setProgress(`Page ${i} empty — using OCR...`);
            const text = await ocrPage(page, () => {});
            pageResults[pageResults.length - 1] = { pageNumber: i, content: text, isOCR: true };
          }
        }
      }

      setProgress('Building Word document...');
      setProgressPct(95);

      const html = buildWordHtml(pageResults, pdfFile.name);
      const blob = new Blob([html], { type: 'application/msword' });
      const newName = pdfFile.name.replace(/\.pdf$/i, '') + '.doc';
      saveAs(blob, newName);

      const plainText = buildPlainText(pageResults);
      setExtractedText(plainText);
      setWordHtml(html);

      setProgressPct(100);
      setProgress('Done!');
      setSuccess(`✅ Converted! Downloaded as ${newName}. Open in Microsoft Word.`);
      setShowPreview(true);
    } catch (err: any) {
      setError('Conversion failed. ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  /* ============ DOWNLOADS ============ */
  const downloadAsTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, pdfFile?.name.replace(/\.pdf$/i, '') + '.txt');
  };

  const downloadAsHtml = () => {
    if (!wordHtml) return;
    const blob = new Blob([wordHtml], { type: 'text/html;charset=utf-8' });
    saveAs(blob, pdfFile?.name.replace(/\.pdf$/i, '') + '.html');
  };

  const handleReset = () => {
    setPdfFile(null); setError(''); setSuccess('');
    setExtractedText(''); setWordHtml(''); setShowPreview(false);
    setProgress(''); setProgressPct(0); setDetectionInfo(null);
  };

  return (
    <ToolPage
      title="PDF to Word"
      description="Extract text from PDF into editable Word — with automatic OCR fallback."
      icon={<FileEdit className="w-8 h-8 text-blue-500" />}
      color="blue"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<FileEdit className="w-8 h-8 text-blue-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={pdfFile.name}>
                  {pdfFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'}
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

          {/* DETECTION INFO */}
          {detectionInfo && (
            <div className={`mb-4 p-4 rounded-xl border flex gap-3 ${
              detectionInfo.isTextBased
                ? 'bg-green-500/10 border-green-400/30'
                : 'bg-amber-500/10 border-amber-400/30'
            }`}>
              {detectionInfo.isTextBased ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-green-100 leading-relaxed">
                    <p className="font-bold mb-1 text-green-200">✅ Text-based PDF detected</p>
                    <p>Direct text extraction will be used. Average {Math.round(detectionInfo.avgCharsPerPage)} characters per page.</p>
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-100 leading-relaxed">
                    <p className="font-bold mb-1 text-amber-200">🔍 Scanned/image PDF detected</p>
                    <p>Only {Math.round(detectionInfo.avgCharsPerPage)} characters found per page. <strong>OCR enabled automatically</strong> to extract real text from images. This may take longer.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* OCR TOGGLE */}
          <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white mb-1">Use OCR (Optical Character Recognition)</p>
              <p className="text-xs text-gray-400">
                Enable for scanned PDFs. {useOCR ? 'Currently ON — slower but works on image PDFs.' : 'Currently OFF — fast, only works on text PDFs.'}
              </p>
            </div>
            <button
              onClick={() => setUseOCR(!useOCR)}
              className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                useOCR ? 'bg-blue-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  useOCR ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
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

          {/* PREVIEW */}
          {showPreview && extractedText && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Extracted Text Preview
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Hide
                </button>
              </div>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={14}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400/50 font-mono leading-relaxed resize-none"
                placeholder="Extracted text will appear here..."
              />
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{extractedText.length} characters</span>
                <span className="text-gray-600">💡 Editable</span>
              </div>
            </div>
          )}

          {/* ERROR / SUCCESS */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-300 mb-1">Success!</p>
                <p className="text-xs text-green-200/80">{success}</p>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={convertToWord}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Convert to Word (.doc)
                </>
              )}
            </button>

            {extractedText && (
              <>
                <button
                  onClick={downloadAsTxt}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/10 transition-all"
                  title="Download as plain text"
                >
                  <Type className="w-4 h-4" />
                  .txt
                </button>
                <button
                  onClick={downloadAsHtml}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/10 transition-all"
                  title="Download as HTML"
                >
                  <FileText className="w-4 h-4" />
                  .html
                </button>
              </>
            )}

            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
            >
              Reset
            </button>
          </div>

          {/* HINT */}
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs text-blue-200 leading-relaxed">
           💡 <strong className="text-blue-300">How it works:</strong>{' '}
The tool first detects whether your PDF is text-based or image-based. Text-based PDFs use <strong>fast extraction</strong>, while image-based PDFs use <strong>automatic OCR</strong>.
          </div>

        </div>
      )}
    </ToolPage>
  );
}