import React from 'react';
import { ShieldCheck, Github, Twitter } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-slate-950/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1: Brand & Identity */}
          <div className="col-span-2 space-y-3">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => onNavigate('/')}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs dark:bg-white dark:text-slate-900">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 16V8a3.5 3.5 0 0 1 3.5-3.5h3" />
                  <path d="M7 13.5L10 16.5L7 19.5" />
                  <path d="M20 8v8a3.5 3.5 0 0 1-3.5 3.5h-3" />
                  <path d="M17 10.5L14 7.5L17 4.5" />
                  <path d="M9.5 9.5L14.5 14.5" />
                  <path d="M14.5 9.5L9.5 14.5" />
                </svg>
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                Convert<span className="text-indigo-600 dark:text-indigo-400">X</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Simple tools for your files. Fast, private, client-first media conversion, compression, and editing.
            </p>

            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>100% private • Files purged after 1 hour</span>
            </div>
          </div>

          {/* Column 2: Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Tools
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/image')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Image
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/pdf')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/video')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Video
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/audio')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Audio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/documents')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Document
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
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
                  Blog & Guides
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/pricing')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Pricing
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

          {/* Column 4: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Security
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ConvertX. All rights reserved.</p>
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
