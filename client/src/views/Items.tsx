import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Item } from '../types';
import { Header } from '../components/Header';
import { ItemRow } from '../components/ItemRow';
import { Chip } from '../components/Chip';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton, ErrorBox } from '../components/Feedback';
import { useBusRefresh, useRefreshKey, errorMessage } from '../hooks';
import { ITEM_STATUS_LABELS, ITEM_STATUSES } from '../lib/meta';
import type { Nav } from '../nav';

export function Items({ nav }: { nav: Nav }) {
  const tick = useBusRefresh();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | null>('all');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [data, setData] = useState<{ data: Item[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, retry] = useRefreshKey();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let alive = true;
    const statusFilter = status && status !== 'all' ? status : undefined;
    setError(null);
    api
      .items({ q: debouncedQ || undefined, status: statusFilter, limit: 200 })
      .then((res) => {
        if (!alive) return;
        setData(res);
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [tick, debouncedQ, status, attempt]);

  const visibleCount = data ? data.data.length : 0;

  return (
    <div className="screen">
      <Header title="Items" brand />

      <SearchBar value={q} onChange={setQ} placeholder="Search name, serial, notes…" />

      <div className="chip-row" role="tablist" aria-label="Filter by status">
        <Chip active={status === 'all'} onClick={() => setStatus('all')} ariaPressed={status === 'all'}>
          All
        </Chip>
        {ITEM_STATUSES.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(status === s ? 'all' : s)} ariaPressed={status === s}>
            {ITEM_STATUS_LABELS[s]}
          </Chip>
        ))}
      </div>

      {error && <ErrorBox message={error} onRetry={retry} />}

      {!data && !error && <ListSkeleton rows={5} />}

      {data && (
        <>
          <div className="muted" style={{ fontSize: 12.5, margin: '2px 4px 8px' }}>
            {data.total === 0 ? 'No items match' : `${visibleCount} of ${data.total} items`}
          </div>

          {data.data.length === 0 && (
            <EmptyState
              icon="list"
              title={q || (status && status !== 'all') ? 'No matches' : 'Nothing registered yet'}
              hint={
                q || (status && status !== 'all')
                  ? 'Try a different search or clear the filters.'
                  : 'Register assets as you find them — a name and category is enough.'
              }
            />
          )}

          {data.data.map((item) => (
            <ItemRow key={item.id} item={item} onClick={() => nav.push({ name: 'item', id: item.id })} />
          ))}
        </>
      )}
    </div>
  );
}