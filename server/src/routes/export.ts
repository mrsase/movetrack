import { Router } from 'express';
import type { Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { BOM, toCsv, type CsvColumn } from '../csv.js';
import { isRecord } from '../guards.js';
import { BOX_STATUSES, CATEGORIES, ITEM_STATUSES } from '../types.js';

/** Backup file format version. Bump only with a migration path. */
export const BACKUP_VERSION = 1;
const MAX_BOXES = 2_000;
const MAX_ITEMS = 20_000;

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
  box_label?: string | null;
}

interface BoxRow {
  id: number;
  label: string | null;
  destination: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const ITEM_COLUMNS: CsvColumn<ItemRow>[] = [
  { header: 'id', value: (r) => r.id },
  { header: 'name', value: (r) => r.name },
  { header: 'category', value: (r) => r.category },
  { header: 'serial', value: (r) => r.serial },
  { header: 'quantity', value: (r) => r.quantity },
  { header: 'status', value: (r) => r.status },
  { header: 'box_id', value: (r) => r.box_id },
  { header: 'box_label', value: (r) => r.box_label ?? null },
  { header: 'destination', value: (r) => r.destination },
  { header: 'notes', value: (r) => r.notes },
  { header: 'created_at', value: (r) => r.created_at },
  { header: 'updated_at', value: (r) => r.updated_at },
];

const BOX_COLUMNS: CsvColumn<Record<string, unknown>>[] = [
  { header: 'id', value: (r) => r.id },
  { header: 'label', value: (r) => r.label },
  { header: 'status', value: (r) => r.status },
  { header: 'destination', value: (r) => r.destination },
  { header: 'items_total', value: (r) => r.items_total },
  { header: 'created_at', value: (r) => r.created_at },
  { header: 'updated_at', value: (r) => r.updated_at },
];

const stamp = () => new Date().toISOString().slice(0, 10);

function attachment(res: Response, filename: string, type: string): void {
  res.setHeader('content-type', `${type}; charset=utf-8`);
  res.setHeader('content-disposition', `attachment; filename="${filename}"`);
}

/* ------------------------------------------------------------------ */
/*  Validation for restore                                             */
/* ------------------------------------------------------------------ */

interface ParsedBackup {
  boxes: BoxRow[];
  items: ItemRow[];
}

type ParseResult = { ok: true; backup: ParsedBackup } | { ok: false; errors: string[] };

function text(value: unknown, path: string, errors: string[], max = 2000, nullable = true): string | null {
  if (value === null || value === undefined) {
    if (!nullable) errors.push(`${path} is required`);
    return null;
  }
  if (typeof value !== 'string') {
    errors.push(`${path} must be a string`);
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    if (!nullable) errors.push(`${path} must not be empty`);
    return null;
  }
  if (trimmed.length > max) errors.push(`${path} is longer than ${max} characters`);
  return trimmed;
}

function integer(value: unknown, path: string, errors: string[], min: number): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min) {
    errors.push(`${path} must be a whole number ≥ ${min}`);
    return null;
  }
  return n;
}

function timestamp(value: unknown, path: string, errors: string[], fallback: string): string {
  if (typeof value !== 'string' || !ISO.test(value)) {
    errors.push(`${path} must be an ISO-8601 UTC timestamp`);
    return fallback;
  }
  return value;
}

/** Validate a backup payload completely before any write happens. */
export function parseBackup(input: unknown): ParseResult {
  const errors: string[] = [];
  if (!isRecord(input)) return { ok: false, errors: ['body must be a JSON object'] };

  if (input.app !== undefined && input.app !== 'movetrack') {
    errors.push('app must be "movetrack"');
  }
  if (input.version !== BACKUP_VERSION) {
    errors.push(`version must be ${BACKUP_VERSION}`);
  }
  const rawBoxes = input.boxes;
  const rawItems = input.items;
  if (!Array.isArray(rawBoxes)) errors.push('boxes must be an array');
  if (!Array.isArray(rawItems)) errors.push('items must be an array');
  if (!Array.isArray(rawBoxes) || !Array.isArray(rawItems)) return { ok: false, errors };

  if (rawBoxes.length > MAX_BOXES) errors.push(`boxes exceeds the limit of ${MAX_BOXES}`);
  if (rawItems.length > MAX_ITEMS) errors.push(`items exceeds the limit of ${MAX_ITEMS}`);

  const boxes: BoxRow[] = [];
  const boxIds = new Set<number>();
  for (const [index, raw] of rawBoxes.entries()) {
    const path = `boxes[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    const id = integer(raw.id, `${path}.id`, errors, 1);
    const status = text(raw.status, `${path}.status`, errors, 40, false);
    if (status !== null && !(BOX_STATUSES as readonly string[]).includes(status)) {
      errors.push(`${path}.status must be one of: ${BOX_STATUSES.join(', ')}`);
    }
    if (id !== null) {
      if (boxIds.has(id)) errors.push(`${path}.id ${id} is duplicated`);
      boxIds.add(id);
    }
    boxes.push({
      id: id ?? 0,
      label: text(raw.label, `${path}.label`, errors, 120),
      destination: text(raw.destination, `${path}.destination`, errors, 120),
      status: status ?? 'open',
      created_at: timestamp(raw.created_at, `${path}.created_at`, errors, new Date(0).toISOString()),
      updated_at: timestamp(raw.updated_at, `${path}.updated_at`, errors, new Date(0).toISOString()),
    });
  }

  const items: ItemRow[] = [];
  const itemIds = new Set<number>();
  for (const [index, raw] of rawItems.entries()) {
    const path = `items[${index}]`;
    if (!isRecord(raw)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    const id = integer(raw.id, `${path}.id`, errors, 1);
    const name = text(raw.name, `${path}.name`, errors, 120, false);
    const category = text(raw.category, `${path}.category`, errors, 40, false);
    if (category !== null && !(CATEGORIES as readonly string[]).includes(category)) {
      errors.push(`${path}.category must be one of: ${CATEGORIES.join(', ')}`);
    }
    const status = text(raw.status, `${path}.status`, errors, 40, false);
    if (status !== null && !(ITEM_STATUSES as readonly string[]).includes(status)) {
      errors.push(`${path}.status must be one of: ${ITEM_STATUSES.join(', ')}`);
    }
    const quantity = integer(raw.quantity ?? 1, `${path}.quantity`, errors, 1);
    let boxId: number | null = null;
    if (raw.box_id !== null && raw.box_id !== undefined) {
      boxId = integer(raw.box_id, `${path}.box_id`, errors, 1);
      if (boxId !== null && !boxIds.has(boxId)) {
        errors.push(`${path}.box_id ${boxId} does not exist in this backup`);
      }
    }
    if (id !== null) {
      if (itemIds.has(id)) errors.push(`${path}.id ${id} is duplicated`);
      itemIds.add(id);
    }
    items.push({
      id: id ?? 0,
      name: name ?? '',
      category: category ?? 'other',
      serial: text(raw.serial, `${path}.serial`, errors, 120),
      quantity: quantity ?? 1,
      notes: text(raw.notes, `${path}.notes`, errors, 2000),
      destination: text(raw.destination, `${path}.destination`, errors, 120),
      status: status ?? 'in_office',
      box_id: boxId,
      created_at: timestamp(raw.created_at, `${path}.created_at`, errors, new Date(0).toISOString()),
      updated_at: timestamp(raw.updated_at, `${path}.updated_at`, errors, new Date(0).toISOString()),
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, backup: { boxes, items } };
}

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

export function exportRouter(db: DatabaseSync): Router {
  const r = Router();

  const itemRows = () =>
    db
      .prepare(`
        SELECT i.id, i.name, i.category, i.serial, i.quantity, i.status, i.box_id,
               b.label AS box_label, i.destination, i.notes, i.created_at, i.updated_at
        FROM items i
        LEFT JOIN boxes b ON b.id = i.box_id
        ORDER BY i.id
      `)
      .all() as unknown as ItemRow[];

  const boxRows = () =>
    db
      .prepare(`
        SELECT b.id, b.label, b.status, b.destination, b.created_at, b.updated_at,
               COUNT(i.id) AS items_total
        FROM boxes b
        LEFT JOIN items i ON i.box_id = b.id
        GROUP BY b.id
        ORDER BY b.id
      `)
      .all() as unknown as Record<string, unknown>[];

  r.get('/items.csv', (_req, res) => {
    attachment(res, `movetrack-items-${stamp()}.csv`, 'text/csv');
    res.send(BOM + toCsv(itemRows(), ITEM_COLUMNS));
  });

  r.get('/boxes.csv', (_req, res) => {
    attachment(res, `movetrack-boxes-${stamp()}.csv`, 'text/csv');
    res.send(BOM + toCsv(boxRows(), BOX_COLUMNS));
  });

  r.get('/backup.json', (_req, res) => {
    attachment(res, `movetrack-backup-${stamp()}.json`, 'application/json');
    res.send(
      JSON.stringify(
        {
          app: 'movetrack',
          version: BACKUP_VERSION,
          exported_at: new Date().toISOString(),
          boxes: db.prepare('SELECT * FROM boxes ORDER BY id').all(),
          items: db.prepare('SELECT * FROM items ORDER BY id').all(),
        },
        null,
        2,
      ),
    );
  });

  return r;
}

export function importRouter(db: DatabaseSync): Router {
  const r = Router();

  r.post('/backup', (req, res) => {
    const body = req.body as Record<string, unknown> | undefined;
    if (body?.confirmation !== 'replace-all') {
      return res.status(400).json({
        error: 'restore requires "confirmation": "replace-all" — it replaces every box and item',
      });
    }

    const parsed = parseBackup(body);
    if (!parsed.ok) {
      return res.status(400).json({ error: 'backup is not valid', details: parsed.errors.slice(0, 25) });
    }

    const { boxes, items } = parsed.backup;
    const insertBox = db.prepare(`
      INSERT INTO boxes (id, label, destination, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO items (id, name, category, serial, quantity, notes, destination, status, box_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec('DELETE FROM items');
      db.exec('DELETE FROM boxes');
      for (const b of boxes) {
        insertBox.run(b.id, b.label, b.destination, b.status, b.created_at, b.updated_at);
      }
      for (const i of items) {
        insertItem.run(i.id, i.name, i.category, i.serial, i.quantity, i.notes, i.destination, i.status, i.box_id, i.created_at, i.updated_at);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    res.json({ imported: { boxes: boxes.length, items: items.length } });
  });

  return r;
}
