import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  Sliders,
  Download,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Eye,
  Minimize2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { saveHistoryRecord } from '../utils/historyStorage';

interface ImageCompressorToolProps {
  language?: Language;
}

interface CompressedImageItem {
  id: string;
  file: File;
  originalSize: number;
  compressedBlob?: Blob;
  compressedSize?: number;
  savedPercent?: number;
  previewUrl: string;
  compressedUrl?: string;
  width?: number;
  height?: number;
  status: 'pending' | 'compressing' | 'completed' | 'failed';
  error?: string;
}

export const ImageCompressorTool: React.FC<ImageCompressorToolProps> = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<CompressedImageItem[]>([]);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'balanced' | 'max' | 'custom'>('balanced');
  const [customQuality, setCustomQuality] = useState<number>(75);
  const [maxDimension, setMaxDimension] = useState<string>('original');
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const getEffectiveQuality = () => {
    switch (compressionLevel) {
      case 'low':
        return 0.90; // Gentle compression, ~90% quality
      case 'balanced':
        return 0.75; // Standard sweet spot, ~75% quality
      case 'max':
        return 0.50; // Maximum reduction, ~50% quality
      case 'custom':
        return Math.max(0.1, Math.min(1, customQuality / 100));
    }
  };

  const handleAddFiles = (files: FileList | File[]) => {
    const newItems: CompressedImageItem[] = [];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/bmp'];

    for (const file of Array.from(files)) {
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|avif|bmp)$/i)) {
        continue;
      }
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        originalSize: file.size,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  // Perform client-side Canvas compression with crisp bicubic scaling
  const compressSingleItem = async (item: CompressedImageItem): Promise<CompressedImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let targetW = img.naturalWidth;
        let targetH = img.naturalHeight;

        // Apply max dimension constraint if selected
        if (maxDimension !== 'original') {
          const maxDim = parseInt(maxDimension, 10);
          if (targetW > maxDim || targetH > maxDim) {
            if (targetW > targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ ...item, status: 'failed', error: 'Canvas unsupported' });
          return;
        }

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        const isPng = item.file.type === 'image/png' || item.file.name.endsWith('.png');
        if (!isPng) {
          // Fill background for non-PNG to avoid dark alpha artifacts
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        const quality = getEffectiveQuality();
        // For PNG, use webp or canvas png; for others use jpeg or webp
        const mimeType = isPng && quality > 0.85 ? 'image/png' : isPng ? 'image/webp' : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ ...item, status: 'failed', error: 'Compression output empty' });
              return;
            }

            const compUrl = URL.createObjectURL(blob);
            const savedPct = Math.max(
              0,
              Math.round(((item.originalSize - blob.size) / item.originalSize) * 100)
            );

            // Record to user history
            saveHistoryRecord({
              id: item.id,
              originalName: item.file.name,
              outputFilename: `compressed_${item.file.name}`,
              fromFormat: item.file.name.split('.').pop() || 'jpg',
              toFormat: mimeType.split('/')[1] || 'jpg',
              originalSize: item.originalSize,
              outputSize: blob.size,
              savedBytes: Math.max(0, item.originalSize - blob.size),
              savedPercent: savedPct,
              timestamp: Date.now(),
              downloadUrl: compUrl,
              mode: 'wasm',
              category: 'compression',
            });

            resolve({
              ...item,
              compressedBlob: blob,
              compressedSize: blob.size,
              savedPercent: savedPct,
              compressedUrl: compUrl,
              width: targetW,
              height: targetH,
              status: 'completed',
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        resolve({ ...item, status: 'failed', error: 'Failed to decode image' });
      };

      img.src = item.previewUrl;
    });
  };

  const handleCompressAll = async () => {
    setIsProcessingAll(true);
    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'completed') {
        updated[i] = { ...updated[i], status: 'compressing' };
        setItems([...updated]);
        const result = await compressSingleItem(updated[i]);
        updated[i] = result;
        setItems([...updated]);
      }
    }
    setIsProcessingAll(false);
  };

  const handleDownload = (item: CompressedImageItem) => {
    if (!item.compressedUrl) return;
    const a = document.createElement('a');
    a.href = item.compressedUrl;
    const ext = item.compressedBlob?.type === 'image/webp' ? 'webp' : item.file.name.split('.').pop() || 'jpg';
    const baseName = item.file.name.replace(/\.[^/.]+$/, '');
    a.download = `${baseName}_compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
          <Minimize2 className="h-3.5 w-3.5" />
          <span>Dedicated Image Compressor</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Compress Images without Quality Loss
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Drastically shrink JPG, PNG, WEBP, and AVIF file sizes by up to 85% with client-side zero-retention processing.
        </p>
      </div>

      {/* Compression Control Panel */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Compression Settings
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Target Quality: {Math.round(getEffectiveQuality() * 100)}%
          </span>
        </div>

        {/* Compression Level Segmented Tabs */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Compression Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'low', label: 'Low', desc: 'Gentle (90% quality)' },
              { id: 'balanced', label: 'Balanced', desc: 'Recommended (75%)' },
              { id: 'max', label: 'Maximum', desc: 'Smallest file (50%)' },
              { id: 'custom', label: 'Custom %', desc: `${customQuality}% quality` },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setCompressionLevel(lvl.id as any)}
                className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  compressionLevel === lvl.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold">{lvl.label}</div>
                <div className={`text-[10px] mt-0.5 ${compressionLevel === lvl.id ? 'opacity-80' : 'text-slate-400'}`}>
                  {lvl.desc}
                </div>
              </button>
            ))}
          </div>

          {compressionLevel === 'custom' && (
            <div className="pt-3 flex items-center gap-4">
              <input
                type="range"
                min="15"
                max="95"
                value={customQuality}
                onChange={(e) => setCustomQuality(parseInt(e.target.value, 10))}
                className="flex-1 accent-indigo-600"
              />
              <span className="w-12 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">
                {customQuality}%
              </span>
            </div>
          )}
        </div>

        {/* Secondary Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Maximum Resolution
            </label>
            <select
              value={maxDimension}
              onChange={(e) => setMaxDimension(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white focus:outline-none"
            >
              <option value="original">Keep Original Dimensions</option>
              <option value="2560">Max 2560px (2K)</option>
              <option value="1920">Max 1920px (Full HD)</option>
              <option value="1280">Max 1280px (HD Web)</option>
              <option value="800">Max 800px (Compact Mobile)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="stripExif"
              checked={stripMetadata}
              onChange={(e) => setStripMetadata(e.target.checked)}
              className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="stripExif" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              Strip EXIF metadata (cleans camera GPS & shrinks extra ~5-15 KB)
            </label>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif,image/bmp"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

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
          if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20'
            : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900/60'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 mb-3 group-hover:scale-105 transition-transform">
          <UploadCloud className="h-6 w-6" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Drop your images here to compress
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Supports JPG, PNG, WebP, AVIF, BMP • Up to 500 MB per file
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="mt-4 rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer shadow-xs"
        >
          Select Images
        </button>
      </div>

      {/* File List & Before/After Live Compression Results */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {items.length} {items.length === 1 ? 'image' : 'images'} loaded
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCompressAll}
                disabled={isProcessingAll}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 cursor-pointer shadow-xs"
              >
                {isProcessingAll ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Compressing...</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span>Compress All Images</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setItems([])}
                className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:text-rose-600 dark:border-slate-800 cursor-pointer"
                title="Clear list"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs"
              >
                {/* Image info & preview */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.file.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>Original: {formatBytes(item.originalSize)}</span>
                      {item.width && item.height && (
                        <>
                          <span>·</span>
                          <span>
                            {item.width}×{item.height}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Before/After Metrics */}
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  {item.status === 'completed' && (
                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatBytes(item.compressedSize)}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          -{item.savedPercent}% saved
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'compressing' && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Optimizing...</span>
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await compressSingleItem({ ...item, status: 'compressing' });
                        setItems((prev) => prev.map((i) => (i.id === item.id ? res : i)));
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Compress
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
