import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';

export async function extractTextFromFile(filePath: string, originalFilename: string): Promise<string> {
  const ext = path.extname(originalFilename).toLowerCase().replace('.', '');

  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist on disk.');
  }

  // 1. Plain text / Markdown / JSON / Code
  if (['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'xml'].includes(ext)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return raw.slice(0, 50000); // cap to safe length
  }

  // 2. CSV / Spreadsheet
  if (['csv', 'tsv'].includes(ext)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.split('\n').slice(0, 200).join('\n'); // top 200 rows
    return `CSV Data Sample (${originalFilename}):\n${lines}`;
  }

  if (['xlsx', 'xls'].includes(ext)) {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (firstSheetName) {
      const sheet = workbook.Sheets[firstSheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return `Spreadsheet Sheet: ${firstSheetName}\n${csv.slice(0, 30000)}`;
    }
  }

  // 3. Word document (DOCX)
  if (ext === 'docx') {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value.slice(0, 50000);
  }

  // 4. PDF (pdf-lib metadata & page count summary)
  if (ext === 'pdf') {
    try {
      const buffer = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();
      const title = pdfDoc.getTitle() || 'Untitled';
      const author = pdfDoc.getAuthor() || 'Unknown';
      const subject = pdfDoc.getSubject() || '';

      // Also attempt text scan from raw buffer for text strings
      const rawString = buffer.toString('binary');
      const textMatches: string[] = [];
      const regex = /\(([^)]+)\)\s*Tj/g;
      let match;
      while ((match = regex.exec(rawString)) !== null && textMatches.length < 500) {
        if (match[1] && match[1].length > 1) {
          textMatches.push(match[1]);
        }
      }

      const extracted = textMatches.join(' ').replace(/\\/g, '');
      return `PDF Document: ${originalFilename}
Pages: ${pageCount}
Title: ${title}
Author: ${author}
${subject ? `Subject: ${subject}\n` : ''}
Extracted Content:
${extracted.slice(0, 30000) || '(Embedded graphics/scanned PDF - text stream is encoded)'}`;
    } catch (e: any) {
      return `PDF File: ${originalFilename} (Could not parse text layer: ${e.message})`;
    }
  }

  // Fallback
  return `File: ${originalFilename} (${ext.toUpperCase()} format).`;
}
