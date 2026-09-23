import { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  Merge, ChevronUp, ChevronDown, Download, Plus,
  Loader2, GripVertical, FileText, Trash2
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  arrayBuffer: ArrayBuffer;
  thumbnail: string;
}

export default function MergePDF() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [loadingThumbs, setLoadingThumbs] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
    dragOverItem.current = index;
  };

  const handleDragLeave = () => {};

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
    finishDrag();
  };

  const handleDragEnd = () => {
    finishDrag();
  };

  const finishDrag = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;

    if (from !== null && to !== null && from !== to) {
      setFiles((prev) => {
        const copy = [...prev];
        const [dragged] = copy.splice(from, 1);
        copy.splice(to, 0, dragged);
        return copy;
      });
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const generateThumbnail = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch {
      return '';
    }
  };

  const addFiles = useCallback(async (newFiles: File[]) => {
    setError('');
    setLoadingThumbs(true);
    const pdfFiles: PDFFile[] = [];

    for (const file of newFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();
        const thumbnail = await generateThumbnail(arrayBuffer);

        pdfFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          pageCount,
          arrayBuffer,
          thumbnail,
        });
      } catch (err) {
        setError(`Failed to load "${file.name}". It may be corrupted or not a valid PDF.`);
      }
    }

    setFiles((prev) => [...prev, ...pdfFiles]);
    setLoadingThumbs(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFiles.length) return prev;
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      return newFiles;
    });
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setProcessing(true);
    setError('');
    setProgress('Creating merged PDF...');

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setProgress(`Processing file ${i + 1} of ${files.length}...`);
        const pdf = await PDFDocument.load(files[i].arrayBuffer, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      setProgress('Generating final PDF...');
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, 'merged.pdf');

      setProgress('Done! Your merged PDF has been downloaded.');
      setTimeout(() => setProgress(''), 3000);
    } catch (err) {
      setError('Failed to merge PDFs. Please try again or check your files.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setError('');
    setProgress('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) addFiles(Array.from(target.files));
    };
    input.click();
  };

  return (
    <ToolPage
      title="Merge PDF"
      description="Combine multiple PDF files into a single document. Drag to reorder files."
      icon={<Merge className="w-8 h-8 text-red-600" />}
      color="red"
    >
      {files.length === 0 ? (
        <FileUpload
          onFilesAccepted={addFiles}
          title="Drop PDF files here"
          subtitle="or click to browse • Add multiple files"
          icon={<Merge className="w-8 h-8 text-red-600" />}
        />
      ) : (
        <div>

          {/* ============ FILE LIST ============ */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">
                {files.length} {files.length === 1 ? 'file' : 'files'} •{' '}
                {totalPages} total {totalPages === 1 ? 'page' : 'pages'}
                {loadingThumbs && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (loading previews...)
                  </span>
                )}
              </h3>
              <button
                onClick={openFilePicker}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Add more files
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {files.map((file, index) => {
                const isDragging = draggingIndex === index;
                const isDragOver = dragOverIndex === index && draggingIndex !== index;

                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative bg-[#1f2333] rounded-2xl border overflow-hidden transition-all select-none ${
                      isDragging
                        ? 'border-red-400 opacity-30 scale-95 cursor-grabbing'
                        : isDragOver
                        ? 'border-red-400 ring-2 ring-red-400/40 scale-[1.02] cursor-grabbing'
                        : 'border-white/10 hover:border-red-400/40 hover:shadow-lg hover:shadow-red-500/15 hover:-translate-y-0.5 cursor-grab'
                    }`}
                  >

                    {/* Drag handle */}
                    <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-sm rounded-md p-1 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <GripVertical className="w-3.5 h-3.5 text-white/80" />
                    </div>

                    {/* Order badge */}
                    <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/40 pointer-events-none">
                      {index + 1}
                    </div>

                    {/* ✅ Dark black trash icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="absolute top-2 right-10 z-30 w-6 h-6 flex items-center justify-center text-black hover:text-red-500 hover:scale-110 transition-all drop-shadow-lg"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    </button>

                    {/* PDF Preview */}
                    <div className="aspect-[3/4] bg-white/[0.03] flex items-center justify-center border-b border-white/5 overflow-hidden">
                      {file.thumbnail ? (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-full h-full object-contain bg-white"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-20 h-24 bg-white rounded-md shadow-lg flex flex-col items-center justify-center gap-1 relative">
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <FileText className="w-2.5 h-2.5 text-white" />
                          </div>
                          <div className="w-12 h-1 bg-gray-200 rounded-full mt-1"></div>
                          <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                          <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
                          <div className="w-8 h-1 bg-gray-200 rounded-full self-start ml-4"></div>
                          <div className="w-12 h-1 bg-gray-200 rounded-full mt-1"></div>
                          <div className="w-10 h-1 bg-gray-200 rounded-full self-start ml-4"></div>
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="p-3 pointer-events-none">
                      <p className="text-xs text-gray-200 truncate font-medium" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {formatSize(file.size)} • {file.pageCount}{' '}
                        {file.pageCount === 1 ? 'page' : 'pages'}
                      </p>
                    </div>

                    {/* Move arrows */}
                    <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFile(index, 'up');
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={index === 0}
                        className="w-5 h-5 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFile(index, 'down');
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={index === files.length - 1}
                        className="w-5 h-5 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                  </div>
                );
              })}

              {/* Add more tile */}
              <button
                onClick={openFilePicker}
                className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/15 hover:border-red-400/50 hover:bg-red-500/[0.04] flex flex-col items-center justify-center gap-2 transition-all text-gray-400 hover:text-red-300"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Add more</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              💡 Drag cards to reorder · Click 🗑️ to remove
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-200 flex items-center gap-2">
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              {progress}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={mergePDFs}
              disabled={processing || files.length < 2}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
                processing || files.length < 2
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01]'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Merging...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Merge PDF
                </>
              )}
            </button>

            <button
              onClick={reset}
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