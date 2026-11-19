# Test plan — MoveTrack v1.0

**Purpose:** prove the v1.0 scope without a browser where possible, and prove the browser
path exactly once in validation.

## Layers

| Layer | Tool | Where | What it must catch |
| --- | --- | --- | --- |
| Unit (pure) | vitest | `server/src/csv.ts`, `client/src/lib/*` | quoting, BOM, formula prefixing, labels, filters |
| Route | vitest + supertest | `server/test/*.test.ts` | status codes, validation, transitions, transaction safety |
| Component | vitest + Testing Library | `client/src/views/*.test.tsx` | empty states, rendering, user flows |
| Contract | `npm run smoke` | `scripts/smoke.mjs` | the lifecycle a real client performs, on a real port and a real database file |
| Visual / manual | browser + screenshots | `docs/validation.md` | layout, print, phone viewport |

## Cases added in v1.0

### Export — `server/test/export.test.ts`

1. `items.csv` returns 200, `text/csv`, a BOM, and a header row naming the 12 columns.
2. Rows reflect every item, in id order, with the box label joined.
3. A name containing a comma, a quote and a newline survives a round trip through a CSV parser.
4. A name beginning with `=` gets the `'` guard, so a spreadsheet cannot execute it.
5. Quantities and ids stay numeric (no quoting, no guard).
6. `boxes.csv` includes computed `items_total`.
7. `backup.json` has `app`, `version: 1`, `exported_at`, and both arrays.
8. Export → import into a fresh app reproduces every row, ids and timestamps included.
9. Import replaces existing data rather than merging.
10. Import without `confirmation: "replace-all"` → 400 and zero writes.
11. Wrong `version` → 400, data unchanged.
12. Unknown category → 400, data unchanged.
13. `box_id` pointing at a box not in the payload → 400, data unchanged.
14. Duplicate ids → 400.
15. Empty database exports valid headers and an empty backup.

### Categories — `client/src/lib/categories.test.ts`

16. Every server category has a label and a colour (including `printer`, `server`, `network`).
17. Unknown categories degrade to their raw value and the muted colour instead of throwing.

### Print labels — `client/src/views/Labels.test.tsx`

18. Renders one label per active box, skipping unpacked boxes by default.
19. `?box=3` filtering is honoured by the view's `onlyBoxId` prop.
20. Empty state when there are no boxes to print.

### Smoke — `scripts/smoke.mjs`

21. Health → create box → create item → pack → seal → ship (item follows) → arrive →
    unpack (item delivered).
22. Transitions out of order are refused (409).
23. Exports return the expected counts; CSV parses back to the created rows.
24. Backup restore into a second database returns identical counts.
25. Server starts on a throwaway database and always exits 0/1 cleanly.

## Rules

- One database per test (`openDb(':memory:')`); no ordering dependencies.
- No network, no timers, no fixed sleeps. The smoke script polls health with a deadline.
- Failure messages name the field, not just the status code.
- Coverage is not a target; the **failure modes above** are.

## Out of scope

Browser automation of the full move flow (done manually in validation), load testing,
multi-client concurrency beyond SQLite's single-writer guarantee.
