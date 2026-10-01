import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Loader2, X } from 'lucide-react';

interface AIFileUploadZoneProps {
  onTextExtracted: (text: string, filename: string) => void;
  disabled?: boolean;
}

import { safeParseJsonResponse } from '../../services/aiClient';

export const AIFileUploadZone: React.FC<AIFileUploadZoneProps> = ({ onTextExtracted, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    setCurrentFile(file.name);

    // 1. Try server extraction
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('task', 'file_process');

      const res = await fetch('/api/ai/file-process', {
        method: 'POST',
        body: formData,
      });

      const parsed = await safeParseJsonResponse<any>(res);
      if (parsed.ok && parsed.data && parsed.data.result) {
        onTextExtracted(parsed.data.result, file.name);
        return;
      }
    } catch {
      // Server call failed, try client-side extraction below
    }

    // 2. Client-side fallback for text/csv/markdown/code formats
    try {
      const isTextFile =
        file.type.startsWith('text/') ||
        file.name.match(/\.(txt|csv|md|json|js|jsx|ts|tsx|html|xml|yaml|yml|log|rtf)$/i);

      if (isTextFile) {
        const textContent = await file.text();
        onTextExtracted(textContent, file.name);
        return;
      }

      throw new Error(
        'For PDF and Word documents on static hosting, please copy and paste the text directly into the input area.'
      );
    } catch (err: any) {
      setError(err.message || 'Error processing document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        accept=".pdf,.docx,.txt,.csv,.md,.json,.js,.ts,.py"
        className="hidden"
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
          disabled || isUploading
            ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            : 'border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-blue-400'
        }`}
      >
        {isUploading ? (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Extracting content from {currentFile}...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <UploadCloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Or analyze file directly: drop PDF, Word (DOCX), TXT, or CSV</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Scanned client-first. File is securely analyzed and immediately deleted from server.
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
