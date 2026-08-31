import type { Item } from '../types';

/** Case-insensitive match on name, serial or notes. Pure, tested. */
export function filterByQuery(items: Item[], query: string): Item[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      (i.serial ?? '').toLowerCase().includes(q) ||
      (i.notes ?? '').toLowerCase().includes(q),
  );
}

export function filterByStatus(items: Item[], status: string | null): Item[] {
  if (!status || status === 'all') return items;
  return items.filter((i) => i.status === status);
}