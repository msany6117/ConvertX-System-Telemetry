import React from 'react';
import { UniversalUploader } from './UniversalUploader';
import { Language } from '../types';
import { Video as VideoIcon, Sparkles } from 'lucide-react';

interface VideoConverterToolProps {
  language?: Language;
  onNavigate?: (route: string) => void;
}

export const VideoConverterTool: React.FC<VideoConverterToolProps> = ({ language = 'en', onNavigate }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
          <VideoIcon className="h-3.5 w-3.5" />
          <span>Universal Video Converter</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Convert Video between Any Format
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Transcode and convert MP4, MOV, WebM, MKV, AVI, and animated GIF. Extract audio tracks to MP3 with high-bitrate codecs.
        </p>

        {/* Quick Format Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          {[
            { label: 'MP4 to MP3', route: '/tools/mp4-to-mp3' },
            { label: 'MP4 to WebM', route: '/tools/mp4-to-webm' },
            { label: 'MOV to MP4', route: '/tools/mov-to-mp4' },
            { label: 'Video to GIF', route: '/tools/mp4-to-gif' },
            { label: 'Video Compressor', route: '/video-compressor' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate && onNavigate(item.route)}
              className="rounded-lg border border-slate-200/90 bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Uploader set to Video category */}
      <UniversalUploader language={language} presetCategory="video" />

      {/* Feature Points */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center sm:text-left">
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            High-Definition Encoders
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by modern H.264, VP9, and AAC engines ensuring maximum visual clarity at optimized bitrates.
          </p>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Audio Track Extraction
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Easily strip audio tracks from music videos, interviews, and webinars directly into 320kbps MP3 or WAV.
          </p>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Automatic File Destruction
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Files are automatically and permanently purged from server memory within 1 hour after conversion.
          </p>
        </div>
      </div>
    </div>
  );
};
