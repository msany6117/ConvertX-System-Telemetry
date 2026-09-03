import React from 'react';
import { UniversalUploader } from './UniversalUploader';
import { ToolItem, Language } from '../types';
import { TOOLS_LIST } from '../data/tools';
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface DedicatedToolPageProps {
  tool: ToolItem;
  language: Language;
  onNavigate: (route: string) => void;
}

export const DedicatedToolPage: React.FC<DedicatedToolPageProps> = ({
  tool,
  language,
  onNavigate,
}) => {
  // Find other tools in the same category for recommendation
  const relatedTools = TOOLS_LIST.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  ).slice(0, 4);

  const categoryNames: Record<string, { label: string; route: string }> = {
    image: { label: 'Image Tools', route: '/image' },
    video: { label: 'Video Tools', route: '/video' },
    audio: { label: 'Audio Tools', route: '/audio' },
    pdf: { label: 'PDF Tools', route: '/pdf' },
    document: { label: 'Document Tools', route: '/documents' },
    compression: { label: 'Compression Tools', route: '/compress' },
    utility: { label: 'Utilities', route: '/tools' },
  };

  const catInfo = categoryNames[tool.category] || { label: 'Tools', route: '/tools' };
  const targetFormat = tool.outputFormats?.[0] || tool.defaultTarget;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={() => onNavigate('/')}
          className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
        >
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <button
          onClick={() => onNavigate(catInfo.route)}
          className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
        >
          {catInfo.label}
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-slate-900 dark:text-slate-200 font-semibold">{tool.name}</span>
      </nav>

      {/* Tool Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>100% Free • Client-Side Security • No Upload Limits</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          {tool.name} Converter
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {tool.description}
        </p>

        {/* Feature Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Zero Server Logs
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" /> Instant Processing
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-blue-500" /> Lossless Precision
          </span>
        </div>
      </div>

      {/* Primary Conversion Dropzone */}
      <UniversalUploader
        language={language}
        presetTargetFormat={targetFormat}
        presetCategory={tool.category}
      />

      {/* 3-Step Guide */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">
          How to use {tool.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold mb-3">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Select or Drop Files</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag your files into the box above, or choose from device, Google Drive, or Dropbox.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold mb-3">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Fine-Tune Settings (Optional)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adjust quality, dimensions, compression levels, or audio bitrates if desired.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold mb-3">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Download Converted File</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant conversion directly in your browser. Download single files or an organized ZIP.
            </p>
          </div>
        </div>
      </div>

      {/* Related Category Tools */}
      {relatedTools.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              More {catInfo.label}
            </h2>
            <button
              onClick={() => onNavigate(catInfo.route)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((rel) => (
              <button
                key={rel.id}
                onClick={() => onNavigate(rel.route)}
                className="flex flex-col text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-850 dark:hover:border-blue-500 group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {rel.name}
                  </span>
                  {rel.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-medium">
                      {rel.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {rel.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
