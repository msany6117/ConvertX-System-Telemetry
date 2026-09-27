import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Minimize2,
  Video,
  Music,
  Maximize2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface PopularToolsSectionProps {
  onSelectTool: (route: string) => void;
}

export const PopularToolsSection: React.FC<PopularToolsSectionProps> = ({ onSelectTool }) => {
  const popularTools = [
    {
      id: 'pdf-to-word',
      name: 'PDF to Word',
      description: 'Convert PDF documents into editable Microsoft Word DOCX files.',
      icon: BookOpen,
      route: '/tools/pdf-to-docx',
      badge: 'Document',
    },
    {
      id: 'jpg-to-png',
      name: 'JPG to PNG',
      description: 'Convert JPEG images to lossless PNG format with transparency support.',
      icon: ImageIcon,
      route: '/tools/jpg-to-png',
      badge: 'Image',
    },
    {
      id: 'png-to-jpg',
      name: 'PNG to JPG',
      description: 'Shrink transparent or heavy PNG photos into universal lightweight JPGs.',
      icon: ImageIcon,
      route: '/tools/png-to-jpg',
      badge: 'Image',
    },
    {
      id: 'compress-pdf',
      name: 'Compress PDF',
      description: 'Dramatically reduce PDF file sizes without degrading text sharpness.',
      icon: Minimize2,
      route: '/tools/compress-pdf',
      badge: 'PDF',
    },
    {
      id: 'compress-image',
      name: 'Compress Image',
      description: 'Optimize JPG, PNG, and WebP images by up to 80% with visual fidelity.',
      icon: Minimize2,
      route: '/image/image-compressor',
      badge: 'Optimization',
    },
    {
      id: 'mp4-to-mp3',
      name: 'MP4 to MP3',
      description: 'Extract studio-quality 320kbps audio tracks from any video container.',
      icon: Music,
      route: '/tools/mp4-to-mp3',
      badge: 'Audio',
    },
    {
      id: 'video-compressor',
      name: 'Video Compressor',
      description: 'Reduce MP4, MOV, and WebM video megabytes while preserving 1080p quality.',
      icon: Video,
      route: '/video/video-compressor',
      badge: 'Video',
    },
    {
      id: 'image-resizer',
      name: 'Image Resizer',
      description: 'Resize dimensions with locked aspect ratios and social media presets.',
      icon: Maximize2,
      route: '/tools/image-resizer',
      badge: 'Utility',
    },
  ];

  return (
    <section className="w-full py-16 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Quick Access
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Popular tools
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Handpicked high-performance converters running client-side with server fallback.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.route)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/70 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="text-[11px]">Convert now</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 dark:group-hover:text-white transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
