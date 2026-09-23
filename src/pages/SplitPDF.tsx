import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import { saveAs } from 'file-saver';
// @ts-ignore
import JSZip from 'jszip';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import { Scissors, Download, Loader2, FileText } from 'lucide-react';

export default function SplitPDF() {
  const [pdfFile, setPdfFile] = useState(null as any);
  const [splitMode, setSplitMode] = useState('pages');
  const [pageInput, setPageInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = async (files: File[]) => {
    setError('');
    setSuccess('');
    const file = files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPdfFile({
        name: file.name,
        size: file.size,
        pageCount: pdfDoc.getPageCount(),
        arrayBuffer,
      });
    } catch {
      setError('Failed to load PDF.');
    }
  };

  /* ✅ CHANGE FILE */
  const openChangeFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,.pdf';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileUpload(Array.from(target.files));
      }
    };
    input.click();
  };

  const parsePageInput = (input: string, totalPages: number): number[][] => {
    const ranges: number[][] = [];
    const parts = input.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          throw new Error('Invalid range: ' + part);
        }
        const pages: number[] = [];
        for (let i = start; i <= end; i++) pages.push(i - 1);
        ranges.push(pages);
      } else {
        const page = parseInt(part);
        if (isNaN(page) || page < 1 || page > totalPages) {
          throw new Error('Invalid page: ' + part);
        }
        ranges.push([page - 1]);
      }
    }
    return ranges;
  };

  const splitPDF = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const sourcePdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
      let pageGroups: number[][];
      if (splitMode === 'every') {
        pageGroups = Array.from({ length: pdfFile.pageCount }, (_, i) => [i]);
      } else {
        if (!pageInput.trim()) {
          setError('Please enter page numbers.');
          setProcessing(false);
          return;
        }
        pageGroups = parsePageInput(pageInput, pdfFile.pageCount);
      }
      if (pageGroups.length === 0) {
        setError('No valid pages.');
        setProcessing(false);
        return;
      }
      if (pageGroups.length === 1) {
        const newPdf = await PDFDocument.create();
        const pages = await newPdf.copyPages(sourcePdf, pageGroups[0]);
        pages.forEach(page => newPdf.addPage(page));
        const bytes = await newPdf.save();
        const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
        saveAs(blob, 'split-pages.pdf');
        setSuccess('PDF split successfully!');
      } else {
        const zip = new JSZip();
        for (let i = 0; i < pageGroups.length; i++) {
          const newPdf = await PDFDocument.create();
          const pages = await newPdf.copyPages(sourcePdf, pageGroups[i]);
          pages.forEach(page => newPdf.addPage(page));
          const bytes = await newPdf.save();
          zip.file('page-' + (i + 1) + '.pdf', bytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'split-pages.zip');
        setSuccess(pageGroups.length + ' PDF files created!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to split PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const activeBtn = 'p-3 rounded-xl border-2 text-sm font-bold bg-gradient-to-br from-red-500 to-rose-600 border-red-400 text-white shadow-lg shadow-red-500/30 transition-all';
  const inactiveBtn = 'p-3 rounded-xl border-2 text-sm font-medium bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all';

  return (
    <ToolPage
      title="Split PDF"
      description="Extract specific pages or split your PDF into multiple files."
      icon={<Scissors className="w-8 h-8 text-red-500" />}
      color="red"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Scissors className="w-8 h-8 text-red-500" />}
        />
      ) : (
        <div>
          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate">{pdfFile.name}</p>
                <p className="text-xs text-gray-400">
                  {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'} · {((pdfFile.size || 0) / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            {/* ✅ CHANGE FILE BUTTON */}
            <button
              onClick={openChangeFilePicker}
              disabled={processing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Change file
            </button>
          </div>

          {/* SPLIT MODE */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Split Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => setSplitMode('pages')} className={splitMode === 'pages' ? activeBtn : inactiveBtn}>
                Specific Pages
              </button>
              <button onClick={() => setSplitMode('ranges')} className={splitMode === 'ranges' ? activeBtn : inactiveBtn}>
                Page Ranges
              </button>
              <button onClick={() => setSplitMode('every')} className={splitMode === 'every' ? activeBtn : inactiveBtn}>
                Every Page
              </button>
            </div>
          </div>

          {/* PAGE INPUT */}
          {splitMode !== 'every' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {splitMode === 'pages' ? 'Enter page numbers (e.g., 1, 3, 5)' : 'Enter page ranges (e.g., 1-4, 6-8)'}
              </label>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder={splitMode === 'pages' ? '1, 3, 5, 7' : '1-4, 6-8, 10'}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400/50 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Total pages: {pdfFile.pageCount}</p>
            </div>
          )}

          {/* EVERY PAGE INFO */}
          {splitMode === 'every' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-400/20 rounded-xl text-sm text-red-200">
              This will create {pdfFile.pageCount} separate PDF files as a ZIP.
            </div>
          )}

          {/* ERROR / SUCCESS */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg text-sm text-green-300 font-semibold">
              {success}
            </div>
          )}

          {/* ✅ ACTIONS — sirf Split button, Reset hataya */}
          <button
            onClick={splitPDF}
            disabled={processing}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 font-bold rounded-xl transition-all ${
              processing
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01]'
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Splitting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" /> Split PDF
              </>
            )}
          </button>
        </div>
      )}
    </ToolPage>
  );
}