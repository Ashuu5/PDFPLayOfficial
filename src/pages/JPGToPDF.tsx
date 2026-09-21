import { useState, useCallback, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Download, Loader2, Trash2, Plus, Image as ImageIcon,
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical, RefreshCw,
  Check
} from 'lucide-react';

interface ImageFile {
  id: string;
  file: File;
  name: string;
  dataUrl: string;
  bytes: Uint8Array;
  type: string;
  width: number;
  height: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

type PageSizeOption = 'a4' | 'letter' | 'legal' | 'a3' | 'original';
type OrientationOption = 'auto' | 'portrait' | 'landscape';

/* ============ PAGE SIZE DIMENSIONS (points) ============ */
const PAGE_SIZES: Record<Exclude<PageSizeOption, 'original'>, { short: number; long: number }> = {
  a4:     { short: 595.28, long: 841.89 },
  letter: { short: 612,    long: 792    },
  legal:  { short: 612,    long: 1008   },
  a3:     { short: 841.89, long: 1190.55 },
};

const PAGE_SIZE_OPTIONS: { value: PageSizeOption; label: string; sub: string }[] = [
  { value: 'a4',       label: 'A4',       sub: '210×297mm' },
  { value: 'letter',   label: 'Letter',   sub: '8.5×11"'   },
  { value: 'legal',    label: 'Legal',    sub: '8.5×14"'   },
  { value: 'a3',       label: 'A3',       sub: '297×420mm' },
  { value: 'original', label: 'Original', sub: 'Image size' },
];

/* ============ HELPER: Apply flip + rotation via canvas ============ */
async function processImageWithCanvas(
  dataUrl: string,
  rotation: number,
  flipH: boolean,
  flipV: boolean
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const normRotation = ((rotation % 360) + 360) % 360;
      const rad = (normRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));

      const newW = Math.round(img.width * cos + img.height * sin);
      const newH = Math.round(img.width * sin + img.height * cos);

      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, newW, newH);

      ctx.translate(newW / 2, newH / 2);
      ctx.rotate((normRotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        async (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          const buffer = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(buffer),
            width: newW,
            height: newH,
          });
        },
        'image/png',
        1.0
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

export default function JPGToPDF() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageSizeOpen, setPageSizeOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  /* ============ OUTSIDE CLICK CLOSE DROPDOWN ============ */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setPageSizeOpen(false);
      }
    };
    if (pageSizeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pageSizeOpen]);

  /* ============ ADD IMAGES ============ */
  const addImages = useCallback(async (files: File[]) => {
    setError('');
    setSuccess('');
    const newImages: ImageFile[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" is not a valid image file.`);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        const dataUrl = URL.createObjectURL(file);

        const dims = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 0, h: 0 });
          img.src = dataUrl;
        });

        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          dataUrl,
          bytes: new Uint8Array(buffer),
          type: file.type,
          width: dims.w,
          height: dims.h,
          rotation: 0,
          flipH: false,
          flipV: false,
        });
      } catch {
        setError(`Failed to load "${file.name}".`);
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) setSelectedId(newImages[0].id);
  }, []);

  /* ============ ROTATE / FLIP / RESET ============ */
  const applyToSelected = (fn: (img: ImageFile) => ImageFile) => {
    if (!selectedId) return;
    setImages((prev) => prev.map((i) => (i.id === selectedId ? fn(i) : i)));
  };

  const rotateLeft = () => applyToSelected((i) => ({ ...i, rotation: (i.rotation - 90 + 360) % 360 }));
  const rotateRight = () => applyToSelected((i) => ({ ...i, rotation: (i.rotation + 90) % 360 }));
  const flipHorizontal = () => applyToSelected((i) => ({ ...i, flipH: !i.flipH }));
  const flipVertical = () => applyToSelected((i) => ({ ...i, flipV: !i.flipV }));
  const resetImage = () => applyToSelected((i) => ({ ...i, rotation: 0, flipH: false, flipV: false }));

  /* ============ REMOVE ============ */
  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const clearAll = () => {
    setImages([]);
    setSelectedId(null);
    setError('');
    setSuccess('');
  };

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) addImages(Array.from(target.files));
    };
    input.click();
  };

  /* ============ DOWNLOAD PDF ============ */
  const downloadPDF = async () => {
    if (images.length === 0) {
      setError('Please add at least one image.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const pdfDoc = await PDFDocument.create();

      pdfDoc.setTitle('Converted Images');
      pdfDoc.setAuthor('Image to PDF');
      pdfDoc.setCreator('Image to PDF Converter');
      pdfDoc.setProducer('pdf-lib');

      for (const img of images) {
        const processed = await processImageWithCanvas(
          img.dataUrl,
          img.rotation,
          img.flipH,
          img.flipV
        );

        const embedded = await pdfDoc.embedPng(processed.bytes);

        const imgW = processed.width;
        const imgH = processed.height;

        /* ---------- Orientation decide ---------- */
        let useLandscape = false;
        if (orientation === 'landscape') useLandscape = true;
        else if (orientation === 'portrait') useLandscape = false;
        else useLandscape = imgW > imgH;

        /* ---------- Page dimensions ---------- */
        let pageWidth: number;
        let pageHeight: number;

        if (pageSize === 'original') {
          if (useLandscape) {
            pageWidth = Math.max(imgW, imgH);
            pageHeight = Math.min(imgW, imgH);
          } else {
            pageWidth = Math.min(imgW, imgH);
            pageHeight = Math.max(imgW, imgH);
          }
        } else {
          const dims = PAGE_SIZES[pageSize];
          if (useLandscape) {
            pageWidth = dims.long;
            pageHeight = dims.short;
          } else {
            pageWidth = dims.short;
            pageHeight = dims.long;
          }
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        /* ---------- Fit image (contain) ---------- */
        const imgRatio = imgW / imgH;
        const pageRatio = pageWidth / pageHeight;

        let drawWidth: number;
        let drawHeight: number;

        if (imgRatio > pageRatio) {
          drawWidth = pageWidth;
          drawHeight = pageWidth / imgRatio;
        } else {
          drawHeight = pageHeight;
          drawWidth = pageHeight * imgRatio;
        }

        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        page.drawImage(embedded, {
          x, y, width: drawWidth, height: drawHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `images-${Date.now()}.pdf`);
      setSuccess('✅ PDF downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      setError('Failed to create PDF. ' + (err.message || ''));
    } finally {
      setProcessing(false);
    }
  };

  const selectedImage = images.find((i) => i.id === selectedId);

  /* ============ RENDER ============ */
  return (
    <ToolPage
      title="Image to PDF"
      description="Upload images, rotate as you like, download PDF."
      icon={<ImageIcon className="w-8 h-8 text-red-500" />}
      color="red"
    >
      {images.length === 0 ? (
        <FileUpload
          onFilesAccepted={addImages}
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
          title="Drop images here"
          subtitle="JPG, PNG, WEBP supported • Multiple files allowed"
          icon={<ImageIcon className="w-8 h-8 text-red-500" />}
        />
      ) : (
        <div>

          {/* ============ TOP BAR ============ */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 mb-4">

            {/* Count */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <ImageIcon className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">
                {images.length} {images.length === 1 ? 'image' : 'images'}
              </span>
            </div>

            {/* Add more */}
            <button
              onClick={openFilePicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add more
            </button>

            {/* Clear all */}
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/30 text-sm font-semibold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>

            {/* Rotate & Flip group */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={rotateLeft}
                disabled={!selectedId}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-300 hover:bg-white/10 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Rotate left 90°"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={rotateRight}
                disabled={!selectedId}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-300 hover:bg-white/10 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Rotate right 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              <button
                onClick={flipHorizontal}
                disabled={!selectedId}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  selectedImage?.flipH
                    ? 'bg-red-500 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-red-400'
                }`}
                title="Flip horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={flipVertical}
                disabled={!selectedId}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  selectedImage?.flipV
                    ? 'bg-red-500 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-red-400'
                }`}
                title="Flip vertical"
              >
                <FlipVertical className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              <button
                onClick={resetImage}
                disabled={!selectedId}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-300 hover:bg-white/10 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Reset"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* ✅ CUSTOM Page Size Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setPageSizeOpen(!pageSizeOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 hover:border-white/20 transition-all min-w-[130px]"
              >
                <span className="text-gray-400">Size:</span>
                <span className="flex-1 text-left text-white">
                  {PAGE_SIZE_OPTIONS.find((o) => o.value === pageSize)?.label}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                    pageSizeOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {pageSizeOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] z-50 bg-white border border-gray-200 rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1">
                  {PAGE_SIZE_OPTIONS.map((opt) => {
                    const isSelected = pageSize === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setPageSize(opt.value);
                          setPageSizeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-red-50 text-red-600'
                            : 'text-black hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          {/* ✅ Label — Black (or red if selected) */}
                          <span
                            className={
                              isSelected
                                ? 'text-red-600 font-bold'
                                : 'text-black group-hover:text-white'
                            }
                          >
                            {opt.label}
                          </span>
                          {/* ✅ Subtext — Black (or red if selected) */}
                          <span
                            className={`text-[9px] font-normal ${
                              isSelected ? 'text-red-500' : 'text-black'
                            }`}
                          >
                            {opt.sub}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-red-600" strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Orientation group */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  orientation === 'portrait'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                title="Portrait"
              >
                <svg width="12" height="16" viewBox="0 0 24 30" fill="none">
                  <rect x="1" y="1" width="22" height="28" rx="2" stroke="currentColor" strokeWidth="2" />
                </svg>
                Portrait
              </button>

              <button
                onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  orientation === 'landscape'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                title="Landscape"
              >
                <svg width="16" height="12" viewBox="0 0 30 24" fill="none">
                  <rect x="1" y="1" width="28" height="22" rx="2" stroke="currentColor" strokeWidth="2" />
                </svg>
                Landscape
              </button>

              <button
                onClick={() => setOrientation('auto')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  orientation === 'auto'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                title="Auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Auto
              </button>
            </div>

            {/* Download */}
            <button
              onClick={downloadPDF}
              disabled={processing}
              className="ml-auto flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm rounded-lg shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download PDF
                </>
              )}
            </button>
          </div>

          {/* ============ INFO ============ */}
          <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-400/20 text-xs text-blue-200">
            💡 <strong className="text-blue-300">Tip:</strong> Click on any image to select it,
            then use the rotate/flip buttons above. Adjust page size and orientation from the top bar.
          </div>

          {/* ============ IMAGE GRID ============ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => {
              const isSelected = selectedId === img.id;
              return (
                <div key={img.id} className="relative">
                  <div
                    onClick={() => setSelectedId(img.id)}
                    className={`relative group bg-white/[0.03] rounded-lg border-2 shadow-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-500 ring-2 ring-red-500/30'
                        : 'border-white/10 hover:border-red-400/40'
                    }`}
                  >
                    {/* Image */}
                    <div className="aspect-[3/4] bg-[#1f2333] flex items-center justify-center overflow-hidden rounded-t-lg relative">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                        style={{
                          transform: `rotate(${img.rotation}deg) scaleX(${img.flipH ? -1 : 1}) scaleY(${img.flipV ? -1 : 1})`,
                        }}
                        draggable={false}
                      />
                    </div>

                    {/* File name */}
                    <div className="p-2 border-t border-white/5">
                      <p className="text-[11px] text-gray-400 truncate text-center" title={img.name}>
                        {img.name}
                      </p>
                      {(img.rotation !== 0 || img.flipH || img.flipV) && (
                        <p className="text-[9px] text-red-400 text-center mt-0.5 font-semibold">
                          {img.rotation !== 0 && `${img.rotation}°`}
                          {img.flipH && ' ⇄'}
                          {img.flipV && ' ⇅'}
                        </p>
                      )}
                    </div>

                    {/* Order badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold flex items-center justify-center shadow-md z-20">
                      {index + 1}
                    </div>

                    {/* Delete button — red trash icon */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-300 hover:scale-110 transition-all drop-shadow-lg z-20"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add more tile */}
            <button
              onClick={openFilePicker}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-white/15 hover:border-red-400/50 hover:bg-red-500/[0.04] flex flex-col items-center justify-center gap-2 transition-all text-gray-500 hover:text-red-300"
            >
              <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold">Add images</span>
            </button>
          </div>

          {/* ============ ERROR / SUCCESS ============ */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg text-sm text-green-300 font-semibold">
              {success}
            </div>
          )}

        </div>
      )}
    </ToolPage>
  );
}