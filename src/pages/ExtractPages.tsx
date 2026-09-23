import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import { FileSearch, Download, Loader2 } from 'lucide-react';

export default function ExtractPages() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer; pageCount: number } | null>(null);
  const [pageInput, setPageInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (files: File[]) => {
    setError('');
    const file = files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPdfFile({ name: file.name, arrayBuffer, pageCount: pdf.getPageCount() });
    } catch { setError('Failed to load PDF.'); }
  };

  const parsePages = (input: string, total: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes('-')) {
        const [s, e] = part.split('-').map(x => parseInt(x.trim()));
        if (isNaN(s) || isNaN(e) || s < 1 || e > total || s > e) throw new Error(`Invalid range: "${part}"`);
        for (let i = s; i <= e; i++) pages.push(i - 1);
      } else {
        const p = parseInt(part);
        if (isNaN(p) || p < 1 || p > total) throw new Error(`Invalid page: "${part}"`);
        pages.push(p - 1);
      }
    }
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const extractPages = async () => {
    if (!pdfFile || !pageInput.trim()) { setError('Please enter page numbers.'); return; }
    setProcessing(true); setError('');
    try {
      const pageIndices = parsePages(pageInput, pdfFile.pageCount);
      if (pageIndices.length === 0) { setError('No valid pages.'); setProcessing(false); return; }

      const sourcePdf = await PDFDocument.load(pdfFile.arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      copiedPages.forEach(p => newPdf.addPage(p));

      const bytes = await newPdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      saveAs(blob, `extracted-${pdfFile.name}`);
    } catch (err: any) { setError(err.message); }
    finally { setProcessing(false); }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPageInput('');
    setError('');
  };

  return (
    <ToolPage
      title="Extract PDF Pages"
      description="Extract specific pages from your PDF."
      icon={<FileSearch className="w-8 h-8 text-orange-600" />}
      color="orange"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<FileSearch className="w-8 h-8 text-orange-600" />}
        />
      ) : (
        <div>

          {/* ============ FILE INFO BAR ============ */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#1f2333] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shrink-0">
                <FileSearch className="w-5 h-5 text-orange-400" />
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

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                Change file
              </button>
            </div>
          </div>

          {/* ============ PAGES INPUT ============ */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pages to Extract
            </label>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder="e.g., 1, 3, 5-8"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-400/50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use commas and hyphens. Example: 1, 3, 5-8
            </p>
          </div>

          {/* ============ ERROR ============ */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ============ ACTIONS ============ */}
          <div className="flex gap-3">
            <button
              onClick={extractPages}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Extract Pages</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </ToolPage>
  );
}	