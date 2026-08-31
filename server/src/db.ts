import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SCHEMA } from './schema.js';

/** Default DB location relative to the package root (server/data/move.db). */
export const DEFAULT_DB_PATH = process.env.DB_PATH ?? join(process.cwd(), 'data', 'move.db');

/** Values accepted by node:sqlite statements. */
export type SqlValue = string | number | bigint | Uint8Array | null;

/** Normalize an unknown runtime value for a statement parameter (undefined → NULL). */
export function sql(v: unknown): SqlValue {
  if (v === undefined) return null;
  if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'bigint' || v instanceof Uint8Array) return v;
  return String(v);
}

export function openDb(path: string = DEFAULT_DB_PATH): DatabaseSync {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}