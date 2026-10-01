import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Type,
  Image as ImageIcon,
  Eraser,
  PenTool,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Check,
  AlertCircle,
  Move,
  Sliders,
} from 'lucide-react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';

interface TextAnnotation {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number; // canvas percentage (0 to 1)
  y: number; // canvas percentage (0 to 1)
  text: string;
  fontSize: number;
  color: string;
  isBold: boolean;
  backgroundColor?: string;
}

interface WhiteoutAnnotation {
  id: string;
  type: 'whiteout';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageAnnotation {
  id: string;
  type: 'image';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export const VisualPdfCanvasEditor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'whiteout' | 'image' | 'draw'>('select');

  // Text Tool Styling State
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [fontSize, setFontSize] = useState<number>(18);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [textBgColor, setTextBgColor] = useState<string>('transparent');

  // Annotations
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [whiteoutAnnotations, setWhiteoutAnnotations] = useState<WhiteoutAnnotation[]>([]);
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load PDF file with pdfjs-dist
  const handlePdfUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setIsLoading(true);
    setError(null);
    setFile(uploadedFile);
    setCurrentPage(1);
    setTextAnnotations([]);
    setWhiteoutAnnotations([]);
    setImageAnnotations([]);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDocProxy(pdf);
      setNumPages(pdf.numPages);
    } catch (err: any) {
      console.error('[PDF Load Error]', err);
      setError(err?.message || 'Failed to load PDF document.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDocProxy || !canvasRef.current) return;

    let isCancelled = false;
    const renderPage = async () => {
      try {
        const page = await pdfDocProxy.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await (page.render as any)({
          canvasContext: context,
          canvas,
          viewport,
        }).promise;
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('[Page Render Error]', err);
        }
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, currentPage, zoom]);

  // Handle Canvas Click to Place Items
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const relX = Math.max(0, Math.min(1, clickX / rect.width));
    const relY = Math.max(0, Math.min(1, clickY / rect.height));

    if (activeTool === 'text') {
      const newText: TextAnnotation = {
        id: 'txt_' + Date.now(),
        type: 'text',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        text: 'Click to edit text',
        fontSize,
        color: textColor,
        isBold,
        backgroundColor: textBgColor === 'transparent' ? undefined : textBgColor,
      };
      setTextAnnotations((prev) => [...prev, newText]);
      setSelectedAnnotationId(newText.id);
      setActiveTool('select');
    } else if (activeTool === 'whiteout') {
      const newWhiteout: WhiteoutAnnotation = {
        id: 'wh_' + Date.now(),
        type: 'whiteout',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        width: 0.25, // 25% of page width
        height: 0.04, // 4% of page height
      };
      setWhiteoutAnnotations((prev) => [...prev, newWhiteout]);
      setSelectedAnnotationId(newWhiteout.id);
      setActiveTool('select');
    }
  };

  // Image Upload Insertion
  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newImg: ImageAnnotation = {
        id: 'img_' + Date.now(),
        type: 'image',
        pageIndex: currentPage - 1,
        x: 0.3,
        y: 0.3,
        width: 0.3,
        height: 0.2,
        dataUrl,
      };
      setImageAnnotations((prev) => [...prev, newImg]);
      setSelectedAnnotationId(newImg.id);
      setActiveTool('select');
    };
    reader.readAsDataURL(imgFile);
    e.target.value = '';
  };

  // Delete Annotation
  const handleDeleteSelected = () => {
    if (!selectedAnnotationId) return;
    setTextAnnotations((prev) => prev.filter((a) => a.id !== selectedAnnotationId));
    setWhiteoutAnnotations((prev) => prev.filter((a) => a.id !== selectedAnnotationId));
    setImageAnnotations((prev) => prev.filter((a) => a.id !== selectedAnnotationId));
    setSelectedAnnotationId(null);
  };

  // Export updated PDF with pdf-lib
  const handleExportPdf = async () => {
    if (!file) return;
    setIsExporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Apply Whiteouts
      for (const wh of whiteoutAnnotations) {
        if (wh.pageIndex < pages.length) {
          const page = pages[wh.pageIndex];
          const { width, height } = page.getSize();
          const boxX = wh.x * width;
          const boxY = height - wh.y * height - wh.height * height;
          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: wh.width * width,
            height: wh.height * height,
            color: rgb(1, 1, 1),
          });
        }
      }

      // Apply Images
      for (const imgAnn of imageAnnotations) {
        if (imgAnn.pageIndex < pages.length) {
          const page = pages[imgAnn.pageIndex];
          const { width, height } = page.getSize();
          let embeddedImage: any = null;

          if (imgAnn.dataUrl.includes('image/png')) {
            const bytes = await fetch(imgAnn.dataUrl).then((r) => r.arrayBuffer());
            embeddedImage = await pdfDoc.embedPng(bytes);
          } else {
            const bytes = await fetch(imgAnn.dataUrl).then((r) => r.arrayBuffer());
            embeddedImage = await pdfDoc.embedJpg(bytes);
          }

          if (embeddedImage) {
            const imgW = imgAnn.width * width;
            const imgH = imgAnn.height * height;
            const imgX = imgAnn.x * width;
            const imgY = height - imgAnn.y * height - imgH;
            page.drawImage(embeddedImage, {
              x: imgX,
              y: imgY,
              width: imgW,
              height: imgH,
            });
          }
        }
      }

      // Apply Text Annotations
      for (const txt of textAnnotations) {
        if (txt.pageIndex < pages.length) {
          const page = pages[txt.pageIndex];
          const { width, height } = page.getSize();
          const targetX = txt.x * width;
          const targetY = height - txt.y * height - txt.fontSize;

          // Convert hex color to rgb
          const r = parseInt(txt.color.slice(1, 3), 16) / 255 || 0;
          const g = parseInt(txt.color.slice(3, 5), 16) / 255 || 0;
          const b = parseInt(txt.color.slice(5, 7), 16) / 255 || 0;

          page.drawText(txt.text, {
            x: targetX,
            y: targetY,
            size: txt.fontSize,
            color: rgb(r, g, b),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('[PDF Export Error]', err);
      setError(err?.message || 'Failed to export edited PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            {file ? 'Change PDF' : 'Upload PDF to Edit'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePdfUpload(f);
            }}
          />

          {file && (
            <span className="text-xs font-medium text-slate-500 truncate max-w-xs" title={file.name}>
              {file.name}
            </span>
          )}
        </div>

        {file && (
          <div className="flex flex-wrap items-center gap-2">
            {/* TOOL SELECTOR CHIPS */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTool === 'select'
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Select & Move Tool"
              >
                <Move className="w-3.5 h-3.5" />
                Select
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('text')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTool === 'text'
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Insert Text"
              >
                <Type className="w-3.5 h-3.5" />
                Add Text
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('whiteout')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTool === 'whiteout'
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Whiteout / Erase Existing Text"
              >
                <Eraser className="w-3.5 h-3.5" />
                Whiteout
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-violet-600"
                title="Add Image or Signature"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Add Image
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleImageInsert}
              />
            </div>

            {/* DELETE ITEM */}
            {selectedAnnotationId && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="p-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1"
                title="Delete selected item"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}

            {/* ZOOM CONTROLS */}
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* EXPORT BUTTON */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {isExporting ? 'Saving...' : 'Export PDF'}
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

      {/* TEXT FORMATTING BAR (when text tool or selected text) */}
      {(activeTool === 'text' || selectedAnnotationId) && (
        <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40 text-xs">
          <span className="font-bold text-violet-700 dark:text-violet-300">Text Properties:</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Size:</span>
            <input
              type="number"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => {
                const s = parseInt(e.target.value, 10) || 16;
                setFontSize(s);
                if (selectedAnnotationId) {
                  setTextAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedAnnotationId ? { ...a, fontSize: s } : a))
                  );
                }
              }}
              className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-center text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Color:</span>
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                const c = e.target.value;
                setTextColor(c);
                if (selectedAnnotationId) {
                  setTextAnnotations((prev) =>
                    prev.map((a) => (a.id === selectedAnnotationId ? { ...a, color: c } : a))
                  );
                }
              }}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
          </div>

          <span className="text-slate-400">
            {activeTool === 'text' ? 'Click anywhere on the canvas to place text' : 'Edit text directly in the box'}
          </span>
        </div>
      )}

      {/* MAIN CANVAS AREA */}
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-3xl p-16 text-center cursor-pointer bg-slate-50 dark:bg-slate-800/40 hover:bg-violet-50/20 transition-all space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center shadow-sm">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload PDF to Edit Content on Canvas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add new text, erase existing text with whiteout, insert images/signatures, and download the updated PDF.
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
        <div className="flex flex-col items-center space-y-4">
          {/* PAGE NAVIGATION BAR */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* CANVAS & OVERLAY WRAPPER */}
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className="relative border border-slate-300 dark:border-slate-700 rounded-lg shadow-xl bg-slate-200 dark:bg-slate-950 overflow-hidden cursor-crosshair"
            style={{ maxWidth: '100%' }}
          >
            {/* The PDF Page Canvas */}
            <canvas ref={canvasRef} className="block shadow-sm" />

            {/* WHITEOUT ANNOTATIONS LAYER */}
            {whiteoutAnnotations
              .filter((wh) => wh.pageIndex === currentPage - 1)
              .map((wh) => (
                <div
                  key={wh.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(wh.id);
                  }}
                  className={`absolute bg-white border ${
                    selectedAnnotationId === wh.id
                      ? 'border-violet-500 ring-2 ring-violet-400'
                      : 'border-slate-200'
                  }`}
                  style={{
                    left: `${wh.x * 100}%`,
                    top: `${wh.y * 100}%`,
                    width: `${wh.width * 100}%`,
                    height: `${wh.height * 100}%`,
                  }}
                  title="Whiteout box"
                />
              ))}

            {/* IMAGE ANNOTATIONS LAYER */}
            {imageAnnotations
              .filter((img) => img.pageIndex === currentPage - 1)
              .map((img) => (
                <div
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(img.id);
                  }}
                  className={`absolute cursor-move select-none ${
                    selectedAnnotationId === img.id ? 'ring-2 ring-violet-500' : ''
                  }`}
                  style={{
                    left: `${img.x * 100}%`,
                    top: `${img.y * 100}%`,
                    width: `${img.width * 100}%`,
                    height: `${img.height * 100}%`,
                  }}
                >
                  <img src={img.dataUrl} alt="annotation" className="w-full h-full object-contain pointer-events-none" />
                </div>
              ))}

            {/* TEXT ANNOTATIONS LAYER */}
            {textAnnotations
              .filter((txt) => txt.pageIndex === currentPage - 1)
              .map((txt) => (
                <div
                  key={txt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(txt.id);
                  }}
                  className={`absolute cursor-move ${
                    selectedAnnotationId === txt.id ? 'ring-2 ring-violet-500 rounded p-1' : ''
                  }`}
                  style={{
                    left: `${txt.x * 100}%`,
                    top: `${txt.y * 100}%`,
                    fontSize: `${txt.fontSize * (zoom / 1.2)}px`,
                    color: txt.color,
                    fontWeight: txt.isBold ? 'bold' : 'normal',
                    backgroundColor: txt.backgroundColor || 'transparent',
                  }}
                >
                  <input
                    type="text"
                    value={txt.text}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextAnnotations((prev) =>
                        prev.map((item) => (item.id === txt.id ? { ...item, text: val } : item))
                      );
                    }}
                    className="bg-transparent border-0 focus:outline-none p-0"
                    style={{ color: txt.color }}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
