# Release record — v1.0.0

**Shipped:** 2026-11-19 · **Repository:** <https://github.com/mrsase/movetrack> (public, MIT)

## Gate results at the tagged commit

| Gate | Result |
| --- | --- |
| `npm run verify` (local) | ✅ types, lint, 72 tests, production build |
| `npm run smoke` (local) | ✅ 25 end-to-end checks |
| GitHub Actions `CI` | ✅ [run 44608054532](https://github.com/mrsase/movetrack/actions/runs/44608054532) — `verify (node 24)` in 1m31s |
| Data hygiene | ✅ no `.db`, `.xlsx`, `.env` or build output in the tree or history |
| License | ✅ MIT |

## What shipped

- Four commits on `main`: product (33d45ad), tests (b48bd6d), docs + CI (b8899ec), CI fix (5fce9a4).
- 100 tracked files: server, client, tests, smoke script, six screenshots, six process documents.
- Repository topics: `inventory`, `office-move`, `sqlite`, `react`, `express`, `local-first`,
  `nodejs`, `pwa`, `typescript`.

## Why it stopped here

The acceptance criteria in `docs/v1-design.md` §7 are met. The remaining ideas (QR labels, photos,
LAN auth) are product expansions, not closure work; they are listed in the README roadmap and in
`docs/evaluation.md` as deliberate exclusions.

## First-week watch list

- Any `npm ci` failure on a clean runner (the lockfiles were generated on npm 11.19).
- Feedback on print scaling: the label is exactly 90 × 60 mm, but printers may default to “fit”.
- Whether `node:sqlite` warnings on Node 22/24 confuse first-time users (noise only; documented).


---

# v1.1.0 — frontend redesign

**Shipped:** 2026-11-20 · tag `v1.1.0`

## What changed

- Replaced the v1.0 visual world (rounded cards, gradient progress, pill chips, dark-only)
  with a concrete-and-hazard warehouse manifest: box tiles on the floor, status stamps,
  Archivo variable, light default with a dark theme.
- New first screen: every box as a numbered tile with destination, contents and state;
  counts band; loose items; paperwork.
- Removed the floating action (covered row controls); actions live in headers.
- Fixed the brand bar spanning less than the app and overlapping content.
- Self-hosted Archivo (OFL) with preload; no runtime font request.
- New design documentation: `PRODUCT.md`, `docs/DESIGN.md`, `.impeccable/surfaces/app-overview.md`.

## Gates

| Gate | Result |
| --- | --- |
| `npm run verify` | ✅ types, lint, 72 tests, build |
| `npm run smoke` | ✅ 25 end-to-end checks |
| Impeccable detector | ✅ 0 findings, rendered page and source |
| Visual review | ✅ 390 / 768 / 1280, light + dark, print 90 × 60 mm |
| CI | see the run for the `v1.1.0` tag |
