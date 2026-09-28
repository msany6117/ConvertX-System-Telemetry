import React from 'react';
import { UniversalUploader } from './UniversalUploader';
import { Language } from '../types';
import { Sparkles, Image as ImageIcon, ArrowRight, ShieldCheck } from 'lucide-react';

interface ImageConverterToolProps {
  language?: Language;
  onNavigate?: (route: string) => void;
}

export const ImageConverterTool: React.FC<ImageConverterToolProps> = ({ language = 'en', onNavigate }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Universal Image Converter</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Convert Images between Any Format
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Seamlessly convert between JPG, PNG, WEBP, AVIF, HEIC, GIF, BMP, SVG, and TIFF. Fast client-side conversion with zero server retention.
        </p>

        {/* Quick Format Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          {[
            { label: 'JPG to PNG', route: '/tools/jpg-to-png' },
            { label: 'PNG to JPG', route: '/tools/png-to-jpg' },
            { label: 'HEIC to JPG', route: '/tools/heic-to-jpg' },
            { label: 'JPG to WEBP', route: '/tools/jpg-to-webp' },
            { label: 'Image to SVG', route: '/image-to-svg' },
            { label: 'SVG to PNG', route: '/svg-to-image' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate && onNavigate(item.route)}
              className="rounded-lg border border-slate-200/90 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Uploader set to Image category */}
      <UniversalUploader language={language} presetCategory="image" />

      {/* Feature Points */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center sm:text-left">
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Client-Side Speed
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Converts directly in your browser with HTML5 Canvas and WebAssembly. No files leave your device when converted locally.
          </p>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Wide Format Support
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Full support for transparent PNG, modern WebP/AVIF, Apple HEIC camera photos, and vector SVG exports.
          </p>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Strict Privacy
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            100% private. Files processed through our cloud fallback workers are securely purged every 60 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};
