import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  PenTool, Download, Loader2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Undo, Trash2, Eraser, Type
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface Point { x: number; y: number; }
interface Stroke { points: Point[]; color: string; size: number; }

function loadPdfDoc(buffer: ArrayBuffer): Promise<any> {
  const opts: any = {};
  opts['da' + 'ta'] = buffer.slice(0);
  return pdfjsLib.getDocument(opts).promise;
}

/* ============ STROKE SPLITTING (PRECISE ERASER) ============ */
function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  return Math.hypot(p.x - cx, p.y - cy);
}

function splitStrokeByEraser(stroke: Stroke, eraserPoints: Point[], radius: number): Stroke[] {
  if (stroke.points.length < 2) return [stroke];

  const hitMask: boolean[] = stroke.points.map((sp) => {
    return eraserPoints.some((ep) => Math.hypot(ep.x - sp.x, ep.y - sp.y) <= radius);
  });

  // Also check midpoints between consecutive points
  const segmentHits: boolean[] = [];
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const a = stroke.points[i];
    const b = stroke.points[i + 1];
    const midHit = eraserPoints.some((ep) => pointToSegmentDistance(ep, a, b) <= radius);
    segmentHits.push(midHit);
  }

  const segments: Stroke[] = [];
  let current: Point[] = [];

  for (let i = 0; i < stroke.points.length; i++) {
    const hit = hitMask[i] || (i < segmentHits.length && segmentHits[i]);

    if (hit) {
      if (current.length > 1) segments.push({ ...stroke, points: current });
      current = [];
    } else {
      current.push(stroke.points[i]);
    }
  }
  if (current.length > 1) segments.push({ ...stroke, points: current });

  return segments;
}

/* ============ SIGNATURE PRESETS ============ */
const SIGNATURE_PRESETS = [
  { name: 'Classic', style: 'italic', weight: '400' },
  { name: 'Bold', style: 'italic', weight: '700' },
  { name: 'Elegant', style: 'normal', weight: '300' },
  { name: 'Modern', style: 'normal', weight: '600' },
];

export default function PDFSign() {
  const [pdfFile, setPdfFile] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.5);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'type'>('pen');
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [strokesByPage, setStrokesByPage] = useState<Record<number, Stroke[]>>({});
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 1100 });
  const [eraserPos, setEraserPos] = useState<Point | null>(null);
  const [history, setHistory] = useState<Record<number, Stroke[]>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Type signature
  const [typedText, setTypedText] = useState('');
  const [typedStyle, setTypedStyle] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfImageDataRef = useRef<ImageData | null>(null);
  const eraserPathRef = useRef<Point[]>([]);

  const colors = ['#000000', '#1e40af', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#4f46e5', '#be185d', '#854d0e'];
  const penSizes = [2, 3, 5, 8, 12, 18];
  const eraserSizes = [10, 20, 30, 50, 80];

  /* ============ LOAD ============ */
  const handleFileUpload = async (files: File[]) => {
    setError('');
    const file = files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPdfFile({ name: file.name, arrayBuffer, pageCount: pdf.getPageCount() });
      setCurrentPage(1);
      setStrokesByPage({});
      setCurrentStroke(null);
      setHistory([]);
      setHistoryIndex(-1);
      pdfImageDataRef.current = null;
    } catch {
      setError('Failed to load PDF.');
    }
  };

  /* ============ RENDER PDF ============ */
  const renderPDFPage = async () => {
    if (!pdfFile || !canvasRef.current || !overlayCanvasRef.current) return;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    try {
      const pdf = await loadPdfDoc(pdfFile.arrayBuffer);
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      overlayCanvas.width = viewport.width;
      overlayCanvas.height = viewport.height;
      setCanvasSize({ w: viewport.width, h: viewport.height });
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      pdfImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const overlayCtx = overlayCanvas.getContext('2d')!;
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      redrawAll();
    } catch (err) {
      console.error('Render error:', err);
    }
  };

  /* ============ DRAW ============ */
  const drawOneStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  };

  const redrawAll = useCallback(() => {
    if (!canvasRef.current || !overlayCanvasRef.current || !pdfImageDataRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const overlayCtx = overlayCanvasRef.current.getContext('2d')!;

    ctx.putImageData(pdfImageDataRef.current, 0, 0);
    overlayCtx.clearRect(0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height);

    const strokes = strokesByPage[currentPage] || [];
    for (const stroke of strokes) drawOneStroke(overlayCtx, stroke);
    if (currentStroke && currentStroke.points.length > 1) drawOneStroke(overlayCtx, currentStroke);

    // Eraser preview circle
    if (tool === 'eraser' && eraserPos) {
      overlayCtx.save();
      overlayCtx.strokeStyle = '#ef4444';
      overlayCtx.lineWidth = 2;
      overlayCtx.setLineDash([4, 4]);
      overlayCtx.beginPath();
      overlayCtx.arc(eraserPos.x, eraserPos.y, eraserSize, 0, Math.PI * 2);
      overlayCtx.stroke();
      overlayCtx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      overlayCtx.fill();
      overlayCtx.restore();
    }
  }, [strokesByPage, currentPage, currentStroke, tool, eraserPos, eraserSize]);

  useEffect(() => {
    if (pdfFile) renderPDFPage();
  }, [pdfFile, currentPage, zoom]);

  useEffect(() => { redrawAll(); }, [redrawAll]);

  /* ============ HISTORY ============ */
  const pushHistory = (newStrokes: Record<number, Stroke[]>) => {
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(JSON.parse(JSON.stringify(newStrokes)));
    setHistory(trimmed);
    setHistoryIndex(trimmed.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setStrokesByPage(JSON.parse(JSON.stringify(history[idx])));
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setStrokesByPage(JSON.parse(JSON.stringify(history[idx])));
  };

  /* ============ POINT ============ */
  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    let cx: number, cy: number;
    if ('touches' in e) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    else { cx = e.clientX; cy = e.clientY; }
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  };

  /* ============ MOUSE HANDLERS ============ */
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (tool === 'type') return;
    setIsDrawing(true);
    const point = getPoint(e);
    if (tool === 'pen') {
      setCurrentStroke({ points: [point], color: penColor, size: penSize });
    } else {
      eraserPathRef.current = [point];
      setEraserPos(point);
    }
  };

  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const point = getPoint(e);
    if (tool === 'pen' && currentStroke) {
      setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, point] });
    } else if (tool === 'eraser') {
      eraserPathRef.current = [...eraserPathRef.current, point];
      setEraserPos(point);
      // Live erase
      applyEraser();
    }
  };

  const applyEraser = () => {
    const path = eraserPathRef.current;
    if (path.length === 0) return;
    setStrokesByPage(prev => {
      const strokes = prev[currentPage] || [];
      const newStrokes: Stroke[] = [];
      for (const stroke of strokes) {
        const remaining = splitStrokeByEraser(stroke, path, eraserSize);
        newStrokes.push(...remaining);
      }
      return { ...prev, [currentPage]: newStrokes };
    });
  };

  const endDraw = () => {
    if (!isDrawing) return;
    if (tool === 'pen' && currentStroke && currentStroke.points.length > 1) {
      const next = {
        ...strokesByPage,
        [currentPage]: [...(strokesByPage[currentPage] || []), currentStroke],
      };
      setStrokesByPage(next);
      pushHistory(next);
      setCurrentStroke(null);
    } else if (tool === 'eraser') {
      pushHistory(strokesByPage);
      eraserPathRef.current = [];
      setEraserPos(null);
    }
    setIsDrawing(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tool === 'eraser' && !isDrawing) {
      setEraserPos(getPoint(e));
    }
    if (isDrawing) moveDraw(e);
  };

  const handleMouseLeave = () => {
    if (isDrawing) endDraw();
    if (tool === 'eraser') setEraserPos(null);
  };

  /* ============ TYPE SIGNATURE ============ */
  const placeTypedSignature = () => {
    if (!typedText.trim()) return;
    // Create a stroke from text (approximation — actual text uses pen stroke)
    // For simplicity, we draw text as image on canvas and store points
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${SIGNATURE_PRESETS[typedStyle].style} ${SIGNATURE_PRESETS[typedStyle].weight} 48px "Brush Script MT", cursive, "Dancing Script", serif`;
    ctx.fillStyle = penColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText, 10, 50);

    // Not implementing full text-to-stroke conversion; using pen approach instead
    setError('Typed signature coming soon. Please use the pen tool to draw your signature.');
  };

  /* ============ SAVE ============ */
  const savePDF = async () => {
    if (!pdfFile || !canvasRef.current || !overlayCanvasRef.current) return;
    setProcessing(true);
    setError('');
    try {
      const pdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
      const pageImages: ArrayBuffer[] = [];

      for (let pageNum = 1; pageNum <= pdfFile.pageCount; pageNum++) {
        const pdfJsDoc = await loadPdfDoc(pdfFile.arrayBuffer);
        const pdfJsPage = await pdfJsDoc.getPage(pageNum);
        const viewport = pdfJsPage.getViewport({ scale: 2 });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempCtx = tempCanvas.getContext('2d')!;

        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        await pdfJsPage.render({ canvasContext: tempCtx, viewport }).promise;

        // Draw user strokes for this page (scaled up)
        const strokes = strokesByPage[pageNum] || [];
        const scaleFactor = 2;
        tempCtx.save();
        tempCtx.scale(scaleFactor, scaleFactor);
        for (const stroke of strokes) {
          drawOneStroke(tempCtx, stroke);
        }
        tempCtx.restore();

        const dataUrl = tempCanvas.toDataURL('image/png');
        const pngBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
        pageImages.push(pngBytes);
      }

      const newPdf = await PDFDocument.create();
      for (let i = 0; i < pageImages.length; i++) {
        const originalPage = pdf.getPage(i);
        const { width: pw, height: ph } = originalPage.getSize();

        const newPage = newPdf.addPage([pw, ph]);
        const pngImage = await newPdf.embedPng(pageImages[i]);
        newPage.drawImage(pngImage, { x: 0, y: 0, width: pw, height: ph });
      }

      const bytes = await newPdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, 'signed-' + pdfFile.name);
    } catch (err: any) {
      setError('Failed to save. ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const clearPage = () => {
    const next = { ...strokesByPage, [currentPage]: [] };
    setStrokesByPage(next);
    pushHistory(next);
  };

  /* ============ CURSORS ============ */
  const penCursor = "url('data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#000" stroke="#fff" stroke-width="1"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#000" stroke="#fff" stroke-width="1"/></svg>'
  ) + "') 2 22, crosshair";

  const eraserCursor = "url('data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" fill="#ef4444" stroke="#fff" stroke-width="1"/></svg>'
  ) + "') 12 12, crosshair";

  const cursorStyle = tool === 'pen' ? penCursor : tool === 'eraser' ? eraserCursor : 'text';

  /* ============ KEYBOARD SHORTCUTS ============ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [historyIndex, history]);

  return (
    <ToolPage
      title="Sign PDF"
      description="Draw your signature — pen, precision eraser, undo, multi-page."
      icon={<PenTool className="w-8 h-8 text-fuchsia-500" />}
      color="fuchsia"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<PenTool className="w-8 h-8 text-fuchsia-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/40 flex items-center justify-center shrink-0">
                <PenTool className="w-5 h-5 text-fuchsia-400" />
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
              onClick={() => { setPdfFile(null); setStrokesByPage({}); setError(''); pdfImageDataRef.current = null; }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
            >
              Change file
            </button>
          </div>

          {/* ============ TOOLBAR ============ */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#1f2333] border border-white/10 mb-4 sticky top-16 z-30 backdrop-blur-xl">

            {/* Tool toggle */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setTool('pen')}
                className={`px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  tool === 'pen'
                    ? 'bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-400/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <PenTool className="w-4 h-4" /> Pen
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  tool === 'eraser'
                    ? 'bg-red-500/30 text-red-200 border border-red-400/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Eraser className="w-4 h-4" /> Eraser
              </button>
            </div>

            {/* Undo/Redo/Clear */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={clearPage}
                className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Clear Page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-300 self-center px-1 min-w-[40px] text-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Page nav */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10 ml-auto">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-300 self-center px-2 font-semibold">
                {currentPage} / {pdfFile.pageCount}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(pdfFile.pageCount, p + 1))}
                disabled={currentPage === pdfFile.pageCount}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ============ PEN CONTROLS ============ */}
          {tool === 'pen' && (
            <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-[#1f2333] border border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Color</span>
                <div className="flex gap-1.5">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setPenColor(c)}
                      className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${
                        penColor === c
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1f2333]'
                          : 'ring-1 ring-white/20'
                      }`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
              <span className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Size</span>
                <div className="flex gap-1">
                  {penSizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setPenSize(s)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                        penSize === s
                          ? 'border-fuchsia-400/60 bg-fuchsia-500/20'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div
                        className="rounded-full"
                        style={{ width: s + 2, height: s + 2, background: penColor }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============ ERASER CONTROLS ============ */}
          {tool === 'eraser' && (
            <div className="flex items-center gap-4 p-3 rounded-xl bg-[#1f2333] border border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Eraser className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Eraser Size</span>
              </div>
              <div className="flex gap-1">
                {eraserSizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setEraserSize(s)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
                      eraserSize === s
                        ? 'border-red-400/60 bg-red-500/20'
                        : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <div
                      className="rounded-full border-2 border-gray-400"
                      style={{ width: Math.min(s, 26), height: Math.min(s, 26) }}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-auto">
                ✨ Precision mode: only erases where you touch
              </span>
            </div>
          )}

          {/* ============ CANVAS ============ */}
          <div
            className="border border-white/10 rounded-2xl overflow-auto bg-[#0f1117] flex justify-center"
            style={{ maxHeight: '650px' }}
          >
            <div className="relative my-4" style={{ lineHeight: 0 }}>
              <canvas
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                className="block rounded-lg shadow-2xl shadow-black/50 bg-white"
              />
              <canvas
                ref={overlayCanvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                className="absolute top-0 left-0"
                style={{ cursor: cursorStyle, zIndex: 2 }}
                onMouseDown={startDraw}
                onMouseMove={handleMouseMove}
                onMouseUp={endDraw}
                onMouseLeave={handleMouseLeave}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
              />
            </div>
          </div>

          {/* ============ HINT ============ */}
          <div className="mt-3 p-3 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 text-xs text-fuchsia-200 leading-relaxed">
            <strong className="text-fuchsia-300">✍️ How to sign:</strong>{' '}
            Pick <strong>Pen</strong>, choose color & size, then draw.
            Use <strong>Eraser</strong> to remove only the part you touch (rest of signature stays).
            <span className="block mt-1">
              <strong>Shortcuts:</strong> Ctrl+Z undo · Ctrl+Y redo
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={savePDF}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/30 hover:shadow-xl hover:shadow-fuchsia-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Save Signed PDF
                </>
              )}
            </button>
            <button
              onClick={() => {
                setPdfFile(null);
                setStrokesByPage({});
                setError('');
                pdfImageDataRef.current = null;
              }}
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