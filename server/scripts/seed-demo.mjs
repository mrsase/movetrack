#!/usr/bin/env node
/**
 * Seed a believable half-finished office move into server/data/demo.db.
 *
 * Usage: node server/scripts/seed-demo.mjs [--force]
 * Requires a build first (imports the compiled schema).
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = process.env.DB_PATH ?? join(serverRoot, 'data', 'demo.db');
const force = process.argv.includes('--force');

if (!existsSync(join(serverRoot, 'dist', 'schema.js'))) {
  console.error('✖ server/dist is missing — run `npm run build` first.');
  process.exit(1);
}

mkdirSync(dirname(dbPath), { recursive: true });
if (force && existsSync(dbPath)) {
  for (const suffix of ['', '-wal', '-shm']) rmSync(`${dbPath}${suffix}`, { force: true });
}

const { SCHEMA } = await import(join(serverRoot, 'dist', 'schema.js'));
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec(SCHEMA);

const existing = db.prepare('SELECT COUNT(*) AS n FROM items').get().n;
if (existing > 0 && !force) {
  console.log(`• demo database already seeded (${existing} items) — use --force to reseed`);
  console.log(`  ${dbPath}`);
  db.close();
  process.exit(0);
}

const daysAgo = (days, hour = 10) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(hour, (days * 7) % 60, 0, 0);
  return d.toISOString().slice(0, 23) + 'Z';
};

/** label, destination, status, created days ago */
const BOXES = [
  ['Cables — floor 3', 'Floor 3 · Comms room', 'open', 2],
  ['Ops desk', 'Floor 2 · Ops', 'open', 2],
  ['Design studio', 'Floor 2 · Studio', 'sealed', 2],
  ['Meeting rooms', 'Floor 4 · Meeting rooms', 'sealed', 2],
  ['Server rack', 'Basement · Server room', 'shipped', 1],
  ['Kitchen', 'Floor 1 · Kitchen', 'shipped', 1],
  ['Finance archive', 'Floor 3 · Finance', 'arrived', 1],
  ['Sales printer', 'Floor 2 · Sales', 'arrived', 1],
  ['Bookshelf A', 'Floor 2 · Library', 'unpacked', 3],
  ['Bookshelf B', 'Floor 2 · Library', 'unpacked', 3],
  ['AV cart', 'Floor 4 · Studio', 'unpacked', 3],
  ['Chairs', 'Floor 1 · Reception', 'unpacked', 3],
];

/** [name, category, serial, qty, box, item status, note] */
const ITEMS = [
  // open boxes — still being packed
  ['Thunderbolt 4 cable', 'cable', null, 12, 1, 'packed', 'assorted lengths'],
  ['USB-C to HDMI adapter', 'cable', null, 4, 1, 'packed', null],
  ['Patch panel labels', 'network', null, 1, 1, 'packed', 'do not lose these'],
  ['Dell dock WD19', 'peripheral', 'WD19-4471', 1, 2, 'packed', null],
  ['Logitech MX Keys', 'input', 'MXK-2210', 1, 2, 'packed', null],
  ['Monitor stand', 'monitor', null, 1, 2, 'packed', null],
  // sealed
  ['Studio iMac', 'mac', 'C02XK1ZZJGH5', 1, 3, 'packed', 'boxed with original foam'],
  ['Wacom tablet', 'peripheral', null, 1, 3, 'packed', null],
  ['Colour swatch books', 'other', null, 3, 3, 'packed', null],
  ['Reference prints', 'other', null, 1, 3, 'packed', 'fragile — keep flat'],
  ['Meeting room display', 'monitor', 'LG-55UR', 1, 4, 'packed', null],
  ['Conference camera', 'peripheral', null, 1, 4, 'packed', null],
  ['Whiteboard markers', 'accessory', null, 24, 4, 'packed', null],
  ['HDMI cables (long)', 'cable', null, 6, 4, 'packed', null],
  // shipped
  ['Rack server', 'server', 'SRV-0041', 1, 5, 'shipped', 'handled by the moving company'],
  ['Switch 24-port', 'network', 'SW-24P-118', 1, 5, 'shipped', null],
  ['UPS', 'server', null, 1, 5, 'shipped', 'heavy'],
  ['NAS (4 bay)', 'storage', 'NAS-4412', 1, 5, 'shipped', null],
  ['Espresso machine', 'other', null, 1, 6, 'shipped', 'fragile'],
  ['Kettle ×2', 'other', null, 2, 6, 'shipped', null],
  ['Mugs', 'other', null, 24, 6, 'shipped', null],
  ['Cutlery tray', 'other', null, 1, 6, 'shipped', null],
  // arrived, still packed
  ['Invoice binders 2023–25', 'other', null, 6, 7, 'shipped', null],
  ['Shredder', 'other', null, 1, 7, 'shipped', null],
  ['Filing trays', 'other', null, 4, 7, 'shipped', null],
  ['Office laser printer', 'printer', 'HL-L8360', 1, 8, 'shipped', 'toner removed'],
  ['Paper boxes', 'other', null, 8, 8, 'shipped', null],
  ['Stapler + punch', 'accessory', null, 2, 8, 'shipped', null],
  // unpacked
  ['Art books', 'other', null, 18, 9, 'delivered', null],
  ['Design annuals', 'other', null, 9, 9, 'delivered', null],
  ['Paperbacks', 'other', null, 22, 10, 'delivered', null],
  ['Magazine archive', 'other', null, 14, 10, 'delivered', null],
  ['Projector', 'peripheral', 'PJ-X300', 1, 11, 'delivered', null],
  ['Speaker pair', 'accessory', null, 2, 11, 'delivered', null],
  ['Microphone kit', 'accessory', null, 1, 11, 'delivered', null],
  ['Office chairs', 'furniture', null, 6, 12, 'delivered', null],
  ['Visitor chairs', 'furniture', null, 3, 12, 'delivered', null],
  ['Coat stand', 'furniture', null, 1, 12, 'delivered', null],
  // still in the old office
  ['MacBook Pro 16"', 'mac', 'C02ZQ0ABCD12', 1, null, 'in_office', 'Ali — take it home'],
  ['MacBook Air M3', 'mac', 'C02AB1CDEF34', 1, null, 'in_office', null],
  ['iMac 27" (reception)', 'mac', 'C02IMAC27A1', 1, null, 'in_office', null],
  ['Office laser printer (spare)', 'printer', null, 1, null, 'in_office', 'stays until the last day'],
  ['Router / firewall', 'network', 'FG-60F', 1, null, 'in_office', null],
  ['Key cabinet', 'furniture', null, 1, null, 'in_office', null],
  ['Archive hard drives', 'storage', null, 5, null, 'in_office', 'lockable case'],
  ['Cleaning supplies', 'other', null, 1, null, 'in_office', null],
];

db.exec('BEGIN');
try {
  db.exec('DELETE FROM items');
  db.exec('DELETE FROM boxes');
  const insertBox = db.prepare(
    'INSERT INTO boxes (id, label, destination, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  BOXES.forEach(([label, destination, status, days], index) => {
    const created = daysAgo(days, 9);
    insertBox.run(index + 1, label, destination, status, created, daysAgo(days - 1 > 0 ? days - 1 : 0, 14));
  });

  const insertItem = db.prepare(`
    INSERT INTO items (name, category, serial, quantity, notes, destination, status, box_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  ITEMS.forEach(([name, category, serial, quantity, boxId, status, notes], index) => {
    const created = daysAgo(boxId === null ? 1 : 2, 8 + (index % 8));
    insertItem.run(name, category, serial, quantity, notes, null, status, boxId, created, created);
  });
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}

const counts = db.prepare('SELECT status, COUNT(*) AS n FROM items GROUP BY status ORDER BY status').all();
const boxCount = db.prepare('SELECT COUNT(*) AS n FROM boxes').get().n;
console.log(`✓ demo move seeded — ${ITEMS.length} items, ${boxCount} boxes`);
console.log('  ' + counts.map((c) => `${c.status}: ${c.n}`).join(' · '));
console.log(`  ${dbPath}`);
db.close();
