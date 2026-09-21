import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import { saveAs } from 'file-saver';
import FileUpload from '../components/FileUpload';
import ToolPage from '../components/ToolPage';
import {
  FileEdit, Download, Loader2, FileText, CheckCircle,
  AlertCircle, Eye, Info, Sparkles, Shield
} from 'lucide-react';

/* ============================================================
   TOKEN TYPES
   ============================================================ */
interface TextToken {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li';
  text: string;
  bold?: boolean;
  italic?: boolean;
  bullet?: boolean;
}

interface TableToken {
  type: 'table';
  rows: { cells: string[]; isHeader: boolean }[];
}

type Token = TextToken | TableToken;

/* ============================================================
   HTML → TOKENS (with table support)
   ============================================================ */
function htmlToTokens(html: string): Token[] {
  const tokens: Token[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const walk = (node: Element, seen: Set<Element>) => {
    const children = Array.from(node.children);
    for (const el of children) {
      if (seen.has(el)) continue;
      const tag = el.tagName.toLowerCase();

      // ---- TABLE ----
      if (tag === 'table') {
        const rows: { cells: string[]; isHeader: boolean }[] = [];
        const trs = el.querySelectorAll('tr');
        trs.forEach((tr) => {
          const cells: string[] = [];
          let isHeader = false;
          Array.from(tr.children).forEach((cell) => {
            const ct = cell.tagName.toLowerCase();
            if (ct === 'th') isHeader = true;
            const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
            cells.push(text);
          });
          if (cells.length > 0) rows.push({ cells, isHeader });
        });
        if (rows.length > 0) {
          tokens.push({ type: 'table', rows });
        }
        seen.add(el);
        continue;
      }

      // ---- HEADING ----
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const text = (el.textContent || '').trim();
        if (text) {
          const level: TextToken['type'] =
            tag === 'h1' ? 'h1' : tag === 'h2' ? 'h2' : 'h3';
          tokens.push({ type: level, text, bold: true });
          seen.add(el);
        }
        continue;
      }

      // ---- PARAGRAPH ----
      if (tag === 'p') {
        const text = (el.textContent || '').trim();
        if (text) {
          const hasBold = !!el.querySelector('strong, b');
          const hasItalic = !!el.querySelector('em, i');
          tokens.push({ type: 'p', text, bold: hasBold, italic: hasItalic });
          seen.add(el);
        }
        continue;
      }

      // ---- LIST ITEM ----
      if (tag === 'li') {
        const text = (el.textContent || '').trim();
        if (text) {
          tokens.push({ type: 'li', text, bullet: true });
          seen.add(el);
        }
        continue;
      }

      // ---- RECURSE ----
      if (['div', 'ul', 'ol', 'section', 'article', 'main', 'header', 'footer', 'td', 'th', 'tr', 'thead', 'tbody'].includes(tag)) {
        const hasBlocks = el.querySelector('p, h1, h2, h3, h4, h5, h6, li, table, ul, ol');
        if (hasBlocks) {
          walk(el, seen);
        } else {
          const text = (el.textContent || '').trim();
          if (text) {
            tokens.push({ type: 'p', text });
            seen.add(el);
          }
        }
        continue;
      }

      walk(el, seen);
    }
  };

  walk(doc.body, new Set());

  if (tokens.length === 0) {
    const raw = doc.body.textContent || '';
    raw.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      tokens.push({ type: 'p', text: line });
    });
  }

  return tokens;
}

/* ============================================================
   BUILD PDF FROM TOKENS
   ============================================================ */
async function buildPdf(tokens: Token[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdf.embedFont(StandardFonts.HelveticaBoldOblique),
  };

  const PW = 595.28;
  const PH = 841.89;
  const MARGIN = 50;
  const MAX_WIDTH = PW - MARGIN * 2;

  let page = pdf.addPage([PW, PH]);
  let y = PH - MARGIN;

  const newPageIfNeeded = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PW, PH]);
      y = PH - MARGIN;
    }
  };

  const wrapText = (text: string, font: any, size: number, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const width = font.widthOfTextAtSize(test, size);
      if (width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  for (const token of tokens) {

    /* ================= TABLE ================= */
    if (token.type === 'table') {
      const { rows } = token;
      if (rows.length === 0) continue;

      const numCols = Math.max(...rows.map((r) => r.cells.length));
      const colWidth = MAX_WIDTH / numCols;
      const cellPad = 4;
      const fontSize = 9.5;
      const lineHeight = 12;
      const rowPadding = 4;

      y -= 10;

      const isFirstRowHeader = rows[0].isHeader ||
        rows[0].cells.every((c) => c === c.toUpperCase() && c.length > 0);

      if (isFirstRowHeader) {
        newPageIfNeeded(20);
        page.drawRectangle({
          x: MARGIN,
          y: y - 16,
          width: MAX_WIDTH,
          height: 16,
          color: rgb(0.93, 0.94, 0.97),
        });
      }

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const isHeader = r === 0 && isFirstRowHeader;
        const font = isHeader ? fonts.bold : fonts.regular;

        const wrappedCells: string[][] = row.cells.map((cell) =>
          wrapText(cell || '', font, fontSize, colWidth - cellPad * 2)
        );
        const maxLines = Math.max(1, ...wrappedCells.map((w) => w.length));
        const rowHeight = maxLines * lineHeight + rowPadding * 2;

        newPageIfNeeded(rowHeight);

        page.drawLine({
          start: { x: MARGIN, y },
          end: { x: MARGIN + MAX_WIDTH, y },
          thickness: 0.5,
          color: rgb(0.6, 0.6, 0.65),
        });

        for (let c = 0; c <= numCols; c++) {
          page.drawLine({
            start: { x: MARGIN + c * colWidth, y: y },
            end: { x: MARGIN + c * colWidth, y: y - rowHeight },
            thickness: 0.5,
            color: rgb(0.6, 0.6, 0.65),
          });
        }

        for (let c = 0; c < numCols; c++) {
          const cellLines = wrappedCells[c] || [''];
          const cellX = MARGIN + c * colWidth + cellPad;
          let cellY = y - rowPadding - fontSize;

          for (const line of cellLines) {
            page.drawText(line, {
              x: cellX,
              y: cellY,
              size: fontSize,
              font,
              color: rgb(0.05, 0.05, 0.1),
            });
            cellY -= lineHeight;
          }
        }

        y -= rowHeight;
      }

      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: MARGIN + MAX_WIDTH, y },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.65),
      });

      y -= 12;
      continue;
    }

    /* ================= TEXT ================= */
    let fontSize = 11;
    let lineHeight = 16;
    let spaceBefore = 8;
    let spaceAfter = 4;

    if (token.type === 'h1') { fontSize = 22; lineHeight = 30; spaceBefore = 20; spaceAfter = 10; }
    else if (token.type === 'h2') { fontSize = 17; lineHeight = 24; spaceBefore = 16; spaceAfter = 8; }
    else if (token.type === 'h3') { fontSize = 14; lineHeight = 20; spaceBefore = 12; spaceAfter = 6; }

    const font =
      token.bold && token.italic ? fonts.boldItalic :
      token.bold ? fonts.bold :
      token.italic ? fonts.italic :
      fonts.regular;

    y -= spaceBefore;

    const prefix = token.bullet ? '•  ' : '';
    const availableWidth = MAX_WIDTH - (token.bullet ? 20 : 0);
    const wrapped = wrapText(token.text, font, fontSize, availableWidth);

    for (const line of wrapped) {
      newPageIfNeeded(lineHeight);
      const x = MARGIN + (token.bullet ? 20 : 0);
      page.drawText(prefix + line, {
        x: token.bullet ? MARGIN : x,
        y,
        size: fontSize,
        font,
        color: rgb(0.05, 0.05, 0.1),
        lineHeight,
      });
      y -= lineHeight;
    }

    y -= spaceAfter;
  }

  return await pdf.save();
}

/* ============================================================
   FILE → TOKENS
   ============================================================ */
async function fileToTokens(file: File): Promise<Token[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return htmlToTokens(result.value);
  }

  if (name.endsWith('.doc')) {
    throw new Error('Old .doc format is not supported. Please save as .docx and try again.');
  }

  const text = await file.text();
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => ({ type: 'p' as const, text: line }));
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function WordToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [tableCount, setTableCount] = useState(0);

  const handleFileUpload = (files: File[]) => {
    setError('');
    setSuccess('');
    setPreview('');
    setTokenCount(0);
    setTableCount(0);
    const f = files[0] || null;

    if (f && !f.name.toLowerCase().endsWith('.docx') && !f.name.toLowerCase().endsWith('.txt')) {
      setError('Only .docx and .txt files are supported. For .doc files, please save as .docx first.');
      return;
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
      const tokens = await fileToTokens(file);
      const tables = tokens.filter((t) => t.type === 'table').length;
      setTokenCount(tokens.length);
      setTableCount(tables);

      if (tokens.length === 0) {
        throw new Error('No readable content found in the file.');
      }

      setProgress(`Found ${tokens.length} blocks${tables > 0 ? ` (${tables} tables)` : ''}. Building PDF...`);
      setProgressPct(40);

      const bytes = await buildPdf(tokens);

      setProgress('Finalizing PDF...');
      setProgressPct(90);

      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const outName = file.name.replace(/\.(docx?|txt)$/i, '') + '.pdf';
      saveAs(blob, outName);

      const previewText = tokens.map((t) => {
        if (t.type === 'table') {
          return t.rows.map((r) => r.cells.join(' | ')).join('\n');
        }
        return (t.bullet ? '• ' : '') + t.text;
      }).join('\n\n');
      setPreview(previewText);

      setProgressPct(100);
      setProgress('Done!');
      setSuccess(`✅ Converted! Downloaded as ${outName}.`);
      setShowPreview(true);
    } catch (err: any) {
      setError('Conversion failed. ' + err.message);
      setProgress('');
      setProgressPct(0);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setPreview('');
    setShowPreview(false);
    setTokenCount(0);
    setTableCount(0);
    setProgress('');
    setProgressPct(0);
  };

  return (
    <ToolPage
      title="Word to PDF"
      description="Convert Word documents to PDF — text, headings, lists, and tables."
      icon={<FileEdit className="w-8 h-8 text-indigo-500" />}
      color="indigo"
    >
      {!file ? (
        <FileUpload
          onFilesAccepted={handleFileUpload}
          accept={{
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
          }}
          multiple={false}
          title="Drop a Word file here"
          subtitle="DOCX, TXT supported"
          icon={<FileEdit className="w-8 h-8 text-indigo-500" />}
        />
      ) : (
        <div>

          {/* FILE INFO */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                  {tokenCount > 0 && ` · ${tokenCount} blocks`}
                  {tableCount > 0 && ` · ${tableCount} tables`}
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

          {/* ============ INFO + GUIDE ============ */}
          <div className="mb-4 rounded-2xl border border-indigo-400/30 bg-indigo-500/5 overflow-hidden">
            {/* ===== Section 1: What this tool converts ===== */}
            <div className="p-4 bg-indigo-500/10 border-b border-indigo-400/20 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold mb-1 text-indigo-200 text-sm">
                  ✅ What this tool converts
                </p>
                <p className="text-indigo-100">
                  <strong>Text</strong>, <strong>headings</strong>, <strong>paragraphs</strong>,{' '}
                  <strong>bold/italic</strong>, <strong>bullet lists</strong>, and{' '}
                  <strong>tables</strong> (with borders and columns).
                </p>
              </div>
            </div>

            {/* ===== Section 2: Privacy explanation ===== */}
            <div className="p-4 bg-emerald-500/5 border-b border-emerald-400/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed flex-1">
                  <p className="font-bold mb-1 text-emerald-200 text-sm">
                    🔒 Privacy First — Your files never leave your device
                  </p>
                  <p className="text-emerald-100/90">
                    Your privacy is our highest priority. We <strong>never store your files on any server</strong> —
                    not ours, not anyone else's. All conversion happens <strong>directly in your browser</strong>,
                    so your data never leaves your device.
                  </p>
                </div>
              </div>
            </div>

            {/* ===== Section 3: Word guide ===== */}
            <div className="p-4 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed flex-1">
                  <p className="font-bold mb-2 text-amber-200 text-sm">
                    ⚠️ Shapes, logos, or images? — Use Word to save as PDF
                  </p>
                  <p className="text-amber-100/90 mb-3">
                    Browser-based conversion <strong>cannot preserve shapes, logos, custom fonts, colors, or complex layouts</strong>.
                    If your document contains these elements, save it as PDF <strong>directly from Microsoft Word</strong> for 100% perfect output.
                  </p>

                  <div className="space-y-2 bg-black/20 rounded-lg p-3 border border-amber-400/20">
                    <p className="font-bold text-amber-200 text-[11px] uppercase tracking-wider mb-2">
                      📖 How to Save Word as PDF (Windows):
                    </p>

                    <div className="flex gap-2 text-amber-100">
                      <span className="font-bold text-amber-300 flex-shrink-0">1.</span>
                      <span>Open your document in <strong>Microsoft Word</strong></span>
                    </div>

                    <div className="flex gap-2 text-amber-100">
                      <span className="font-bold text-amber-300 flex-shrink-0">2.</span>
                      <span>Click <strong>File</strong> in the top-left corner</span>
                    </div>

                    <div className="flex gap-2 text-amber-100">
                      <span className="font-bold text-amber-300 flex-shrink-0">3.</span>
                      <span>Select <strong>Save As</strong> (or <strong>Save a Copy</strong>)</span>
                    </div>

                    <div className="flex gap-2 text-amber-100">
                      <span className="font-bold text-amber-300 flex-shrink-0">4.</span>
                      <span>Choose <strong>PDF (*.pdf)</strong> from the file type dropdown</span>
                    </div>

                    <div className="flex gap-2 text-amber-100">
                      <span className="font-bold text-amber-300 flex-shrink-0">5.</span>
                      <span>Click <strong>Save</strong> — perfect PDF ready! 🎉</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-amber-400/20 flex items-center gap-2 flex-wrap">
                      <span className="text-amber-300 text-[10px] uppercase tracking-wider font-bold">
                        💡 Shortcut:
                      </span>
                      <kbd className="px-2 py-0.5 bg-black/40 border border-amber-400/30 rounded text-amber-200 font-mono text-[10px]">
                        F12
                      </kbd>
                      <span className="text-amber-100">press → "Save as PDF" → Save</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-200/60 mt-3">
                    <strong>Mac users:</strong> In Word, go to <strong>File → Export → PDF</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          {progress && (
            <div className="mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-400/30">
              <div className="flex items-center gap-2 mb-2">
                {processing && <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />}
                <span className="text-sm font-semibold text-indigo-200">{progress}</span>
                {progressPct > 0 && (
                  <span className="ml-auto text-xs font-mono text-indigo-300">{progressPct}%</span>
                )}
              </div>
              {progressPct > 0 && (
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-600 transition-all duration-300"
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
                  <Eye className="w-4 h-4 text-indigo-400" />
                  Content Preview
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
                rows={12}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none font-mono leading-relaxed resize-none"
                placeholder="Content preview..."
              />
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{preview.length} characters</span>
                <span className="text-gray-600">💡 Tables shown as "cell | cell"</span>
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
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-base rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-xs text-indigo-200 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-300">Pro tip:</strong>{' '}
              Simple documents (text + tables) — convert here.{' '}
              Complex documents (shapes + logos + images) —{' '}
              <strong>save as PDF directly from Microsoft Word</strong>.
            </div>
          </div>

        </div>
      )}
    </ToolPage>
  );
}