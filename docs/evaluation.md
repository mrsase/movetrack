# Evaluation — v1.0.0

**Question:** is this worth shipping as-is, and what would make it fail in public?

## Measurements

| Metric | Value | How |
| --- | --- | --- |
| Source (server + client + tests + scripts + CSS) | **6,478 lines** | `wc -l` over `*.ts/tsx/mjs/css`, excluding `dist`/`node_modules` |
| Automated tests | **72** (41 server, 31 client) | `npm test` |
| End-to-end checks | **25** | `npm run smoke` |
| JS bundle | **241.83 kB / 72.41 kB gzip** | Vite build |
| CSS bundle | **17.09 kB / 4.29 kB gzip** | Vite build |
| Client build | **~0.2 s** | Vite build |
| Server build | **~1.5 s** | `tsc` |
| Full verify (types + lint + tests + build) | **~25 s** | `npm run verify` |
| Runtime dependencies | Express 5, cors, React 19, react-dom | `package.json` |
| Native dependencies | **0** | `node:sqlite` ships with Node ≥ 22.13 |
| Demo database | 40 kB (46 items, 12 boxes) | `server/data/demo.db` |
| Disk footprint of the repo (source + docs + screenshots) | < 1 MB | `du` |

## Strengths

- **The state machine is real.** Box transitions are one-way and enforced server-side;
  item status is derived from the box, with explicit escapes for “carried by hand”.
  This is the part most inventory demos get wrong.
- **Destructive restore is guarded three ways:** confirmation token, full validation
  before any write, single `BEGIN IMMEDIATE` transaction. Tests prove a rejected
  import leaves the database unchanged.
- **Export is boring on purpose:** RFC 4180, UTF-8 BOM, formula neutralisation, joined
  box labels. It opens in Excel and survives a round trip.
- **Zero native modules and zero cloud.** `git clone && npm run demo` works on any
  machine with Node 22.13+, including a fresh laptop on moving day.
- **The print path is measured, not hoped for:** 90 × 60 mm exactly, two-up, chrome hidden.

## Weaknesses, honestly

| Weakness | Impact | Mitigation / next |
| --- | --- | --- |
| No authentication | Anyone on the LAN can read/write the move | Documented as a LAN tool; v2 could add a shared token |
| Single-writer SQLite | Two phones writing simultaneously serialize | Fine at human speed; documented |
| No photos / barcode scanning | A box cannot be identified by scanning | Natural v1.1; would need a QR dependency |
| Demo seed is fixed | Not a generator with random data | Deterministic is better for screenshots; `--force` reseeds |
| Print verified in emulation only | A printer may scale differently | README tells the user “actual size”, 90 × 60 mm |
| No offline shell | Loses the app if the Mac sleeps | Out of scope for v1; LAN + local server is the design |

## Go / no-go

**GO.** Every acceptance criterion in `docs/v1-design.md` §7 is met except A10 (public
repo + tag), which is the ship step immediately after this document. The remaining
weaknesses are product decisions, not defects, and each is written down rather than
hidden.

## What would make me revisit

- A real move producing > 200 items: pagination is 100/500 already, but the items
  screen requests 200 — worth revisiting only with evidence.
- A second concurrent writer corrupting state: SQLite WAL + single statements make
  this unlikely, but a `BEGIN IMMEDIATE` around multi-row box actions (ship/unpack)
  would be the first hardening step.
