import { describe, it, expect } from 'vitest';
import { CATEGORIES, categoryColor, categoryIcon, categoryLabel } from './categories';

describe('category catalog', () => {
  it('covers the server enum exactly once', () => {
    const values = CATEGORIES.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toEqual(
      expect.arrayContaining(['mac', 'computer', 'monitor', 'input', 'storage', 'printer', 'server', 'network', 'cable', 'other']),
    );
  });

  it('gives every category a label, a colour token and an icon', () => {
    for (const { value } of CATEGORIES) {
      expect(categoryLabel(value)).not.toBe(value);
      expect(categoryColor(value)).toMatch(/^var\(--/);
      expect(categoryIcon(value)).toBeTruthy();
    }
  });

  it('labels the categories the recorded move needed', () => {
    expect(categoryLabel('printer')).toBe('Printer');
    expect(categoryLabel('server')).toBe('Server');
    expect(categoryLabel('network')).toBe('Network');
  });

  it('degrades gracefully for unknown categories', () => {
    expect(categoryLabel('hovercraft')).toBe('hovercraft');
    expect(categoryColor('hovercraft')).toMatch(/^var\(--/);
    expect(categoryIcon('hovercraft')).toBe('package');
  });
});
