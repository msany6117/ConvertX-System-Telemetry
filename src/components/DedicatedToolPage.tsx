import React from 'react';
import { UniversalUploader } from './UniversalUploader';
import { ToolItem, Language } from '../types';
import { TOOLS_LIST } from '../data/tools';
import { getTranslation } from '../locales';
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  FileCheck,
  Lock,
  Layers,
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
  const t = getTranslation(language);
  const relatedTools = TOOLS_LIST.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  ).slice(0, 4);

  const categoryNames: Record<string, { label: string; route: string }> = {
    image: { label: `${t.nav.image} Tools`, route: '/image' },
    video: { label: `${t.nav.video} Tools`, route: '/video' },
    audio: { label: `${t.nav.audio} Tools`, route: '/audio' },
    pdf: { label: `${t.nav.pdf} Tools`, route: '/pdf' },
    document: { label: `${t.nav.documents} Tools`, route: '/documents' },
    compression: { label: `${t.nav.compress} Tools`, route: '/compress' },
    utility: { label: t.nav.tools, route: '/tools' },
  };

  const catInfo = categoryNames[tool.category] || { label: 'Tools', route: '/tools' };
  const targetFormat = tool.outputFormats?.[0] || tool.defaultTarget;

  const faqs = [
    {
      q: `How do I convert to ${targetFormat?.toUpperCase()}?`,
      a: `Simply drag and drop your file into the box above, confirm ${targetFormat?.toUpperCase()} is selected, and click Convert. Your file will process immediately.`,
    },
    {
      q: 'Will my original quality be preserved?',
      a: 'Yes. ConvertX utilizes lossless or high-fidelity encoders (MozJPEG, WebP, Sharp, and FFmpeg) to maintain the crispest possible resolution and audio bitrates.',
    },
    {
      q: 'Is this conversion safe and private?',
      a: 'Completely. Whenever supported, the file converts inside your browser with client-side WebAssembly. If server processing is used, files are permanently deleted after 1 hour.',
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={() => onNavigate('/')}
          className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <button
          onClick={() => onNavigate(catInfo.route)}
          className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          {catInfo.label}
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900 dark:text-white">{tool.name}</span>
      </nav>

      {/* Hero Section — Headline & Converter ABOVE THE FOLD */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span>{catInfo.label}</span>
          <span>·</span>
          <span>Fast & Secure</span>
        </div>

        {(() => {
          const nameLower = tool.name.toLowerCase();
          const displayTitle =
            nameLower.endsWith('converter') ||
            nameLower.endsWith('compressor') ||
            nameLower.endsWith('resizer') ||
            nameLower.endsWith('cropper') ||
            nameLower.endsWith('suite') ||
            nameLower.endsWith('tools')
              ? tool.name
              : `${tool.name} Converter`;

          return (
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {displayTitle}
            </h1>
          );
        })()}

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {tool.description}
        </p>

        {/* Feature summary row */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Zero data logging
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" /> Instant processing
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <FileCheck className="h-4 w-4 text-indigo-500" /> High fidelity
          </span>
        </div>
      </div>

      {/* Central Interactive Converter Tool */}
      <div className="max-w-4xl mx-auto">
        <UniversalUploader
          language={language}
          presetTargetFormat={targetFormat}
          presetCategory={tool.category}
        />
      </div>

      {/* How It Works (3 Steps) */}
      <div className="max-w-4xl mx-auto pt-8 border-t border-slate-200/80 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-8">
          How to convert with {tool.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <span className="text-2xl font-black text-slate-300 dark:text-slate-700">01</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Choose your file</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select or drop any {tool.inputFormats.join(', ').toUpperCase()} file up to 500 MB.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-black text-slate-300 dark:text-slate-700">02</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Convert</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ConvertX transforms your file into {tool.outputFormats.join(', ').toUpperCase()} in seconds.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-2xl font-black text-slate-300 dark:text-slate-700">03</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Download result</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download your converted file directly. Files auto-destroy after 1 hour.
            </p>
          </div>
        </div>
      </div>

      {/* Supported Formats Specs */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Supported Format Specifications
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Input Formats: </span>
            <span>{tool.inputFormats.map((f) => f.toUpperCase()).join(', ')}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Output Formats: </span>
            <span>{tool.outputFormats.map((f) => f.toUpperCase()).join(', ')}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Max File Size: </span>
            <span>500 MB Per File (100% Free)</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">Security: </span>
            <span>Client-side WebAssembly & sandboxed workers</span>
          </div>
        </div>
      </div>

      {/* Tool-specific FAQ */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 text-xs"
            >
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">{faq.q}</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <div className="max-w-5xl mx-auto pt-8 border-t border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Related {catInfo.label}
            </h3>
            <button
              onClick={() => onNavigate(catInfo.route)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              View all →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onNavigate(rel.route)}
                className="group rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 transition-all cursor-pointer shadow-xs"
              >
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {rel.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {rel.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Open tool</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
