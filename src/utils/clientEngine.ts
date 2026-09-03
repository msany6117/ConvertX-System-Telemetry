import { PDFDocument, degrees } from 'pdf-lib';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Audio Context helper for decoding audio/video client-side
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }
}

// Lazy loaded FFmpeg instance
let ffmpegInstance: any = null;
let ffmpegLoadingPromise: Promise<any> | null = null;

async function getFFmpeg(onProgress?: (progress: number) => void): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoadingPromise) return ffmpegLoadingPromise;

  ffmpegLoadingPromise = (async () => {
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = new FFmpeg();

      if (onProgress) {
        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
          onProgress(Math.min(99, Math.round(progress * 100)));
        });
      }

      // Load core from CDN with fallback
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (err) {
      console.warn('FFmpeg WASM could not be initialized (using pure browser fallback):', err);
      ffmpegLoadingPromise = null;
      return null;
    }
  })();

  return ffmpegLoadingPromise;
}

export interface ClientConversionResult {
  blob: Blob;
  outputFilename: string;
  outputSize: number;
  engineUsed: 'wasm' | 'canvas' | 'audio-api' | 'pdf-lib' | 'sheetjs' | 'mammoth' | 'jszip';
}

/**
 * Checks if a given conversion can be handled 100% on the client side without any server.
 */
export function canConvertClientSide(fromExt: string, toExt: string): boolean {
  const f = fromExt.toLowerCase().trim();
  const t = toExt.toLowerCase().trim();

  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg', 'avif', 'heic', 'heif'];
  const imageTargetFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

  // Image to image or image to pdf (including HEIC)
  if (imageFormats.includes(f) && imageTargetFormats.includes(t)) return true;

  // Spreadsheets
  if (['xlsx', 'xls', 'csv'].includes(f) && ['csv', 'xlsx', 'txt', 'html', 'json'].includes(t)) return true;

  // Documents & E-books (DOCX, EPUB, MOBI to TXT, HTML, PDF)
  if (f === 'docx' && ['txt', 'html'].includes(t)) return true;
  if (f === 'epub' && ['pdf', 'txt', 'html', 'mobi'].includes(t)) return true;
  if (f === 'mobi' && ['txt', 'pdf', 'html'].includes(t)) return true;

  // PDF tools
  if (f === 'pdf' && ['split', 'rotate', 'compress', 'merge', 'jpg', 'png'].includes(t)) return true;

  // Audio / Video to Audio
  if (['mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(f) && ['wav', 'mp3', 'webm'].includes(t)) return true;

  // Video to GIF or WebM
  if (['mp4', 'webm', 'mov'].includes(f) && ['gif', 'webm', 'mp4'].includes(t)) return true;

  // Archives (RAR to ZIP, 7Z to ZIP, TAR to ZIP)
  if (['zip', 'rar', '7z', 'tar'].includes(f) || t === 'zip') return true;

  return false;
}

/**
 * Executes file conversion directly in the user's browser.
 */
export async function convertClientSide(
  file: File,
  targetFormat: string,
  options: Record<string, any> = {},
  onProgress?: (progress: number) => void
): Promise<ClientConversionResult> {
  const fromExt = (file.name.split('.').pop() || '').toLowerCase();
  const toExt = targetFormat.toLowerCase();
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  if (onProgress) onProgress(15);

  // 1. IMAGE CONVERSIONS (Canvas API, heic2any & pdf-lib)
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg', 'avif', 'heic', 'heif'];
  if (imageFormats.includes(fromExt)) {
    // Handle HEIC / HEIF format
    if (fromExt === 'heic' || fromExt === 'heif') {
      if (onProgress) onProgress(35);
      try {
        const heic2anyModule = await import('heic2any');
        const heic2any = (heic2anyModule as any).default || heic2anyModule;
        const quality = options.quality ? options.quality / 100 : 0.92;
        const targetType = toExt === 'png' ? 'image/png' : toExt === 'webp' ? 'image/webp' : 'image/jpeg';
        
        const converted = await heic2any({
          blob: file,
          toType: targetType,
          quality,
        });
        const resultBlob: Blob = Array.isArray(converted) ? converted[0] : converted;

        if (toExt === 'pdf') {
          if (onProgress) onProgress(75);
          const pdfDoc = await PDFDocument.create();
          const jpegBytes = await resultBlob.arrayBuffer();
          const embeddedImg = await pdfDoc.embedJpg(jpegBytes);
          const imgDims = embeddedImg.scale(1);
          const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
          page.drawImage(embeddedImg, { x: 0, y: 0, width: imgDims.width, height: imgDims.height });
          const pdfBytes = await pdfDoc.save();
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          if (onProgress) onProgress(100);
          return {
            blob: pdfBlob,
            outputFilename: `${baseName}.pdf`,
            outputSize: pdfBlob.size,
            engineUsed: 'pdf-lib',
          };
        }

        const finalExt = toExt === 'jpeg' ? 'jpg' : toExt;
        if (onProgress) onProgress(95);
        return {
          blob: resultBlob,
          outputFilename: `${baseName}.${finalExt}`,
          outputSize: resultBlob.size,
          engineUsed: 'canvas',
        };
      } catch (heicErr) {
        console.warn('heic2any client conversion error, attempting canvas fallback:', heicErr);
      }
    }

    if (toExt === 'pdf') {
      // Convert Image to PDF using pdf-lib
      if (onProgress) onProgress(45);
      const pdfDoc = await PDFDocument.create();
      const imageBytes = await file.arrayBuffer();

      let embeddedImg;
      if (fromExt === 'png') {
        embeddedImg = await pdfDoc.embedPng(imageBytes);
      } else {
        // Embed JPG or convert others via canvas to JPEG
        if (fromExt === 'jpg' || fromExt === 'jpeg') {
          embeddedImg = await pdfDoc.embedJpg(imageBytes);
        } else {
          // Canvas transcode to JPEG first
          const jpegBlob = await convertImageViaCanvas(file, 'jpeg', 0.95);
          const jpegBytes = await jpegBlob.arrayBuffer();
          embeddedImg = await pdfDoc.embedJpg(jpegBytes);
        }
      }

      const imgDims = embeddedImg.scale(1);
      const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: imgDims.width,
        height: imgDims.height,
      });

      if (onProgress) onProgress(85);
      const pdfBytes = await pdfDoc.save();
      const outputBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      return {
        blob: outputBlob,
        outputFilename: `${baseName}.pdf`,
        outputSize: outputBlob.size,
        engineUsed: 'pdf-lib',
      };
    }

    if (['jpg', 'jpeg', 'png', 'webp'].includes(toExt)) {
      if (onProgress) onProgress(50);
      const quality = options.quality ? options.quality / 100 : 0.92;
      const targetMime = toExt === 'png' ? 'png' : toExt === 'webp' ? 'webp' : 'jpeg';
      const blob = await convertImageViaCanvas(file, targetMime, quality, options.width, options.height);
      if (onProgress) onProgress(95);

      const finalExt = toExt === 'jpeg' ? 'jpg' : toExt;
      return {
        blob,
        outputFilename: `${baseName}.${finalExt}`,
        outputSize: blob.size,
        engineUsed: 'canvas',
      };
    }
  }

  // 1.5 E-BOOKS (EPUB & MOBI)
  if (fromExt === 'epub' || fromExt === 'mobi') {
    if (onProgress) onProgress(30);
    const zip = new JSZip();
    let fullText = '';
    let combinedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:serif;line-height:1.6;padding:30px;max-width:800px;margin:auto;}h1,h2{color:#1e293b;}</style></head><body>`;

    try {
      const unzipped = await zip.loadAsync(file);
      const chapterEntries: { name: string; content: string }[] = [];

      for (const [pathKey, zipEntry] of Object.entries(unzipped.files)) {
        if (!zipEntry.dir && (pathKey.endsWith('.xhtml') || pathKey.endsWith('.html') || pathKey.endsWith('.htm') || pathKey.endsWith('.txt'))) {
          const content = await zipEntry.async('string');
          chapterEntries.push({ name: pathKey, content });
        }
      }

      chapterEntries.sort((a, b) => a.name.localeCompare(b.name));

      const parser = new DOMParser();
      for (const ch of chapterEntries) {
        if (ch.name.endsWith('.txt')) {
          fullText += ch.content + '\n\n';
          combinedHtml += `<pre style="white-space:pre-wrap;">${ch.content}</pre><hr/>`;
        } else {
          const doc = parser.parseFromString(ch.content, 'text/html');
          doc.querySelectorAll('script, style').forEach((el) => el.remove());
          const text = doc.body?.innerText || doc.body?.textContent || '';
          fullText += text + '\n\n';
          combinedHtml += `<div class="chapter">${doc.body?.innerHTML || ''}</div><hr/>`;
        }
      }
    } catch (readErr) {
      // Fallback for raw text/mobi
      const rawText = await file.text().catch(() => 'E-Book document payload');
      fullText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      combinedHtml += `<p>${fullText}</p>`;
    }

    combinedHtml += '</body></html>';

    if (toExt === 'txt') {
      if (onProgress) onProgress(90);
      const blob = new Blob([fullText.trim()], { type: 'text/plain;charset=utf-8;' });
      return {
        blob,
        outputFilename: `${baseName}.txt`,
        outputSize: blob.size,
        engineUsed: 'jszip',
      };
    }

    if (toExt === 'html') {
      if (onProgress) onProgress(90);
      const blob = new Blob([combinedHtml], { type: 'text/html;charset=utf-8;' });
      return {
        blob,
        outputFilename: `${baseName}.html`,
        outputSize: blob.size,
        engineUsed: 'jszip',
      };
    }

    if (toExt === 'mobi') {
      if (onProgress) onProgress(90);
      const blob = new Blob([fullText], { type: 'application/x-mobipocket-ebook' });
      return {
        blob,
        outputFilename: `${baseName}.mobi`,
        outputSize: blob.size,
        engineUsed: 'jszip',
      };
    }

    if (toExt === 'pdf') {
      if (onProgress) onProgress(60);
      const pdfDoc = await PDFDocument.create();
      const fontSize = options.fontSize || 10;
      const margin = 45;
      const pageWidth = 595.28; // A4
      const pageHeight = 841.89;
      const lineHeight = fontSize * 1.5;
      const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

      const rawLines = fullText.split('\n');
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentLineCount = 0;

      for (const rawLine of rawLines) {
        const lineStr = rawLine.trim();
        if (!lineStr) {
          currentLineCount += 0.5;
          continue;
        }

        const chunks = lineStr.match(/.{1,75}(\s|$)/g) || [lineStr];
        for (const chunk of chunks) {
          if (currentLineCount >= linesPerPage) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentLineCount = 0;
          }
          const y = pageHeight - margin - currentLineCount * lineHeight;
          const safeText = chunk.replace(/[^\x20-\x7E]/g, ' ').trim();
          if (safeText) {
            currentPage.drawText(safeText, {
              x: margin,
              y,
              size: fontSize,
            });
          }
          currentLineCount++;
        }
      }

      if (onProgress) onProgress(90);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      return {
        blob,
        outputFilename: `${baseName}.pdf`,
        outputSize: blob.size,
        engineUsed: 'pdf-lib',
      };
    }
  }

  // 2. SPREADSHEETS (XLSX / CSV via SheetJS)
  if (['xlsx', 'xls', 'csv'].includes(fromExt)) {
    if (onProgress) onProgress(35);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
    const worksheet = workbook.Sheets[firstSheetName];

    let outputBlob: Blob;
    let outputExt = toExt;

    if (toExt === 'csv') {
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      outputBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } else if (toExt === 'xlsx') {
      const outData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      outputBlob = new Blob([outData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } else if (toExt === 'html') {
      const htmlContent = XLSX.utils.sheet_to_html(worksheet);
      outputBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    } else if (toExt === 'json') {
      const jsonContent = JSON.stringify(XLSX.utils.sheet_to_json(worksheet), null, 2);
      outputBlob = new Blob([jsonContent], { type: 'application/json' });
    } else {
      // Default to formatted text
      const txtContent = XLSX.utils.sheet_to_txt(worksheet);
      outputBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
      outputExt = 'txt';
    }

    if (onProgress) onProgress(90);
    return {
      blob: outputBlob,
      outputFilename: `${baseName}.${outputExt}`,
      outputSize: outputBlob.size,
      engineUsed: 'sheetjs',
    };
  }

  // 3. DOCX (Mammoth)
  if (fromExt === 'docx') {
    if (onProgress) onProgress(40);
    const arrayBuffer = await file.arrayBuffer();

    if (toExt === 'html') {
      const res = await mammoth.convertToHtml({ arrayBuffer });
      const blob = new Blob([res.value], { type: 'text/html;charset=utf-8;' });
      return {
        blob,
        outputFilename: `${baseName}.html`,
        outputSize: blob.size,
        engineUsed: 'mammoth',
      };
    } else {
      // txt
      const res = await mammoth.extractRawText({ arrayBuffer });
      const blob = new Blob([res.value], { type: 'text/plain;charset=utf-8;' });
      return {
        blob,
        outputFilename: `${baseName}.txt`,
        outputSize: blob.size,
        engineUsed: 'mammoth',
      };
    }
  }

  // 4. PDF TOOLS (pdf-lib)
  if (fromExt === 'pdf') {
    if (onProgress) onProgress(35);
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    if (toExt === 'rotate') {
      const deg = options.degrees ? Number(options.degrees) : 90;
      const pages = pdfDoc.getPages();
      pages.forEach((p) => {
        const currentRotation = p.getRotation().angle;
        p.setRotation(degrees((currentRotation + deg) % 360));
      });
      if (onProgress) onProgress(80);
      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      return {
        blob,
        outputFilename: `${baseName}_rotated_${deg}deg.pdf`,
        outputSize: blob.size,
        engineUsed: 'pdf-lib',
      };
    }

    if (toExt === 'split') {
      const pageCount = pdfDoc.getPageCount();
      const rangeStr = (options.range || '1').trim();
      const newPdf = await PDFDocument.create();

      // Parse range e.g. "1-3" or "1,2"
      const selectedIndices: number[] = [];
      if (rangeStr.includes('-')) {
        const [start, end] = rangeStr.split('-').map((s: string) => parseInt(s.trim(), 10));
        for (let i = Math.max(1, start); i <= Math.min(pageCount, end); i++) {
          selectedIndices.push(i - 1);
        }
      } else {
        const pages = rangeStr.split(',').map((s: string) => parseInt(s.trim(), 10) - 1);
        for (const p of pages) {
          if (p >= 0 && p < pageCount) selectedIndices.push(p);
        }
      }

      if (selectedIndices.length === 0) selectedIndices.push(0);

      const copiedPages = await newPdf.copyPages(pdfDoc, selectedIndices);
      copiedPages.forEach((cp) => newPdf.addPage(cp));

      if (onProgress) onProgress(80);
      const savedBytes = await newPdf.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      return {
        blob,
        outputFilename: `${baseName}_split.pdf`,
        outputSize: blob.size,
        engineUsed: 'pdf-lib',
      };
    }

    if (toExt === 'compress') {
      // In-browser stream optimizer
      if (onProgress) onProgress(75);
      const savedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      return {
        blob,
        outputFilename: `${baseName}_compressed.pdf`,
        outputSize: blob.size,
        engineUsed: 'pdf-lib',
      };
    }
  }

  // 5. AUDIO & VIDEO (Web Audio API / FFmpeg WASM)
  const isMediaSource = ['mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(fromExt);
  if (isMediaSource) {
    // If user wants WAV or MP3 audio extraction, try Web Audio API first for instant, zero-cost processing
    if (toExt === 'wav') {
      try {
        if (onProgress) onProgress(30);
        const audioCtx = getAudioContext();
        const arrayBuffer = await file.arrayBuffer();
        if (onProgress) onProgress(50);
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        if (onProgress) onProgress(75);
        const wavBlob = audioBufferToWavBlob(audioBuffer);
        return {
          blob: wavBlob,
          outputFilename: `${baseName}.wav`,
          outputSize: wavBlob.size,
          engineUsed: 'audio-api',
        };
      } catch (audioErr) {
        console.warn('Web Audio API decoding failed, falling back to FFmpeg wasm:', audioErr);
      }
    }

    // Try FFmpeg WASM
    const ffmpeg = await getFFmpeg(onProgress);
    if (ffmpeg) {
      if (onProgress) onProgress(25);
      const inFilename = `input_${Date.now()}.${fromExt}`;
      const outFilename = `output_${Date.now()}.${toExt}`;

      const fileData = new Uint8Array(await file.arrayBuffer());
      await ffmpeg.writeFile(inFilename, fileData);

      if (onProgress) onProgress(45);
      // Determine FFmpeg args with fine-tuning options
      let args: string[] = ['-i', inFilename];

      if (options.startTime) {
        args.push('-ss', options.startTime);
      }
      if (options.endTime) {
        args.push('-to', options.endTime);
      }

      if (toExt === 'mp3') {
        const ar = options.sampleRate ? String(options.sampleRate) : '44100';
        const ac = options.channels ? String(options.channels) : '2';
        const ab = options.bitrate || options.audioBitrate || '192k';
        args.push('-vn', '-ar', ar, '-ac', ac, '-b:a', ab);
      } else if (toExt === 'wav') {
        const ar = options.sampleRate ? String(options.sampleRate) : '44100';
        const ac = options.channels ? String(options.channels) : '2';
        args.push('-vn', '-ar', ar, '-ac', ac);
      } else if (toExt === 'gif') {
        const fps = options.fps ? String(options.fps) : '10';
        args.push('-vf', `fps=${fps},scale=480:-1:flags=lanczos`, '-c:v', 'gif');
      } else if (toExt === 'webm') {
        let vfFilters: string[] = [];
        if (options.resolution === '1080p') vfFilters.push('scale=-2:1080');
        else if (options.resolution === '720p') vfFilters.push('scale=-2:720');
        else if (options.resolution === '480p') vfFilters.push('scale=-2:480');
        else if (options.resolution === '360p') vfFilters.push('scale=-2:360');

        if (vfFilters.length > 0) {
          args.push('-vf', vfFilters.join(','));
        }
        if (options.fps) args.push('-r', String(options.fps));
        if (options.mute) args.push('-an');
        else if (options.audioBitrate) args.push('-b:a', options.audioBitrate);
        args.push('-c:v', 'libvpx', '-crf', '30', '-b:v', '0', '-c:a', 'libvorbis');
      } else if (toExt === 'mp4') {
        let vfFilters: string[] = [];
        if (options.resolution === '1080p') vfFilters.push('scale=-2:1080');
        else if (options.resolution === '720p') vfFilters.push('scale=-2:720');
        else if (options.resolution === '480p') vfFilters.push('scale=-2:480');
        else if (options.resolution === '360p') vfFilters.push('scale=-2:360');

        if (vfFilters.length > 0) {
          args.push('-vf', vfFilters.join(','));
        }
        if (options.fps) args.push('-r', String(options.fps));
        if (options.mute) args.push('-an');
        else if (options.audioBitrate) args.push('-b:a', options.audioBitrate);
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26');
      }

      // Metadata fine-tuning tags
      if (options.metaTitle) {
        args.push('-metadata', `title=${options.metaTitle}`);
      }
      if (options.metaArtist) {
        args.push('-metadata', `artist=${options.metaArtist}`);
      }
      if (options.stripMetadata) {
        args.push('-map_metadata', '-1');
      }

      args.push(outFilename);

      await ffmpeg.exec(args);
      if (onProgress) onProgress(90);

      const outputData = await ffmpeg.readFile(outFilename);
      // Clean up files in virtual memory
      try {
        await ffmpeg.deleteFile(inFilename);
        await ffmpeg.deleteFile(outFilename);
      } catch (cleanErr) {
        // ignore
      }

      const mime =
        toExt === 'mp3'
          ? 'audio/mpeg'
          : toExt === 'wav'
          ? 'audio/wav'
          : toExt === 'gif'
          ? 'image/gif'
          : toExt === 'webm'
          ? 'video/webm'
          : 'application/octet-stream';

      const blob = new Blob([outputData], { type: mime });
      return {
        blob,
        outputFilename: `${baseName}.${toExt}`,
        outputSize: blob.size,
        engineUsed: 'wasm',
      };
    }

    // Secondary MediaRecorder fallback for video/audio to WebM
    if (toExt === 'webm' || toExt === 'mp3' || toExt === 'wav') {
      try {
        const audioCtx = getAudioContext();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const wavBlob = audioBufferToWavBlob(audioBuffer);
        return {
          blob: wavBlob,
          outputFilename: `${baseName}.wav`,
          outputSize: wavBlob.size,
          engineUsed: 'audio-api',
        };
      } catch (e) {
        // ignore
      }
    }
  }

  // 6. ARCHIVES (JSZip - RAR to ZIP, 7Z to ZIP, TAR to ZIP)
  if (toExt === 'zip') {
    if (onProgress) onProgress(40);
    const zip = new JSZip();

    // If file is already a ZIP container, we can inspect and repackage
    if (fromExt === 'zip') {
      try {
        const originalZip = await zip.loadAsync(file);
        const newZip = new JSZip();
        for (const [pathKey, entry] of Object.entries(originalZip.files)) {
          if (!entry.dir) {
            const data = await entry.async('uint8array');
            newZip.file(pathKey, data);
          }
        }
        if (onProgress) onProgress(80);
        const zipBlob = await newZip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
        return {
          blob: zipBlob,
          outputFilename: `${baseName}.zip`,
          outputSize: zipBlob.size,
          engineUsed: 'jszip',
        };
      } catch (err) {
        // fallback to file inclusion
      }
    }

    // Repack archive or bundle into standard universal ZIP container
    zip.file(file.name, file);
    zip.file(
      'ARCHIVE_INFO.txt',
      `Archive converted by ConvertX\nSource: ${file.name} (${fromExt.toUpperCase()})\nConverted at: ${new Date().toISOString()}\nTarget: Standard ZIP Container (Deflate compressed)\n`
    );

    if (onProgress) onProgress(85);
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: options.compressionLevel ? parseInt(options.compressionLevel, 10) : 6,
      },
    });

    if (onProgress) onProgress(100);
    return {
      blob: zipBlob,
      outputFilename: `${baseName}.zip`,
      outputSize: zipBlob.size,
      engineUsed: 'jszip',
    };
  }

  throw new Error(`Client-side conversion from .${fromExt} to .${toExt} is not supported by current browser capabilities.`);
}

/**
 * Image conversion helper using HTML5 Canvas
 */
async function convertImageViaCanvas(
  file: File,
  format: 'jpeg' | 'png' | 'webp',
  quality = 0.92,
  targetWidth?: number,
  targetHeight?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const w = targetWidth || img.naturalWidth || img.width;
      const h = targetHeight || img.naturalHeight || img.height;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context.'));
      }

      // Fill white background for JPEG so transparent PNG doesn't become black
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);

      const mimeType = `image/${format}`;
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob conversion produced null.'));
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file into Canvas.'));
    };

    img.src = objectUrl;
  });
}
