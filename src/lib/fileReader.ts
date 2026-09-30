// ============================================================
// FILE READER — Uploaded Excel/CSV files padho (browser mein)
// ============================================================

import * as XLSX from 'xlsx';

export interface ParsedSheet {
  name: string;
  headers: string[];      // Column headers (first row)
  rows: any[][];           // All rows (including first)
  columnCount: number;
  rowCount: number;
}

export interface ParsedFile {
  fileName: string;
  sheets: ParsedSheet[];
  sheetNames: string[];    // Quick access to names
}

// ============================================================
// MAIN: Parse a single file
// ============================================================

export async function parseFile(file: File): Promise<ParsedFile> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }

  throw new Error(`Unsupported file type: .${extension}. Please upload .xlsx, .xls, or .csv`);
}

// ============================================================
// CSV PARSER
// ============================================================

async function parseCSV(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string' });
  const sheets = parseWorkbook(workbook);

  return {
    fileName: file.name,
    sheets,
    sheetNames: sheets.map((s) => s.name),
  };
}

// ============================================================
// EXCEL PARSER
// ============================================================

async function parseExcel(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets = parseWorkbook(workbook);

  return {
    fileName: file.name,
    sheets,
    sheetNames: sheets.map((s) => s.name),
  };
}

// ============================================================
// WORKBOOK -> PARSED SHEETS
// ============================================================

function parseWorkbook(workbook: XLSX.WorkBook): ParsedSheet[] {
  const sheets: ParsedSheet[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    // Convert to array of arrays (raw values)
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (data.length === 0) return;

    const headers = (data[0] || []).map((h: any) => String(h || '').trim());
    const rows = data;

    sheets.push({
      name: sheetName,
      headers,
      rows,
      columnCount: headers.length,
      rowCount: data.length,
    });
  });

  return sheets;
}

// ============================================================
// HELPER: Get column index by letter (A=0, B=1, ... Z=25)
// ============================================================

export function columnLetterToIndex(letter: string): number {
  const upper = letter.toUpperCase();
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function columnIndexToLetter(index: number): string {
  let letter = '';
  let num = index + 1;
  while (num > 0) {
    const rem = (num - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}

// ============================================================
// HELPER: Get column data by letter
// ============================================================

export function getColumnData(sheet: ParsedSheet, columnLetter: string): any[] {
  const colIndex = columnLetterToIndex(columnLetter);
  return sheet.rows.map((row) => row[colIndex] ?? '');
}

export function getColumnHeader(sheet: ParsedSheet, columnLetter: string): string {
  const colIndex = columnLetterToIndex(columnLetter);
  return sheet.headers[colIndex] || `Column ${columnLetter}`;
}

// ============================================================
// HELPER: Get cell value by reference (e.g., "C3")
// ============================================================

export function getCellValue(sheet: ParsedSheet, cellRef: string): any {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;

  const colLetter = match[1].toUpperCase();
  const rowNum = parseInt(match[2], 10);

  const colIndex = columnLetterToIndex(colLetter);
  const rowIndex = rowNum - 1;

  return sheet.rows[rowIndex]?.[colIndex] ?? null;
}

// ============================================================
// HELPER: Summary of file (for UI)
// ============================================================

export function summarizeFile(file: ParsedFile): string {
  const sheet = file.sheets[0];
  if (!sheet) return `${file.fileName} — empty`;

  return `${file.fileName} — ${sheet.rowCount} rows × ${sheet.columnCount} columns`;
}

// ============================================================
// HELPER: Get all columns with their headers (for dropdowns)
// ============================================================

export interface ColumnOption {
  letter: string;
  header: string;
  index: number;
}

export function getColumnOptions(sheet: ParsedSheet): ColumnOption[] {
  return sheet.headers.map((header, index) => ({
    letter: columnIndexToLetter(index),
    header: header || `Column ${columnIndexToLetter(index)}`,
    index,
  }));
}