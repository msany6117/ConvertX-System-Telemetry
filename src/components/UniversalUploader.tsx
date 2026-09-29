import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  File as FileIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Settings,
  ArrowRight,
  Link as LinkIcon,
  RefreshCw,
  Plus,
  Sparkles,
  ChevronDown,
  X,
  Clipboard,
  Shield,
  Layers,
} from 'lucide-react';
import { UploadedFileItem, Language } from '../types';
import { getTranslation } from '../locales';
import { ConversionSettingsModal } from './ConversionSettingsModal';
import { CloudImportModal, CloudSource } from './CloudImportModal';
import { canConvertClientSide, convertClientSide } from '../utils/clientEngine';
import { saveHistoryRecord } from '../utils/historyStorage';
import JSZip from 'jszip';

interface UniversalUploaderProps {
  language: Language;
  presetTargetFormat?: string;
  presetCategory?: string;
  onFilesChanged?: (count: number) => void;
}

export const UniversalUploader: React.FC<UniversalUploaderProps> = ({
  language,
  presetTargetFormat,
  presetCategory,
  onFilesChanged,
}) => {
  const t = getTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [cloudSource, setCloudSource] = useState<CloudSource>('gdrive');
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [activeSettingsItem, setActiveSettingsItem] = useState<UploadedFileItem | null>(null);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [batchTarget, setBatchTarget] = useState<string>('');
  const [registry, setRegistry] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openSelectorId, setOpenSelectorId] = useState<string | null>(null);

  useEffect(() => {
    if (onFilesChanged) onFilesChanged(items.length);
  }, [items, onFilesChanged]);

  // Fetch registry formats on mount
  useEffect(() => {
    fetch('/api/registry')
      .then((res) => {
        if (!res.ok) throw new Error('Registry unavailable');
        return res.json();
      })
      .then((data) => {
        if (data.formats) setRegistry(data.formats);
      })
      .catch((e) => {
        console.log('Running in zero-backend / client mode:', e.message || e);
      });
  }, []);

  // Format bytes helper
  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Detect category & supported targets
  const getFormatDetails = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const reg = registry[ext];

    const defaultTargetsMap: Record<string, string[]> = {
      jpg: ['webp', 'png', 'avif', 'pdf'],
      jpeg: ['webp', 'png', 'avif', 'pdf'],
      png: ['webp', 'jpg', 'avif', 'pdf'],
      webp: ['jpg', 'png', 'avif', 'pdf'],
      mp4: ['mp3', 'gif', 'webm', 'mov', 'wav'],
      mov: ['mp4', 'mp3', 'gif', 'webm'],
      webm: ['mp4', 'mp3', 'gif'],
      pdf: ['jpg', 'png', 'split', 'compress'],
      docx: ['pdf', 'txt', 'html'],
      xlsx: ['csv', 'pdf'],
      csv: ['xlsx', 'json'],
      mp3: ['wav', 'aac', 'flac', 'ogg'],
      wav: ['mp3', 'flac', 'ogg'],
      heic: ['jpg', 'png', 'webp', 'pdf'],
      heif: ['jpg', 'png', 'webp', 'pdf'],
    };

    let targets = reg?.targetFormats || defaultTargetsMap[ext] || ['pdf', 'jpg', 'png', 'webp'];
    if (presetTargetFormat) {
      targets = [presetTargetFormat, ...targets.filter((t) => t !== presetTargetFormat)];
    }

    return {
      ext,
      category: reg?.category || presetCategory || 'other',
      supportedTargets: targets,
      defaultTarget: targets[0] || 'pdf',
    };
  };

  // Add files to state
  const handleAddFiles = (fileList: FileList | File[]) => {
    const newItems: UploadedFileItem[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      if (items.length + newItems.length >= 10) {
        setToastMessage('Maximum 10 files can be converted simultaneously.');
        break;
      }
      if (file.size > 500 * 1024 * 1024) {
        setToastMessage(`File "${file.name}" exceeds the 500 MB limit.`);
        continue;
      }

      const { ext, category, supportedTargets, defaultTarget } = getFormatDetails(file.name);
      let previewUrl: string | undefined;

      if (category === 'image' && file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        originalName: file.name,
        size: file.size,
        extension: ext,
        category: category as any,
        supportedTargets,
        targetFormat: defaultTarget,
        options: {},
        status: 'ready',
        progress: 0,
        previewUrl,
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      if (newItems.length > 0 && !batchTarget) {
        setBatchTarget(newItems[0].targetFormat);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Clipboard paste handler
  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/') || type === 'application/pdf') {
            const blob = await item.getType(type);
            const ext = type.split('/')[1] || 'bin';
            const file = new File([blob], `pasted_file_${Date.now()}.${ext}`, { type });
            handleAddFiles([file]);
            return;
          }
        }
      }
      setToastMessage('No supported image or document found in clipboard.');
    } catch {
      setToastMessage('Clipboard access was blocked or is not supported.');
    }
  };

  // URL Import
  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    try {
      const res = await fetch('/api/upload/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to download from URL.');

      const fileInfo = data.file;
      setItems((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          fileId: fileInfo.fileId,
          originalName: fileInfo.originalName,
          size: fileInfo.size,
          extension: fileInfo.extension,
          category: fileInfo.category,
          supportedTargets: fileInfo.supportedTargets,
          targetFormat: fileInfo.defaultTarget,
          options: {},
          status: 'ready',
          progress: 0,
        },
      ]);
      setUrlInput('');
      setIsUrlModalOpen(false);
    } catch (err: any) {
      setToastMessage(err.message || 'Error importing URL');
    } finally {
      setUrlLoading(false);
    }
  };

  // Remove single item
  const removeItem = (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Convert single item
  const convertItem = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const isClientCapable = !!item.file && canConvertClientSide(item.extension, item.targetFormat);

    // 1. Client-Side WASM / Canvas conversion
    if (isClientCapable && item.file) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: 'processing', progress: 20, engineMode: 'wasm' } : i
        )
      );

      try {
        const result = await convertClientSide(
          item.file,
          item.targetFormat,
          item.options,
          (prog) => {
            setItems((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, progress: prog } : i))
            );
          }
        );

        const downloadUrl = URL.createObjectURL(result.blob);
        const outputSize = result.outputSize;
        const savedPercent =
          item.size > outputSize ? Math.round(((item.size - outputSize) / item.size) * 100) : 0;

        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  status: 'completed',
                  progress: 100,
                  outputFilename: result.outputFilename,
                  outputSize,
                  savedPercent,
                  downloadUrl,
                  outputBlob: result.blob,
                  engineMode: 'wasm',
                }
              : i
          )
        );

        saveHistoryRecord({
          id: item.id,
          originalName: item.originalName,
          outputFilename: result.outputFilename,
          fromFormat: item.extension,
          toFormat: item.targetFormat,
          originalSize: item.size,
          outputSize,
          savedBytes: Math.max(0, item.size - outputSize),
          savedPercent,
          timestamp: Date.now(),
          downloadUrl,
          mode: 'wasm',
          category: item.category,
        });
        return;
      } catch (wasmErr) {
        console.warn('WASM client conversion issue, using server fallback:', wasmErr);
      }
    }

    // 2. Server Fallback conversion
    let currentFileId = item.fileId;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, status: 'uploading', progress: 20, engineMode: 'server' } : i
      )
    );

    try {
      if (!currentFileId && item.file) {
        const formData = new FormData();
        formData.append('files', item.file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed.');
        currentFileId = uploadData.files[0].fileId;
      }

      if (!currentFileId) throw new Error('No uploaded file reference found.');

      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, fileId: currentFileId, status: 'queued', progress: 40 } : i
        )
      );

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: [
            {
              fileId: currentFileId,
              targetFormat: item.targetFormat,
              options: item.options,
            },
          ],
        }),
      });

      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error || 'Failed to initialize conversion job.');

      const jobId = jobData.jobs[0].jobId;
      pollJobStatus(itemId, jobId, item);
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: 'failed',
                errorMessage: err.message || "We couldn't process this file.",
              }
            : i
        )
      );
    }
  };

  // Poll server job with resilient retry
  const pollJobStatus = (itemId: string, jobId: string, originalItem: UploadedFileItem) => {
    let consecutiveErrors = 0;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors > 5) {
            clearInterval(interval);
            setItems((prev) =>
              prev.map((i) =>
                i.id === itemId
                  ? { ...i, status: 'failed', errorMessage: 'Job timed out or expired.' }
                  : i
              )
            );
          }
          return;
        }

        consecutiveErrors = 0;
        const data = await res.json();
        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          const outSize = data.outputSize || originalItem.size;
          const savedPct = data.savedPercent || 0;
          const outName = data.outputFilename || `${originalItem.originalName}.${originalItem.targetFormat}`;

          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    status: 'completed',
                    progress: 100,
                    outputFilename: outName,
                    outputSize: outSize,
                    savedPercent: savedPct,
                    downloadUrl: data.downloadUrl,
                    engineMode: 'server',
                  }
                : i
            )
          );

          saveHistoryRecord({
            id: originalItem.id,
            originalName: originalItem.originalName,
            outputFilename: outName,
            fromFormat: originalItem.extension,
            toFormat: originalItem.targetFormat,
            originalSize: originalItem.size,
            outputSize: outSize,
            savedBytes: Math.max(0, originalItem.size - outSize),
            savedPercent: savedPct,
            timestamp: Date.now(),
            downloadUrl: data.downloadUrl,
            mode: 'server',
            category: originalItem.category,
          });
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    status: 'failed',
                    errorMessage: data.errorMessage || "We couldn't process this file.",
                  }
                : i
            )
          );
        } else {
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, status: 'processing', progress: data.progress || 50 } : i
            )
          );
        }
      } catch {
        consecutiveErrors++;
        if (consecutiveErrors > 5) {
          clearInterval(interval);
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? { ...i, status: 'failed', errorMessage: 'Connection lost. Please retry.' }
                : i
            )
          );
        }
      }
    }, 1000);
  };

  // Convert all items
  const handleConvertAll = async () => {
    setIsConvertingAll(true);
    const readyItems = items.filter((i) => i.status === 'ready' || i.status === 'failed');
    for (const item of readyItems) {
      await convertItem(item.id);
    }
    setIsConvertingAll(false);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const completedItems = items.filter((i) => i.status === 'completed');
    if (completedItems.length === 0) return;

    try {
      const zip = new JSZip();
      for (const item of completedItems) {
        if (item.outputBlob) {
          zip.file(item.outputFilename || 'converted_file', item.outputBlob);
        } else if (item.downloadUrl) {
          const resp = await fetch(item.downloadUrl);
          const blob = await resp.blob();
          zip.file(item.outputFilename || 'converted_file', blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ConvertX_Export.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to download ZIP.');
    }
  };

  // Determine current workflow step
  const getWorkflowStep = () => {
    if (items.length === 0) return 1; // UPLOAD
    if (items.some((i) => i.status === 'processing' || i.status === 'uploading' || i.status === 'queued')) return 3; // CONVERT
    if (items.every((i) => i.status === 'completed')) return 4; // DOWNLOAD
    return 2; // CONFIGURE
  };

  const currentStep = getWorkflowStep();
  const hasCompletedItems = items.some((i) => i.status === 'completed');
  const hasReadyItems = items.some((i) => i.status === 'ready');

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 shadow-xs dark:border-amber-800/60 dark:bg-amber-950/70 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="rounded-lg p-1 text-amber-700 hover:bg-amber-200/50 dark:text-amber-300 dark:hover:bg-amber-900/50 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* WORKFLOW STEP INDICATOR */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
        <span className={currentStep >= 1 ? 'text-slate-900 dark:text-white font-bold' : ''}>
          01. Upload
        </span>
        <span className="text-slate-300 dark:text-slate-700">→</span>
        <span className={currentStep >= 2 ? 'text-slate-900 dark:text-white font-bold' : ''}>
          02. Configure
        </span>
        <span className="text-slate-300 dark:text-slate-700">→</span>
        <span className={currentStep >= 3 ? 'text-slate-900 dark:text-white font-bold' : ''}>
          03. Convert
        </span>
        <span className="text-slate-300 dark:text-slate-700">→</span>
        <span className={currentStep >= 4 ? 'text-slate-900 dark:text-white font-bold' : ''}>
          04. Download
        </span>
      </div>

      {/* MAIN UPLOAD / FILE PROCESSING CONTAINER */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition-all">
        {items.length === 0 ? (
          /* EMPTY STATE / HERO DROPZONE */
          <div
            id="main-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800/80 scale-[1.01]'
                : 'border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/50 dark:border-slate-700/80 dark:hover:border-slate-600 dark:hover:bg-slate-800/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Upload Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 mb-4 transition-transform group-hover:scale-105">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isDragging ? t.uploader.dropToUpload : t.uploader.dropYourFiles}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t.uploader.orChooseDevice}
            </p>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-6 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {t.uploader.chooseFiles}
            </button>

            {/* Secondary Options */}
            <div
              className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Clipboard className="h-3.5 w-3.5" />
                <span>{t.actions.paste}</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(true)}
                className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>{t.actions.fromUrl}</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={() => {
                  setCloudSource('gdrive');
                  setIsCloudModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{t.actions.cloudDrive}</span>
              </button>
            </div>

            {/* Subtly Supported Formats */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
              Images • PDF • Video • Audio • Documents
            </div>
          </div>
        ) : (
          /* FILE PROCESSING INTERFACE */
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {items.length} {items.length === 1 ? 'file ready' : 'files ready'}
                </span>
                <p className="text-xs text-slate-400">Configure target format below and convert.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.actions.addMore}</span>
                </button>

                <button
                  onClick={() => setItems([])}
                  className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t.actions.clearAll}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* File List Cards */}
            <div className="space-y-3">
              {items.map((item) => {
                const isSelectorOpen = openSelectorId === item.id;

                return (
                  <div
                    key={item.id}
                    className="relative rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950/70 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* File Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <FileIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.originalName}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{formatBytes(item.size)}</span>
                            <span>·</span>
                            <span className="uppercase font-mono font-medium">{item.extension}</span>
                            {item.engineMode === 'wasm' && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-600 dark:text-emerald-400">Client WASM</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SMART CONVERSION SELECTOR (JPG -> PNG) */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-mono font-bold text-slate-500">
                            {item.extension}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700 text-sm">→</span>

                          {/* Output Format Selector Pill */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenSelectorId(isSelectorOpen ? null : item.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-900 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <span>{item.targetFormat}</span>
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            </button>

                            {/* Dropdown Menu */}
                            {isSelectorOpen && (
                              <div className="absolute right-0 top-full mt-1.5 z-30 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900 animate-in fade-in">
                                {item.supportedTargets.map((target) => (
                                  <button
                                    key={target}
                                    type="button"
                                    onClick={() => {
                                      setItems((prev) =>
                                        prev.map((i) =>
                                          i.id === item.id ? { ...i, targetFormat: target } : i
                                        )
                                      );
                                      setOpenSelectorId(null);
                                    }}
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold uppercase transition-colors ${
                                      item.targetFormat === target
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {target}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Settings Button */}
                        <button
                          type="button"
                          onClick={() => setActiveSettingsItem(item)}
                          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Conversion settings"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>

                        {/* Individual Convert / Download Button */}
                        {item.status === 'completed' ? (
                          <a
                            href={item.downloadUrl}
                            download={item.outputFilename || `converted.${item.targetFormat}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </a>
                        ) : item.status === 'processing' || item.status === 'uploading' ? (
                          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>{item.progress}%</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => convertItem(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                          >
                            <span>Convert</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Remove item button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar during conversion */}
                    {(item.status === 'processing' || item.status === 'uploading') && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                          <span>Processing your file...</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full bg-slate-900 dark:bg-white transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Completion Message */}
                    {item.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-semibold">Your file is ready.</span>
                          {item.savedPercent && item.savedPercent > 0 ? (
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold dark:bg-emerald-950/60">
                              -{item.savedPercent}% saved
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatBytes(item.outputSize || item.size)}
                        </span>
                      </div>
                    )}

                    {/* Error State */}
                    {item.status === 'failed' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          <span>{item.errorMessage || "We couldn't process this file."}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => convertItem(item.id)}
                          className="font-semibold underline hover:no-underline cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-400">
                100% private • Files automatically purged after 1 hour
              </div>

              <div className="flex items-center gap-3">
                {hasCompletedItems && (
                  <button
                    onClick={handleDownloadAllZip}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t.actions.downloadZip}</span>
                  </button>
                )}

                {hasReadyItems && (
                  <button
                    onClick={handleConvertAll}
                    disabled={isConvertingAll}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {isConvertingAll ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>{t.actions.processing}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.actions.convertAll}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* URL Import Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setIsUrlModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-10">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Import from URL</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter a direct public link to any image, audio, video, or document.
            </p>
            <input
              type="url"
              placeholder="https://example.com/file.mp4"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white mb-4 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={urlLoading || !urlInput.trim()}
                onClick={handleUrlImport}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900"
              >
                {urlLoading ? 'Downloading...' : 'Import File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {activeSettingsItem && (
        <ConversionSettingsModal
          item={activeSettingsItem}
          isOpen={true}
          onClose={() => setActiveSettingsItem(null)}
          onSave={(options) => {
            setItems((prev) =>
              prev.map((i) => (i.id === activeSettingsItem.id ? { ...i, options } : i))
            );
            setActiveSettingsItem(null);
          }}
        />
      )}

      {/* Cloud Import Modal */}
      <CloudImportModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        initialSource={cloudSource}
        onFileImported={(file) => {
          handleAddFiles([file]);
          setIsCloudModalOpen(false);
        }}
      />
    </div>
  );
};
