import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { itemsRouter } from './routes/items.js';
import { boxesRouter } from './routes/boxes.js';
import { statsRouter } from './routes/stats.js';

const here = dirname(fileURLToPath(import.meta.url));

export function createApp(db: DatabaseSync): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString(), items: (db.prepare('SELECT COUNT(*) AS n FROM items').get() as { n: number }).n });
  });

  app.use('/api/items', itemsRouter(db));
  app.use('/api/boxes', boxesRouter(db));
  app.use('/api/stats', statsRouter(db));

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
    app.use(express.static(clientDist, { index: 'index.html', maxAge: '1h' }));
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