import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronDown,
  ArrowRight,
  BookOpen,
  Crop,
  Maximize2,
  Scissors,
  RotateCw,
  Film,
  Sparkles,
} from 'lucide-react';
import { Language, Theme } from '../types';
import { en } from '../locales/en';
import { bn } from '../locales/bn';

interface NavSubItem {
  id: string;
  name: string;
  route: string;
  desc?: string;
  badge?: string;
  icon?: any;
}

interface NavCategory {
  id: string;
  labelEn: string;
  labelBn: string;
  route: string;
  icon: any;
  items: NavSubItem[];
}

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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = language === 'bn' ? bn : en;

  const navHandler = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else if (navigate) {
      navigate(route);
    }
  };

  const langHandler = (lang: Language) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    } else if (setLanguage) {
      setLanguage(lang);
    }
  };

  const themeHandler = () => {
    if (onThemeToggle) {
      onThemeToggle();
    } else if (setTheme) {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const handleNav = (r: string) => {
    navHandler(r);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  const navCategories: NavCategory[] = [
    {
      id: 'convert',
      labelEn: 'Convert',
      labelBn: 'কনভার্ট',
      route: '/',
      icon: Layers,
      items: [
        { id: 'c-image', name: 'Image Converter', route: '/image', desc: 'JPG, PNG, WEBP, HEIC, GIF', icon: ImageIcon },
        { id: 'c-video', name: 'Video Converter', route: '/video', desc: 'MP4, WebM, MOV, MKV, AVI', icon: Video },
        { id: 'c-audio', name: 'Audio Converter', route: '/audio', desc: 'MP3, WAV, AAC, FLAC, OGG', icon: Music },
        { id: 'c-pdf', name: 'PDF Converter', route: '/pdf', desc: 'PDF to JPG, Images to PDF', icon: FileText },
        { id: 'c-doc', name: 'Document Converter', route: '/documents', desc: 'Word, TXT, HTML, CSV, XLSX', icon: BookOpen },
        { id: 'c-all', name: 'All 50+ Converters', route: '/tools', desc: 'Browse full tool index', badge: '50+', icon: Grid },
      ],
    },
    {
      id: 'compress',
      labelEn: 'Compress',
      labelBn: 'কম্প্রেস',
      route: '/compress',
      icon: Minimize2,
      items: [
        { id: 'comp-pdf', name: 'Compress PDF', route: '/pdf/compress', desc: 'Reduce PDF file size for sharing', badge: 'Popular', icon: FileText },
        { id: 'comp-img', name: 'Image Compressor', route: '/image/image-compressor', desc: 'Shrink JPG, PNG, WebP with zero blur', badge: 'Popular', icon: ImageIcon },
        { id: 'comp-vid', name: 'Video Compressor', route: '/video/video-compressor', desc: 'Reduce video MBs while keeping 1080p', icon: Video },
        { id: 'comp-aud', name: 'Audio Compressor', route: '/audio/audio-compressor', desc: 'Tune bitrate down to 64kbps', icon: Music },
        { id: 'comp-hub', name: 'All Compression Tools', route: '/compress', desc: 'Dedicated compression hub', icon: Minimize2 },
      ],
    },
    {
      id: 'video',
      labelEn: 'Video',
      labelBn: 'ভিডিও',
      route: '/video',
      icon: Video,
      items: [
        { id: 'v-mp4-mp3', name: 'MP4 to MP3', route: '/video/mp4-to-mp3', desc: 'Extract high-bitrate audio track', badge: 'Popular', icon: Music },
        { id: 'v-comp', name: 'Video Compressor', route: '/video/video-compressor', desc: 'Shrink video file sizes', icon: Minimize2 },
        { id: 'v-gif', name: 'Video to GIF', route: '/video/mp4-to-gif', desc: 'Make optimized animated GIFs', badge: 'Popular', icon: Film },
        { id: 'v-webm', name: 'MP4 to WebM', route: '/video/mp4-to-webm', desc: 'Ultra-efficient web streaming', icon: Video },
        { id: 'v-mov', name: 'MOV to MP4', route: '/video/mov-to-mp4', desc: 'Apple QuickTime to universal MP4', icon: Video },
        { id: 'v-mkv', name: 'MKV to MP4', route: '/video/mkv-to-mp4', desc: 'Container conversion without loss', icon: Video },
        { id: 'v-hub', name: 'All Video Converters', route: '/video', desc: 'Full suite of video utilities', icon: Video },
      ],
    },
    {
      id: 'audio',
      labelEn: 'Audio',
      labelBn: 'অডিও',
      route: '/audio',
      icon: Music,
      items: [
        { id: 'a-mp3-wav', name: 'MP3 to WAV', route: '/audio/mp3-to-wav', desc: 'Uncompressed broadcast WAV', icon: Music },
        { id: 'a-wav-mp3', name: 'WAV to MP3', route: '/audio/wav-to-mp3', desc: 'Lossless audio to 320kbps MP3', badge: 'Popular', icon: Music },
        { id: 'a-flac-mp3', name: 'FLAC to MP3', route: '/audio/flac-to-mp3', desc: 'Audiophile tracks to portable MP3', icon: Music },
        { id: 'a-m4a-mp3', name: 'M4A to MP3', route: '/audio/m4a-to-mp3', desc: 'Apple voice memo / iTunes convert', icon: Music },
        { id: 'a-comp', name: 'Audio Compressor', route: '/audio/audio-compressor', desc: 'Compress bitrates cleanly', icon: Minimize2 },
        { id: 'a-hub', name: 'All Audio Converters', route: '/audio', desc: 'Full audio conversion workspace', icon: Music },
      ],
    },
    {
      id: 'image',
      labelEn: 'Image',
      labelBn: 'ছবি',
      route: '/image',
      icon: ImageIcon,
      items: [
        { id: 'i-heic-jpg', name: 'HEIC to JPG', route: '/image/heic-to-jpg', desc: 'iPhone photos to standard JPG', badge: 'Popular', icon: ImageIcon },
        { id: 'i-jpg-webp', name: 'JPG to WEBP', route: '/image/jpg-to-webp', desc: 'Modern high compression WebP', badge: 'Popular', icon: ImageIcon },
        { id: 'i-png-jpg', name: 'PNG to JPG', route: '/image/png-to-jpg', desc: 'Transparent PNG into lightweight JPG', icon: ImageIcon },
        { id: 'i-webp-jpg', name: 'WEBP to JPG', route: '/image/webp-to-jpg', desc: 'WebP images to universal JPG', icon: ImageIcon },
        { id: 'i-resizer', name: 'Image Resizer', route: '/image/image-resizer', desc: 'Dimensions & social presets', badge: 'Tool', icon: Maximize2 },
        { id: 'i-crop', name: 'Image Cropper', route: '/image/image-crop', desc: 'Aspect ratios & 90° rotation', badge: 'Tool', icon: Crop },
        { id: 'i-comp', name: 'Image Compressor', route: '/image/image-compressor', desc: 'Optimize JPG, PNG, WebP MBs', icon: Minimize2 },
        { id: 'i-hub', name: 'All Image Converters', route: '/image', desc: 'Explore all photo tools', icon: ImageIcon },
      ],
    },
    {
      id: 'pdf',
      labelEn: 'PDF',
      labelBn: 'পিডিএফ',
      route: '/pdf',
      icon: FileText,
      items: [
        { id: 'p-merge', name: 'Merge PDF', route: '/pdf/merge', desc: 'Combine multiple PDF files', badge: 'Popular', icon: Layers },
        { id: 'p-split', name: 'Split PDF', route: '/pdf/split', desc: 'Extract pages into single PDF or ZIP', badge: 'Popular', icon: Scissors },
        { id: 'p-comp', name: 'Compress PDF', route: '/pdf/compress', desc: 'Shrink document file size', icon: Minimize2 },
        { id: 'p-rotate', name: 'Rotate PDF', route: '/pdf/rotate', desc: 'Permanently reorient pages', icon: RotateCw },
        { id: 'p-to-jpg', name: 'PDF to JPG', route: '/pdf/pdf-to-jpg', desc: 'Render pages into high-res images', icon: ImageIcon },
        { id: 'p-from-jpg', name: 'Images to PDF', route: '/pdf/jpg-to-pdf', desc: 'Combine photos into a neat document', icon: FileText },
        { id: 'p-hub', name: 'All PDF Tools', route: '/pdf', desc: 'Full client-side PDF suite', icon: FileText },
      ],
    },
    {
      id: 'documents',
      labelEn: 'Documents',
      labelBn: 'ডকুমেন্টস',
      route: '/documents',
      icon: BookOpen,
      items: [
        { id: 'd-docx-pdf', name: 'Word (DOCX) to PDF', route: '/documents/docx-to-pdf', desc: 'Convert Word docs to read-only PDF', badge: 'Popular', icon: FileText },
        { id: 'd-epub-pdf', name: 'EPUB to PDF', route: '/documents/epub-to-pdf', desc: 'Convert e-books to printable PDF', icon: BookOpen },
        { id: 'd-mobi-epub', name: 'MOBI to EPUB', route: '/documents/mobi-to-epub', desc: 'Kindle books to open e-reader format', icon: BookOpen },
        { id: 'd-xlsx-csv', name: 'Excel to CSV', route: '/documents/xlsx-to-csv', desc: 'Spreadsheets into plain tables', icon: FileText },
        { id: 'd-txt-pdf', name: 'Text to PDF', route: '/documents/txt-to-pdf', desc: 'Plain text files to formatted PDF', icon: FileText },
        { id: 'd-hub', name: 'All Document Tools', route: '/documents', desc: 'Spreadsheets, e-books & docs', icon: BookOpen },
      ],
    },
    {
      id: 'tools',
      labelEn: 'Tools',
      labelBn: 'টুলস',
      route: '/tools',
      icon: Grid,
      items: [
        { id: 't-units', name: 'Unit Converter', route: '/tools/unit-converter', desc: '13 live measurement categories', badge: 'Interactive', icon: Scale },
        { id: 't-time', name: 'Time Zone Converter', route: '/tools/timezone-converter', desc: 'World clock & offset calculator', badge: 'Interactive', icon: Clock },
        { id: 't-resizer', name: 'Image Resizer', route: '/image/image-resizer', desc: 'Fast client-side dimensions', icon: Maximize2 },
        { id: 't-crop', name: 'Image Cropper', route: '/image/image-crop', desc: 'Aspect ratios & rotation', icon: Crop },
        { id: 't-merge', name: 'Merge PDF', route: '/pdf/merge', desc: 'Combine multiple PDF documents', icon: Layers },
        { id: 't-all', name: 'All 50+ Tools Directory', route: '/tools', desc: 'Comprehensive searchable list', badge: 'Full', icon: Grid },
      ],
    },
  ];

  // Dropdown hover delay logic to prevent jitter
  const handleMouseEnter = (catId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(catId);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if a category is active based on currentRoute
  const isCategoryActive = (cat: NavCategory) => {
    if (currentRoute === cat.route) return true;
    if (cat.id !== 'convert' && currentRoute.startsWith(`/${cat.id}`)) return true;
    return cat.items.some((item) => item.route === currentRoute);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo Redesign */}
        <div className="flex items-center gap-4 xl:gap-6">
          <button
            id="brand-logo-btn"
            onClick={() => handleNav('/')}
            className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl p-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {/* Modern Vector Squircle Logo */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/25 overflow-hidden transition-all duration-300 group-hover:shadow-indigo-500/40 group-hover:scale-105">
              {/* Subtle glass specular highlight */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none rounded-xl" />
              
              {/* Intertwined 'C' Loop & 'X' Interchange Vector Icon */}
              <svg
                className="h-5 w-5 text-white drop-shadow-sm transition-transform duration-300 group-hover:rotate-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
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

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Convert<span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">X</span>
                </span>
                <span className="rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 text-indigo-600 dark:text-purple-300 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase border border-indigo-500/30 dark:border-purple-500/40 shadow-xs">
                  ULTRA
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block tracking-normal">
                Fast • Secure • Client-Side
              </p>
            </div>
          </button>

          {/* Desktop Navigation with Multi-Level Dropdowns */}
          <nav className="hidden lg:flex items-center space-x-0.5 xl:space-x-1">
            {navCategories.map((cat) => {
              const active = isCategoryActive(cat);
              const isDropdownOpen = activeDropdown === cat.id;

              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(cat.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    id={`nav-${cat.id}`}
                    onClick={() => {
                      if (activeDropdown === cat.id) {
                        setActiveDropdown(null);
                      } else {
                        handleMouseEnter(cat.id);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                      active || isDropdownOpen
                        ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:from-indigo-950/70 dark:to-purple-950/70 dark:text-indigo-400 font-bold border border-indigo-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{language === 'bn' ? cat.labelBn : cat.labelEn}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {/* Multi-Level Dropdown Popup with Butter-Smooth Framer Motion */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-0 top-full pt-2 z-50 w-72 sm:w-80 xl:w-96"
                        onMouseEnter={() => handleMouseEnter(cat.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-2.5 shadow-2xl shadow-indigo-950/10 dark:border-slate-800/90 dark:bg-slate-900/95 dark:shadow-black/50">
                          {/* Dropdown Header */}
                          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {language === 'bn' ? cat.labelBn : cat.labelEn} Tools
                            </span>
                            <button
                              onClick={() => handleNav(cat.route)}
                              className="group flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer transition-all hover:scale-[1.02]"
                            >
                              <span>Explore All</span>
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </div>

                          {/* Sub-Items List */}
                          <div className="space-y-1">
                            {cat.items.map((item) => {
                              const ItemIcon = item.icon || cat.icon;
                              const isItemActive = currentRoute === item.route;

                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleNav(item.route)}
                                  className={`group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all duration-200 hover:scale-[1.01] cursor-pointer ${
                                    isItemActive
                                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-950/70 dark:to-purple-950/70 dark:text-indigo-300 border border-indigo-500/20 shadow-xs'
                                      : 'hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                                  }`}
                                >
                                  <div
                                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 ${
                                      isItemActive
                                        ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs shadow-indigo-500/30'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    <ItemIcon className="h-4 w-4" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span
                                        className={`text-xs font-bold leading-tight ${
                                          isItemActive
                                            ? 'text-indigo-700 dark:text-indigo-300'
                                            : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                        }`}
                                      >
                                        {item.name}
                                      </span>
                                      {item.badge && (
                                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                                          {item.badge}
                                        </span>
                                      )}
                                    </div>
                                    {item.desc && (
                                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                        {item.desc}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right side controls: Search, Language, Theme, Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <button
            id="search-trigger-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:border-indigo-300 hover:bg-white hover:text-slate-800 hover:shadow-md hover:shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-white transition-all cursor-pointer"
            aria-label="Search tools"
          >
            <Search className="h-4 w-4 text-indigo-500" />
            <span className="hidden sm:inline font-medium">{t.nav.search}</span>
            <kbd className="hidden md:inline rounded bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
              ⌘K
            </kbd>
          </button>

          {/* Language Toggle (EN / BN) */}
          <button
            id="language-toggle-btn"
            onClick={() => langHandler(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:scale-105 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Switch Language"
          >
            <Languages className="h-3.5 w-3.5 text-indigo-500" />
            <span>{language === 'en' ? 'EN' : 'বাং'}</span>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={themeHandler}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 hover:scale-105 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-all cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:scale-105 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-all"
            aria-label="Open mobile navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER WITH BACKDROP & ACCORDIONS */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in Mobile Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-10 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 16V8a3.5 3.5 0 0 1 3.5-3.5h3" />
                      <path d="M7 13.5L10 16.5L7 19.5" />
                      <path d="M20 8v8a3.5 3.5 0 0 1-3.5 3.5h-3" />
                      <path d="M17 10.5L14 7.5L17 4.5" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      Convert<span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">X</span>
                    </span>
                    <span className="ml-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-purple-300 px-1.5 py-0.2 text-[9px] font-black border border-indigo-500/20">
                      ULTRA
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:scale-105 active:scale-95 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

            {/* Quick Search in Mobile Menu */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                <Search className="h-4 w-4 text-blue-500" />
                <span>Search all 50+ conversion tools...</span>
              </button>
            </div>

            {/* Accordion Categories List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {navCategories.map((cat) => {
                const isExpanded = expandedAccordion === cat.id;
                const active = isCategoryActive(cat);
                const CatIcon = cat.icon;

                return (
                  <div
                    key={cat.id}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850/60 overflow-hidden"
                  >
                    {/* Category Accordion Header */}
                    <button
                      onClick={() => setExpandedAccordion(isExpanded ? null : cat.id)}
                      className="flex w-full items-center justify-between px-3.5 py-3 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}>
                          <CatIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className={`text-sm font-bold ${
                            active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {language === 'bn' ? cat.labelBn : cat.labelEn}
                          </span>
                          <span className="ml-2 text-[10px] text-slate-400">({cat.items.length})</span>
                        </div>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>

                    {/* Accordion Content (Sub-Tools) */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/60 bg-white p-2 dark:border-slate-800 dark:bg-slate-900 space-y-1">
                        {/* Direct Category Link */}
                        <button
                          onClick={() => handleNav(cat.route)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        >
                          <span>Open {language === 'bn' ? cat.labelBn : cat.labelEn} Hub</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>

                        {/* List of sub-items */}
                        {cat.items.map((item) => {
                          const SubIcon = item.icon || cat.icon;
                          const isItemActive = currentRoute === item.route;

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNav(item.route)}
                              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-colors min-h-[44px] cursor-pointer ${
                                isItemActive
                                  ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-950 dark:text-blue-300'
                                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              <SubIcon className="h-4 w-4 shrink-0 text-slate-400" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{item.name}</span>
                                  {item.badge && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Drawer Footer */}
            <div className="border-t border-slate-200 p-4 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </header>
  );
};
