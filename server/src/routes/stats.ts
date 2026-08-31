import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { ITEM_STATUSES, BOX_STATUSES } from '../types.js';

export function statsRouter(db: DatabaseSync): Router {
  const r = Router();

  // GET /api/stats
  r.get('/', (_req, res) => {
    const itemCounts = db.prepare('SELECT status, COUNT(*) AS n FROM items GROUP BY status').all() as unknown as {
      status: string;
      n: number;
    }[];
    const byStatus = Object.fromEntries(itemCounts.map((c) => [c.status, c.n]));
    const items = {
      total: itemCounts.reduce((sum, c) => sum + c.n, 0),
      in_office: byStatus.in_office ?? 0,
      packed: byStatus.packed ?? 0,
      shipped: byStatus.shipped ?? 0,
      delivered: byStatus.delivered ?? 0,
      byCategory: db
        .prepare('SELECT category, COUNT(*) AS count FROM items GROUP BY category ORDER BY count DESC, category')
        .all() as unknown as { category: string; count: number }[],
      recent: db
        .prepare(
          'SELECT id, name, category, status, quantity, destination, created_at FROM items ORDER BY created_at DESC, id DESC LIMIT 8',
        )
        .all() as unknown as Record<string, unknown>[],
    };

    const boxCounts = db.prepare('SELECT status, COUNT(*) AS n FROM boxes GROUP BY status').all() as unknown as {
      status: string;
      n: number;
    }[];
    const byBoxStatus = Object.fromEntries(boxCounts.map((c) => [c.status, c.n]));

    res.json({
      items: { ...items, validStatuses: ITEM_STATUSES },
      boxes: {
        total: boxCounts.reduce((sum, c) => sum + c.n, 0),
        open: byBoxStatus.open ?? 0,
        sealed: byBoxStatus.sealed ?? 0,
        shipped: byBoxStatus.shipped ?? 0,
        arrived: byBoxStatus.arrived ?? 0,
        unpacked: byBoxStatus.unpacked ?? 0,
        validStatuses: BOX_STATUSES,
      },
    });
  });

  return r;
}