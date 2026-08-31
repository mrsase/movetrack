/** Mirrors the server's domain types (server/src/types.ts). */

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
  items_total: number;
  items_shipped: number;
  items_delivered: number;
}

export interface BoxDetail extends Box {
  items: Item[];
}

export interface ItemListResponse {
  data: Item[];
  total: number;
}

export interface BoxListResponse {
  data: Box[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface Stats {
  items: {
    total: number;
    in_office: number;
    packed: number;
    shipped: number;
    delivered: number;
    byCategory: CategoryCount[];
    recent: {
      id: number;
      name: string;
      category: string;
      status: ItemStatus;
      quantity: number;
      destination: string | null;
      created_at: string;
    }[];
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

export interface ApiErrorBody {
  error?: string;
}