// ============================================================
// DOC FILE READER — Images + Documents se text/photo extract
// ============================================================

import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedDoc {
  fileName: string;
  fileType: 'image' | 'document';
  textContent: string;
  imageDataUrl?: string; // If image
  mimeType: string;
}

// ============================================================
// MAIN: Parse any file
// ============================================================
export async function parseDocFile(file: File): Promise<ParsedDoc> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type;

  // ===== IMAGE =====
  if (mimeType.startsWith('image/')) {
    const dataUrl = await fileToDataUrl(file);
    return {
      fileName: file.name,
      fileType: 'image',
      textContent: '',
      imageDataUrl: dataUrl,
      mimeType,
    };
  }

  // ===== DOCX =====
  if (extension === 'docx' || extension === 'doc') {
    const text = await extractDocxText(file);
    return {
      fileName: file.name,
      fileType: 'document',
      textContent: text,
      mimeType,
    };
  }

  // ===== PDF =====
  if (extension === 'pdf') {
    const text = await extractPdfText(file);
    return {
      fileName: file.name,
      fileType: 'document',
      textContent: text,
      mimeType,
    };
  }

  // ===== TXT =====
  if (extension === 'txt') {
    const text = await file.text();
    return {
      fileName: file.name,
      fileType: 'document',
      textContent: text,
      mimeType,
    };
  }

  throw new Error(`Unsupported file: ${file.name}`);
}

// ============================================================
// DOCX — mammoth
// ============================================================
async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch {
    return '';
  }
}

// ============================================================
// PDF — pdfjs
// ============================================================
async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }

    return text;
  } catch {
    return '';
  }
}

// ============================================================
// IMAGE → TEXT via OCR (optional, slow)
// ============================================================
export async function ocrImage(dataUrl: string): Promise<string> {
  try {
    const result = await Tesseract.recognize(dataUrl, 'eng');
    return result.data.text || '';
  } catch {
    return '';
  }
}

// ============================================================
// HELPER: File to Data URL
// ============================================================
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}