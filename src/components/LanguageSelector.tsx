import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { Language } from '../types';
import { LANGUAGE_OPTIONS, getLanguageOption } from '../locales';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  variant?: 'navbar' | 'mobile';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  variant = 'navbar',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = getLanguageOption(currentLanguage);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (lang: Language) => {
    onLanguageChange(lang);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Globe className="h-3.5 w-3.5" />
          <span>Language / ভাষা</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isActive = opt.code === currentLanguage;
            return (
              <button
                key={opt.code}
                onClick={() => handleSelect(opt.code)}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{opt.flag}</span>
                  <div className="text-left">
                    <p className="leading-tight">{opt.nativeLabel}</p>
                    <p className={`text-[10px] leading-tight uppercase ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                      {opt.code}
                    </p>
                  </div>
                </div>
                {isActive && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Navbar Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select Language"
      >
        <span className="text-sm leading-none">{activeOption.flag}</span>
        <span className="font-semibold uppercase tracking-wider text-[11px]">
          {activeOption.code}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Select Language
          </div>
          <div className="space-y-0.5">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = opt.code === currentLanguage;
              return (
                <button
                  key={opt.code}
                  role="menuitem"
                  onClick={() => handleSelect(opt.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{opt.flag}</span>
                    <div className="text-left">
                      <p className="leading-snug">{opt.nativeLabel}</p>
                      <p className="text-[10px] text-slate-400 uppercase leading-none font-mono">
                        {opt.label} ({opt.code.toUpperCase()})
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
