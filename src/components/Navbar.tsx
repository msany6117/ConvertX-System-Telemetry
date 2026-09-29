import React, { useState } from 'react';
import { Search, Moon, Sun, Menu, X, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { Theme } from '../types';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  navigate?: (route: string) => void;
  language?: string;
  onLanguageChange?: (lang: any) => void;
  setLanguage?: (lang: any) => void;
  theme: Theme;
  onThemeToggle?: () => void;
  setTheme?: (theme: Theme) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute = '/',
  onNavigate,
  navigate,
  theme,
  onThemeToggle,
  setTheme,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navLinks = [
    { label: 'Tools', route: '/tools' },
    { label: 'AI Suite', route: '/ai' },
    { label: 'Compress', route: '/compress' },
    { label: 'PDF Suite', route: '/pdf' },
    { label: 'FAQ', route: '/faq' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleNav('/')}
            className="flex items-center text-left focus:outline-none rounded-lg p-0.5 cursor-pointer"
          >
            <BrandLogo variant="mark-with-text" size="md" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.route)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  currentRoute === link.route || (link.route === '/ai' && currentRoute.startsWith('/ai'))
                    ? 'bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                {link.label === 'AI Suite' && (
                  <Sparkles className="mr-1 inline-block h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                )}
                {link.label === 'Tools' && (
                  <Layers className="mr-1 inline-block h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                )}
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search trigger */}
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search 50+ formats...</span>
            <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Search icon button for mobile */}
          <button
            onClick={onOpenSearch}
            className="sm:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
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
                onClick={() => handleNav(link.route)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900 cursor-pointer"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
