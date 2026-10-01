import app from '../server/app';

// Vercel Serverless Function entry point with explicit Promise lifecycle and error boundaries
export default function handler(req: any, res: any) {
  // Normalize path if forwarded through Vercel rewrites query
  if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = subpath.startsWith('/') ? subpath : `/${subpath}`;
  }

  return new Promise((resolve) => {
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
      resolve(true);
    });
  });
}
