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

  const reset = () => {
    setPdfFile(null);
    setPageInput('');
    setError('');
    setSuccess('');
  };

  const activeBtn = 'p-3 rounded-xl border-2 text-sm font-medium bg-blue-100 border-blue-500 text-blue-700';
  const inactiveBtn = 'p-3 rounded-xl border-2 text-sm font-medium border-gray-200 text-gray-600';

  return (
    <ToolPage
      title="Split PDF"
      description="Extract specific pages or split your PDF into multiple files."
      icon={<Scissors className="w-8 h-8 text-orange-600" />}
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<Scissors className="w-8 h-8 text-orange-600" />}
        />
      ) : (
        <div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
            <FileText className="w-10 h-10 text-orange-500" />
            <div>
              <p className="font-medium text-gray-900">{pdfFile.name}</p>
              <p className="text-sm text-gray-500">{pdfFile.pageCount} pages</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Split Mode</label>
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

          {splitMode !== 'every' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {splitMode === 'pages' ? 'Enter page numbers (e.g., 1, 3, 5)' : 'Enter page ranges (e.g., 1-4, 6-8)'}
              </label>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder={splitMode === 'pages' ? '1, 3, 5, 7' : '1-4, 6-8, 10'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-1">Total pages: {pdfFile.pageCount}</p>
            </div>
          )}

          {splitMode === 'every' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
              This will create {pdfFile.pageCount} separate PDF files as a ZIP.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={splitPDF}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? (<><Loader2 className="w-5 h-5 animate-spin" /> Splitting...</>) : (<><Download className="w-5 h-5" /> Split PDF</>)}
            </button>
            <button
              onClick={reset}
              disabled={processing}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </ToolPage>
  );
}