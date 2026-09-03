import React, { useState } from 'react';
import {
  Layers,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Languages,
  Video,
  Music,
  Image as ImageIcon,
  FileText,
  Minimize2,
  Scale,
  Clock,
  Grid,
  ShieldCheck,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { en } from '../locales/en';
import { bn } from '../locales/bn';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
  language,
  setLanguage,
  theme,
  setTheme,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = language === 'bn' ? bn : en;

  const navLinks = [
    { label: t.nav.convert, route: '/', icon: Layers },
    { label: t.nav.compress, route: '/compress', icon: Minimize2 },
    { label: t.nav.video, route: '/video', icon: Video },
    { label: t.nav.audio, route: '/audio', icon: Music },
    { label: t.nav.image, route: '/image', icon: ImageIcon },
    { label: t.nav.pdf, route: '/pdf', icon: FileText },
    { label: t.nav.documents, route: '/documents', icon: FileText },
    { label: t.nav.units, route: '/units', icon: Scale },
    { label: t.nav.time, route: '/time', icon: Clock },
    { label: t.nav.tools, route: '/tools', icon: Grid },
  ];

  const handleNav = (r: string) => {
    navigate(r);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-btn"
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10h10a3 3 0 0 1 3 3v1m-3-2 3-2 3 2" />
                <path d="M17 14H7a3 3 0 0 1-3-3v-1m3 2-3 2-3-2" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ConvertX</span>
                <span className="rounded bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">Open-Source Engine</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.slice(0, 8).map((link) => {
              const active = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  id={`nav-${link.route.replace('/', '') || 'home'}`}
                  onClick={() => handleNav(link.route)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <button
              id="nav-all-tools"
              onClick={() => handleNav('/tools')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors"
            >
              <Grid className="w-4 h-4" />
              <span>{t.nav.tools}</span>
            </button>
          </nav>
        </div>

        {/* Right side controls: Search, Language, Theme, Admin */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <button
            id="search-trigger-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-white transition-all shadow-2xs"
            aria-label="Search tools"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{t.nav.search}</span>
            <kbd className="hidden md:inline rounded bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
              ⌘K
            </kbd>
          </button>

          {/* Language Toggle (EN / BN) */}
          <button
            id="language-toggle-btn"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            title="Switch Language"
          >
            <Languages className="h-3.5 w-3.5 text-blue-500" />
            <span>{language === 'en' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 dark:border-slate-800 dark:bg-slate-900 shadow-xl">
          <div className="grid grid-cols-2 gap-2 pb-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  onClick={() => handleNav(link.route)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> 100% Free & Open-Source
            </span>
            <button
              onClick={() => handleNav('/admin')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
            >
              System Stats
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
