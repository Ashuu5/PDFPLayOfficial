import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Droplets, Download, Loader2, Bold, Italic, AlignCenter,
  Grid3X3, Square, Move
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

type Position = 'center' | 'diagonal' | 'tile' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export default function WatermarkPDF() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer; pageCount: number } | null>(null);
  const [pagePreview, setPagePreview] = useState<string>('');
  const [_pageWidth, setPageWidth] = useState(0);
const [_pageHeight, setPageHeight] = useState(0);

  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#ef4444');
  const [position, setPosition] = useState<Position>('diagonal');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const PRESETS = ['CONFIDENTIAL', 'DRAFT', 'COPY', 'SAMPLE', 'VOID', 'ORIGINAL'];
  const COLOR_PRESETS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#000000'];

  /* ============ LOAD ============ */
  const handleFileUpload = async (files: File[]) => {
    setError('');
    const file = files[0];
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pageCount = pdf.getPageCount();
      setPdfFile({ name: file.name, arrayBuffer, pageCount });

      const pdfjs = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const page = await pdfjs.getPage(1);
      const viewport = page.getViewport({ scale: 0.7 });

      setPageWidth(viewport.width);
      setPageHeight(viewport.height);

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      setPagePreview(canvas.toDataURL('image/png'));
    } catch (err: any) {
      setError('Failed to load PDF. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============ PREVIEW RENDER ============ */
  useEffect(() => {
    if (!pagePreview || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = color;
      ctx.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px Inter, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (position === 'tile') {
        const spacing = fontSize * 5;
        for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
          for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
        }
      } else if (position === 'diagonal' || position === 'center') {
        ctx.save();
        ctx.translate(cx, cy);
        if (position === 'diagonal') {
          ctx.rotate((rotation * Math.PI) / 180);
        }
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else if (position === 'top-left') {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text, 40, 40);
      } else if (position === 'top-right') {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(text, canvas.width - 40, 40);
      } else if (position === 'bottom-left') {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, 40, canvas.height - 40);
      } else if (position === 'bottom-right') {
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, canvas.width - 40, canvas.height - 40);
      }

      ctx.restore();
    };
    img.src = pagePreview;
  }, [pagePreview, text, fontSize, opacity, rotation, color, position, isBold, isItalic]);

  /* ============ HEX TO RGB ============ */
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  /* ============ ADD WATERMARK — CORRECTED ============ */
  const addWatermark = async () => {
    if (!pdfFile || !text.trim()) {
      setError('Please enter watermark text.');
      return;
    }
    setProcessing(true);
    setError('');

    try {
      const pdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });

      const fontName = isBold && !isItalic
        ? StandardFonts.HelveticaBold
        : isItalic && !isBold
        ? StandardFonts.HelveticaOblique
        : isBold && isItalic
        ? StandardFonts.HelveticaBoldOblique
        : StandardFonts.Helvetica;

      const font = await pdf.embedFont(fontName);
      const pages = pdf.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        // ============================================================
        // CORRECT ROTATION MATH:
        // pdf-lib rotates text around its anchor point (x, y).
        // To keep text visually centered after rotation,
        // we need to offset the anchor point using cos/sin.
        // ============================================================

        if (position === 'tile') {
          const spacing = fontSize * 5;
          for (let x = 0; x < width + spacing; x += spacing) {
            for (let y = 0; y < height + spacing; y += spacing) {
              page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color: hexToRgb(color),
                opacity,
                rotate: degrees(rotation),
              });
            }
          }
          return;
        }

        if (position === 'diagonal') {
          // Compute rotation offset so text stays centered
          const rad = (rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          // Offset = where the text center SHOULD be, minus where it WOULD be without correction
          const offsetX = (textWidth / 2) * cos - (textHeight / 2) * sin;
          const offsetY = (textWidth / 2) * sin + (textHeight / 2) * cos;

          const x = width / 2 - offsetX;
          const y = height / 2 - offsetY + textHeight / 2;

          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: hexToRgb(color),
            opacity,
            rotate: degrees(rotation),
          });
          return;
        }

        if (position === 'center') {
          // Perfectly centered, no rotation
          const x = width / 2 - textWidth / 2;
          const y = height / 2 - textHeight / 2;
          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: hexToRgb(color),
            opacity,
          });
          return;
        }

        // Corner positions (no rotation, aligned to corners)
        let x = width / 2 - textWidth / 2;
        let y = height / 2 - textHeight / 2;

        if (position === 'top-left') {
          x = 40;
          y = height - 40 - textHeight;
        } else if (position === 'top-right') {
          x = width - 40 - textWidth;
          y = height - 40 - textHeight;
        } else if (position === 'bottom-left') {
          x = 40;
          y = 40;
        } else if (position === 'bottom-right') {
          x = width - 40 - textWidth;
          y = 40;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: hexToRgb(color),
          opacity,
        });
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `watermarked-${pdfFile.name}`);
    } catch (err: any) {
      setError('Failed to add watermark. ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPagePreview('');
    setError('');
  };

  return (
    <ToolPage
      title="Watermark PDF"
      description="Add beautiful text watermarks with live preview."
      icon={<Droplets className="w-8 h-8 text-sky-500" />}
      color="sky"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Droplets className="w-8 h-8 text-sky-500" />}
        />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading preview...</p>
          </div>
        </div>
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                <Droplets className="w-5 h-5 text-sky-400" />
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

          {/* 2-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT: PREVIEW */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Preview
                </h3>
                <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-400/30 font-semibold">
                  Page 1
                </span>
              </div>
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden">
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full h-auto rounded-lg shadow-2xl shadow-black/50 bg-white"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: CONTROLS */}
            <div className="space-y-4">

              {/* Text */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                  Watermark Text
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter watermark..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-400/50 focus:bg-white/10 transition-all"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setText(p)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                        text === p
                          ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Style
                </span>
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`p-2 rounded-lg transition-all ${
                    isBold
                      ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-2 rounded-lg transition-all ${
                    isItalic
                      ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>

              {/* Position — 7 options now */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                  Position
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'diagonal',     icon: Move,        label: 'Diagonal' },
                    { id: 'center',       icon: AlignCenter, label: 'Center' },
                    { id: 'tile',         icon: Grid3X3,     label: 'Tile' },
                    { id: 'top-left',     icon: Square,      label: 'Top Left' },
                    { id: 'top-right',    icon: Square,      label: 'Top Right' },
                    { id: 'bottom-left',  icon: Square,      label: 'Bot Left' },
                    { id: 'bottom-right', icon: Square,      label: 'Bot Right' },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPosition(p.id as Position)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-[10px] font-semibold ${
                          position === p.id
                            ? 'bg-sky-500/30 text-sky-200 border border-sky-400/50'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                        title={p.label}
                      >
                        <Icon className="w-4 h-4" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Font Size
                  </label>
                  <span className="text-xs text-sky-300 font-mono bg-sky-500/10 px-2 py-0.5 rounded">
                    {fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Opacity
                  </label>
                  <span className="text-xs text-sky-300 font-mono bg-sky-500/10 px-2 py-0.5 rounded">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              {/* Rotation — only for diagonal & tile */}
              {(position === 'diagonal' || position === 'tile') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Rotation
                    </label>
                    <span className="text-xs text-sky-300 font-mono bg-sky-500/10 px-2 py-0.5 rounded">
                      {rotation}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              )}

              {/* Color */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                  Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`rounded-full transition-all hover:scale-110 ${
                        color.toLowerCase() === c.toLowerCase()
                          ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-[#0f1117]'
                          : 'ring-1 ring-white/20'
                      }`}
                      style={{
                        width: 26, height: 26, background: c,
                        border: c === '#000000' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                      }}
                      title={c}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10"
                      title="Custom color"
                      style={{ padding: 0, appearance: 'none', WebkitAppearance: 'none' }}
                    />
                    <span
                      className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full pointer-events-none"
                      style={{
                        background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                        border: '1px solid #0f1117',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={addWatermark}
                  disabled={processing || !text.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Applying...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" /> Add Watermark
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={processing}
                  className="px-5 py-3 border border-white/15 text-gray-300 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
                >
                  Reset
                </button>
              </div>

            </div>
          </div>

        </div>
      )}
    </ToolPage>
  );
}