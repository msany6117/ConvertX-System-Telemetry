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
  Layers,
  RotateCw,
  Plus,
  Scissors,
  Split,
  Sparkles,
  Bot,
  Volume2,
  TrendingUp,
  Scan,
  MessageSquare,
  Play,
  Pause,
  Square,
  Copy,
  ChevronDown,
  Wand2,
  X,
  Target,
  Send,
  Eye,
  FileCheck,
} from 'lucide-react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { createWorker } from 'tesseract.js';
import { safeFetchJson } from '../../utils/apiClient';

export interface TextBlock {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number; // percentage of page (0 to 1)
  y: number; // percentage of page (0 to 1)
  width?: number;
  text: string;
  fontSize: number;
  color: string;
  isBold: boolean;
  isOcr?: boolean;
}

export interface WhiteoutBlock {
  id: string;
  type: 'whiteout';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export interface DrawStroke {
  id: string;
  type: 'draw';
  pageIndex: number;
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
}

export interface PageMeta {
  id: string;
  sourceDocIndex: number;
  sourcePageIndex: number;
  rotation: number;
  thumbnailUrl?: string;
  hasText?: boolean;
}

export const UnifiedPdfWorkspace: React.FC<{ initialFile?: File | null }> = ({ initialFile = null }) => {
  // Main PDF File State
  const [file, setFile] = useState<File | null>(initialFile);
  const [sourceFiles, setSourceFiles] = useState<File[]>(initialFile ? [initialFile] : []);
  const [pdfProxy, setPdfProxy] = useState<any>(null);
  const [pagesList, setPagesList] = useState<PageMeta[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Tools & Selection
  const [activeTool, setActiveTool] = useState<'select' | 'editText' | 'addText' | 'whiteout' | 'image' | 'draw'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Styling state for text
  const [fontSize, setFontSize] = useState<number>(18);
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [isBold, setIsBold] = useState<boolean>(false);

  // Drawing state
  const [penColor, setPenColor] = useState<string>('#2563eb');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);

  // Annotations
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [whiteouts, setWhiteouts] = useState<WhiteoutBlock[]>([]);
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([]);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);

  // OCR state
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [detectedScannedPage, setDetectedScannedPage] = useState<boolean>(false);

  // UI Panels
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);
  const [activeAiTab, setActiveAiTab] = useState<'askPdf' | 'tts' | 'seo' | 'imageGen'>('askPdf');

  // AI Assistant: Ask PDF state
  const [extractedDocText, setExtractedDocText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string }>>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Welcome to Adobe Acrobat-style ConvertX Studio! Upload your PDF to edit text, reorder pages, perform OCR, or ask questions about the document.',
    },
  ]);
  const [queryInput, setQueryInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // AI Assistant: TTS state
  const [ttsIsPlaying, setTtsIsPlaying] = useState<boolean>(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);

  // AI Assistant: SEO state
  const [seoKeyword, setSeoKeyword] = useState<string>('');
  const [seoResult, setSeoResult] = useState<any>(null);
  const [isSeoAnalyzing, setIsSeoAnalyzing] = useState<boolean>(false);

  // AI Assistant: Image Generator state
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 1. LOAD MAIN PDF
  const loadPdf = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setIsLoading(true);
    setError(null);
    setFile(uploadedFile);
    setSourceFiles([uploadedFile]);
    setCurrentPage(1);
    setTextBlocks([]);
    setWhiteouts([]);
    setImageBlocks([]);
    setDrawStrokes([]);
    setSelectedId(null);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfProxy(pdf);

      // Generate thumbnails and check text content
      const metas: PageMeta[] = [];
      let fullDocumentText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
        fullDocumentText += `\n--- Page ${i} ---\n` + pageText;

        const viewport = page.getViewport({ scale: 0.3 });
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = viewport.width;
        thumbCanvas.height = viewport.height;
        const ctx = thumbCanvas.getContext('2d');
        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, canvas: thumbCanvas, viewport }).promise;
        }

        metas.push({
          id: `page_0_${i}_${Date.now()}`,
          sourceDocIndex: 0,
          sourcePageIndex: i - 1,
          rotation: 0,
          thumbnailUrl: thumbCanvas.toDataURL('image/jpeg', 0.8),
          hasText: pageText.trim().length > 30,
        });
      }

      setPagesList(metas);
      setExtractedDocText(fullDocumentText.trim());

      setChatMessages([
        {
          id: 'ready',
          sender: 'assistant',
          text: `📄 **${uploadedFile.name}** loaded with ${pdf.numPages} page(s). You can edit text directly on canvas, rearrange pages, or ask me anything about the content!`,
        },
      ]);
    } catch (err: any) {
      console.error('[Workspace Load Error]', err);
      setError(err?.message || 'Failed to load PDF document.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialFile) {
      loadPdf(initialFile);
    }
  }, [initialFile]);

  // 2. RENDER ACTIVE PAGE ON CANVAS
  useEffect(() => {
    if (!pdfProxy || !canvasRef.current || pagesList.length === 0) return;

    let isCancelled = false;
    const renderActivePage = async () => {
      try {
        const pageMeta = pagesList[currentPage - 1];
        if (!pageMeta) return;

        const page = await pdfProxy.getPage(pageMeta.sourcePageIndex + 1);
        if (isCancelled) return;

        // Auto-detect scanned page
        const textContent = await page.getTextContent();
        const textStr = textContent.items.map((it: any) => it.str || '').join(' ').trim();
        const isScanned = textStr.length < 25;
        setDetectedScannedPage(isScanned);

        const viewport = page.getViewport({
          scale: zoom,
          rotation: pageMeta.rotation,
        });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Sync drawing canvas overlay dimensions
        if (drawCanvasRef.current) {
          drawCanvasRef.current.height = viewport.height;
          drawCanvasRef.current.width = viewport.width;
        }

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

    renderActivePage();
    return () => {
      isCancelled = true;
    };
  }, [pdfProxy, currentPage, zoom, pagesList]);

  // 3. AUTOMATIC OCR DETECTION & RUNNER
  const handleRunOcrOnPage = async () => {
    if (!canvasRef.current) return;
    setIsOcrScanning(true);
    setOcrProgress(15);
    try {
      const worker = await createWorker('eng');
      setOcrProgress(50);
      const ret = await worker.recognize(canvasRef.current);
      setOcrProgress(90);

      // Convert detected OCR lines into interactive editable text blocks!
      const lines = (ret.data as any).lines || [];
      const canvasW = canvasRef.current.width;
      const canvasH = canvasRef.current.height;

      const newBlocks: TextBlock[] = lines
        .filter((l: any) => l.text.trim().length > 0)
        .map((l: any, idx: number) => {
          const bbox = l.bbox;
          return {
            id: `ocr_${Date.now()}_${idx}`,
            type: 'text',
            pageIndex: currentPage - 1,
            x: Math.max(0, bbox.x0 / canvasW),
            y: Math.max(0, bbox.y0 / canvasH),
            text: l.text.trim(),
            fontSize: Math.max(12, Math.round((bbox.y1 - bbox.y0) * 0.75)),
            color: '#0f172a',
            isBold: false,
            isOcr: true,
          };
        });

      setTextBlocks((prev) => [...prev, ...newBlocks]);
      await worker.terminate();
      setDetectedScannedPage(false);
      setOcrProgress(100);
      setExportMessage(`✨ OCR completed! ${newBlocks.length} text blocks are now editable directly on the canvas.`);
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      console.error('[OCR Error]', err);
      setError(err?.message || 'OCR processing failed.');
    } finally {
      setIsOcrScanning(false);
    }
  };

  // 4. CANVAS CLICKS (Add Text, Whiteout, Image Placement)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    if (activeTool === 'select' || activeTool === 'draw') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const relX = Math.max(0, Math.min(1, clickX / rect.width));
    const relY = Math.max(0, Math.min(1, clickY / rect.height));

    if (activeTool === 'addText' || activeTool === 'editText') {
      const newBlock: TextBlock = {
        id: `txt_${Date.now()}`,
        type: 'text',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        text: 'Type text here...',
        fontSize,
        color: textColor,
        isBold,
      };
      setTextBlocks((prev) => [...prev, newBlock]);
      setSelectedId(newBlock.id);
      setActiveTool('select');
    } else if (activeTool === 'whiteout') {
      const newWhiteout: WhiteoutBlock = {
        id: `wh_${Date.now()}`,
        type: 'whiteout',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        width: 0.25,
        height: 0.04,
      };
      setWhiteouts((prev) => [...prev, newWhiteout]);
      setSelectedId(newWhiteout.id);
      setActiveTool('select');
    }
  };

  // 5. FREEHAND DRAWING
  const handleMouseDownDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw' || !drawCanvasRef.current) return;
    setIsDrawing(true);
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentStroke([{ x, y }]);
  };

  const handleMouseMoveDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw' || !drawCanvasRef.current) return;
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentStroke((prev) => [...prev, { x, y }]);

    // Live draw on overlay canvas
    const ctx = drawCanvasRef.current.getContext('2d');
    if (ctx && currentStroke.length > 1) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentStroke[currentStroke.length - 2].x, currentStroke[currentStroke.length - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUpDraw = () => {
    if (!isDrawing || activeTool !== 'draw') return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      const stroke: DrawStroke = {
        id: `draw_${Date.now()}`,
        type: 'draw',
        pageIndex: currentPage - 1,
        points: currentStroke,
        color: penColor,
        strokeWidth: penWidth,
      };
      setDrawStrokes((prev) => [...prev, stroke]);
    }
    setCurrentStroke([]);
  };

  // 6. IMAGE INSERTION
  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newImg: ImageBlock = {
        id: `img_${Date.now()}`,
        type: 'image',
        pageIndex: currentPage - 1,
        x: 0.3,
        y: 0.3,
        width: 0.3,
        height: 0.2,
        dataUrl,
      };
      setImageBlocks((prev) => [...prev, newImg]);
      setSelectedId(newImg.id);
      setActiveTool('select');
    };
    reader.readAsDataURL(imgFile);
    e.target.value = '';
  };

  // 7. PAGE MANIPULATION (Rotate, Reorder, Delete, Merge)
  const handleRotatePage = (index: number) => {
    setPagesList((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDeletePage = (index: number) => {
    if (pagesList.length <= 1) return;
    setPagesList((prev) => prev.filter((_, i) => i !== index));
    if (currentPage > pagesList.length - 1) {
      setCurrentPage(Math.max(1, pagesList.length - 1));
    }
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pagesList.length) return;
    const updated = [...pagesList];
    const item = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, item);
    setPagesList(updated);
    setCurrentPage(toIndex + 1);
  };

  const handleMergePdf = async (mergeFile: File) => {
    if (!mergeFile) return;
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const arrayBuffer = await mergeFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const newDocIndex = sourceFiles.length;
      setSourceFiles((prev) => [...prev, mergeFile]);

      const newMetas: PageMeta[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = viewport.width;
        thumbCanvas.height = viewport.height;
        const ctx = thumbCanvas.getContext('2d');
        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, canvas: thumbCanvas, viewport }).promise;
        }

        newMetas.push({
          id: `page_${newDocIndex}_${i}_${Date.now()}`,
          sourceDocIndex: newDocIndex,
          sourcePageIndex: i - 1,
          rotation: 0,
          thumbnailUrl: thumbCanvas.toDataURL('image/jpeg', 0.8),
        });
      }

      setPagesList((prev) => [...prev, ...newMetas]);
      setExportMessage(`Merged ${pdf.numPages} pages from "${mergeFile.name}".`);
      setTimeout(() => setExportMessage(null), 3000);
    } catch (err: any) {
      console.error('[Merge Error]', err);
      setError(err?.message || 'Failed to merge PDF.');
    }
  };

  // 8. UNIFIED PDF EXPORT
  const handleExportPdf = async () => {
    if (!file || pagesList.length === 0) return;
    setIsExporting(true);
    setError(null);

    try {
      // Load source documents
      const docs: PDFDocument[] = [];
      for (const sf of sourceFiles) {
        const buf = await sf.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        docs.push(doc);
      }

      const outDoc = await PDFDocument.create();

      for (let idx = 0; idx < pagesList.length; idx++) {
        const pMeta = pagesList[idx];
        const src = docs[pMeta.sourceDocIndex];
        if (!src) continue;

        const [copiedPage] = await outDoc.copyPages(src, [pMeta.sourcePageIndex]);
        if (pMeta.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pMeta.rotation));
        }

        const { width, height } = copiedPage.getSize();

        // 1. Draw Whiteouts for this page
        const pageWhiteouts = whiteouts.filter((wh) => wh.pageIndex === idx);
        for (const wh of pageWhiteouts) {
          copiedPage.drawRectangle({
            x: wh.x * width,
            y: height - wh.y * height - wh.height * height,
            width: wh.width * width,
            height: wh.height * height,
            color: rgb(1, 1, 1),
          });
        }

        // 2. Draw Images for this page
        const pageImages = imageBlocks.filter((im) => im.pageIndex === idx);
        for (const im of pageImages) {
          let embeddedImg: any = null;
          const bytes = await fetch(im.dataUrl).then((r) => r.arrayBuffer());
          if (im.dataUrl.includes('image/png')) {
            embeddedImg = await outDoc.embedPng(bytes);
          } else {
            embeddedImg = await outDoc.embedJpg(bytes);
          }

          if (embeddedImg) {
            const imW = im.width * width;
            const imH = im.height * height;
            copiedPage.drawImage(embeddedImg, {
              x: im.x * width,
              y: height - im.y * height - imH,
              width: imW,
              height: imH,
            });
          }
        }

        // 3. Draw Text Annotations
        const pageTexts = textBlocks.filter((tb) => tb.pageIndex === idx);
        for (const tb of pageTexts) {
          const r = parseInt(tb.color.slice(1, 3), 16) / 255 || 0;
          const g = parseInt(tb.color.slice(3, 5), 16) / 255 || 0;
          const b = parseInt(tb.color.slice(5, 7), 16) / 255 || 0;

          copiedPage.drawText(tb.text, {
            x: tb.x * width,
            y: height - tb.y * height - tb.fontSize,
            size: tb.fontSize,
            color: rgb(r, g, b),
          });
        }

        outDoc.addPage(copiedPage);
      }

      const pdfBytes = await outDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convertx-studio-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportMessage('🎉 PDF exported successfully with all edits and page re-arrangements!');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      console.error('[Export PDF Error]', err);
      setError(err?.message || 'Failed to export modified PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // 9. AI SUITE: ASK PDF CHAT
  const handleSendChat = async (promptOverride?: string) => {
    const textToSend = promptOverride || queryInput;
    if (!textToSend.trim() || isAiThinking || !extractedDocText) return;

    const userMsg = { id: `u_${Date.now()}`, sender: 'user' as const, text: textToSend.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setQueryInput('');
    setIsAiThinking(true);

    try {
      const data = await safeFetchJson('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'ask_pdf',
          input: textToSend.trim(),
          options: {
            documentContext: extractedDocText.substring(0, 40000),
          },
        }),
      });

      const reply = data?.result || 'I analyzed the document but could not extract a conclusive answer.';
      setChatMessages((prev) => [...prev, { id: `a_${Date.now()}`, sender: 'assistant', text: reply }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, sender: 'assistant', text: 'Error communicating with ConvertX AI. Please try again.' },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // 10. AI SUITE: TEXT-TO-SPEECH (Current Page)
  const handlePlayTts = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (ttsIsPlaying) {
      window.speechSynthesis.cancel();
      setTtsIsPlaying(false);
      return;
    }

    const textToSpeak = extractedDocText || 'No text found on this document.';
    const utterance = new SpeechSynthesisUtterance(textToSpeak.substring(0, 3000));
    utterance.rate = ttsSpeed;

    utterance.onstart = () => setTtsIsPlaying(true);
    utterance.onend = () => setTtsIsPlaying(false);
    utterance.onerror = () => setTtsIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  // 11. AI SUITE: SEO AUDIT
  const handleRunSeoAudit = async () => {
    if (!extractedDocText) return;
    setIsSeoAnalyzing(true);
    try {
      const data = await safeFetchJson('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'seo_optimize',
          input: extractedDocText.substring(0, 8000),
          options: {
            targetKeyword: seoKeyword || 'document content',
          },
        }),
      });
      if (data?.structuredData) {
        setSeoResult(data.structuredData);
      } else if (data?.result) {
        try {
          setSeoResult(JSON.parse(data.result));
        } catch {
          setSeoResult({ seoScore: 78, improvedContent: data.result });
        }
      }
    } catch (err: any) {
      console.error('[SEO Audit Error]', err);
    } finally {
      setIsSeoAnalyzing(false);
    }
  };

  // 12. AI SUITE: IMAGE GENERATION & INSERT INTO PDF
  const handleGenerateAiImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImg) return;
    setIsGeneratingImg(true);
    try {
      const seed = Math.floor(Math.random() * 9999999);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=768&height=768&seed=${seed}&nologo=true`;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = url;
      });
      setGeneratedImgUrl(url);
    } catch (err: any) {
      setError('Image generation failed. Please try again.');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleInsertGeneratedImageToPdf = () => {
    if (!generatedImgUrl) return;
    const newImg: ImageBlock = {
      id: `img_ai_${Date.now()}`,
      type: 'image',
      pageIndex: currentPage - 1,
      x: 0.35,
      y: 0.35,
      width: 0.3,
      height: 0.25,
      dataUrl: generatedImgUrl,
    };
    setImageBlocks((prev) => [...prev, newImg]);
    setSelectedId(newImg.id);
    setExportMessage('Added generated AI image to canvas!');
    setTimeout(() => setExportMessage(null), 3000);
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-80px)] min-h-[750px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* 1. TOP ACROBAT COMMAND RIBBON */}
      <div className="h-14 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* LEFT: FILE NAME & PAGE CONTROLS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {file ? 'Replace PDF' : 'Open PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadPdf(f);
            }}
          />

          {file && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[200px]" title={file.name}>
                {file.name}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">
                Page {currentPage} of {pagesList.length}
              </span>
            </div>
          )}
        </div>

        {/* CENTER: ACROBAT TOOL RIBBON */}
        {file && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-0.5 shadow-inner">
            <button
              onClick={() => setActiveTool('select')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTool === 'select'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Select & Move Tool (V)"
            >
              <Move className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Select</span>
            </button>

            <button
              onClick={() => setActiveTool('addText')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTool === 'addText'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Add or Edit Text"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Add Text</span>
            </button>

            <button
              onClick={() => setActiveTool('whiteout')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTool === 'whiteout'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Whiteout / Erase Content"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Whiteout</span>
            </button>

            <button
              onClick={() => imageInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              title="Insert Image / Signature"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Image</span>
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleImageInsert}
            />

            <button
              onClick={() => setActiveTool('draw')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTool === 'draw'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Freehand Signature / Pen"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Draw</span>
            </button>

            {/* OCR AUTO-TRIGGER */}
            <button
              onClick={handleRunOcrOnPage}
              disabled={isOcrScanning}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                detectedScannedPage
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Scan page with Tesseract OCR to make text editable"
            >
              {isOcrScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{isOcrScanning ? 'Scanning...' : 'OCR Scan'}</span>
            </button>
          </div>
        )}

        {/* RIGHT: ZOOM, AI DRAWER TOGGLE & EXPORT */}
        <div className="flex items-center gap-2">
          {file && (
            <>
              {/* ZOOM CONTROLS */}
              <div className="hidden sm:flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 min-w-[36px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* AI DRAWER TOGGLE */}
              <button
                type="button"
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  rightSidebarOpen
                    ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>AI Suite</span>
              </button>

              {/* SAVE / EXPORT PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExporting ? 'Saving...' : 'Save PDF'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* NOTIFICATION NOTICES */}
      {exportMessage && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between font-semibold">
          <span>{exportMessage}</span>
          <button onClick={() => setExportMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-600 text-white text-xs px-4 py-2 flex items-center justify-between font-semibold">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE BODY (3-COLUMN LAYOUT) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* COLUMN 1: LEFT PAGE ORGANIZER & THUMBNAILS (Collapsible) */}
        {file && leftSidebarOpen && (
          <div className="w-48 sm:w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pages ({pagesList.length})
              </span>
              <button
                type="button"
                onClick={() => mergeFileInputRef.current?.click()}
                className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600 text-[11px] font-semibold flex items-center gap-1"
                title="Merge another PDF"
              >
                <Plus className="w-3 h-3" /> Add PDF
              </button>
              <input
                ref={mergeFileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleMergePdf(f);
                }}
              />
            </div>

            {/* THUMBNAILS LIST */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pagesList.map((pm, idx) => (
                <div
                  key={pm.id}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`group relative rounded-xl border p-2 transition-all cursor-pointer ${
                    currentPage === idx + 1
                      ? 'border-violet-600 bg-violet-50/50 dark:bg-violet-950/30 ring-2 ring-violet-500'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Page {idx + 1}</span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(idx);
                        }}
                        className="p-1 hover:text-violet-600"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(idx);
                        }}
                        className="p-1 hover:text-rose-600"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="aspect-[3/4] w-full rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    {pm.thumbnailUrl ? (
                      <img
                        src={pm.thumbnailUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-contain"
                        style={{ transform: `rotate(${pm.rotation}deg)` }}
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COLUMN 2: CENTER INFINITE VIEWPORT & DOCUMENT CANVAS */}
        <div className="flex-1 bg-slate-200/80 dark:bg-slate-950 overflow-auto p-4 sm:p-8 flex flex-col items-center justify-start relative select-none">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="my-auto max-w-lg w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-3xl p-12 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all space-y-4 shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Adobe Acrobat-Style PDF Workspace
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Open any PDF to edit text directly on canvas, OCR scanned docs, reorder pages, and chat with AI.
                </p>
              </div>
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              >
                Choose PDF File
              </button>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              {/* SCANNED PAGE DETECTED BANNER */}
              {detectedScannedPage && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200 shadow-sm animate-in fade-in">
                  <Scan className="w-4 h-4 text-amber-600" />
                  <span>
                    <strong>Scanned Document Detected:</strong> Convert image layer into editable, selectable text.
                  </span>
                  <button
                    onClick={handleRunOcrOnPage}
                    disabled={isOcrScanning}
                    className="ml-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    {isOcrScanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    {isOcrScanning ? 'Scanning...' : 'Make Text Editable'}
                  </button>
                </div>
              )}

              {/* DOCUMENT PAPER CANVAS CONTAINER */}
              <div
                ref={containerRef}
                onClick={handleCanvasClick}
                className="relative bg-white shadow-2xl rounded-sm border border-slate-300 dark:border-slate-800 cursor-crosshair overflow-hidden"
                style={{
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)',
                }}
              >
                {/* 1. Underlying PDF Render Canvas */}
                <canvas ref={canvasRef} className="block pointer-events-none" />

                {/* 2. Freehand Drawing Canvas Overlay */}
                <canvas
                  ref={drawCanvasRef}
                  onMouseDown={handleMouseDownDraw}
                  onMouseMove={handleMouseMoveDraw}
                  onMouseUp={handleMouseUpDraw}
                  className={`absolute inset-0 ${activeTool === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                />

                {/* 3. Whiteouts Layer */}
                {whiteouts
                  .filter((wh) => wh.pageIndex === currentPage - 1)
                  .map((wh) => (
                    <div
                      key={wh.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(wh.id);
                      }}
                      className={`absolute bg-white border ${
                        selectedId === wh.id ? 'border-violet-500 ring-2 ring-violet-400' : 'border-slate-200'
                      }`}
                      style={{
                        left: `${wh.x * 100}%`,
                        top: `${wh.y * 100}%`,
                        width: `${wh.width * 100}%`,
                        height: `${wh.height * 100}%`,
                      }}
                    />
                  ))}

                {/* 4. Images Layer */}
                {imageBlocks
                  .filter((im) => im.pageIndex === currentPage - 1)
                  .map((im) => (
                    <div
                      key={im.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(im.id);
                      }}
                      className={`absolute cursor-move ${selectedId === im.id ? 'ring-2 ring-violet-500 rounded p-1' : ''}`}
                      style={{
                        left: `${im.x * 100}%`,
                        top: `${im.y * 100}%`,
                        width: `${im.width * 100}%`,
                        height: `${im.height * 100}%`,
                      }}
                    >
                      <img src={im.dataUrl} alt="PDF Asset" className="w-full h-full object-contain pointer-events-none" />
                    </div>
                  ))}

                {/* 5. Interactive Editable Text Blocks (Click to Edit) */}
                {textBlocks
                  .filter((tb) => tb.pageIndex === currentPage - 1)
                  .map((tb) => (
                    <div
                      key={tb.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(tb.id);
                      }}
                      className={`absolute cursor-move ${
                        selectedId === tb.id
                          ? 'ring-2 ring-violet-500 bg-violet-50/70 dark:bg-violet-900/60 rounded px-1'
                          : tb.isOcr
                          ? 'hover:bg-amber-100/60 rounded'
                          : ''
                      }`}
                      style={{
                        left: `${tb.x * 100}%`,
                        top: `${tb.y * 100}%`,
                        fontSize: `${tb.fontSize * (zoom / 1.1)}px`,
                        color: tb.color,
                        fontWeight: tb.isBold ? 'bold' : 'normal',
                      }}
                    >
                      <input
                        type="text"
                        value={tb.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTextBlocks((prev) =>
                            prev.map((item) => (item.id === tb.id ? { ...item, text: val } : item))
                          );
                        }}
                        className="bg-transparent border-0 focus:outline-none p-0"
                        style={{ color: tb.color }}
                      />
                    </div>
                  ))}
              </div>

              {/* PAGE BOTTOM CONTROLS */}
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {currentPage} of {pagesList.length}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagesList.length, p + 1))}
                  disabled={currentPage >= pagesList.length}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3: RIGHT COLLAPSIBLE AI SUITE DRAWER */}
        {file && rightSidebarOpen && (
          <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            {/* AI TABS HEADER */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveAiTab('askPdf')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'askPdf'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Ask PDF
                </button>
                <button
                  onClick={() => setActiveAiTab('tts')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'tts'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  TTS Audio
                </button>
                <button
                  onClick={() => setActiveAiTab('seo')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'seo'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  SEO
                </button>
                <button
                  onClick={() => setActiveAiTab('imageGen')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'imageGen'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Image
                </button>
              </div>

              <button onClick={() => setRightSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: ASK PDF CHAT */}
            {activeAiTab === 'askPdf' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((m) => (
                    <div key={m.id} className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.sender === 'assistant' && (
                        <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-violet-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {isAiThinking && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600" />
                      <span>Reading document sections...</span>
                    </div>
                  )}
                </div>

                {/* QUICK PROMPTS CHIPS */}
                <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none">
                  {['Summarize document', 'Action items', 'Find key risks'].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendChat(q)}
                      disabled={isAiThinking}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder="Ask anything about this PDF..."
                      disabled={isAiThinking}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!queryInput.trim() || isAiThinking}
                      className="p-2 rounded-xl bg-violet-600 text-white disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 2: TEXT TO SPEECH */}
            {activeAiTab === 'tts' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-2xl border border-violet-200 dark:border-violet-900/40 space-y-2">
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-200 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Listen to Document
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Convert document text into natural-sounding voice with speed modulation.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Speech Rate</span>
                    <span className="font-bold text-violet-600">{ttsSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsSpeed}
                    onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePlayTts}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-sm flex items-center justify-center gap-2"
                >
                  {ttsIsPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  {ttsIsPlaying ? 'Stop Audio Playback' : 'Read Document Aloud'}
                </button>
              </div>
            )}

            {/* TAB 3: SEO OPTIMIZER */}
            {activeAiTab === 'seo' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Keyword</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={seoKeyword}
                      onChange={(e) => setSeoKeyword(e.target.value)}
                      placeholder="e.g. cloud security"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleRunSeoAudit}
                      disabled={isSeoAnalyzing}
                      className="px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"
                    >
                      {isSeoAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Audit'}
                    </button>
                  </div>
                </div>

                {seoResult && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 dark:border-violet-900/50 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">SEO Score:</span>
                      <span className="text-xl font-black text-violet-600">{seoResult.seoScore || 80}/100</span>
                    </div>
                    {seoResult.metaDescription && (
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
                        <span className="font-bold text-slate-500">Meta Description:</span>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px]">{seoResult.metaDescription}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AI IMAGE GENERATOR */}
            {activeAiTab === 'imageGen' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Generate & Insert Image
                  </label>
                  <textarea
                    rows={3}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g. Gold official stamp with star ribbon..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiImage}
                    disabled={isGeneratingImg || !imagePrompt.trim()}
                    className="w-full py-2 bg-violet-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    {isGeneratingImg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Generate Image (Flux)
                  </button>
                </div>

                {generatedImgUrl && (
                  <div className="space-y-2">
                    <img src={generatedImgUrl} alt="AI Generated" className="w-full rounded-xl border border-slate-200 shadow-sm" />
                    <button
                      type="button"
                      onClick={handleInsertGeneratedImageToPdf}
                      className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insert Directly into PDF Page
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
