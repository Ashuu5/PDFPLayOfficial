// ============================================================
// DOC ENGINE — Templates se professional DOCX file banata hai
// ============================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import type { DocTemplate, DocSection } from './docTemplates';

// ============================================================
// MAIN: Generate DOCX from template
// ============================================================

export async function generateDocx(template: DocTemplate): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  for (const section of template.sections) {
    const node = renderSection(section);
    if (Array.isArray(node)) {
      children.push(...node);
    } else if (node) {
      children.push(node);
    }
  }

  const doc = new Document({
    creator: 'PDFplayOfficial AI Workspace',
    title: template.name,
    description: template.description,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, template.fileName);
}

// ============================================================
// SECTION RENDERER
// ============================================================

function renderSection(section: DocSection): Paragraph | Table | (Paragraph | Table)[] | null {
  switch (section.type) {
    case 'heading':
      return renderHeading(section);
    case 'subheading':
      return renderSubheading(section);
    case 'paragraph':
      return renderParagraph(section);
    case 'table':
      return renderTable(section);
    case 'list':
      return renderList(section);
    case 'spacer':
      return new Paragraph({ text: '', spacing: { after: 200 } });
    case 'divider':
      return renderDivider();
    case 'logo-placeholder':
      return renderLogoPlaceholder(section.alignment || 'left');
    default:
      return null;
  }
}

// ============================================================
// HEADINGS
// ============================================================

function renderHeading(section: DocSection): Paragraph {
  const color = (section.color || '#111827').replace('#', '');
  const size = section.size || 24;

  return new Paragraph({
    alignment: convertAlignment(section.alignment),
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({
        text: section.text || '',
        bold: true,
        size: size * 2, // docx uses half-points
        color: color,
        font: 'Calibri',
      }),
    ],
  });
}

function renderSubheading(section: DocSection): Paragraph {
  const color = (section.color || '#111827').replace('#', '');

  return new Paragraph({
    alignment: convertAlignment(section.alignment),
    spacing: { before: 150, after: 100 },
    children: [
      new TextRun({
        text: section.text || '',
        bold: true,
        size: 24, // 12pt
        color: color,
        font: 'Calibri',
      }),
    ],
  });
}

// ============================================================
// PARAGRAPHS
// ============================================================

function renderParagraph(section: DocSection): Paragraph {
  const color = (section.color || '#374151').replace('#', '');
  const size = section.size || 11;

  return new Paragraph({
    alignment: convertAlignment(section.alignment),
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text: section.text || '',
        bold: section.bold || false,
        italics: section.italic || false,
        size: size * 2,
        color: color,
        font: 'Calibri',
      }),
    ],
  });
}

// ============================================================
// LISTS
// ============================================================

function renderList(section: DocSection): Paragraph[] {
  if (!section.items) return [];

  return section.items.map(
    (item) =>
      new Paragraph({
        spacing: { after: 80, line: 276 },
        indent: { left: 720 },
        children: [
          new TextRun({
            text: '• ',
            size: 22,
            color: '6D28D9',
            bold: true,
            font: 'Calibri',
          }),
          new TextRun({
            text: item,
            size: 22,
            color: '374151',
            font: 'Calibri',
          }),
        ],
      })
  );
}

// ============================================================
// DIVIDER
// ============================================================

function renderDivider(): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: {
      bottom: {
        color: '6D28D9',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 8,
      },
    },
    children: [new TextRun({ text: '' })],
  });
}

// ============================================================
// LOGO PLACEHOLDER
// ============================================================

function renderLogoPlaceholder(alignment: 'left' | 'center' | 'right'): Paragraph {
  return new Paragraph({
    alignment: convertAlignment(alignment),
    spacing: { before: 100, after: 200 },
    children: [
      new TextRun({
        text: '[ YOUR LOGO HERE ]',
        bold: true,
        size: 20,
        color: '9CA3AF',
        font: 'Calibri',
      }),
    ],
  });
}

// ============================================================
// TABLES
// ============================================================

function renderTable(section: DocSection): Table | null {
  if (!section.rows || section.rows.length === 0) return null;

  const rows = section.rows;

  // Determine if it's a header table (first row looks like header)
  const isHeaderRow = (row: string[], index: number): boolean => {
    if (index !== 0) return false;
    const firstRowText = row.join(' ').toLowerCase();
    return (
      firstRowText.includes('description') ||
      firstRowText.includes('item') ||
      firstRowText.includes('name') ||
      firstRowText.includes('subject') ||
      firstRowText.includes('#') ||
      firstRowText.includes('phase') ||
      firstRowText.includes('language') ||
      firstRowText.includes('particulars') ||
      firstRowText.includes('service')
    );
  };

  const tableRows = rows.map((row, rowIndex) => {
    const isHeader = isHeaderRow(row, rowIndex);
    const isTotal =
      row.some((cell) => cell.toUpperCase().includes('TOTAL')) ||
      row.some((cell) => cell.toUpperCase().includes('SUBTOTAL'));

    const cells = row.map((cell, colIndex) => {
      const cellText = String(cell || '');

      return new TableCell({
        width:
          row.length === 2
            ? { size: colIndex === 0 ? 40 : 60, type: WidthType.PERCENTAGE }
            : { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE },
        shading: isHeader
          ? { fill: '8B5CF6' }
          : isTotal
          ? { fill: 'F5F3FF' }
          : undefined,
        margins: {
          top: 100,
          bottom: 100,
          left: 120,
          right: 120,
        },
        children: [
          new Paragraph({
            spacing: { after: 0, line: 240 },
            children: [
              new TextRun({
                text: cellText,
                bold: isHeader || isTotal,
                size: 22,
                color: isHeader ? 'FFFFFF' : isTotal ? '6D28D9' : '374151',
                font: 'Calibri',
              }),
            ],
          }),
        ],
      });
    });

    return new TableRow({ children: cells });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' },
    },
  });
}

// ============================================================
// HELPERS
// ============================================================

function convertAlignment(
  alignment?: 'left' | 'center' | 'right'
): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (alignment) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    default:
      return AlignmentType.LEFT;
  }
}

// ============================================================
// EXTRA HELPER: For future logo upload support
// ============================================================

export function createLogoParagraph(imageBuffer: ArrayBuffer): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 200 },
    children: [
      new ImageRun({
        data: imageBuffer,
        transformation: { width: 120, height: 60 },
      }),
    ],
  });
}