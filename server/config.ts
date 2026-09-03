import path from 'path';
import fs from 'fs';

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MAX_UPLOAD_SIZE_BYTES: (parseInt(process.env.MAX_UPLOAD_MB || '500', 10)) * 1024 * 1024, // 500 MB
  MAX_SIMULTANEOUS_FILES: parseInt(process.env.MAX_SIMULTANEOUS_FILES || '10', 10),
  MAX_TOTAL_JOB_BYTES: 1024 * 1024 * 1024, // 1 GB
  JOB_TIMEOUT_MS: (parseInt(process.env.JOB_TIMEOUT_SECONDS || '300', 10)) * 1000, // 5 minutes
  FILE_RETENTION_MS: (parseInt(process.env.FILE_RETENTION_MINUTES || '60', 10)) * 60 * 1000, // 1 hour
  MAX_CONCURRENT_JOBS: 3,

  // Storage directories
  DIR_UPLOAD: path.resolve(process.cwd(), 'data', 'uploads'),
  DIR_OUTPUT: path.resolve(process.cwd(), 'data', 'outputs'),
  DIR_TEMP: path.resolve(process.cwd(), 'data', 'temp'),

  // Rate Limiting (per IP window)
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 120, // 120 requests per minute
  RATE_LIMIT_MAX_JOBS_PER_MIN: 20, // 20 conversions submitted per minute
};

// Ensure directories exist
for (const dir of [CONFIG.DIR_UPLOAD, CONFIG.DIR_OUTPUT, CONFIG.DIR_TEMP]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
