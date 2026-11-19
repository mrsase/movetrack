# PRODUCT.md

**MoveTrack** · office-move inventory · v1.1 (frontend redesign)

## What it is

A local-first, phone-first inventory for moving an office. One Node process on the
coordinator's machine; everyone else joins over the office Wi-Fi. Register assets, pack
them into boxes, and follow each box through sealing, shipping, arrival and unpacking.

## Who uses it, and when

- **The coordinator** — one person owns the move: creates boxes, prints labels, watches
  progress, exports a manifest for the moving company and finance.
- **Packing colleagues** — 3–10 people, one hand free, phone in the other, standing in a
  cluttered office. They register whatever they pick up and drop it into the open box in
  front of them.

Scene: daylight, fluorescent office light, cable spaghetti, half-taped cartons, a marker
that is always missing. The phone is held one-handed at roughly 390 CSS px. Glare is
normal; contrast matters more than subtlety.

## Jobs to be done

1. Register an asset in under ten seconds without deciding taxonomy.
2. Pack it into the right box in one tap.
3. Know, at a glance, what is still loose and which boxes have not arrived.
4. Reprint a label when a box was mislabelled.
5. Hand over a trustworthy CSV/JSON before the laptops are packed away.
6. Recover if a restore or a mistake goes wrong (backup is reversible; deletes are not).

## Success

- A new colleague completes “register → pack → seal” without instruction.
- The coordinator can answer “what is left?” from the first screen.
- Nothing depends on the cloud, an account, or an internet connection.
- Print output is usable with tape and a marker: 90 × 60 mm, readable across a room.

## Constraints

- Node ≥ 22.13, `node:sqlite`, no native modules, no accounts.
- One server, one SQLite file, WAL; multiple readers, one writer.
- Data leaves via CSV/JSON; restore is replace-all and validated first.
- Accessibility floor: 44 px targets, visible focus, 4.5:1 body contrast, reduced motion.
- Ships as a PWA on the LAN (manifest + icons); no service worker.

## Non-goals (v1.1)

Photos, QR/barcode scanning, per-user auth, cloud sync, multi-tenant moves, i18n.
These are product expansions with their own evidence, not omissions to hide.

## Voice

Plain, operational, specific. Controls name their action (“Seal”, “Ship it”). Errors name
the problem and the recovery. Empty states teach the next step. No exclamation marks, no
cheerleading, no “Oops”.

## Visual authority

None inherited: v1.0 shipped a generic dark SaaS theme (rounded cards, gradient progress,
pill chips). The redesign replaces that world; the product truth above is preserved.
