import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Maximize2,
  Crop,
  Scale,
  Clock,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Minimize2,
  Lock,
  Flame,
  CheckCircle,
} from 'lucide-react';

import { Language } from './types';
import { en } from './locales/en';
import { bn } from './locales/bn';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { UniversalUploader } from './components/UniversalUploader';
import { ConversionHistoryPanel } from './components/ConversionHistoryPanel';
import { ImageResizerTool } from './components/ImageResizerTool';
import { ImageCropTool } from './components/ImageCropTool';
import { PdfToolsView } from './components/PdfToolsView';
import { UnitConverterView } from './components/UnitConverterView';
import { TimeZoneConverterView } from './components/TimeZoneConverterView';
import { ToolDirectoryView } from './components/ToolDirectoryView';
import { AdminView } from './components/AdminView';
import { SearchModal } from './components/SearchModal';
import { AboutPage, PrivacyPage, TermsPage, FaqPage, ContactPage } from './components/StaticPages';
import { DedicatedToolPage } from './components/DedicatedToolPage';
import { TOOLS_LIST } from './data/tools';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const t = language === 'bn' ? bn : en;

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: string) => {
    if (route !== currentRoute) {
      window.history.pushState({}, '', route);
      setCurrentRoute(route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Determine which specialized tool or view to render based on currentRoute
  const renderContent = () => {
    if (currentRoute === '/admin') {
      return <AdminView />;
    }

    if (currentRoute === '/about') {
      return <AboutPage />;
    }

    if (currentRoute === '/privacy') {
      return <PrivacyPage />;
    }

    if (currentRoute === '/terms') {
      return <TermsPage />;
    }

    if (currentRoute === '/faq') {
      return <FaqPage />;
    }

    if (currentRoute === '/contact') {
      return <ContactPage />;
    }

    if (currentRoute === '/tools' || currentRoute === '/tools/all') {
      return <ToolDirectoryView onSelectTool={navigateTo} />;
    }

    // DEDICATED CATEGORY HUBS (Navbar & Category links)
    if (currentRoute === '/compress' || currentRoute === '/compression') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Free Online File Compressor
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compress PDF, video, audio, and image files to drastically reduce file size while maintaining excellent quality.
            </p>
          </div>
          <UniversalUploader language={language} presetTargetFormat="compress" />
          <div className="pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Dedicated Compression Tools</h2>
            <ToolDirectoryView onSelectTool={navigateTo} initialCategory="compression" />
          </div>
        </div>
      );
    }

    if (currentRoute === '/video') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Free Online Video Tools & Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert, compress, trim, and transcode video files in MP4, WebM, MOV, MKV, and AVI. 100% free with client-side WebAssembly.
            </p>
          </div>
          <UniversalUploader language={language} presetCategory="video" />
          <div className="pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Popular Video Tools</h2>
            <ToolDirectoryView onSelectTool={navigateTo} initialCategory="video" />
          </div>
        </div>
      );
    }

    if (currentRoute === '/audio') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Free Online Audio Tools & Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert audio between MP3, WAV, AAC, FLAC, OGG, and extract audio tracks from video files with custom bitrate and sample rates.
            </p>
          </div>
          <UniversalUploader language={language} presetCategory="audio" />
          <div className="pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Popular Audio Tools</h2>
            <ToolDirectoryView onSelectTool={navigateTo} initialCategory="audio" />
          </div>
        </div>
      );
    }

    if (currentRoute === '/image') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Free Online Image Tools & Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert JPG, PNG, WEBP, HEIC, resize, crop, and compress images with instantaneous client-side processing.
            </p>
          </div>
          <UniversalUploader language={language} presetCategory="image" />
          <div className="pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Popular Image Tools</h2>
            <ToolDirectoryView onSelectTool={navigateTo} initialCategory="image" />
          </div>
        </div>
      );
    }

    if (currentRoute === '/pdf') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Free Online PDF Tools & Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Merge, split, compress, rotate, and convert PDF documents directly inside your browser. No files uploaded to external servers.
            </p>
          </div>
          <PdfToolsView initialTab="merge" />
          <div className="pt-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">All PDF Converters</h2>
            <ToolDirectoryView onSelectTool={navigateTo} initialCategory="pdf" />
          </div>
        </div>
      );
    }

    if (currentRoute === '/documents') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Free Online Document & E-Book Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert Word (DOCX), Text (TXT), HTML, EPUB, MOBI, spreadsheets (CSV, XLSX), and archive formats securely in-browser.
            </p>
          </div>
          <UniversalUploader language={language} presetCategory="document" />
          <div className="pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Document Tools & Formats</h2>
            <ToolDirectoryView onSelectTool={navigateTo} initialCategory="document" />
          </div>
        </div>
      );
    }

    // INDIVIDUAL SPECIALTY TOOLS
    if (currentRoute === '/image-resizer' || currentRoute === '/tools/image-resizer') {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Image Resizer</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resize images by pixels, percentage, or social media presets with aspect ratio lock.
            </p>
          </div>
          <ImageResizerTool />
        </div>
      );
    }

    if (currentRoute === '/image-crop' || currentRoute === '/tools/image-crop') {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Image Cropper & Rotate</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crop images to square 1:1, 16:9, 4:3, portrait 9:16 or rotate and flip.
            </p>
          </div>
          <ImageCropTool />
        </div>
      );
    }

    if (
      currentRoute === '/merge-pdf' ||
      currentRoute === '/pdf/merge' ||
      currentRoute === '/tools/merge-pdf'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <PdfToolsView initialTab="merge" />
        </div>
      );
    }

    if (
      currentRoute === '/split-pdf' ||
      currentRoute === '/pdf/split' ||
      currentRoute === '/tools/split-pdf'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <PdfToolsView initialTab="split" />
        </div>
      );
    }

    if (
      currentRoute === '/compress-pdf' ||
      currentRoute === '/pdf/compress' ||
      currentRoute === '/tools/compress-pdf' ||
      currentRoute === '/pdf-compressor'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <PdfToolsView initialTab="compress" />
        </div>
      );
    }

    if (
      currentRoute === '/rotate-pdf' ||
      currentRoute === '/pdf/rotate' ||
      currentRoute === '/tools/rotate-pdf'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <PdfToolsView initialTab="rotate" />
        </div>
      );
    }

    if (currentRoute === '/units' || currentRoute === '/tools/unit-converter') {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <UnitConverterView />
        </div>
      );
    }

    if (currentRoute === '/time' || currentRoute === '/tools/timezone-converter') {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <TimeZoneConverterView />
        </div>
      );
    }

    // Match dedicated format tool route, e.g. /heic-to-jpg, /image/heic-to-jpg, /mp4-to-mp3, etc.
    const normalizedPath = currentRoute.replace(/^\/(image|video|audio|pdf|documents|compress|tools)/, '');
    const formatToolMatch = TOOLS_LIST.find(
      (t) =>
        t.route === currentRoute ||
        `/tools${t.route}` === currentRoute ||
        (normalizedPath && t.route === normalizedPath) ||
        (normalizedPath && t.route === `/${normalizedPath.replace(/^\//, '')}`)
    );

    if (formatToolMatch && currentRoute !== '/') {
      return (
        <DedicatedToolPage
          tool={formatToolMatch}
          language={language}
          onNavigate={navigateTo}
        />
      );
    }

    // DEFAULT HOME / UNIVERSAL CONVERTER VIEW
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* HERO INTRO */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>100% Free • Open Source • Files Purged After 1 Hour</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            {formatToolMatch ? formatToolMatch.name : t.hero.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {formatToolMatch ? formatToolMatch.description : t.hero.subtitle}
          </p>

          {/* Quick Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">
              Popular:
            </span>
            {[
              { label: 'MP4 to MP3', route: '/tools/mp4-to-mp3' },
              { label: 'JPG to WEBP', route: '/tools/jpg-to-webp' },
              { label: 'PDF to JPG', route: '/tools/pdf-to-jpg' },
              { label: 'Merge PDF', route: '/tools/merge-pdf' },
              { label: 'Compress Video', route: '/tools/video-compressor' },
              { label: 'Unit Converter', route: '/tools/unit-converter' },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => navigateTo(p.route)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* CORE DRAG & DROP UPLOADER */}
        <div className="max-w-4xl mx-auto">
          <UniversalUploader
            language={language}
          />
        </div>

        {/* RECENT CONVERSIONS & LIVE FILE SIZE STATS */}
        <div className="max-w-4xl mx-auto">
          <ConversionHistoryPanel language={language} />
        </div>

        {/* QUICK FEATURE TILES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Up to 500 MB per File</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generous file limits suitable for large videos, high-res RAW photos, and hefty PDF books.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">1-Hour Auto Delete</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Files are automatically permanently destroyed after 60 minutes. Or click delete immediately.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Batch Queue of 10</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Process up to 10 files simultaneously. Convert all to one format with a single click.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center mb-3">
              <Flame className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">50+ Formats Supported</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Video, audio, image, PDF, docs, spreadsheets, zip archives, and 13 unit converters.
            </p>
          </div>
        </div>

        {/* POPULAR INTERACTIVE TOOLS PREVIEW */}
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Featured Online Tools
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct browser manipulation with instant download
              </p>
            </div>
            <button
              onClick={() => navigateTo('/tools')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <span>View All 50+ Tools</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              onClick={() => navigateTo('/tools/image-resizer')}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                  <Maximize2 className="h-5 w-5" />
                </div>
                <span className="rounded bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Instant
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Image Resizer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Resize images with social media presets (Instagram, YouTube, Twitter) or custom dimensions.
              </p>
            </div>

            <div
              onClick={() => navigateTo('/tools/image-crop')}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
                  <Crop className="h-5 w-5" />
                </div>
                <span className="rounded bg-purple-50 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  Canvas
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Image Cropper & Rotate
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Crop 1:1, 16:9, 4:3, 9:16 or freeform with interactive flip and 90° rotations.
              </p>
            </div>

            <div
              onClick={() => navigateTo('/tools/merge-pdf')}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="rounded bg-rose-50 dark:bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  PDF
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                PDF Merge & Split
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Combine several PDFs in custom order or extract page ranges with zero data retention.
              </p>
            </div>

            <div
              onClick={() => navigateTo('/tools/unit-converter')}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="h-5 w-5" />
                </div>
                <span className="rounded bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  13 Categories
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Unit Converter
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time bi-directional conversion for length, weight, speed, data, temperature, and more.
              </p>
            </div>

            <div
              onClick={() => navigateTo('/tools/timezone-converter')}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="rounded bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
                  IANA Clock
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                World Time Zone Converter
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Compare local times across London, New York, Tokyo, Dhaka, Dubai, and Sydney.
              </p>
            </div>

            <div
              onClick={() => navigateTo('/admin')}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Telemetry
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                System Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inspect active conversions, queue metrics, disk consumption, and run manual file sweeps.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        language={language}
        theme={theme}
        onLanguageChange={setLanguage}
        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onNavigate={navigateTo}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">{renderContent()}</main>

      {/* Footer */}
      <Footer language={language} onNavigate={navigateTo} />

      {/* Quick Search Modal (⌘K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={navigateTo}
      />
    </div>
  );
}
