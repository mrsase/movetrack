# Validation — v1.0.0

**Question:** does a real user, in a real browser, complete the move without surprises?

Two sessions were run against the **production build** served by
`server/dist/index.js`:

1. **Clean database** (`DB_PATH=/tmp/mt-ui.db`, port 4001) — the first-run experience.
2. **Demo database** (46 items / 12 boxes, port 4000) — the screenshot and label pass.

## 1. Clean database — the whole lifecycle through the UI

Viewport 390 × 844 (phone), Chromium, no console errors at any step.

| Step | Action | Observed |
| --- | --- | --- |
| 1 | Empty dashboard | 0/0, empty state, export card present |
| 2 | New box → label “UI validation box”, deliver to “Floor 9 · QA” | Created, lands on the box screen, toast confirms |
| 3 | Add item → “UI validation laptop”, category *PC / Laptop*, serial `UIVAL-001` | Created, lands on the item, serial displayed |
| 4 | Pack into box → choose the open box | Item becomes **Packed**, box shows “1 item” |
| 5 | Seal | Box **Sealed**; packing another item into it is refused (tested separately in smoke) |
| 6 | Ship it | Box **Shipped**, item **Shipped** |
| 7 | Arrived | Box **Arrived** |
| 8 | Unpack all | Box **Unpacked**, item **Delivered**, “Everything in this box was delivered.” |
| 9 | Back to Overview | 1/1 progress, In office 0 · Packed 0 · Shipped 0 · Delivered 1 · Boxes 1 |

The second run of this script (after the cache fix) reported exactly those
numbers, confirming no stale dashboard.

## 2. Demo database — labels and print

- Dashboard: 46 items, 10/46 delivered, 12 boxes (2 open · 2 sealed · 2 shipped · 2 arrived · 4 unpacked).
- Boxes → **Labels**: 8 labels (unpacked boxes correctly excluded).
- Print emulation (`page.emulateMediaType('print')`):
  - `.nav` → `display: none`
  - label box → **340 × 227 px = 90 × 60 mm**
  - label background `rgb(255,255,255)`, text `rgb(0,0,0)`, body background white
  - grid → two columns
- Screenshots: `docs/screenshots/labels-print.png`, `home-phone.png`, `items-phone.png`, `boxes-phone.png`, `labels-phone.png`, `home-desktop.png`.

## 3. Defects found during validation — all fixed

| # | Defect | Evidence | Fix |
| --- | --- | --- | --- |
| V1 | Progress bars never rendered | `.progress__fill` was an inline `<span>`; `width: 22%` and `height: 100%` were ignored (`getBoundingClientRect().width === 0`) | `display: block` on the fill |
| V2 | “Try again” did nothing | Retry only cleared state; the fetch effect's dependencies had not changed | `useRefreshKey()` token added to every data-loading view's deps (6 views) + regression test |
| V3 | Dashboard could show a stale status mix | After a rapid seal→ship→arrive→unpack sequence, a tab switch briefly showed `Shipped 1` alongside `Delivered 1` | API responses now send `Cache-Control: no-store`; re-ran the sequence and got a consistent 0/0/0/1 |
| V4 | `npm run demo` seeded the wrong file | `DB_PATH=data/demo.db` resolved against the repo root, creating an empty `/data/demo.db` | Demo script passes an absolute path; `/data/` is git-ignored |
| V5 | Categories could not describe printers, servers or switches | The recorded move filed printers under “Mac” | `printer`, `server`, `network` added end to end (enum, labels, colours, icons) |
| V6 | New items defaulted to the `mac` category | Form default | Defaults to `other`; test updated |
| V7 | Desktop stat grid left an orphan tile | 5 stats in a 4-column grid | 5 columns from 560 px up |

## Not validated

- Physical printing on paper (layout verified in print emulation only).
- iOS Safari / Android Chrome device testing (Chromium desktop + mobile viewport used).
- Multi-phone concurrency during a real move.
