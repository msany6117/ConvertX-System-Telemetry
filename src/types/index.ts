export type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'archive' | 'other';

export type JobStatus = 'uploading' | 'ready' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface UploadedFileItem {
  id: string; // client local uuid
  fileId?: string; // server generated id
  file?: File;
  originalName: string;
  size: number;
  extension: string;
  category: FileCategory;
  previewUrl?: string;
  supportedTargets: string[];
  targetFormat: string;
  options: Record<string, any>;
  status: JobStatus;
  progress: number;
  jobId?: string;
  outputFilename?: string;
  outputSize?: number;
  savedPercent?: number;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface ToolItem {
  id: string;
  name: string;
  category: FileCategory | 'compression' | 'utility';
  description: string;
  iconName: string;
  route: string;
  inputFormats: string[];
  outputFormats: string[];
  badge?: string;
  defaultTarget?: string;
}

export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark';
