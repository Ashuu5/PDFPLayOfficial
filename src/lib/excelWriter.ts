// ============================================================
// EXCEL WRITER — ExcelJS se Excel file banao (formulas LIVE)
// ============================================================

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ParsedFile, ParsedSheet } from './fileReader';
import type { FormulaSlot } from './ruleEngine';

export interface GenerationOptions {
  formula: string;
  slots: FormulaSlot[];
  files: ParsedFile[];
  outputFileName?: string;
}

// ============================================================
// MAIN: Generate Excel file with formulas
// ============================================================

export async function generateExcel(options: GenerationOptions): Promise<void> {
  const { formula, slots, files, outputFileName } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PDFplayOfficial AI Workspace';
  workbook.created = new Date();

  // Sheet 1: Result (main data with formulas)
  const resultSheet = workbook.addWorksheet('Result', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Build the result sheet based on files
  await buildResultSheet(resultSheet, formula, slots, files);

  // Sheet 2: Formulas Used
  const formulaSheet = workbook.addWorksheet('Formulas Used');
  buildFormulaSheet(formulaSheet, formula, slots);

  // Sheet 3: Instructions
  const instructionsSheet = workbook.addWorksheet('Instructions');
  buildInstructionsSheet(instructionsSheet, formula);

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const fileName = outputFileName || `AI_Generated_${Date.now()}.xlsx`;
  saveAs(blob, fileName);
}

// ============================================================
// BUILD RESULT SHEET
// ============================================================

async function buildResultSheet(
  sheet: ExcelJS.Worksheet,
  formula: string,
  slots: FormulaSlot[],
  files: ParsedFile[]
): Promise<void> {
  const primaryFile = files[0];
  const primarySheet = primaryFile?.sheets[0];

  if (!primarySheet) {
    sheet.addRow(['No data available']);
    return;
  }

  // Copy original headers from primary file
  const headers = [...primarySheet.headers];

  // Add a new header for our formula result
  const resultColumnName = getResultColumnName(formula);
  headers.push(resultColumnName);

  // Add header row with styling
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' }, // Purple
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF6D28D9' } },
      bottom: { style: 'thin', color: { argb: 'FF6D28D9' } },
      left: { style: 'thin', color: { argb: 'FF6D28D9' } },
      right: { style: 'thin', color: { argb: 'FF6D28D9' } },
    };
  });
  headerRow.height = 24;

  // Copy data rows from primary file, add formula in new column
  const resultColIndex = headers.length; // 1-based
  const resultColLetter = columnIndexToLetter(resultColIndex - 1);

  for (let i = 1; i < primarySheet.rows.length; i++) {
    const row = primarySheet.rows[i];
    const newRow = [...row];

    // Build formula string
    const formulaString = buildFormulaString(formula, slots, i + 1);
    newRow.push(formulaString);

    const addedRow = sheet.addRow(newRow);

    // Style the formula cell
    const formulaCell = addedRow.getCell(resultColIndex);
    formulaCell.font = { bold: true, color: { argb: 'FF6D28D9' } };
    formulaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F3FF' }, // Light purple
    };
  }

  // Adjust column widths
  sheet.columns.forEach((col, i) => {
    if (i === resultColIndex - 1) {
      col.width = 22;
    } else {
      col.width = 16;
    }
  });

  // Mark the formula column
  const lastCol = sheet.getColumn(resultColIndex);
  lastCol.width = 25;
}

// ============================================================
// BUILD FORMULA SHEET
// ============================================================

function buildFormulaSheet(
  sheet: ExcelJS.Worksheet,
  formula: string,
  slots: FormulaSlot[]
): void {
  // Title
  const titleRow = sheet.addRow(['Formula Details']);
  titleRow.font = { bold: true, size: 14, color: { argb: 'FF6D28D9' } };
  sheet.addRow([]);

  // Formula name
  const nameRow = sheet.addRow(['Formula:', formula]);
  nameRow.font = { bold: true };
  sheet.addRow([]);

  // Slots table
  const slotHeader = sheet.addRow(['Field', 'Value']);
  slotHeader.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' },
    };
  });

  slots.forEach((slot) => {
    sheet.addRow([slot.label, slot.value || '(not provided)']);
  });

  sheet.addRow([]);

  // Full formula example
  const exampleRow = sheet.addRow(['Example Formula', '']);
  exampleRow.font = { bold: true };
  sheet.addRow(['', buildFormulaString(formula, slots, 2)]);

  // Column widths
  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 50;
}

// ============================================================
// BUILD INSTRUCTIONS SHEET
// ============================================================

function buildInstructionsSheet(sheet: ExcelJS.Worksheet, formula: string): void {
  const titleRow = sheet.addRow(['How to Use This File']);
  titleRow.font = { bold: true, size: 14, color: { argb: 'FF6D28D9' } };
  sheet.addRow([]);

  const instructions = [
    '1. The "Result" sheet contains your data with the generated formula.',
    '2. The formula is LIVE — click any formula cell to see and edit it in the formula bar.',
    '3. The "Formulas Used" sheet shows all the parameters used to build the formula.',
    '4. If you change your data, formulas will automatically recalculate.',
    `5. Formula type: ${formula}`,
    '',
    'Tips:',
    '• You can edit the formula directly in Excel.',
    '• Formulas use XLOOKUP (Excel 365 / 2021+).',
    '• If you use older Excel, the formula may need adjustment.',
    '',
    'Generated by PDFplayOfficial AI Workspace',
    'https://pdfplayofficial.com',
  ];

  instructions.forEach((line) => {
    const row = sheet.addRow([line]);
    if (line.startsWith('Tips:')) {
      row.font = { bold: true, color: { argb: 'FF6D28D9' } };
    }
  });

  sheet.getColumn(1).width = 80;
}

// ============================================================
// BUILD FORMULA STRING
// ============================================================

function buildFormulaString(
  formula: string,
  slots: FormulaSlot[],
  rowNum: number
): string {
  const getSlot = (name: string): string => {
    const slot = slots.find((s) => s.name === name);
    return slot?.value || '';
  };

  const rowify = (ref: string): string => {
    // Convert "A:A" to "A{rowNum}" or "File1!A:A" to "File1!A{rowNum}"
    if (!ref) return '';
    if (ref.includes(':') && !ref.includes('!')) {
      const col = ref.split(':')[0];
      return `${col}${rowNum}`;
    }
    if (ref.includes('!') && ref.includes(':')) {
      const [file, cols] = ref.split('!');
      const col = cols.split(':')[0];
      return `${file}!${col}${rowNum}`;
    }
    return ref;
  };

  switch (formula) {
    case 'XLOOKUP': {
      const lookupValue = rowify(getSlot('lookupValue'));
      const lookupArray = getSlot('lookupArray');
      const returnArray = getSlot('returnArray');
      return `=XLOOKUP(${lookupValue}, ${lookupArray}, ${returnArray})`;
    }

    case 'VLOOKUP': {
      const lookupValue = rowify(getSlot('lookupValue'));
      const tableArray = getSlot('tableArray');
      const columnIndex = getSlot('columnIndex') || '2';
      return `=VLOOKUP(${lookupValue}, ${tableArray}, ${columnIndex}, FALSE)`;
    }

    case 'SUM': {
      const range = getSlot('range');
      return `=SUM(${range})`;
    }

    case 'SUMIF': {
      const range = getSlot('range');
      const criteria = getSlot('criteria');
      const sumRange = getSlot('sumRange');
      return `=SUMIF(${range}, ${criteria}, ${sumRange})`;
    }

    case 'AVERAGE': {
      const range = getSlot('range');
      return `=AVERAGE(${range})`;
    }

    case 'COUNT': {
      const range = getSlot('range');
      return `=COUNTA(${range})`;
    }

    case 'COUNTIF': {
      const range = getSlot('range');
      const criteria = getSlot('criteria');
      return `=COUNTIF(${range}, ${criteria})`;
    }

    case 'IF': {
      const condition = getSlot('condition');
      const trueValue = getSlot('trueValue');
      const falseValue = getSlot('falseValue');
      return `=IF(${condition}, ${trueValue}, ${falseValue})`;
    }

    case 'CONCATENATE': {
      const cols = getSlot('columns');
      const refs = cols.split(',').map((c) => rowify(c.trim() + ':' + c.trim()));
      return `=CONCATENATE(${refs.join(', ')})`;
    }

    default:
      return '';
  }
}

// ============================================================
// RESULT COLUMN NAME
// ============================================================

function getResultColumnName(formula: string): string {
  switch (formula) {
    case 'XLOOKUP':    return 'XLOOKUP Result';
    case 'VLOOKUP':    return 'VLOOKUP Result';
    case 'SUM':        return 'Sum';
    case 'SUMIF':      return 'Sum (Conditional)';
    case 'AVERAGE':    return 'Average';
    case 'COUNT':      return 'Count';
    case 'COUNTIF':    return 'Count (Conditional)';
    case 'IF':         return 'IF Result';
    case 'CONCATENATE': return 'Combined Text';
    default:           return 'Result';
  }
}

// ============================================================
// HELPER: Column index to letter
// ============================================================

function columnIndexToLetter(index: number): string {
  let letter = '';
  let num = index + 1;
  while (num > 0) {
    const rem = (num - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter;
}