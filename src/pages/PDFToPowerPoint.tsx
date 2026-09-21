import { useState } from 'react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pptxgen from 'pptxgenjs';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Download, Loader2, Presentation, CheckCircle,
  AlertCircle, Info, Image as ImageIcon
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PagePreview {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/* ============================================================
   RENDER PDF PAGE TO HIGH-QUALITY IMAGE
   ============================================================ */
async function renderPageToImage(page: any, dpi: number = 150): Promise<PagePreview> {
  const scale = dpi / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/png', 1.0);

  return {
    pageNumber: page.pageNumber,
    dataUrl,
    width: viewport.width,
    height: viewport.height,
  };
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function PDFToPowerPoint() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer; pageCount: number } | null>(null);
  const [previews, setPreviews] = useState<PagePreview[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quality, setQuality] = useState<'standard' | 'high'>('high');
  const [showPreview, setShowPreview] = useState(false);

  /* ============ LOAD FILE ============ */
  const handleFileUpload = async (files: File[]) => {
    setError('');
    setSuccess('');
    setPreviews([]);
    setShowPreview(false);

    const file = files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
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
  const convertToPPT = async () => {
    if (!pdfFile) return;

    setProcessing(true);
    setError('');
    setSuccess('');
    setProgressPct(0);
    setPreviews([]);

    try {
      const dpi = quality === 'high' ? 150 : 100;

      setProgress('Opening PDF...');
      const pdf = await pdfjsLib.getDocument({ data: pdfFile.arrayBuffer.slice(0) }).promise;

      const totalPages = pdf.numPages;
      const pageImages: PagePreview[] = [];

      // Render all pages
      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Rendering page ${i} of ${totalPages}...`);
        setProgressPct(Math.round(((i - 1) / totalPages) * 70));

        const page = await pdf.getPage(i);
        const preview = await renderPageToImage(page, dpi);
        pageImages.push(preview);
      }

      setPreviews(pageImages);

      // Build PPTX
      setProgress('Building PowerPoint file...');
      setProgressPct(75);

      const pptx = new pptxgen();

      const firstPage = pageImages[0];
      const aspectRatio = firstPage.width / firstPage.height;

      const baseWidth = 10;
      const baseHeight = baseWidth / aspectRatio;

      pptx.defineLayout({
        name: 'PDF_LAYOUT',
        width: baseWidth,
        height: baseHeight,
      });
      pptx.layout = 'PDF_LAYOUT';

      // Add slides
      for (let i = 0; i < pageImages.length; i++) {
        setProgress(`Adding slide ${i + 1} of ${pageImages.length}...`);
        setProgressPct(75 + Math.round(((i + 1) / pageImages.length) * 20));

        const img = pageImages[i];
        const slide = pptx.addSlide();

        slide.background = { color: 'FFFFFF' };

        slide.addImage({
          data: img.dataUrl,
          x: 0,
          y: 0,
          w: baseWidth,
          h: baseHeight,
        });
      }

      setProgress('Saving file...');
      setProgressPct(98);

      const outName = pdfFile.name.replace(/\.pdf$/i, '') + '.pptx';
      await pptx.writeFile({ fileName: outName });

      setProgressPct(100);
      setProgress('Done!');
      setSuccess(`✅ Converted! Downloaded as ${outName}.`);
      setShowPreview(true);
    } catch (err: any) {
      console.error(err);
      setError('Conversion failed. ' + (err.message || 'Please try again.'));
      setProgress('');
      setProgressPct(0);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPreviews([]);
    setError('');
    setSuccess('');
    setProgress('');
    setProgressPct(0);
    setShowPreview(false);
  };

  return (
    <ToolPage
      title="PDF to PowerPoint"
      description="Convert PDF pages to PowerPoint slides — high-quality image-based conversion."
      icon={<Presentation className="w-8 h-8 text-purple-500" />}
      color="purple"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Presentation className="w-8 h-8 text-purple-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
                <Presentation className="w-5 h-5 text-purple-400" />
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

          {/* INFO BOX — Short & Clean */}
          <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-purple-100 leading-relaxed">
              <p className="font-bold mb-1 text-purple-200">
                ✅ High-quality conversion
              </p>
              <p>
                Each PDF page is rendered at <strong>{quality === 'high' ? '150 DPI' : '100 DPI'}</strong> as
                a full-slide image in a real <strong>.pptx</strong> file. Perfect visuals, browser-only processing.
              </p>
            </div>
          </div>

          {/* QUALITY SELECTOR */}
          <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-bold text-white mb-1">Output Quality</p>
              <p className="text-xs text-gray-400">
                {quality === 'high'
                  ? 'High (150 DPI) — best quality, larger file size'
                  : 'Standard (100 DPI) — smaller file, good quality'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setQuality('standard')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  quality === 'standard'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setQuality('high')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  quality === 'high'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                High Quality
              </button>
            </div>
          </div>

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-400/30">
              <div className="flex items-center gap-2 mb-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin text-purple-300" />}
                <span className="text-sm font-semibold text-purple-200">{progress}</span>
                {progressPct > 0 && (
                  <span className="ml-auto text-xs font-mono text-purple-300">{progressPct}%</span>
                )}
              </div>
              {progressPct > 0 && (
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-fuchsia-600 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* PREVIEW */}
          {showPreview && previews.length > 0 && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  Slides Preview ({previews.length} slides)
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {previews.slice(0, 12).map((p) => (
                  <div
                    key={p.pageNumber}
                    className="relative rounded-lg overflow-hidden border border-white/10 bg-white"
                  >
                    <img
                      src={p.dataUrl}
                      alt={`Slide ${p.pageNumber}`}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                    <div className="absolute top-1 left-1 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                      Slide {p.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
              {previews.length > 12 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  +{previews.length - 12} more slides not shown
                </p>
              )}
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
              onClick={convertToPPT}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-base rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Convert to PowerPoint (.pptx)
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
            >
              Reset
            </button>
          </div>

          {/* BOTTOM HINT */}
          <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-400/20 text-xs text-purple-200 leading-relaxed">
            💡 <strong className="text-purple-300">Tip:</strong>{' '}
            The <strong>.pptx</strong> file opens in <strong>Microsoft PowerPoint</strong>,{' '}
            <strong>Google Slides</strong>, <strong>Keynote</strong>, and <strong>LibreOffice Impress</strong>.
          </div>

        </div>
      )}
    </ToolPage>
  );
}