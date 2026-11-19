#!/usr/bin/env node
/**
 * End-to-end smoke test: starts the real server on a throwaway database and
 * drives the lifecycle the way the app does, then proves export and restore.
 *
 * Run after `npm run build` (CI runs both in order).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const entry = join(root, 'server', 'dist', 'index.js');

if (!existsSync(entry)) {
  console.error('✖ server/dist/index.js is missing — run `npm run build` first.');
  process.exit(1);
}

let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
  console.log(`  ✓ ${message}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer(dbPath, port) {
  const proc = spawn(process.execPath, [entry], {
    env: { ...process.env, PORT: String(port), DB_PATH: dbPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  proc.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(500) });
      if (res.ok) return { proc, base, stderr: () => stderr };
    } catch {
      // not up yet
    }
    await sleep(100);
  }
  proc.kill('SIGKILL');
  throw new Error(`server did not start on ${port}\n${stderr}`);
}

async function stopServer(server) {
  if (server.proc.exitCode !== null) return;
  server.proc.kill('SIGTERM');
  const exited = new Promise((resolve) => server.proc.once('exit', resolve));
  const timeout = sleep(4000).then(() => 'timeout');
  if ((await Promise.race([exited, timeout])) === 'timeout') server.proc.kill('SIGKILL');
}

async function call(base, method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Decode the raw bytes so a UTF-8 BOM survives: fetch's res.text() strips it.
  const text = Buffer.from(await res.arrayBuffer()).toString('utf8');
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: res.status, json, text, headers: res.headers };
}

const dir = mkdtempSync(join(tmpdir(), 'movetrack-smoke-'));
const portA = 42000 + Math.floor(Math.random() * 400);
const portB = portA + 1;
let first;
let second;

try {
  console.log('› lifecycle');
  first = await startServer(join(dir, 'a.db'), portA);

  const box = await call(first.base, 'POST', '/api/boxes', { label: 'Smoke box', destination: 'QA room' });
  assert(box.status === 201, 'box created (201)');
  assert(box.json.label === 'Smoke box', 'explicit label kept');

  const nasty = 'Smoke item, "quoted"\nsecond line';
  const item = await call(first.base, 'POST', '/api/items', {
    name: nasty,
    category: 'network',
    quantity: 2,
    notes: '=SUM(A1)',
  });
  assert(item.status === 201, 'item created (201)');
  assert(item.json.status === 'in_office', 'new item starts in_office');

  const packed = await call(first.base, 'POST', `/api/items/${item.json.id}/box`, { box_id: box.json.id });
  assert(packed.status === 200 && packed.json.status === 'packed', 'item packed into the open box');

  const sealed = await call(first.base, 'POST', `/api/boxes/${box.json.id}/action`, { action: 'seal' });
  assert(sealed.json.status === 'sealed', 'box sealed');

  const late = await call(first.base, 'POST', '/api/items', { name: 'Late item', category: 'other' });
  const latePack = await call(first.base, 'POST', `/api/items/${late.json.id}/box`, { box_id: box.json.id });
  assert(latePack.status === 409, 'sealed box refuses new items (409)');

  const shipped = await call(first.base, 'POST', `/api/boxes/${box.json.id}/action`, { action: 'ship' });
  assert(shipped.json.status === 'shipped', 'box shipped');
  const afterShip = await call(first.base, 'GET', `/api/items/${item.json.id}`);
  assert(afterShip.json.status === 'shipped', 'shipping moves its items to shipped');

  const arrived = await call(first.base, 'POST', `/api/boxes/${box.json.id}/action`, { action: 'arrive' });
  assert(arrived.json.status === 'arrived', 'box arrived');

  const unpacked = await call(first.base, 'POST', `/api/boxes/${box.json.id}/action`, { action: 'unpack' });
  assert(unpacked.json.status === 'unpacked', 'box unpacked');
  const afterUnpack = await call(first.base, 'GET', `/api/items/${item.json.id}`);
  assert(afterUnpack.json.status === 'delivered', 'unpacking delivers its items');

  const illegal = await call(first.base, 'POST', `/api/boxes/${box.json.id}/action`, { action: 'seal' });
  assert(illegal.status === 409, 'sealing an unpacked box is refused (409)');

  console.log('› export');
  const itemsCsv = await call(first.base, 'GET', '/api/export/items.csv');
  assert(itemsCsv.status === 200, 'items.csv returns 200');
  assert(itemsCsv.text.startsWith('\uFEFF'), 'CSV starts with a UTF-8 BOM');
  assert(itemsCsv.text.includes('""quoted""'), 'quotes are doubled in CSV');
  assert(itemsCsv.text.includes("'=SUM(A1)"), 'formula-looking notes are neutralised');
  assert(/(^|,|\r\n)2,delivered,/.test(itemsCsv.text), 'quantity 2 appears unquoted');

  const boxesCsv = await call(first.base, 'GET', '/api/export/boxes.csv');
  assert(boxesCsv.status === 200 && boxesCsv.text.includes(',QA room,1,'), 'boxes.csv carries item counts');

  const backup = await call(first.base, 'GET', '/api/export/backup.json');
  assert(backup.status === 200 && backup.json.version === 1, 'backup.json is versioned');

  console.log('› restore into a second, empty instance');
  second = await startServer(join(dir, 'b.db'), portB);
  const restored = await call(second.base, 'POST', '/api/import/backup', {
    ...backup.json,
    confirmation: 'replace-all',
  });
  assert(restored.status === 200, 'restore accepted');
  assert(restored.json.imported.items === backup.json.items.length, 'item count survived the round trip');
  assert(restored.json.imported.boxes === backup.json.boxes.length, 'box count survived the round trip');

  const statsA = await call(first.base, 'GET', '/api/stats');
  const statsB = await call(second.base, 'GET', '/api/stats');
  assert(JSON.stringify(statsA.json) === JSON.stringify(statsB.json), 'both instances report identical stats');

  const rejected = await call(second.base, 'POST', '/api/import/backup', {
    ...backup.json,
    version: 99,
    confirmation: 'replace-all',
  });
  assert(rejected.status === 400, 'a backup with the wrong version is rejected (400)');

  console.log(`\n✓ smoke passed — ${checks} checks, databases in ${dir}`);
  for (const server of [first, second]) await stopServer(server);
  rmSync(dir, { recursive: true, force: true });
  process.exit(0);
} catch (err) {
  console.error(`\n✖ smoke failed after ${checks} checks`);
  console.error(err instanceof Error ? err.message : err);
  if (first) {
    const stderr = first.stderr();
    if (stderr) console.error('--- server stderr ---\n' + stderr);
  }
  for (const server of [first, second]) if (server) await stopServer(server);
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}
