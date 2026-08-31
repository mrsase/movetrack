import { networkInterfaces } from 'node:os';
import { createApp } from './app.js';
import { openDb } from './db.js';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = '0.0.0.0';

const db = openDb();
const app = createApp(db);

const server = app.listen(PORT, HOST, () => {
  const lan = lanAddresses();
  console.log('');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  office-move inventory server is running    │');
  console.log('  └──────────────────────────────────────────────┘');
  console.log(`   Local:   http://localhost:${PORT}`);
  for (const addr of lan) {
    console.log(`   Network: http://${addr}:${PORT}   (phone on same Wi-Fi)`);
  }
  console.log('');
});

function lanAddresses(): string[] {
  const out: string[] = [];
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) out.push(addr.address);
    }
  }
  return out;
}

function shutdown(signal: string) {
  console.log(`\n[server] ${signal} — shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  // Force-exit if connections hang.
  setTimeout(() => process.exit(1), 3000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));