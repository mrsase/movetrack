import { describe, it, expect } from 'vitest';
import { timeAgo, pluralize, dateLabel, initials } from './format';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const NOW = new Date('2026-08-31T12:00:00Z').getTime();

describe('timeAgo', () => {
  it('handles empty and invalid input', () => {
    expect(timeAgo('', NOW)).toBe('');
    expect(timeAgo('not-a-date', NOW)).toBe('');
  });

  it('formats minutes, hours and days', () => {
    expect(timeAgo(new Date(NOW - 20_000).toISOString(), NOW)).toBe('just now');
    expect(timeAgo(new Date(NOW - 5 * MIN).toISOString(), NOW)).toBe('5m ago');
    expect(timeAgo(new Date(NOW - 3 * HOUR).toISOString(), NOW)).toBe('3h ago');
    expect(timeAgo(new Date(NOW - 2 * DAY).toISOString(), NOW)).toBe('2d ago');
  });

  it('falls back to a date for older entries', () => {
    const out = timeAgo(new Date(NOW - 30 * DAY).toISOString(), NOW);
    expect(out).toBe('Aug 1');
  });
});

describe('pluralize', () => {
  it('singularizes one', () => {
    expect(pluralize(1, 'item')).toBe('1 item');
    expect(pluralize(1, 'box')).toBe('1 box');
  });
  it('pluralizes the rest', () => {
    expect(pluralize(0, 'item')).toBe('0 items');
    expect(pluralize(7, 'item')).toBe('7 items');
  });
  it('accepts a custom plural', () => {
    expect(pluralize(2, 'box', 'boxes')).toBe('2 boxes');
  });
});

describe('dateLabel', () => {
  it('formats an ISO date', () => {
    expect(dateLabel('2026-08-31T12:00:00.000Z')).toBe('Aug 31, 2026');
  });
  it('returns empty for invalid input', () => {
    expect(dateLabel('nope')).toBe('');
  });
});

describe('initials', () => {
  it('takes up to two initials', () => {
    expect(initials('MacBook Pro')).toBe('MP');
    expect(initials('hdmi')).toBe('H');
    expect(initials('  spaced   out  ')).toBe('SO');
    expect(initials('')).toBe('');
  });
});