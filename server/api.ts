import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { z } from 'zod';
import { CONFIG } from './config';
import { sanitizeFilename, generateUniqueId, validateSafeUrl, rateLimitMiddleware, getClientIp } from './security';
import { CONVERSION_REGISTRY } from './registry';
import { jobQueue } from './jobQueue';
import { aiRouter } from './ai/router';
import { aiUsageTracker } from './ai/usageTracker';
import { extractTextFromFile } from './ai/fileExtractor';
import { AITaskType, AIProviderId } from './ai/types';

export const apiRouter = express.Router();

// Apply rate limiter to all API routes
apiRouter.use(rateLimitMiddleware);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CONFIG.DIR_UPLOAD);
  },
  filename: (_req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname);
    const unique = `${generateUniqueId()}_${safeName}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: CONFIG.MAX_UPLOAD_SIZE_BYTES, // 500 MB
    files: CONFIG.MAX_SIMULTANEOUS_FILES, // 10 files
  },
});

// 1. Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    name: 'ConvertX API',
    uptime: Math.floor(process.uptime()),
    timestamp: Date.now(),
  });
});

// 2. Conversion registry (dynamic formats)
apiRouter.get('/registry', (_req: Request, res: Response) => {
  res.json({
    formats: CONVERSION_REGISTRY,
    limits: {
      maxUploadMb: CONFIG.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024),
      maxSimultaneousFiles: CONFIG.MAX_SIMULTANEOUS_FILES,
      maxJobTimeoutSeconds: CONFIG.JOB_TIMEOUT_MS / 1000,
      retentionMinutes: CONFIG.FILE_RETENTION_MS / (60 * 1000),
    },
  });
});

// 3. Stats & queue monitoring (for admin / status bar)
apiRouter.get('/stats', (_req: Request, res: Response) => {
  const stats = jobQueue.getStats();
  const mem = process.memoryUsage();
  res.json({
    ...stats,
    memory: {
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
    },
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 4. File upload endpoint (supports multiple files)
apiRouter.post('/upload', upload.array('files', CONFIG.MAX_SIMULTANEOUS_FILES), (req: Request, res: Response) => {
  const uploadedFiles = req.files as Express.Multer.File[];
  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400).json({ error: 'No files were uploaded.' });
    return;
  }

  const results = uploadedFiles.map((f) => {
    const ext = path.extname(f.originalname).toLowerCase().replace('.', '');
    const reg = CONVERSION_REGISTRY[ext];
    return {
      fileId: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimeType: f.mimetype,
      extension: ext,
      category: reg?.category || 'other',
      supportedTargets: reg?.targetFormats || [],
      defaultTarget: reg?.targetFormats?.[0] || '',
      options: reg?.options || {},
    };
  });

  res.json({ files: results });
});

// 5. URL import endpoint (safe direct file download)
const UrlImportSchema = z.object({
  url: z.string().url(),
});

apiRouter.post('/upload/url', async (req: Request, res: Response) => {
  const parsed = UrlImportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid URL provided.' });
    return;
  }

  const { valid, url: safeUrl, error } = await validateSafeUrl(parsed.data.url);
  if (!valid || !safeUrl) {
    res.status(403).json({ error: error || 'URL is blocked or unsafe.' });
    return;
  }

  try {
    const rawFilename = path.basename(safeUrl.pathname) || 'downloaded_file';
    const cleanFilename = sanitizeFilename(rawFilename);
    const uniqueFileId = `${generateUniqueId()}_${cleanFilename}`;
    const destinationPath = path.join(CONFIG.DIR_UPLOAD, uniqueFileId);

    const client = safeUrl.protocol === 'https:' ? https : http;

    await new Promise<void>((resolve, reject) => {
      const request = client.get(safeUrl.href, { timeout: 15000 }, (response) => {
        if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
          reject(new Error(`Server responded with HTTP ${response.statusCode}`));
          return;
        }

        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        if (contentLength > CONFIG.MAX_UPLOAD_SIZE_BYTES) {
          reject(new Error('File exceeds maximum upload size (500MB).'));
          return;
        }

        const fileStream = fs.createWriteStream(destinationPath);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (downloadedBytes > CONFIG.MAX_UPLOAD_SIZE_BYTES) {
            fileStream.destroy();
            reject(new Error('File exceeds maximum upload limit.'));
          }
        });

        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        fileStream.on('error', (err) => reject(err));
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download connection timed out.'));
      });
      request.on('error', (err) => reject(err));
    });

    const stat = fs.statSync(destinationPath);
    const ext = path.extname(cleanFilename).toLowerCase().replace('.', '');
    const reg = CONVERSION_REGISTRY[ext];

    res.json({
      file: {
        fileId: uniqueFileId,
        originalName: cleanFilename,
        size: stat.size,
        extension: ext,
        category: reg?.category || 'other',
        supportedTargets: reg?.targetFormats || [],
        defaultTarget: reg?.targetFormats?.[0] || '',
        options: reg?.options || {},
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to download file from URL.' });
  }
});

// 6. Create conversion jobs
const CreateJobsSchema = z.object({
  jobs: z.array(
    z.object({
      fileId: z.string(),
      targetFormat: z.string(),
      options: z.record(z.string(), z.any()).optional(),
    })
  ).min(1),
});

apiRouter.post('/jobs', (req: Request, res: Response) => {
  const parsed = CreateJobsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid job request payload.', details: parsed.error.issues });
    return;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const createdJobs = [];

  for (const item of parsed.data.jobs) {
    // Sanitize fileId to prevent traversal
    const safeFileId = path.basename(item.fileId);
    const inputPath = path.join(CONFIG.DIR_UPLOAD, safeFileId);

    if (!fs.existsSync(inputPath)) {
      res.status(404).json({ error: `Uploaded file ${safeFileId} not found or expired.` });
      return;
    }

    // Extract original name from unique prefix
    const originalName = safeFileId.replace(/^[a-f0-9]+_/, '');

    const job = jobQueue.createJob({
      originalFilename: originalName,
      inputPath,
      targetFormat: item.targetFormat,
      options: item.options || {},
      ip: clientIp,
    });

    createdJobs.push({
      jobId: job.id,
      fileId: item.fileId,
      status: job.status,
      originalName: job.originalFilename,
      targetFormat: job.targetFormat,
      inputSize: job.inputSize,
    });
  }

  res.json({ jobs: createdJobs });
});

// 7. Get job status
apiRouter.get('/jobs/:id', (req: Request, res: Response) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found or expired.' });
    return;
  }

  res.json({
    jobId: job.id,
    originalFilename: job.originalFilename,
    outputFilename: job.outputFilename,
    fileCategory: job.fileCategory,
    status: job.status,
    progress: job.progress,
    inputSize: job.inputSize,
    outputSize: job.outputSize,
    savedPercent: job.savedPercent,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    downloadUrl: job.status === 'COMPLETED' ? `/api/download/${job.id}` : null,
  });
});

// 8. Cancel job
apiRouter.post('/jobs/:id/cancel', (req: Request, res: Response) => {
  const success = jobQueue.cancelJob(req.params.id);
  if (success) {
    res.json({ success: true, message: 'Job cancelled successfully.' });
  } else {
    res.status(400).json({ error: 'Job cannot be cancelled (either already finished or not found).' });
  }
});

// 9. Download single converted output
apiRouter.get('/download/:id', (req: Request, res: Response) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job || !job.outputPath || !fs.existsSync(job.outputPath)) {
    res.status(404).json({ error: 'Output file not found or has expired.' });
    return;
  }

  const outName = job.outputFilename || 'converted_file';
  res.download(job.outputPath, outName);
});

// 10. Download multiple files as ZIP
const DownloadZipSchema = z.object({
  jobIds: z.array(z.string()).min(1),
});

apiRouter.post('/download-zip', async (req: Request, res: Response) => {
  const parsed = DownloadZipSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid job IDs.' });
    return;
  }

  const archiverModule: any = await import('archiver');
  const archiver = archiverModule.default || archiverModule;
  const archive = archiver('zip', { zlib: { level: 6 } });
  res.attachment('ConvertX_Package.zip');
  archive.pipe(res);

  let addedCount = 0;
  for (const jobId of parsed.data.jobIds) {
    const job = jobQueue.getJob(jobId);
    if (job && job.outputPath && fs.existsSync(job.outputPath)) {
      archive.file(job.outputPath, { name: job.outputFilename || `${job.id}.bin` });
      addedCount++;
    }
  }

  if (addedCount === 0) {
    res.status(404).json({ error: 'No valid completed files found to package.' });
    return;
  }

  archive.finalize();
});

// 11. Delete file now (privacy action)
apiRouter.delete('/files/:id', (req: Request, res: Response) => {
  const success = jobQueue.deleteFilesForJob(req.params.id);
  if (success) {
    res.json({ success: true, message: 'Files permanently deleted.' });
  } else {
    res.status(404).json({ error: 'Job or files not found.' });
  }
});

// ====================================================================
// 12. MULTI-PROVIDER AI SYSTEM ENDPOINTS (/api/ai/*)
// ====================================================================

const AIProcessSchema = z.object({
  task: z.enum([
    'translate',
    'rewrite',
    'summarize',
    'grammar',
    'analyzer',
    'content',
    'code',
    'chat',
    'file_process',
    'seo_optimize',
    'ask_pdf',
    'image_generate',
    'ocr',
  ]),
  input: z.string().min(1, 'Input text cannot be empty.').max(100000, 'Input exceeds limit.'),
  options: z.record(z.string(), z.any()).optional(),
  preferredProvider: z.enum(['gemini', 'deepseek', 'groq', 'openai', 'anthropic']).optional(),
});

// 12.1 Task Processing with Failover (Translate, Rewrite, Summarize, Code, etc.)
apiRouter.post('/ai/process', async (req: Request, res: Response) => {
  const parsed = AIProcessSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request parameters.',
      details: parsed.error.issues.map((i) => i.message).join(', '),
    });
    return;
  }

  const clientId = getClientIp(req);
  const { task, input, options, preferredProvider } = parsed.data;

  // Quota & length check
  const quota = aiUsageTracker.checkQuota(clientId, input.length);
  if (!quota.allowed) {
    res.status(429).json({
      error: quota.reason,
      remainingRequests: quota.remainingRequests,
    });
    return;
  }

  try {
    const response = await aiRouter.processTask(
      task as AITaskType,
      input,
      options || {},
      preferredProvider as AIProviderId
    );

    // Record usage
    const tokens = (response.usage?.inputTokens || 0) + (response.usage?.outputTokens || 0);
    aiUsageTracker.recordUsage(clientId, tokens);

    res.json({
      ...response,
      remainingRequests: quota.remainingRequests - 1,
    });
  } catch (err: any) {
    console.error(`[AI Process Error: ${task}]`, err.message);
    const statusCode = err.status || 503;
    res.status(statusCode).json({
      error: err.message || 'AI service is temporarily unavailable. Please try again shortly.',
      attempts: err.attempts,
    });
  }
});

// 12.2 Conversational AI Chat ("Ask ConvertX AI")
const AIChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(50000),
      })
    )
    .min(1),
  options: z.record(z.string(), z.any()).optional(),
  preferredProvider: z.enum(['gemini', 'deepseek', 'groq', 'openai', 'anthropic']).optional(),
});

apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  const parsed = AIChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid chat request payload.' });
    return;
  }

  const clientId = getClientIp(req);
  const { messages, options, preferredProvider } = parsed.data;
  const lastUserMsg = messages[messages.length - 1]?.content || '';

  const quota = aiUsageTracker.checkQuota(clientId, lastUserMsg.length);
  if (!quota.allowed) {
    res.status(429).json({ error: quota.reason });
    return;
  }

  try {
    const response = await aiRouter.processChat(
      messages,
      options || {},
      preferredProvider as AIProviderId
    );

    aiUsageTracker.recordUsage(clientId);

    res.json({
      ...response,
      remainingRequests: quota.remainingRequests - 1,
    });
  } catch (err: any) {
    console.error('[AI Chat Error]', err.message);
    res.status(503).json({
      error: err.message || 'AI chat engine is temporarily busy. Please try again.',
    });
  }
});

// 12.3 AI File Processing (PDF, DOCX, TXT, CSV, Code files)
apiRouter.post('/ai/file-process', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded for AI analysis.' });
    return;
  }

  const clientId = getClientIp(req);
  const task = (req.body.task as AITaskType) || 'file_process';
  let options: any = {};
  if (req.body.options) {
    try {
      options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
    } catch {
      // ignore
    }
  }

  const filePath = file.path;
  try {
    // Extract text from uploaded document
    const extractedText = await extractTextFromFile(filePath, file.originalname);

    // Delete uploaded temp file immediately for privacy
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const quota = aiUsageTracker.checkQuota(clientId, extractedText.length);
    if (!quota.allowed) {
      res.status(429).json({ error: quota.reason });
      return;
    }

    const response = await aiRouter.processTask(
      task,
      extractedText,
      options,
      req.body.preferredProvider as AIProviderId
    );

    aiUsageTracker.recordUsage(clientId);

    res.json({
      ...response,
      originalFilename: file.originalname,
      extractedCharCount: extractedText.length,
    });
  } catch (err: any) {
    // Ensure file is scrubbed on error
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
    console.error('[AI File Process Error]', err.message);
    res.status(500).json({
      error: err.message || 'Failed to analyze file with ConvertX AI.',
    });
  }
});

// 12.4 AI Provider Health & Status Dashboard Data
apiRouter.get('/ai/providers', (req: Request, res: Response) => {
  const clientId = getClientIp(req);
  const dashboard = aiRouter.getDashboardData();
  const userQuota = aiUsageTracker.getStatsForClient(clientId);

  res.json({
    ...dashboard,
    userQuota,
  });
});

// 12.5 AI Admin Configuration Update
apiRouter.post('/ai/admin/config', (req: Request, res: Response) => {
  const { priority, enabled, models, timeoutMs, cooldownSeconds } = req.body;
  aiRouter.updateConfig({ priority, enabled, models, timeoutMs, cooldownSeconds });
  res.json({ success: true, message: 'AI configuration updated.', state: aiRouter.getDashboardData() });
});

// 12.6 Reset Cooldown Manually
apiRouter.post('/ai/admin/reset-cooldown', (req: Request, res: Response) => {
  const { provider } = req.body;
  if (!provider) {
    res.status(400).json({ error: 'Provider ID is required.' });
    return;
  }
  const reset = aiRouter.resetCooldown(provider as AIProviderId);
  res.json({ success: reset, message: `Cooldown reset for ${provider}` });
});

