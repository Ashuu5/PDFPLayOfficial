import { useState } from 'react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  FileEdit, Download, Loader2, FileText, CheckCircle,
  AlertCircle, Eye, Table as TableIcon, Info
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Cell {
  text: string;
  x: number;
  width: number;
}

interface Row {
  y: number;
  cells: Cell[];
}

interface Table {
  pageNumber: number;
  rows: Row[];
  columnBoundaries: number[];
}

/* ============================================================
   SMART ROW → CELLS MERGING
   ============================================================ */
function groupCellsInRow(items: TextItem[]): Cell[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.x - b.x);
  const cells: Cell[] = [];

  for (const item of sorted) {
    if (cells.length === 0) {
      cells.push({ text: item.text, x: item.x, width: item.width });
      continue;
    }

    const last = cells[cells.length - 1];
    const gap = item.x - (last.x + last.width);

    if (gap < 4) {
      last.text += item.text;
      last.width = (item.x + item.width) - last.x;
    } else if (gap < 8) {
      last.text += ' ' + item.text;
      last.width = (item.x + item.width) - last.x;
    } else {
      cells.push({ text: item.text, x: item.x, width: item.width });
    }
  }

  return cells;
}

/* ============================================================
   EXTRACT TABLE WITH PROPER ROW + COLUMN DETECTION
   ============================================================ */
async function extractTableFromPage(page: any, pageNumber: number): Promise<Table> {
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  const items: TextItem[] = textContent.items
    .filter((item: any) => item.str && item.str.trim())
    .map((item: any) => {
      const transform = item.transform;
      return {
        text: item.str,
        x: transform[4],
        y: viewport.height - transform[5],
        width: item.width || 0,
        height: item.height || 10,
      };
    });

  if (items.length === 0) {
    return { pageNumber, rows: [], columnBoundaries: [] };
  }

  // 1. GROUP INTO ROWS BY Y
  const sortedByY = [...items].sort((a, b) => a.y - b.y);
  const rowGroups: { y: number; items: TextItem[] }[] = [];

  for (const item of sortedByY) {
    const existing = rowGroups.find((r) => Math.abs(r.y - item.y) <= 3);
    if (existing) {
      existing.items.push(item);
      existing.y = (existing.y + item.y) / 2;
    } else {
      rowGroups.push({ y: item.y, items: [item] });
    }
  }

  // 2. GROUP ITEMS INTO CELLS
  const rows: Row[] = rowGroups.map((group) => ({
    y: group.y,
    cells: groupCellsInRow(group.items),
  }));

  rows.sort((a, b) => a.y - b.y);

  // 3. DETECT COLUMN BOUNDARIES
  const cellStarts: number[] = [];
  for (const row of rows) {
    for (const cell of row.cells) {
      cellStarts.push(cell.x);
    }
  }
  cellStarts.sort((a, b) => a - b);

  const columnBoundaries: number[] = [];
  for (const pos of cellStarts) {
    const existing = columnBoundaries.find((b) => Math.abs(b - pos) <= 15);
    if (existing === undefined) {
      columnBoundaries.push(pos);
    }
  }
  columnBoundaries.sort((a, b) => a - b);

  return { pageNumber, rows, columnBoundaries };
}

/* ============================================================
   CONVERT TABLE TO 2D GRID
   ============================================================ */
function tableToGrid(table: Table): string[][] {
  const { rows, columnBoundaries } = table;
  if (rows.length === 0 || columnBoundaries.length === 0) return [];

  const grid: string[][] = [];

  for (const row of rows) {
    const rowArray: string[] = new Array(columnBoundaries.length).fill('');

    for (const cell of row.cells) {
      let colIndex = 0;
      let closestDist = Infinity;
      for (let i = 0; i < columnBoundaries.length; i++) {
        const dist = Math.abs(columnBoundaries[i] - cell.x);
        if (dist < closestDist) {
          closestDist = dist;
          colIndex = i;
        }
      }

      if (rowArray[colIndex]) {
        rowArray[colIndex] += ' ' + cell.text;
      } else {
        rowArray[colIndex] = cell.text;
      }
    }

    grid.push(rowArray);
  }

  return grid;
}

/* ============================================================
   CSV / TSV BUILDERS
   ============================================================ */
function escapeCsvCell(text: string): string {
  if (text === '') return '';
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(tables: Table[]): string {
  let csv = '';

  tables.forEach((table, tableIdx) => {
    const grid = tableToGrid(table);
    if (grid.length === 0) return;

    if (tables.length > 1) {
      csv += `--- Page ${table.pageNumber} ---\n`;
    }

    const maxCols = Math.max(...grid.map((r) => r.length), 0);

    grid.forEach((row) => {
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');
      csv += padded.map(escapeCsvCell).join(',') + '\n';
    });

    if (tableIdx < tables.length - 1) {
      csv += '\n';
    }
  });

  return csv;
}

function buildTsv(tables: Table[]): string {
  let tsv = '';

  tables.forEach((table, tableIdx) => {
    const grid = tableToGrid(table);
    if (grid.length === 0) return;

    const maxCols = Math.max(...grid.map((r) => r.length), 0);

    if (tables.length > 1) {
      tsv += `--- Page ${table.pageNumber} ---\n`;
    }

    grid.forEach((row) => {
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');
      tsv += padded.map((c) => c.replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t') + '\n';
    });

    if (tableIdx < tables.length - 1) {
      tsv += '\n';
    }
  });

  return tsv;
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function PDFToExcel() {
  const [pdfFile, setPdfFile] = useState<{ name: string; arrayBuffer: ArrayBuffer; pageCount: number } | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [totalCols, setTotalCols] = useState(0);

  /* ============ LOAD ============ */
  const handleFileUpload = async (files: File[]) => {
    setError('');
    setSuccess('');
    setPreview('');
    setTables([]);
    setTotalRows(0);
    setTotalCols(0);

    const file = files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      setPdfFile({ name: file.name, arrayBuffer, pageCount: pdf.numPages });
    } catch (err: any) {
      setError('Failed to load PDF. ' + err.message);
    }
  };

  /* ============ CONVERT ============ */
  const convertToExcel = async () => {
    if (!pdfFile) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    setProgressPct(0);
    setProgress('Loading PDF...');

    try {
      const pdf = await pdfjsLib.getDocument({ data: pdfFile.arrayBuffer.slice(0) }).promise;
      const extractedTables: Table[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`Extracting table from page ${i} of ${pdf.numPages}...`);
        setProgressPct(Math.round(((i - 1) / pdf.numPages) * 90));
        const page = await pdf.getPage(i);
        const table = await extractTableFromPage(page, i);
        extractedTables.push(table);
      }

      const hasData = extractedTables.some((t) => t.rows.length > 0);
      if (!hasData) {
        throw new Error('No text found in PDF. It may be a scanned document. Please use the OCR PDF tool first.');
      }

      setProgress('Building Excel file...');
      setProgressPct(95);

      const csv = buildCsv(extractedTables);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const outName = pdfFile.name.replace(/\.pdf$/i, '') + '.csv';
      saveAs(blob, outName);

      setTables(extractedTables);
      setPreview(csv);
      setShowPreview(true);

      const totalRowsCount = extractedTables.reduce((sum, t) => sum + t.rows.length, 0);
      const totalColsCount = Math.max(...extractedTables.map((t) => t.columnBoundaries.length), 0);
      setTotalRows(totalRowsCount);
      setTotalCols(totalColsCount);

      setProgressPct(100);
      setProgress('Done!');
      setSuccess(`✅ Extracted ${totalRowsCount} rows and ${totalColsCount} columns. Downloaded as ${outName}.`);
    } catch (err: any) {
      setError('Conversion failed. ' + err.message);
      setProgress('');
      setProgressPct(0);
    } finally {
      setProcessing(false);
    }
  };

  /* ============ DOWNLOAD TSV ============ */
  const downloadTsv = () => {
    if (!tables.length || !pdfFile) return;
    const tsv = buildTsv(tables);
    const blob = new Blob(['\uFEFF' + tsv], { type: 'text/tab-separated-values;charset=utf-8;' });
    saveAs(blob, pdfFile.name.replace(/\.pdf$/i, '') + '.tsv');
  };

  /* ============ RESET ============ */
  const handleReset = () => {
    setPdfFile(null);
    setTables([]);
    setError('');
    setSuccess('');
    setPreview('');
    setShowPreview(false);
    setTotalRows(0);
    setTotalCols(0);
    setProgress('');
    setProgressPct(0);
  };

  return (
    <ToolPage
      title="PDF to Excel"
      description="Extract tables from PDF into Excel — with proper rows and columns."
      icon={<FileEdit className="w-8 h-8 text-emerald-500" />}
      color="emerald"
    >
      {!pdfFile ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          multiple={false}
          title="Drop a PDF file here"
          subtitle="or click to browse"
          icon={<FileEdit className="w-8 h-8 text-emerald-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={pdfFile.name}>
                  {pdfFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {pdfFile.pageCount} {pdfFile.pageCount === 1 ? 'page' : 'pages'}
                  {totalRows > 0 && ` · ${totalRows} rows · ${totalCols} cols`}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
            >
              Change file
            </button>
          </div>

          {/* INFO BOX */}
          <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/5 overflow-hidden">
            <div className="p-4 bg-emerald-500/10 border-b border-emerald-400/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 text-emerald-200 text-sm">
                  ✅ How this works
                </p>
                <p className="text-emerald-100">
                  Extracts text with <strong>position data</strong> from your PDF, merges continuous words
                  properly, and detects <strong>rows</strong> (by Y-coordinate) and <strong>columns</strong> (by X-coordinate)
                  to build an Excel-ready table.
                </p>
              </div>
            </div>
            <div className="p-4 bg-emerald-500/5 border-b border-emerald-400/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 text-emerald-200 text-sm">
                  🔒 Privacy First — All processing in your browser
                </p>
                <p className="text-emerald-100/90">
                  Your files are never uploaded to any server. Everything happens locally on your device.
                </p>
              </div>
            </div>
            <div className="p-4 bg-amber-500/5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 text-amber-200 text-sm">
                  ⚠️ For best results
                </p>
                <p className="text-amber-100/90">
                  Works best on <strong>text-based PDFs with clear tables</strong>. Scanned/image PDFs need OCR first.
                  Complex merged cells or nested tables may need manual adjustment.
                </p>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
              <div className="flex items-center gap-2 mb-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />}
                <span className="text-sm font-semibold text-emerald-200">{progress}</span>
                {progressPct > 0 && (
                  <span className="ml-auto text-xs font-mono text-emerald-300">{progressPct}%</span>
                )}
              </div>
              {progressPct > 0 && (
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-600 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* PREVIEW */}
          {showPreview && preview && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  Extracted Data Preview (CSV)
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Hide
                </button>
              </div>
              <textarea
                value={preview}
                readOnly
                rows={14}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none font-mono leading-relaxed resize-none"
                placeholder="Extracted data..."
              />
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{preview.length} characters</span>
                <span className="text-gray-600">💡 Open in Excel for best view</span>
              </div>
            </div>
          )}

          {/* ERROR / SUCCESS */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-lg text-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-300 mb-1">Success!</p>
                <p className="text-xs text-green-200/80">{success}</p>
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={convertToExcel}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-base rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Convert to Excel (.csv)
                </>
              )}
            </button>

            {tables.length > 0 && (
              <button
                onClick={downloadTsv}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/10 hover:border-emerald-400/40 transition-all"
                title="Download as TSV (better for Excel)"
              >
                <FileText className="w-4 h-4" />
                Download .tsv
              </button>
            )}

            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
            >
              Reset
            </button>
          </div>

          {/* BOTTOM HINT */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-xs text-emerald-200 leading-relaxed">
            💡 <strong className="text-emerald-300">Tip:</strong>{' '}
            Open the <strong>.csv</strong> file in <strong>Microsoft Excel</strong> or <strong>Google Sheets</strong> —
            each row and column will match your PDF layout. Use the <strong>.tsv</strong> download option for
            even cleaner column alignment in Excel.
          </div>

        </div>
      )}
    </ToolPage>
  );
}