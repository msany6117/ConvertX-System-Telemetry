import React, { useState, useRef } from 'react';
import { Crop, RotateCw, FlipHorizontal, Download, RefreshCw, Check } from 'lucide-react';

export const ImageCropTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '9:16'>('1:1');
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('cropped_image');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name.replace(/\.[^/.]+$/, ''));
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setDownloadUrl(null);
    }
  };

  const handleApplyCrop = () => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let cropWidth = img.width;
      let cropHeight = img.height;

      if (aspectRatio === '1:1') {
        const size = Math.min(img.width, img.height);
        cropWidth = size;
        cropHeight = size;
      } else if (aspectRatio === '16:9') {
        cropWidth = img.width;
        cropHeight = Math.round((img.width * 9) / 16);
        if (cropHeight > img.height) {
          cropHeight = img.height;
          cropWidth = Math.round((img.height * 16) / 9);
        }
      } else if (aspectRatio === '4:3') {
        cropWidth = img.width;
        cropHeight = Math.round((img.width * 3) / 4);
        if (cropHeight > img.height) {
          cropHeight = img.height;
          cropWidth = Math.round((img.height * 4) / 3);
        }
      } else if (aspectRatio === '9:16') {
        cropHeight = img.height;
        cropWidth = Math.round((img.height * 9) / 16);
        if (cropWidth > img.width) {
          cropWidth = img.width;
          cropHeight = Math.round((img.width * 16) / 9);
        }
      }

      const startX = (img.width - cropWidth) / 2;
      const startY = (img.height - cropHeight) / 2;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.save();
      if (flipH) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      ctx.restore();

      const url = canvas.toDataURL('image/webp', 0.92);
      setDownloadUrl(url);
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
            <Crop className="h-7 w-7" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 dark:text-white">Choose Image to Crop</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supports Square 1:1, 16:9, 4:3, 9:16 or Freeform</p>
          <button className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm">
            Select Photo
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white text-base">{fileName}</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Choose different image
            </button>
          </div>

          {/* Aspect Ratio Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Crop Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-2">
              {(['1:1', '16:9', '4:3', '9:16', 'free'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    aspectRatio === ratio
                      ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {ratio === '1:1' ? '1:1 Square' : ratio === '16:9' ? '16:9 Wide' : ratio === '4:3' ? '4:3 Standard' : ratio === '9:16' ? '9:16 Portrait' : 'Freeform'}
                </button>
              ))}
            </div>
          </div>

          {/* Transform options */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFlipH(!flipH)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                flipH ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <FlipHorizontal className="h-4 w-4" />
              <span>Flip Horizontal</span>
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCw className="h-4 w-4" />
              <span>Rotate 90° ({rotation}°)</span>
            </button>
          </div>

          {/* Preview canvas / image */}
          <div className="flex items-center justify-center rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/60 max-h-96 overflow-hidden">
            <img
              src={imageSrc}
              alt="preview"
              style={{
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                maxHeight: '340px',
                objectFit: 'contain',
              }}
              className="rounded-lg shadow-sm transition-transform"
            />
          </div>

          {/* Action and Download */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 gap-3">
            <button
              onClick={handleApplyCrop}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              <Check className="h-4 w-4" />
              <span>Generate Cropped Image</span>
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`${fileName}_cropped.webp`}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                <Download className="h-4 w-4" />
                <span>Download Cropped WEBP</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
