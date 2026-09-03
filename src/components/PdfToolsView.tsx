import React, { useState, useRef } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import { saveHistoryRecord } from '../utils/historyStorage';

type PdfTab = 'merge' | 'split' | 'compress' | 'rotate';

export const PdfToolsView: React.FC<{ initialTab?: PdfTab }> = ({ initialTab = 'merge' }) => {
  const [activeTab, setActiveTab] = useState<PdfTab>(initialTab);

  // MERGE STATE
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeDownloadUrl, setMergeDownloadUrl] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // SPLIT STATE
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitRanges, setSplitRanges] = useState('1');
  const [splitAll, setSplitAll] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitDownloadUrl, setSplitDownloadUrl] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);

  // COMPRESS STATE
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<'balanced' | 'high' | 'low'>('balanced');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressDownloadUrl, setCompressDownloadUrl] = useState<string | null>(null);
  const [compressStats, setCompressStats] = useState<{ orig: number; comp: number } | null>(null);
  const [compressError, setCompressError] = useState<string | null>(null);
  const compressInputRef = useRef<HTMLInputElement>(null);

  // ROTATE STATE
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotateDeg, setRotateDeg] = useState<number>(90);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateDownloadUrl, setRotateDownloadUrl] = useState<string | null>(null);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const rotateInputRef = useRef<HTMLInputElement>(null);

  // MERGE HANDLERS
  const handleAddMergeFiles = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    setMergeFiles((prev) => [...prev, ...added]);
    setMergeDownloadUrl(null);
  };

  const moveMergeFile = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= mergeFiles.length) return;
    const copy = [...mergeFiles];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setMergeFiles(copy);
  };

  const handleMergeSubmit = async () => {
    if (mergeFiles.length < 2) {
      alert('Please upload at least 2 PDF files to merge.');
      return;
    }
    setIsMerging(true);
    setMergeError(null);

    // 1. Client-Side in-browser merge with pdf-lib (Zero-cost)
    try {
      const mergedPdf = await PDFDocument.create();
      let totalInputSize = 0;
      for (const file of mergeFiles) {
        totalInputSize += file.size;
        const arrayBuffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergeDownloadUrl(url);
      setIsMerging(false);

      saveHistoryRecord({
        id: `merge-${Date.now()}`,
        originalName: `${mergeFiles.length} PDF Documents`,
        outputFilename: 'merged_document.pdf',
        fromFormat: 'pdf',
        toFormat: 'pdf',
        originalSize: totalInputSize,
        outputSize: blob.size,
        savedBytes: Math.max(0, totalInputSize - blob.size),
        savedPercent: totalInputSize > blob.size ? Math.round(((totalInputSize - blob.size) / totalInputSize) * 100) : 0,
        timestamp: Date.now(),
        downloadUrl: url,
        mode: 'wasm',
        category: 'document',
      });
      return;
    } catch (clientErr) {
      console.warn('Client merge failed, falling back to server:', clientErr);
    }

    try {
      // 2. Server fallback
      const fd = new FormData();
      mergeFiles.forEach((f) => fd.append('files', f));

      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Failed to upload PDFs.');

      const primaryFile = upData.files[0];
      const additionalPaths = upData.files.slice(1).map((f: any) => f.fileId);

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: [
            {
              fileId: primaryFile.fileId,
              targetFormat: 'pdf',
              options: {
                action: 'merge',
                additionalInputPaths: additionalPaths.map((id: string) => `data/uploads/${id}`),
              },
            },
          ],
        }),
      });

      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error || 'Failed to trigger merge.');

      const jobId = jobData.jobs[0].jobId;
      pollJob(jobId, (url) => setMergeDownloadUrl(url), (err) => setMergeError(err), () => setIsMerging(false));
    } catch (e: any) {
      setMergeError(e.message || 'Error merging PDF.');
      setIsMerging(false);
    }
  };

  // SPLIT HANDLER (In-browser with pdf-lib / JSZip)
  const handleSplitSubmit = async () => {
    if (!splitFile) return;
    setIsSplitting(true);
    setSplitError(null);

    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const totalPages = doc.getPageCount();

      if (splitAll || totalPages > 1) {
        const zip = new JSZip();
        for (let i = 0; i < totalPages; i++) {
          const singleDoc = await PDFDocument.create();
          const [page] = await singleDoc.copyPages(doc, [i]);
          singleDoc.addPage(page);
          const bytes = await singleDoc.save();
          zip.file(`page_${i + 1}.pdf`, bytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        setSplitDownloadUrl(url);
        setIsSplitting(false);

        saveHistoryRecord({
          id: `split-${Date.now()}`,
          originalName: splitFile.name,
          outputFilename: `${splitFile.name.replace(/\.pdf$/i, '')}_split_pages.zip`,
          fromFormat: 'pdf',
          toFormat: 'zip',
          originalSize: splitFile.size,
          outputSize: zipBlob.size,
          savedBytes: 0,
          savedPercent: 0,
          timestamp: Date.now(),
          downloadUrl: url,
          mode: 'wasm',
          category: 'document',
        });
        return;
      }
    } catch (clientErr) {
      console.warn('Client split failed, falling back to server:', clientErr);
    }

    try {
      const fd = new FormData();
      fd.append('files', splitFile);

      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Failed to upload PDF.');

      const fileId = upData.files[0].fileId;

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: [
            {
              fileId,
              targetFormat: splitAll ? 'split' : 'pdf',
              options: {
                action: 'split',
                pageRanges: splitAll ? undefined : splitRanges,
              },
            },
          ],
        }),
      });

      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error || 'Failed to trigger split.');

      const jobId = jobData.jobs[0].jobId;
      pollJob(jobId, (url) => setSplitDownloadUrl(url), (err) => setSplitError(err), () => setIsSplitting(false));
    } catch (e: any) {
      setSplitError(e.message || 'Error splitting PDF.');
      setIsSplitting(false);
    }
  };

  // COMPRESS HANDLER (In-browser with pdf-lib)
  const handleCompressSubmit = async () => {
    if (!compressFile) return;
    setIsCompressing(true);
    setCompressError(null);

    try {
      const arrayBuffer = await compressFile.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const compressedBytes = await doc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setCompressDownloadUrl(url);
      setCompressStats({ orig: compressFile.size, comp: blob.size });
      setIsCompressing(false);

      const savedBytes = Math.max(0, compressFile.size - blob.size);
      const savedPercent = compressFile.size > blob.size ? Math.round((savedBytes / compressFile.size) * 100) : 0;

      saveHistoryRecord({
        id: `comp-${Date.now()}`,
        originalName: compressFile.name,
        outputFilename: `compressed_${compressFile.name}`,
        fromFormat: 'pdf',
        toFormat: 'pdf',
        originalSize: compressFile.size,
        outputSize: blob.size,
        savedBytes,
        savedPercent,
        timestamp: Date.now(),
        downloadUrl: url,
        mode: 'wasm',
        category: 'document',
      });
      return;
    } catch (clientErr) {
      console.warn('Client compress failed, falling back to server:', clientErr);
    }

    try {
      const fd = new FormData();
      fd.append('files', compressFile);

      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Failed to upload PDF.');

      const fileId = upData.files[0].fileId;

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: [
            {
              fileId,
              targetFormat: 'pdf',
              options: {
                action: 'compress',
                compressionLevel,
              },
            },
          ],
        }),
      });

      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error || 'Failed to trigger compression.');

      const jobId = jobData.jobs[0].jobId;
      pollJob(
        jobId,
        (url, outSize, inSize) => {
          setCompressDownloadUrl(url);
          if (inSize && outSize) setCompressStats({ orig: inSize, comp: outSize });
        },
        (err) => setCompressError(err),
        () => setIsCompressing(false)
      );
    } catch (e: any) {
      setCompressError(e.message || 'Error compressing PDF.');
      setIsCompressing(false);
    }
  };

  // ROTATE HANDLER (In-browser with pdf-lib)
  const handleRotateSubmit = async () => {
    if (!rotateFile) return;
    setIsRotating(true);
    setRotateError(null);

    try {
      const arrayBuffer = await rotateFile.arrayBuffer();
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = doc.getPages();
      pages.forEach((p) => {
        const curr = p.getRotation().angle;
        p.setRotation(degrees((curr + rotateDeg) % 360));
      });

      const rotatedBytes = await doc.save();
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setRotateDownloadUrl(url);
      setIsRotating(false);

      saveHistoryRecord({
        id: `rot-${Date.now()}`,
        originalName: rotateFile.name,
        outputFilename: `rotated_${rotateFile.name}`,
        fromFormat: 'pdf',
        toFormat: 'pdf',
        originalSize: rotateFile.size,
        outputSize: blob.size,
        savedBytes: 0,
        savedPercent: 0,
        timestamp: Date.now(),
        downloadUrl: url,
        mode: 'wasm',
        category: 'document',
      });
      return;
    } catch (clientErr) {
      console.warn('Client rotate failed, falling back to server:', clientErr);
    }

    try {
      const fd = new FormData();
      fd.append('files', rotateFile);

      const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error || 'Failed to upload PDF.');

      const fileId = upData.files[0].fileId;

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: [
            {
              fileId,
              targetFormat: 'pdf',
              options: {
                action: 'rotate',
                rotationDegrees: rotateDeg,
              },
            },
          ],
        }),
      });

      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error || 'Failed to trigger rotate.');

      const jobId = jobData.jobs[0].jobId;
      pollJob(jobId, (url) => setRotateDownloadUrl(url), (err) => setRotateError(err), () => setIsRotating(false));
    } catch (e: any) {
      setRotateError(e.message || 'Error rotating PDF.');
      setIsRotating(false);
    }
  };

  // Helper polling function
  function pollJob(
    jobId: string,
    onSuccess: (downloadUrl: string, outSize?: number, inSize?: number) => void,
    onError: (err: string) => void,
    onFinish: () => void
  ) {
    const intv = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          clearInterval(intv);
          onError('Job status lookup failed.');
          onFinish();
          return;
        }
        const data = await res.json();
        if (data.status === 'COMPLETED') {
          clearInterval(intv);
          onSuccess(data.downloadUrl, data.outputSize, data.inputSize);
          onFinish();
        } else if (data.status === 'FAILED') {
          clearInterval(intv);
          onError(data.errorMessage || 'Operation failed.');
          onFinish();
        }
      } catch (e: any) {
        clearInterval(intv);
        onError(e.message || 'Network error.');
        onFinish();
      }
    }, 1000);
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* PDF Sub-Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('merge')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'merge'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Merge PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('split')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'split'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Scissors className="h-4 w-4" />
          <span>Split PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('compress')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'compress'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Minimize2 className="h-4 w-4" />
          <span>Compress PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('rotate')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'rotate'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCw className="h-4 w-4" />
          <span>Rotate PDF</span>
        </button>
      </div>

      {/* 1. MERGE PDF VIEW */}
      {activeTab === 'merge' && (
        <div className="mt-6 space-y-6">
          <input
            ref={mergeInputRef}
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e) => handleAddMergeFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Merge Multiple PDF Files</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag and reorder files in the exact sequence you want them combined.
              </p>
            </div>
            <button
              onClick={() => mergeInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400"
            >
              <Plus className="h-4 w-4" />
              <span>Add PDFs</span>
            </button>
          </div>

          {mergeFiles.length === 0 ? (
            <div
              onClick={() => mergeInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center hover:border-blue-500 cursor-pointer"
            >
              <FileText className="h-10 w-10 text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Select PDF files to merge</p>
              <p className="text-xs text-slate-400 mt-1">Select 2 or more files from your device</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mergeFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </span>
                    <span className="text-[11px] text-slate-400">({formatBytes(file.size)})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveMergeFile(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveMergeFile(idx, 1)}
                      disabled={idx === mergeFiles.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setMergeFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600 ml-2"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mergeError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mergeError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 gap-3">
            <button
              onClick={handleMergeSubmit}
              disabled={mergeFiles.length < 2 || isMerging}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-500/20"
            >
              {isMerging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              <span>Merge {mergeFiles.length} PDFs</span>
            </button>

            {mergeDownloadUrl && (
              <a
                href={mergeDownloadUrl}
                download="merged_document.pdf"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                <Download className="h-4 w-4" />
                <span>Download Merged PDF</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 2. SPLIT PDF VIEW */}
      {activeTab === 'split' && (
        <div className="mt-6 space-y-6">
          <input
            ref={splitInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setSplitFile(e.target.files[0]);
                setSplitDownloadUrl(null);
              }
            }}
            className="hidden"
          />

          {!splitFile ? (
            <div
              onClick={() => splitInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center hover:border-blue-500 cursor-pointer"
            >
              <Scissors className="h-10 w-10 text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Choose a PDF file to split</p>
              <p className="text-xs text-slate-400 mt-1">Extract specific pages or separate each page</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <span className="font-semibold text-xs text-slate-800 dark:text-white truncate max-w-sm">
                  {splitFile.name} ({formatBytes(splitFile.size)})
                </span>
                <button
                  onClick={() => splitInputRef.current?.click()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change file
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="split-all"
                    checked={splitAll}
                    onChange={(e) => setSplitAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="split-all" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Split all pages into separate PDFs (downloaded as ZIP archive)
                  </label>
                </div>

                {!splitAll && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Extract Custom Page Range
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1, 3, 5-8"
                      value={splitRanges}
                      onChange={(e) => setSplitRanges(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Comma-separated pages or hyphens for ranges (e.g., "1-3, 5, 8-10").
                    </p>
                  </div>
                )}
              </div>

              {splitError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{splitError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 gap-3">
                <button
                  onClick={handleSplitSubmit}
                  disabled={isSplitting}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSplitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                  <span>Execute Split</span>
                </button>

                {splitDownloadUrl && (
                  <a
                    href={splitDownloadUrl}
                    download={splitAll ? 'split_pages.zip' : 'extracted_pages.pdf'}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Output {splitAll ? '(ZIP)' : '(PDF)'}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. COMPRESS PDF VIEW */}
      {activeTab === 'compress' && (
        <div className="mt-6 space-y-6">
          <input
            ref={compressInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setCompressFile(e.target.files[0]);
                setCompressDownloadUrl(null);
              }
            }}
            className="hidden"
          />

          {!compressFile ? (
            <div
              onClick={() => compressInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center hover:border-blue-500 cursor-pointer"
            >
              <Minimize2 className="h-10 w-10 text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Choose a PDF file to compress</p>
              <p className="text-xs text-slate-400 mt-1">Shrinks file size for email, web, and storage</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <span className="font-semibold text-xs text-slate-800 dark:text-white truncate max-w-sm">
                  {compressFile.name} ({formatBytes(compressFile.size)})
                </span>
                <button
                  onClick={() => compressInputRef.current?.click()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change file
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Compression Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'balanced', title: 'Balanced', desc: '150 DPI. Best balance of quality & file size' },
                    { id: 'high', title: 'Max Compression', desc: '72 DPI. Smallest possible file size' },
                    { id: 'low', title: 'High Quality', desc: '300 DPI. Crisp print & document fidelity' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setCompressionLevel(lvl.id as any)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        compressionLevel === lvl.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs">{lvl.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {compressStats && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Compressed successfully!
                  </span>
                  <span>
                    {formatBytes(compressStats.orig)} → {formatBytes(compressStats.comp)} (
                    {Math.round(((compressStats.orig - compressStats.comp) / compressStats.orig) * 100)}% saved)
                  </span>
                </div>
              )}

              {compressError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{compressError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 gap-3">
                <button
                  onClick={handleCompressSubmit}
                  disabled={isCompressing}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCompressing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minimize2 className="h-4 w-4" />}
                  <span>Compress PDF</span>
                </button>

                {compressDownloadUrl && (
                  <a
                    href={compressDownloadUrl}
                    download="compressed_document.pdf"
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Compressed PDF</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. ROTATE PDF VIEW */}
      {activeTab === 'rotate' && (
        <div className="mt-6 space-y-6">
          <input
            ref={rotateInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setRotateFile(e.target.files[0]);
                setRotateDownloadUrl(null);
              }
            }}
            className="hidden"
          />

          {!rotateFile ? (
            <div
              onClick={() => rotateInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-10 text-center hover:border-blue-500 cursor-pointer"
            >
              <RotateCw className="h-10 w-10 text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Choose a PDF file to rotate</p>
              <p className="text-xs text-slate-400 mt-1">Permanently rotate sideways or inverted pages</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <span className="font-semibold text-xs text-slate-800 dark:text-white truncate max-w-sm">
                  {rotateFile.name} ({formatBytes(rotateFile.size)})
                </span>
                <button
                  onClick={() => rotateInputRef.current?.click()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change file
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Rotation Angle
                </label>
                <div className="flex gap-2">
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setRotateDeg(deg)}
                      className={`rounded-xl border px-4 py-2 text-xs font-semibold ${
                        rotateDeg === deg
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {deg}° Clockwise
                    </button>
                  ))}
                </div>
              </div>

              {rotateError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{rotateError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800 gap-3">
                <button
                  onClick={handleRotateSubmit}
                  disabled={isRotating}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isRotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                  <span>Rotate PDF</span>
                </button>

                {rotateDownloadUrl && (
                  <a
                    href={rotateDownloadUrl}
                    download="rotated_document.pdf"
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Rotated PDF</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
