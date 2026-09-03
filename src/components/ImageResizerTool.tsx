import React, { useState, useRef } from 'react';
import { Upload, Maximize2, Lock, Unlock, Download, RefreshCw, Check } from 'lucide-react';

export const ImageResizerTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp'>('webp');
  const [fileName, setFileName] = useState<string>('resized_image');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name.replace(/\.[^/.]+$/, ''));
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setDownloadUrl(null);

      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setTargetWidth(img.width);
        setTargetHeight(img.height);
      };
      img.src = url;
    }
  };

  const handleWidthChange = (w: number) => {
    setTargetWidth(w);
    if (lockRatio && originalWidth > 0) {
      setTargetHeight(Math.round((w / originalWidth) * originalHeight));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetHeight(h);
    if (lockRatio && originalHeight > 0) {
      setTargetWidth(Math.round((h / originalHeight) * originalWidth));
    }
  };

  const applyPreset = (w: number, h: number) => {
    setLockRatio(false);
    setTargetWidth(w);
    setTargetHeight(h);
  };

  const handleResize = () => {
    if (!imageSrc || targetWidth <= 0 || targetHeight <= 0) return;
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const mime = `image/${outputFormat}`;
        const dataUrl = canvas.toDataURL(mime, 0.9);
        setDownloadUrl(dataUrl);
      }
      setIsProcessing(false);
    };
    img.src = imageSrc;
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!imageSrc ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center hover:border-blue-500 cursor-pointer transition-colors"
        >
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <Maximize2 className="h-7 w-7" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 dark:text-white">Choose Image to Resize</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports JPG, PNG, WEBP, AVIF, GIF</p>
          <button className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm">
            Select Image
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Bar with original dimensions */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base">{fileName}</span>
              <p className="text-xs text-slate-400">
                Original Size: {originalWidth} × {originalHeight} px
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Choose different image
            </button>
          </div>

          {/* Social Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Popular Dimensions & Social Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset(1080, 1080)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Instagram Post (1080×1080)
              </button>
              <button
                onClick={() => applyPreset(1080, 1920)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Instagram Story (1080×1920)
              </button>
              <button
                onClick={() => applyPreset(1280, 720)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                YouTube Thumbnail (1280×720)
              </button>
              <button
                onClick={() => applyPreset(1200, 675)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Twitter / X (1200×675)
              </button>
            </div>
          </div>

          {/* Custom Dimension Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Width (pixels)
              </label>
              <input
                type="number"
                value={targetWidth}
                onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLockRatio(!lockRatio)}
                className={`rounded-xl border p-2 text-xs font-medium transition-colors ${
                  lockRatio
                    ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    : 'border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
                title={lockRatio ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
              >
                {lockRatio ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              </button>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Height (pixels)
                </label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Output Format
              </label>
              <select
                value={outputFormat}
                onChange={(e: any) => setOutputFormat(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="webp">WEBP (Recommended)</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
              </select>
            </div>
          </div>

          {/* Action and Download */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 gap-3">
            <button
              onClick={handleResize}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              {isProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Resize Image</span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${fileName}_resized.${outputFormat}`}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                <Download className="h-4 w-4" />
                <span>Download {targetWidth}×{targetHeight} {outputFormat.toUpperCase()}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
