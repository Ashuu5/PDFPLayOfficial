import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  LayoutGrid, Download, Loader2, Trash2, RotateCw,
  Copy, Undo, Redo, Check, GripVertical, X, Move
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PageInfo {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnail: string;
}

export default function OrganizePDF() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer } | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<PageInfo[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
      setPdfFile({ name: file.name, arrayBuffer });

      const pdfjs = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const pageInfos: PageInfo[] = [];

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdfjs.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;

        pageInfos.push({
          id: crypto.randomUUID(),
          originalIndex: i - 1,
          rotation: 0,
          thumbnail: canvas.toDataURL('image/png'),
        });
      }

      setPages(pageInfos);
      setHistory([JSON.parse(JSON.stringify(pageInfos))]);
      setHistoryIndex(0);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError('Failed to load PDF. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============ HISTORY ============ */
  const pushHistory = (newPages: PageInfo[]) => {
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(JSON.parse(JSON.stringify(newPages)));
    setHistory(trimmed);
    setHistoryIndex(trimmed.length - 1);
  };

  const updatePages = (updater: (prev: PageInfo[]) => PageInfo[]) => {
    setPages((prev) => {
      const next = updater(prev);
      pushHistory(next);
      return next;
    });
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const idx = historyIndex - 1;
    setHistoryIndex(idx);
    setPages(JSON.parse(JSON.stringify(history[idx])));
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const idx = historyIndex + 1;
    setHistoryIndex(idx);
    setPages(JSON.parse(JSON.stringify(history[idx])));
  };

  /* ============ ACTIONS ============ */
  const deletePage = (id: string) => {
    updatePages((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const rotatePage = (id: string) => {
    updatePages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const duplicatePage = (id: string) => {
    updatePages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const arr = [...prev];
      arr.splice(idx + 1, 0, {
        ...arr[idx],
        id: crypto.randomUUID(),
      });
      return arr;
    });
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    updatePages((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  };

  const rotateSelected = () => {
    if (selectedIds.size === 0) return;
    updatePages((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id) ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(pages.map((p) => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  /* ============ DRAG & DROP ============ */
  const handleDragStart = (index: number, id: string) => {
    dragIndex.current = index;
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent, index: number, id: string) => {
    e.preventDefault();
    dragOverIndex.current = index;
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleDragEnd = () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from !== null && to !== null && from !== to) {
      updatePages((prev) => {
        const arr = [...prev];
        const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
        return arr;
      });
    }
    dragIndex.current = null;
    dragOverIndex.current = null;
    setDraggingId(null);
    setDragOverId(null);
  };

  /* ============ SAVE ============ */
  const savePDF = async () => {
    if (!pdfFile || pages.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const sourcePdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      for (const page of pages) {
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [page.originalIndex]);
        if (page.rotation > 0) {
          copiedPage.setRotation(degrees(page.rotation));
        }
        newPdf.addPage(copiedPage);
      }

      const bytes = await newPdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `organized-${pdfFile.name}`);
    } catch (err: any) {
      setError('Failed to save PDF. ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPages([]);
    setSelectedIds(new Set());
    setError('');
    setHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <ToolPage
      title="Organize PDF"
      description="Reorder, rotate, duplicate, or delete pages with live preview."
      icon={<LayoutGrid className="w-8 h-8 text-rose-500" />}
      color="rose"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<LayoutGrid className="w-8 h-8 text-rose-500" />}
        />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-rose-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading pages...</p>
          </div>
        </div>
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-gray-200 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-300 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-5 h-5 text-rose-500" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate" title={pdfFile.name}>
                  {pdfFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                  {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Undo / Redo */}
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded transition-colors"
              >
                Change file
              </button>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white border border-gray-200 mb-4 sticky top-16 z-30 backdrop-blur-xl">

            {/* Selection info */}
            <div className="flex items-center gap-2 min-w-[100px]">
              <span className="text-sm font-semibold text-gray-700">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'No selection'}
              </span>
            </div>

            <span className="w-px h-6 bg-gray-200" />

            {/* Selection actions */}
            {selectedIds.size > 0 ? (
              <>
                <button
                  onClick={rotateSelected}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 text-sm font-semibold transition-colors"
                  title="Rotate selected"
                >
                  <RotateCw className="w-4 h-4" />
                  Rotate
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 text-sm font-semibold transition-colors"
                  title="Delete selected"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={deselectAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </>
            ) : (
              <button
                onClick={selectAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
              >
                <Check className="w-4 h-4" />
                Select All
              </button>
            )}

            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <GripVertical className="w-3.5 h-3.5" />
              Drag pages to reorder
            </div>
          </div>

          {/* HINT */}
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            💡 <strong>Tip:</strong> Click a page to select · Drag to reorder · Hover for quick actions
            (rotate, duplicate, delete)
          </div>

          {/* PAGES GRID */}
          {pages.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-500">All pages deleted.</p>
              <button
                onClick={undo}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-semibold transition-colors"
              >
                Undo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {pages.map((page, index) => {
                const isSelected = selectedIds.has(page.id);
                const isDragging = draggingId === page.id;
                const isDragOver = dragOverId === page.id && draggingId !== page.id;
                const isRotated = page.rotation !== 0;

                return (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={() => handleDragStart(index, page.id)}
                    onDragOver={(e) => handleDragOver(e, index, page.id)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) return;
                      toggleSelect(page.id);
                    }}
                    className={`group relative cursor-grab active:cursor-grabbing rounded-xl border-2 overflow-hidden transition-all ${
                      isDragging
                        ? 'opacity-40 scale-95 border-rose-400'
                        : isDragOver
                        ? 'border-rose-400 ring-2 ring-rose-400/30 scale-105'
                        : isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/30'
                        : 'border-gray-200 hover:border-rose-300 hover:shadow-lg'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[3/4] bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={page.thumbnail}
                        alt={`Page ${index + 1}`}
                        className="max-w-full max-h-full transition-transform duration-300"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                        draggable={false}
                      />

                      {/* Page number badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold">
                        {index + 1}
                      </div>

                      {/* Rotation badge */}
                      {isRotated && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">
                          {page.rotation}°
                        </div>
                      )}

                      {/* Selection check */}
                      {isSelected && (
                        <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}

                      {/* Hover overlay — quick actions */}
                      <div
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none group-hover:pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); rotatePage(page.id); }}
                          className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg hover:bg-rose-400 hover:text-white transition-colors"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicatePage(page.id); }}
                          className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg hover:bg-blue-400 hover:text-white transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                          className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-2 bg-white border-t border-gray-100 flex items-center justify-between">
                      <p className="text-[10px] text-gray-500 font-medium">
                        Page {index + 1}
                      </p>
                      <Move className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={savePDF}
              disabled={processing || pages.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-base rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Save Organized PDF
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all"
            >
              Reset
            </button>
          </div>

        </div>
      )}
    </ToolPage>
  );
}