import React from 'react';
import { ShieldCheck, Github, Twitter, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  language?: Language;
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1: Brand & Identity */}
          <div className="col-span-2 sm:col-span-1 md:col-span-1 space-y-3">
            <div
              className="cursor-pointer"
              onClick={() => onNavigate('/')}
            >
              <BrandLogo variant="mark-with-text" size="md" showSubtitle={true} />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Simple tools for your files. Fast, private, client-first media conversion, compression, and AI intelligence.
            </p>

            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>100% private • Files purged after 1 hour</span>
            </div>
          </div>

          {/* Column 2: File Converters */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              File Tools
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/image')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Image Converter
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/compress')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  File Compressor
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/pdf')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  PDF Suite
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/video')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Video & Audio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/documents')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Documents
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: AI Suite */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>AI Suite</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/ai/translate')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  AI Translator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/ai/rewrite')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  AI Rewriter
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/ai/summarize')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  AI Summarizer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/ai/grammar')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  AI Grammar Fixer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/ai/code-assistant')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  AI Code Assistant
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/ai/chat')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Ask ConvertX AI
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/faq')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  FAQ & Guides
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  System & AI Telemetry
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Security Details
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ConvertX — File Converter & Multi-AI Toolbox. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
