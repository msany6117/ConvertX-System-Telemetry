import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Square as SquareIcon,
  Circle,
  Minus,
  ArrowRight,
  Stamp,
  Palette,
  Search,
  Replace,
  BookOpen,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Undo,
  Redo,
  Link as LinkIcon,
  StickyNote,
  Printer,
  Hand,
  Highlighter,
  MessageSquareHeart,
  ChevronUp,
  Minimize2,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';
import { safeFetchJson } from '../../utils/apiClient';
import { saveHistoryRecord } from '../../utils/historyStorage';
import { runAIProcess } from '../../services/aiClient';

export interface TextBlock {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number; // percentage (0 to 1)
  y: number; // percentage (0 to 1)
  originalX?: number; // original percentage for parsed blocks (0 to 1)
  originalY?: number; // original percentage for parsed blocks (0 to 1)
  width?: number; // percentage (0 to 1)
  height?: number; // percentage (0 to 1)
  text: string;
  originalText?: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  isBold: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  isOriginalParsed?: boolean;
  isDeleted?: boolean;
  isOcr?: boolean;
}

export interface ShapeBlock {
  id: string;
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line' | 'arrow' | 'highlight';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface StampBlock {
  id: string;
  type: 'stamp';
  stampType: 'APPROVED' | 'CONFIDENTIAL' | 'PAID' | 'DRAFT' | 'OFFICIAL' | 'REJECTED' | 'CUSTOM';
  customText?: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation?: number;
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
  opacity?: number;
}

export interface DrawStroke {
  id: string;
  type: 'draw';
  pageIndex: number;
  points: Array<{ x: number; y: number }>;
  color: string;
  strokeWidth: number;
}

export interface LinkBlock {
  id: string;
  type: 'link';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
}

export interface NoteBlock {
  id: string;
  type: 'note';
  pageIndex: number;
  x: number;
  y: number;
  content: string;
  color: string;
}

export interface WhiteoutBlock {
  id: string;
  type: 'whiteout';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface PageMeta {
  id: string;
  sourceDocIndex: number;
  sourcePageIndex: number;
  rotation: number;
  thumbnailUrl?: string;
  hasText?: boolean;
  parsedTextLoaded?: boolean;
}

interface HistorySnapshot {
  textBlocks: TextBlock[];
  shapeBlocks: ShapeBlock[];
  stampBlocks: StampBlock[];
  imageBlocks: ImageBlock[];
  drawStrokes: DrawStroke[];
  linkBlocks: LinkBlock[];
  noteBlocks: NoteBlock[];
  whiteouts: WhiteoutBlock[];
}

const PRESET_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Charcoal', hex: '#334155' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Ruby Red', hex: '#dc2626' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Violet', hex: '#7c3aed' },
  { name: 'White', hex: '#ffffff' },
];

const FONT_FAMILIES = [
  { label: 'Arial / Sans-Serif', value: 'Arial, sans-serif' },
  { label: 'Helvetica / Clean', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Times New Roman / Serif', value: 'Times New Roman, serif' },
  { label: 'Courier / Monospace', value: 'Courier New, monospace' },
  { label: 'Calibri / Modern', value: 'Calibri, sans-serif' },
  { label: 'Georgia / Editorial', value: 'Georgia, serif' },
];

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

export interface UnifiedPdfWorkspaceProps {
  initialFile?: File | null;
  initialAction?: 'workspace' | 'edit' | 'organize' | 'ocr' | 'merge' | 'split' | 'compress' | 'rotate';
}

export const UnifiedPdfWorkspace: React.FC<UnifiedPdfWorkspaceProps> = ({
  initialFile = null,
  initialAction = 'workspace',
}) => {
  // Main PDF File State
  const [file, setFile] = useState<File | null>(initialFile);
  const [sourceFiles, setSourceFiles] = useState<File[]>(initialFile ? [initialFile] : []);
  const [pdfProxy, setPdfProxy] = useState<any>(null);
  const [pagesList, setPagesList] = useState<PageMeta[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number; scale: number }>({
    width: 0,
    height: 0,
    scale: 1.1,
  });
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Tool Selection in ConvertX PDF Studio
  const [activeTool, setActiveTool] = useState<
    'select' | 'addText' | 'editText' | 'sign' | 'draw' | 'line' | 'highlight' | 'image' | 'stamp' | 'link' | 'note' | 'whiteout'
  >('editText');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Styling state for element property inspector
  const [fontSize, setFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [fontFamily, setFontFamily] = useState<string>('Arial, sans-serif');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Shapes & Lines state
  const [lineShapeType, setLineShapeType] = useState<'line' | 'arrow' | 'rectangle' | 'circle'>('line');
  const [strokeColor, setStrokeColor] = useState<string>('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);

  // Stamps state
  const [stampPreset, setStampPreset] = useState<'APPROVED' | 'CONFIDENTIAL' | 'PAID' | 'DRAFT' | 'OFFICIAL' | 'REJECTED' | 'CUSTOM'>('APPROVED');
  const [customStampText, setCustomStampText] = useState<string>('APPROVED');
  const [stampColor, setStampColor] = useState<string>('#059669');

  // Freehand Drawing state
  const [penColor, setPenColor] = useState<string>('#000000');
  const [penWidth, setPenWidth] = useState<number>(2);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);

  // Annotations Stores
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [shapeBlocks, setShapeBlocks] = useState<ShapeBlock[]>([]);
  const [stampBlocks, setStampBlocks] = useState<StampBlock[]>([]);
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([]);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);
  const [linkBlocks, setLinkBlocks] = useState<LinkBlock[]>([]);
  const [noteBlocks, setNoteBlocks] = useState<NoteBlock[]>([]);
  const [whiteouts, setWhiteouts] = useState<WhiteoutBlock[]>([]);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Search & Replace state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');

  // Modals state
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState<string>('Istihak Sany');
  const [isManagePagesOpen, setIsManagePagesOpen] = useState<boolean>(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [linkUrlInput, setLinkUrlInput] = useState<string>('https://');

  // Unified PDF Studio Action Modals
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [mergeQueue, setMergeQueue] = useState<File[]>([]);
  const [isMergingFiles, setIsMergingFiles] = useState<boolean>(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [splitMode, setSplitMode] = useState<'range' | 'current' | 'allZip'>('range');
  const [splitRangeInput, setSplitRangeInput] = useState<string>('1');
  const [isCompressModalOpen, setIsCompressModalOpen] = useState<boolean>(false);
  const [compressionPreset, setCompressionPreset] = useState<'screen' | 'balanced' | 'print'>('balanced');
  const [customQualityPercent, setCustomQualityPercent] = useState<number>(75);
  const [compressResult, setCompressResult] = useState<{ origSize: number; compSize: number; downloadUrl: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState<boolean>(false);
  const [rotateTargetScope, setRotateTargetScope] = useState<'current' | 'all' | 'even' | 'odd'>('all');
  const [rotateDegreeAngle, setRotateDegreeAngle] = useState<number>(90);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [ocrSelectedScope, setOcrSelectedScope] = useState<'current' | 'all'>('current');
  const [ocrLanguage, setOcrLanguage] = useState<string>('eng');
  const [ocrTextResult, setOcrTextResult] = useState<string>('');
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null);

  // UI Panels
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);
  const [activeAiTab, setActiveAiTab] = useState<'askPdf' | 'tts' | 'seo' | 'imageGen'>('askPdf');

  // OCR state
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [detectedScannedPage, setDetectedScannedPage] = useState<boolean>(false);

  // AI Assistant: Ask PDF state
  const [extractedDocText, setExtractedDocText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string }>>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'ConvertX Live PDF Studio is ready. All text in this document has been auto-detected with interactive dashed outlines. Click any text to edit directly, draw signatures, add shapes, or ask me questions about the document.',
    },
  ]);
  const [queryInput, setQueryInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // AI Assistant: TTS & SEO & Image state
  const [ttsIsPlaying, setTtsIsPlaying] = useState<boolean>(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [seoKeyword, setSeoKeyword] = useState<string>('');
  const [seoResult, setSeoResult] = useState<any>(null);
  const [isSeoAnalyzing, setIsSeoAnalyzing] = useState<boolean>(false);
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
  const signPadRef = useRef<HTMLCanvasElement>(null);

  // Push snapshot to history
  const pushHistorySnapshot = useCallback(
    (
      newText = textBlocks,
      newShapes = shapeBlocks,
      newStamps = stampBlocks,
      newImages = imageBlocks,
      newDraws = drawStrokes,
      newLinks = linkBlocks,
      newNotes = noteBlocks,
      newWhiteouts = whiteouts
    ) => {
      const snapshot: HistorySnapshot = {
        textBlocks: [...newText],
        shapeBlocks: [...newShapes],
        stampBlocks: [...newStamps],
        imageBlocks: [...newImages],
        drawStrokes: [...newDraws],
        linkBlocks: [...newLinks],
        noteBlocks: [...newNotes],
        whiteouts: [...newWhiteouts],
      };
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, snapshot];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [textBlocks, shapeBlocks, stampBlocks, imageBlocks, drawStrokes, linkBlocks, noteBlocks, whiteouts, historyIndex]
  );

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const targetIdx = historyIndex - 1;
    const snapshot = history[targetIdx];
    if (snapshot) {
      setTextBlocks(snapshot.textBlocks);
      setShapeBlocks(snapshot.shapeBlocks);
      setStampBlocks(snapshot.stampBlocks);
      setImageBlocks(snapshot.imageBlocks);
      setDrawStrokes(snapshot.drawStrokes);
      setLinkBlocks(snapshot.linkBlocks);
      setNoteBlocks(snapshot.noteBlocks);
      setWhiteouts(snapshot.whiteouts);
      setHistoryIndex(targetIdx);
    }
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const targetIdx = historyIndex + 1;
    const snapshot = history[targetIdx];
    if (snapshot) {
      setTextBlocks(snapshot.textBlocks);
      setShapeBlocks(snapshot.shapeBlocks);
      setStampBlocks(snapshot.stampBlocks);
      setImageBlocks(snapshot.imageBlocks);
      setDrawStrokes(snapshot.drawStrokes);
      setLinkBlocks(snapshot.linkBlocks);
      setNoteBlocks(snapshot.noteBlocks);
      setWhiteouts(snapshot.whiteouts);
      setHistoryIndex(targetIdx);
    }
  };

  // Currently selected element helper
  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    const txt = textBlocks.find((t) => t.id === selectedElementId);
    if (txt) return { ...txt, kind: 'text' as const };
    const shp = shapeBlocks.find((s) => s.id === selectedElementId);
    if (shp) return { ...shp, kind: 'shape' as const };
    const stp = stampBlocks.find((s) => s.id === selectedElementId);
    if (stp) return { ...stp, kind: 'stamp' as const };
    const img = imageBlocks.find((i) => i.id === selectedElementId);
    if (img) return { ...img, kind: 'image' as const };
    const lnk = linkBlocks.find((l) => l.id === selectedElementId);
    if (lnk) return { ...lnk, kind: 'link' as const };
    const nt = noteBlocks.find((n) => n.id === selectedElementId);
    if (nt) return { ...nt, kind: 'note' as const };
    return null;
  }, [selectedElementId, textBlocks, shapeBlocks, stampBlocks, imageBlocks, linkBlocks, noteBlocks]);

  // Sync selected element to toolbar
  useEffect(() => {
    if (selectedElement && selectedElement.kind === 'text') {
      setFontSize(selectedElement.fontSize || 14);
      setTextColor(selectedElement.color || '#000000');
      setBgColor(selectedElement.backgroundColor || 'transparent');
      setIsBold(!!selectedElement.isBold);
      setIsItalic(!!selectedElement.isItalic);
      setIsUnderline(!!selectedElement.isUnderline);
      setFontFamily(selectedElement.fontFamily || 'Arial, sans-serif');
      setTextAlign(selectedElement.textAlign || 'left');
    }
  }, [selectedElementId]);

  // 1. LOAD PDF
  const loadPdf = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    setIsLoading(true);
    setError(null);
    setFile(uploadedFile);
    setSourceFiles([uploadedFile]);
    setCurrentPage(1);
    setTextBlocks([]);
    setShapeBlocks([]);
    setStampBlocks([]);
    setImageBlocks([]);
    setDrawStrokes([]);
    setLinkBlocks([]);
    setNoteBlocks([]);
    setWhiteouts([]);
    setSelectedElementId(null);
    setHistory([]);
    setHistoryIndex(-1);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfProxy(pdf);

      const metas: PageMeta[] = [];
      let fullDocumentText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
        fullDocumentText += `\n--- Page ${i} ---\n` + pageText;

        const viewport = page.getViewport({ scale: 0.35 });
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
          hasText: pageText.trim().length > 15,
          parsedTextLoaded: false,
        });
      }

      setPagesList(metas);
      setExtractedDocText(fullDocumentText.trim());
      setActiveTool('editText');
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

  useEffect(() => {
    if (initialAction === 'merge') {
      setIsMergeModalOpen(true);
    } else if (initialAction === 'split') {
      setIsSplitModalOpen(true);
    } else if (initialAction === 'compress') {
      setIsCompressModalOpen(true);
    } else if (initialAction === 'rotate') {
      setIsRotateModalOpen(true);
    } else if (initialAction === 'ocr') {
      setIsOcrModalOpen(true);
    } else if (initialAction === 'organize') {
      setLeftSidebarOpen(true);
    } else if (initialAction === 'edit') {
      setActiveTool('editText');
    }
  }, [initialAction]);

  // PAGE REORDERING & MANIPULATION
  const reorderPages = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= pagesList.length || toIdx >= pagesList.length) return;
    const copy = [...pagesList];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setPagesList(copy);

    if (currentPage === fromIdx + 1) {
      setCurrentPage(toIdx + 1);
    } else if (currentPage > fromIdx + 1 && currentPage <= toIdx + 1) {
      setCurrentPage(currentPage - 1);
    } else if (currentPage < fromIdx + 1 && currentPage >= toIdx + 1) {
      setCurrentPage(currentPage + 1);
    }
    pushHistorySnapshot();
    setExportMessage(`Page ${fromIdx + 1} moved to position ${toIdx + 1}.`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  const rotatePage = (idx: number, deltaDeg: number = 90) => {
    setPagesList((prev) =>
      prev.map((pm, i) =>
        i === idx ? { ...pm, rotation: ((pm.rotation || 0) + deltaDeg) % 360 } : pm
      )
    );
    pushHistorySnapshot();
    setExportMessage(`Rotated page ${idx + 1} by ${deltaDeg}°.`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  const rotateAllPages = (deltaDeg: number = 90) => {
    setPagesList((prev) =>
      prev.map((pm) => ({ ...pm, rotation: ((pm.rotation || 0) + deltaDeg) % 360 }))
    );
    pushHistorySnapshot();
    setExportMessage(`Rotated all pages by ${deltaDeg}°.`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  const deletePage = (idx: number) => {
    if (pagesList.length <= 1) {
      setError('Cannot delete the only page in the PDF.');
      return;
    }
    const copy = pagesList.filter((_, i) => i !== idx);
    setPagesList(copy);
    if (currentPage > copy.length) {
      setCurrentPage(copy.length);
    }
    pushHistorySnapshot();
    setExportMessage(`Deleted page ${idx + 1}.`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  const duplicatePage = (idx: number) => {
    const target = pagesList[idx];
    if (!target) return;
    const cloned: PageMeta = {
      ...target,
      id: `page_${Date.now()}_clone`,
    };
    const copy = [...pagesList];
    copy.splice(idx + 1, 0, cloned);
    setPagesList(copy);
    setCurrentPage(idx + 2);
    pushHistorySnapshot();
    setExportMessage(`Duplicated page ${idx + 1}.`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  const appendPdfFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (fileList.length === 0) return;

    setIsLoading(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      let addedCount = 0;
      for (const f of fileList) {
        const newDocIndex = sourceFiles.length;
        setSourceFiles((prev) => [...prev, f]);

        const arrayBuffer = await f.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const newMetas: PageMeta[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
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
            parsedTextLoaded: false,
          });
          addedCount++;
        }
        setPagesList((prev) => [...prev, ...newMetas]);
      }
      setExportMessage(`Appended ${addedCount} page(s) successfully!`);
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error('[Append PDF Error]', err);
      setError('Failed to append PDF pages.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-CLICK SPLIT PDF
  const handleSplitPdf = async () => {
    if (!file || pagesList.length === 0) return;
    setIsLoading(true);
    try {
      const srcDoc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });

      if (splitMode === 'current') {
        const newPdf = await PDFDocument.create();
        const [copied] = await newPdf.copyPages(srcDoc, [currentPage - 1]);
        newPdf.addPage(copied);
        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page-${currentPage}-${file.name}`;
        a.click();
      } else if (splitMode === 'range') {
        const ranges = splitRangeInput.split(',').map((r) => r.trim());
        const selectedPageIndices = new Set<number>();
        for (const range of ranges) {
          if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
              for (let p = Math.max(1, start); p <= Math.min(srcDoc.getPageCount(), end); p++) {
                selectedPageIndices.add(p - 1);
              }
            }
          } else {
            const p = Number(range);
            if (!isNaN(p) && p >= 1 && p <= srcDoc.getPageCount()) {
              selectedPageIndices.add(p - 1);
            }
          }
        }
        if (selectedPageIndices.size === 0) {
          setError('Invalid page range entered.');
          setIsLoading(false);
          return;
        }
        const newPdf = await PDFDocument.create();
        const copied = await newPdf.copyPages(srcDoc, Array.from(selectedPageIndices));
        copied.forEach((cp) => newPdf.addPage(cp));
        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extracted-${splitRangeInput.replace(/\s+/g, '_')}-${file.name}`;
        a.click();
      } else if (splitMode === 'allZip') {
        const zip = new JSZip();
        for (let i = 0; i < srcDoc.getPageCount(); i++) {
          const singleDoc = await PDFDocument.create();
          const [copied] = await singleDoc.copyPages(srcDoc, [i]);
          singleDoc.addPage(copied);
          const bytes = await singleDoc.save();
          zip.file(`page-${i + 1}.pdf`, bytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `split-pages-${file.name.replace(/\.pdf$/i, '')}.zip`;
        a.click();
      }
      setIsSplitModalOpen(false);
      setExportMessage('Split operation completed successfully!');
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error('[Split PDF Error]', err);
      setError('Failed to split PDF document.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-CLICK COMPRESS PDF
  const handleCompressPdf = async () => {
    if (!file) return;
    setIsCompressing(true);
    setCompressResult(null);
    try {
      const origBuffer = await file.arrayBuffer();
      const origSize = origBuffer.byteLength;

      const qualityFactor =
        compressionPreset === 'screen'
          ? 0.5
          : compressionPreset === 'balanced'
          ? Math.max(0.4, (customQualityPercent / 100) * 0.78)
          : 0.92;
      const scale =
        compressionPreset === 'screen'
          ? 0.85
          : compressionPreset === 'balanced'
          ? 1.25
          : 1.8;

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const loadingTask = pdfjsLib.getDocument({ data: origBuffer });
      const pdf = await loadingTask.promise;

      const compDoc = await PDFDocument.create();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const c = document.createElement('canvas');
        c.width = viewport.width;
        c.height = viewport.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, canvas: c, viewport }).promise;
          const jpegDataUrl = c.toDataURL('image/jpeg', qualityFactor);
          const base64Data = jpegDataUrl.split(',')[1];
          const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const embeddedImage = await compDoc.embedJpg(imageBytes);
          const compPage = compDoc.addPage([page.view[2] || viewport.width, page.view[3] || viewport.height]);
          compPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: compPage.getWidth(),
            height: compPage.getHeight(),
          });
        }
      }

      const compBytes = await compDoc.save();
      const compBlob = new Blob([compBytes], { type: 'application/pdf' });
      const compUrl = URL.createObjectURL(compBlob);

      setCompressResult({
        origSize,
        compSize: compBytes.byteLength,
        downloadUrl: compUrl,
      });

      saveHistoryRecord({
        id: `compress-${Date.now()}`,
        originalName: file.name,
        outputFilename: `compressed-${file.name}`,
        fromFormat: 'pdf',
        toFormat: 'pdf',
        originalSize: origSize,
        outputSize: compBytes.byteLength,
        savedBytes: Math.max(0, origSize - compBytes.byteLength),
        savedPercent:
          origSize > compBytes.byteLength
            ? Math.round(((origSize - compBytes.byteLength) / origSize) * 100)
            : 0,
        timestamp: Date.now(),
        downloadUrl: compUrl,
        mode: 'wasm',
        category: 'document',
      });

      setExportMessage(
        `Compressed successfully! Saved ${Math.round((1 - compBytes.byteLength / origSize) * 100)}% of file size.`
      );
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      console.error('[Compress PDF Error]', err);
      setError('Failed to compress PDF.');
    } finally {
      setIsCompressing(false);
    }
  };

  // MULTI-DOCUMENT MERGE HANDLER
  const handleMergeFilesSubmit = async (targetMode: 'workspace' | 'download') => {
    const filesToMerge = file ? [file, ...mergeQueue] : mergeQueue;
    if (filesToMerge.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }
    setIsMergingFiles(true);
    setError(null);
    try {
      const mergedPdf = await PDFDocument.create();
      let totalInputSize = 0;
      for (const f of filesToMerge) {
        totalInputSize += f.size;
        const arrayBuffer = await f.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      saveHistoryRecord({
        id: `merge-${Date.now()}`,
        originalName: `${filesToMerge.length} PDF Documents`,
        outputFilename: 'merged_document.pdf',
        fromFormat: 'pdf',
        toFormat: 'pdf',
        originalSize: totalInputSize,
        outputSize: blob.size,
        savedBytes: Math.max(0, totalInputSize - blob.size),
        savedPercent:
          totalInputSize > blob.size
            ? Math.round(((totalInputSize - blob.size) / totalInputSize) * 100)
            : 0,
        timestamp: Date.now(),
        downloadUrl: url,
        mode: 'wasm',
        category: 'document',
      });

      if (targetMode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged_document.pdf';
        a.click();
        setExportMessage('Merged PDF downloaded successfully!');
      } else {
        const mergedFile = new File([blob], 'merged_document.pdf', { type: 'application/pdf' });
        loadPdf(mergedFile);
        setIsMergeModalOpen(false);
        setExportMessage('Merged PDF loaded into Studio workspace!');
      }
      setTimeout(() => setExportMessage(null), 3500);
    } catch (err: any) {
      console.error('[Merge PDF Error]', err);
      setError('Failed to merge PDF documents. Please check file validity.');
    } finally {
      setIsMergingFiles(false);
    }
  };

  // ROTATE MODAL HANDLER
  const handleApplyRotation = () => {
    if (pagesList.length === 0) return;
    setPagesList((prev) =>
      prev.map((pm, i) => {
        let shouldRotate = false;
        if (rotateTargetScope === 'all') shouldRotate = true;
        else if (rotateTargetScope === 'current') shouldRotate = i === currentPage - 1;
        else if (rotateTargetScope === 'even') shouldRotate = (i + 1) % 2 === 0;
        else if (rotateTargetScope === 'odd') shouldRotate = (i + 1) % 2 !== 0;

        if (shouldRotate) {
          return { ...pm, rotation: ((pm.rotation || 0) + rotateDegreeAngle) % 360 };
        }
        return pm;
      })
    );
    pushHistorySnapshot();
    setIsRotateModalOpen(false);
    setExportMessage(`Rotated ${rotateTargetScope} pages by ${rotateDegreeAngle}°!`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  // OCR TEXT RECOGNITION
  const handleExecuteOcr = async (action: 'editableBlocks' | 'copyText') => {
    if (!pdfProxy || pagesList.length === 0) return;
    setIsOcrProcessing(true);
    setOcrStatusText('Initializing OCR engine...');

    try {
      const worker = await createWorker(ocrLanguage);
      const targetPages = ocrSelectedScope === 'current' ? [currentPage] : Array.from({ length: pagesList.length }, (_, i) => i + 1);

      let fullText = '';
      const addedBlocks: TextBlock[] = [];

      for (const pNum of targetPages) {
        setOcrStatusText(`Reading text on page ${pNum} of ${pagesList.length}...`);
        const page = await pdfProxy.getPage(pNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, canvas, viewport }).promise;
          const ret: any = await worker.recognize(canvas);
          const pText = ret.data.text;
          fullText += `\n--- Page ${pNum} ---\n` + pText;

          if (action === 'editableBlocks') {
            const lines: any[] = (ret.data as any)?.lines || [];
            lines.forEach((line: any, lIdx: number) => {
              if (!line.text.trim()) return;
              const bbox = line.bbox;
              const relX = Math.max(0, bbox.x0 / viewport.width);
              const relY = Math.max(0, bbox.y0 / viewport.height);
              const relW = Math.min(1, (bbox.x1 - bbox.x0) / viewport.width);
              const relH = Math.min(1, (bbox.y1 - bbox.y0) / viewport.height);

              addedBlocks.push({
                id: `ocr_${pNum - 1}_${lIdx}_${Date.now()}`,
                type: 'text',
                pageIndex: pNum - 1,
                x: relX,
                y: relY,
                originalX: relX,
                originalY: relY,
                width: relW,
                height: relH,
                text: line.text.trim(),
                originalText: line.text.trim(),
                fontSize: Math.max(10, Math.round((bbox.y1 - bbox.y0) * 0.7)),
                color: '#000000',
                backgroundColor: 'transparent',
                isBold: false,
                fontFamily: 'Arial, sans-serif',
                isOriginalParsed: false,
                isOcr: true,
              });
            });
          }
        }
      }

      await worker.terminate();
      setOcrTextResult(fullText);

      if (action === 'editableBlocks' && addedBlocks.length > 0) {
        setTextBlocks((prev) => [...prev, ...addedBlocks]);
        pushHistorySnapshot();
        setExportMessage(`Created ${addedBlocks.length} interactive text blocks from scanned document!`);
        setIsOcrModalOpen(false);
      } else {
        setExportMessage(`Recognized ${fullText.length} characters from document.`);
      }
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      console.error('[OCR Error]', err);
      try {
        setOcrStatusText('Running Gemini Vision AI OCR fallback...');
        const page = await pdfProxy.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await (page.render as any)({ canvasContext: ctx, canvas, viewport }).promise;
          const imgBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          const data = await safeFetchJson('/api/ai/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: 'ocr_image',
              input: 'Extract and transcribe all text from this scanned PDF page verbatim.',
              options: { imageBase64: imgBase64 },
            }),
          });
          const resText = data?.result || '';
          setOcrTextResult(resText);
          setExportMessage('Extracted text via Gemini Vision AI OCR!');
          setTimeout(() => setExportMessage(null), 4000);
        }
      } catch (aiErr) {
        setError('OCR scanning failed.');
      }
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // 2. PARSE EXISTING PDF TEXT INTO ACCURATE NORMALISED BLOCKS
  const parsePageTextContent = async (page: any, pageIdx: number, pageRotation: number) => {
    try {
      const textContent = await page.getTextContent();
      const rawItems = textContent.items || [];
      if (rawItems.length === 0) {
        setDetectedScannedPage(true);
        return;
      }

      // Always normalize against base 1.0 scale viewport (72 DPI PDF points)
      const baseViewport = page.getViewport({ scale: 1.0, rotation: pageRotation });
      const baseW = baseViewport.width;
      const baseH = baseViewport.height;

      interface TextRun {
        str: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize: number;
      }

      const runs: TextRun[] = [];
      for (const item of rawItems) {
        if (!('str' in item) || !item.str.trim()) continue;
        const tx = item.transform[4];
        const ty = item.transform[5];
        const [vx, vy] = baseViewport.convertToViewportPoint(tx, ty);

        // Font size in true PDF points
        const fontPt = Math.max(8, Math.round(Math.hypot(item.transform[2], item.transform[3]) || 12));
        const boxTop = Math.max(0, vy - fontPt * 0.95);
        const boxLeft = Math.max(0, vx);
        const boxW = Math.max(8, item.width || item.str.length * (fontPt * 0.5));
        const boxH = fontPt * 1.25;

        runs.push({
          str: item.str,
          x: boxLeft,
          y: boxTop,
          width: boxW,
          height: boxH,
          fontSize: fontPt,
        });
      }

      // Group words on the same horizontal line into natural lines/paragraphs
      runs.sort((a, b) => (Math.abs(a.y - b.y) > 4 ? a.y - b.y : a.x - b.x));

      const groupedLines: Array<{
        str: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fontSize: number;
      }> = [];

      for (const run of runs) {
        const last = groupedLines[groupedLines.length - 1];
        if (
          last &&
          Math.abs(last.y - run.y) <= 4 &&
          run.x >= last.x &&
          run.x - (last.x + last.width) <= 20
        ) {
          const needsSpace = !last.str.endsWith(' ') && !run.str.startsWith(' ');
          last.str += (needsSpace ? ' ' : '') + run.str;
          last.width = run.x + run.width - last.x;
          last.height = Math.max(last.height, run.height);
          last.fontSize = Math.max(last.fontSize, run.fontSize);
        } else {
          groupedLines.push({ ...run });
        }
      }

      const newBlocks: TextBlock[] = groupedLines.map((line, idx) => ({
        id: `parsed_${pageIdx}_${idx}_${Date.now()}`,
        type: 'text',
        pageIndex: pageIdx,
        x: Math.max(0, line.x / baseW),
        y: Math.max(0, line.y / baseH),
        originalX: Math.max(0, line.x / baseW),
        originalY: Math.max(0, line.y / baseH),
        width: Math.min(1, line.width / baseW),
        height: Math.min(1, line.height / baseH),
        text: line.str,
        originalText: line.str,
        fontSize: line.fontSize,
        color: '#000000',
        backgroundColor: 'transparent',
        isBold: false,
        fontFamily: 'Arial, sans-serif',
        isOriginalParsed: true,
      }));

      setTextBlocks((prev) => {
        const otherPages = prev.filter((tb) => tb.pageIndex !== pageIdx || !tb.isOriginalParsed);
        const updated = [...otherPages, ...newBlocks];
        pushHistorySnapshot(updated);
        return updated;
      });

      setPagesList((prev) =>
        prev.map((p, i) => (i === pageIdx ? { ...p, parsedTextLoaded: true } : p))
      );
    } catch (err) {
      console.warn('[Text Parse Error]', err);
    }
  };

  // 3. RENDER CURRENT PAGE TO CANVAS
  useEffect(() => {
    if (!pdfProxy || !canvasRef.current || pagesList.length === 0) return;

    let isCancelled = false;
    const renderPage = async () => {
      try {
        const pageMeta = pagesList[currentPage - 1];
        if (!pageMeta) return;

        const page = await pdfProxy.getPage(pageMeta.sourcePageIndex + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({
          scale: zoom,
          rotation: pageMeta.rotation,
        });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        if (drawCanvasRef.current) {
          drawCanvasRef.current.height = viewport.height;
          drawCanvasRef.current.width = viewport.width;
          drawCanvasRef.current.style.width = `${viewport.width}px`;
          drawCanvasRef.current.style.height = `${viewport.height}px`;
        }

        if (containerRef.current) {
          containerRef.current.style.width = `${viewport.width}px`;
          containerRef.current.style.height = `${viewport.height}px`;
        }

        setPageDimensions({
          width: viewport.width,
          height: viewport.height,
          scale: zoom,
        });

        await (page.render as any)({
          canvasContext: ctx,
          canvas,
          viewport,
        }).promise;

        if (!pageMeta.parsedTextLoaded) {
          await parsePageTextContent(page, currentPage - 1, pageMeta.rotation);
        }
      } catch (err) {
        if (!isCancelled) console.warn('[Render Page Error]', err);
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfProxy, currentPage, zoom, pagesList]);

  // 4. CANVAS CLICKS (Add Text, Line, Shape, Stamp, Link, Note)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    if (activeTool === 'select' || activeTool === 'draw' || isHandTool) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const relX = Math.max(0, Math.min(0.92, clickX / rect.width));
    const relY = Math.max(0, Math.min(0.96, clickY / rect.height));

    if (activeTool === 'addText') {
      const newBlock: TextBlock = {
        id: `txt_${Date.now()}`,
        type: 'text',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        text: 'Type new text here',
        fontSize,
        color: textColor,
        backgroundColor: bgColor,
        isBold,
        isItalic,
        isUnderline,
        fontFamily,
        textAlign,
      };
      const updated = [...textBlocks, newBlock];
      setTextBlocks(updated);
      setSelectedElementId(newBlock.id);
      pushHistorySnapshot(updated);
      setActiveTool('editText');
    } else if (activeTool === 'line') {
      const newShape: ShapeBlock = {
        id: `shape_${Date.now()}`,
        type: 'shape',
        shapeType: lineShapeType,
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        width: lineShapeType === 'line' || lineShapeType === 'arrow' ? 0.25 : 0.2,
        height: lineShapeType === 'line' || lineShapeType === 'arrow' ? 0.015 : 0.1,
        strokeColor,
        strokeWidth,
        opacity: 1.0,
      };
      const updated = [...shapeBlocks, newShape];
      setShapeBlocks(updated);
      setSelectedElementId(newShape.id);
      pushHistorySnapshot(undefined, updated);
      setActiveTool('editText');
    } else if (activeTool === 'highlight') {
      const newHighlight: ShapeBlock = {
        id: `hl_${Date.now()}`,
        type: 'shape',
        shapeType: 'highlight',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        width: 0.25,
        height: 0.035,
        strokeColor: '#fef08a',
        fillColor: '#fef08a',
        strokeWidth: 0,
        opacity: 0.5,
      };
      const updated = [...shapeBlocks, newHighlight];
      setShapeBlocks(updated);
      setSelectedElementId(newHighlight.id);
      pushHistorySnapshot(undefined, updated);
      setActiveTool('editText');
    } else if (activeTool === 'stamp') {
      const newStamp: StampBlock = {
        id: `stamp_${Date.now()}`,
        type: 'stamp',
        stampType: stampPreset,
        customText: stampPreset === 'CUSTOM' ? customStampText : undefined,
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        width: 0.22,
        height: 0.08,
        color: stampColor,
        rotation: -6,
      };
      const updated = [...stampBlocks, newStamp];
      setStampBlocks(updated);
      setSelectedElementId(newStamp.id);
      pushHistorySnapshot(undefined, undefined, updated);
      setActiveTool('editText');
    } else if (activeTool === 'link') {
      const newLink: LinkBlock = {
        id: `link_${Date.now()}`,
        type: 'link',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        width: 0.25,
        height: 0.04,
        url: linkUrlInput || 'https://google.com',
      };
      const updated = [...linkBlocks, newLink];
      setLinkBlocks(updated);
      setSelectedElementId(newLink.id);
      pushHistorySnapshot(undefined, undefined, undefined, undefined, undefined, updated);
      setActiveTool('editText');
    } else if (activeTool === 'note') {
      const newNote: NoteBlock = {
        id: `note_${Date.now()}`,
        type: 'note',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        content: 'Add review note here...',
        color: '#fef08a',
      };
      const updated = [...noteBlocks, newNote];
      setNoteBlocks(updated);
      setSelectedElementId(newNote.id);
      pushHistorySnapshot(undefined, undefined, undefined, undefined, undefined, undefined, updated);
      setActiveTool('editText');
    } else if (activeTool === 'whiteout') {
      const newWhiteout: WhiteoutBlock = {
        id: `wh_${Date.now()}`,
        type: 'whiteout',
        pageIndex: currentPage - 1,
        x: relX,
        y: relY,
        width: 0.25,
        height: 0.04,
        color: '#ffffff',
      };
      const updated = [...whiteouts, newWhiteout];
      setWhiteouts(updated);
      setSelectedElementId(newWhiteout.id);
      pushHistorySnapshot(undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated);
      setActiveTool('editText');
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
      const updated = [...drawStrokes, stroke];
      setDrawStrokes(updated);
      pushHistorySnapshot(undefined, undefined, undefined, undefined, updated);
    }
    setCurrentStroke([]);
  };

  // 5b. REAL-TIME ELEMENT DRAGGING & POSITION UPDATING
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    elementId: string;
    elementType: 'text' | 'shape' | 'image' | 'stamp' | 'note' | 'whiteout';
    startX: number;
    startY: number;
    initialElemX: number;
    initialElemY: number;
    containerWidth: number;
    containerHeight: number;
    hasMoved: boolean;
  } | null>(null);

  const startDragging = (
    e: React.MouseEvent,
    id: string,
    type: 'text' | 'shape' | 'image' | 'stamp' | 'note' | 'whiteout',
    initialX: number,
    initialY: number
  ) => {
    if (e.button !== 0) return; // Only left mouse button
    if (isHandTool || activeTool === 'draw') return;
    e.stopPropagation();

    setSelectedElementId(id);

    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const containerWidth = rect?.width || pageDimensions.width || 800;
    const containerHeight = rect?.height || pageDimensions.height || 1000;

    setDragState({
      isDragging: true,
      elementId: id,
      elementType: type,
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: initialX,
      initialElemY: initialY,
      containerWidth,
      containerHeight,
      hasMoved: false,
    });
  };

  useEffect(() => {
    if (!dragState || !dragState.isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const deltaPixelsX = e.clientX - dragState.startX;
      const deltaPixelsY = e.clientY - dragState.startY;

      // Small threshold to avoid accidental dragging on pure click
      if (Math.hypot(deltaPixelsX, deltaPixelsY) < 3 && !dragState.hasMoved) return;

      const rawDeltaRelX = deltaPixelsX / dragState.containerWidth;
      const rawDeltaRelY = deltaPixelsY / dragState.containerHeight;

      const targetX = dragState.initialElemX + rawDeltaRelX;
      const targetY = dragState.initialElemY + rawDeltaRelY;

      // Smooth grid snap in 4px increments for pixel-perfect alignment
      const snapGridPx = 4;
      const pixelX = Math.round((targetX * dragState.containerWidth) / snapGridPx) * snapGridPx;
      const pixelY = Math.round((targetY * dragState.containerHeight) / snapGridPx) * snapGridPx;

      const newRelX = Math.max(0, Math.min(0.96, pixelX / dragState.containerWidth));
      const newRelY = Math.max(0, Math.min(0.97, pixelY / dragState.containerHeight));

      if (!dragState.hasMoved) {
        setDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));
      }

      if (dragState.elementType === 'text') {
        setTextBlocks((prev) =>
          prev.map((tb) => (tb.id === dragState.elementId ? { ...tb, x: newRelX, y: newRelY } : tb))
        );
      } else if (dragState.elementType === 'shape') {
        setShapeBlocks((prev) =>
          prev.map((sh) => (sh.id === dragState.elementId ? { ...sh, x: newRelX, y: newRelY } : sh))
        );
      } else if (dragState.elementType === 'image') {
        setImageBlocks((prev) =>
          prev.map((im) => (im.id === dragState.elementId ? { ...im, x: newRelX, y: newRelY } : im))
        );
      } else if (dragState.elementType === 'stamp') {
        setStampBlocks((prev) =>
          prev.map((st) => (st.id === dragState.elementId ? { ...st, x: newRelX, y: newRelY } : st))
        );
      } else if (dragState.elementType === 'note') {
        setNoteBlocks((prev) =>
          prev.map((nt) => (nt.id === dragState.elementId ? { ...nt, x: newRelX, y: newRelY } : nt))
        );
      } else if (dragState.elementType === 'whiteout') {
        setWhiteouts((prev) =>
          prev.map((wh) => (wh.id === dragState.elementId ? { ...wh, x: newRelX, y: newRelY } : wh))
        );
      }
    };

    const handleWindowMouseUp = () => {
      if (dragState.hasMoved) {
        pushHistorySnapshot();
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, pushHistorySnapshot]);

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
        x: 0.35,
        y: 0.35,
        width: 0.28,
        height: 0.2,
        dataUrl,
        opacity: 1,
      };
      const updated = [...imageBlocks, newImg];
      setImageBlocks(updated);
      setSelectedElementId(newImg.id);
      pushHistorySnapshot(undefined, undefined, undefined, updated);
      setActiveTool('editText');
    };
    reader.readAsDataURL(imgFile);
    e.target.value = '';
  };

  // 7. SIGNATURE MODAL CONFIRMATION (Draw / Type)
  const handleInsertSignature = () => {
    let sigDataUrl = '';
    if (signatureMode === 'draw') {
      const canvas = signPadRef.current;
      if (!canvas) return;
      sigDataUrl = canvas.toDataURL('image/png');
    } else {
      // Type signature on temporary canvas
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = 'italic 36px "Brush Script MT", "Caveat", "Dancing Script", cursive, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(typedSignature, 20, 70);
        sigDataUrl = canvas.toDataURL('image/png');
      }
    }

    if (sigDataUrl) {
      const newImg: ImageBlock = {
        id: `sig_${Date.now()}`,
        type: 'image',
        pageIndex: currentPage - 1,
        x: 0.35,
        y: 0.5,
        width: 0.3,
        height: 0.1,
        dataUrl: sigDataUrl,
        opacity: 1,
      };
      const updated = [...imageBlocks, newImg];
      setImageBlocks(updated);
      setSelectedElementId(newImg.id);
      pushHistorySnapshot(undefined, undefined, undefined, updated);
      setIsSignModalOpen(false);
      setExportMessage('Digital signature inserted onto page!');
      setTimeout(() => setExportMessage(null), 3000);
    }
  };

  // 8. UPDATE SELECTED ELEMENT
  const updateSelectedText = (updates: Partial<TextBlock>) => {
    if (!selectedElementId) return;
    const updated = textBlocks.map((t) => (t.id === selectedElementId ? { ...t, ...updates } : t));
    setTextBlocks(updated);
    pushHistorySnapshot(updated);
  };

  const deleteSelectedElement = () => {
    if (!selectedElementId) return;
    const updatedText = textBlocks
      .map((t) => {
        if (t.id === selectedElementId) {
          if (t.isOriginalParsed) return { ...t, isDeleted: true };
          return null as any;
        }
        return t;
      })
      .filter(Boolean);

    const updatedShapes = shapeBlocks.filter((s) => s.id !== selectedElementId);
    const updatedStamps = stampBlocks.filter((s) => s.id !== selectedElementId);
    const updatedImages = imageBlocks.filter((i) => i.id !== selectedElementId);
    const updatedLinks = linkBlocks.filter((l) => l.id !== selectedElementId);
    const updatedNotes = noteBlocks.filter((n) => n.id !== selectedElementId);

    setTextBlocks(updatedText);
    setShapeBlocks(updatedShapes);
    setStampBlocks(updatedStamps);
    setImageBlocks(updatedImages);
    setLinkBlocks(updatedLinks);
    setNoteBlocks(updatedNotes);

    pushHistorySnapshot(updatedText, updatedShapes, updatedStamps, updatedImages, undefined, updatedLinks, updatedNotes);
    setSelectedElementId(null);
  };

  // 9. FIND & REPLACE
  const handleGlobalFindReplace = () => {
    if (!searchQuery.trim()) return;
    let count = 0;
    const updated = textBlocks.map((tb) => {
      if (tb.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        count++;
        const reg = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return {
          ...tb,
          text: tb.text.replace(reg, replaceQuery),
          backgroundColor: 'rgba(254, 240, 138, 0.7)',
        };
      }
      return tb;
    });
    setTextBlocks(updated);
    pushHistorySnapshot(updated);
    setExportMessage(`Replaced ${count} occurrence(s) in document.`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  // 10. PRINT WORKSPACE DIRECTLY
  const handlePrint = () => {
    window.print();
  };

  // 11. ONE-CLICK CRISP PDF EXPORT
  const handleExportPdf = async () => {
    if (!file || pagesList.length === 0) return;
    setIsExporting(true);
    setError(null);

    try {
      const docs: PDFDocument[] = [];
      for (const sf of sourceFiles) {
        const buf = await sf.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        docs.push(doc);
      }

      const outDoc = await PDFDocument.create();
      const helveticaFont = await outDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await outDoc.embedFont(StandardFonts.HelveticaBold);
      const timesFont = await outDoc.embedFont(StandardFonts.TimesRoman);
      const courierFont = await outDoc.embedFont(StandardFonts.Courier);

      for (let idx = 0; idx < pagesList.length; idx++) {
        const pMeta = pagesList[idx];
        let copiedPage: any = null;

        if (pMeta.sourceDocIndex === -1) {
          copiedPage = outDoc.addPage([612, 792]);
        } else {
          const src = docs[pMeta.sourceDocIndex];
          if (!src) continue;
          const [cp] = await outDoc.copyPages(src, [pMeta.sourcePageIndex]);
          copiedPage = cp;
          outDoc.addPage(copiedPage);
        }

        if (pMeta.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pMeta.rotation));
        }

        const { width, height } = copiedPage.getSize();

        // 1. Cover original deleted, modified, or moved text blocks with whiteout box
        const pageTexts = textBlocks.filter((tb) => tb.pageIndex === idx);
        for (const tb of pageTexts) {
          const origX = tb.originalX ?? tb.x;
          const origY = tb.originalY ?? tb.y;
          const wasMoved = tb.isOriginalParsed && (Math.abs(tb.x - origX) > 0.002 || Math.abs(tb.y - origY) > 0.002);
          const wasModified =
            tb.isDeleted ||
            wasMoved ||
            (tb.isOriginalParsed && (
              tb.text !== tb.originalText ||
              tb.color !== '#000000' ||
              tb.isBold ||
              tb.isItalic ||
              tb.isUnderline ||
              (tb.backgroundColor && tb.backgroundColor !== 'transparent')
            ));

          if (wasModified && tb.width && tb.height) {
            // Whiteout the ORIGINAL location
            copiedPage.drawRectangle({
              x: Math.max(0, origX * width - 2),
              y: Math.max(0, height - (origY * height) - (tb.height * height) - 2),
              width: Math.min(width, tb.width * width + 4),
              height: Math.min(height, tb.height * height + 4),
              color: rgb(1, 1, 1),
            });
          }
        }

        // 2. Draw Whiteouts
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

        // 3. Draw Shapes & Highlights
        const pageShapes = shapeBlocks.filter((sh) => sh.pageIndex === idx);
        for (const sh of pageShapes) {
          const r = parseInt(sh.strokeColor.slice(1, 3), 16) / 255 || 0;
          const g = parseInt(sh.strokeColor.slice(3, 5), 16) / 255 || 0;
          const b = parseInt(sh.strokeColor.slice(5, 7), 16) / 255 || 0;
          const strokeRgb = rgb(r, g, b);

          const shX = sh.x * width;
          const shY = height - sh.y * height - sh.height * height;
          const shW = sh.width * width;
          const shH = sh.height * height;

          if (sh.shapeType === 'rectangle' || sh.shapeType === 'highlight') {
            copiedPage.drawRectangle({
              x: shX,
              y: shY,
              width: shW,
              height: shH,
              borderColor: strokeRgb,
              borderWidth: sh.strokeWidth,
              opacity: sh.opacity,
            });
          } else if (sh.shapeType === 'circle') {
            copiedPage.drawEllipse({
              x: shX + shW / 2,
              y: shY + shH / 2,
              xScale: shW / 2,
              yScale: shH / 2,
              borderColor: strokeRgb,
              borderWidth: sh.strokeWidth,
              opacity: sh.opacity,
            });
          } else if (sh.shapeType === 'line' || sh.shapeType === 'arrow') {
            copiedPage.drawLine({
              start: { x: shX, y: shY + shH / 2 },
              end: { x: shX + shW, y: shY + shH / 2 },
              thickness: sh.strokeWidth,
              color: strokeRgb,
              opacity: sh.opacity,
            });
          }
        }

        // 4. Draw Stamps
        const pageStamps = stampBlocks.filter((st) => st.pageIndex === idx);
        for (const st of pageStamps) {
          const r = parseInt(st.color.slice(1, 3), 16) / 255 || 0;
          const g = parseInt(st.color.slice(3, 5), 16) / 255 || 0;
          const b = parseInt(st.color.slice(5, 7), 16) / 255 || 0;
          const stRgb = rgb(r, g, b);

          const stX = st.x * width;
          const stY = height - st.y * height - st.height * height;
          const stW = st.width * width;
          const stH = st.height * height;

          copiedPage.drawRectangle({
            x: stX,
            y: stY,
            width: stW,
            height: stH,
            borderColor: stRgb,
            borderWidth: 2,
            rotate: degrees(st.rotation || -6),
          });

          const label = st.stampType === 'CUSTOM' ? st.customText || 'APPROVED' : st.stampType;
          copiedPage.drawText(label, {
            x: stX + 8,
            y: stY + stH / 3,
            size: 14,
            font: helveticaBold,
            color: stRgb,
            rotate: degrees(st.rotation || -6),
          });
        }

        // 5. Draw Images & Signatures
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
              opacity: im.opacity || 1,
            });
          }
        }

        // 6. Draw Text Blocks
        for (const tb of pageTexts) {
          if (tb.isDeleted) continue;
          const origX = tb.originalX ?? tb.x;
          const origY = tb.originalY ?? tb.y;
          const wasMoved = tb.isOriginalParsed && (Math.abs(tb.x - origX) > 0.002 || Math.abs(tb.y - origY) > 0.002);
          const needsDrawing =
            !tb.isOriginalParsed ||
            wasMoved ||
            tb.text !== tb.originalText ||
            tb.color !== '#000000' ||
            tb.isBold ||
            tb.isItalic ||
            tb.isUnderline ||
            (tb.backgroundColor && tb.backgroundColor !== 'transparent');

          if (needsDrawing) {
            const r = parseInt(tb.color.slice(1, 3), 16) / 255 || 0;
            const g = parseInt(tb.color.slice(3, 5), 16) / 255 || 0;
            const b = parseInt(tb.color.slice(5, 7), 16) / 255 || 0;

            let font = helveticaFont;
            if (tb.isBold) font = helveticaBold;
            else if (tb.fontFamily?.includes('Times') || tb.fontFamily?.includes('Georgia')) font = timesFont;
            else if (tb.fontFamily?.includes('Courier')) font = courierFont;

            copiedPage.drawText(tb.text, {
              x: tb.x * width,
              y: Math.max(0, height - (tb.y * height) - (tb.fontSize * 0.9)),
              size: tb.fontSize,
              font,
              color: rgb(r, g, b),
            });
          }
        }
      }

      const pdfBytes = await outDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportMessage('🎉 Modified PDF exported with 100% crisp vector fidelity!');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      console.error('[Export PDF Error]', err);
      setError(err?.message || 'Failed to export customized PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // 12. AI CHAT
  const handleSendChat = async (promptOverride?: string) => {
    const textToSend = promptOverride || queryInput;
    if (!textToSend.trim() || isAiThinking || !extractedDocText) return;

    const userMsg = { id: `u_${Date.now()}`, sender: 'user' as const, text: textToSend.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setQueryInput('');
    setIsAiThinking(true);

    try {
      const data = await runAIProcess({
        task: 'ask_pdf',
        input: textToSend.trim(),
        options: {
          documentContext: extractedDocText.substring(0, 35000),
        },
      });

      const reply = data?.result || 'I reviewed the document content but could not find a conclusive response.';
      setChatMessages((prev) => [...prev, { id: `a_${Date.now()}`, sender: 'assistant', text: reply }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, sender: 'assistant', text: 'Error communicating with AI assistant. Please check your network or API keys.' },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-70px)] min-h-[750px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* 1. TOP PRIMARY TOOLBAR */}
      <div className="h-13 px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 select-none shrink-0 overflow-x-auto scrollbar-none">
        {/* HIDDEN GLOBAL FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadPdf(f);
            e.target.value = '';
          }}
        />

        {/* LEFT GROUP: OPEN PDF, THUMBNAILS, UNDO, REDO */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            title="Open or Change PDF"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{file ? 'Change PDF' : 'Open PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              leftSidebarOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Page Thumbnails"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Thumbnails</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-100"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
        </div>

        {/* CENTER GROUP: EDIT TOOLS (MATCHING SCREENSHOT) */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTool('addText')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTool === 'addText'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 font-bold border border-violet-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Add text"
          >
            <Type className="w-4 h-4" />
            <span>Add text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('editText')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              activeTool === 'editText'
                ? 'bg-violet-50 text-violet-700 border-violet-400 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-600 shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 border-transparent'
            }`}
            title="Edit text (Click existing text boxes)"
          >
            <PenTool className="w-4 h-4 text-violet-600" />
            <span>Edit text</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSignModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            title="Sign (Draw or type digital signature)"
          >
            <PenTool className="w-4 h-4 text-emerald-600" />
            <span>Sign</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('draw')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              activeTool === 'draw'
                ? 'bg-violet-100 text-violet-700 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Draw Freehand"
          >
            <PenTool className="w-4 h-4" />
            <span>Draw</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('line')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              activeTool === 'line'
                ? 'bg-violet-100 text-violet-700 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Draw Line or Shapes"
          >
            <Minus className="w-4 h-4" />
            <span>Line</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('highlight')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              activeTool === 'highlight'
                ? 'bg-violet-100 text-violet-700 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Text highlight"
          >
            <Highlighter className="w-4 h-4 text-amber-500" />
            <span>Text highlight</span>
          </button>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4 text-blue-500" />
            <span>Image</span>
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageInsert}
          />

          <button
            type="button"
            onClick={() => setActiveTool('stamp')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              activeTool === 'stamp'
                ? 'bg-violet-100 text-violet-700 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Stamp"
          >
            <Stamp className="w-4 h-4 text-red-500" />
            <span>Stamp</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4 text-indigo-500" />
            <span>Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool('note')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              activeTool === 'note'
                ? 'bg-violet-100 text-violet-700 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Sticky Note"
          >
            <StickyNote className="w-4 h-4 text-amber-500" />
            <span>Note</span>
          </button>
        </div>

        {/* RIGHT GROUP: FEEDBACK, MANAGE PAGES, PRINT, SEARCH, EXPORT */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsManagePagesOpen(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            title="Manage Pages (Reorder, Rotate, Delete, Merge)"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="hidden xl:inline">Manage pages</span>
          </button>

          {/* UNIFIED SUITE ACTIONS: MERGE, SPLIT, COMPRESS, ROTATE, OCR */}
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => mergeFileInputRef.current?.click()}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Append / Merge another PDF into workspace"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xl:inline">Merge</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSplitModalOpen(true)}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Split PDF into pages or extract ranges"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xl:inline">Split</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCompressModalOpen(true)}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Compress PDF file size with quality presets"
          >
            <Minimize2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xl:inline">Compress</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRotateModalOpen(true)}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="Rotate PDF pages"
          >
            <RotateCw className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden xl:inline">Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOcrModalOpen(true)}
            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            title="OCR: Scanned text recognition into live editable blocks"
          >
            <Scan className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden xl:inline">OCR</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-1.5 rounded-lg ${isSearchOpen ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-100'}`}
            title="Search text inside document"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 flex items-center gap-1 border border-violet-200"
            title="AI Assistant Drawer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">AI Suite</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="ml-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLBAR / TEXT FORMATTING INSPECTOR (MATCHING SCREENSHOT) */}
      <div className="h-11 px-4 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs select-none">
        {/* LEFT FORMATTING CONTROLS */}
        <div className="flex items-center gap-3">
          {/* FONT SIZE CONTROLS */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 font-bold text-xs">T</span>
            <button
              onClick={() => updateSelectedText({ fontSize: Math.max(8, fontSize - 1) })}
              className="px-1 hover:text-violet-600 font-black"
            >
              -
            </button>
            <span className="font-bold min-w-[20px] text-center">{fontSize}</span>
            <button
              onClick={() => updateSelectedText({ fontSize: Math.min(72, fontSize + 1) })}
              className="px-1 hover:text-violet-600 font-black"
            >
              +
            </button>
          </div>

          {/* BOX / HIGHLIGHT BACKGROUND COLOR */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <SquareIcon className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="color"
              value={bgColor === 'transparent' ? '#ffffff' : bgColor}
              onChange={(e) => {
                setBgColor(e.target.value);
                updateSelectedText({ backgroundColor: e.target.value });
              }}
              className="w-4 h-4 rounded cursor-pointer border-0 p-0"
              title="Box Background / Highlight Color"
            />
          </div>

          {/* TEXT COLOR PICKER (SOLID CIRCLE) */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <div
              className="w-4 h-4 rounded-full border border-slate-400 cursor-pointer shadow-xs"
              style={{ backgroundColor: textColor }}
              title="Current Text Color"
            />
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                updateSelectedText({ color: e.target.value });
              }}
              className="w-4 h-4 rounded cursor-pointer border-0 p-0"
              title="Choose Custom Color"
            />
            <div className="flex items-center gap-1 ml-1">
              {PRESET_COLORS.slice(0, 4).map((c) => (
                <button
                  key={c.hex}
                  onClick={() => {
                    setTextColor(c.hex);
                    updateSelectedText({ color: c.hex });
                  }}
                  className="w-3 h-3 rounded-full border border-slate-300"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* FONT FAMILY DROPDOWN */}
          <div className="flex items-center gap-1">
            <select
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                updateSelectedText({ fontFamily: e.target.value });
              }}
              className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-800 dark:text-slate-200"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* BOLD / ITALIC / UNDERLINE */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              onClick={() => {
                setIsBold(!isBold);
                updateSelectedText({ isBold: !isBold });
              }}
              className={`px-2 py-0.5 rounded font-black ${isBold ? 'bg-violet-100 text-violet-700' : 'text-slate-600'}`}
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => {
                setIsItalic(!isItalic);
                updateSelectedText({ isItalic: !isItalic });
              }}
              className={`px-2 py-0.5 rounded italic font-serif ${isItalic ? 'bg-violet-100 text-violet-700' : 'text-slate-600'}`}
              title="Italic"
            >
              I
            </button>
            <button
              onClick={() => {
                setIsUnderline(!isUnderline);
                updateSelectedText({ isUnderline: !isUnderline });
              }}
              className={`px-2 py-0.5 rounded underline ${isUnderline ? 'bg-violet-100 text-violet-700' : 'text-slate-600'}`}
              title="Underline"
            >
              U
            </button>
          </div>

          {/* ALIGNMENT */}
          <div className="hidden md:flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              onClick={() => {
                setTextAlign('left');
                updateSelectedText({ textAlign: 'left' });
              }}
              className={`p-1 rounded ${textAlign === 'left' ? 'bg-violet-100 text-violet-700' : 'text-slate-500'}`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTextAlign('center');
                updateSelectedText({ textAlign: 'center' });
              }}
              className={`p-1 rounded ${textAlign === 'center' ? 'bg-violet-100 text-violet-700' : 'text-slate-500'}`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTextAlign('right');
                updateSelectedText({ textAlign: 'right' });
              }}
              className={`p-1 rounded ${textAlign === 'right' ? 'bg-violet-100 text-violet-700' : 'text-slate-500'}`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* FAR RIGHT: TRASH CAN DELETE BUTTON (MATCHING SCREENSHOT) */}
        <div>
          <button
            onClick={deleteSelectedElement}
            disabled={!selectedElementId}
            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Delete Selected Element"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. FIND & REPLACE BAR (WHEN ACTIVE) */}
      {isSearchOpen && (
        <div className="bg-amber-50 dark:bg-slate-900 border-b border-amber-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Replace className="w-4 h-4 text-amber-600" />
            <span>Search & Replace in PDF:</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search text in PDF..."
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs w-52"
          />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace with..."
            className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs w-52"
          />
          <button
            type="button"
            onClick={handleGlobalFindReplace}
            disabled={!searchQuery.trim()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg disabled:opacity-40"
          >
            Replace All
          </button>
          <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. WORKSPACE MAIN BODY: LEFT THUMBNAILS | CENTER CANVAS | RIGHT AI DRAWER */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: THUMBNAILS */}
        {file && leftSidebarOpen && (
          <div className="absolute inset-y-0 left-0 z-30 w-56 md:relative md:w-52 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-xl md:shadow-none">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Pages ({pagesList.length})</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => rotateAllPages(90)}
                  className="p-1 text-slate-500 hover:text-purple-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] flex items-center gap-1"
                  title="Rotate all pages 90°"
                >
                  <RotateCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Rotate All</span>
                </button>
                <button
                  type="button"
                  onClick={() => mergeFileInputRef.current?.click()}
                  className="px-2 py-0.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded text-[11px] font-bold border border-violet-200 flex items-center gap-1"
                  title="Append another PDF"
                >
                  <Plus className="w-3 h-3" />
                  <span>Append</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLeftSidebarOpen(false)}
                  className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Close Thumbnails"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                ref={mergeFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) appendPdfFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {/* THUMBNAILS LIST WITH DRAG & DROP REORDERING */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="text-[10px] text-slate-400 font-medium text-center pb-1">
                Drag cards to reorder • Hover for page tools
              </div>
              {pagesList.map((pm, idx) => (
                <div
                  key={pm.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(idx));
                    setDraggedPageIdx(idx);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
                    if (!isNaN(fromIdx)) reorderPages(fromIdx, idx);
                    setDraggedPageIdx(null);
                  }}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`flex flex-col items-center cursor-pointer group relative p-1.5 rounded-xl border transition-all ${
                    currentPage === idx + 1
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  } ${draggedPageIdx === idx ? 'opacity-40 scale-95 border-dashed border-violet-500' : ''}`}
                >
                  {/* HOVER ACTION OVERLAY TOOLBAR */}
                  <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-900/85 text-white p-1 rounded-lg backdrop-blur-xs transition-opacity shadow-lg">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        rotatePage(idx, 90);
                      }}
                      className="p-1 hover:text-purple-300 rounded hover:bg-white/20 transition-colors"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPages(idx, Math.max(0, idx - 1));
                      }}
                      disabled={idx === 0}
                      className="p-1 hover:text-blue-300 disabled:opacity-30 rounded hover:bg-white/20 transition-colors"
                      title="Move Page Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderPages(idx, Math.min(pagesList.length - 1, idx + 1));
                      }}
                      disabled={idx === pagesList.length - 1}
                      className="p-1 hover:text-blue-300 disabled:opacity-30 rounded hover:bg-white/20 transition-colors"
                      title="Move Page Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicatePage(idx);
                      }}
                      className="p-1 hover:text-emerald-300 rounded hover:bg-white/20 transition-colors"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(idx);
                      }}
                      className="p-1 hover:text-rose-400 rounded hover:bg-white/20 transition-colors"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* THUMBNAIL CANVAS PREVIEW */}
                  <div className="aspect-[3/4] w-full rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                    {pm.thumbnailUrl ? (
                      <img
                        src={pm.thumbnailUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-contain pointer-events-none"
                        style={{ transform: `rotate(${pm.rotation || 0}deg)` }}
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* PAGE NUMBER & ROTATION BADGE */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <div
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        currentPage === idx + 1 ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Page {idx + 1}
                    </div>
                    {pm.rotation !== 0 && (
                      <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">
                        {pm.rotation}°
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* BOTTOM APPEND CARD */}
              <button
                type="button"
                onClick={() => mergeFileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-violet-600 transition-colors bg-slate-50/50 dark:bg-slate-800/30"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-semibold">+ Append PDF Document</span>
              </button>
            </div>
          </div>
        )}

        {/* CENTER VIEWPORT & LIVE DOCUMENT CANVAS */}
        <div className="flex-1 bg-slate-200/90 dark:bg-slate-950 overflow-auto p-4 sm:p-10 flex flex-col items-center justify-start relative select-none">
          {!file ? (
            <div className="my-auto max-w-4xl w-full space-y-6">
              {/* PRIMARY DROPZONE */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f) loadPdf(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-violet-300 dark:border-slate-700 hover:border-violet-600 rounded-3xl p-8 sm:p-10 text-center cursor-pointer bg-white dark:bg-slate-900 transition-all space-y-4 shadow-sm group"
              >
                <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    ConvertX Interactive PDF Studio &amp; AI Suite
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Drop any PDF document to launch the live vector canvas. Edit existing text, add shapes, sign, reorder pages, compress, OCR, or ask questions to AI.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs bg-violet-600 text-white hover:bg-violet-700 shadow-sm flex items-center justify-center gap-2 transition-all hover:shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Open PDF Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMergeModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Merge Multiple PDFs</span>
                  </button>
                </div>
              </div>

              {/* 6 UNIFIED QUICK ACTION CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(true)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Merge PDFs</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Combine multiple files into one document</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (file) setIsSplitModalOpen(true);
                    else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-md text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Split &amp; Extract</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Extract custom page ranges or zip all</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (file) setIsCompressModalOpen(true);
                    else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Minimize2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Compress PDF</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Reduce file size with quality presets</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (file) setIsRotateModalOpen(true);
                    else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-md text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <RotateCw className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Rotate Pages</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Orient in 90° clockwise/counter increments</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (file) setIsOcrModalOpen(true);
                    else {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Scan className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Scanned OCR</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Recognize text &amp; turn into live editable blocks</p>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:shadow-md text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Canvas Editor</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click any text to edit, sign, or annotate</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center">
              {/* DOCUMENT PAPER CANVAS (EXACT MATCHING SCREENSHOT) */}
              <div
                ref={containerRef}
                onClick={handleCanvasClick}
                className={`relative bg-white rounded-sm border border-slate-300 dark:border-slate-800 overflow-hidden ${
                  dragState?.isDragging ? 'cursor-grabbing select-none' : activeTool === 'draw' ? 'cursor-crosshair' : 'cursor-default'
                }`}
                style={{
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
                  width: pageDimensions.width > 0 ? `${pageDimensions.width}px` : undefined,
                  height: pageDimensions.height > 0 ? `${pageDimensions.height}px` : undefined,
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
                        setSelectedElementId(wh.id);
                      }}
                      onMouseDown={(e) => startDragging(e, wh.id, 'whiteout', wh.x, wh.y)}
                      className={`absolute bg-white border border-slate-200 cursor-grab active:cursor-grabbing ${
                        selectedElementId === wh.id ? 'ring-2 ring-violet-500 shadow-md' : 'hover:border-slate-400'
                      }`}
                      style={{
                        left: `${wh.x * 100}%`,
                        top: `${wh.y * 100}%`,
                        width: `${wh.width * 100}%`,
                        height: `${wh.height * 100}%`,
                      }}
                      title="Click to select, drag to move whiteout"
                    />
                  ))}

                {/* 4. Shapes & Lines Layer */}
                {shapeBlocks
                  .filter((sh) => sh.pageIndex === currentPage - 1)
                  .map((sh) => (
                    <div
                      key={sh.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(sh.id);
                      }}
                      onMouseDown={(e) => startDragging(e, sh.id, 'shape', sh.x, sh.y)}
                      className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow ${
                        selectedElementId === sh.id ? 'ring-2 ring-violet-500 rounded p-0.5 shadow-lg' : 'hover:ring-1 hover:ring-violet-400'
                      }`}
                      style={{
                        left: `${sh.x * 100}%`,
                        top: `${sh.y * 100}%`,
                        width: `${sh.width * 100}%`,
                        height: `${sh.height * 100}%`,
                        opacity: sh.opacity,
                      }}
                      title="Click to select, drag to move shape"
                    >
                      {sh.shapeType === 'rectangle' && (
                        <div
                          className="w-full h-full"
                          style={{
                            border: `${sh.strokeWidth}px solid ${sh.strokeColor}`,
                            backgroundColor: sh.fillColor,
                          }}
                        />
                      )}
                      {sh.shapeType === 'circle' && (
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            border: `${sh.strokeWidth}px solid ${sh.strokeColor}`,
                            backgroundColor: sh.fillColor,
                          }}
                        />
                      )}
                      {(sh.shapeType === 'line' || sh.shapeType === 'arrow') && (
                        <div
                          className="w-full h-0 my-auto border-t"
                          style={{
                            borderTop: `${sh.strokeWidth}px solid ${sh.strokeColor}`,
                          }}
                        />
                      )}
                      {sh.shapeType === 'highlight' && (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: sh.strokeColor || '#fef08a',
                            opacity: 0.5,
                          }}
                        />
                      )}
                    </div>
                  ))}

                {/* 5. Stamps Layer */}
                {stampBlocks
                  .filter((st) => st.pageIndex === currentPage - 1)
                  .map((st) => (
                    <div
                      key={st.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(st.id);
                      }}
                      onMouseDown={(e) => startDragging(e, st.id, 'stamp', st.x, st.y)}
                      className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow ${
                        selectedElementId === st.id ? 'ring-2 ring-violet-500 rounded shadow-xl' : 'hover:ring-1 hover:ring-violet-400'
                      }`}
                      style={{
                        left: `${st.x * 100}%`,
                        top: `${st.y * 100}%`,
                        width: `${st.width * 100}%`,
                        height: `${st.height * 100}%`,
                        transform: `rotate(${st.rotation || -6}deg)`,
                      }}
                      title="Click to select, drag to move stamp"
                    >
                      <div
                        className="w-full h-full flex items-center justify-center font-black uppercase tracking-widest text-xs rounded-md border-2 px-2 shadow-xs"
                        style={{
                          borderColor: st.color,
                          color: st.color,
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        }}
                      >
                        {st.stampType === 'CUSTOM' ? st.customText || 'APPROVED' : st.stampType}
                      </div>
                    </div>
                  ))}

                {/* 6. Images & Signatures Layer */}
                {imageBlocks
                  .filter((im) => im.pageIndex === currentPage - 1)
                  .map((im) => (
                    <div
                      key={im.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(im.id);
                      }}
                      onMouseDown={(e) => startDragging(e, im.id, 'image', im.x, im.y)}
                      className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow ${
                        selectedElementId === im.id ? 'ring-2 ring-violet-500 rounded p-1 shadow-xl' : 'hover:ring-1 hover:ring-violet-400'
                      }`}
                      style={{
                        left: `${im.x * 100}%`,
                        top: `${im.y * 100}%`,
                        width: `${im.width * 100}%`,
                        height: `${im.height * 100}%`,
                      }}
                      title="Click to select, drag to move image"
                    >
                      <img src={im.dataUrl} alt="Asset" className="w-full h-full object-contain pointer-events-none" />
                    </div>
                  ))}

                {/* 7. Links Layer */}
                {linkBlocks
                  .filter((l) => l.pageIndex === currentPage - 1)
                  .map((l) => (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (activeTool === 'editText') {
                          e.preventDefault();
                          setSelectedElementId(l.id);
                        }
                      }}
                      className="absolute border border-dashed border-blue-500 bg-blue-50/40 hover:bg-blue-100/60 rounded flex items-center px-1 text-[10px] text-blue-700"
                      style={{
                        left: `${l.x * 100}%`,
                        top: `${l.y * 100}%`,
                        width: `${l.width * 100}%`,
                        height: `${l.height * 100}%`,
                      }}
                    >
                      <LinkIcon className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate">{l.url}</span>
                    </a>
                  ))}

                {/* 8. Notes Layer */}
                {noteBlocks
                  .filter((n) => n.pageIndex === currentPage - 1)
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(n.id);
                      }}
                      onMouseDown={(e) => startDragging(e, n.id, 'note', n.x, n.y)}
                      className="absolute cursor-grab active:cursor-grabbing group z-20"
                      style={{
                        left: `${n.x * 100}%`,
                        top: `${n.y * 100}%`,
                      }}
                      title="Click to view/edit, drag to move note"
                    >
                      <div className={`w-6 h-6 rounded-md bg-amber-300 border border-amber-500 flex items-center justify-center shadow-md text-amber-900 transition-transform group-hover:scale-110 ${
                        selectedElementId === n.id ? 'ring-2 ring-violet-500' : ''
                      }`}>
                        <StickyNote className="w-3.5 h-3.5" />
                      </div>
                      {selectedElementId === n.id && (
                        <div className="absolute left-7 top-0 w-48 p-2 rounded-lg bg-amber-100 border border-amber-300 text-xs shadow-xl z-40">
                          <textarea
                            value={n.content}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNoteBlocks((prev) =>
                                prev.map((item) => (item.id === n.id ? { ...item, content: val } : item))
                              );
                            }}
                            className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 resize-none font-sans"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                {/* 8b. MASK LAYER FOR MOVED ORIGINAL TEXT (COVERS PREVIOUS LOCATION CLEANLY) */}
                {textBlocks
                  .filter((tb) => tb.pageIndex === currentPage - 1 && tb.isOriginalParsed)
                  .map((tb) => {
                    const origX = tb.originalX ?? tb.x;
                    const origY = tb.originalY ?? tb.y;
                    const wasMoved = Math.abs(tb.x - origX) > 0.002 || Math.abs(tb.y - origY) > 0.002;
                    if (!wasMoved) return null;
                    return (
                      <div
                        key={`orig_mask_${tb.id}`}
                        className="absolute bg-white dark:bg-slate-900 pointer-events-none z-10"
                        style={{
                          left: `${origX * 100}%`,
                          top: `${origY * 100}%`,
                          width: `${(tb.width || 0.1) * 100}%`,
                          height: `${(tb.height || 0.03) * 100}%`,
                        }}
                      />
                    );
                  })}

                {/* 9. INTERACTIVE CLEAN TEXT BLOCKS (ZERO DOUBLE-RENDERING, PRECISE MASKING & DRAGGING) */}
                {textBlocks
                  .filter((tb) => tb.pageIndex === currentPage - 1)
                  .map((tb) => {
                    const isSelected = selectedElementId === tb.id;
                    const origX = tb.originalX ?? tb.x;
                    const origY = tb.originalY ?? tb.y;
                    const wasMoved = tb.isOriginalParsed && (Math.abs(tb.x - origX) > 0.002 || Math.abs(tb.y - origY) > 0.002);
                    const isModified =
                      !tb.isOriginalParsed ||
                      wasMoved ||
                      tb.text !== tb.originalText ||
                      tb.color !== '#000000' ||
                      tb.isBold ||
                      tb.isItalic ||
                      tb.isUnderline ||
                      (tb.backgroundColor && tb.backgroundColor !== 'transparent');

                    // Case 1: Deleted text block (Completely covered with clean whiteout)
                    if (tb.isDeleted) {
                      return (
                        <div
                          key={tb.id}
                          className="absolute bg-white dark:bg-slate-900 pointer-events-none z-10"
                          style={{
                            left: `${tb.x * 100}%`,
                            top: `${tb.y * 100}%`,
                            width: `${(tb.width || 0.1) * 100}%`,
                            height: `${(tb.height || 0.03) * 100}%`,
                          }}
                          title="Deleted Text Area"
                        />
                      );
                    }

                    // Case 2: Selected Text Block (Active editing mode with opaque mask covering original)
                    if (isSelected) {
                      return (
                        <div
                          key={tb.id}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute z-30 select-none"
                          style={{
                            left: `${tb.x * 100}%`,
                            top: `${tb.y * 100}%`,
                            width: `max(140px, ${(tb.width || 0.1) * 100}%)`,
                            minHeight: `${(tb.height || 0.03) * 100}%`,
                          }}
                        >
                          {/* Dedicated Drag & Move Handle on top of active element */}
                          <div
                            onMouseDown={(e) => startDragging(e, tb.id, 'text', tb.x, tb.y)}
                            className="absolute -top-7 left-0 bg-blue-600 hover:bg-blue-700 text-white rounded-t-md px-2 py-0.5 flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none shadow-md text-[10px] font-semibold tracking-wide z-40 transition-colors"
                            title="Click & drag to move this text box"
                          >
                            <Move className="w-3 h-3 shrink-0" />
                            <span>Move</span>
                            <span className="text-[9px] opacity-75 font-mono ml-1">
                              {Math.round(tb.x * 100)}%, {Math.round(tb.y * 100)}%
                            </span>
                          </div>

                          {/* Opaque white background mask to completely hide original raster text underneath */}
                          <div className="absolute -inset-1 bg-white dark:bg-slate-900 rounded-sm shadow-xl ring-2 ring-blue-600 -z-10" />

                          {/* Active Inline Text Input */}
                          <input
                            type="text"
                            value={tb.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateSelectedText({ text: val });
                            }}
                            className="w-full bg-transparent border-0 focus:outline-none p-0.5 text-slate-900 dark:text-white"
                            style={{
                              fontSize: `${tb.fontSize * zoom}px`,
                              lineHeight: 1.2,
                              color: tb.color,
                              fontWeight: tb.isBold ? 'bold' : 'normal',
                              fontStyle: tb.isItalic ? 'italic' : 'normal',
                              textDecoration: tb.isUnderline ? 'underline' : 'none',
                              fontFamily: tb.fontFamily || 'Arial, sans-serif',
                              textAlign: tb.textAlign || 'left',
                            }}
                            autoFocus
                          />
                        </div>
                      );
                    }

                    // Case 3: Modified or User-Added or Moved Text Block
                    if (isModified) {
                      return (
                        <div
                          key={tb.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElementId(tb.id);
                          }}
                          onMouseDown={(e) => startDragging(e, tb.id, 'text', tb.x, tb.y)}
                          className="absolute z-20 cursor-grab active:cursor-grabbing group select-none"
                          style={{
                            left: `${tb.x * 100}%`,
                            top: `${tb.y * 100}%`,
                            width: `${(tb.width || 0.1) * 100}%`,
                            height: `${(tb.height || 0.03) * 100}%`,
                          }}
                          title="Click to select & edit, drag to move text"
                        >
                          {/* Whiteout coverage layer for original text underneath if not moved */}
                          {tb.isOriginalParsed && !wasMoved && (
                            <div className="absolute -inset-0.5 bg-white dark:bg-slate-900 -z-10 rounded-xs" />
                          )}

                          <div
                            className="w-full h-full flex items-center px-0.5 rounded-xs transition-all border border-transparent group-hover:border-blue-500/70 group-hover:bg-blue-50/20"
                            style={{
                              fontSize: `${tb.fontSize * zoom}px`,
                              lineHeight: 1.2,
                              color: tb.color,
                              fontWeight: tb.isBold ? 'bold' : 'normal',
                              fontStyle: tb.isItalic ? 'italic' : 'normal',
                              textDecoration: tb.isUnderline ? 'underline' : 'none',
                              fontFamily: tb.fontFamily || 'Arial, sans-serif',
                              textAlign: tb.textAlign || 'left',
                              backgroundColor: tb.backgroundColor || 'transparent',
                            }}
                          >
                            <span className="whitespace-pre truncate w-full">{tb.text}</span>
                          </div>
                        </div>
                      );
                    }

                    // Case 4: Unmodified Original Text Block (Canvas already shows it crisply!)
                    // Renders an invisible hit box that reveals a clean outline ONLY ON HOVER!
                    return (
                      <div
                        key={tb.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementId(tb.id);
                        }}
                        className="absolute z-10 cursor-pointer transition-all border border-transparent hover:border-dashed hover:border-blue-500/80 hover:bg-blue-50/15 rounded-xs"
                        style={{
                          left: `${tb.x * 100}%`,
                          top: `${tb.y * 100}%`,
                          width: `${(tb.width || 0.1) * 100}%`,
                          height: `${(tb.height || 0.03) * 100}%`,
                        }}
                        title="Click to edit & move this text"
                      />
                    );
                  })}
              </div>

              {/* 5. BOTTOM FLOATING NAVIGATION BAR */}
              <div className="fixed bottom-6 z-40 flex items-center gap-3 bg-slate-800/90 hover:bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs select-none">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="text-slate-400">Page:</span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 hover:text-white text-slate-300 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold">
                    {currentPage}/{pagesList.length || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pagesList.length, p + 1))}
                    disabled={currentPage >= pagesList.length}
                    className="p-1 hover:text-white text-slate-300 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-600" />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.15) * 100) / 100))}
                  className="p-1 hover:text-white text-slate-300"
                  title="Zoom Out (50% min)"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="font-mono text-[11px] font-bold text-slate-200 min-w-[34px] text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.0, Math.round((z + 0.15) * 100) / 100))}
                  className="p-1 hover:text-white text-slate-300"
                  title="Zoom In (200% max)"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-600" />

                <button
                  type="button"
                  onClick={() => setIsHandTool(!isHandTool)}
                  className={`p-1.5 rounded-full ${isHandTool ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
                  title="Hand Tool / Pan"
                >
                  <Hand className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setZoom(1.1)}
                  className="p-1 text-slate-300 hover:text-white"
                  title="Fit Page"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT DRAWER: AI SUITE */}
        {file && rightSidebarOpen && (
          <div className="absolute inset-y-0 right-0 z-30 w-80 sm:w-96 md:relative bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-2xl md:shadow-none">
            <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveAiTab('askPdf')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'askPdf'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Ask PDF
                </button>
                <button
                  onClick={() => setActiveAiTab('tts')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'tts'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  TTS Audio
                </button>
                <button
                  onClick={() => setActiveAiTab('seo')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'seo'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  SEO
                </button>
                <button
                  onClick={() => setActiveAiTab('imageGen')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeAiTab === 'imageGen'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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
                      <span>Analyzing document context...</span>
                    </div>
                  )}
                </div>

                <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none">
                  {['Summarize document', 'Action items', 'Legal risks', 'Extract emails'].map((q, idx) => (
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

            {/* TAB 2: TTS AUDIO */}
            {activeAiTab === 'tts' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-2xl border border-violet-200 dark:border-violet-900/40 space-y-2">
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-200 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Listen to Document
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Natural text-to-speech audio reader with rate modulation.
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
                  onClick={() => {
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
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-sm flex items-center justify-center gap-2"
                >
                  {ttsIsPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  {ttsIsPlaying ? 'Stop Audio' : 'Read Document Aloud'}
                </button>
              </div>
            )}

            {/* TAB 3: SEO ANALYZER */}
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
                      onClick={async () => {
                        if (!extractedDocText) return;
                        setIsSeoAnalyzing(true);
                        try {
                          const data = await safeFetchJson('/api/ai/process', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              task: 'seo_optimize',
                              input: extractedDocText.substring(0, 8000),
                              options: { targetKeyword: seoKeyword || 'document' },
                            }),
                          });
                          if (data?.structuredData) setSeoResult(data.structuredData);
                          else if (data?.result) setSeoResult(JSON.parse(data.result));
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsSeoAnalyzing(false);
                        }
                      }}
                      disabled={isSeoAnalyzing}
                      className="px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"
                    >
                      {isSeoAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Audit'}
                    </button>
                  </div>
                </div>

                {seoResult && (
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-200 text-xs space-y-2">
                    <div className="flex justify-between font-bold">
                      <span>SEO Score:</span>
                      <span className="text-violet-600 text-sm">{seoResult.seoScore || 80}/100</span>
                    </div>
                    {seoResult.metaDescription && (
                      <p className="text-[11px] text-slate-600">{seoResult.metaDescription}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: IMAGE GENERATOR */}
            {activeAiTab === 'imageGen' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="e.g. Official stamp or corporate illustration..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs resize-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!imagePrompt.trim()) return;
                    setIsGeneratingImg(true);
                    const seed = Math.floor(Math.random() * 999999);
                    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&seed=${seed}&nologo=true`;
                    setGeneratedImgUrl(url);
                    setIsGeneratingImg(false);
                  }}
                  disabled={isGeneratingImg || !imagePrompt.trim()}
                  className="w-full py-2 bg-violet-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                >
                  {isGeneratingImg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate Image
                </button>

                {generatedImgUrl && (
                  <div className="space-y-2">
                    <img src={generatedImgUrl} alt="AI" className="w-full rounded-xl border" />
                    <button
                      type="button"
                      onClick={() => {
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
                        const updated = [...imageBlocks, newImg];
                        setImageBlocks(updated);
                        pushHistorySnapshot(undefined, undefined, undefined, updated);
                      }}
                      className="w-full py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Insert into PDF Page
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. DIGITAL SIGNATURE MODAL (DRAW OR TYPE) */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-600" />
                Add Digital Signature
              </h3>
              <button onClick={() => setIsSignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  signatureMode === 'draw' ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600' : 'text-slate-500'
                }`}
              >
                Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('type')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  signatureMode === 'type' ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600' : 'text-slate-500'
                }`}
              >
                Type Signature
              </button>
            </div>

            {signatureMode === 'draw' ? (
              <div className="space-y-2">
                <canvas
                  ref={signPadRef}
                  width={380}
                  height={140}
                  onMouseDown={(e) => {
                    const canvas = signPadRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    const rect = canvas.getBoundingClientRect();
                    ctx.beginPath();
                    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 2.5;
                    ctx.lineCap = 'round';
                    const onMove = (mv: MouseEvent) => {
                      ctx.lineTo(mv.clientX - rect.left, mv.clientY - rect.top);
                      ctx.stroke();
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  className="w-full h-36 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-crosshair"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const canvas = signPadRef.current;
                      if (!canvas) return;
                      const ctx = canvas.getContext('2d');
                      ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear pad
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your name..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border text-center font-serif italic text-2xl text-slate-800 dark:text-slate-200">
                  {typedSignature || 'Signature Preview'}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertSignature}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Insert Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. LINK MODAL */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Insert Web Link</h3>
            <input
              type="url"
              value={linkUrlInput}
              onChange={(e) => setLinkUrlInput(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border rounded-xl text-xs"
            />
            <div className="flex gap-2">
              <button onClick={() => setIsLinkModalOpen(false)} className="flex-1 py-1.5 border rounded-lg text-xs">
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setActiveTool('link');
                  setExportMessage('Click on the page to place the clickable hyperlink hotspot!');
                  setTimeout(() => setExportMessage(null), 3000);
                }}
                className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Set Target URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED MODAL 1: MERGE PDFS */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Merge PDF Documents</h3>
                  <p className="text-xs text-slate-500">Combine multiple PDF files into one clean document</p>
                </div>
              </div>
              <button onClick={() => setIsMergeModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Queue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Selected Documents ({(file ? 1 : 0) + mergeQueue.length})</span>
                <button
                  type="button"
                  onClick={() => mergeFileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 rounded-lg text-xs font-bold border border-violet-200 dark:border-violet-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add PDF Files</span>
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40">
                {file && (
                  <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-900/50 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB • Current Active Document</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      Primary
                    </span>
                  </div>
                )}

                {mergeQueue.map((mf, idx) => (
                  <div key={`${mf.name}-${idx}`} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                        {(file ? 2 : 1) + idx}
                      </span>
                      <FileText className="w-4 h-4 text-violet-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{mf.name}</p>
                        <p className="text-[10px] text-slate-400">{(mf.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === 0) return;
                          const copy = [...mergeQueue];
                          const temp = copy[idx];
                          copy[idx] = copy[idx - 1];
                          copy[idx - 1] = temp;
                          setMergeQueue(copy);
                        }}
                        disabled={idx === 0}
                        className="p-1 hover:text-blue-600 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === mergeQueue.length - 1) return;
                          const copy = [...mergeQueue];
                          const temp = copy[idx];
                          copy[idx] = copy[idx + 1];
                          copy[idx + 1] = temp;
                          setMergeQueue(copy);
                        }}
                        disabled={idx === mergeQueue.length - 1}
                        className="p-1 hover:text-blue-600 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMergeQueue(mergeQueue.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {!file && mergeQueue.length === 0 && (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <Layers className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs">No files added yet. Click &quot;Add PDF Files&quot; to begin merging.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleMergeFilesSubmit('download')}
                disabled={isMergingFiles || ((file ? 1 : 0) + mergeQueue.length < 2)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isMergingFiles ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Merge &amp; Download</span>
              </button>
              <button
                type="button"
                onClick={() => handleMergeFilesSubmit('workspace')}
                disabled={isMergingFiles || ((file ? 1 : 0) + mergeQueue.length < 2)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isMergingFiles ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                <span>Merge &amp; Open in Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED MODAL 2: SPLIT PDF */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Split / Extract PDF</h3>
                  <p className="text-xs text-slate-500">Extract page ranges or separate all pages into a ZIP</p>
                </div>
              </div>
              <button onClick={() => setIsSplitModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMode('range')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    splitMode === 'range'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs">Custom Range</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">e.g. 1-3, 5</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('current')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    splitMode === 'current'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs">Current Page</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Page {currentPage}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('allZip')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    splitMode === 'allZip'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs">Split All (ZIP)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Every page .pdf</p>
                </button>
              </div>

              {splitMode === 'range' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Page Ranges (Total Pages: {pagesList.length}):
                  </label>
                  <input
                    type="text"
                    value={splitRangeInput}
                    onChange={(e) => setSplitRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5, 7"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400">Separate pages with commas or hyphens (e.g. &quot;1-2, 4&quot;).</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSplitPdf}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                <span>Extract &amp; Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED MODAL 3: COMPRESS PDF */}
      {isCompressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Minimize2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Compress PDF File Size</h3>
                  <p className="text-xs text-slate-500">Reduce document size with instant quality presets</p>
                </div>
              </div>
              <button onClick={() => setIsCompressModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCompressionPreset('screen')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    compressionPreset === 'screen'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs">Extreme</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Max size savings (~65%)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCompressionPreset('balanced')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    compressionPreset === 'balanced'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs">Recommended</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Balanced quality &amp; size</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCompressionPreset('print')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    compressionPreset === 'print'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="font-bold text-xs">High Quality</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Crisp vectors &amp; print</p>
                </button>
              </div>

              {compressionPreset === 'balanced' && (
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Quality Slider</span>
                    <span className="text-emerald-600 font-bold">{customQualityPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="95"
                    value={customQualityPercent}
                    onChange={(e) => setCustomQualityPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              )}

              {compressResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Saved {Math.round((1 - compressResult.compSize / compressResult.origSize) * 100)}%!
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {(compressResult.origSize / (1024 * 1024)).toFixed(2)} MB &rarr; {(compressResult.compSize / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <a
                    href={compressResult.downloadUrl}
                    download={`compressed-${file?.name || 'document.pdf'}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCompressModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCompressPdf}
                disabled={isCompressing || !file}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                {isCompressing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Minimize2 className="w-3.5 h-3.5" />}
                <span>{compressResult ? 'Re-compress' : 'Compress Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED MODAL 4: ROTATE PDF */}
      {isRotateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Rotate PDF Pages</h3>
                  <p className="text-xs text-slate-500">Fix page orientation in 90° increments</p>
                </div>
              </div>
              <button onClick={() => setIsRotateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Rotation Angle:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { deg: 90, label: '90° Clockwise' },
                    { deg: 180, label: '180° Invert' },
                    { deg: 270, label: '90° Counter-CW' },
                  ].map((item) => (
                    <button
                      key={item.deg}
                      type="button"
                      onClick={() => setRotateDegreeAngle(item.deg)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        rotateDegreeAngle === item.deg
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Apply To:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { scope: 'all' as const, label: `All Pages (${pagesList.length})` },
                    { scope: 'current' as const, label: `Current Page (${currentPage})` },
                    { scope: 'even' as const, label: 'Even Pages' },
                    { scope: 'odd' as const, label: 'Odd Pages' },
                  ].map((item) => (
                    <button
                      key={item.scope}
                      type="button"
                      onClick={() => setRotateTargetScope(item.scope)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        rotateTargetScope === item.scope
                          ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRotateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyRotation}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Apply Rotation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED MODAL 5: PDF OCR & TEXT RECOGNITION */}
      {isOcrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">PDF OCR Text Recognition</h3>
                  <p className="text-xs text-slate-500">Recognize text on scanned pages &amp; convert to editable blocks</p>
                </div>
              </div>
              <button onClick={() => setIsOcrModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Recognition Language:
                  </label>
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  >
                    {OCR_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Pages:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOcrSelectedScope('current')}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        ocrSelectedScope === 'current'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Current ({currentPage})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOcrSelectedScope('all')}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        ocrSelectedScope === 'all'
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      All ({pagesList.length})
                    </button>
                  </div>
                </div>
              </div>

              {isOcrProcessing && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{ocrStatusText || 'Scanning document with OCR...'}</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-200/50 dark:bg-indigo-900 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {ocrTextResult && !isOcrProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Recognized Text Preview:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ocrTextResult);
                        setExportMessage('Copied OCR text to clipboard!');
                        setTimeout(() => setExportMessage(null), 3000);
                      }}
                      className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Text</span>
                    </button>
                  </div>
                  <textarea
                    value={ocrTextResult}
                    onChange={(e) => setOcrTextResult(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOcrModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>

              {ocrTextResult ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([ocrTextResult], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `ocr-${file?.name || 'document'}.txt`;
                      a.click();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteOcr('editableBlocks')}
                    disabled={isOcrProcessing}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply to Canvas as Editable Blocks</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleExecuteOcr('copyText')}
                  disabled={isOcrProcessing || !pdfProxy}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isOcrProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
                  <span>Start OCR Recognition</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MANAGE PAGES MODAL */}
      {isManagePagesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Manage PDF Pages</h3>
              <button onClick={() => setIsManagePagesOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-4 p-2">
              {pagesList.map((pm, idx) => (
                <div key={pm.id} className="border rounded-xl p-2 bg-slate-50 dark:bg-slate-800 text-center space-y-2">
                  <div className="aspect-[3/4] w-full rounded bg-white overflow-hidden">
                    <img
                      src={pm.thumbnailUrl}
                      alt={`p${idx + 1}`}
                      className="w-full h-full object-contain"
                      style={{ transform: `rotate(${pm.rotation}deg)` }}
                    />
                  </div>
                  <span className="text-xs font-bold">Page {idx + 1}</span>
                  <div className="flex justify-center gap-2 pt-1 border-t">
                    <button
                      onClick={() => {
                        setPagesList((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
                        );
                      }}
                      className="p-1 hover:text-violet-600"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (pagesList.length <= 1) return;
                        setPagesList((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="p-1 hover:text-rose-600"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsManagePagesOpen(false)}
                className="px-5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {exportMessage && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between font-semibold fixed top-2 left-1/2 -translate-x-1/2 rounded-full shadow-xl z-50">
          <span>{exportMessage}</span>
          <button onClick={() => setExportMessage(null)} className="ml-3">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
