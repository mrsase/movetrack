import { describe, it, expect } from 'vitest';
import { filterByQuery, filterByStatus } from './filter';
import type { Item } from '../types';

const item = (over: Partial<Item>): Item => ({
  id: 1,
  name: 'MacBook Pro',
  category: 'mac',
  serial: null,
  quantity: 1,
  notes: null,
  destination: null,
  status: 'in_office',
  box_id: null,
  created_at: '2026-08-31T12:00:00.000Z',
  updated_at: '2026-08-31T12:00:00.000Z',
  ...over,
});

const items: Item[] = [
  item({ id: 1, name: 'MacBook Pro 16”', serial: 'C02XK1ZZJGH5', status: 'in_office' }),
  item({ id: 2, name: 'Dell dock', notes: 'for the laptops', status: 'packed' }),
  item({ id: 3, name: 'Hard drive 4TB', serial: 'WD-WX22', status: 'shipped' }),
];

describe('filterByQuery', () => {
  it('returns everything for an empty query', () => {
    expect(filterByQuery(items, '')).toHaveLength(3);
    expect(filterByQuery(items, '   ')).toHaveLength(3);
  });

  it('matches names case-insensitively', () => {
    expect(filterByQuery(items, 'macbook')).toHaveLength(1);
    expect(filterByQuery(items, 'DELL')).toHaveLength(1);
  });

  it('matches serial numbers', () => {
    expect(filterByQuery(items, 'C02XK1ZZJGH5')).toHaveLength(1);
    expect(filterByQuery(items, 'wd-wx22')).toHaveLength(1);
  });

  it('matches notes', () => {
    expect(filterByQuery(items, 'laptops')).toHaveLength(1);
  });

  it('returns nothing for no match', () => {
    expect(filterByQuery(items, 'printer')).toHaveLength(0);
  });

  it('does not mutate the input', () => {
    const copy = [...items];
    filterByQuery(items, 'mac');
    expect(items).toEqual(copy);
  });
});

describe('filterByStatus', () => {
  it('passes through for "all" or null', () => {
    expect(filterByStatus(items, 'all')).toHaveLength(3);
    expect(filterByStatus(items, null)).toHaveLength(3);
  });

  it('filters by status', () => {
    expect(filterByStatus(items, 'packed').map((i) => i.id)).toEqual([2]);
    expect(filterByStatus(items, 'shipped').map((i) => i.id)).toEqual([3]);
  });
});