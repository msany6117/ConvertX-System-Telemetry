import React from 'react';
import { ShieldCheck, Clock, Lock, Cpu } from 'lucide-react';

export const TrustPrivacySection: React.FC = () => {
  const pillars = [
    {
      title: 'Client-first architecture',
      description: 'Whenever possible, files process locally in your browser with WebAssembly and Canvas. They never touch a remote server.',
      icon: Cpu,
    },
    {
      title: 'Automatic 1-hour destruction',
      description: 'Files processed through cloud fallback workers are isolated in randomized directories and permanently purged after 60 minutes.',
      icon: Clock,
    },
    {
      title: 'End-to-end encryption',
      description: 'Every byte transmitted to ConvertX travels through TLS 1.3 / HTTPS encryption. Uploads cannot be intercepted in transit.',
      icon: Lock,
    },
    {
      title: 'Zero data monetization',
      description: 'We do not inspect contents, harvest telemetry, train AI models on user files, or sell data to advertisers.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="w-full py-16 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Integrity & Privacy
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Your files stay yours.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Engineered with strict privacy defaults. You retain 100% ownership of your documents.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 dark:border-slate-800 dark:bg-slate-900/60 shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
