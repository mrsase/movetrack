/** SQL DDL for the office-move database. Idempotent, run on every open. */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS boxes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT,
  destination TEXT,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','sealed','shipped','arrived','unpacked')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'other',
  serial      TEXT,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  notes       TEXT,
  destination TEXT,
  status      TEXT NOT NULL DEFAULT 'in_office'
              CHECK (status IN ('in_office','packed','shipped','delivered')),
  box_id      INTEGER REFERENCES boxes(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_items_box_id ON items(box_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_boxes_status ON boxes(status);
`;

/** Timestamp SQL fragment used anywhere we touch an updated_at column. */
export const NOW = `strftime('%Y-%m-%dT%H:%M:%fZ','now')`;