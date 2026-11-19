import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { itemsRouter } from './routes/items.js';
import { boxesRouter } from './routes/boxes.js';
import { statsRouter } from './routes/stats.js';
import { exportRouter, importRouter } from './routes/export.js';

const here = dirname(fileURLToPath(import.meta.url));

export function createApp(db: DatabaseSync): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  // The API is live data: never let the browser serve a cached copy. Without
  // this, a fast sequence of mutations can leave the dashboard showing a
  // previous status after a tab switch (observed during UI validation).
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString(), items: (db.prepare('SELECT COUNT(*) AS n FROM items').get() as { n: number }).n });
  });

  app.use('/api/items', itemsRouter(db));
  app.use('/api/boxes', boxesRouter(db));
  app.use('/api/stats', statsRouter(db));
  app.use('/api/export', exportRouter(db));
  app.use('/api/import', importRouter(db));

  // Anything else under /api is unknown.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Serve the built client (client/dist) when present. The compiled server
  // lives one level deeper than src/, so try both layouts plus a cwd-based one.
  const candidates = [
    join(here, '..', '..', 'client', 'dist'),
    join(here, '..', 'client', 'dist'),
    join(process.cwd(), 'client', 'dist'),
  ];
  const clientDist = candidates.find((p) => existsSync(p));
  if (clientDist) {
    app.use(
      express.static(clientDist, {
        index: 'index.html',
        maxAge: '1h',
        setHeaders(res, path) {
          // Hashed assets may be cached, but the shell and manifest must not be.
          if (path.endsWith('index.html') || path.endsWith('manifest.webmanifest')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(join(clientDist, 'index.html'));
    });
  }

  // Central error handler.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[server] unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}