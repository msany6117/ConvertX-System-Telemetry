export type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'archive' | 'other';

export interface FormatInfo {
  format: string;
  category: FileCategory;
  mime: string;
  label: string;
  targetFormats: string[];
  options: {
    canQuality?: boolean;
    canResize?: boolean;
    canRotate?: boolean;
    canTrim?: boolean;
    canMute?: boolean;
    canFps?: boolean;
    canBitrate?: boolean;
    canPassword?: boolean;
    canSplit?: boolean;
    canMerge?: boolean;
  };
}

export const CONVERSION_REGISTRY: Record<string, FormatInfo> = {
  // IMAGES
  jpg: {
    format: 'jpg',
    category: 'image',
    mime: 'image/jpeg',
    label: 'JPEG Image',
    targetFormats: ['png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'ico', 'pdf'],
    options: { canQuality: true, canResize: true, canRotate: true }
  },
  jpeg: {
    format: 'jpeg',
    category: 'image',
    mime: 'image/jpeg',
    label: 'JPEG Image',
    targetFormats: ['png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'ico', 'pdf'],
    options: { canQuality: true, canResize: true, canRotate: true }
  },
  png: {
    format: 'png',
    category: 'image',
    mime: 'image/png',
    label: 'PNG Image',
    targetFormats: ['jpg', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'ico', 'pdf'],
    options: { canQuality: true, canResize: true, canRotate: true }
  },
  webp: {
    format: 'webp',
    category: 'image',
    mime: 'image/webp',
    label: 'WebP Image',
    targetFormats: ['jpg', 'png', 'avif', 'gif', 'bmp', 'tiff', 'pdf'],
    options: { canQuality: true, canResize: true, canRotate: true }
  },
  avif: {
    format: 'avif',
    category: 'image',
    mime: 'image/avif',
    label: 'AVIF Image',
    targetFormats: ['jpg', 'png', 'webp', 'pdf'],
    options: { canQuality: true, canResize: true, canRotate: true }
  },
  gif: {
    format: 'gif',
    category: 'image',
    mime: 'image/gif',
    label: 'GIF Animation / Image',
    targetFormats: ['mp4', 'webm', 'png', 'jpg', 'webp'],
    options: { canQuality: true, canResize: true, canFps: true }
  },
  bmp: {
    format: 'bmp',
    category: 'image',
    mime: 'image/bmp',
    label: 'Bitmap Image',
    targetFormats: ['jpg', 'png', 'webp', 'pdf'],
    options: { canQuality: true, canResize: true }
  },
  tiff: {
    format: 'tiff',
    category: 'image',
    mime: 'image/tiff',
    label: 'TIFF Image',
    targetFormats: ['jpg', 'png', 'webp', 'pdf'],
    options: { canQuality: true, canResize: true }
  },
  svg: {
    format: 'svg',
    category: 'image',
    mime: 'image/svg+xml',
    label: 'SVG Vector Graphic',
    targetFormats: ['png', 'jpg', 'webp', 'pdf'],
    options: { canResize: true }
  },

  // VIDEOS
  mp4: {
    format: 'mp4',
    category: 'video',
    mime: 'video/mp4',
    label: 'MP4 Video',
    targetFormats: ['webm', 'mkv', 'avi', 'mov', 'gif', 'mp3', 'wav', 'aac', 'flac'],
    options: { canTrim: true, canResize: true, canFps: true, canBitrate: true, canMute: true, canRotate: true }
  },
  mov: {
    format: 'mov',
    category: 'video',
    mime: 'video/quicktime',
    label: 'QuickTime MOV',
    targetFormats: ['mp4', 'webm', 'mkv', 'avi', 'gif', 'mp3', 'wav', 'aac'],
    options: { canTrim: true, canResize: true, canFps: true, canBitrate: true, canMute: true }
  },
  webm: {
    format: 'webm',
    category: 'video',
    mime: 'video/webm',
    label: 'WebM Video',
    targetFormats: ['mp4', 'mkv', 'avi', 'mov', 'gif', 'mp3', 'wav'],
    options: { canTrim: true, canResize: true, canFps: true, canBitrate: true, canMute: true }
  },
  mkv: {
    format: 'mkv',
    category: 'video',
    mime: 'video/x-matroska',
    label: 'Matroska MKV',
    targetFormats: ['mp4', 'webm', 'avi', 'mov', 'gif', 'mp3', 'wav'],
    options: { canTrim: true, canResize: true, canFps: true, canBitrate: true, canMute: true }
  },
  avi: {
    format: 'avi',
    category: 'video',
    mime: 'video/x-msvideo',
    label: 'AVI Video',
    targetFormats: ['mp4', 'webm', 'mkv', 'mov', 'gif', 'mp3', 'wav'],
    options: { canTrim: true, canResize: true, canFps: true, canBitrate: true, canMute: true }
  },

  // AUDIOS
  mp3: {
    format: 'mp3',
    category: 'audio',
    mime: 'audio/mpeg',
    label: 'MP3 Audio',
    targetFormats: ['wav', 'aac', 'flac', 'ogg', 'm4a'],
    options: { canTrim: true, canBitrate: true }
  },
  wav: {
    format: 'wav',
    category: 'audio',
    mime: 'audio/wav',
    label: 'WAV Audio',
    targetFormats: ['mp3', 'aac', 'flac', 'ogg', 'm4a'],
    options: { canTrim: true, canBitrate: true }
  },
  aac: {
    format: 'aac',
    category: 'audio',
    mime: 'audio/aac',
    label: 'AAC Audio',
    targetFormats: ['mp3', 'wav', 'flac', 'ogg', 'm4a'],
    options: { canTrim: true, canBitrate: true }
  },
  flac: {
    format: 'flac',
    category: 'audio',
    mime: 'audio/flac',
    label: 'FLAC Lossless Audio',
    targetFormats: ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
    options: { canTrim: true, canBitrate: true }
  },
  ogg: {
    format: 'ogg',
    category: 'audio',
    mime: 'audio/ogg',
    label: 'OGG Audio',
    targetFormats: ['mp3', 'wav', 'aac', 'flac', 'm4a'],
    options: { canTrim: true, canBitrate: true }
  },
  m4a: {
    format: 'm4a',
    category: 'audio',
    mime: 'audio/mp4',
    label: 'M4A Audio',
    targetFormats: ['mp3', 'wav', 'aac', 'flac', 'ogg'],
    options: { canTrim: true, canBitrate: true }
  },

  // PDF
  pdf: {
    format: 'pdf',
    category: 'pdf',
    mime: 'application/pdf',
    label: 'PDF Document',
    targetFormats: ['jpg', 'png', 'webp', 'txt', 'compress', 'split', 'rotate', 'protect', 'unlock'],
    options: { canPassword: true, canSplit: true, canMerge: true, canRotate: true }
  },

  // DOCUMENTS
  docx: {
    format: 'docx',
    category: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'Microsoft Word Document',
    targetFormats: ['txt', 'html', 'pdf'],
    options: {}
  },
  txt: {
    format: 'txt',
    category: 'document',
    mime: 'text/plain',
    label: 'Text Document',
    targetFormats: ['pdf', 'html'],
    options: {}
  },
  html: {
    format: 'html',
    category: 'document',
    mime: 'text/html',
    label: 'HTML Document',
    targetFormats: ['txt', 'pdf'],
    options: {}
  },
  csv: {
    format: 'csv',
    category: 'document',
    mime: 'text/csv',
    label: 'CSV Spreadsheet',
    targetFormats: ['xlsx', 'txt', 'html'],
    options: {}
  },
  xlsx: {
    format: 'xlsx',
    category: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    label: 'Excel Spreadsheet',
    targetFormats: ['csv', 'html', 'txt'],
    options: {}
  },

  // ARCHIVES
  zip: {
    format: 'zip',
    category: 'archive',
    mime: 'application/zip',
    label: 'ZIP Archive',
    targetFormats: ['tar'],
    options: {}
  },
  tar: {
    format: 'tar',
    category: 'archive',
    mime: 'application/x-tar',
    label: 'TAR Archive',
    targetFormats: ['zip'],
    options: {}
  }
};

/**
 * Detect extension and category from filename
 */
export function getFormatFromFilename(filename: string): FormatInfo | null {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return CONVERSION_REGISTRY[ext] || null;
}
