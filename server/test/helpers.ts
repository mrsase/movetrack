import type { Express } from 'express';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

/** Fresh in-memory app for a test. Each test gets its own database. */
export function makeApp(): Express {
  const db = openDb(':memory:');
  return createApp(db);
}