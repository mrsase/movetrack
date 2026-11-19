import type { ApiErrorBody, Box, BoxDetail, BoxListResponse, Item, ItemListResponse, Stats } from './types';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...init?.headers },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export interface ItemQuery {
  status?: string;
  category?: string;
  q?: string;
  box?: string | 'none';
  limit?: number;
  offset?: number;
}

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),
  stats: () => request<Stats>('/api/stats'),

  items: (query: ItemQuery = {}) =>
    request<ItemListResponse>(`/api/items${qs({ ...query })}`),
  item: (id: number) => request<Item>(`/api/items/${id}`),
  createItem: (body: Record<string, unknown>) =>
    request<Item>('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id: number, body: Record<string, unknown>) =>
    request<Item>(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteItem: (id: number) => request<void>(`/api/items/${id}`, { method: 'DELETE' }),
  packItem: (id: number, boxId: number) =>
    request<Item>(`/api/items/${id}/box`, { method: 'POST', body: JSON.stringify({ box_id: boxId }) }),
  unpackItem: (id: number) => request<Item>(`/api/items/${id}/box`, { method: 'DELETE' }),

  boxes: () => request<BoxListResponse>('/api/boxes'),
  box: (id: number) => request<BoxDetail>(`/api/boxes/${id}`),
  createBox: (body: Record<string, unknown>) =>
    request<Box>('/api/boxes', { method: 'POST', body: JSON.stringify(body) }),
  updateBox: (id: number, body: Record<string, unknown>) =>
    request<Box>(`/api/boxes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBox: (id: number) => request<void>(`/api/boxes/${id}`, { method: 'DELETE' }),
  boxAction: (id: number, action: string) =>
    request<Box>(`/api/boxes/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),

  /** Replace every box and item with the contents of a backup file. */
  restoreBackup: (backup: unknown) =>
    request<{ imported: { boxes: number; items: number } }>('/api/import/backup', {
      method: 'POST',
      body: JSON.stringify({ ...(backup as Record<string, unknown>), confirmation: 'replace-all' }),
    }),
};