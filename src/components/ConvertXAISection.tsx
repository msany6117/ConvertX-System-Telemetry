import React, { useState } from 'react';
import { Sparkles, ArrowRight, Zap, CheckCircle2, CornerDownLeft, Command } from 'lucide-react';
import { TOOLS_LIST } from '../data/tools';

interface ConvertXAISectionProps {
  onNavigate: (route: string) => void;
  onPresetAction?: (category: string, targetFormat: string) => void;
}

export const ConvertXAISection: React.FC<ConvertXAISectionProps> = ({
  onNavigate,
  onPresetAction,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestionResult, setSuggestionResult] = useState<{
    toolName: string;
    route: string;
    description: string;
    explanation: string;
  } | null>(null);

  const samplePrompts = [
    'Convert this PDF to Word',
    'Compress this image below 1 MB',
    'Make this video smaller',
    'Combine these images into a PDF',
    'Extract audio from MP4 video',
    'Resize image for Instagram post',
  ];

  const handleRunAICommand = (promptText: string) => {
    const query = (promptText || commandInput).trim().toLowerCase();
    if (!query) return;

    setIsProcessing(true);
    setSuggestionResult(null);

    setTimeout(() => {
      let matchedRoute = '/';
      let matchedName = 'Universal File Converter';
      let desc = 'Universal multi-format converter';
      let explanation = 'Configured intelligent file processor for your command.';

      if (query.includes('pdf to word') || query.includes('word') || query.includes('docx')) {
        matchedRoute = '/tools/pdf-to-docx';
        matchedName = 'PDF to Word (DOCX) Converter';
        desc = 'Convert PDF document directly to editable Microsoft Word format.';
        explanation = 'ConvertX AI selected the PDF to Word converter engine with layout preservation.';
      } else if (query.includes('compress') && (query.includes('image') || query.includes('jpg') || query.includes('png') || query.includes('mb'))) {
        matchedRoute = '/image/image-compressor';
        matchedName = 'Image Compressor';
        desc = 'Shrink JPG, PNG, and WebP file sizes below 1 MB without visual blur.';
        explanation = 'ConvertX AI selected high-efficiency WebP/MozJPEG compression presets.';
      } else if (query.includes('video') && (query.includes('small') || query.includes('compress') || query.includes('shrink'))) {
        matchedRoute = '/video/video-compressor';
        matchedName = 'Video Compressor';
        desc = 'Compress MP4, WebM, and MOV videos with H.264 CRF tuning.';
        explanation = 'ConvertX AI loaded client-side FFmpeg WebAssembly video rate controller.';
      } else if (query.includes('combine') || query.includes('merge') || (query.includes('images') && query.includes('pdf'))) {
        matchedRoute = '/tools/merge-pdf';
        matchedName = 'PDF & Image Binder';
        desc = 'Combine multiple PDF pages or photos into a single PDF.';
        explanation = 'ConvertX AI prepared the multi-file canvas binder.';
      } else if (query.includes('audio') || query.includes('mp3') || query.includes('extract')) {
        matchedRoute = '/tools/mp4-to-mp3';
        matchedName = 'MP4 to MP3 Audio Extractor';
        desc = 'Extract crystal-clear 320kbps MP3 audio stream from any video.';
        explanation = 'ConvertX AI selected the high-bitrate audio demuxer.';
      } else if (query.includes('resize') || query.includes('instagram') || query.includes('dimension')) {
        matchedRoute = '/tools/image-resizer';
        matchedName = 'Image Resizer';
        desc = 'Adjust dimensions with Instagram, YouTube, and Twitter presets.';
        explanation = 'ConvertX AI activated pixel dimension locking and social presets.';
      } else {
        // Find best match in tools list
        const match = TOOLS_LIST.find((t) =>
          query.split(' ').some((word) => word.length > 2 && (t.name.toLowerCase().includes(word) || t.id.includes(word)))
        );
        if (match) {
          matchedRoute = match.route;
          matchedName = match.name;
          desc = match.description;
          explanation = `ConvertX AI routed your request to the specialized ${match.name} module.`;
        }
      }

      setSuggestionResult({
        toolName: matchedName,
        route: matchedRoute,
        description: desc,
        explanation,
      });
      setIsProcessing(false);
    }, 400);
  };

  return (
    <section id="ai" className="w-full py-16 scroll-mt-20">
      <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 relative overflow-hidden">
        {/* Subtle technical corner badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
            <span>ConvertX AI Assistant</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
            Natural Language Command Engine
          </span>
        </div>

        <div className="space-y-2 mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Meet ConvertX AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tell us what you want to do. ConvertX will handle the rest.
          </p>
        </div>

        {/* AI Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunAICommand(commandInput);
          }}
          className="relative flex items-center rounded-2xl border border-slate-200 bg-slate-50/70 p-2 shadow-inner focus-within:border-slate-900 focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-900 dark:border-slate-700/80 dark:bg-slate-950/70 dark:focus-within:border-slate-100 dark:focus-within:bg-slate-950 dark:focus-within:ring-slate-100 transition-all"
        >
          <div className="pl-3 pr-2 text-slate-400">
            <Command className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="What would you like to do with your file?"
            className="flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          <button
            type="submit"
            disabled={!commandInput.trim() || isProcessing}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
          >
            <span>{isProcessing ? 'Analyzing...' : 'Execute'}</span>
            <CornerDownLeft className="h-3.5 w-3.5 opacity-70" />
          </button>
        </form>

        {/* Example Clickable Prompts */}
        <div className="mt-4 pt-2">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2">
            Try a command:
          </p>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setCommandInput(prompt);
                  handleRunAICommand(prompt);
                }}
                className="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* AI Result Card */}
        {suggestionResult && (
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  {suggestionResult.toolName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full font-medium">
                Ready to Process
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {suggestionResult.explanation}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-indigo-100/60 dark:border-indigo-900/40">
              <span className="text-[11px] text-slate-400">{suggestionResult.description}</span>
              <button
                onClick={() => onNavigate(suggestionResult.route)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
              >
                <span>Launch Tool</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
