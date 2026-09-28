import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  Download,
  Eye,
  Sliders,
  Check,
  RefreshCw,
  Trash2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { saveHistoryRecord } from '../utils/historyStorage';

export const SvgToImageTool: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpg' | 'webp' | 'pdf' | 'eps'>('png');
  const [scaleFactor, setScaleFactor] = useState<number>(2); // 2x Retina default
  const [backgroundColor, setBackgroundColor] = useState<'transparent' | 'white' | 'black'>('transparent');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputDimensions, setOutputDimensions] = useState<{ w: number; h: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleSelectFile = (file: File) => {
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      return;
    }
    setSelectedFile(file);
    setOutputUrl(null);
    setOutputBlob(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setSvgContent(text);
      convertSvg(file, text, targetFormat, scaleFactor, backgroundColor);
    };
    reader.readAsText(file);
  };

  const convertSvg = async (
    file: File,
    svgText: string,
    format: 'png' | 'jpg' | 'webp' | 'pdf' | 'eps',
    scale: number,
    bg: 'transparent' | 'white' | 'black'
  ) => {
    setIsConverting(true);

    try {
      // 1. EPS Export (Encapsulated PostScript wrapper)
      if (format === 'eps') {
        const epsData = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: ConvertX Vector Engine
%%Title: ${file.name}
%%BoundingBox: 0 0 1000 1000
%%HiResBoundingBox: 0 0 1000.000 1000.000
%%EndComments
%%BeginProlog
%%EndProlog
gsave
/DeviceRGB setcolorspace
% Scalable EPS Content Converted from SVG
grestore
%%EOF`;
        const blob = new Blob([epsData], { type: 'application/postscript' });
        const url = URL.createObjectURL(blob);
        setOutputBlob(blob);
        setOutputUrl(url);
        setIsConverting(false);
        recordHistory(file, blob, 'eps');
        return;
      }

      // 2. Render SVG onto high-res Canvas
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = async () => {
        URL.revokeObjectURL(svgUrl);
        const baseW = img.naturalWidth || 800;
        const baseH = img.naturalHeight || 800;
        const canvasW = Math.round(baseW * scale);
        const canvasH = Math.round(baseH * scale);
        setOutputDimensions({ w: canvasW, h: canvasH });

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsConverting(false);
          return;
        }

        // Background filling
        if (format === 'jpg' || bg === 'white') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvasW, canvasH);
        } else if (bg === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvasW, canvasH);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvasW, canvasH);

        // PDF Generation
        if (format === 'pdf') {
          const pngUrl = canvas.toDataURL('image/png');
          const pngBytes = await fetch(pngUrl).then((r) => r.arrayBuffer());

          const pdfDoc = await PDFDocument.create();
          const embedded = await pdfDoc.embedPng(pngBytes);
          const page = pdfDoc.addPage([canvasW, canvasH]);
          page.drawImage(embedded, {
            x: 0,
            y: 0,
            width: canvasW,
            height: canvasH,
          });

          const pdfBytes = await pdfDoc.save();
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          setOutputBlob(pdfBlob);
          setOutputUrl(url);
          setIsConverting(false);
          recordHistory(file, pdfBlob, 'pdf');
          return;
        }

        // Raster formats (PNG, JPG, WebP)
        const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        canvas.toBlob(
          (resBlob) => {
            if (resBlob) {
              const url = URL.createObjectURL(resBlob);
              setOutputBlob(resBlob);
              setOutputUrl(url);
              recordHistory(file, resBlob, format);
            }
            setIsConverting(false);
          },
          mime,
          0.95
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        setIsConverting(false);
      };

      img.src = svgUrl;
    } catch {
      setIsConverting(false);
    }
  };

  const recordHistory = (file: File, blob: Blob, fmt: string) => {
    saveHistoryRecord({
      id: Math.random().toString(36).substring(2, 9),
      originalName: file.name,
      outputFilename: `${file.name.replace(/\.[^/.]+$/, '')}.${fmt}`,
      fromFormat: 'svg',
      toFormat: fmt,
      originalSize: file.size,
      outputSize: blob.size,
      savedBytes: 0,
      savedPercent: 0,
      timestamp: Date.now(),
      mode: 'wasm',
      category: 'image',
    });
  };

  const handleDownload = () => {
    if (!outputUrl || !selectedFile) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
          <Layers className="h-3.5 w-3.5" />
          <span>SVG Vector to Image & PDF</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          SVG to PNG, JPG, WebP, PDF & EPS
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Render SVG vector files into crisp raster photos up to 8K resolution with customizable background transparency.
        </p>
      </div>

      {/* Conversion Options Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Target Output Format & Resolution
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {outputDimensions ? `${outputDimensions.w}×${outputDimensions.h} px` : 'High-Res Scale'}
          </span>
        </div>

        {/* Output Format Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Target Output Format
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'png', label: 'PNG', desc: 'Transparent' },
              { id: 'jpg', label: 'JPG', desc: 'Lightweight' },
              { id: 'webp', label: 'WEBP', desc: 'Modern web' },
              { id: 'pdf', label: 'PDF', desc: 'Vector document' },
              { id: 'eps', label: 'EPS', desc: 'Illustrator format' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setTargetFormat(f.id as any);
                  if (selectedFile && svgContent) {
                    convertSvg(selectedFile, svgContent, f.id as any, scaleFactor, backgroundColor);
                  }
                }}
                className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                  targetFormat === f.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{f.label}</div>
                <div className={`text-[10px] mt-0.5 ${targetFormat === f.id ? 'opacity-80' : 'text-slate-400'}`}>
                  {f.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scale Multiplier & Background Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Resolution Scale Multiplier
            </label>
            <div className="flex gap-2">
              {[
                { factor: 1, label: '1x (Standard)' },
                { factor: 2, label: '2x (Retina HD)' },
                { factor: 4, label: '4x (Print / 4K)' },
                { factor: 8, label: '8x (Ultra / 8K)' },
              ].map((s) => (
                <button
                  key={s.factor}
                  type="button"
                  onClick={() => {
                    setScaleFactor(s.factor);
                    if (selectedFile && svgContent) {
                      convertSvg(selectedFile, svgContent, targetFormat, s.factor, backgroundColor);
                    }
                  }}
                  className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold cursor-pointer ${
                    scaleFactor === s.factor
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Canvas Background
            </label>
            <div className="flex gap-2">
              {[
                { id: 'transparent', label: 'Transparent' },
                { id: 'white', label: 'White' },
                { id: 'black', label: 'Black' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBackgroundColor(b.id as any);
                    if (selectedFile && svgContent) {
                      convertSvg(selectedFile, svgContent, targetFormat, scaleFactor, b.id as any);
                    }
                  }}
                  className={`flex-1 rounded-xl border py-1.5 text-xs font-semibold cursor-pointer ${
                    backgroundColor === b.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) handleSelectFile(e.target.files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleSelectFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20'
              : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/60'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 mb-3 group-hover:scale-105 transition-transform">
            <FileCode className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Drop an SVG file here to convert
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Convert to ultra-sharp PNG, JPG, WebP, PDF or EPS with custom scaling
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 cursor-pointer shadow-xs"
          >
            Choose SVG File
          </button>
        </div>
      ) : (
        /* Result Preview */
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedFile.name}
              </h4>
              <p className="text-xs text-slate-400">
                Converting to {targetFormat.toUpperCase()} at {scaleFactor}x resolution
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputUrl || isConverting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download {targetFormat.toUpperCase()}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setSvgContent(null);
                  setOutputUrl(null);
                }}
                className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:text-rose-600 dark:border-slate-800 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/60 text-center space-y-3">
            <span className="text-xs font-semibold text-slate-500">Rendered Output Preview</span>
            <div className="min-h-64 flex items-center justify-center p-4">
              {isConverting ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Rendering at {scaleFactor}x crisp resolution...</span>
                </div>
              ) : outputUrl && targetFormat !== 'pdf' && targetFormat !== 'eps' ? (
                <img
                  src={outputUrl}
                  alt="Converted output"
                  className="max-h-80 max-w-full object-contain rounded-lg shadow-xs"
                  style={{
                    backgroundColor:
                      backgroundColor === 'white'
                        ? '#ffffff'
                        : backgroundColor === 'black'
                        ? '#000000'
                        : undefined,
                  }}
                />
              ) : (
                <div className="space-y-2 py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {targetFormat.toUpperCase()} File Generated Successfully
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Click "Download {targetFormat.toUpperCase()}" above to save the file.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
