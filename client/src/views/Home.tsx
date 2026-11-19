import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { Item, Stats } from '../types';
import { BrandHeader } from '../components/Header';
import { ItemRow } from '../components/ItemRow';
import { ListSkeleton, ErrorBox } from '../components/Feedback';
import { EmptyState } from '../components/EmptyState';
import { Icon, type IconName } from '../icons';
import { categoryColor, categoryLabel } from '../lib/categories';
import { timeAgo } from '../lib/format';
import { useBusRefresh, useRefreshKey, errorMessage } from '../hooks';
import { useToast } from '../components/Toast';
import { bus } from '../lib/events';
import type { Nav } from '../nav';
import { ITEM_STATUS_META } from '../lib/meta';
import type { ItemStatus } from '../types';

const FLOW: { key: ItemStatus; icon: IconName }[] = [
  { key: 'in_office', icon: 'home' as const },
  { key: 'packed', icon: 'package' as const },
  { key: 'shipped', icon: 'truck' as const },
  { key: 'delivered', icon: 'open-box' as const },
];

export function Home({ nav }: { nav: Nav }) {
  const tick = useBusRefresh();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, retry] = useRefreshKey();

  useEffect(() => {
    let alive = true;
    api
      .stats()
      .then((s) => {
        if (!alive) return;
        setStats(s);
        setError(null);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'failed'));
    return () => {
      alive = false;
    };
  }, [tick, attempt]);

  if (error && !stats) {
    return (
      <div className="screen">
        <BrandHeader />
        <ErrorBox message={error} onRetry={retry} />
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="screen">
        <BrandHeader />
        <ListSkeleton rows={3} />
      </div>
    );
  }

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

  const i = stats.items;
  const b = stats.boxes;
  const deliveredPct = i.total === 0 ? 0 : Math.round((i.delivered / i.total) * 100);
  const unpackedPct = b.total === 0 ? 0 : Math.round((b.unpacked / b.total) * 100);
  const maxCat = Math.max(1, ...i.byCategory.map((c) => c.count));

  const asItem = (r: Stats['items']['recent'][number]): Item => ({
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
  });

  return (
    <div className="screen">
      <BrandHeader />

      {/* quick actions */}
      <div className="flex" style={{ gap: 10 }}>
        <button type="button" className="btn btn--primary btn--block" onClick={() => nav.push({ name: 'item-new' })}>
          <Icon name="plus" size={17} strokeWidth={2.4} />
          Add item
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => nav.push({ name: 'box-new' })}>
          <Icon name="package" size={17} />
          New box
        </button>
      </div>

      {/* moving progress */}
      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between' }}>
          <span className="muted" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Moving progress
          </span>
          <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-2)' }}>
            {i.delivered}/{i.total}
          </span>
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', margin: '6px 0 10px', fontVariantNumeric: 'tabular-nums' }}>
          {i.total}
          <span className="muted" style={{ fontSize: 15, fontWeight: 600, marginLeft: 8 }}>
            {i.total === 1 ? 'item registered' : 'items registered'}
          </span>
        </div>
        <span className="progress" style={{ display: 'block' }}>
          <span className={`progress__fill${deliveredPct === 100 ? ' progress__fill--good' : ''}`} style={{ width: `${deliveredPct}%` }} />
        </span>
      </div>

      {/* flow stats */}
      <div className="stat-grid">
        {FLOW.map(({ key, icon }) => (
          <div key={key} className="stat" style={{ '--sc': ITEM_STATUS_META[key].color } as React.CSSProperties}>
            <span className="stat__value">
              <Icon name={icon} size={17} />
              {i[key]}
            </span>
            <div className="stat__label">{ITEM_STATUS_META[key].label}</div>
          </div>
        ))}
        <div className="stat">
          <span className="stat__value" style={{ color: 'var(--text-2)' }}>
            <Icon name="package" size={17} />
            {b.total}
          </span>
          <div className="stat__label">Boxes</div>
        </div>
      </div>

      {/* boxes progress */}
      {b.total > 0 && (
        <div className="card">
          <div className="flex" style={{ justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Boxes unpacked
            </span>
            <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--text-2)' }}>
              {b.unpacked}/{b.total}
            </span>
          </div>
          <span className="progress" style={{ display: 'block', marginTop: 10 }}>
            <span className={`progress__fill${unpackedPct === 100 ? ' progress__fill--good' : ''}`} style={{ width: `${unpackedPct}%` }} />
          </span>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            {[b.open, b.sealed, b.shipped, b.arrived, b.unpacked]
              .map((n, idx) => `${['open', 'sealed', 'shipped', 'arrived', 'unpacked'][idx]}: ${n}`)
              .join(' · ')}
          </div>
        </div>
      )}

      {/* data: export and restore */}
      <div className="card">
        <div className="muted" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
          Export &amp; backup
        </div>
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
        <div className="field__hint" style={{ marginTop: 8 }}>
          Restore replaces all boxes and items. Take a backup first.
        </div>
      </div>

      {/* top categories */}
      {i.byCategory.length > 0 && (
        <>
          <h2 className="section-title">By category</h2>
          <div className="card" style={{ padding: '8px 14px' }}>
            {i.byCategory.map((c) => (
              <div key={c.category} className="cat-row" style={{ '--cat': categoryColor(c.category) } as React.CSSProperties}>
                <span className="cat-row__label">{categoryLabel(c.category)}</span>
                <span className="cat-row__bar">
                  <span className="cat-row__fill" style={{ width: `${Math.round((c.count / maxCat) * 100)}%` }} />
                </span>
                <span className="cat-row__count">{c.count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* recent */}
      <h2 className="section-title">Recently added</h2>
      {i.recent.length === 0 ? (
        <EmptyState
          icon="spark"
          title="Nothing registered yet"
          hint={'Tap "Add item" to register your first asset — name it, tag a category and save.'}
          action={
            <button type="button" className="btn btn--primary" onClick={() => nav.push({ name: 'item-new' })}>
              <Icon name="plus" size={16} strokeWidth={2.4} />
              Register the first item
            </button>
          }
        />
      ) : (
        i.recent.map((r) => (
          <ItemRow key={r.id} item={asItem(r)} onClick={() => nav.push({ name: 'item', id: r.id })} sub={timeAgo(r.created_at)} />
        ))
      )}
    </div>
  );
}

export default Home;