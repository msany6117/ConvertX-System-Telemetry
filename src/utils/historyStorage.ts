import { FileCategory } from '../types';

export interface ConversionHistoryRecord {
  id: string;
  originalName: string;
  outputFilename: string;
  fromFormat: string;
  toFormat: string;
  originalSize: number;
  outputSize: number;
  savedBytes: number;
  savedPercent: number;
  timestamp: number;
  downloadUrl?: string;
  mode: 'wasm' | 'server';
  category: FileCategory;
}

export interface StatsSummary {
  totalFiles: number;
  totalInputBytes: number;
  totalOutputBytes: number;
  totalSavedBytes: number;
  averageSavingsPercent: number;
  wasmCount: number;
  serverCount: number;
}

const STORAGE_KEY = 'convertx_conversion_history_v1';
const HISTORY_CHANGE_EVENT = 'convertx_history_changed';

export function getHistory(): ConversionHistoryRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.warn('Failed to load conversion history from localStorage:', e);
    return [];
  }
}

export function saveHistoryRecord(record: ConversionHistoryRecord): void {
  try {
    const current = getHistory();
    // Prepend new record, keep up to 50 most recent records
    const updated = [record, ...current.filter((item) => item.id !== record.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT, { detail: record }));
  } catch (e) {
    console.warn('Failed to save history record:', e);
  }
}

export function removeHistoryRecord(id: string): void {
  try {
    const current = getHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT));
  } catch (e) {
    console.warn('Failed to remove history record:', e);
  }
}

export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(HISTORY_CHANGE_EVENT));
  } catch (e) {
    console.warn('Failed to clear history:', e);
  }
}

export function calculateStats(records: ConversionHistoryRecord[]): StatsSummary {
  const totalFiles = records.length;
  if (totalFiles === 0) {
    return {
      totalFiles: 0,
      totalInputBytes: 0,
      totalOutputBytes: 0,
      totalSavedBytes: 0,
      averageSavingsPercent: 0,
      wasmCount: 0,
      serverCount: 0,
    };
  }

  let totalInputBytes = 0;
  let totalOutputBytes = 0;
  let totalSavedBytes = 0;
  let wasmCount = 0;
  let serverCount = 0;

  for (const r of records) {
    totalInputBytes += r.originalSize || 0;
    totalOutputBytes += r.outputSize || 0;
    if (r.originalSize > r.outputSize) {
      totalSavedBytes += (r.originalSize - r.outputSize);
    }
    if (r.mode === 'wasm') wasmCount++;
    else serverCount++;
  }

  const averageSavingsPercent =
    totalInputBytes > 0 && totalSavedBytes > 0
      ? Math.round((totalSavedBytes / totalInputBytes) * 100)
      : 0;

  return {
    totalFiles,
    totalInputBytes,
    totalOutputBytes,
    totalSavedBytes,
    averageSavingsPercent,
    wasmCount,
    serverCount,
  };
}

export function onHistoryChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(HISTORY_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(HISTORY_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
