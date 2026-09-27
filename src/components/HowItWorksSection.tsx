import React from 'react';
import { UploadCloud, RefreshCw, Download, ArrowRight } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload your files',
      description: 'Drag & drop any media, PDF, document, or spreadsheet up to 500 MB. Instant client-side inspection.',
      icon: UploadCloud,
    },
    {
      step: '02',
      title: 'Choose target format',
      description: 'Select your preferred output format from 50+ choices or fine-tune quality, dimensions, and audio bitrates.',
      icon: RefreshCw,
    },
    {
      step: '03',
      title: 'Download & wipe',
      description: 'Instant download. Files are wiped automatically after 1 hour with zero data retention or inspection.',
      icon: Download,
    },
  ];

  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Workflow Simplicity
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Three simple steps to finished files.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Engineered to remove friction. No accounts required, no waiting in queues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col rounded-2xl border border-slate-200/80 bg-white/70 p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/60 shadow-xs"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black tracking-tight text-slate-300 dark:text-slate-700">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
