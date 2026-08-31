import type { ItemCategory } from '../types-catalog';

export const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'mac', label: 'Mac' },
  { value: 'computer', label: 'PC / Laptop' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'input', label: 'Keyboard / Mouse' },
  { value: 'storage', label: 'SSD / HDD' },
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

export function categoryColor(value: string): string {
  const palette: Record<string, string> = {
    mac: 'var(--violet)',
    computer: 'var(--info)',
    monitor: 'var(--sky)',
    input: 'var(--teal)',
    storage: 'var(--amber-deep)',
    peripheral: 'var(--accent)',
    cable: 'var(--orange)',
    accessory: 'var(--pink)',
    furniture: 'var(--brown)',
    other: 'var(--muted)',
  };
  return palette[value] ?? 'var(--muted)';
}