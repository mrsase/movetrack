import { describe, it, expect } from 'vitest';
import { categoryLabel, categoryColor } from './categories';

describe('categoryLabel', () => {
  it('maps known values to friendly labels', () => {
    expect(categoryLabel('mac')).toBe('Mac');
    expect(categoryLabel('storage')).toBe('SSD / HDD');
    expect(categoryLabel('other')).toBe('Other');
  });

  it('falls back to the raw value for unknown categories', () => {
    expect(categoryLabel('printer')).toBe('printer');
  });
});

describe('categoryColor', () => {
  it('returns a CSS variable for every known category', () => {
    expect(categoryColor('mac')).toMatch(/^var\(--/);
    expect(categoryColor('other')).toMatch(/^var\(--/);
  });

  it('has a muted fallback', () => {
    expect(categoryColor('mystery')).toBe('var(--muted)');
  });
});