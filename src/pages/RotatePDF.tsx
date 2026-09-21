import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  RotateCw, RotateCcw, Download, Loader2, RefreshCw,
  Check, X
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PageState {
  index: number;
  rotation: number;    // 0, 90, 180, 270
  thumbnail: string;   // data URL
}

export default function RotatePDF() {
  const [pdfFile, setPdfFile] = useState<{
    name: string;
    arrayBuffer: ArrayBuffer;
    pageCount: number;
  } | null>(null);

  const [pages, setPages] = useState<PageState[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customAngle, setCustomAngle] = useState(90);

  const pdfDocRef = useRef<any>(null);

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

      // Load PDF.js for thumbnails
      const pdfjs = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      pdfDocRef.current = pdfjs;

      // Generate thumbnails for each page
      const pagesData: PageState[] = [];
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdfjs.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        pagesData.push({
          index: i - 1,
          rotation: 0,
          thumbnail: canvas.toDataURL('image/png'),
        });
      }
      setPages(pagesData);
      setSelectedPages(new Set());
    } catch (err: any) {
      setError('Failed to load PDF. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============ ROTATE PAGE ============ */
  const rotatePage = (index: number, delta: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.index === index
          ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 }
          : p
      )
    );
  };

  /* ============ ROTATE ALL / SELECTED ============ */
  const rotateAll = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: ((p.rotation + delta) % 360 + 360) % 360,
      }))
    );
  };

  const rotateSelected = (delta: number) => {
    if (selectedPages.size === 0) return;
    setPages((prev) =>
      prev.map((p) =>
        selectedPages.has(p.index)
          ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 }
          : p
      )
    );
  };

  /* ============ RESET ALL ROTATIONS ============ */
  const resetAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  /* ============ TOGGLE SELECT ============ */
  const toggleSelect = (index: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPages(new Set(pages.map((p) => p.index)));
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  /* ============ SAVE ============ */
  const savePDF = async () => {
    if (!pdfFile || pages.length === 0) return;
    setProcessing(true);
    setError('');
    try {
      const pdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
      const pdfPages = pdf.getPages();

      pages.forEach((pageState) => {
        if (pageState.rotation !== 0) {
          const page = pdfPages[pageState.index];
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees(currentRotation + pageState.rotation));
        }
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `rotated-${pdfFile.name}`);
    } catch (err: any) {
      setError('Failed to save. ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPages([]);
    setSelectedPages(new Set());
    setError('');
    pdfDocRef.current = null;
  };

  return (
    <ToolPage
      title="Rotate PDF"
      description="Rotate all or selected pages of your PDF. Live preview below."
      icon={<RotateCw className="w-8 h-8 text-lime-500" />}
      color="lime"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<RotateCw className="w-8 h-8 text-lime-500" />}
        />
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-lime-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading pages...</p>
          </div>
        </div>
      ) : (
        <div>

          {/* ============ FILE INFO BAR ============ */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#1f2333] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-lime-500/20 border border-lime-400/40 flex items-center justify-center shrink-0">
                <RotateCw className="w-5 h-5 text-lime-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={pdfFile.name}>
                  {pdfFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'}
                  {selectedPages.size > 0 && ` · ${selectedPages.size} selected`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedPages.size > 0 && (
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
                >
                  Clear selection
                </button>
              )}
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                Change file
              </button>
            </div>
          </div>

          {/* ============ ROTATION CONTROLS ============ */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#1f2333] border border-white/10 mb-4 sticky top-16 z-30 backdrop-blur-xl">

            {/* Left rotate */}
            <button
              onClick={() => selectedPages.size > 0 ? rotateSelected(-90) : rotateAll(-90)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-lime-500/15 hover:border-lime-400/40 hover:text-lime-300 transition-all"
              title="Rotate 90° counter-clockwise"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-semibold">90° CCW</span>
            </button>

            {/* Right rotate */}
            <button
              onClick={() => selectedPages.size > 0 ? rotateSelected(90) : rotateAll(90)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-lime-500/15 hover:border-lime-400/40 hover:text-lime-300 transition-all"
              title="Rotate 90° clockwise"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-sm font-semibold">90° CW</span>
            </button>

            {/* 180 */}
            <button
              onClick={() => selectedPages.size > 0 ? rotateSelected(180) : rotateAll(180)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-lime-500/15 hover:border-lime-400/40 hover:text-lime-300 transition-all"
              title="Rotate 180°"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-semibold">180°</span>
            </button>

            <span className="w-px h-6 bg-white/10" />

            {/* Custom angle */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customAngle}
                onChange={(e) => setCustomAngle(parseInt(e.target.value) || 0)}
                min={-360}
                max={360}
                className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-lime-400/50"
                title="Custom angle"
              />
              <span className="text-xs text-gray-500">°</span>
              <button
                onClick={() => selectedPages.size > 0 ? rotateSelected(customAngle) : rotateAll(customAngle)}
                className="px-3 py-2 rounded-lg bg-lime-500/20 border border-lime-400/40 text-lime-300 hover:bg-lime-500/30 text-sm font-semibold transition-all"
              >
                Apply
              </button>
            </div>

            <span className="w-px h-6 bg-white/10" />

            {/* Reset */}
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
              title="Reset all rotations"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Reset</span>
            </button>

            {/* Select all toggle */}
            <button
              onClick={selectedPages.size === pages.length ? deselectAll : selectAll}
              className="ml-auto flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-all text-sm"
            >
              <Check className="w-4 h-4" />
              <span className="font-semibold">
                {selectedPages.size === pages.length ? 'Deselect all' : 'Select all'}
              </span>
            </button>
          </div>

          {/* ============ HINT ============ */}
          <div className="mb-4 p-3 rounded-lg bg-lime-500/10 border border-lime-400/20 text-xs text-lime-200">
            💡 <strong>Tip:</strong> Click a page to select it · Then use rotation buttons to rotate only selected
            · Or leave unselected to rotate all pages.
          </div>

          {/* ============ PAGES GRID ============ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pages.map((p) => {
              const isSelected = selectedPages.has(p.index);
              const isRotated = p.rotation !== 0;
              return (
                <div
                  key={p.index}
                  onClick={() => toggleSelect(p.index)}
                  className={`group relative cursor-pointer rounded-xl border overflow-hidden transition-all ${
                    isSelected
                      ? 'border-lime-400 ring-2 ring-lime-400/30'
                      : isRotated
                      ? 'border-lime-400/40 hover:border-lime-400/60'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[3/4] bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={p.thumbnail}
                      alt={`Page ${p.index + 1}`}
                      className="max-w-full max-h-full transition-transform duration-300"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      draggable={false}
                    />
                  </div>

                  {/* Page number */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold">
                    {p.index + 1}
                  </div>

                  {/* Rotation badge */}
                  {isRotated && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-lime-500 text-black text-[10px] font-bold">
                      {p.rotation}°
                    </div>
                  )}

                  {/* Selection check */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-lime-500 flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3 text-black" strokeWidth={3} />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="p-2 bg-[#151822] border-t border-white/5">
                    <p className="text-[10px] text-gray-400 text-center font-medium">
                      Page {p.index + 1}
                    </p>
                  </div>

                  {/* Hover overlay quick-rotate buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotatePage(p.index, -90);
                      }}
                      className="w-9 h-9 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg hover:bg-lime-400 transition-colors"
                      title="Rotate 90° CCW"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rotatePage(p.index, 90);
                      }}
                      className="w-9 h-9 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg hover:bg-lime-400 transition-colors"
                      title="Rotate 90° CW"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ============ ERROR ============ */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ============ ACTIONS ============ */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={savePDF}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-500 to-green-600 text-black font-semibold rounded-xl shadow-lg shadow-lime-500/30 hover:shadow-xl hover:shadow-lime-500/50 hover:scale-[1.01] disabled:opacity-50 transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Save Rotated PDF
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