import React, { useState, useRef } from 'react';
import {
  Layers,
  RotateCw,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Check,
  AlertCircle,
  FileText,
  Split,
  Scissors,
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

interface PageItem {
  id: string;
  sourceDocIndex: number; // which uploaded file
  sourcePageIndex: number; // 0-based page index in that file
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl?: string;
}

interface UploadedPdf {
  file: File;
  numPages: number;
}

export const PdfPageManipulator: React.FC = () => {
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [splitRange, setSplitRange] = useState<string>('');
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load PDF file and generate thumbnails
  const handleAddPdf = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    setError(null);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const newPdfIndex = uploadedPdfs.length;
      const updatedUploads = [...uploadedPdfs, { file, numPages }];
      setUploadedPdfs(updatedUploads);

      const newPages: PageItem[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, canvas, viewport }).promise;
          const thumb = canvas.toDataURL('image/jpeg', 0.8);
          newPages.push({
            id: `p_${newPdfIndex}_${i}_${Date.now()}_${Math.random()}`,
            sourceDocIndex: newPdfIndex,
            sourcePageIndex: i - 1,
            rotation: 0,
            thumbnailUrl: thumb,
          });
        }
      }

      setPages((prev) => [...prev, ...newPages]);
    } catch (err: any) {
      console.error('[Manipulator Load Error]', err);
      setError(err?.message || 'Failed to load PDF pages.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rotate individual page 90 degrees clockwise
  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  // Delete page
  const handleDeletePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Duplicate page
  const handleDuplicatePage = (index: number) => {
    const target = pages[index];
    if (!target) return;
    const duplicated: PageItem = {
      ...target,
      id: `p_dup_${Date.now()}_${Math.random()}`,
    };
    const updated = [...pages];
    updated.splice(index + 1, 0, duplicated);
    setPages(updated);
  };

  // Move page up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...pages];
    const item = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = item;
    setPages(updated);
  };

  // Move page down
  const handleMoveDown = (index: number) => {
    if (index === pages.length - 1) return;
    const updated = [...pages];
    const item = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = item;
    setPages(updated);
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...pages];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setPages(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Export updated PDF
  const handleExport = async (rangeOnly: boolean = false) => {
    if (pages.length === 0) return;
    setIsExporting(true);
    setError(null);

    try {
      // Load all source PDFDocuments
      const sourceDocs: PDFDocument[] = [];
      for (const item of uploadedPdfs) {
        const buffer = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        sourceDocs.push(doc);
      }

      // Create new output document
      const outDoc = await PDFDocument.create();

      let targetPages = pages;
      if (rangeOnly && splitRange.trim()) {
        // Parse range like "1, 3-5"
        const selectedIndices = parsePageRanges(splitRange, pages.length);
        targetPages = selectedIndices.map((idx) => pages[idx]).filter(Boolean);
      }

      for (const p of targetPages) {
        const srcDoc = sourceDocs[p.sourceDocIndex];
        if (srcDoc) {
          const [copiedPage] = await outDoc.copyPages(srcDoc, [p.sourcePageIndex]);
          if (p.rotation !== 0) {
            const currentRotation = copiedPage.getRotation().angle;
            copiedPage.setRotation(degrees(currentRotation + p.rotation));
          }
          outDoc.addPage(copiedPage);
        }
      }

      const pdfBytes = await outDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reorganized-document-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Export Error]', err);
      setError(err?.message || 'Failed to export document.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper for split ranges like "1, 3-5"
  const parsePageRanges = (rangeStr: string, maxPages: number): number[] => {
    const indices: number[] = [];
    const parts = rangeStr.split(',').map((p) => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= maxPages) indices.push(i - 1);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= maxPages) {
          indices.push(num - 1);
        }
      }
    }
    return Array.from(new Set(indices));
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {pages.length === 0 ? 'Upload PDF to Organize' : 'Add Another PDF to Merge'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAddPdf(f);
              e.target.value = '';
            }}
          />

          {pages.length > 0 && (
            <span className="text-xs font-semibold text-slate-500">
              Total {pages.length} Pages · {uploadedPdfs.length} File{uploadedPdfs.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {pages.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* SPLIT RANGE INPUT */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="e.g. 1-3, 5"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                className="w-28 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                title="Specify page ranges to extract"
              />
              <button
                type="button"
                onClick={() => handleExport(true)}
                disabled={!splitRange.trim() || isExporting}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 disabled:opacity-40"
              >
                <Scissors className="w-3 h-3" /> Split & Save
              </button>
            </div>

            {/* EXPORT ALL BUTTON */}
            <button
              type="button"
              onClick={() => handleExport(false)}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Exported!
                </>
              ) : isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Export Reordered PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* THUMBNAILS GRID */}
      {pages.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-3xl p-16 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 hover:bg-violet-50/20 transition-all space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center shadow-sm">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Drag & Drop Page Reordering, Merge & Split
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload PDF files to view all pages as interactive thumbnails. Drag to reorder, rotate individual pages, or delete.
            </p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
          >
            Select PDF File
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag cards to rearrange page order, or use the rotate and delete buttons on each page card.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((p, idx) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-3 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between ${
                  draggedIndex === idx
                    ? 'border-violet-500 ring-2 ring-violet-400 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* PAGE BADGE */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Page {idx + 1}</span>
                  {p.rotation !== 0 && (
                    <span className="text-[10px] text-violet-600 font-semibold">{p.rotation}°</span>
                  )}
                </div>

                {/* THUMBNAIL IMAGE WITH ROTATION */}
                <div className="aspect-[3/4] w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain transition-transform duration-200"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                {/* ACTIONS TOOLBAR ON HOVER */}
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRotatePage(idx)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicatePage(idx)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                      title="Move Left/Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === pages.length - 1}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                      title="Move Right/Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(idx)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
