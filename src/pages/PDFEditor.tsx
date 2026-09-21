import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  FileEdit, Download, Loader2, Type, Square, Circle, Minus,
  Highlighter, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Undo, Redo, MousePointer2, Pencil, Eraser, Trash2
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

type ToolId = 'select' | 'text' | 'rect' | 'circle' | 'line' | 'highlight' | 'pen' | 'eraser';

interface Annotation {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'line' | 'highlight' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color: string;
  size?: number;
  rotation?: number;
  points?: { x: number; y: number }[];
}

/* ============ QUICK COLORS ============ */
const QUICK_COLORS = [
  { name: 'Red',    value: '#ef4444' },
  { name: 'Blue',   value: '#3b82f6' },
  { name: 'Green',  value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Black',  value: '#000000' },
];

/* ============ CUSTOM CURSORS ============ */
const penCursor = (size: number, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.5"/></filter></defs><g filter="url(#s)" transform="translate(2,2) rotate(-45 16 16)"><path d="M14 4 L18 4 L18 22 L14 22 Z" fill="${color}" stroke="white" stroke-width="1.2"/><path d="M14 22 L18 22 L16 27 Z" fill="${color}" stroke="white" stroke-width="1.2"/></g><circle cx="16" cy="30" r="${Math.max(2, size / 3)}" fill="none" stroke="${color}" stroke-width="1" opacity="0.6"/></svg>`;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 4 4, crosshair`;
};

const eraserCursor = (size: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><filter id="s"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.5"/></filter></defs><g filter="url(#s)" transform="translate(2,2) rotate(-30 16 16)"><rect x="10" y="8" width="12" height="14" rx="2" fill="#f87171" stroke="white" stroke-width="1.2"/><rect x="10" y="18" width="12" height="4" rx="1" fill="#dc2626"/></g><circle cx="16" cy="30" r="${Math.max(2, size / 3)}" fill="none" stroke="#f87171" stroke-width="1" opacity="0.6"/></svg>`;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 4 4, cell`;
};

const PEN_SIZES = [
  { label: 'S',   value: 2 },
  { label: 'M',   value: 4 },
  { label: 'L',   value: 8 },
  { label: 'XL',  value: 14 },
  { label: 'XXL', value: 22 },
];

const ERASER_SIZES = [
  { label: 'S',   value: 8 },
  { label: 'M',   value: 15 },
  { label: 'L',   value: 25 },
  { label: 'XL',  value: 40 },
  { label: 'XXL', value: 60 },
];

/* ============ GEOMETRY ============ */
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function distToRectOutline(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  return Math.min(
    distToSegment(px, py, x1, y1, x2, y1),
    distToSegment(px, py, x1, y2, x2, y2),
    distToSegment(px, py, x1, y1, x1, y2),
    distToSegment(px, py, x2, y1, x2, y2)
  );
}

function distToEllipse(px: number, py: number, cx: number, cy: number, rx: number, ry: number) {
  if (rx === 0 || ry === 0) return Infinity;
  const nx = (px - cx) / rx, ny = (py - cy) / ry;
  return Math.abs(Math.sqrt(nx * nx + ny * ny) - 1) * Math.min(rx, ry);
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function PDFEditor() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer; pageCount: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [tool, setTool] = useState<ToolId>('select');
  const [color, setColor] = useState('#ef4444');
  const [fontSize, setFontSize] = useState(16);
  const [strokeSize, setStrokeSize] = useState(3);
  const [penSize, setPenSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(15);

  const [annotations, setAnnotations] = useState<Record<number, Annotation[]>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [draft, setDraft] = useState<Annotation | null>(null);

  const [history, setHistory] = useState<Record<number, Annotation[]>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  /* Text box interaction */
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotatingTextId, setRotatingTextId] = useState<string | null>(null);
  const [rotateStart, setRotateStart] = useState({ rotation: 0, pointerAngle: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 200, h: 60, pointerX: 0, pointerY: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const lastMoveTime = useRef(0);
  const didEraseRef = useRef(false);

  /* ============ LOAD ============ */
  const handleFileUpload = async (files: File[]) => {
    setError('');
    const file = files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      pdfDocRef.current = null;
      setPdfFile({ name: file.name, arrayBuffer, pageCount: pdf.getPageCount() });
      setCurrentPage(1);
      setAnnotations({});
      setHistory([]);
      setHistoryIndex(-1);
      setSelectedTextId(null);
      setEditingTextId(null);
      setTool('select');
    } catch {
      setError('Failed to load PDF.');
    }
  };

  /* ============ DRAW ============ */
  const drawAnnotation = useCallback((ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.save();
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;

    switch (ann.type) {
      case 'rect': {
        const w = ann.width || 0, h = ann.height || 0;
        ctx.lineWidth = ann.size || 3;
        ctx.strokeRect(w < 0 ? ann.x + w : ann.x, h < 0 ? ann.y + h : ann.y, Math.abs(w), Math.abs(h));
        break;
      }
      case 'circle': {
        const w = ann.width || 0, h = ann.height || 0;
        ctx.lineWidth = ann.size || 3;
        ctx.beginPath();
        ctx.ellipse(ann.x + w / 2, ann.y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'line':
        ctx.lineWidth = ann.size || 3;
        ctx.beginPath();
        ctx.moveTo(ann.x, ann.y);
        ctx.lineTo(ann.x + (ann.width || 0), ann.y + (ann.height || 0));
        ctx.stroke();
        break;
      case 'highlight': {
        const w = ann.width || 0, h = ann.height || 0;
        ctx.fillStyle = ann.color + '55';
        ctx.fillRect(w < 0 ? ann.x + w : ann.x, h < 0 ? ann.y + h : ann.y, Math.abs(w), Math.abs(h));
        break;
      }
      case 'freehand':
        if (ann.points && ann.points.length > 1) {
          ctx.lineWidth = ann.size || 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
          ctx.stroke();
        }
        break;
    }
    ctx.restore();
  }, []);

  /* ============ RENDER PDF ============ */
  const renderPdfPage = useCallback(async () => {
    if (!pdfFile || !canvasRef.current || !overlayRef.current) return;
    try {
      if (!pdfDocRef.current) {
        pdfDocRef.current = await pdfjsLib.getDocument({ data: pdfFile.arrayBuffer.slice(0) }).promise;
      }
      const pdf = pdfDocRef.current;
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom, rotation: 0 });

      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      const ctx = canvas.getContext('2d')!;
      const w = Math.floor(viewport.width), h = Math.floor(viewport.height);

      canvas.width = w; canvas.height = h;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      overlay.width = w; overlay.height = h;
      overlay.style.width = `${w}px`; overlay.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  }, [pdfFile, currentPage, zoom]);

  /* ============ RENDER OVERLAY ============ */
  const renderOverlay = useCallback(() => {
    if (!overlayRef.current) return;
    const overlay = overlayRef.current;
    const octx = overlay.getContext('2d')!;
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.clearRect(0, 0, overlay.width, overlay.height);
    const pageAnns = (annotations[currentPage] || []).filter((a) => a.type !== 'text');
    const toDraw = draft ? [...pageAnns, draft] : pageAnns;
    toDraw.forEach((ann) => drawAnnotation(octx, ann));
  }, [annotations, currentPage, draft, drawAnnotation]);

  useEffect(() => { renderPdfPage(); }, [renderPdfPage]);
  useEffect(() => { renderOverlay(); }, [renderOverlay]);

  /* ============ HISTORY ============ */
  const pushHistory = (newAnnotations: Record<number, Annotation[]>) => {
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(JSON.parse(JSON.stringify(newAnnotations)));
    setHistory(trimmed);
    setHistoryIndex(trimmed.length - 1);
  };

  const commitAnnotation = (ann: Annotation) => {
    const current = annotations[currentPage] || [];
    const next = { ...annotations, [currentPage]: [...current, ann] };
    setAnnotations(next);
    pushHistory(next);
  };

  /* ============ ERASER ============ */
  const eraseAt = useCallback((x: number, y: number) => {
    setAnnotations((prev) => {
      const pageAnns = prev[currentPage] || [];
      if (pageAnns.length === 0) return prev;

      const r = eraserSize / 2;
      const nextAnns: Annotation[] = [];
      let changed = false;

      for (const ann of pageAnns) {
        if (ann.type === 'freehand' && ann.points && ann.points.length > 0) {
          const strokeR = (ann.size || 3) / 2;
          const hitR = r + strokeR;
          let anyHit = false;
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i], p2 = ann.points[i + 1];
            if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) <= hitR) { anyHit = true; break; }
          }
          if (!anyHit && ann.points.length === 1) {
            anyHit = Math.hypot(ann.points[0].x - x, ann.points[0].y - y) <= hitR;
          }
          if (!anyHit) { nextAnns.push(ann); continue; }
          changed = true;
          let current: { x: number; y: number }[] = [];
          for (const p of ann.points) {
            const hit = Math.hypot(p.x - x, p.y - y) <= hitR;
            if (hit) {
              if (current.length > 1) nextAnns.push({ ...ann, id: crypto.randomUUID(), points: current });
              current = [];
            } else {
              current.push(p);
            }
          }
          if (current.length > 1) nextAnns.push({ ...ann, id: crypto.randomUUID(), points: current });
          continue;
        }

        if (ann.type === 'text' && ann.text) {
          const x1 = ann.x, x2 = ann.x + (ann.width || 100);
          const y1 = ann.y, y2 = ann.y + (ann.height || 40);
          if (x >= x1 - r && x <= x2 + r && y >= y1 - r && y <= y2 + r) { changed = true; continue; }
          nextAnns.push(ann);
          continue;
        }

        if (ann.type === 'line') {
          const x1 = ann.x, y1 = ann.y;
          const x2 = ann.x + (ann.width || 0), y2 = ann.y + (ann.height || 0);
          const strokeR = (ann.size || 3) / 2;
          if (distToSegment(x, y, x1, y1, x2, y2) <= r + strokeR) { changed = true; continue; }
          nextAnns.push(ann);
          continue;
        }

        if (ann.type === 'rect') {
          const x1 = Math.min(ann.x, ann.x + (ann.width || 0));
          const x2 = Math.max(ann.x, ann.x + (ann.width || 0));
          const y1 = Math.min(ann.y, ann.y + (ann.height || 0));
          const y2 = Math.max(ann.y, ann.y + (ann.height || 0));
          const strokeR = (ann.size || 3) / 2;
          if (distToRectOutline(x, y, x1, y1, x2, y2) <= r + strokeR) { changed = true; continue; }
          nextAnns.push(ann);
          continue;
        }

        if (ann.type === 'circle') {
          const w = ann.width || 0, h = ann.height || 0;
          const cx = ann.x + w / 2, cy = ann.y + h / 2;
          const rx = Math.abs(w / 2), ry = Math.abs(h / 2);
          const strokeR = (ann.size || 3) / 2;
          if (distToEllipse(x, y, cx, cy, rx, ry) <= r + strokeR) { changed = true; continue; }
          nextAnns.push(ann);
          continue;
        }

        if (ann.type === 'highlight') {
          const x1 = Math.min(ann.x, ann.x + (ann.width || 0));
          const x2 = Math.max(ann.x, ann.x + (ann.width || 0));
          const y1 = Math.min(ann.y, ann.y + (ann.height || 0));
          const y2 = Math.max(ann.y, ann.y + (ann.height || 0));
          if (x >= x1 - r && x <= x2 + r && y >= y1 - r && y <= y2 + r) { changed = true; continue; }
          nextAnns.push(ann);
          continue;
        }

        nextAnns.push(ann);
      }

      if (!changed) return prev;
      didEraseRef.current = true;
      return { ...prev, [currentPage]: nextAnns };
    });
  }, [currentPage, eraserSize]);

  /* ============ POSITION ============ */
  const getPos = (e: React.MouseEvent | MouseEvent) => {
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  /* ============ CREATE TEXT BOX ============ */
  const createTextBox = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const boxW = 220;
    const boxH = 60;
    const centerX = Math.round((canvas.width - boxW) / 2);
    const centerY = Math.round(canvas.height / 2 - boxH / 2);

    const newAnn: Annotation = {
      id: crypto.randomUUID(),
      type: 'text',
      x: centerX,
      y: centerY,
      text: '',
      fontSize,
      color,
      rotation: 0,
      width: boxW,
      height: boxH,
    };

    const current = annotations[currentPage] || [];
    const next = { ...annotations, [currentPage]: [...current, newAnn] };
    setAnnotations(next);
    pushHistory(next);

    setSelectedTextId(newAnn.id);
    setEditingTextId(newAnn.id);
    setEditingValue('');
  };

  /* ============ DRAG / ROTATE / RESIZE ============ */
  useEffect(() => {
    if (!draggingTextId && !rotatingTextId && !resizeHandle) return;

    const onMove = (e: MouseEvent) => {
      const { x, y } = getPos(e);

      if (draggingTextId) {
        setAnnotations((prev) => {
          const pageAnns = prev[currentPage] || [];
          const updated = pageAnns.map((a) =>
            a.id === draggingTextId ? { ...a, x: x - dragOffset.x, y: y - dragOffset.y } : a
          );
          return { ...prev, [currentPage]: updated };
        });
      } else if (rotatingTextId) {
        const ann = (annotations[currentPage] || []).find((a) => a.id === rotatingTextId);
        if (!ann) return;
        const w = ann.width || 200, h = ann.height || 60;
        const cx = ann.x + w / 2, cy = ann.y + h / 2;
        const currentAngle = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
        let newRot = rotateStart.rotation + (currentAngle - rotateStart.pointerAngle);
        newRot = ((newRot % 360) + 360) % 360;
        setAnnotations((prev) => ({
          ...prev,
          [currentPage]: (prev[currentPage] || []).map((a) =>
            a.id === rotatingTextId ? { ...a, rotation: newRot } : a
          ),
        }));
      } else if (resizeHandle && selectedTextId) {
        const dx = x - resizeStart.pointerX;
        const dy = y - resizeStart.pointerY;
        let newW = resizeStart.w, newH = resizeStart.h;
        let newX = resizeStart.x, newY = resizeStart.y;

        if (resizeHandle.includes('e')) newW = Math.max(60, resizeStart.w + dx);
        if (resizeHandle.includes('s')) newH = Math.max(30, resizeStart.h + dy);
        if (resizeHandle.includes('w')) {
          newW = Math.max(60, resizeStart.w - dx);
          newX = resizeStart.x + (resizeStart.w - newW);
        }
        if (resizeHandle.includes('n')) {
          newH = Math.max(30, resizeStart.h - dy);
          newY = resizeStart.y + (resizeStart.h - newH);
        }

        setAnnotations((prev) => ({
          ...prev,
          [currentPage]: (prev[currentPage] || []).map((a) =>
            a.id === selectedTextId
              ? { ...a, x: newX, y: newY, width: newW, height: newH }
              : a
          ),
        }));
      }
    };

    const onUp = () => {
      setDraggingTextId(null);
      setRotatingTextId(null);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingTextId, rotatingTextId, resizeHandle, selectedTextId, annotations, currentPage, dragOffset, rotateStart, resizeStart]);

  /* ============ MOUSE ============ */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'select') {
      setSelectedTextId(null);
      return;
    }
    const { x, y } = getPos(e);

    if (tool === 'eraser') {
      setIsDrawing(true);
      didEraseRef.current = false;
      eraseAt(x, y);
      return;
    }

    setIsDrawing(true);
    const base: Annotation = {
      id: crypto.randomUUID(),
      type: tool === 'pen' ? 'freehand' : tool,
      x, y, width: 0, height: 0, color,
      size: tool === 'pen' ? penSize : strokeSize,
      points: tool === 'pen' ? [{ x, y }] : undefined,
    };
    setDraft(base);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);

    if (tool === 'eraser') { eraseAt(x, y); return; }

    const now = performance.now();
    if (now - lastMoveTime.current < 12) return;
    lastMoveTime.current = now;

    if (!draft) return;

    if (tool === 'pen' && draft.points) {
      setDraft({ ...draft, points: [...draft.points, { x, y }] });
    } else if (tool === 'rect' || tool === 'circle' || tool === 'line' || tool === 'highlight') {
      setDraft({ ...draft, width: x - draft.x, height: y - draft.y });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    if (tool === 'eraser') {
      setIsDrawing(false);
      if (didEraseRef.current) {
        setTimeout(() => {
          setHistory((h) => {
            const trimmed = h.slice(0, historyIndex + 1);
            setAnnotations((current) => {
              trimmed.push(JSON.parse(JSON.stringify(current)));
              setHistoryIndex(trimmed.length - 1);
              return current;
            });
            return trimmed;
          });
        }, 0);
        didEraseRef.current = false;
      }
      return;
    }

    if (!draft) { setIsDrawing(false); return; }

    const hasSize = Math.abs(draft.width || 0) > 3 || Math.abs(draft.height || 0) > 3;
    const hasPoints = draft.points && draft.points.length > 1;
    if (hasSize || hasPoints) commitAnnotation(draft);
    setDraft(null);
    setIsDrawing(false);
  };

  /* ============ UNDO / REDO / CLEAR ============ */
  const undo = () => {
    if (historyIndex < 0) return;
    if (historyIndex === 0) {
      setAnnotations({});
      setHistoryIndex(-1);
    } else {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex + 1);
    setAnnotations(JSON.parse(JSON.stringify(history[historyIndex + 1])));
  };

  const clearPage = () => {
    const next = { ...annotations, [currentPage]: [] };
    setAnnotations(next);
    pushHistory(next);
    setSelectedTextId(null);
  };

  /* ============ SAVE ============ */
  const savePDF = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    try {
      const pdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const canvasW = overlayRef.current?.width || 1;
      const canvasH = overlayRef.current?.height || 1;

      for (const [pageNum, anns] of Object.entries(annotations)) {
        const page = pages[parseInt(pageNum) - 1];
        if (!page) continue;
        const { width: pw, height: ph } = page.getSize();
        const scaleX = pw / canvasW;
        const scaleY = ph / canvasH;

        for (const ann of anns) {
          const r = parseInt(ann.color.slice(1, 3), 16) / 255;
          const g = parseInt(ann.color.slice(3, 5), 16) / 255;
          const b = parseInt(ann.color.slice(5, 7), 16) / 255;
          const pdfColor = rgb(r, g, b);

          const x = ann.x * scaleX;
          const yTop = ann.y * scaleY;
          const w = (ann.width || 0) * scaleX;
          const h = (ann.height || 0) * scaleY;
          const sz = ann.size || 3;

          if (ann.type === 'text' && ann.text) {
            page.drawText(ann.text, {
              x,
              y: ph - yTop - (ann.fontSize || 16) * scaleY,
              size: (ann.fontSize || 16) * scaleY,
              font,
              color: pdfColor,
            });
          } else if (ann.type === 'rect') {
            page.drawRectangle({
              x: w < 0 ? x + w : x, y: ph - yTop - (h < 0 ? 0 : Math.abs(h)),
              width: Math.abs(w), height: Math.abs(h),
              borderColor: pdfColor, borderWidth: sz,
            });
          } else if (ann.type === 'circle') {
            page.drawEllipse({
              x: x + w / 2, y: ph - yTop - h / 2,
              xScale: Math.abs(w) / 2, yScale: Math.abs(h) / 2,
              borderColor: pdfColor, borderWidth: sz,
            });
          } else if (ann.type === 'line') {
            page.drawLine({
              start: { x, y: ph - yTop },
              end: { x: x + w, y: ph - yTop - h },
              thickness: sz, color: pdfColor,
            });
          } else if (ann.type === 'highlight') {
            page.drawRectangle({
              x: w < 0 ? x + w : x, y: ph - yTop - (h < 0 ? 0 : Math.abs(h)),
              width: Math.abs(w), height: Math.abs(h),
              color: pdfColor, opacity: 0.35,
            });
          } else if (ann.type === 'freehand' && ann.points && ann.points.length > 1) {
            for (let i = 1; i < ann.points.length; i++) {
              const p1 = ann.points[i - 1], p2 = ann.points[i];
              page.drawLine({
                start: { x: p1.x * scaleX, y: ph - p1.y * scaleY },
                end: { x: p2.x * scaleX, y: ph - p2.y * scaleY },
                thickness: sz, color: pdfColor,
              });
            }
          }
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `edited-${pdfFile.name}`);
    } catch (err: any) {
      setError('Failed to save. ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setAnnotations({});
    setError('');
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedTextId(null);
    setEditingTextId(null);
    setTool('select');
    pdfDocRef.current = null;
  };

  /* ============ TOOLS ============ */
  const tools: { id: ToolId; icon: any; label: string }[] = [
    { id: 'select',    icon: MousePointer2, label: 'Select' },
    { id: 'text',      icon: Type,          label: 'Text' },
    { id: 'rect',      icon: Square,        label: 'Rectangle' },
    { id: 'circle',    icon: Circle,        label: 'Circle' },
    { id: 'line',      icon: Minus,         label: 'Line' },
    { id: 'highlight', icon: Highlighter,   label: 'Highlight' },
    { id: 'pen',       icon: Pencil,        label: 'Pen' },
    { id: 'eraser',    icon: Eraser,        label: 'Eraser' },
  ];

  const getCursor = () => {
    if (tool === 'pen') return penCursor(penSize, color);
    if (tool === 'eraser') return eraserCursor(eraserSize);
    if (tool === 'select') return 'default';
    return 'crosshair';
  };

  return (
    <ToolPage
      title="PDF Editor"
      description="Add text, shapes, highlights, and drawings to your PDF."
      icon={<FileEdit className="w-8 h-8 text-violet-500" />}
      color="violet"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<FileEdit className="w-8 h-8 text-violet-500" />}
        />
      ) : (
        <div>

          {/* ============ TOOLBAR ============ */}
          <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-[#1f2333] border border-white/10 rounded-xl sticky top-16 z-40 backdrop-blur-xl">

            {/* Tools */}
            <div className="flex gap-1 border-r border-white/10 pr-2">
              {tools.map((t) => {
                const Icon = t.icon;
                const active = tool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (t.id === 'text') {
                        createTextBox();
                      } else {
                        setTool(t.id);
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                    title={t.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Color */}
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-2">
              {QUICK_COLORS.map((c) => {
                const isActive = color.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                    className={`rounded-full transition-all hover:scale-125 ${
                      isActive
                        ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-[#1f2333]'
                        : 'ring-1 ring-white/20'
                    }`}
                    style={{
                      width: 20, height: 20, background: c.value,
                      border: c.value === '#000000' ? '1px solid rgba(255,255,255,0.3)' : 'none',
                    }}
                  />
                );
              })}
              <span className="w-px h-4 bg-white/10 mx-0.5" />
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
                    border: '1px solid #1f2333',
                  }}
                />
              </div>
            </div>

            {/* Pen sizes */}
            {tool === 'pen' && (
              <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                <Pencil className="w-3.5 h-3.5 text-red-300 mr-1" />
                {PEN_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setPenSize(s.value)}
                    title={`${s.label} — ${s.value}px`}
                    className={`flex items-center justify-center rounded-md transition-all ${
                      penSize === s.value
                        ? 'bg-red-500/30 border border-red-400 text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                    style={{ width: 32, height: 32 }}
                  >
                    <span
                      className="rounded-full"
                      style={{
                        width: Math.max(3, Math.min(s.value, 20)),
                        height: Math.max(3, Math.min(s.value, 20)),
                        background: penSize === s.value ? '#fff' : '#9ca3af',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Eraser sizes */}
            {tool === 'eraser' && (
              <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                <Eraser className="w-3.5 h-3.5 text-red-300 mr-1" />
                {ERASER_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setEraserSize(s.value)}
                    title={`${s.label} — ${s.value}px`}
                    className={`flex items-center justify-center rounded-md transition-all ${
                      eraserSize === s.value
                        ? 'bg-red-500/30 border border-red-400 text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                    style={{ width: 32, height: 32 }}
                  >
                    <span
                      className="rounded-full border-2"
                      style={{
                        width: Math.max(6, Math.min(s.value, 22)),
                        height: Math.max(6, Math.min(s.value, 22)),
                        borderColor: eraserSize === s.value ? '#fff' : '#9ca3af',
                        background: 'transparent',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Shape stroke sizes */}
            {(tool === 'rect' || tool === 'circle' || tool === 'line') && (
              <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                {[1, 2, 3, 5, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setStrokeSize(n)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                      strokeSize === n
                        ? 'bg-red-500/30 border border-red-400 text-white'
                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                    title={`${n}px`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            {/* Zoom */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 self-center min-w-[38px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Undo/Redo/Clear */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2">
              <button
                onClick={undo}
                disabled={historyIndex < 0}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
              <button
                onClick={clearPage}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                title="Clear this page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Page nav */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-300 self-center px-2">
                {currentPage} / {pdfFile.pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pdfFile.pageCount, p + 1))}
                disabled={currentPage === pdfFile.pageCount}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ============ CANVAS AREA ============ */}
          <div
            className="overflow-auto border border-white/10 rounded-2xl bg-[#0f1117] flex justify-center"
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            <div className="relative my-6" style={{ lineHeight: 0 }}>
              <canvas
                ref={canvasRef}
                className="block rounded-lg shadow-2xl shadow-black/50 bg-white"
                style={{ position: 'relative', zIndex: 1 }}
              />
              <canvas
                ref={overlayRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="absolute top-0 left-0"
                style={{
                  cursor: getCursor(),
                  zIndex: 2,
                  pointerEvents: 'auto',
                }}
              />

              {/* ============ TEXT BOX OVERLAY ============ */}
              {(annotations[currentPage] || [])
                .filter((a) => a.type === 'text')
                .map((ann) => {
                  const fs = ann.fontSize || 16;
                  const rot = ann.rotation || 0;
                  const boxW = ann.width || 200;
                  const boxH = ann.height || 60;
                  const isSelected = selectedTextId === ann.id;
                  const isEditing = editingTextId === ann.id;

                  const handles = [
                    { id: 'nw', x: 0,   y: 0,   cursor: 'nwse-resize' },
                    { id: 'n',  x: 0.5, y: 0,   cursor: 'ns-resize'   },
                    { id: 'ne', x: 1,   y: 0,   cursor: 'nesw-resize' },
                    { id: 'e',  x: 1,   y: 0.5, cursor: 'ew-resize'   },
                    { id: 'se', x: 1,   y: 1,   cursor: 'nwse-resize' },
                    { id: 's',  x: 0.5, y: 1,   cursor: 'ns-resize'   },
                    { id: 'sw', x: 0,   y: 1,   cursor: 'nesw-resize' },
                    { id: 'w',  x: 0,   y: 0.5, cursor: 'ew-resize'   },
                  ];

                  return (
                    <div
                      key={ann.id}
                      style={{
                        position: 'absolute',
                        left: ann.x,
                        top: ann.y,
                        width: boxW,
                        height: boxH,
                        transform: `rotate(${rot}deg)`,
                        transformOrigin: 'center center',
                        zIndex: isSelected ? 30 : 1,
                      }}
                      onMouseDown={(e) => {
                        if (isEditing) return;
                        e.stopPropagation();
                        setSelectedTextId(ann.id);
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          cursor: isEditing ? 'text' : 'move',
                          border: isSelected ? '1.5px dashed #ef4444' : '1px dashed transparent',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 10px',
                          overflow: 'hidden',
                          background: isSelected ? 'rgba(239,68,68,0.03)' : 'transparent',
                        }}
                        onMouseDown={(e) => {
                          if (isEditing) return;
                          e.stopPropagation();
                          const pos = getPos(e as any);
                          setDraggingTextId(ann.id);
                          setDragOffset({ x: pos.x - ann.x, y: pos.y - ann.y });
                          setSelectedTextId(ann.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingTextId(ann.id);
                          setEditingValue(ann.text || '');
                        }}
                      >
                        {isEditing ? (
                          <textarea
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => {
                              const next = {
                                ...annotations,
                                [currentPage]: (annotations[currentPage] || []).map((a) =>
                                  a.id === ann.id ? { ...a, text: editingValue } : a
                                ),
                              };
                              setAnnotations(next);
                              pushHistory(next);
                              setEditingTextId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingTextId(null);
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              fontSize: fs,
                              color: ann.color,
                              background: 'rgba(255,255,255,0.95)',
                              border: 'none',
                              outline: 'none',
                              padding: 4,
                              fontFamily: 'Inter, Arial, sans-serif',
                              fontWeight: 500,
                              resize: 'none',
                              borderRadius: 4,
                              lineHeight: 1.3,
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: fs,
                              color: ann.color,
                              fontFamily: 'Inter, Arial, sans-serif',
                              fontWeight: 500,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              userSelect: 'none',
                              lineHeight: 1.3,
                              width: '100%',
                            }}
                          >
                            {ann.text || (
                              <span style={{ opacity: 0.4, fontStyle: 'italic' }}>
                                Double-click to type...
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {isSelected && !isEditing && (
                        <>
                          {handles.map((h) => (
                            <div
                              key={h.id}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                const pos = getPos(e as any);
                                setResizeHandle(h.id);
                                setResizeStart({
                                  x: ann.x, y: ann.y,
                                  w: boxW, h: boxH,
                                  pointerX: pos.x, pointerY: pos.y,
                                });
                              }}
                              style={{
                                position: 'absolute',
                                left: `${h.x * 100}%`,
                                top: `${h.y * 100}%`,
                                transform: 'translate(-50%, -50%)',
                                width: 11,
                                height: 11,
                                background: '#ffffff',
                                border: '2px solid #ef4444',
                                borderRadius: 2,
                                cursor: h.cursor,
                                zIndex: 40,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                              }}
                            />
                          ))}

                          <button
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const next = {
                                ...annotations,
                                [currentPage]: (annotations[currentPage] || []).filter((a) => a.id !== ann.id),
                              };
                              setAnnotations(next);
                              pushHistory(next);
                              setSelectedTextId(null);
                            }}
                            style={{
                              position: 'absolute',
                              top: -14, right: -14,
                              width: 22, height: 22, borderRadius: '50%',
                              background: '#ef4444', color: 'white',
                              fontSize: 14, fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', border: '2px solid #1a1d29',
                              zIndex: 45, lineHeight: 1,
                            }}
                            title="Delete"
                          >
                            ×
                          </button>

                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const pos = getPos(e as any);
                              const cx = ann.x + boxW / 2;
                              const cy = ann.y + boxH / 2;
                              const pointerAngle = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI);
                              setRotatingTextId(ann.id);
                              setRotateStart({ rotation: rot, pointerAngle });
                            }}
                            style={{
                              position: 'absolute',
                              top: -32, left: '50%',
                              transform: 'translateX(-50%)',
                              width: 20, height: 20,
                              borderRadius: '50%',
                              background: '#ef4444',
                              border: '2px solid #1a1d29',
                              cursor: 'grab',
                              zIndex: 45,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                            }}
                            title="Drag to rotate"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>

                          <div
                            style={{
                              position: 'absolute',
                              top: -55, left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'rgba(0,0,0,0.9)',
                              color: 'white',
                              fontSize: 10, fontWeight: 600,
                              padding: '2px 8px', borderRadius: 4,
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none',
                              zIndex: 50,
                            }}
                          >
                            {Math.round(rot)}° · {fs}px
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* HINT */}
          <div className="mt-3 p-3 bg-violet-500/10 border border-violet-400/20 rounded-lg text-xs text-violet-200">
            💡 <strong>Tip:</strong>{' '}
            {tool === 'pen' && 'Draw freely — pick a size from the toolbar.'}
            {tool === 'eraser' && 'Drag over annotations to erase them.'}
            {tool === 'select' && 'Click T to add a text box. Drag handles to resize, top handle to rotate, double-click to edit.'}
            {tool !== 'pen' && tool !== 'eraser' && tool !== 'select' && 'Click or drag on the PDF to add.'}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={savePDF}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] disabled:opacity-50 transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Save Edited PDF
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3 border border-white/15 text-gray-300 font-semibold rounded-xl hover:bg-white/5 disabled:opacity-50 transition-colors"
            >
              Reset
            </button>
          </div>

        </div>
      )}
    </ToolPage>
  );
}