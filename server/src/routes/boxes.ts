import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { NOW } from '../schema.js';
import { sql } from '../db.js';
import { parseBox } from '../validate.js';

interface BoxRow {
  id: number;
  label: string | null;
  destination: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Allowed one-way box transitions. Undefined states are rejected with 409. */
const TRANSITIONS: Record<string, string[]> = {
  seal: ['open'],
  reopen: ['sealed'],
  ship: ['open', 'sealed'],
  arrive: ['shipped'],
  unpack: ['shipped', 'arrived'],
};


export function boxesRouter(db: DatabaseSync): Router {
  const r = Router();

  const getBoxStmt = db.prepare('SELECT * FROM boxes WHERE id = ?');
  const insertStmt = db.prepare('INSERT INTO boxes (label, destination) VALUES (?, ?)');
  const setBoxLabelStmt = db.prepare('UPDATE boxes SET label = ? WHERE id = ?');
  const boxCountsStmt = db.prepare(`
    SELECT b.*,
           COUNT(i.id) AS items_total,
           COALESCE(SUM(CASE WHEN i.status = 'shipped' THEN 1 ELSE 0 END), 0) AS items_shipped,
           COALESCE(SUM(CASE WHEN i.status = 'delivered' THEN 1 ELSE 0 END), 0) AS items_delivered
    FROM boxes b
    LEFT JOIN items i ON i.box_id = b.id
    WHERE b.id = ?
    GROUP BY b.id
  `);

  // GET /api/boxes
  r.get('/', (_req, res) => {
    const rows = db
      .prepare(`
        SELECT b.*,
               COUNT(i.id) AS items_total,
               COALESCE(SUM(CASE WHEN i.status = 'shipped' THEN 1 ELSE 0 END), 0) AS items_shipped,
               COALESCE(SUM(CASE WHEN i.status = 'delivered' THEN 1 ELSE 0 END), 0) AS items_delivered
        FROM boxes b
        LEFT JOIN items i ON i.box_id = b.id
        GROUP BY b.id
        ORDER BY CASE b.status
          WHEN 'open' THEN 0 WHEN 'sealed' THEN 1 WHEN 'shipped' THEN 2 WHEN 'arrived' THEN 3 ELSE 4 END,
          b.id DESC
      `)
      .all() as unknown as Record<string, unknown>[];
    res.json({ data: rows });
  });

  // POST /api/boxes — label is optional, falls back to "Box N"
  r.post('/', (req, res) => {
    const parsed = parseBox(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    const { label, destination } = parsed.value;

    const info = insertStmt.run(sql(label), sql(destination));
    const id = Number(info.lastInsertRowid);
    if (!label) setBoxLabelStmt.run(`Box ${id}`, id);

    res.status(201).json(boxCountsStmt.get(id) as unknown as Record<string, unknown>);
  });

  // GET /api/boxes/:id — box plus its contents
  r.get('/:id', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Box not found' });
    const box = boxCountsStmt.get(Number(req.params.id)) as unknown as Record<string, unknown> | undefined;
    if (!box) return res.status(404).json({ error: 'Box not found' });
    const items = db
      .prepare('SELECT * FROM items WHERE box_id = ? ORDER BY created_at DESC, id DESC')
      .all(Number(req.params.id)) as unknown as Record<string, unknown>[];
    res.json({ ...box, items });
  });

  // PATCH /api/boxes/:id — label, destination
  r.patch('/:id', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Box not found' });
    const row = getBoxStmt.get(Number(req.params.id)) as unknown as BoxRow | undefined;
    if (!row) return res.status(404).json({ error: 'Box not found' });

    const parsed = parseBox(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    const { label, destination } = parsed.value;

    const sets: string[] = [];
    const params: ReturnType<typeof sql>[] = [];
    if ('label' in req.body) {
      sets.push('label = ?');
      params.push(sql(label ?? `Box ${row.id}`));
    }
    if ('destination' in req.body) {
      sets.push('destination = ?');
      params.push(sql(destination));
    }
    if (sets.length === 0) return res.json(boxCountsStmt.get(row.id));

    sets.push(`updated_at = ${NOW}`);
    db.prepare(`UPDATE boxes SET ${sets.join(', ')} WHERE id = ?`).run(...params, row.id);
    res.json(boxCountsStmt.get(row.id));
  });

  // POST /api/boxes/:id/action { action: seal|reopen|ship|arrive|unpack }
  r.post('/:id/action', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Box not found' });
    const row = getBoxStmt.get(Number(req.params.id)) as unknown as BoxRow | undefined;
    if (!row) return res.status(404).json({ error: 'Box not found' });

    const action = String(req.body?.action ?? '');
    const allowedFrom = TRANSITIONS[action];
    if (!allowedFrom) {
      return res.status(400).json({ error: `unknown action (expected ${Object.keys(TRANSITIONS).join(', ')})` });
    }
    if (!allowedFrom.includes(row.status)) {
      return res.status(409).json({ error: `cannot ${action} a box that is ${row.status}` });
    }

    const next: Record<string, string> = { seal: 'sealed', reopen: 'open', ship: 'shipped', arrive: 'arrived', unpack: 'unpacked' };
    const to = next[action];

    db.prepare(`UPDATE boxes SET status = ?, updated_at = ${NOW} WHERE id = ?`).run(sql(to), row.id);
    if (action === 'ship') {
      db.prepare(`UPDATE items SET status = 'shipped', updated_at = ${NOW} WHERE box_id = ?`).run(row.id);
    } else if (action === 'unpack') {
      db.prepare(`UPDATE items SET status = 'delivered', updated_at = ${NOW} WHERE box_id = ?`).run(row.id);
    }

    res.json(boxCountsStmt.get(row.id) as unknown as Record<string, unknown>);
  });

  // DELETE /api/boxes/:id — contents go back to "in office", box is removed
  r.delete('/:id', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Box not found' });
    const row = getBoxStmt.get(Number(req.params.id)) as unknown as BoxRow | undefined;
    if (!row) return res.status(404).json({ error: 'Box not found' });

    db.exec('BEGIN');
    try {
      db.prepare(`UPDATE items SET box_id = NULL, status = 'in_office', updated_at = ${NOW} WHERE box_id = ?`).run(row.id);
      db.prepare('DELETE FROM boxes WHERE id = ?').run(row.id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    res.status(204).end();
  });

  return r;
}