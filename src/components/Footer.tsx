import React from 'react';
import { Layers, ShieldCheck, Heart, Github, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { en } from '../locales/en';
import { bn } from '../locales/bn';

interface FooterProps {
  language: Language;
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onNavigate }) => {
  const t = language === 'bn' ? bn : en;

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm shadow-blue-500/30">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Convert<span className="text-blue-600">X</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Private • Files Deleted After 1 Hour</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Popular Tools
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('/tools/image-resizer')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Image Resizer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tools/image-crop')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Image Cropper
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tools/merge-pdf')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Merge PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tools/compress-pdf')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Compress PDF
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tools/unit-converter')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Unit Converter
                </button>
              </li>
            </ul>
          </div>

          {/* Media Categories */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Categories
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('/tools')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Video Converters
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tools')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Audio Converters
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tools')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Document Converters
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/tools/timezone-converter')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  World Time Zones
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  System Telemetry
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Company */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Company & Legal
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/faq')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  FAQ
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-blue-600 dark:hover:text-blue-400">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 border-t border-slate-100 dark:border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} ConvertX. Free Open Source File Conversion Suite.</p>
          <div className="flex items-center gap-1">
            <span>Engineered for privacy, reliability & speed</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
