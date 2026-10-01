import 'dotenv/config';
import express from 'express';
import { apiRouter } from './api';

export function createApp() {
  const app = express();

  // Security: disable x-powered-by to prevent fingerprinting
  app.disable('x-powered-by');

  // Security: Apply HTTP response headers compatible with AI Studio iframe preview and Vercel
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // CORS headers for API and preview integration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Basic security and parsing middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl.startsWith('/api') && req.originalUrl !== '/api/stats') {
        console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Mount API Router on '/api' and '/'
  // On Vercel, depending on serverless rewrite routing, req.url may be /api/ai/process or /ai/process
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  // Global API error handler (always returns valid JSON, never empty or HTML)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[ConvertX Server Error]', err);
    if (res.headersSent) return;
    res.status(err.status || 500).json({
      error: err.message || 'An internal server error occurred.',
      message: err.message || 'Error',
    });
  });

  return app;
}

export const app = createApp();
export default app;
