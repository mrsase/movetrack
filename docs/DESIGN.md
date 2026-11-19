# DESIGN.md — MoveTrack

Durable visual system for the app surfaces. Product truth lives in `PRODUCT.md`; this file
records what shipped in v1.1.0.

## World

A warehouse floor board. The move is a set of physical cartons with numbers, destinations
and states, and the interface treats them that way: concrete ground, black ink, one hazard
field, stamps instead of status pills. It refuses the dashboard default — no hero metric,
no stat cards, no gradient progress, no icon-tile cards.

Usage scene: daylight office, phone one-handed, clutter and glare. Light is the default;
dark follows `prefers-color-scheme` for evening packing.

## Tokens

Defined in `client/src/theme.css` `:root` (light) with a `prefers-color-scheme: dark` block.

| Role | Light | Dark |
| --- | --- | --- |
| `--paper` ground | `#e9e5da` | `#131410` |
| `--surface` panels | `#f8f5ed` | `#1b1d17` |
| `--surface-2` raised | `#ded9cc` | `#232620` |
| `--ink` text | `#17160f` | `#f2eee0` |
| `--ink-2` secondary | `#54503f` | `#c3bdac` |
| `--muted` meta | `#6f6957` | `#948e7c` |
| `--line` / `--line-strong` | `#c9c3b2` / `#a49d87` | `#34372c` / `#4a4d3f` |
| `--hazard` field | `#f2c200` | `#f5c518` |
| `--ok` delivered | `#1d6b45` | `#5bc08d` |
| `--info` shipped/arrived | `#1e4e8c` | `#8ab0ee` |
| `--warn` packed/sealed | `#8a5a00` | `#e2ae4e` |
| `--neutral` in office/open | `#6c6759` | `#9a9481` |
| `--danger` | `#a32e1c` | `#f08a78` |
| `--focus` | ink | hazard |

Status colour is the only colour in lists; the palette never decorates. `::selection`,
caret, focus rings and scrollbars are themed from the same tokens.

## Type

One family: **Archivo variable** (wght 100–900, wdth 62–125), self-hosted
`client/public/fonts/archivo-var-latin.woff2`, SIL OFL 1.1 (`OFL-Archivo.txt`). No network
font request.

| Use | Spec |
| --- | --- |
| Brand bar | 17 px / 800 / wdth 118 / uppercase / −0.015em |
| Page title (`.hdr__title`, `.floor__title`) | 18–21 px / 720–780 / −0.02…−0.03em |
| Box number (`.tile__num`, `.stat__value`) | 27 px / 780 / wdth 72–88 / tabular |
| Body / rows | 15 px / 1.45 / 640 titles |
| Meta | 11.5 px / muted |
| Functional floor | **11 px** — status stamps, counts, label meta |
| IDs / serials (`.mono`) | system mono, 1em, only for machine identifiers |

No display face in buttons, labels or data. Uppercase is reserved for the brand mark and
status stamps (a physical stamp is a real-world object here).

## Layout and components

- **Shell** 720 px max, 16 px gutters (28 px ≥760), bottom nav 62 px + safe area.
- **Top bar** full app width, hazard field, never sticky: it must not cover the manifest.
- **Floor tiles**: 2 columns on phones, 3 at 560, 4 at 900. Dashed border = unsealed;
  solid = sealed; tinted field + stamp = shipped/arrived/unpacked. Number, label,
  destination, count, stamp — no icon tiles, no shadows.
- **Counts band** five cells with hairline rules: in office, packed, shipped, delivered, items.
- **Rows** 1 px rules, 30 px monochrome category glyph, status stamp right.
- **Buttons** 46 px tall, 4 px radius, ink fill for primary, 1.5 px outline for secondary;
  press moves 1 px. No hard-offset shadows.
- **Sheets** bottom sheet, 16 px top radius, `0 -14px 40px` lift, solid scrim (no blur).
- **Print** 90 × 60 mm tickets, 2-up on A4, black-only, dashed meta rule, 10 mm page margin.

## Motion

State-only. 140–220 ms ease-out on background/border/width, 90 ms press. No page-load
choreography. `prefers-reduced-motion` collapses all durations.

## Rules (enforced by review)

1. No sticky headers; nothing may cover the floor or a row.
2. No card inside a card; cards are for forms and object panels only.
3. No one-sided colour bars, gradient text, glass, or decorative grid backgrounds.
4. Every functional text ≥ 11 px; body contrast ≥ 4.5:1.
5. Status colour appears only on stamps, tints and progress fills.
6. Icons are authored SVG in one stroke weight; no emoji or glyph stand-ins.

The Impeccable detector reports 0 findings on the rendered app and on `client/src` at this
release (`npx impeccable detect`).
