import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';
import { generateUniqueId } from './security';
import { CONVERSION_REGISTRY } from './registry';
import { processImage } from './processors/imageProcessor';
import { processVideo } from './processors/videoProcessor';
import { processAudio } from './processors/audioProcessor';
import { processPDF } from './processors/pdfProcessor';
import { processDocument } from './processors/documentProcessor';

export type JobState = 'QUEUED' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface ConversionJob {
  id: string;
  originalFilename: string;
  inputPath: string;
  outputPath?: string;
  outputFilename?: string;
  fileCategory: string;
  inputSize: number;
  outputSize?: number;
  savedPercent?: number;
  targetFormat: string;
  options: Record<string, any>;
  status: JobState;
  progress: number;
  errorMessage?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  ip: string;
}

class JobQueue {
  private jobs: Map<string, ConversionJob> = new Map();
  private runningCount = 0;
  private queue: string[] = [];

  constructor() {
    // Schedule periodic garbage collection
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  public createJob(params: {
    originalFilename: string;
    inputPath: string;
    targetFormat: string;
    options?: Record<string, any>;
    ip: string;
  }): ConversionJob {
    const id = generateUniqueId();
    const stat = fs.existsSync(params.inputPath) ? fs.statSync(params.inputPath) : { size: 0 };
    const ext = path.extname(params.originalFilename).toLowerCase().replace('.', '');
    const reg = CONVERSION_REGISTRY[ext];

    const job: ConversionJob = {
      id,
      originalFilename: params.originalFilename,
      inputPath: params.inputPath,
      fileCategory: reg?.category || 'other',
      inputSize: stat.size,
      targetFormat: params.targetFormat.toLowerCase().replace('.', ''),
      options: params.options || {},
      status: 'QUEUED',
      progress: 0,
      createdAt: Date.now(),
      ip: params.ip,
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    this.processNext();
    return job;
  }

  public getJob(id: string): ConversionJob | undefined {
    return this.jobs.get(id);
  }

  public cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === 'QUEUED') {
      job.status = 'CANCELLED';
      this.queue = this.queue.filter((qId) => qId !== id);
      return true;
    }

    if (job.status === 'PROCESSING') {
      job.status = 'CANCELLED';
      // Process next in queue
      this.runningCount = Math.max(0, this.runningCount - 1);
      this.processNext();
      return true;
    }

    return false;
  }

  public deleteFilesForJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.inputPath && fs.existsSync(job.inputPath)) {
      try { fs.unlinkSync(job.inputPath); } catch (_) {}
    }
    if (job.outputPath && fs.existsSync(job.outputPath)) {
      try { fs.unlinkSync(job.outputPath); } catch (_) {}
    }

    job.status = 'EXPIRED';
    this.jobs.delete(id);
    return true;
  }

  public getAllJobs(): ConversionJob[] {
    return Array.from(this.jobs.values());
  }

  public getStats() {
    const all = Array.from(this.jobs.values());
    return {
      total: all.length,
      queued: all.filter((j) => j.status === 'QUEUED').length,
      processing: all.filter((j) => j.status === 'PROCESSING').length,
      completed: all.filter((j) => j.status === 'COMPLETED').length,
      failed: all.filter((j) => j.status === 'FAILED').length,
      runningCount: this.runningCount,
      maxConcurrent: CONFIG.MAX_CONCURRENT_JOBS,
    };
  }

  private async processNext() {
    if (this.runningCount >= CONFIG.MAX_CONCURRENT_JOBS || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'QUEUED') {
      this.processNext();
      return;
    }

    this.runningCount++;
    job.status = 'PROCESSING';
    job.startedAt = Date.now();
    job.progress = 10;

    // Generate output filename & path
    const parsed = path.parse(job.originalFilename);
    const outExt = job.targetFormat === 'split' ? 'zip' : job.targetFormat;
    const outputFilename = `${parsed.name}_converted.${outExt}`;
    const outputPath = path.join(CONFIG.DIR_OUTPUT, `${job.id}_${outputFilename}`);
    job.outputFilename = outputFilename;
    job.outputPath = outputPath;

    try {
      // Execute conversion based on category
      await this.executeConversion(job);

      if (fs.existsSync(outputPath)) {
        const outStat = fs.statSync(outputPath);
        job.outputSize = outStat.size;
        job.savedPercent =
          job.inputSize > 0
            ? Math.round(((job.inputSize - outStat.size) / job.inputSize) * 100 * 10) / 10
            : 0;
        job.status = 'COMPLETED';
        job.progress = 100;
        job.completedAt = Date.now();
      } else {
        throw new Error('Output file was not generated.');
      }
    } catch (err: any) {
      job.status = 'FAILED';
      job.errorMessage = this.humanizeError(err);
      job.progress = 0;
    } finally {
      this.runningCount = Math.max(0, this.runningCount - 1);
      this.processNext();
    }
  }

  private async executeConversion(job: ConversionJob): Promise<void> {
    const ext = path.extname(job.originalFilename).toLowerCase().replace('.', '');
    const reg = CONVERSION_REGISTRY[ext];
    const category = reg?.category || job.fileCategory;

    // Timeout safety
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Conversion timeout exceeded (5 minutes).')), CONFIG.JOB_TIMEOUT_MS);
    });

    const conversionPromise = (async () => {
      switch (category) {
        case 'image':
          job.progress = 30;
          await processImage(job.inputPath, job.outputPath!, job.targetFormat, job.options);
          break;

        case 'video':
          job.progress = 25;
          await processVideo(job.inputPath, job.outputPath!, job.targetFormat, {
            ...job.options,
            onProgress: (p) => {
              job.progress = Math.min(90, Math.max(job.progress, p));
            },
          });
          break;

        case 'audio':
          job.progress = 35;
          await processAudio(job.inputPath, job.outputPath!, job.targetFormat, job.options);
          break;

        case 'pdf':
          job.progress = 30;
          await processPDF(job.inputPath, job.outputPath!, job.targetFormat, job.options);
          break;

        case 'document':
          job.progress = 40;
          await processDocument(job.inputPath, job.outputPath!, job.targetFormat);
          break;

        default:
          // Try image first, fallback to copy
          try {
            await processImage(job.inputPath, job.outputPath!, job.targetFormat, job.options);
          } catch {
            await fs.promises.copyFile(job.inputPath, job.outputPath!);
          }
      }
    })();

    await Promise.race([conversionPromise, timeoutPromise]);
  }

  private humanizeError(err: any): string {
    const msg = String(err?.message || err || 'Unknown conversion failure');
    if (msg.includes('timeout')) return 'Conversion timed out. The file might be too complex or large.';
    if (msg.includes('password') || msg.includes('encrypted')) return 'File is password-protected or encrypted.';
    if (msg.includes('code 1') || msg.includes('unsupported')) return 'Unsupported codec or corrupted input file format.';
    if (msg.includes('EBUSY') || msg.includes('ENOENT')) return 'File system temporary error. Please re-upload.';
    return msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt > CONFIG.FILE_RETENTION_MS) {
        this.deleteFilesForJob(id);
      }
    }
  }
}

export const jobQueue = new JobQueue();
