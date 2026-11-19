/**
 * Shared domain types. The client mirrors these in its own src/types.ts —
 * keep the two in sync when adding fields.
 */

export type ItemStatus = 'in_office' | 'packed' | 'shipped' | 'delivered';
export type BoxStatus = 'open' | 'sealed' | 'shipped' | 'arrived' | 'unpacked';

export interface Item {
  id: number;
  name: string;
  category: string;
  serial: string | null;
  quantity: number;
  notes: string | null;
  destination: string | null;
  status: ItemStatus;
  box_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Box {
  id: number;
  label: string | null;
  destination: string | null;
  status: BoxStatus;
  created_at: string;
  updated_at: string;
}

export interface BoxWithCounts extends Box {
  items_total: number;
  items_shipped: number;
  items_delivered: number;
}

export interface ItemListResponse {
  data: Item[];
  total: number;
}

export interface StatsResponse {
  items: {
    total: number;
    in_office: number;
    packed: number;
    shipped: number;
    delivered: number;
    byCategory: { category: string; count: number }[];
    recent: Pick<Item, 'id' | 'name' | 'category' | 'status' | 'quantity' | 'destination' | 'created_at'>[];
  };
  boxes: {
    total: number;
    open: number;
    sealed: number;
    shipped: number;
    arrived: number;
    unpacked: number;
  };
}

export const ITEM_STATUSES: ItemStatus[] = ['in_office', 'packed', 'shipped', 'delivered'];
export const BOX_STATUSES: BoxStatus[] = ['open', 'sealed', 'shipped', 'arrived', 'unpacked'];

export const CATEGORIES = [
  'mac',
  'computer',
  'monitor',
  'input',
  'storage',
  'printer',
  'server',
  'network',
  'peripheral',
  'cable',
  'accessory',
  'furniture',
  'other',
] as const;