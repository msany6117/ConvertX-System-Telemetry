import React, { useState, useRef, useEffect } from 'react';
import { Crop, RotateCw, FlipHorizontal, Download, Check, Sliders, Move } from 'lucide-react';

type AspectRatioPreset = 'free' | '1:1' | '4:5' | '16:9' | '9:16' | '3:1';

export const ImageCropTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('1:1');
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('cropped_image');
  const [outputFormat, setOutputFormat] = useState<'webp' | 'png' | 'jpeg'>('webp');
  const [quality, setQuality] = useState<number>(92);

  // Crop adjustments
  const [zoom, setZoom] = useState<number>(100); // 100% to 200%
  const [offsetX, setOffsetX] = useState<number>(50); // 0 to 100% center
  const [offsetY, setOffsetY] = useState<number>(50); // 0 to 100% center
  const [imgNaturalWidth, setImgNaturalWidth] = useState<number>(0);
  const [imgNaturalHeight, setImgNaturalHeight] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name.replace(/\.[^/.]+$/, ''));
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setDownloadUrl(null);
      setZoom(100);
      setOffsetX(50);
      setOffsetY(50);
      setRotation(0);
      setFlipH(false);

      const img = new Image();
      img.onload = () => {
        setImgNaturalWidth(img.naturalWidth || img.width);
        setImgNaturalHeight(img.naturalHeight || img.height);
      };
      img.src = url;
    }
  };

  // Compute calculated dimensions based on aspect ratio
  const getOutputDimensions = () => {
    if (!imgNaturalWidth || !imgNaturalHeight) return { width: 0, height: 0 };
    const scaledWidth = imgNaturalWidth * (zoom / 100);
    const scaledHeight = imgNaturalHeight * (zoom / 100);

    let cropW = scaledWidth;
    let cropH = scaledHeight;

    if (aspectRatio === '1:1') {
      const minDim = Math.min(scaledWidth, scaledHeight);
      cropW = minDim;
      cropH = minDim;
    } else if (aspectRatio === '4:5') {
      cropW = Math.min(scaledWidth, (scaledHeight * 4) / 5);
      cropH = (cropW * 5) / 4;
    } else if (aspectRatio === '16:9') {
      cropW = Math.min(scaledWidth, (scaledHeight * 16) / 9);
      cropH = (cropW * 9) / 16;
    } else if (aspectRatio === '9:16') {
      cropH = Math.min(scaledHeight, (scaledWidth * 16) / 9);
      cropW = (cropH * 9) / 16;
    } else if (aspectRatio === '3:1') {
      cropW = Math.min(scaledWidth, scaledHeight * 3);
      cropH = cropW / 3;
    }

    return {
      width: Math.round(cropW),
      height: Math.round(cropH),
    };
  };

  const { width: outWidth, height: outHeight } = getOutputDimensions();

  const handleApplyCrop = () => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: targetWidth, height: targetHeight } = getOutputDimensions();
      canvas.width = Math.max(1, targetWidth);
      canvas.height = Math.max(1, targetHeight);

      ctx.save();

      // Handle orientation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);

      // Handle zoom and reposition offset
      const scale = zoom / 100;
      const drawW = img.width * scale;
      const drawH = img.height * scale;

      const deltaX = (offsetX - 50) / 100 * (drawW - canvas.width);
      const deltaY = (offsetY - 50) / 100 * (drawH - canvas.height);

      ctx.drawImage(
        img,
        -drawW / 2 - deltaX,
        -drawH / 2 - deltaY,
        drawW,
        drawH
      );

      ctx.restore();

      const mime = outputFormat === 'png' ? 'image/png' : outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const url = canvas.toDataURL(mime, quality / 100);
      setDownloadUrl(url);
    };
    img.src = imageSrc;
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl p-6 md:p-8 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80 transition-all">
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
          className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center hover:border-indigo-500 cursor-pointer transition-all duration-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-pink-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 ring-1 ring-indigo-500/20 group-hover:scale-110 transition-transform">
            <Crop className="h-8 w-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-800 dark:text-white">Choose Image to Crop & Rotate</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            Interactive drag offsets, aspect ratio presets (1:1, 4:5, 16:9, 9:16), zoom controls, and live output rendering.
          </p>
          <button className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
            Select Photo
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base">{fileName}</span>
              <p className="text-xs text-slate-400">
                Source: {imgNaturalWidth} × {imgNaturalHeight} px • Estimated Output: {outWidth} × {outHeight} px
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Choose different image
            </button>
          </div>

          {/* Aspect Ratio Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Aspect Ratio Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: '1:1', label: '1:1 Square (Instagram/Avatar)' },
                { id: '4:5', label: '4:5 Portrait (IG Feed)' },
                { id: '16:9', label: '16:9 Wide (YouTube/Landscape)' },
                { id: '9:16', label: '9:16 Reel / Story / TikTok' },
                { id: '3:1', label: '3:1 Twitter Header' },
                { id: 'free', label: 'Freeform' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setAspectRatio(preset.id as AspectRatioPreset);
                    setDownloadUrl(null);
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    aspectRatio === preset.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Zoom & Position Offsets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Zoom Scale</span>
                <span>{zoom}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="250"
                value={zoom}
                onChange={(e) => {
                  setZoom(parseInt(e.target.value, 10));
                  setDownloadUrl(null);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Horizontal Offset</span>
                <span>{offsetX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={offsetX}
                onChange={(e) => {
                  setOffsetX(parseInt(e.target.value, 10));
                  setDownloadUrl(null);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Vertical Offset</span>
                <span>{offsetY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={offsetY}
                onChange={(e) => {
                  setOffsetY(parseInt(e.target.value, 10));
                  setDownloadUrl(null);
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Orientation & Format Options */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFlipH(!flipH);
                  setDownloadUrl(null);
                }}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  flipH
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <FlipHorizontal className="h-4 w-4" />
                <span>Flip Horizontal</span>
              </button>
              <button
                onClick={() => {
                  setRotation((r) => (r + 90) % 360);
                  setDownloadUrl(null);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <RotateCw className="h-4 w-4" />
                <span>Rotate 90° ({rotation}°)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Format:</span>
              <select
                value={outputFormat}
                onChange={(e: any) => setOutputFormat(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="webp">WEBP</option>
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
              </select>
            </div>
          </div>

          {/* Interactive Live Crop Preview Viewport */}
          <div className="relative flex items-center justify-center rounded-2xl bg-slate-900/90 p-6 min-h-[320px] max-h-[440px] overflow-hidden shadow-inner border border-slate-800">
            <div
              className="relative overflow-hidden rounded-xl border-2 border-indigo-400 shadow-2xl transition-all"
              style={{
                aspectRatio:
                  aspectRatio === '1:1'
                    ? '1/1'
                    : aspectRatio === '4:5'
                    ? '4/5'
                    : aspectRatio === '16:9'
                    ? '16/9'
                    : aspectRatio === '9:16'
                    ? '9/16'
                    : aspectRatio === '3:1'
                    ? '3/1'
                    : 'auto',
                maxHeight: '320px',
                maxWidth: '100%',
              }}
            >
              {/* Corner handles */}
              <div className="absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 border-white z-20" />
              <div className="absolute top-0 right-0 h-3 w-3 border-t-2 border-r-2 border-white z-20" />
              <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-white z-20" />
              <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-white z-20" />

              {/* Composition Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-30">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              <img
                src={imageSrc}
                alt="preview"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scale(${zoom / 100}) translate(${(offsetX - 50) * 0.5}%, ${(offsetY - 50) * 0.5}%)`,
                  maxHeight: '320px',
                  objectFit: 'contain',
                }}
                className="transition-transform duration-100 select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Action and Download */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 gap-3">
            <button
              onClick={handleApplyCrop}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Apply & Render Crop</span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${fileName}_crop.${outputFormat}`}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download {outWidth}×{outHeight} {outputFormat.toUpperCase()}</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
