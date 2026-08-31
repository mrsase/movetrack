# MoveTrack — office move inventory

A tiny, mobile-first inventory system for the chaos of relocating an office.
Register every asset from your phone, pack it into a box, then follow the box
through sealing, shipping, arrival and unpacking — one tap per step.

The server runs on your machine (Node + Express + SQLite, zero native deps);
the single-page app opens in the phone browser over your Wi-Fi.

![stack](https://img.shields.io/badge/stack-React_19_%2B_Vite_%2B_Express_5_%2B_SQLite-0c0f14?style=flat) [![license](https://img.shields.io/badge/license-MIT-0c0f14)](#license)

---

## Quick start

Requires **Node ≥ 22.5** (uses the built-in `node:sqlite` module).

```bash
# first time only — install root + server + client dependencies
npm run setup

# development (API on :4000, web on :5173, proxy wired)
npm run dev

# production (builds both, serves the app from the same server)
npm run build
npm start            # → http://localhost:4000
```

Typecheck, lint, test and build — from the root:

```bash
npm run typecheck   # tsc strict, both packages
npm run lint        # eslint 10 flat config, both packages
npm test            # vitest — 26 server (supertest) + 26 client tests
npm run build       # tsc server + vite client
```

## Using it from your phone

1. Start the server (`npm start` or `npm run dev`) on your Mac.
2. Find your Mac's LAN address: `ipconfig getifaddr en0` (e.g. `192.168.1.42`).
3. On your phone, connected to the **same Wi-Fi**, open `http://192.168.1.42:4000`.
4. The startup banner prints every detected address for you.

Your Mac is the server; every phone on the network can register items at the
same time. The database lives in `server/data/move.db` — back it up before a
big packing session (`cp server/data/move.db ~/move-backup-$(date +%F).db`);
the server runs with SQLite WAL mode, safe to copy while running.

## The workflow

| Step | What happens |
| --- | --- |
| **Add item** | Name + category chip + optional serial / quantity / destination room / notes. Default status: *In office*. |
| **Pack** | From an item: pick an open box (or create one on the fly). Item becomes *Packed*. |
| **Seal / Reopen** | Taping the box. Reopen if you forgot something — adding is blocked once sealed. |
| **Ship** | The box moves. Every item inside becomes *Shipped*. |
| **Arrive** | Box reached the new office. |
| **Unpack** | Everything inside becomes *Delivered*. |

Items can also be moved directly (e.g. you carried the router by hand):
*Mark delivered*, and *Unpack back to the office* rescues mistakes.

The dashboard shows registration progress, per-status counts, category
breakdown, boxes progress and recently added items — one glance tells you how
much is left to pack.

## Project structure

```
office-move/
├── package.json          # root scripts: dev / build / start / lint / test
├── server/               # Express 5 API  (port 4000)
│   ├── src/
│   │   ├── index.ts      # entry — binds 0.0.0.0, prints LAN URLs
│   │   ├── app.ts        # app factory (mounts routers, serves built client)
│   │   ├── db.ts         # node:sqlite open + WAL + migrations
│   │   ├── schema.ts     # idempotent DDL
│   │   ├── validate.ts   # hand-rolled input validation
│   │   └── routes/       # items / boxes / stats
│   └── test/             # supertest + vitest, in-memory DB per test
└── client/               # Vite + React 19 SPA (mobile-first)
    ├── src/
    │   ├── views/        # Home, Items, ItemForm, ItemDetail, Boxes, BoxDetail, BoxForm
    │   ├── components/   # nav, sheets, chips, rows, toasts…
    │   ├── lib/          # status/category metadata, formatting, filters
    │   └── theme.css     # whole design system — dark, amber, zero frameworks
    └── public/favicon.svg
```

## Decisions worth knowing

- **`node:sqlite`** (`DatabaseSync`) instead of `better-sqlite3` — the SQLite
  module ships with Node ≥ 22.5, so there are no native build steps anywhere.
- **No UI framework, no state library** — plain React + fetch + a 10-line pub/sub
  bus for cross-view refresh. The whole app is ~237 KB (71 KB gzipped) before
  any framework tax.
- **Server-side filtering** for item search/status; the API speaks 400/404/409
  with JSON error bodies the UI surfaces directly as toasts.
- **One-way box transitions** are enforced on the server (`seal → ship →
  arrive → unpack`), so a box can never jump states by accident.

## API surface

```
GET  /api/health
GET  /api/stats                              dashboard numbers
GET  /api/items?q=&status=&category=&box=&limit=&offset=
POST /api/items                               { name*, category, serial, quantity, notes, destination }
GET  /api/items/:id
PATCH /api/items/:id                          { name, category, serial, quantity, notes, destination, status }
DELETE /api/items/:id
POST   /api/items/:id/box { box_id }          pack into an open box
DELETE /api/items/:id/box                     take back out
GET  /api/boxes                               with item counts
POST /api/boxes                               { label?, destination? } — auto-named "Box N"
GET  /api/boxes/:id                           box + contents
PATCH /api/boxes/:id                          { label, destination }
POST /api/boxes/:id/action                    { action: seal|reopen|ship|arrive|unpack }
DELETE /api/boxes/:id                         contents return to "in office"
```

Environment: `PORT` (default 4000), `DB_PATH` (default `server/data/move.db`).

## License

MIT — do whatever you want with it; your move is the interface.