import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { Box, Item, Stats } from '../types';
import { BrandHeader } from '../components/Header';
import { BoxTile } from '../components/BoxTile';
import { ItemRow } from '../components/ItemRow';
import { ListSkeleton, ErrorBox } from '../components/Feedback';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../icons';
import { useBusRefresh, useRefreshKey, errorMessage } from '../hooks';
import { useToast } from '../components/Toast';
import { bus } from '../lib/events';
import type { Nav } from '../nav';

interface Loaded {
  stats: Stats;
  boxes: Box[];
  loose: Item[];
}

export function Home({ nav }: { nav: Nav }) {
  const tick = useBusRefresh();
  const [attempt, retry] = useRefreshKey();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    Promise.all([api.stats(), api.boxes(), api.items({ status: 'in_office', limit: 6 })])
      .then(([stats, boxes, loose]) => {
        if (!alive) return;
        setData({ stats, boxes: [...boxes.data].sort((a, b) => a.id - b.id), loose: loose.data });
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [tick, attempt]);

  function download(path: string) {
    const a = document.createElement('a');
    a.href = path;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function restore(file: File | undefined) {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!window.confirm('Replace every box and item with this backup? This cannot be undone.')) return;
      const res = await api.restoreBackup(parsed);
      toast(`Restored ${res.imported.items} items and ${res.imported.boxes} boxes`);
      bus.emit();
    } catch (e) {
      toast(errorMessage(e), 'err');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (error && !data) {
    return (
      <div className="screen">
        <BrandHeader />
        <ErrorBox message={error} onRetry={retry} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="screen">
        <BrandHeader />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const { stats, boxes, loose } = data;
  const items = stats.items;
  const counts = stats.boxes;
  const delivered = items.delivered;
  const remaining = items.total - delivered;

  return (
    <div className="screen">
      <BrandHeader
        right={
          <span>
            <b>{delivered}</b> / {items.total} delivered
          </span>
        }
      />

      <div className="actions-row">
        <button type="button" className="btn btn--primary" onClick={() => nav.push({ name: 'item-new' })}>
          <Icon name="plus" size={17} strokeWidth={2.4} />
          Add item
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => nav.push({ name: 'box-new' })}>
          <Icon name="package" size={17} />
          New box
        </button>
      </div>

      {items.total === 0 ? (
        <>
          <h2 className="section-title">The floor</h2>
          <EmptyState
            icon="package"
            title="Nothing registered yet"
            hint="Register the first asset before it goes in a box. A name and a category is enough."
            action={
              <button type="button" className="btn btn--primary" onClick={() => nav.push({ name: 'item-new' })}>
                <Icon name="plus" size={16} strokeWidth={2.4} />
                Register the first item
              </button>
            }
          />
        </>
      ) : (
        <section className="floor" aria-labelledby="floor-title">
          <div className="floor__head">
            <h1 className="floor__title" id="floor-title">
              The floor
            </h1>
            <span className="floor__sub">
              {counts.total} {counts.total === 1 ? 'box' : 'boxes'} · {counts.unpacked} unpacked
            </span>
          </div>

          {boxes.length === 0 ? (
            <EmptyState
              icon="package"
              title="No boxes yet"
              hint="Create a box when you have something to pack. It gets a number and a printable label."
              action={
                <button type="button" className="btn btn--ghost" onClick={() => nav.push({ name: 'box-new' })}>
                  Create the first box
                </button>
              }
            />
          ) : (
            <div className="tiles">
              {boxes.map((box) => (
                <BoxTile key={box.id} box={box} onClick={() => nav.push({ name: 'box', id: box.id })} />
              ))}
            </div>
          )}

          <div className="stat-line">
            <span className="stat">
              <span className="stat__value">{items.in_office}</span>
              <span className="stat__label">In office</span>
            </span>
            <span className="stat">
              <span className="stat__value">{items.packed}</span>
              <span className="stat__label">Packed</span>
            </span>
            <span className="stat">
              <span className="stat__value">{items.shipped}</span>
              <span className="stat__label">Shipped</span>
            </span>
            <span className="stat">
              <span className="stat__value">{items.delivered}</span>
              <span className="stat__label">Delivered</span>
            </span>
            <span className="stat">
              <span className="stat__value" data-testid="total-items">
                {items.total}
              </span>
              <span className="stat__label">Items</span>
            </span>
          </div>
        </section>
      )}

      <h2 className="section-title">
        <span>Still in the office{loose.length > 0 ? ` (${items.in_office})` : ''}</span>
        {items.in_office > 0 && (
          <button type="button" onClick={() => nav.goTab('items')}>
            All items
          </button>
        )}
      </h2>

      {loose.length === 0 ? (
        <p className="muted" style={{ margin: '4px 2px 0', fontSize: 13 }}>
          {items.total === 0
            ? 'Nothing to pack yet.'
            : 'Every registered item is in a box or already delivered.'}
        </p>
      ) : (
        loose.map((item) => <ItemRow key={item.id} item={item} onClick={() => nav.push({ name: 'item', id: item.id })} />)
      )}

      <h2 className="section-title">
        <span>Recently added</span>
        {items.total > 0 && (
          <button type="button" onClick={() => nav.goTab('items')}>
            All items
          </button>
        )}
      </h2>

      {items.recent.length === 0 ? (
        <p className="muted" style={{ margin: '4px 2px 0', fontSize: 13 }}>
          Registered items appear here as they are added.
        </p>
      ) : (
        items.recent.slice(0, 5).map((r) => (
          <ItemRow
            key={r.id}
            item={{
              id: r.id,
              name: r.name,
              category: r.category,
              status: r.status,
              quantity: r.quantity,
              destination: r.destination,
              serial: null,
              notes: null,
              box_id: null,
              created_at: r.created_at,
              updated_at: r.created_at,
            }}
            onClick={() => nav.push({ name: 'item', id: r.id })}
          />
        ))
      )}

      <h2 className="section-title">Paperwork</h2>
      <div className="card">
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
          {items.total === 0
            ? 'Nothing to export yet. These buttons produce empty files until you register something.'
            : remaining === 0
              ? 'Everything is delivered. Take a copy before the machines are wiped.'
              : 'Take a copy now, not on the last day. Restore replaces everything.'}
        </p>
        <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => download('/api/export/items.csv')}>
            Items CSV
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => download('/api/export/boxes.csv')}>
            Boxes CSV
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => download('/api/export/backup.json')}>
            Backup JSON
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileRef.current?.click()}>
            Restore…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => void restore(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
