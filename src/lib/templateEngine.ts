// ============================================================
// TEMPLATE ENGINE — Prompt se template detect karo aur Excel banao
// Formula + Result dono set karta hai taake WPS/Excel mein turant dikhe
// ============================================================

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { findTemplate, extractRowCount, type Template } from './templates';

export interface TemplateGenerationOptions {
  prompt: string;
  outputFileName?: string;
}

// ============================================================
// MAIN: Generate from template
// ============================================================

export async function generateFromTemplate(
  options: TemplateGenerationOptions
): Promise<{ success: boolean; message: string; rowCount?: number }> {
  const { prompt, outputFileName } = options;

  const template = findTemplate(prompt);
  if (!template) {
    return {
      success: false,
      message:
        'Could not match a template. Try mentioning: sales report, invoice, expense tracker, inventory, budget, marks sheet, attendance, etc.',
    };
  }

  const rowCount = extractRowCount(prompt, template.defaultRows);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PDFplayOfficial AI Workspace';
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet('Data', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  buildDataSheet(dataSheet, template, rowCount);

  if (template.summary.length > 0) {
    const summarySheet = workbook.addWorksheet('Summary');
    buildSummarySheet(summarySheet, template, rowCount);
  }

  const instructionsSheet = workbook.addWorksheet('Instructions');
  buildInstructionsSheet(instructionsSheet, template);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const fileName = outputFileName || template.fileName;
  saveAs(blob, fileName);

  return {
    success: true,
    message: `${template.name} generated with ${rowCount} rows. Downloaded as ${fileName}`,
    rowCount,
  };
}

// ============================================================
// BUILD DATA SHEET
// ============================================================

function buildDataSheet(
  sheet: ExcelJS.Worksheet,
  template: Template,
  rowCount: number
): void {
  // ===== HEADERS =====
  const headerRow = sheet.addRow(template.columns.map((c) => c.header));
  headerRow.height = 26;

  headerRow.eachCell((cell, colNumber) => {
    const col = template.columns[colNumber - 1];
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: col?.align || 'left',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF6D28D9' } },
      bottom: { style: 'thin', color: { argb: 'FF6D28D9' } },
      left: { style: 'thin', color: { argb: 'FF6D28D9' } },
      right: { style: 'thin', color: { argb: 'FF6D28D9' } },
    };
  });

  // ===== COLUMN WIDTHS =====
  template.columns.forEach((col, i) => {
    sheet.getColumn(i + 1).width = col.width || 16;
  });

  // ===== DATA ROWS =====
  const userRowCount = rowCount;
  const totalRowsToAdd = Math.max(userRowCount, 10);
  const dataStartRow = 2;
  const dataEndRow = dataStartRow + totalRowsToAdd - 1;

  // Store computed values as we go (for references to previous cells)
  const computedValues: Record<string, any> = {};

  for (let i = 0; i < totalRowsToAdd; i++) {
    const rowNum = dataStartRow + i;
    const sampleRow = template.sampleData[i];

    // Build row values with formula + result objects
    const rowValues = template.columns.map((col, colIdx) => {
      const colLetter = columnIndexToLetter(colIdx);

      // ===== FORMULA COLUMN =====
      if (col.type === 'formula' && col.formula) {
        const rawFormula = col.formula(rowNum);
        const formulaWithoutEqual = rawFormula.startsWith('=')
          ? rawFormula.slice(1)
          : rawFormula;

        // Compute result from sample data or previous computed values
        const result = computeResult(
          template,
          sampleRow,
          colIdx,
          formulaWithoutEqual,
          rowNum,
          computedValues
        );

        // Store for future references
        computedValues[`${colLetter}${rowNum}`] = result;

        return { formula: formulaWithoutEqual, result: result };
      }

      // ===== SAMPLE DATA =====
      if (sampleRow && sampleRow[colIdx] !== undefined && sampleRow[colIdx] !== '') {
        const val = sampleRow[colIdx];
        computedValues[`${colLetter}${rowNum}`] = val;
        return val;
      }

      // ===== EMPTY =====
      return '';
    });

    const addedRow = sheet.addRow(rowValues);
    addedRow.height = 20;

    // Apply styling
    addedRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = template.columns[colNumber - 1];
      if (!col) return;

      cell.alignment = {
        vertical: 'middle',
        horizontal: col.align || 'left',
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };

      // Number formatting
      if (col.type === 'currency') {
        cell.numFmt = '"$"#,##0.00';
      } else if (col.type === 'percentage') {
        cell.numFmt = '0.00%';
      } else if (col.type === 'date') {
        cell.numFmt = 'yyyy-mm-dd';
      }

      // Formula column styling
      if (col.type === 'formula') {
        cell.font = { bold: true, color: { argb: 'FF6D28D9' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F3FF' },
        };
      } else if (i < template.sampleData.length && cell.value !== '') {
        // Sample rows highlight
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFBF0' },
        };
      }
    });
  }

  // ===== NOTE ROW =====
  const noteRowNum = dataEndRow + 2;
  const noteCell = sheet.getCell(`A${noteRowNum}`);
  noteCell.value =
    `↑ ${rowCount} data rows with live formulas. ` +
    `Sample data in cream rows. ` +
    `Formulas in purple columns. ` +
    `Edit any cell — formulas recalculate automatically.`;
  noteCell.font = { italic: true, size: 10, color: { argb: 'FF6B7280' } };
  sheet.mergeCells(
    `A${noteRowNum}:${columnIndexToLetter(template.columns.length - 1)}${noteRowNum}`
  );

  // ===== TOTAL ROW =====
  const totalRowNum = noteRowNum + 2;
  const totalLabelCell = sheet.getCell(`A${totalRowNum}`);
  totalLabelCell.value = 'TOTAL';
  totalLabelCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  totalLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6D28D9' },
  };
  totalLabelCell.alignment = { horizontal: 'right' };

  template.columns.forEach((col, colIdx) => {
    if (colIdx === 0) return;

    const colLetter = columnIndexToLetter(colIdx);
    const cell = sheet.getCell(`${colLetter}${totalRowNum}`);

    if (col.type === 'number' || col.type === 'currency' || col.type === 'formula') {
      const sumFormula = `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`;

      // Compute sum
      let sum = 0;
      for (let r = dataStartRow; r <= dataEndRow; r++) {
        const val = computedValues[`${colLetter}${r}`];
        if (typeof val === 'number') sum += val;
      }

      cell.value = { formula: sumFormula, result: sum };
    }

    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6D28D9' },
    };
    cell.alignment = { horizontal: 'right' };
    if (col.type === 'currency') {
      cell.numFmt = '"$"#,##0.00';
    }
  });
}

// ============================================================
// COMPUTE FORMULA RESULT
// ============================================================

function computeResult(
  template: Template,
  sampleRow: any[] | undefined,
  colIdx: number,
  formula: string,
  rowNum: number,
  computedValues: Record<string, any>
): any {
  try {
    // ===== TODAY() =====
    if (formula === 'TODAY()') {
      return new Date();
    }

    // ===== Previous cell + 1 (autodate) e.g. A2+1 =====
    const dateAddMatch = formula.match(/^([A-Z]+)(\d+)\+(\d+)$/);
    if (dateAddMatch) {
      const refCell = `${dateAddMatch[1]}${dateAddMatch[2]}`;
      const prevVal = computedValues[refCell];
      if (prevVal instanceof Date) {
        const newDate = new Date(prevVal);
        newDate.setDate(newDate.getDate() + parseInt(dateAddMatch[3]));
        return newDate;
      }
      // If not computed yet, fall back to today + offset
      const offset = rowNum - 2 + parseInt(dateAddMatch[3]);
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + offset);
      return baseDate;
    }

    // ===== Multiplication: A2*B2 =====
    const multMatch = formula.match(/^([A-Z]+)(\d+)\*([A-Z]+)(\d+)$/);
    if (multMatch) {
      const v1 = getVal(computedValues, `${multMatch[1]}${multMatch[2]}`, sampleRow, template, multMatch[1]);
      const v2 = getVal(computedValues, `${multMatch[3]}${multMatch[4]}`, sampleRow, template, multMatch[3]);
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        return Math.round(v1 * v2 * 100) / 100;
      }
    }

    // ===== Multiplication by constant: A2*0.1 =====
    const multConstMatch = formula.match(/^([A-Z]+)(\d+)\*([\d.]+)$/);
    if (multConstMatch) {
      const v1 = getVal(computedValues, `${multConstMatch[1]}${multConstMatch[2]}`, sampleRow, template, multConstMatch[1]);
      if (typeof v1 === 'number') {
        return Math.round(v1 * Number(multConstMatch[3]) * 100) / 100;
      }
    }

    // ===== Addition: A2+B2 =====
    const addMatch = formula.match(/^([A-Z]+)(\d+)\+([A-Z]+)(\d+)$/);
    if (addMatch) {
      const v1 = getVal(computedValues, `${addMatch[1]}${addMatch[2]}`, sampleRow, template, addMatch[1]);
      const v2 = getVal(computedValues, `${addMatch[3]}${addMatch[4]}`, sampleRow, template, addMatch[3]);
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        return Math.round((v1 + v2) * 100) / 100;
      }
    }

    // ===== Subtraction: A2-B2 =====
    const subMatch = formula.match(/^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/);
    if (subMatch) {
      const v1 = getVal(computedValues, `${subMatch[1]}${subMatch[2]}`, sampleRow, template, subMatch[1]);
      const v2 = getVal(computedValues, `${subMatch[3]}${subMatch[4]}`, sampleRow, template, subMatch[3]);
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        return Math.round((v1 - v2) * 100) / 100;
      }
    }

    // ===== SUM(A2:G2) =====
    const sumMatch = formula.match(/^SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
    if (sumMatch) {
      const startCol = sumMatch[1];
      const endCol = sumMatch[3];
      let sum = 0;
      for (let c = columnLetterToIndex(startCol); c <= columnLetterToIndex(endCol); c++) {
        const letter = columnIndexToLetter(c);
        const val = getVal(computedValues, `${letter}${rowNum}`, sampleRow, template, letter);
        if (typeof val === 'number') sum += val;
      }
      return Math.round(sum * 100) / 100;
    }

    // ===== COUNTIF(B2:H2,"✓") =====
    const countifMatch = formula.match(/^COUNTIF\(([A-Z]+)(\d+):([A-Z]+)(\d+),\s*"([^"]+)"\)$/);
    if (countifMatch) {
      const startCol = countifMatch[1];
      const endCol = countifMatch[3];
      const criteria = countifMatch[5];
      let count = 0;
      for (let c = columnLetterToIndex(startCol); c <= columnLetterToIndex(endCol); c++) {
        const letter = columnIndexToLetter(c);
        const val = getVal(computedValues, `${letter}${rowNum}`, sampleRow, template, letter);
        if (String(val) === criteria) count++;
      }
      return count;
    }

    // ===== IF(E2=0,"OUT","OK") or nested IF =====
    if (formula.startsWith('IF(')) {
      return computeIfFormula(formula, rowNum, computedValues, sampleRow, template);
    }

    // ===== Percentage: H2/500*100 =====
    const pctMatch = formula.match(/^([A-Z]+)(\d+)\/([\d.]+)\*([\d.]+)$/);
    if (pctMatch) {
      const v1 = getVal(computedValues, `${pctMatch[1]}${pctMatch[2]}`, sampleRow, template, pctMatch[1]);
      if (typeof v1 === 'number') {
        return Math.round((v1 / Number(pctMatch[3]) * Number(pctMatch[4])) * 100) / 100;
      }
    }

    // ===== Simple division: A2/B2 =====
    const divMatch = formula.match(/^([A-Z]+)(\d+)\/([A-Z]+)(\d+)$/);
    if (divMatch) {
      const v1 = getVal(computedValues, `${divMatch[1]}${divMatch[2]}`, sampleRow, template, divMatch[1]);
      const v2 = getVal(computedValues, `${divMatch[3]}${divMatch[4]}`, sampleRow, template, divMatch[3]);
      if (typeof v1 === 'number' && typeof v2 === 'number' && v2 !== 0) {
        return Math.round((v1 / v2) * 10000) / 10000;
      }
      return 0;
    }

    // ===== F2-1+E2 (cumulative) =====
    const cumMatch = formula.match(/^([A-Z]+)(\d+)-(\d+)\+([A-Z]+)(\d+)$/);
    if (cumMatch) {
      const v1 = getVal(computedValues, `${cumMatch[1]}${cumMatch[2]}`, sampleRow, template, cumMatch[1]);
      const v3 = getVal(computedValues, `${cumMatch[4]}${cumMatch[5]}`, sampleRow, template, cumMatch[4]);
      if (typeof v1 === 'number' && typeof v3 === 'number') {
        return Math.round((v1 + v3) * 100) / 100;
      }
    }

    // ===== IFERROR(AVERAGE(...),0) — return simple fallback =====
    if (formula.includes('IFERROR') || formula.includes('AVERAGE')) {
      return 0;
    }

    // ===== Fallback — return empty =====
    return '';
  } catch (err) {
    return '';
  }
}

// ============================================================
// COMPUTE IF FORMULA (simplified)
// ============================================================

function computeIfFormula(
  formula: string,
  rowNum: number,
  computedValues: Record<string, any>,
  sampleRow: any[] | undefined,
  template: Template
): any {
  try {
    // Extract all IF conditions
    // Pattern: IF(condition, trueVal, IF(condition2, trueVal2, falseVal))

    // Try simple pattern: IF(X=0,"A",IF(X<=Y,"B","C"))
    const eqZeroMatch = formula.match(/^IF\(([A-Z]+)(\d+)=0,"([^"]+)",IF\(([A-Z]+)(\d+)<=([A-Z]+)(\d+),"([^"]+)","([^"]+)"\)\)$/);
    if (eqZeroMatch) {
      const v1 = getVal(computedValues, `${eqZeroMatch[1]}${eqZeroMatch[2]}`, sampleRow, template, eqZeroMatch[1]);
      const v4 = getVal(computedValues, `${eqZeroMatch[4]}${eqZeroMatch[5]}`, sampleRow, template, eqZeroMatch[4]);
      const v6 = getVal(computedValues, `${eqZeroMatch[6]}${eqZeroMatch[7]}`, sampleRow, template, eqZeroMatch[6]);
      if (v1 === 0) return eqZeroMatch[3];
      if (typeof v4 === 'number' && typeof v6 === 'number' && v4 <= v6) return eqZeroMatch[8];
      return eqZeroMatch[9];
    }

    // Pattern: IF(X="Revenue","INCOME",IF(X="COGS","COGS","EXPENSE"))
    const eqStrMatch = formula.match(/^IF\(([A-Z]+)(\d+)="([^"]+)","([^"]+)",IF\(([A-Z]+)(\d+)="([^"]+)","([^"]+)","([^"]+)"\)\)$/);
    if (eqStrMatch) {
      const v1 = getVal(computedValues, `${eqStrMatch[1]}${eqStrMatch[2]}`, sampleRow, template, eqStrMatch[1]);
      if (String(v1) === eqStrMatch[3]) return eqStrMatch[4];
      const v5 = getVal(computedValues, `${eqStrMatch[5]}${eqStrMatch[6]}`, sampleRow, template, eqStrMatch[5]);
      if (String(v5) === eqStrMatch[7]) return eqStrMatch[8];
      return eqStrMatch[9];
    }

    // Pattern: IF(D2>0,"UNDER",IF(D2<0,"OVER","ON TARGET"))
    const numMatch = formula.match(/^IF\(([A-Z]+)(\d+)>(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)<(\d+),"([^"]+)","([^"]+)"\)\)$/);
    if (numMatch) {
      const v1 = getVal(computedValues, `${numMatch[1]}${numMatch[2]}`, sampleRow, template, numMatch[1]);
      if (typeof v1 === 'number' && v1 > Number(numMatch[3])) return numMatch[4];
      if (typeof v1 === 'number' && v1 < Number(numMatch[7])) return numMatch[8];
      return numMatch[9];
    }

    // Pattern: IF(I2>=90,"A+",IF(I2>=80,"A",IF(I2>=70,"B",IF(I2>=60,"C",IF(I2>=40,"D","F")))))
    const gradeMatch = formula.match(/^IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)","([^"]+)"\)\)\)\)\)$/);
    if (gradeMatch) {
      const v1 = getVal(computedValues, `${gradeMatch[1]}${gradeMatch[2]}`, sampleRow, template, gradeMatch[1]);
      if (typeof v1 === 'number') {
        if (v1 >= Number(gradeMatch[3])) return gradeMatch[4];
        if (v1 >= Number(gradeMatch[7])) return gradeMatch[8];
        if (v1 >= Number(gradeMatch[11])) return gradeMatch[12];
        if (v1 >= Number(gradeMatch[15])) return gradeMatch[16];
        if (v1 >= Number(gradeMatch[19])) return gradeMatch[20];
        return gradeMatch[21];
      }
    }

    // Pattern: IF(G2>=90,"A",IF(G2>=80,"B",IF(G2>=70,"C",IF(G2>=60,"D","F"))))
    const gradeMatch4 = formula.match(/^IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)",IF\(([A-Z]+)(\d+)>=(\d+),"([^"]+)","([^"]+)"\)\)\)\)$/);
    if (gradeMatch4) {
      const v1 = getVal(computedValues, `${gradeMatch4[1]}${gradeMatch4[2]}`, sampleRow, template, gradeMatch4[1]);
      if (typeof v1 === 'number') {
        if (v1 >= Number(gradeMatch4[3])) return gradeMatch4[4];
        if (v1 >= Number(gradeMatch4[7])) return gradeMatch4[8];
        if (v1 >= Number(gradeMatch4[11])) return gradeMatch4[12];
        if (v1 >= Number(gradeMatch4[15])) return gradeMatch4[16];
        return gradeMatch4[17];
      }
    }

    return '';
  } catch {
    return '';
  }
}

// ============================================================
// HELPER: Get cell value (from computed, sample, or empty)
// ============================================================

function getVal(
  computedValues: Record<string, any>,
  cellRef: string,
  sampleRow: any[] | undefined,
  template: Template,
  colLetter: string
): any {
  // First check computed values
  if (computedValues[cellRef] !== undefined) {
    return computedValues[cellRef];
  }

  // Then check sample row
  if (sampleRow) {
    const idx = columnLetterToIndex(colLetter);
    if (idx >= 0 && idx < sampleRow.length) {
      return sampleRow[idx];
    }
  }

  return null;
}

// ============================================================
// BUILD SUMMARY SHEET
// ============================================================

function buildSummarySheet(
  sheet: ExcelJS.Worksheet,
  template: Template,
  rowCount: number
): void {
  const dataEndRow = 1 + Math.max(rowCount, 10);

  const titleRow = sheet.addRow([template.summaryTitle || 'Summary']);
  titleRow.font = { bold: true, size: 16, color: { argb: 'FF6D28D9' } };
  titleRow.height = 30;
  sheet.mergeCells(`A1:B1`);

  sheet.addRow([]);

  template.summary.forEach((item) => {
    const formula = item.value.replace(/\{n\}/g, String(dataEndRow));
    const row = sheet.addRow([item.label, { formula: formula.replace(/^=/, ''), result: 0 }]);
    row.height = 22;

    const labelCell = row.getCell(1);
    labelCell.font = { bold: true, size: 11, color: { argb: 'FF374151' } };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    const valueCell = row.getCell(2);
    valueCell.font = { size: 11, color: { argb: 'FF111827' } };
    valueCell.alignment = { horizontal: 'right', vertical: 'middle' };
    valueCell.numFmt = '"$"#,##0.00';

    [labelCell, valueCell].forEach((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });

  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 22;
}

// ============================================================
// BUILD INSTRUCTIONS SHEET
// ============================================================

function buildInstructionsSheet(
  sheet: ExcelJS.Worksheet,
  template: Template
): void {
  const titleRow = sheet.addRow([template.name]);
  titleRow.font = { bold: true, size: 18, color: { argb: 'FF6D28D9' } };
  titleRow.height = 34;

  const descRow = sheet.addRow([template.description]);
  descRow.font = { italic: true, size: 11, color: { argb: 'FF6B7280' } };
  descRow.height = 22;

  sheet.addRow([]);

  template.instructions.forEach((line) => {
    const row = sheet.addRow([line]);

    if (
      line.startsWith('HOW TO') ||
      line.startsWith('FORMULAS') ||
      line.startsWith('TIPS') ||
      line.startsWith('CATEGOR') ||
      line.startsWith('STATUS') ||
      line.startsWith('GRADING') ||
      line.startsWith('WEIGHTS') ||
      line.startsWith('PAYMENT') ||
      line.startsWith('CALCULATIONS') ||
      line.startsWith('INVOICE')
    ) {
      row.font = { bold: true, size: 12, color: { argb: 'FF6D28D9' } };
      row.height = 22;
    } else if (line === '') {
      row.height = 10;
    } else {
      row.font = { size: 11, color: { argb: 'FF374151' } };
    }
  });

  sheet.getColumn(1).width = 90;
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

function columnLetterToIndex(letter: string): number {
  const upper = letter.toUpperCase();
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}