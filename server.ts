import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api';
import { CONFIG } from './server/config';

async function startServer() {
  const app = express();
  const PORT = CONFIG.PORT;

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

  // Mount API Router
  app.use('/api', apiRouter);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Dev] Vite middleware mounted');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Prod] Serving static files from', distPath);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ ConvertX Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
