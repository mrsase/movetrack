/**
 * Minimal RFC 4180 CSV writer.
 *
 * Two jobs matter for a spreadsheet export:
 *  - quoting: commas, quotes, CR and LF must survive a round trip;
 *  - safety: a cell that starts with "=", "+", "-" or "@" is treated as a
 *    formula by Excel/Sheets, so it is prefixed with a single quote.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

/** Guard a text cell against spreadsheet formula execution. */
export function neutralize(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

/** Render one value: numbers stay bare, everything else is neutralised text. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Uint8Array) return '';
  return neutralize(String(value));
}

export function escapeCsv(cell: string): string {
  if (/[",\r\n]/.test(cell) || /^\s|\s$/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * Build a CSV document. Returns the body without a BOM — callers decide
 * whether to prepend one (the download route does, for Excel).
 */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const lines: string[] = [];
  lines.push(columns.map((c) => escapeCsv(c.header)).join(','));
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsv(csvCell(c.value(row)))).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

/** UTF-8 BOM so Excel opens the file as UTF-8 instead of the system codepage. */
export const BOM = '\uFEFF';
