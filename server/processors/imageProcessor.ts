import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { PDFDocument } from 'pdf-lib';

async function getSharp(): Promise<any> {
  try {
    const s = await import('sharp');
    return (s as any).default || s;
  } catch (e) {
    console.warn('[ImageProcessor] Sharp native binary not available:', (e as any)?.message);
    return null;
  }
}

export interface ImageOptions {
  quality?: number; // 1-100
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  rotate?: number; // 90, 180, 270, or custom
  flip?: boolean;
  flop?: boolean; // horizontal flip
  crop?: { left: number; top: number; width: number; height: number };
  stripMetadata?: boolean;
  compressionLevel?: 'best' | 'balanced' | 'max';
  backgroundColor?: string;
}

export async function processImage(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  options: ImageOptions = {}
): Promise<void> {
  const normTarget = targetFormat.toLowerCase().replace('.', '');

  // Case 1: Image to PDF
  if (normTarget === 'pdf') {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = await fs.promises.readFile(inputPath);
    let embeddedImg;

    // Convert to PNG or JPEG first if format isn't directly supported by pdf-lib
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      embeddedImg = await pdfDoc.embedJpg(imageBytes);
    } else if (ext === '.png') {
      embeddedImg = await pdfDoc.embedPng(imageBytes);
    } else {
      // Transcode to PNG buffer using sharp if available
      const sharp = await getSharp();
      if (sharp) {
        const pngBuffer = await sharp(inputPath).png().toBuffer();
        embeddedImg = await pdfDoc.embedPng(pngBuffer);
      } else {
        throw new Error('Image transcoding requires sharp engine which is not available in this environment.');
      }
    }

    const { width, height } = embeddedImg.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBytes = await pdfDoc.save();
    await fs.promises.writeFile(outputPath, pdfBytes);
    return;
  }

  // Case 2: Standard Image processing via Sharp
  try {
    const sharp = await getSharp();
    if (!sharp) {
      throw new Error('Sharp is not available, fallback to ImageMagick.');
    }
    let pipeline = sharp(inputPath, { failOn: 'none' });

    // Rotate / Flip
    if (options.rotate) {
      pipeline = pipeline.rotate(options.rotate);
    }
    if (options.flop) {
      pipeline = pipeline.flop();
    }
    if (options.flip) {
      pipeline = pipeline.flip();
    }

    // Crop
    if (options.crop && options.crop.width > 0 && options.crop.height > 0) {
      pipeline = pipeline.extract({
        left: Math.max(0, Math.floor(options.crop.left)),
        top: Math.max(0, Math.floor(options.crop.top)),
        width: Math.floor(options.crop.width),
        height: Math.floor(options.crop.height),
      });
    }

    // Resize
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width ? Math.floor(options.width) : undefined,
        height: options.height ? Math.floor(options.height) : undefined,
        fit: options.fit || (options.maintainAspectRatio === false ? 'fill' : 'inside'),
        withoutEnlargement: false,
        background: options.backgroundColor || { r: 255, g: 255, b: 255, alpha: 0 },
      });
    }

    // Calculate quality
    let q = options.quality || 85;
    if (options.compressionLevel === 'best') q = 90;
    if (options.compressionLevel === 'balanced') q = 75;
    if (options.compressionLevel === 'max') q = 55;

    // Metadata removal
    if (options.stripMetadata) {
      // By default Sharp strips EXIF unless .withMetadata() is called
    }

    // Format specific encoding
    switch (normTarget) {
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
        break;
      case 'png':
        const compressionLevel = q < 70 ? 9 : q < 85 ? 7 : 5;
        pipeline = pipeline.png({ compressionLevel, palette: q < 60 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: q, effort: 4 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: q, effort: 4 });
        break;
      case 'gif':
        pipeline = pipeline.gif();
        break;
      case 'svg':
        // Generate valid SVG wrapping or vectorization
        const meta = await pipeline.metadata();
        const base64Data = (await pipeline.png().toBuffer()).toString('base64');
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.width || 800} ${meta.height || 600}" width="${meta.width || 800}" height="${meta.height || 600}">
  <image href="data:image/png;base64,${base64Data}" width="${meta.width || 800}" height="${meta.height || 600}" preserveAspectRatio="xMidYMid meet" />
</svg>`;
        await fs.promises.writeFile(outputPath, svgContent, 'utf-8');
        return;
      case 'compress':
        // Determine best compressed format based on input
        const inExt = path.extname(inputPath).toLowerCase();
        if (inExt === '.png') {
          pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: Math.min(q, 80) });
        } else if (inExt === '.webp') {
          pipeline = pipeline.webp({ quality: Math.min(q, 75), effort: 6 });
        } else {
          pipeline = pipeline.jpeg({ quality: Math.min(q, 75), mozjpeg: true });
        }
        break;
      default:
        // Try fallback to ImageMagick if Sharp doesn't support format directly (like ICO, BMP, EPS)
        return await convertViaImageMagick(inputPath, outputPath, normTarget, options);
    }

    await pipeline.toFile(outputPath);
  } catch (err) {
    // If sharp fails (e.g. rare image format), fallback to ImageMagick convert
    await convertViaImageMagick(inputPath, outputPath, normTarget, options);
  }
}

/**
 * ImageMagick convert fallback for formats like BMP, ICO, etc.
 */
function convertViaImageMagick(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  options: ImageOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args: string[] = [inputPath];

    if (options.rotate) {
      args.push('-rotate', String(options.rotate));
    }
    if (options.flip) {
      args.push('-flip');
    }
    if (options.flop) {
      args.push('-flop');
    }
    if (options.width || options.height) {
      const resizeArg = `${options.width || ''}x${options.height || ''}${options.maintainAspectRatio === false ? '!' : ''}`;
      args.push('-resize', resizeArg);
    }
    if (options.quality) {
      args.push('-quality', String(options.quality));
    }

    args.push(outputPath);

    const proc = spawn('convert', args);
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        reject(new Error(`ImageMagick error (code ${code}): ${stderr || 'Unknown error'}`));
      }
    });

    proc.on('error', (err) => reject(err));
  });
}
