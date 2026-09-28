import React from 'react';
import {
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  BookOpen,
  FolderArchive,
  Sparkles,
  Scale,
  ArrowRight,
} from 'lucide-react';

interface ToolCategoriesSectionProps {
  onSelectTool: (route: string) => void;
}

export const ToolCategoriesSection: React.FC<ToolCategoriesSectionProps> = ({ onSelectTool }) => {
  const categories = [
    {
      id: 'image',
      name: 'Image Tools',
      badge: '18 tools',
      icon: ImageIcon,
      route: '/image',
      tools: [
        { label: 'JPG to PNG', route: '/tools/jpg-to-png' },
        { label: 'Image Compressor', route: '/image-compressor' },
        { label: 'Image to SVG', route: '/image-to-svg' },
        { label: 'SVG to Image', route: '/svg-to-image' },
        { label: 'Image Resizer', route: '/tools/image-resizer' },
      ],
    },
    {
      id: 'pdf',
      name: 'PDF Suite',
      badge: '12 tools',
      icon: FileText,
      route: '/pdf',
      tools: [
        { label: 'PDF to JPG', route: '/tools/pdf-to-jpg' },
        { label: 'JPG to PDF', route: '/tools/jpg-to-pdf' },
        { label: 'Merge PDF', route: '/tools/merge-pdf' },
        { label: 'Split PDF', route: '/tools/split-pdf' },
        { label: 'Compress PDF', route: '/tools/compress-pdf' },
      ],
    },
    {
      id: 'video',
      name: 'Video Tools',
      badge: '10 tools',
      icon: Video,
      route: '/video',
      tools: [
        { label: 'Video Compressor', route: '/video-compressor' },
        { label: 'Video Converter', route: '/video-converter' },
        { label: 'MP4 to MP3', route: '/tools/mp4-to-mp3' },
        { label: 'Video to GIF', route: '/video/mp4-to-gif' },
        { label: 'MP4 to WebM', route: '/video/mp4-to-webm' },
      ],
    },
    {
      id: 'audio',
      name: 'Audio Tools',
      badge: '8 tools',
      icon: Music,
      route: '/audio',
      tools: [
        { label: 'WAV to MP3', route: '/tools/wav-to-mp3' },
        { label: 'MP3 to WAV', route: '/tools/mp3-to-wav' },
        { label: 'FLAC to MP3', route: '/tools/flac-to-mp3' },
        { label: 'M4A to MP3', route: '/tools/m4a-to-mp3' },
        { label: 'Audio Compressor', route: '/audio/audio-compressor' },
      ],
    },
    {
      id: 'document',
      name: 'Document & Office',
      badge: '14 tools',
      icon: BookOpen,
      route: '/documents',
      tools: [
        { label: 'PDF to Word (DOCX)', route: '/tools/pdf-to-docx' },
        { label: 'Word to PDF', route: '/tools/docx-to-pdf' },
        { label: 'Excel to CSV', route: '/tools/xlsx-to-csv' },
        { label: 'CSV to Excel', route: '/tools/csv-to-xlsx' },
        { label: 'EPUB to PDF', route: '/tools/epub-to-pdf' },
      ],
    },
    {
      id: 'archive',
      name: 'Archive & Compression',
      badge: '6 tools',
      icon: FolderArchive,
      route: '/compress',
      tools: [
        { label: 'Image Compressor', route: '/image-compressor' },
        { label: 'Video Compressor', route: '/video-compressor' },
        { label: 'Compress PDF', route: '/tools/compress-pdf' },
        { label: 'Create ZIP Package', route: '/compress' },
        { label: 'Extract RAR / 7Z', route: '/tools' },
      ],
    },
    {
      id: 'ai',
      name: 'AI Tools',
      badge: 'Powered by GenAI',
      icon: Sparkles,
      route: '#ai',
      tools: [
        { label: 'Smart Format Router', route: '#ai' },
        { label: 'Document Summarizer', route: '#ai' },
        { label: 'Natural Language Convert', route: '#ai' },
        { label: 'OCR & Text Extractor', route: '/tools' },
        { label: 'Target Size Optimizer', route: '#ai' },
      ],
    },
    {
      id: 'utility',
      name: 'Calculators & Utility',
      badge: '13 domains',
      icon: Scale,
      route: '/tools/unit-converter',
      tools: [
        { label: 'Unit Converter (13 types)', route: '/tools/unit-converter' },
        { label: 'World Time Zones', route: '/tools/timezone-converter' },
        { label: 'Image Cropper 1:1, 16:9', route: '/tools/image-crop' },
        { label: 'Aspect Ratio Lock Tool', route: '/tools/image-resizer' },
        { label: 'System Queue Monitor', route: '/admin' },
      ],
    },
  ];

  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Categorized Ecosystem
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Everything you need for your files.
            </h2>
          </div>
          <button
            onClick={() => onSelectTool('/tools')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>View all 50+ tools</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    {cat.name}
                  </h3>

                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {cat.tools.map((t) => (
                      <li key={t.label}>
                        <button
                          onClick={() => onSelectTool(t.route)}
                          className="hover:text-slate-900 dark:hover:text-white transition-colors text-left flex items-center gap-1.5 py-0.5 w-full cursor-pointer"
                        >
                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span>{t.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => onSelectTool(cat.route)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Browse category</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
