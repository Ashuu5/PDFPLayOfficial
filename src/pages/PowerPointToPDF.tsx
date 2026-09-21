import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import { init } from 'pptx-preview';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Download, Loader2, Presentation, CheckCircle,
  AlertCircle, FileText, RefreshCw, Sparkles
} from 'lucide-react';

/* ============================================================
   RENDER PPTX SLIDES — with overlap fix
   ============================================================ */
async function renderPptxSlides(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();

  /* ============================================================
     STEP 1: Create a LARGE hidden container
     Full-size so slides render at native dimensions
     ============================================================ */
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '1920px';       // ← larger render surface
  container.style.height = '1080px';
  container.style.background = '#ffffff';
  container.style.overflow = 'visible';    // ← important: don't clip
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    /* ============================================================
       STEP 2: Init previewer with larger dimensions
       Larger dimensions → better font/position accuracy
       ============================================================ */
    const previewer = init(container, {
      width: 1920,
      height: 1080,
    });

    await previewer.preview(arrayBuffer);

    /* ============================================================
       STEP 3: Wait LONGER for full render
       Fonts + images + styles need time
       ============================================================ */
    await new Promise((r) => setTimeout(r, 3000));

    // Wait for fonts
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    // Wait for images
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            })
      )
    );

    // Final wait for style recalc
    await new Promise((r) => setTimeout(r, 1500));

    /* ============================================================
       STEP 4: Find slides — deduplicate
       ============================================================ */
    let candidates = Array.from(
      container.querySelectorAll('.pptx-preview-slide-wrapper')
    ) as HTMLElement[];

    if (candidates.length === 0) {
      candidates = Array.from(
        container.querySelectorAll('.pptx-preview-slide, .slide-wrapper')
      ) as HTMLElement[];
    }

    // Remove nested
    const topLevel = candidates.filter((el) => {
      return !candidates.some(
        (other) => other !== el && other.contains(el)
      );
    });

    // Deduplicate by parent + index
    const seen = new Set<string>();
    const uniqueSlides: HTMLElement[] = [];

    for (const el of topLevel) {
      const parent = el.parentElement;
      const index = parent
        ? Array.from(parent.children).indexOf(el)
        : 0;
      const key = `${parent?.className || 'root'}|${index}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueSlides.push(el);
      }
    }

    const finalSlides = uniqueSlides;

    if (finalSlides.length === 0) {
      onProgress?.(1, 1);
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      return [canvas.toDataURL('image/jpeg', 0.95)];
    }

    /* ============================================================
       STEP 5: Capture each slide
       Force slide dimensions to prevent overlap
       ============================================================ */
    const images: string[] = [];
    const total = finalSlides.length;

    for (let i = 0; i < finalSlides.length; i++) {
      const slide = finalSlides[i];
      onProgress?.(i + 1, total);

      try {
        // Force slide to exact dimensions
        slide.style.width = '1920px';
        slide.style.height = '1080px';
        slide.style.minWidth = '1920px';
        slide.style.minHeight = '1080px';
        slide.style.maxWidth = '1920px';
        slide.style.maxHeight = '1080px';
        slide.style.overflow = 'hidden';
        slide.style.position = 'relative';
        slide.style.transform = 'none';
        slide.style.margin = '0';

        // Wait for layout
        await new Promise((r) => setTimeout(r, 200));

        const canvas = await html2canvas(slide, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: 1920,
          height: 1080,
          windowWidth: 1920,
          windowHeight: 1080,
          scrollX: 0,
          scrollY: 0,
        });

        images.push(canvas.toDataURL('image/jpeg', 0.95));
      } catch (err) {
        console.warn(`Slide ${i + 1} failed`, err);
      }
    }

    return images;
  } finally {
    document.body.removeChild(container);
  }
}

/* ============================================================
   BUILD PDF FROM IMAGES
   ============================================================ */
async function buildPdfFromImages(images: string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const PAGE_WIDTH = 841.89;
  const PAGE_HEIGHT = 595.28;

  for (const dataUrl of images) {
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    let img;
    try {
      img = await pdf.embedJpg(bytes);
    } catch {
      img = await pdf.embedPng(bytes);
    }

    const imgAspect = img.width / img.height;
    const pageAspect = PAGE_WIDTH / PAGE_HEIGHT;

    let drawW, drawH, drawX, drawY;

    if (imgAspect > pageAspect) {
      drawW = PAGE_WIDTH;
      drawH = PAGE_WIDTH / imgAspect;
      drawX = 0;
      drawY = (PAGE_HEIGHT - drawH) / 2;
    } else {
      drawH = PAGE_HEIGHT;
      drawW = PAGE_HEIGHT * imgAspect;
      drawX = (PAGE_WIDTH - drawW) / 2;
      drawY = 0;
    }

    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawImage(img, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  return await pdf.save();
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function PowerPointToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = (files: File[]) => {
    setError('');
    setSuccess('');
    setPreviews([]);
    setShowPreview(false);
    setSlideCount(0);

    const f = files[0] || null;
    if (f && !f.name.toLowerCase().endsWith('.pptx')) {
      setError('Only .pptx files are supported. Please save as .pptx and try again.');
      return;
    }
    setFile(f);
  };

  const convertToPDF = async () => {
    if (!file) return;

    setProcessing(true);
    setError('');
    setSuccess('');
    setProgressPct(0);
    setProgress('Reading PowerPoint file...');
    setPreviews([]);

    try {
      setProgress('Rendering slides (this may take 10-30 seconds for complex files)...');
      setProgressPct(15);

      const images = await renderPptxSlides(file, (current, total) => {
        const pct = 15 + Math.round((current / total) * 65);
        setProgressPct(pct);
        setProgress(`Rendering slide ${current} of ${total}...`);
      });

      if (images.length === 0) {
        throw new Error('No slides could be rendered.');
      }

      setSlideCount(images.length);
      setPreviews(images);

      setProgress(`Building PDF from ${images.length} slides...`);
      setProgressPct(85);

      const bytes = await buildPdfFromImages(images);

      setProgress('Finalizing...');
      setProgressPct(95);

      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const outName = file.name.replace(/\.pptx$/i, '') + '.pdf';
      saveAs(blob, outName);

      setProgressPct(100);
      setProgress('Done!');
      setSuccess(`✅ Converted ${images.length} slides! Downloaded as ${outName}.`);
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
    setFile(null);
    setPreviews([]);
    setSlideCount(0);
    setError('');
    setSuccess('');
    setProgress('');
    setProgressPct(0);
    setShowPreview(false);
  };

  return (
    <ToolPage
      title="PowerPoint to PDF"
      description="Convert PowerPoint slides to PDF — with images and backgrounds preserved."
      icon={<Presentation className="w-8 h-8 text-red-500" />}
      color="red"
    >
      {!file ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          accept={{
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
          }}
          multiple={false}
          title="Drop a PowerPoint file here"
          subtitle="PPTX supported"
          icon={<Presentation className="w-8 h-8 text-red-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center shrink-0">
                <Presentation className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                  {slideCount > 0 && ` · ${slideCount} slides`}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Change file
            </button>
          </div>

          {/* INFO BOX */}
          <div className="mb-4 rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-indigo-500/10 overflow-hidden">
            <div className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-violet-300" />
              </div>
              <div className="text-xs leading-relaxed flex-1">
                <p className="font-bold mb-2 text-violet-200 text-sm">
                  ✨ Real slide rendering
                </p>
                <p className="text-gray-300 mb-3">
                  Your files <strong className="text-violet-200">never leave your device</strong> — everything
                  happens locally in your browser for maximum privacy.
                </p>
                <p className="text-gray-300">
                  Each slide is rendered with <strong className="text-violet-200">images, backgrounds,
                  colors, and layouts</strong> preserved — then converted into PDF.
                </p>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-400/30">
              <div className="flex items-center gap-2 mb-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin text-red-300" />}
                <span className="text-sm font-semibold text-red-200">{progress}</span>
                {progressPct > 0 && (
                  <span className="ml-auto text-xs font-mono text-red-300">{progressPct}%</span>
                )}
              </div>
              {progressPct > 0 && (
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-400 to-rose-600 transition-all duration-300"
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
                  <FileText className="w-4 h-4 text-red-400" />
                  Slides Preview ({previews.length} slides)
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Hide
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {previews.slice(0, 12).map((preview, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden border border-white/10 bg-white"
                  >
                    <img
                      src={preview}
                      alt={`Slide ${i + 1}`}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                    <div className="absolute top-1 left-1 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold">
                      Slide {i + 1}
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
              onClick={convertToPDF}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-base rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Rendering...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Convert to PDF
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
          <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-400/20 text-xs text-violet-200 leading-relaxed">
            💡 <strong className="text-violet-300">Tip:</strong>{' '}
            Complex slides may take 10-30 seconds. For 100% pixel-perfect output, use{' '}
            <strong>PowerPoint → File → Export → Create PDF</strong>.
          </div>

        </div>
      )}
    </ToolPage>
  );
}