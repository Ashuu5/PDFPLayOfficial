import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Crop, Download, Loader2, RotateCcw, Move, Wand2,
  Maximize2, FileImage, Ruler
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

type Unit = 'pt' | 'mm' | 'in';

interface CropBox {
  top: number;     // in points
  bottom: number;
  left: number;
  right: number;
}

const MM_PER_PT = 25.4 / 72;
const IN_PER_PT = 1 / 72;

const UNIT_LABELS: Record<Unit, string> = {
  pt: 'Points (pt)',
  mm: 'Millimeters (mm)',
  in: 'Inches (in)',
};

const PRESETS = [
  { name: 'Remove 1" border', box: { top: 72, bottom: 72, left: 72, right: 72 } },
  { name: 'Remove 0.5" border', box: { top: 36, bottom: 36, left: 36, right: 36 } },
  { name: 'Remove 1cm border', box: { top: 28.35, bottom: 28.35, left: 28.35, right: 28.35 } },
  { name: 'Narrow margins', box: { top: 18, bottom: 18, left: 18, right: 18 } },
  { name: 'Reset', box: { top: 0, bottom: 0, left: 0, right: 0 } },
];

export default function CropPDF() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer; pageCount: number } | null>(null);
  const [pagePreview, setPagePreview] = useState('');
  const [pageDims, setPageDims] = useState({ w: 0, h: 0 });    // PDF points
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 }); // rendered px
  const [crop, setCrop] = useState<CropBox>({ top: 0, bottom: 0, left: 0, right: 0 });
  const [unit, setUnit] = useState<Unit>('pt');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, crop: { top: 0, bottom: 0, left: 0, right: 0 } });

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ============ UNIT CONVERSION ============ */
  const toDisplay = (pt: number) => {
    if (unit === 'mm') return +(pt * MM_PER_PT).toFixed(2);
    if (unit === 'in') return +(pt * IN_PER_PT).toFixed(3);
    return +pt.toFixed(1);
  };

  const fromDisplay = (val: number) => {
    if (unit === 'mm') return val / MM_PER_PT;
    if (unit === 'in') return val / IN_PER_PT;
    return val;
  };

  /* ============ LOAD FILE ============ */
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

      // Render first page preview
      const pdfjs = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const page = await pdfjs.getPage(1);
      const viewport = page.getViewport({ scale: 0.8 });

      setPageDims({
        w: viewport.width / 0.8,
        h: viewport.height / 0.8,
      });
      setCanvasDims({ w: viewport.width, h: viewport.height });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      setPagePreview(canvas.toDataURL('image/png'));
      setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
    } catch (err: any) {
      setError('Failed to load PDF. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============ DRAW PREVIEW ============ */
  useEffect(() => {
    if (!pagePreview || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw PDF page
      ctx.drawImage(img, 0, 0);

      // Scale crop (in points) → canvas pixels
      const scaleX = canvas.width / pageDims.w;
      const scaleY = canvas.height / pageDims.h;

      const x1 = crop.left * scaleX;
      const y1 = crop.top * scaleY;
      const x2 = canvas.width - crop.right * scaleX;
      const y2 = canvas.height - crop.bottom * scaleY;

      // Dim the crop-outside area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      // Top
      ctx.fillRect(0, 0, canvas.width, y1);
      // Bottom
      ctx.fillRect(0, y2, canvas.width, canvas.height - y2);
      // Left
      ctx.fillRect(0, y1, x1, y2 - y1);
      // Right
      ctx.fillRect(x2, y1, canvas.width - x2, y2 - y1);

      // Draw crop boundary
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]);

      // Draw corner handles
      const handleSize = 10;
      ctx.fillStyle = '#14b8a6';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;

      const corners = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 },
      ];
      corners.forEach((c) => {
        ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      });

      // Draw edge handles
      const edgeHandles = [
        { x: (x1 + x2) / 2, y: y1 },  // top
        { x: (x1 + x2) / 2, y: y2 },  // bottom
        { x: x1, y: (y1 + y2) / 2 },  // left
        { x: x2, y: (y1 + y2) / 2 },  // right
      ];
      edgeHandles.forEach((c) => {
        ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      });
    };
    img.src = pagePreview;
  }, [pagePreview, crop, pageDims]);

  /* ============ DRAG HANDLERS ============ */
  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = previewCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    const scaleX = canvasDims.w / pageDims.w;
    const scaleY = canvasDims.h / pageDims.h;

    // Convert canvas coords to PDF points
    const pdfX = pos.x / scaleX;
    const pdfY = pos.y / scaleY;

    // Hit-test corners/edges
    const cropX1 = crop.left;
    const cropY1 = crop.top;
    const cropX2 = pageDims.w - crop.right;
    const cropY2 = pageDims.h - crop.bottom;

    const threshold = 30; // tolerance in points

    let handle: string | null = null;
    if (Math.abs(pdfX - cropX1) < threshold && Math.abs(pdfY - cropY1) < threshold) handle = 'tl';
    else if (Math.abs(pdfX - cropX2) < threshold && Math.abs(pdfY - cropY1) < threshold) handle = 'tr';
    else if (Math.abs(pdfX - cropX1) < threshold && Math.abs(pdfY - cropY2) < threshold) handle = 'bl';
    else if (Math.abs(pdfX - cropX2) < threshold && Math.abs(pdfY - cropY2) < threshold) handle = 'br';
    else if (Math.abs(pdfY - cropY1) < threshold) handle = 'top';
    else if (Math.abs(pdfY - cropY2) < threshold) handle = 'bottom';
    else if (Math.abs(pdfX - cropX1) < threshold) handle = 'left';
    else if (Math.abs(pdfX - cropX2) < threshold) handle = 'right';
    else if (pdfX > cropX1 && pdfX < cropX2 && pdfY > cropY1 && pdfY < cropY2) handle = 'move';

    if (handle) {
      e.preventDefault();
      setDragging(handle);
      setDragStart({ x: pdfX, y: pdfY, crop: { ...crop } });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const pos = getCanvasPos(e);
    const scaleX = canvasDims.w / pageDims.w;
    const scaleY = canvasDims.h / pageDims.h;
    const pdfX = pos.x / scaleX;
    const pdfY = pos.y / scaleY;

    const dx = pdfX - dragStart.x;
    const dy = pdfY - dragStart.y;
    const start = dragStart.crop;

    let newCrop: CropBox = { ...start };

    if (dragging === 'top') {
      newCrop.top = Math.max(0, Math.min(pageDims.h - start.bottom - 50, start.top + dy));
    } else if (dragging === 'bottom') {
      newCrop.bottom = Math.max(0, Math.min(pageDims.h - start.top - 50, start.bottom - dy));
    } else if (dragging === 'left') {
      newCrop.left = Math.max(0, Math.min(pageDims.w - start.right - 50, start.left + dx));
    } else if (dragging === 'right') {
      newCrop.right = Math.max(0, Math.min(pageDims.w - start.left - 50, start.right - dx));
    } else if (dragging === 'tl') {
      newCrop.top = Math.max(0, Math.min(pageDims.h - start.bottom - 50, start.top + dy));
      newCrop.left = Math.max(0, Math.min(pageDims.w - start.right - 50, start.left + dx));
    } else if (dragging === 'tr') {
      newCrop.top = Math.max(0, Math.min(pageDims.h - start.bottom - 50, start.top + dy));
      newCrop.right = Math.max(0, Math.min(pageDims.w - start.left - 50, start.right - dx));
    } else if (dragging === 'bl') {
      newCrop.bottom = Math.max(0, Math.min(pageDims.h - start.top - 50, start.bottom - dy));
      newCrop.left = Math.max(0, Math.min(pageDims.w - start.right - 50, start.left + dx));
    } else if (dragging === 'br') {
      newCrop.bottom = Math.max(0, Math.min(pageDims.h - start.top - 50, start.bottom - dy));
      newCrop.right = Math.max(0, Math.min(pageDims.w - start.left - 50, start.right - dx));
    } else if (dragging === 'move') {
      const newLeft = Math.max(0, Math.min(pageDims.w - (start.left + start.right) - 50, start.left + dx));
      const newTop = Math.max(0, Math.min(pageDims.h - (start.top + start.bottom) - 50, start.top + dy));
      newCrop.left = newLeft;
      newCrop.top = newTop;
    }

    setCrop(newCrop);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  /* ============ AUTO-DETECT MARGINS ============ */
  const autoDetectMargins = async () => {
    if (!pdfFile || !previewCanvasRef.current) return;
    setLoading(true);
    try {
      const pdf = await pdfjsLib.getDocument({ data: pdfFile.arrayBuffer.slice(0) }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Threshold for "white" — anything above this is considered empty
      const whiteThreshold = 240;

      let top = 0, bottom = canvas.height, left = 0, right = canvas.width;

      // Scan top
      topScan: for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] < whiteThreshold || data[i + 1] < whiteThreshold || data[i + 2] < whiteThreshold) {
            top = y;
            break topScan;
          }
        }
      }

      // Scan bottom
      bottomScan: for (let y = canvas.height - 1; y >= 0; y--) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] < whiteThreshold || data[i + 1] < whiteThreshold || data[i + 2] < whiteThreshold) {
            bottom = y;
            break bottomScan;
          }
        }
      }

      // Scan left
      leftScan: for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] < whiteThreshold || data[i + 1] < whiteThreshold || data[i + 2] < whiteThreshold) {
            left = x;
            break leftScan;
          }
        }
      }

      // Scan right
      rightScan: for (let x = canvas.width - 1; x >= 0; x--) {
        for (let y = 0; y < canvas.height; y++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] < whiteThreshold || data[i + 1] < whiteThreshold || data[i + 2] < whiteThreshold) {
            right = x;
            break rightScan;
          }
        }
      }

      // Add small padding (10px)
      const padding = 10;
      top = Math.max(0, top - padding);
      bottom = Math.min(canvas.height, bottom + padding);
      left = Math.max(0, left - padding);
      right = Math.min(canvas.width, right + padding);

      // Convert to points (canvas is at scale 2)
      const scale = 2;
      const topPt = top / scale;
      const bottomPt = (canvas.height - bottom) / scale;
      const leftPt = left / scale;
      const rightPt = (canvas.width - right) / scale;

      setCrop({ top: topPt, bottom: bottomPt, left: leftPt, right: rightPt });
    } catch (err: any) {
      setError('Auto-detect failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============ CROP PDF ============ */
  const cropPDF = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    try {
      const pdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
      const pages = pdf.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        const newX = crop.left;
        const newY = crop.bottom;
        const newWidth = Math.max(10, width - crop.left - crop.right);
        const newHeight = Math.max(10, height - crop.top - crop.bottom);
        page.setCropBox(newX, newY, newWidth, newHeight);
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `cropped-${pdfFile.name}`);
    } catch (err: any) {
      setError('Failed to crop PDF. ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPagePreview('');
    setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
    setError('');
  };

  const resetCrop = () => {
    setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
  };

  /* ============ CURSOR ============ */
  const getCursor = () => {
    if (!dragging) return 'crosshair';
    if (dragging === 'tl' || dragging === 'br') return 'nwse-resize';
    if (dragging === 'tr' || dragging === 'bl') return 'nesw-resize';
    if (dragging === 'top' || dragging === 'bottom') return 'ns-resize';
    if (dragging === 'left' || dragging === 'right') return 'ew-resize';
    if (dragging === 'move') return 'move';
    return 'crosshair';
  };

  return (
    <ToolPage
      title="Crop PDF"
      description="Visually crop margins with drag handles and live preview."
      icon={<Crop className="w-8 h-8 text-teal-500" />}
      color="teal"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Crop className="w-8 h-8 text-teal-500" />}
        />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
        </div>
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                <Crop className="w-5 h-5 text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={pdfFile.name}>
                  {pdfFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'} · {' '}
                  {pageDims.w.toFixed(0)} × {pageDims.h.toFixed(0)} pt
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

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#1f2333] border border-white/10 mb-4 sticky top-16 z-30 backdrop-blur-xl">

            <button
              onClick={autoDetectMargins}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.02] transition-all"
              title="Automatically detect and crop white margins"
            >
              <Wand2 className="w-4 h-4" />
              Auto-detect margins
            </button>

            <span className="w-px h-6 bg-white/10" />

            <button
              onClick={resetCrop}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset crop
            </button>

            <div className="ml-auto flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gray-500" />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400/50"
              >
                {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
                  <option key={u} value={u} className="bg-[#1f2333]">{UNIT_LABELS[u]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT: PREVIEW */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Move className="w-4 h-4 text-teal-400" />
                  Drag the handles to crop
                </h3>
                <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-400/30 font-semibold">
                  Page 1
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 overflow-hidden">
                <div className="flex justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="max-w-full h-auto rounded-lg shadow-2xl shadow-black/50"
                    style={{ maxHeight: '600px', cursor: getCursor() }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: CONTROLS */}
            <div className="space-y-4">

              {/* Presets */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setCrop(p.box)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-teal-500/20 hover:border-teal-400/50 hover:text-teal-200 transition-all"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual inputs */}
              <div className="grid grid-cols-2 gap-3">
                {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                  <div key={side}>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block capitalize">
                      {side}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={toDisplay(crop[side])}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setCrop({ ...crop, [side]: Math.max(0, fromDisplay(val)) });
                        }}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400/50 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Result info */}
              <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <Maximize2 className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-teal-200 uppercase tracking-wider">
                    Result
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-teal-300/70">New width:</span>
                    <p className="text-white font-mono font-bold">
                      {toDisplay(Math.max(0, pageDims.w - crop.left - crop.right))} {unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-300/70">New height:</span>
                    <p className="text-white font-mono font-bold">
                      {toDisplay(Math.max(0, pageDims.h - crop.top - crop.bottom))} {unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-300/70">Original:</span>
                    <p className="text-gray-400 font-mono">
                      {toDisplay(pageDims.w)} × {toDisplay(pageDims.h)} {unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-300/70">Reduction:</span>
                    <p className="text-emerald-400 font-mono">
                      {Math.round(100 - ((pageDims.w - crop.left - crop.right) * (pageDims.h - crop.top - crop.bottom)) / (pageDims.w * pageDims.h) * 100)}%
                    </p>
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
                  onClick={cropPDF}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {processing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Cropping...</>
                  ) : (
                    <><Download className="w-5 h-5" /> Crop & Download</>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={processing}
                  className="px-5 py-3 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
                >
                  Reset
                </button>
              </div>

            </div>
          </div>

          {/* HINT */}
          <div className="mt-4 p-3 rounded-xl bg-teal-500/10 border border-teal-400/20 text-xs text-teal-200 leading-relaxed">
            💡 <strong className="text-teal-300">Tip:</strong>{' '}
            Drag the corner or edge handles on the preview to adjust crop. Or use <strong>Auto-detect margins</strong> to remove white borders automatically.
          </div>

        </div>
      )}
    </ToolPage>
  );
}