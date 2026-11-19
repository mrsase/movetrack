import type { IconName } from '../icons';
import type { ItemCategory } from '../types-catalog';

export const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'mac', label: 'Mac' },
  { value: 'computer', label: 'PC / Laptop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'input', label: 'Keyboard / Mouse' },
  { value: 'storage', label: 'SSD / HDD' },
  { value: 'printer', label: 'Printer' },
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network' },
  { value: 'peripheral', label: 'Peripheral' },
  { value: 'cable', label: 'Cable' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'other', label: 'Other' },
];

const LABELS: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export function categoryLabel(value: string): string {
  return LABELS[value] ?? value;
}

/** Palette tokens live in theme.css; unknown categories fall back to muted. */
const COLORS: Record<string, string> = {
  mac: 'var(--violet)',
  computer: 'var(--info)',
  monitor: 'var(--sky)',
  input: 'var(--teal)',
  storage: 'var(--accent)',
  printer: 'var(--orange)',
  server: 'var(--brown)',
  network: 'var(--good)',
  peripheral: 'var(--pink)',
  cable: 'var(--text-2)',
  accessory: 'var(--violet)',
  furniture: 'var(--brown)',
  other: 'var(--muted)',
};

export function categoryColor(value: string): string {
  return COLORS[value] ?? 'var(--muted)';
}

/** Icon mapping for a category; unknown categories get the generic package. */
export function categoryIcon(value: string): IconName {
  const map: Record<string, IconName> = {
    mac: 'laptop',
    computer: 'cpu',
    monitor: 'monitor',
    input: 'keyboard',
    storage: 'drive',
    printer: 'printer',
    server: 'server',
    network: 'wifi',
    peripheral: 'layers',
    cable: 'link',
    accessory: 'tag',
    furniture: 'table',
    other: 'package',
  };
  return map[value] ?? 'package';
}
