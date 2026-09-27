import React, { useState } from 'react';
import { Search, Moon, Sun, Menu, X, ArrowRight, Sparkles, Layers, Globe } from 'lucide-react';
import { Language, Theme } from '../types';
import { AuthModal } from './AuthModal';
import { ConvertXLogo } from './ConvertXLogo';

interface NavbarProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  navigate?: (route: string) => void;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  setLanguage?: (lang: Language) => void;
  theme: Theme;
  onThemeToggle?: () => void;
  setTheme?: (theme: Theme) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute = '/',
  onNavigate,
  navigate,
  language,
  onLanguageChange,
  setLanguage,
  theme,
  onThemeToggle,
  setTheme,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{ open: boolean; mode: 'login' | 'upgrade' }>({
    open: false,
    mode: 'login',
  });

  const handleNav = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else if (navigate) {
      navigate(route);
    }
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    if (onThemeToggle) {
      onThemeToggle();
    } else if (setTheme) {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'bn' : 'en';
    if (onLanguageChange) {
      onLanguageChange(nextLang);
    } else if (setLanguage) {
      setLanguage(nextLang);
    }
  };

  const navLinks = [
    { label: 'Tools', route: '/tools' },
    { label: 'AI', route: '#ai' },
    { label: 'Pricing', route: '/pricing' },
    { label: 'FAQ', route: '/faq' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85 transition-colors">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNav('/')}
              className="group flex items-center text-left focus:outline-none rounded-lg p-0.5 cursor-pointer"
            >
              <ConvertXLogo size={32} />
            </button>

            {/* Center Navigation (Desktop) */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const isActive =
                  link.route === '/'
                    ? currentRoute === '/'
                    : currentRoute === link.route || currentRoute.startsWith(link.route);

                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      if (link.route === '#ai') {
                        if (currentRoute !== '/') {
                          handleNav('/');
                          setTimeout(() => {
                            document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        } else {
                          document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        handleNav(link.route);
                      }
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search command button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Search tools (⌘K)"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search tools...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                ⌘K
              </kbd>
            </button>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="rounded-lg p-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title={language === 'en' ? 'বাংলাতে পরিবর্তন করুন' : 'Switch to English'}
            >
              <span className="text-[11px] uppercase tracking-wider">{language === 'en' ? 'BN' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Login button */}
            <button
              onClick={() => setAuthModalState({ open: true, mode: 'login' })}
              className="hidden sm:inline-flex rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
            >
              Log In
            </button>

            {/* Get Pro CTA */}
            <button
              onClick={() => setAuthModalState({ open: true, mode: 'upgrade' })}
              className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Get Pro
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950 space-y-2 animate-in fade-in slide-in-from-top-2">
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    if (link.route === '#ai') {
                      if (currentRoute !== '/') {
                        handleNav('/');
                        setTimeout(() => {
                          document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        document.getElementById('ai')?.scrollIntoView({ behavior: 'smooth' });
                      }
                      setMobileMenuOpen(false);
                    } else {
                      handleNav(link.route);
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </nav>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setAuthModalState({ open: true, mode: 'login' });
                  setMobileMenuOpen(false);
                }}
                className="w-1/2 rounded-xl border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setAuthModalState({ open: true, mode: 'upgrade' });
                  setMobileMenuOpen(false);
                }}
                className="w-1/2 rounded-xl bg-slate-900 py-2 text-center text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
              >
                Get Pro
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalState.open}
        mode={authModalState.mode}
        onClose={() => setAuthModalState({ open: false, mode: 'login' })}
      />
    </>
  );
};
