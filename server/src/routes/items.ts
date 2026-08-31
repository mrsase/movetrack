import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { NOW } from '../schema.js';
import { sql } from '../db.js';
import { parseItem } from '../validate.js';

interface ItemRow {
  id: number;
  name: string;
  category: string;
  serial: string | null;
  quantity: number;
  notes: string | null;
  destination: string | null;
  status: string;
  box_id: number | null;
  created_at: string;
  updated_at: string;
}

export function itemsRouter(db: DatabaseSync): Router {
  const r = Router();

  const getItemStmt = db.prepare('SELECT * FROM items WHERE id = ?');

  const createStmt = db.prepare(`
    INSERT INTO items (name, category, serial, quantity, notes, destination)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const patchFields: Record<string, string> = {
    name: 'name',
    category: 'category',
    serial: 'serial',
    quantity: 'quantity',
    notes: 'notes',
    destination: 'destination',
  };

  // GET /api/items?status=&category=&q=&box=&limit=&offset=
  r.get('/', (req, res) => {
    const { status, category, q, box } = req.query;
    const where: string[] = [];
    const params: ReturnType<typeof sql>[] = [];

    if (typeof status === 'string' && status) {
      where.push('status = ?');
      params.push(status);
    }
    if (typeof category === 'string' && category) {
      where.push('category = ?');
      params.push(category);
    }
    if (typeof q === 'string' && q.trim()) {
      where.push('(name LIKE ? OR serial LIKE ? OR notes LIKE ?)');
      const like = `%${q.trim()}%`;
      params.push(like, like, like);
    }
    if (box === 'none') {
      where.push('box_id IS NULL');
    } else if (typeof box === 'string' && /^\d+$/.test(box)) {
      where.push('box_id = ?');
      params.push(Number(box));
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const total = (db.prepare(`SELECT COUNT(*) AS n FROM items ${whereSql}`).get(...params) as { n: number }).n;
    const data = db
      .prepare(`SELECT * FROM items ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as unknown as ItemRow[];

    res.json({ data, total });
  });

  // POST /api/items
  r.post('/', (req, res) => {
    const parsed = parseItem(req.body, { requireName: true });
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    const v = parsed.value;

    const info = createStmt.run(sql(v.name), sql(v.category), sql(v.serial), sql(v.quantity ?? 1), sql(v.notes), sql(v.destination));
    const row = getItemStmt.get(info.lastInsertRowid) as unknown as ItemRow | undefined;
    res.status(201).json(row);
  });

  // GET /api/items/:id
  r.get('/:id', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Item not found' });
    const row = getItemStmt.get(Number(req.params.id)) as unknown as ItemRow | undefined;
    if (!row) return res.status(404).json({ error: 'Item not found' });
    res.json(row);
  });

  // PATCH /api/items/:id  (name, category, serial, quantity, notes, destination, status)
  r.patch('/:id', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Item not found' });
    const row = getItemStmt.get(Number(req.params.id)) as unknown as ItemRow | undefined;
    if (!row) return res.status(404).json({ error: 'Item not found' });

    const parsed = parseItem(req.body, { requireName: false });
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    const v = parsed.value;

    const sets: string[] = [];
    const params: ReturnType<typeof sql>[] = [];
    for (const [key, col] of Object.entries(patchFields)) {
      if (key in req.body) {
        sets.push(`${col} = ?`);
        params.push(sql(v[key as keyof typeof v]));
      }
    }

    if (v.status) {
      // A boxed item cannot be "back in the office" via a plain patch — unpack it first.
      if (row.box_id != null && v.status === 'in_office') {
        return res.status(409).json({ error: 'Item is inside a box — unpack it first' });
      }
      sets.push('status = ?');
      params.push(sql(v.status));
    }

    if (sets.length === 0) return res.json(row);

    sets.push(`updated_at = ${NOW}`);
    db.prepare(`UPDATE items SET ${sets.join(', ')} WHERE id = ?`).run(...params, row.id);
    res.json(getItemStmt.get(row.id) as unknown as ItemRow);
  });

  // DELETE /api/items/:id
  r.delete('/:id', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Item not found' });
    const info = db.prepare('DELETE FROM items WHERE id = ?').run(Number(req.params.id));
    if (info.changes === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).end();
  });

  // POST /api/items/:id/box  { box_id } — pack an item into an open box
  r.post('/:id/box', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Item not found' });
    const item = getItemStmt.get(Number(req.params.id)) as unknown as ItemRow | undefined;
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const boxId = Number(req.body?.box_id);
    if (!Number.isInteger(boxId) || boxId < 1) {
      return res.status(400).json({ error: 'box_id is required' });
    }
    const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(boxId) as
      | { id: number; status: string }
      | undefined;
    if (!box) return res.status(404).json({ error: 'Box not found' });

    if (item.box_id != null) return res.status(409).json({ error: 'Item is already in a box' });
    if (item.status === 'delivered') return res.status(409).json({ error: 'Item is already delivered' });
    if (box.status !== 'open') return res.status(409).json({ error: `Box is ${box.status} — only open boxes can accept items` });

    db.prepare(`UPDATE items SET box_id = ?, status = 'packed', updated_at = ${NOW} WHERE id = ?`).run(boxId, item.id);
    res.json(getItemStmt.get(item.id) as unknown as ItemRow);
  });

  // DELETE /api/items/:id/box — take an item back out of its box
  r.delete('/:id/box', (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ error: 'Item not found' });
    const item = getItemStmt.get(Number(req.params.id)) as unknown as ItemRow | undefined;
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.box_id == null) return res.status(409).json({ error: 'Item is not inside a box' });

    const box = db.prepare('SELECT status FROM boxes WHERE id = ?').get(item.box_id) as
      | { status: string }
      | undefined;
    // If the box was already unpacked, the item is already at the destination.
    const backTo = box?.status === 'unpacked' ? 'delivered' : 'in_office';
    db.prepare(`UPDATE items SET box_id = NULL, status = ?, updated_at = ${NOW} WHERE id = ?`).run(backTo, item.id);
    res.json(getItemStmt.get(item.id) as unknown as ItemRow);
  });

  return r;
}