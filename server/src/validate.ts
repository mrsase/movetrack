import { CATEGORIES, ITEM_STATUSES } from './types.js';

const MAX = { name: 120, serial: 120, string: 120, notes: 2000 };

function cleanString(value: unknown, max: number): string | null {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) throw new Error(`too long (max ${max})`);
  return trimmed;
}

function positiveInt(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 99999) throw new Error('must be a whole number between 1 and 99999');
  return n;
}

export interface ParsedItem {
  name: string | null;
  category: string;
  serial: string | null;
  quantity: number | null;
  notes: string | null;
  destination: string | null;
  status: string | null;
}

export interface ParsedBox {
  label: string | null;
  destination: string | null;
}

type Result<T> = { value: T } | { error: string };

/** Validate a full or partial item payload. `full` requires a name (create). */
export function parseItem(body: Record<string, unknown>, opts: { requireName: boolean }): Result<Partial<ParsedItem>> {
  const v: ParsedItem = { name: null, category: 'other', serial: null, quantity: null, notes: null, destination: null, status: null };
  try {
    if ('name' in body) {
      v.name = cleanString(body.name, MAX.name);
    }
    if ('category' in body) {
      const cat = cleanString(body.category, MAX.string);
      if (!cat || !(CATEGORIES as readonly string[]).includes(cat)) {
        return { error: `category must be one of: ${CATEGORIES.join(', ')}` };
      }
      v.category = cat;
    }
    if ('serial' in body) v.serial = cleanString(body.serial, MAX.serial);
    if ('quantity' in body) {
      const q = positiveInt(body.quantity);
      if (q === null && body.quantity !== null && body.quantity !== '') return { error: 'quantity must be a positive whole number' };
      v.quantity = q;
    }
    if ('notes' in body) v.notes = cleanString(body.notes, MAX.notes);
    if ('destination' in body) v.destination = cleanString(body.destination, MAX.string);
    if ('status' in body) {
      const s = cleanString(body.status, MAX.string);
      if (!s || !(ITEM_STATUSES as readonly string[]).includes(s)) {
        return { error: `status must be one of: ${ITEM_STATUSES.join(', ')}` };
      }
      v.status = s;
    }
    if (opts.requireName) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return { error: 'name is required' };
      if (name.length > MAX.name) return { error: `name is too long (max ${MAX.name} characters)` };
      v.name = name;
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'invalid input' };
  }
  return { value: v };
}

export function parseBox(body: Record<string, unknown>): Result<Partial<ParsedBox>> {
  const v: ParsedBox = { label: null, destination: null };
  try {
    if ('label' in body) v.label = cleanString(body.label, MAX.name);
    if ('destination' in body) v.destination = cleanString(body.destination, MAX.string);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'invalid input' };
  }
  return { value: v };
}