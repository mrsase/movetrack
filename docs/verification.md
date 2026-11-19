# Verification — v1.0.0

**Date:** 2026-11-19 · **Machine:** macOS 14 (x64) · **Node:** v26.7.0 · **npm:** 11.19.0
**Gate:** `npm run verify` + `npm run smoke`

## Results

| Gate | Command | Result |
| --- | --- | --- |
| Types (server) | `tsc --noEmit` | ✅ 0 errors |
| Types (client, app + node configs) | `tsc --noEmit -p …` | ✅ 0 errors |
| Lint (server, client) | `eslint .` (flat config) | ✅ 0 errors, 0 warnings |
| Unit/route tests (server) | `vitest run` | ✅ 4 files, **41 tests** |
| Component tests (client) | `vitest run` (jsdom) | ✅ 6 files, **31 tests** |
| Production build | `tsc -p tsconfig.build.json` + `vite build` | ✅ 47 modules, `index-*.js` 241.83 kB (72.41 kB gzip), CSS 17.09 kB (4.29 kB gzip) |
| End-to-end smoke | `node scripts/smoke.mjs` | ✅ **25 checks**, two live servers, two databases |
| Demo seed | `node server/scripts/seed-demo.mjs --force` | ✅ 46 items, 12 boxes, deterministic |

`npm run verify` exits 0. `npm run smoke` exits 0.

## What the smoke run actually proves

It starts `server/dist/index.js` on a temporary port with `DB_PATH` in a temp
directory, drives the API, then starts a **second** instance and restores the
first one's backup into it:

```
box created → item created → packed → sealed → ship (item follows) →
arrive → unpack (item delivered) → illegal transition refused (409)
items.csv (BOM, quoting, formula guard, numbers) · boxes.csv (counts)
backup.json version 1 → restore into fresh DB → identical /api/stats
wrong backup version refused (400)
```

Both servers are terminated and the temp directory removed, whether the run
passes or fails.

## Environment caveat

`npm run setup` originally used `npm --prefix server install`. With npm 11 and a
user-level `allow-scripts` setting this fails with `EALLOWSCRIPTS`. The script now
uses subshells (`(cd server && npm install)`) and a separate `npm run ci` uses
`npm ci` per package. This was found and fixed during verification — the README
and CI both depend on it.

## Not covered here

- Browser-driven flow → `validation.md`.
- Windows launcher (out of scope; `run.command` is macOS-only).
- Load/concurrency beyond SQLite's single-writer model.
