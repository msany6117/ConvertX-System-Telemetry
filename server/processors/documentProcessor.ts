import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function processDocument(
  inputPath: string,
  outputPath: string,
  targetFormat: string
): Promise<void> {
  const inputExt = path.extname(inputPath).toLowerCase().replace('.', '');
  const normTarget = targetFormat.toLowerCase().replace('.', '');

  // 1. SPREADSHEETS: CSV <-> XLSX
  if (inputExt === 'csv' && normTarget === 'xlsx') {
    const csvContent = await fs.promises.readFile(inputPath, 'utf8');
    const workbook = XLSX.read(csvContent, { type: 'string' });
    XLSX.writeFile(workbook, outputPath, { bookType: 'xlsx' });
    return;
  }
  if (inputExt === 'xlsx' && (normTarget === 'csv' || normTarget === 'txt')) {
    const workbook = XLSX.readFile(inputPath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    await fs.promises.writeFile(outputPath, csvOutput, 'utf8');
    return;
  }

  // 2. DOCX CONVERSION
  if (inputExt === 'docx') {
    if (normTarget === 'txt') {
      const result = await mammoth.extractRawText({ path: inputPath });
      await fs.promises.writeFile(outputPath, result.value, 'utf8');
      return;
    }
    if (normTarget === 'html') {
      const result = await mammoth.convertToHtml({ path: inputPath });
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Converted Document</title><style>body{font-family:sans-serif;line-height:1.6;padding:2rem;max-width:800px;margin:auto;}</style></head><body>${result.value}</body></html>`;
      await fs.promises.writeFile(outputPath, fullHtml, 'utf8');
      return;
    }
    if (normTarget === 'pdf') {
      const result = await mammoth.extractRawText({ path: inputPath });
      return await textToPdf(result.value, outputPath);
    }
  }

  // 3. TXT TO PDF
  if (inputExt === 'txt' && normTarget === 'pdf') {
    const text = await fs.promises.readFile(inputPath, 'utf8');
    return await textToPdf(text, outputPath);
  }

  // 4. HTML TO TXT
  if (inputExt === 'html' && normTarget === 'txt') {
    const html = await fs.promises.readFile(inputPath, 'utf8');
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    await fs.promises.writeFile(outputPath, plain, 'utf8');
    return;
  }

  // Fallback direct copy
  await fs.promises.copyFile(inputPath, outputPath);
}

async function textToPdf(text: string, outputPath: string): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const maxLineWidth = pageWidth - margin * 2;
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  const lines = text.split('\n');
  const wrappedLines: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      wrappedLines.push('');
      continue;
    }
    const words = line.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width < maxLineWidth) {
        currentLine = testLine;
      } else {
        wrappedLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  }

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentLineIndex = 0;

  for (const l of wrappedLines) {
    if (currentLineIndex >= maxLinesPerPage) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentLineIndex = 0;
    }

    const y = pageHeight - margin - currentLineIndex * lineHeight;
    // Sanitize chars not present in standard WinAnsi
    const sanitized = l.replace(/[^\x00-\x7F]/g, '?');
    currentPage.drawText(sanitized, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentLineIndex++;
  }

  const pdfBytes = await pdfDoc.save();
  await fs.promises.writeFile(outputPath, pdfBytes);
}
