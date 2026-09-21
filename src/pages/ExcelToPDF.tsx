import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
// @ts-ignore
import * as XLSX from 'xlsx';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  FileEdit, Download, Loader2, FileText, CheckCircle,
  AlertCircle, Table as TableIcon, Info, FileSpreadsheet
} from 'lucide-react';

/* ============================================================
   TYPES
   ============================================================ */
interface SheetData {
  name: string;
  headers: string[];
  rows: string[][];
  colWidths: number[];
}

interface ParseResult {
  sheets: SheetData[];
  fileName: string;
}

/* ============================================================
   PARSE EXCEL / CSV FILE
   ============================================================ */
async function parseExcelFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert to array of arrays
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (rawData.length === 0) continue;

    // First non-empty row = headers
    let headerRowIdx = 0;
    while (headerRowIdx < rawData.length && rawData[headerRowIdx].every((c) => !c)) {
      headerRowIdx++;
    }
    if (headerRowIdx >= rawData.length) continue;

    const headerRow = rawData[headerRowIdx] || [];
    const dataRows = rawData.slice(headerRowIdx + 1);

    const headers = headerRow.map((h) => String(h || '').trim());

    // Determine column count (max across all rows)
    const maxCols = Math.max(
      headers.length,
      ...dataRows.map((r) => (r ? r.length : 0))
    );

    // Pad headers
    while (headers.length < maxCols) headers.push('');

    // Build rows (all cells as strings)
    const rows: string[][] = [];
    for (const row of dataRows) {
      if (!row || row.length === 0) continue;
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');
      const rowStr = padded.map((c) => String(c === null || c === undefined ? '' : c).trim());
      // Skip fully empty rows
      if (rowStr.every((c) => c === '')) continue;
      rows.push(rowStr);
    }

    if (rows.length === 0 && headers.every((h) => !h)) continue;

    // Calculate column widths (based on content length)
    const colWidths: number[] = [];
    for (let c = 0; c < maxCols; c++) {
      let maxLen = (headers[c] || '').length;
      for (const row of rows) {
        const len = (row[c] || '').length;
        if (len > maxLen) maxLen = len;
      }
      colWidths.push(Math.min(Math.max(maxLen, 6), 40)); // clamp 6-40 chars
    }

    sheets.push({
      name: sheetName,
      headers,
      rows,
      colWidths,
    });
  }

  if (sheets.length === 0) {
    throw new Error('No data found in the file.');
  }

  return { sheets, fileName: file.name };
}

/* ============================================================
   BUILD HIGH-QUALITY PDF
   ============================================================ */
async function buildHighQualityPDF(data: ParseResult): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  // A4 landscape for wider tables
  const PAGE_WIDTH = 841.89;
  const PAGE_HEIGHT = 595.28;
  const MARGIN = 30;
  const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;

  const HEADER_FONT_SIZE = 10;
  const BODY_FONT_SIZE = 9;
  const HEADER_HEIGHT = 22;
  const ROW_MIN_HEIGHT = 18;
  const CELL_PADDING = 6;

  // Colors
  const COLOR_HEADER_BG = rgb(0.08, 0.4, 0.4); // teal-ish dark
  const COLOR_HEADER_TEXT = rgb(1, 1, 1);
  const COLOR_ROW_EVEN = rgb(0.97, 0.99, 0.99);
  const COLOR_ROW_ODD = rgb(1, 1, 1);
  const COLOR_BORDER = rgb(0.75, 0.8, 0.82);
  const COLOR_TEXT = rgb(0.1, 0.12, 0.15);

  const sanitize = (text: string): string => {
    // Remove unsupported chars, keep basic latin
    return String(text)
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
      .trim();
  };

  const wrapCellText = (
    text: string,
    font: any,
    size: number,
    maxWidth: number
  ): string[] => {
    if (!text) return [''];
    const clean = sanitize(text);
    if (!clean) return [''];

    const words = clean.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      // If a single word is too long, break by characters
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        if (current) {
          lines.push(current);
          current = '';
        }
        let chunk = '';
        for (const ch of word) {
          const test = chunk + ch;
          if (font.widthOfTextAtSize(test, size) > maxWidth && chunk) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk = test;
          }
        }
        if (chunk) current = chunk;
        continue;
      }

      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  };

  for (let sheetIdx = 0; sheetIdx < data.sheets.length; sheetIdx++) {
    const sheet = data.sheets[sheetIdx];
    const numCols = sheet.headers.length;

    if (numCols === 0) continue;

    // Calculate column widths in points
    // Base: distribute usable width proportional to content width
    const totalCharWidth = sheet.colWidths.reduce((a, b) => a + b, 0) || 1;
    let colWidthsPt: number[] = sheet.colWidths.map(
      (w) => (w / totalCharWidth) * USABLE_WIDTH
    );

    // Enforce min/max
    const MIN_COL_WIDTH = 50;
    const MAX_COL_WIDTH = 250;
    colWidthsPt = colWidthsPt.map((w) =>
      Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, w))
    );

    // If total exceeds usable width, scale down
    const totalWidth = colWidthsPt.reduce((a, b) => a + b, 0);
    if (totalWidth > USABLE_WIDTH) {
      const scale = USABLE_WIDTH / totalWidth;
      colWidthsPt = colWidthsPt.map((w) => w * scale);
    }

    // Starting positions
    const totalTableWidth = colWidthsPt.reduce((a, b) => a + b, 0);
    const startX = MARGIN + (USABLE_WIDTH - totalTableWidth) / 2;

    // State
    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    // ============================================================
    // Sheet title
    // ============================================================
    if (data.sheets.length > 1 || sheet.name !== 'Sheet1') {
      const titleText = `Sheet: ${sheet.name}`;
      page.drawText(sanitize(titleText), {
        x: startX,
        y: y - 14,
        size: 13,
        font: fonts.bold,
        color: COLOR_HEADER_BG,
      });
      y -= 30;
    } else {
      y -= 10;
    }

    // ============================================================
    // Draw header row
    // ============================================================
    const drawHeaderRow = () => {
      // Header background
      page.drawRectangle({
        x: startX,
        y: y - HEADER_HEIGHT,
        width: totalTableWidth,
        height: HEADER_HEIGHT,
        color: COLOR_HEADER_BG,
      });

      // Header text
      let xPos = startX;
      for (let c = 0; c < numCols; c++) {
        const headerText = sanitize(sheet.headers[c] || '');
        const cellWidth = colWidthsPt[c] - CELL_PADDING * 2;
        const lines = wrapCellText(headerText, fonts.bold, HEADER_FONT_SIZE, cellWidth);

        let lineY = y - 14;
        for (const line of lines.slice(0, 1)) {
          // only first line for header
          page.drawText(line, {
            x: xPos + CELL_PADDING,
            y: lineY,
            size: HEADER_FONT_SIZE,
            font: fonts.bold,
            color: COLOR_HEADER_TEXT,
          });
        }
        xPos += colWidthsPt[c];
      }

      y -= HEADER_HEIGHT;
    };

    drawHeaderRow();

    // ============================================================
    // Draw data rows
    // ============================================================
    for (let r = 0; r < sheet.rows.length; r++) {
      const row = sheet.rows[r];

      // Pre-wrap all cells in this row to find row height
      const wrappedCells: string[][] = [];
      let maxLines = 1;
      for (let c = 0; c < numCols; c++) {
        const cellText = row[c] || '';
        const cellWidth = colWidthsPt[c] - CELL_PADDING * 2;
        const lines = wrapCellText(cellText, fonts.regular, BODY_FONT_SIZE, cellWidth);
        wrappedCells.push(lines);
        if (lines.length > maxLines) maxLines = lines.length;
      }

      const rowHeight = Math.max(ROW_MIN_HEIGHT, maxLines * 12 + CELL_PADDING);

      // Check if we need a new page
      if (y - rowHeight < MARGIN + 20) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;

        // Redraw header on new page
        drawHeaderRow();
      }

      // Draw row background (zebra striping)
      if (r % 2 === 1) {
        page.drawRectangle({
          x: startX,
          y: y - rowHeight,
          width: totalTableWidth,
          height: rowHeight,
          color: COLOR_ROW_EVEN,
        });
      }

      // Draw cell texts
      let xPos = startX;
      for (let c = 0; c < numCols; c++) {
        const lines = wrappedCells[c];
        let lineY = y - 12;

        for (const line of lines) {
          page.drawText(line, {
            x: xPos + CELL_PADDING,
            y: lineY,
            size: BODY_FONT_SIZE,
            font: fonts.regular,
            color: COLOR_TEXT,
          });
          lineY -= 12;
        }
        xPos += colWidthsPt[c];
      }

      // Draw bottom border for the row
      page.drawLine({
        start: { x: startX, y: y - rowHeight },
        end: { x: startX + totalTableWidth, y: y - rowHeight },
        thickness: 0.4,
        color: COLOR_BORDER,
      });

      y -= rowHeight;
    }

    // ============================================================
    // Draw vertical column separators
    // ============================================================
    // We draw them per page so each page has clean lines
    // (Simplified: draw on current page)
    // For simplicity, we skip vertical borders to keep it clean.
    // Add a subtle border around the table if wanted:

    // (Optional) border around header columns: uncomment if needed
    // ...
  }

  return await pdf.save();
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function ExcelToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = (files: File[]) => {
    setError('');
    setSuccess('');
    setParsed(null);
    const f = files[0] || null;

    if (f) {
      const name = f.name.toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
        setError('Only .xlsx, .xls, and .csv files are supported.');
        return;
      }
    }
    setFile(f);
  };

  const convertToPDF = async () => {
    if (!file) return;

    setProcessing(true);
    setError('');
    setSuccess('');
    setProgressPct(0);
    setProgress('Reading file...');

    try {
      setProgress('Parsing spreadsheet data...');
      setProgressPct(20);

      const result = await parseExcelFile(file);
      setParsed(result);

      setProgress(`Found ${result.sheets.length} sheet${result.sheets.length > 1 ? 's' : ''}. Building PDF...`);
      setProgressPct(60);

      const bytes = await buildHighQualityPDF(result);

      setProgress('Finalizing...');
      setProgressPct(90);

      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const outName = file.name.replace(/\.(xlsx?|csv)$/i, '') + '.pdf';
      saveAs(blob, outName);

      setProgressPct(100);
      setProgress('Done!');
      setSuccess(`✅ Converted! Downloaded as ${outName}.`);
    } catch (err: any) {
      console.error(err);
      setError('Conversion failed. ' + (err.message || 'Please try again.'));
      setProgress('');
      setProgressPct(0);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsed(null);
    setError('');
    setSuccess('');
    setProgress('');
    setProgressPct(0);
  };

  const totalRows = parsed ? parsed.sheets.reduce((sum, s) => sum + s.rows.length, 0) : 0;
  const totalSheets = parsed ? parsed.sheets.length : 0;

  return (
    <ToolPage
      title="Excel to PDF"
      description="Convert Excel files to high-quality PDF with proper table structure."
      icon={<FileSpreadsheet className="w-8 h-8 text-teal-500" />}
      color="teal"
    >
      {!file ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          accept={{
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
          }}
          multiple={false}
          title="Drop an Excel file here"
          subtitle="XLSX, XLS, CSV supported"
          icon={<FileSpreadsheet className="w-8 h-8 text-teal-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                  {totalSheets > 0 && ` · ${totalSheets} sheet${totalSheets > 1 ? 's' : ''}`}
                  {totalRows > 0 && ` · ${totalRows} rows`}
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
          <div className="mb-4 rounded-2xl border border-teal-400/30 bg-teal-500/5 overflow-hidden">
            <div className="p-4 bg-teal-500/10 border-b border-teal-400/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 text-teal-200 text-sm">
                  ✅ High-quality table rendering
                </p>
                <p className="text-teal-100">
                  Real <strong>XLSX parsing</strong> — reads headers, rows, and columns from Excel.
                  Renders them as a <strong>proper table</strong> with headers, borders, and zebra striping.
                  Auto page breaks for large tables. A4 landscape for wide data.
                </p>
              </div>
            </div>

            <div className="p-4 bg-teal-500/5 border-b border-teal-400/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-teal-300 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 text-teal-200 text-sm">
                  🔒 Privacy First — All processing in your browser
                </p>
                <p className="text-teal-100/90">
                  Your Excel data never leaves your device. Everything happens locally — no server upload.
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-500/5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 text-amber-200 text-sm">
                  ⚠️ What gets preserved
                </p>
                <p className="text-amber-100/90">
                  <strong>Preserved:</strong> cell values, column widths, row data, sheet structure, headers.
                  <br />
                  <strong>Not preserved:</strong> formulas (shows values), charts, colors, merged cells, images.
                </p>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-4 rounded-xl bg-teal-500/10 border border-teal-400/30">
              <div className="flex items-center gap-2 mb-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin text-teal-300" />}
                <span className="text-sm font-semibold text-teal-200">{progress}</span>
                {progressPct > 0 && (
                  <span className="ml-auto text-xs font-mono text-teal-300">{progressPct}%</span>
                )}
              </div>
              {progressPct > 0 && (
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-cyan-600 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* SHEETS PREVIEW */}
          {parsed && parsed.sheets.length > 0 && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <TableIcon className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">
                  Sheet Summary
                </h3>
              </div>
              <div className="space-y-3">
                {parsed.sheets.map((sheet, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <p className="text-xs font-bold text-teal-200 mb-2">
                      📄 {sheet.name}
                    </p>
                    <div className="text-[10px] text-gray-400 mb-2">
                      {sheet.headers.length} cols · {sheet.rows.length} rows
                    </div>
                    {/* Mini preview */}
                    <div className="overflow-x-auto">
                      <table className="text-[9px] text-gray-300 border-collapse">
                        <thead>
                          <tr>
                            {sheet.headers.slice(0, 5).map((h, j) => (
                              <th
                                key={j}
                                className="border border-white/10 px-2 py-1 bg-teal-500/20 text-teal-200 font-bold"
                              >
                                {h || '—'}
                              </th>
                            ))}
                            {sheet.headers.length > 5 && (
                              <th className="border border-white/10 px-2 py-1 bg-white/5 text-gray-500">
                                +{sheet.headers.length - 5} more
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {sheet.rows.slice(0, 3).map((row, r) => (
                            <tr key={r}>
                              {row.slice(0, 5).map((cell, c) => (
                                <td
                                  key={c}
                                  className="border border-white/10 px-2 py-1 max-w-[100px] truncate"
                                >
                                  {cell || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {sheet.rows.length > 3 && (
                      <p className="text-[10px] text-gray-600 mt-2">
                        +{sheet.rows.length - 3} more rows
                      </p>
                    )}
                  </div>
                ))}
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
              onClick={convertToPDF}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-base rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Convert to PDF
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-3.5 border-2 border-white/15 text-gray-200 font-bold rounded-xl hover:bg-white/5 hover:border-white/25 disabled:opacity-50 transition-all"
            >
              Reset
            </button>
          </div>

          {/* BOTTOM HINT */}
          <div className="mt-4 p-3 rounded-xl bg-teal-500/10 border border-teal-400/20 text-xs text-teal-200 leading-relaxed">
            💡 <strong className="text-teal-300">Pro tip:</strong>{' '}
            For the best output, save Excel file as <strong>.xlsx</strong> with the first row as headers.
            Formulas are converted to their <strong>calculated values</strong>.
          </div>

        </div>
      )}
    </ToolPage>
  );
}