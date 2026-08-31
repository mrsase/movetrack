import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { bus } from '../lib/events';
import type { Box, Item } from '../types';
import { Header } from '../components/Header';
import { StatusChip } from '../components/StatusChip';
import { Sheet } from '../components/Sheet';
import { ConfirmSheet, DeleteButton } from '../components/ConfirmSheet';
import { useToast } from '../components/Toast';
import { ListSkeleton, ErrorBox } from '../components/Feedback';
import { Icon, CategoryIcon } from '../icons';
import { categoryColor, categoryLabel } from '../lib/categories';
import { ITEM_STATUS_META, BOX_STATUS_META } from '../lib/meta';
import { dateLabel, pluralize } from '../lib/format';
import { useBusRefresh, errorMessage } from '../hooks';
import type { Nav } from '../nav';

export function ItemDetail({ nav }: { nav: Nav }) {
  const id = nav.route.name === 'item' ? nav.route.id : 0;
  const toast = useToast();
  const tick = useBusRefresh();
  const [item, setItem] = useState<Item | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [packing, setPacking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    api
      .item(id)
      .then((it) => {
        if (!alive) return;
        setItem(it);
        if (it.box_id != null) return api.box(it.box_id).then((b) => alive && setBox(b));
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [id, tick]);

  const headerRight = useMemo(() => {
    if (!item) return null;
    const current = item;
    return (
      <button
        type="button"
        className="icon-btn"
        onClick={() => nav.push({ name: 'item-edit', id: current.id, item: current })}
        aria-label="Edit item"
      >
        <Icon name="pencil" size={16} />
      </button>
    );
  }, [item, nav]);

  if (error && !item) {
    return (
      <div className="screen">
        <Header title="Item" onBack={() => nav.pop()} />
        <ErrorBox message={error} onRetry={() => setItem(null)} />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="screen">
        <Header title="Item" onBack={() => nav.pop()} />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  const statusMeta = ITEM_STATUS_META[item.status];
  const it = item; // narrowed capture for the closures below

  async function run(fn: () => Promise<unknown>, okMessage: string) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast(okMessage);
      bus.emit();
    } catch (e) {
      toast(errorMessage(e), 'err');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await api.deleteItem(it.id);
    bus.emit();
    toast('Item deleted');
    nav.pop();
  }

  const showBoxAction = it.box_id != null && box != null;

  return (
    <div className="screen">
      <Header title="Item" onBack={() => nav.pop()} right={headerRight} />

      {/* identity card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          className="row__icon"
          style={{ width: 52, height: 52, color: categoryColor(item.category), '--ic': categoryColor(item.category) } as React.CSSProperties}
        >
          <CategoryIcon category={item.category} size={24} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 750, letterSpacing: '-0.01em' }}>{item.name}</div>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>
            {categoryLabel(item.category)}
            {item.quantity > 1 && <span className="qty-badge" style={{ marginLeft: 8 }}>×{item.quantity}</span>}
          </div>
        </span>
        <StatusChip label={statusMeta.label} color={statusMeta.color} />
      </div>

      {/* details */}
      <div className="card">
        {item.serial && (
          <MetaRow label="Serial" value={<span className="mono">{item.serial}</span>} />
        )}
        {item.quantity > 1 && <MetaRow label="Quantity" value={`${item.quantity}`} />}
        {item.destination && <MetaRow label="Deliver to" value={item.destination} />}
        {item.notes && <MetaRow label="Notes" value={item.notes} />}
        <MetaRow label="Registered" value={dateLabel(item.created_at)} />
      </div>

      {/* current box */}
      {showBoxAction && (
        <button type="button" className="row" onClick={() => nav.push({ name: 'box', id: box!.id })}>
          <span className="row__icon" style={{ color: 'var(--accent)' }}>
            <Icon name="package" size={19} />
          </span>
          <span className="row__body">
            <span className="row__title">Inside {box!.label ?? `Box ${box!.id}`}</span>
            <span className="row__meta">
              <span>Box is {BOX_STATUS_META[box!.status].label.toLowerCase()}</span>
              {box!.destination && (
                <>
                  <span className="dot" />
                  <span>→ {box!.destination}</span>
                </>
              )}
            </span>
          </span>
          <Icon name="chevron-right" size={16} style={{ color: 'var(--muted)' }} />
        </button>
      )}

      {/* actions */}
      <div className="flex-column">
        {item.status === 'in_office' && (
          <>
            <button type="button" className="btn btn--primary btn--block" onClick={() => setPacking(true)} disabled={busy}>
              <Icon name="package" size={17} />
              Pack into box
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => void run(() => api.updateItem(item.id, { status: 'delivered' }), 'Marked as delivered')} disabled={busy}>
              <Icon name="open-box" size={17} />
              Already delivered by hand
            </button>
          </>
        )}

        {item.status === 'packed' && (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => void run(() => api.unpackItem(item.id), 'Back in the office')} disabled={busy}>
            <Icon name="open-box" size={17} />
            Unpack back to the office
          </button>
        )}

        {item.status === 'shipped' && (
          <button type="button" className="btn btn--primary btn--block" onClick={() => void run(() => api.updateItem(item.id, { status: 'delivered' }), 'Marked as delivered')} disabled={busy}>
            <Icon name="check" size={17} strokeWidth={2.4} />
            Mark delivered
          </button>
        )}

        {item.status === 'delivered' && (
          <div className="muted" style={{ fontSize: 13.5, textAlign: 'center', padding: '6px 0' }}>
            Delivered — it reached the new office. ✓
          </div>
        )}

        <div className="flex" style={{ gap: 10 }}>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ flex: 1 }}
            onClick={() => nav.push({ name: 'item-edit', id: item.id, item })}
          >
            <Icon name="pencil" size={16} />
            Edit
          </button>
          <DeleteButton onDelete={() => setConfirmDelete(true)} />
        </div>
      </div>

      {packing && (
        <PackIntoSheet
          item={item}
          onClose={() => setPacking(false)}
          onPacked={(boxLabel) => {
            setPacking(false);
            toast(`Packed into ${boxLabel}`);
            bus.emit();
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmSheet
          title="Delete item?"
          body={`“${item.name}” will be removed from the inventory. This cannot be undone.`}
          confirmLabel="Delete item"
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0' }}>
      <span style={{ flex: '0 0 92px', fontSize: 13, color: 'var(--muted)', paddingTop: 1, fontWeight: 600 }}>{label}</span>
      <span style={{ flex: 1, fontSize: 14.5, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pack sheet — pick an open box, or create one on the fly.           */
/* ------------------------------------------------------------------ */

function PackIntoSheet({
  item,
  onClose,
  onPacked,
}: {
  item: Item;
  onClose: () => void;
  onPacked: (boxLabel: string) => void;
}) {
  const [boxes, setBoxes] = useState<Box[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newDest, setNewDest] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .boxes()
      .then((res) => {
        const open = res.data.filter((b) => b.status === 'open');
        setBoxes(open);
        if (open.length > 0 && selected === null) setSelected(open[0]!.id);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [selected]);

  useEffect(load, [load]);

  const openCount = boxes?.length ?? 0;

  async function pack() {
    setBusy(true);
    setError(null);
    try {
      let boxId = selected;
      let label = '';
      if (boxId == null) {
        const created = await api.createBox({
          label: newLabel.trim() || null,
          destination: newDest.trim() || null,
        });
        boxId = created.id;
        label = created.label ?? `Box ${created.id}`;
      } else {
        label = boxes?.find((b) => b.id === boxId)?.label ?? `Box ${boxId}`;
      }
      await api.packItem(item.id, boxId);
      onPacked(label);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} title={`Pack “${item.name}”`}>
      {error && <div className="error-box">{error}</div>}

      {openCount === 0 && (
        <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
          No open boxes yet — create one below and the item goes straight into it.
        </div>
      )}

      {openCount > 0 && (
        <>
          <div className="muted" style={{ fontSize: 13, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Open boxes
          </div>
          <div className="segment">
            {boxes!.map((b) => (
              <button key={b.id} type="button" className={`segment__option${selected === b.id ? ' segment__option--selected' : ''}`} onClick={() => setSelected(b.id)}>
                <span className="segment__radio" />
                <span className="segment__label" style={{ flex: 1 }}>
                  {b.label ?? `Box ${b.id}`}
                  <span className="segment__meta">
                    {b.destination ? `→ ${b.destination} · ` : ''}
                    {pluralize(b.items_total, 'item')}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: openCount > 0 ? '18px 0 4px' : '4px 0',
          color: 'var(--muted)',
          fontSize: 12.5,
          fontWeight: 650,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
        or create a new box
        <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
      </div>

      <div className="flex" style={{ gap: 8, marginTop: 10 }}>
        <input
          className="input"
          placeholder="Box label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          maxLength={120}
        />
        <input
          className="input"
          placeholder="Deliver to (optional)"
          value={newDest}
          onChange={(e) => setNewDest(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className="flex" style={{ marginTop: 18, gap: 10 }}>
        <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn--primary" style={{ flex: 2 }} onClick={() => void pack()} disabled={busy}>
          <Icon name="package" size={17} />
          {busy ? 'Packing…' : selected != null ? 'Pack into selected box' : 'Create box & pack'}
        </button>
      </div>
    </Sheet>
  );
}