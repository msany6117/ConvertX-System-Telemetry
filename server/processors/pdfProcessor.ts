import fs from 'fs';
import path from 'path';
import { PDFDocument, degrees } from 'pdf-lib';
import { spawn } from 'child_process';
import JSZip from 'jszip';

export interface PDFOptions {
  action?: 'merge' | 'split' | 'rotate' | 'compress' | 'protect' | 'unlock' | 'to-images';
  pageRanges?: string; // e.g. "1,3,5-8"
  splitMode?: 'selected' | 'each' | 'every-n';
  splitInterval?: number;
  rotationDegrees?: number; // 90, 180, 270
  password?: string;
  userPassword?: string;
  imageFormat?: 'png' | 'jpg' | 'webp';
  compressionLevel?: 'low' | 'balanced' | 'high';
  additionalInputPaths?: string[]; // for merge
}

export async function processPDF(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  options: PDFOptions = {}
): Promise<void> {
  const normTarget = targetFormat.toLowerCase().replace('.', '');

  // 1. PDF TO IMAGES (JPG, PNG)
  if (normTarget === 'jpg' || normTarget === 'png' || normTarget === 'jpeg' || options.action === 'to-images') {
    return convertPDFToImages(inputPath, outputPath, normTarget === 'jpg' ? 'jpg' : 'png');
  }

  // 2. PDF MERGE
  if (options.action === 'merge' || (options.additionalInputPaths && options.additionalInputPaths.length > 0)) {
    const allPaths = [inputPath, ...(options.additionalInputPaths || [])];
    const mergedPdf = await PDFDocument.create();

    for (const filePath of allPaths) {
      if (!fs.existsSync(filePath)) continue;
      const bytes = await fs.promises.readFile(filePath);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((p) => mergedPdf.addPage(p));
    }

    const mergedBytes = await mergedPdf.save();
    await fs.promises.writeFile(outputPath, mergedBytes);
    return;
  }

  // 3. PDF ROTATE
  if (options.action === 'rotate' || options.rotationDegrees) {
    const bytes = await fs.promises.readFile(inputPath);
    const doc = await PDFDocument.load(bytes);
    const rot = options.rotationDegrees || 90;
    const pages = doc.getPages();
    for (const page of pages) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rot) % 360));
    }
    const saved = await doc.save();
    await fs.promises.writeFile(outputPath, saved);
    return;
  }

  // 4. PDF SPLIT
  if (options.action === 'split' || normTarget === 'split') {
    const bytes = await fs.promises.readFile(inputPath);
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();

    if (options.pageRanges) {
      // Parse ranges like "1,3,5-8"
      const indices = parsePageRangeString(options.pageRanges, totalPages);
      const splitDoc = await PDFDocument.create();
      const copied = await splitDoc.copyPages(doc, indices);
      copied.forEach((p) => splitDoc.addPage(p));
      const saved = await splitDoc.save();
      await fs.promises.writeFile(outputPath, saved);
      return;
    } else {
      // Split each page into a separate PDF inside a ZIP file
      const zip = new JSZip();
      for (let i = 0; i < totalPages; i++) {
        const singleDoc = await PDFDocument.create();
        const [copied] = await singleDoc.copyPages(doc, [i]);
        singleDoc.addPage(copied);
        const singleBytes = await singleDoc.save();
        zip.file(`page_${i + 1}.pdf`, singleBytes);
      }
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      await fs.promises.writeFile(outputPath, zipBuffer);
      return;
    }
  }

  // 5. PDF COMPRESSION (Ghostscript)
  if (options.action === 'compress' || normTarget === 'compress') {
    let pdfSettings = '/ebook'; // ~150 dpi balanced
    if (options.compressionLevel === 'high') pdfSettings = '/screen'; // ~72 dpi high compression
    if (options.compressionLevel === 'low') pdfSettings = '/printer'; // ~300 dpi low compression

    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${pdfSettings}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const gs = spawn('gs', gsArgs);
      let err = '';
      gs.stderr.on('data', (d) => (err += d.toString()));
      gs.on('close', async (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve();
        } else {
          // Fallback: load and re-save using pdf-lib
          try {
            const bytes = await fs.promises.readFile(inputPath);
            const doc = await PDFDocument.load(bytes);
            const saved = await doc.save({ useObjectStreams: true });
            await fs.promises.writeFile(outputPath, saved);
            resolve();
          } catch (e: any) {
            reject(new Error(`PDF compression failed: ${err || e.message}`));
          }
        }
      });
      gs.on('error', (e) => reject(e));
    });
    return;
  }

  // 6. DEFAULT COPY OR RE-SAVE
  const bytes = await fs.promises.readFile(inputPath);
  const doc = await PDFDocument.load(bytes);
  const saved = await doc.save();
  await fs.promises.writeFile(outputPath, saved);
}

/**
 * Convert PDF to PNG or JPG using Ghostscript
 */
function convertPDFToImages(inputPath: string, outputPath: string, fmt: 'png' | 'jpg'): Promise<void> {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(path.dirname(outputPath), 'pdf_imgs_' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });

    const device = fmt === 'jpg' ? 'jpeg' : 'png16m';
    const pattern = path.join(tempDir, `page_%03d.${fmt}`);

    const args = [
      `-sDEVICE=${device}`,
      '-r150',
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      `-sOutputFile=${pattern}`,
      inputPath,
    ];

    const gs = spawn('gs', args);
    let err = '';
    gs.stderr.on('data', (d) => (err += d.toString()));

    gs.on('close', async (code) => {
      try {
        if (code !== 0) {
          throw new Error(`Ghostscript failed with code ${code}: ${err}`);
        }
        const files = fs.readdirSync(tempDir).filter((f) => f.endsWith(`.${fmt}`));
        if (files.length === 0) {
          throw new Error('No images rendered from PDF.');
        }

        if (files.length === 1 && !outputPath.endsWith('.zip')) {
          // Single page -> copy directly to outputPath
          fs.copyFileSync(path.join(tempDir, files[0]), outputPath);
        } else {
          // Multiple pages -> package into a ZIP archive
          const zip = new JSZip();
          for (const f of files) {
            const data = fs.readFileSync(path.join(tempDir, f));
            zip.file(f, data);
          }
          const buf = await zip.generateAsync({ type: 'nodebuffer' });
          await fs.promises.writeFile(outputPath, buf);
        }

        // Cleanup tempDir
        fs.rmSync(tempDir, { recursive: true, force: true });
        resolve();
      } catch (e: any) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        reject(e);
      }
    });

    gs.on('error', (e) => reject(e));
  });
}

function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  const pageNumbers = new Set<number>();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const clean = part.trim();
    if (clean.includes('-')) {
      const [startStr, endStr] = clean.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let i = start; i <= end; i++) {
        pageNumbers.add(i - 1); // 0-indexed
      }
    } else {
      const num = parseInt(clean, 10);
      if (num >= 1 && num <= totalPages) {
        pageNumbers.add(num - 1);
      }
    }
  }

  const sorted = Array.from(pageNumbers).sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : [0];
}
