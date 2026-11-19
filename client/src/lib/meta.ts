import type { BoxStatus, ItemStatus } from '../types';

export const ITEM_STATUS_META: Record<ItemStatus, { label: string; color: string }> = {
  in_office: { label: 'In office', color: 'var(--neutral)' },
  packed: { label: 'Packed', color: 'var(--warn)' },
  shipped: { label: 'Shipped', color: 'var(--info)' },
  delivered: { label: 'Delivered', color: 'var(--ok)' },
};

export const BOX_STATUS_META: Record<BoxStatus, { label: string; color: string; action: string | null }> = {
  open: { label: 'Open', color: 'var(--neutral)', action: 'Seal' },
  sealed: { label: 'Sealed', color: 'var(--warn)', action: 'Ship it' },
  shipped: { label: 'Shipped', color: 'var(--info)', action: 'Arrived' },
  arrived: { label: 'Arrived', color: 'var(--info)', action: 'Unpack all' },
  unpacked: { label: 'Unpacked', color: 'var(--ok)', action: null },
};

export const ITEM_STATUSES: ItemStatus[] = ['in_office', 'packed', 'shipped', 'delivered'];

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  in_office: 'In office',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export const BOX_STATUS_LABELS: Record<BoxStatus, string> = {
  open: 'Open',
  sealed: 'Sealed',
  shipped: 'Shipped',
  arrived: 'Arrived',
  unpacked: 'Unpacked',
};

export function itemColor(status: ItemStatus): string {
  return ITEM_STATUS_META[status].color;
}

export function boxColor(status: BoxStatus): string {
  return BOX_STATUS_META[status].color;
}