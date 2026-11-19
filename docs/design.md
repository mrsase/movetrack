# Design — MoveTrack v1.0

**Status:** frozen 2026-11-19 · **Owner:** @mrsase · **Target:** public `v1.0.0`

## 1. Why this project is the one

MoveTrack is the closest thing in the workspace to a finished product: 16 commits, five
merged feature branches, 52 passing tests, a production launcher, and a real move recorded
through it (47 assets over three days). What it lacks is not features but an exit: no
export, no demo, no print path, no license, no CI, no public repository.

Finishing it is therefore a *closure* exercise, not a rewrite. The codebase stays small
(≈5.2k lines) and every addition has to earn its place.

## 2. The promise

> Register every asset from your phone, pack it into a box, and follow the box through
> sealing, shipping, arrival and unpacking. One command, local-first, no accounts, no cloud.

## 3. Scope — the four things that make it shippable

### F1 · Export and backup *(the missing exit)*

| Endpoint | Response |
| --- | --- |
| `GET /api/export/items.csv` | Every item, box label joined, RFC 4180, UTF-8 BOM for Excel |
| `GET /api/export/boxes.csv` | Every box with item counts |
| `GET /api/export/backup.json` | `{ app, version: 1, exported_at, boxes[], items[] }` — full, restorable |
| `POST /api/import/backup` | Replace-all restore, single transaction, ids preserved |

Restore requires the literal body field `"confirmation": "replace-all"`. Without it the
request is rejected before touching the database. Validation runs before the first write;
a rejected import leaves the existing data byte-identical (covered by a test).

CSV cells beginning with `=`, `+`, `@` or a control character are prefixed with `'` to
neutralise spreadsheet formula injection. Quoting follows RFC 4180; `\r\n` line endings.

### F2 · A demo you can run in one command

`npm run demo` builds once, seeds `server/data/demo.db` with a believable half-finished
move (12 boxes, 46 items across every status and category), and serves the production app.
Seeding is idempotent; `--force` reseeds. This is the "Explore visitor" path: clone, two
commands, see a populated product instead of an empty state.

### F3 · Printable box labels

A `labels` screen renders one label per active box (90 × 60 mm, two-up) with label text,
destination, item count and the checkout URL. `Print` triggers the browser dialog; print
styles hide navigation, FAB, toasts and the app frame. A `?box=<id>` filter prints a single
label, so you can reprint one box at a time.

### F4 · Release surface

Manifest + icons (Add to Home Screen), correct `theme-color`, MIT license, CI on Node 24,
`npm run verify` and `npm run smoke`, README with real screenshots, `v1.0.0` tag and
release notes.

### Defect fixes carried in this release

- Category set could not describe a printer, a server or a switch — the recorded move shows
  printers and network gear filed under "Mac". Add `printer`, `server`, `network` to the
  shared enum, labels, colours and icons.
- New-item form defaulted to the `mac` category, quietly miscategorising anything else.
  Default is now `other`.

## 4. Non-goals

No accounts, auth, roles, cloud sync, multi-tenant storage, photo attachments, barcode/QR
scanning, offline service worker, CSV *import*, or Windows launcher. Each is a real
product decision that belongs to a v2 with users, not to the closure of v1.

## 5. Data model (unchanged)

```
boxes(id, label, destination, status ∈ open|sealed|shipped|arrived|unpacked, created_at, updated_at)
items(id, name, category, serial, quantity≥1, notes, destination,
      status ∈ in_office|packed|shipped|delivered, box_id → boxes.id ON DELETE SET NULL,
      created_at, updated_at)
```

Box transitions stay one-way on the server (`seal → ship → arrive → unpack`, plus
`reopen` from `sealed`). Item status is a consequence of the box, except for the explicit
"carried by hand" actions already in the UI.

Backup format is versioned (`version: 1`) and stores timestamps verbatim. Restore is
replace-all because a merge would need identity rules the product does not have yet.

## 6. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Destructive restore loses data | Confirmation token, validate-before-write, transaction, test that a rejected import changes nothing |
| CSV breaks in Excel (encoding, quotes, formulas) | BOM, RFC 4180 quoting, formula-prefix neutralisation, golden test |
| Print layout bleeds app chrome | `@media print` rules + visual check in the validation phase |
| Demo database leaks into a real move | Demo uses `data/demo.db`; `.gitignore` covers `server/data/`; `npm start` keeps the real DB |
| Node 22.5–22.12 users hit the sqlite flag | `engines.node >= 22.13.0`, stated in README and enforced by CI |
| Public repo exposes real asset data | `office-move-items.xlsx`, `*.db`, `data/` ignored; history checked before publishing |

## 7. Acceptance criteria

Each is observable and has a command or a screenshot behind it.

| # | Criterion | Proven by |
| --- | --- | --- |
| A1 | Fresh clone → `npm run setup && npm run demo` serves a populated app with 12 boxes and 46 items | validation §1 (clean DB, curl counts) |
| A2 | Full lifecycle works over HTTP: open → seal → ship → arrive → unpack, item statuses follow | `npm run smoke` |
| A3 | CSV exports match the database exactly (count, quoting, BOM) | `server/test/export.test.ts` |
| A4 | Backup → import roundtrip restores identical rows, ids included | `server/test/export.test.ts` |
| A5 | Bad imports (version, unknown category, dangling `box_id`, missing confirmation) are rejected and leave data unchanged | `server/test/export.test.ts` |
| A6 | `npm run verify` is green: typecheck, lint, tests, production build | `docs/verification.md` |
| A7 | The print view shows one label per active box and hides chrome when printing | validation §4 + screenshot |
| A8 | A stranger can install and run it from the README alone | ship checklist |
| A9 | No secrets or personal asset data in the repository or its history | history grep before push |
| A10 | Public repo has green CI and a `v1.0.0` release | GitHub Actions run + release URL |

## 8. Rollout

1. Land F1+F2+F3 with tests on `main` locally.
2. Run verify + smoke; record in `verification.md`.
3. Drive the UI, capture screenshots, record in `validation.md`.
4. Measure and write `evaluation.md` — go/no-go.
5. Publish `mrsase/movetrack` (public), push `main`, tag `v1.0.0`, attach release notes.
