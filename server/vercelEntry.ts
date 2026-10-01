import app from '../server/app';

// Vercel Serverless Function entry point with bulletproof lifecycle management
export default function handler(req: any, res: any) {
  // Normalize path if forwarded through Vercel rewrites query
  if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = subpath.startsWith('/') ? subpath : `/${subpath}`;
  }

  return new Promise((resolve) => {
    let settled = false;
    const finalize = () => {
      if (!settled) {
        settled = true;
        resolve(true);
      }
    };

    // Hook standard stream lifecycle events
    if (res.on) {
      res.on('finish', finalize);
      res.on('close', finalize);
    }

    // Intercept res.end to guarantee promise resolution immediately
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      const ret = originalEnd.apply(this, args);
      finalize();
      return ret;
    };

    // Execute Express application
    app(req, res, (err: any) => {
      if (err) {
        console.error('[Vercel Serverless Error]', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      } else if (!res.headersSent) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Route not found on server: ${req.url}` }));
      }
      finalize();
    });
  });
}
