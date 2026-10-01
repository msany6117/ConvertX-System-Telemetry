import React, { useState, useRef } from 'react';
import {
  Scan,
  FileText,
  Upload,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Search,
  BookOpen,
  Languages,
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { safeFetchJson } from '../../utils/apiClient';

const OCR_LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'ben', name: 'Bengali (বাংলা)' },
  { code: 'spa', name: 'Spanish (Español)' },
  { code: 'fra', name: 'French (Français)' },
  { code: 'deu', name: 'German (Deutsch)' },
  { code: 'hin', name: 'Hindi (हिन्दी)' },
  { code: 'ara', name: 'Arabic (العربية)' },
  { code: 'chi_sim', name: 'Chinese Simplified (简体中文)' },
  { code: 'jpn', name: 'Japanese (日本語)' },
];

export const PdfOcrExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>('eng');
  const [useAiGeminiFallback, setUseAiGeminiFallback] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ page: number; total: number; percent: number; statusText: string }>({
    page: 0,
    total: 0,
    percent: 0,
    statusText: '',
  });
  const [extractedText, setExtractedText] = useState<string>('');
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (uploadedFile: File) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setExtractedText('');
    setError(null);
  };

  const handleStartOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setExtractedText('');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      let fullOcrText = '';

      // Tesseract Worker
      let worker: any = null;
      if (!useAiGeminiFallback) {
        setProgress({ page: 0, total: numPages, percent: 5, statusText: 'Initializing Tesseract OCR engine...' });
        worker = await createWorker(selectedLang);
      }

      for (let i = 1; i <= Math.min(numPages, 30); i++) {
        const percent = Math.round((i / numPages) * 100);
        setProgress({
          page: i,
          total: numPages,
          percent,
          statusText: `Scanning page ${i} of ${numPages}...`,
        });

        // Render page to high-res canvas
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x for sharp OCR recognition

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, canvas, viewport }).promise;
          const imgDataUrl = canvas.toDataURL('image/png');
          if (i === 1) setActivePreviewUrl(imgDataUrl);

          if (useAiGeminiFallback) {
            // Gemini Vision OCR fallback via backend API
            try {
              const res = await safeFetchJson('/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  task: 'ocr',
                  input: `Extract text from scanned page ${i}`,
                  options: {
                    imageUrl: imgDataUrl,
                  },
                }),
              });
              fullOcrText += `\n\n--- Page ${i} ---\n\n` + (res?.result || '');
            } catch {
              // fallback to client tesseract if API fails
              if (!worker) worker = await createWorker(selectedLang);
              const ret = await worker.recognize(canvas);
              fullOcrText += `\n\n--- Page ${i} ---\n\n` + ret.data.text;
            }
          } else {
            const ret = await worker.recognize(canvas);
            fullOcrText += `\n\n--- Page ${i} ---\n\n` + ret.data.text;
          }

          setExtractedText(fullOcrText.trim());
        }
      }

      if (worker) {
        await worker.terminate();
      }

      setProgress({ page: numPages, total: numPages, percent: 100, statusText: 'OCR extraction complete!' });
    } catch (err: any) {
      console.error('[OCR Error]', err);
      setError(err?.message || 'Failed to extract text using OCR.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-extracted-${file?.name || 'document'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {file ? 'Change PDF' : 'Upload Scanned PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />

          {file && (
            <span className="text-xs font-semibold text-slate-500 truncate max-w-xs" title={file.name}>
              {file.name}
            </span>
          )}
        </div>

        {file && (
          <div className="flex flex-wrap items-center gap-3">
            {/* LANGUAGE SELECTOR */}
            <div className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                disabled={isProcessing}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {OCR_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AI GEMINI VISION TOGGLE */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={useAiGeminiFallback}
                onChange={(e) => setUseAiGeminiFallback(e.target.checked)}
                disabled={isProcessing}
                className="rounded accent-violet-600"
              />
              <Sparkles className="w-3 h-3 text-violet-500" />
              Gemini Vision OCR Mode
            </label>

            {/* START BUTTON */}
            <button
              type="button"
              onClick={handleStartOcr}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
              {isProcessing ? 'Extracting Text...' : 'Start OCR Extraction'}
            </button>
          </div>
        )}
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* PROGRESS BAR WHILE SCANNING */}
      {isProcessing && (
        <div className="p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs font-bold text-violet-800 dark:text-violet-200">
            <span>{progress.statusText}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-violet-100 dark:bg-violet-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* MAIN VIEW: SPLIT SCREEN PREVIEW & TEXT EDITOR */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-3xl p-16 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 hover:bg-violet-50/20 transition-all space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center shadow-sm">
            <Scan className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Optical Character Recognition (OCR) for Scanned PDFs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convert image-only and scanned documents into editable, searchable text using Tesseract.js with Gemini Vision fallback.
            </p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
          >
            Select Scanned Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: SCANNED PAGE PREVIEW */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Original Document Preview</span>
              {activePreviewUrl && <span>Page 1</span>}
            </div>

            <div className="aspect-[3/4] w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-700">
              {activePreviewUrl ? (
                <img src={activePreviewUrl} alt="Document page" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-slate-400 space-y-2 p-6">
                  <FileText className="w-10 h-10 mx-auto opacity-50" />
                  <p className="text-xs">Click "Start OCR Extraction" to scan pages.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: EDITABLE EXTRACTED TEXT */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Editable OCR Text ({extractedText.split(/\s+/).filter(Boolean).length} words)
              </span>

              {extractedText && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download TXT
                  </button>
                </div>
              )}
            </div>

            <textarea
              rows={18}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Extracted digital text will appear here. You can edit, copy, and export it directly..."
              className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs font-mono leading-relaxed resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
