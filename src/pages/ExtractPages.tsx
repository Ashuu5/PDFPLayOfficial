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

  return (
    <ToolPage title="Extract PDF Pages" description="Extract specific pages from your PDF." icon={<FileSearch className="w-8 h-8 text-orange-600" />} color="orange">
      {!pdfFile ? (
        <FileUpload onFilesAccepted={handleFileUpload} multiple={false} title="Drop a PDF file here" subtitle="or click to browse" icon={<FileSearch className="w-8 h-8 text-orange-600" />} />
      ) : (
        <div>
          <div className="p-4 bg-gray-50 rounded-xl mb-6">
            <p className="font-medium text-gray-900">{pdfFile.name}</p>
            <p className="text-sm text-gray-500">{pdfFile.pageCount} pages</p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pages to Extract</label>
            <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder="e.g., 1, 3, 5-8" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Use commas and hyphens. Example: 1, 3, 5-8</p>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="flex gap-3">
            <button onClick={extractPages} disabled={processing} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Extracting...</> : <><Download className="w-5 h-5" /> Extract Pages</>}
            </button>
            <button onClick={() => { setPdfFile(null); setPageInput(''); setError(''); }} disabled={processing} className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">Reset</button>
          </div>
        </div>
      )}
    </ToolPage>
  );
}