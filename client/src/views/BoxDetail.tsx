import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { bus } from '../lib/events';
import type { BoxDetail, Item } from '../types';
import { Header } from '../components/Header';
import { StatusChip } from '../components/StatusChip';
import { ItemRow } from '../components/ItemRow';
import { Sheet } from '../components/Sheet';
import { ConfirmSheet, DeleteButton } from '../components/ConfirmSheet';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton, ErrorBox } from '../components/Feedback';
import { Icon, type IconName } from '../icons';
import { BOX_STATUS_META } from '../lib/meta';
import { pluralize } from '../lib/format';
import { filterByQuery } from '../lib/filter';
import { useBusRefresh, useRefreshKey, errorMessage } from '../hooks';
import { useToast } from '../components/Toast';
import type { Nav } from '../nav';

/** One-way box actions, keyed by current status (mirrors the server). */
const PRIMARY: Record<string, { action: string; icon: IconName; verb: string } | null> = {
  open: { action: 'seal', icon: 'archive', verb: 'Box sealed' },
  sealed: { action: 'ship', icon: 'truck', verb: 'Shipped — items are on the move' },
  shipped: { action: 'arrive', icon: 'inbox', verb: 'Marked as arrived' },
  arrived: { action: 'unpack', icon: 'open-box', verb: 'Box unpacked — everything delivered' },
  unpacked: null,
};

export function BoxView({ nav }: { nav: Nav }) {
  const id = nav.route.name === 'box' ? nav.route.id : 0;
  const [box, setBox] = useState<BoxDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, retry] = useRefreshKey();

  const tick = useBusRefresh();
  const toast = useToast();

  useEffect(() => {
    let alive = true;
    setError(null);
    api
      .box(id)
      .then((b) => {
        if (alive) setBox(b);
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [id, tick, attempt]);

  const meta = box ? BOX_STATUS_META[box.status] : null;

  const headerRight = useMemo(
    () =>
      box ? (
        <div className="flex" style={{ gap: 8 }}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => nav.push({ name: 'labels', id: box.id })}
            aria-label="Print label"
          >
            <Icon name="printer" size={15} />
          </button>
          <button type="button" className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit box">
            <Icon name="pencil" size={15} />
          </button>
          <DeleteButton onDelete={() => setConfirmDelete(true)} />
        </div>
      ) : null,
    [box, nav],
  );

  if (error && !box) {
    return (
      <div className="screen">
        <Header title="Box" onBack={() => nav.pop()} />
        <ErrorBox message={error} onRetry={retry} />
      </div>
    );
  }
  if (!box || !meta) {
    return (
      <div className="screen">
        <Header title="Box" onBack={() => nav.pop()} />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  const pct = box.items_total === 0 ? 0 : Math.round((box.items_delivered / box.items_total) * 100);
  const b = box; // narrowed capture for the closures below

  async function act(action: string) {
    if (busy) return;
    setBusy(true);
    try {
      await api.boxAction(b.id, action);
      toast(PRIMARY[b.status]?.verb ?? 'Box updated');
      setBox(await api.box(b.id));
      bus.emit();
    } catch (e) {
      toast(errorMessage(e), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    if (busy) return;
    setBusy(true);
    try {
      await api.boxAction(b.id, 'reopen');
      toast('Reopened — you can pack more items');
      setBox(await api.box(b.id));
      bus.emit();
    } catch (e) {
      toast(errorMessage(e), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await api.deleteBox(b.id);
    bus.emit();
    nav.pop();
  }

  const primary = PRIMARY[b.status];

  return (
    <div className="screen">
      <Header title={box.label ?? `Box ${box.id}`} onBack={() => nav.pop()} right={headerRight} />

      {/* progress */}
      <div className="card">
        <div className="flex" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="muted" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {pluralize(box.items_total, 'item')}
          </span>
          <StatusChip label={meta.label} color={meta.color} />
        </div>
        <span className="progress" style={{ display: 'block' }}>
          <span className={`progress__fill${pct === 100 ? ' progress__fill--good' : ''}`} style={{ width: `${pct}%` }} />
        </span>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
          {box.items_delivered} delivered{box.destination ? ` · heading to ${box.destination}` : ''}
        </div>
      </div>

      {/* actions */}
      <div className="flex-column">
        {primary && (
          <button type="button" className="btn btn--primary btn--block" onClick={() => void act(primary.action)} disabled={busy}>
            <Icon name={primary.icon} size={17} />
            {meta.action}
          </button>
        )}

        {box.status === 'sealed' && (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => void reopen()} disabled={busy}>
            <Icon name="open-box" size={17} />
            Reopen (still packing)
          </button>
        )}

        {box.status === 'open' && (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setPicking(true)} disabled={busy}>
            <Icon name="plus" size={17} strokeWidth={2.4} />
            Add items
          </button>
        )}

        {!primary && (
          <div className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
            Everything in this box was delivered. ✓
          </div>
        )}
      </div>

      {/* contents */}
      <h2 className="section-title">Contents</h2>
      {box.items.length === 0 ? (
        <EmptyState
          icon="open-box"
          title="This box is empty"
          hint={box.status === 'open' ? 'Tap “Add items” to pack things into it.' : 'It moved without carrying anything.'}
        />
      ) : (
        box.items.map((it) => (
          <ItemRow key={it.id} item={it} onClick={() => nav.push({ name: 'item', id: it.id })} dimmed={it.status === 'delivered'} />
        ))
      )}

      {picking && (
        <PickItemsSheet boxId={box.id} boxLabel={box.label ?? `Box ${box.id}`} onClose={() => setPicking(false)} />
      )}

      {editing && <EditBoxSheet box={box} onClose={() => setEditing(false)} />}

      {confirmDelete && (
        <ConfirmSheet
          title="Delete box?"
          body={`“${box.label ?? `Box ${box.id}`}” and its contents will be removed. Its items go back to “in office”. This cannot be undone.`}
          confirmLabel="Delete box"
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pick items sheet — search the office, check, pack in one tap.      */
/* ------------------------------------------------------------------ */

function PickItemsSheet({
  boxId,
  boxLabel,
  onClose,
}: {
  boxId: number;
  boxLabel: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [q, setQ] = useState('');
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .items({ status: 'in_office', limit: 500 })
      .then((res) => {
        if (alive) setItems(res.data);
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, []);

  const visible = items ? filterByQuery(items, q) : [];
  const visibleIds = new Set(visible.map((i) => i.id));
  const allVisibleChecked = visible.length > 0 && visible.every((i) => checked.has(i.id));

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setChecked((prev) => {
      const next = new Set(prev);
      if (allVisibleChecked) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  }

  async function pack() {
    setBusy(true);
    setError(null);
    try {
      for (const id of checked) {
        await api.packItem(id, boxId);
      }
      bus.emit();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} title={`Add items to ${boxLabel}`}>
      <SearchBar value={q} onChange={setQ} placeholder="Search the office…" autoFocus />
      {error && <div className="error-box">{error}</div>}

      {items && items.length === 0 && (
        <EmptyState icon="home" title="Office is empty" hint="Every item is already packed or delivered. Register more items first." />
      )}

      {items && items.length > 0 && (
        <>
          <div style={{ margin: '12px 0 4px' }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={toggleAll}>
              {allVisibleChecked ? 'Clear visible' : `Select all (${visible.length})`}
            </button>
          </div>

          {visible.length === 0 ? (
            <div className="muted" style={{ padding: '20px 4px' }}>No items match “{q}”.</div>
          ) : (
            visible.map((i) => (
              <button key={i.id} type="button" className={`check-row${checked.has(i.id) ? ' check-row--checked' : ''}`} onClick={() => toggle(i.id)}>
                <span className="check-row__box">
                  <Icon name="check" size={14} strokeWidth={3} />
                </span>
                <span className="check-row__body">
                  <span className="check-row__name">{i.name}</span>
                  <span className="check-row__meta">
                    {i.quantity > 1 ? `×${i.quantity} · ` : ''}
                    {i.serial ?? ''}
                  </span>
                </span>
              </button>
            ))
          )}

          <div className="flex" style={{ marginTop: 18, gap: 10 }}>
            <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" style={{ flex: 2 }} onClick={() => void pack()} disabled={busy || checked.size === 0}>
              <Icon name="package" size={17} />
              {busy ? 'Packing…' : `Pack ${checked.size > 0 ? pluralize(checked.size, 'item') : 'items'}`}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit box sheet — rename + destination.                             */
/* ------------------------------------------------------------------ */

function EditBoxSheet({ box, onClose }: { box: BoxDetail; onClose: () => void }) {
  const [label, setLabel] = useState(box.label ?? '');
  const [destination, setDestination] = useState(box.destination ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api.updateBox(box.id, {
        label: label.trim() || null,
        destination: destination.trim() || null,
      });
      bus.emit();
      onClose();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} title="Edit box">
      <label className="field">
        <span className="field__label">Label</span>
        <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} autoFocus />
      </label>
      <label className="field" style={{ marginTop: 14 }}>
        <span className="field__label">Deliver to</span>
        <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={120} />
      </label>
      {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}
      <div className="flex" style={{ marginTop: 18, gap: 10 }}>
        <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" style={{ flex: 2 }} onClick={() => void save()} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Sheet>
  );
}

export default BoxView;