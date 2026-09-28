import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';
import { Language } from './types';
import { en } from './locales/en';
import { bn } from './locales/bn';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { UniversalUploader } from './components/UniversalUploader';
import { PopularToolsSection } from './components/PopularToolsSection';
import { ConvertXAISection } from './components/ConvertXAISection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { ToolCategoriesSection } from './components/ToolCategoriesSection';
import { TrustPrivacySection } from './components/TrustPrivacySection';
import { FaqSection } from './components/FaqSection';
import { PricingPage } from './components/PricingPage';
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
import { ImageCompressorTool } from './components/ImageCompressorTool';
import { VideoCompressorTool } from './components/VideoCompressorTool';
import { ImageConverterTool } from './components/ImageConverterTool';
import { VideoConverterTool } from './components/VideoConverterTool';
import { ImageToSvgTool } from './components/ImageToSvgTool';
import { SvgToImageTool } from './components/SvgToImageTool';
import { TOOLS_LIST } from './data/tools';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const getInitialRoute = (): string => {
    if (typeof window === 'undefined') return '/';
    const hash = window.location.hash.replace(/^#\/?/, '/');
    if (hash && hash !== '/') {
      return hash.startsWith('/') ? hash : `/${hash}`;
    }
    return window.location.pathname || '/';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);
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

  // Handle browser back/forward navigation and hash change
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '/');
      if (hash && hash !== '/') {
        setCurrentRoute(hash.startsWith('/') ? hash : `/${hash}`);
        return;
      }
      setCurrentRoute(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: string) => {
    const normalized = route.startsWith('/') ? route : `/${route}`;
    if (normalized !== currentRoute) {
      try {
        window.history.pushState({ route: normalized }, '', normalized);
      } catch {
        window.location.hash = normalized;
      }
      setCurrentRoute(normalized);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Determine which specialized tool or view to render based on currentRoute
  const renderContent = () => {
    if (currentRoute === '/pricing') {
      return <PricingPage onSelectPlan={() => navigateTo('/pricing')} />;
    }

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

    // DEDICATED CATEGORY HUBS
    if (currentRoute === '/compress' || currentRoute === '/compression') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              File Compressor
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Compress PDF, video, audio, and image files to drastically reduce file size while maintaining excellent quality.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <UniversalUploader language={language} presetTargetFormat="compress" />
          </div>
          <div className="pt-6">
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
              Video Tools & Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert, compress, and transcode video files in MP4, WebM, MOV, MKV, and AVI.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <UniversalUploader language={language} presetCategory="video" />
          </div>
          <div className="pt-6">
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
              Audio Tools & Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert audio between MP3, WAV, AAC, FLAC, OGG, and extract audio tracks from video files.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <UniversalUploader language={language} presetCategory="audio" />
          </div>
          <div className="pt-6">
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
              Image Tools & Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert JPG, PNG, WEBP, HEIC, resize, crop, and compress images with fast client-side processing.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <UniversalUploader language={language} presetCategory="image" />
          </div>
          <div className="pt-6">
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
              PDF Suite & Tools
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Merge, split, compress, rotate, and convert PDF documents directly inside your browser.
            </p>
          </div>
          <PdfToolsView initialTab="merge" />
        </div>
      );
    }

    if (currentRoute === '/documents') {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Document Converter
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Convert Word (DOCX), Text (TXT), HTML, EPUB, spreadsheets (CSV, XLSX), and archive formats.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <UniversalUploader language={language} presetCategory="document" />
          </div>
          <div className="pt-6">
            <ToolDirectoryView onSelectTool={navigateTo} initialCategory="document" />
          </div>
        </div>
      );
    }

    // DEDICATED COMPRESSOR & CONVERTER & SVG TOOLS
    if (
      currentRoute === '/image-compressor' ||
      currentRoute === '/image/image-compressor' ||
      currentRoute === '/tools/image-compressor'
    ) {
      return <ImageCompressorTool language={language} />;
    }

    if (
      currentRoute === '/video-compressor' ||
      currentRoute === '/video/video-compressor' ||
      currentRoute === '/tools/video-compressor'
    ) {
      return <VideoCompressorTool />;
    }

    if (
      currentRoute === '/image-converter' ||
      currentRoute === '/image/image-converter' ||
      currentRoute === '/tools/image-converter'
    ) {
      return <ImageConverterTool language={language} onNavigate={navigateTo} />;
    }

    if (
      currentRoute === '/video-converter' ||
      currentRoute === '/video/video-converter' ||
      currentRoute === '/tools/video-converter'
    ) {
      return <VideoConverterTool language={language} onNavigate={navigateTo} />;
    }

    if (
      currentRoute === '/image-to-svg' ||
      currentRoute === '/tools/image-to-svg'
    ) {
      return <ImageToSvgTool />;
    }

    if (
      currentRoute === '/svg-to-image' ||
      currentRoute === '/tools/svg-to-image'
    ) {
      return <SvgToImageTool />;
    }

    // SPECIALTY TOOLS
    if (
      currentRoute === '/image-resizer' ||
      currentRoute === '/image/resizer' ||
      currentRoute === '/tools/image-resizer'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Image Resizer</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Resize images by pixels or social media presets with aspect ratio lock.
            </p>
          </div>
          <ImageResizerTool />
        </div>
      );
    }

    if (
      currentRoute === '/image-crop' ||
      currentRoute === '/image/crop' ||
      currentRoute === '/tools/image-crop'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Image Cropper</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crop images to square 1:1, 16:9, 4:5, 9:16 portrait or rotate and flip.
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
      currentRoute === '/tools/compress-pdf'
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

    if (
      currentRoute === '/units' ||
      currentRoute === '/unit-converter' ||
      currentRoute === '/tools/unit-converter'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <UnitConverterView />
        </div>
      );
    }

    if (
      currentRoute === '/time' ||
      currentRoute === '/timezone-converter' ||
      currentRoute === '/tools/timezone-converter'
    ) {
      return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <TimeZoneConverterView />
        </div>
      );
    }

    // Match dedicated format tool route
    const trimmedPath = currentRoute.replace(/\/$/, '');
    const cleanSubPath = trimmedPath.replace(/^\/(image|video|audio|pdf|documents|compress|tools)\//, '/');
    const slugOnly = trimmedPath.split('/').filter(Boolean).pop() || '';

    const formatToolMatch = TOOLS_LIST.find((t) => {
      const toolRoute = t.route.replace(/\/$/, '');
      const toolSlug = toolRoute.replace(/^\//, '');
      return (
        t.route === trimmedPath ||
        `/tools${t.route}` === trimmedPath ||
        toolRoute === cleanSubPath ||
        toolSlug === slugOnly ||
        toolSlug === cleanSubPath.replace(/^\//, '') ||
        (t.id && (t.id === slugOnly || t.id === cleanSubPath.replace(/^\//, '')))
      );
    });

    if (formatToolMatch && trimmedPath !== '' && trimmedPath !== '/') {
      return (
        <DedicatedToolPage
          tool={formatToolMatch}
          language={language}
          onNavigate={navigateTo}
        />
      );
    }

    // DEFAULT HOMEPAGE
    return (
      <div className="w-full">
        {/* 1. HOMEPAGE HERO — CLEAN, MINIMAL, ABOVE THE FOLD */}
        <section className="w-full pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              {/* Premium small badge */}
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-500 border border-slate-200 bg-white/80 px-3 py-1 rounded-full dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                <span>ALL YOUR FILE TOOLS. ONE PLACE.</span>
              </div>

              {/* Exact Requested Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Convert anything. Effortlessly.
              </h1>

              {/* Exact Requested Supporting Text */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Fast, secure and simple tools for converting, compressing and working with your files.
              </p>

              {/* Quick Format Shortcuts */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                {[
                  { label: 'Image Compressor', route: '/image-compressor' },
                  { label: 'Video Compressor', route: '/video-compressor' },
                  { label: 'Image to SVG', route: '/image-to-svg' },
                  { label: 'SVG to Image', route: '/svg-to-image' },
                  { label: 'PDF to Word', route: '/tools/pdf-to-docx' },
                  { label: 'JPG to PNG', route: '/tools/jpg-to-png' },
                  { label: 'MP4 to MP3', route: '/tools/mp4-to-mp3' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigateTo(item.route)}
                    className="rounded-lg border border-slate-200/90 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. MAIN UPLOAD BOX — VISUAL CENTERPIECE ABOVE THE FOLD */}
            <div className="max-w-4xl mx-auto pt-2">
              <UniversalUploader language={language} />
            </div>
          </div>
        </section>

        {/* 7. POPULAR TOOLS */}
        <PopularToolsSection onSelectTool={navigateTo} />

        {/* 5. CONVERTX AI SECTION */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConvertXAISection onNavigate={navigateTo} />
        </div>

        {/* 14. HOW IT WORKS (01, 02, 03) */}
        <HowItWorksSection />

        {/* 6. TOOL CATEGORIES */}
        <ToolCategoriesSection onSelectTool={navigateTo} />

        {/* 13. TRUST / PRIVACY SECTION */}
        <TrustPrivacySection />

        {/* 16. FAQ SECTION */}
        <FaqSection />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
      {/* 10. Sticky Minimal Navbar */}
      <Navbar
        currentRoute={currentRoute}
        navigate={navigateTo}
        language={language}
        theme={theme}
        setLanguage={setLanguage}
        onLanguageChange={setLanguage}
        onThemeToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        setTheme={setTheme}
        onNavigate={navigateTo}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">{renderContent()}</main>

      {/* 17. Multi-column SaaS Footer */}
      <Footer language={language} onNavigate={navigateTo} />

      {/* 11. Command-Style Global Tool Search (⌘K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={navigateTo}
      />
    </div>
  );
}
