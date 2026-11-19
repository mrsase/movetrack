import { useState } from 'react';
import { api } from '../api';
import type { Item } from '../types';
import { Header } from '../components/Header';
import { Chip } from '../components/Chip';
import { Stepper } from '../components/Stepper';
import { useToast } from '../components/Toast';
import { CATEGORIES } from '../lib/categories';
import { errorMessage } from '../hooks';
import type { Nav } from '../nav';

interface ItemFormProps {
  nav: Nav;
  item?: Item;
}

interface Fields {
  name: string;
  category: string;
  serial: string;
  quantity: number;
  destination: string;
  notes: string;
}

function initial(item?: Item): Fields {
  return {
    name: item?.name ?? '',
    category: item?.category ?? 'other',
    serial: item?.serial ?? '',
    quantity: item?.quantity ?? 1,
    destination: item?.destination ?? '',
    notes: item?.notes ?? '',
  };
}

export function ItemForm({ nav, item }: ItemFormProps) {
  const toast = useToast();
  const editing = item !== undefined;
  const [fields, setFields] = useState<Fields>(() => initial(item));
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  async function submit() {
    const name = fields.name.trim();
    if (!name) {
      setNameError('Give it a name — e.g. “MacBook Pro 16”” or “HDMI cables”.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = {
        name,
        category: fields.category,
        serial: fields.serial.trim() || null,
        quantity: fields.quantity,
        destination: fields.destination.trim() || null,
        notes: fields.notes.trim() || null,
        status: item?.status,
      };
      if (editing && item) {
        await api.updateItem(item.id, body);
        toast('Saved');
        nav.pop();
      } else {
        const created = await api.createItem(body);
        toast(`Added “${created.name}”`);
        nav.replace({ name: 'item', id: created.id });
      }
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <Header title={editing ? 'Edit item' : 'Add item'} onBack={() => nav.pop()} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="card">
          <label className="field">
            <span className="field__label">Name *</span>
            <input
              className={`input${nameError ? ' input--invalid' : ''}`}
              value={fields.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. MacBook Pro 16” or HDMI cable"
              autoFocus
              maxLength={120}
            />
            {nameError && <span className="field__error">{nameError}</span>}
          </label>

          <div className="field" style={{ marginTop: 16 }}>
            <span className="field__label">Category</span>
            <div className="chip-row chip-row--wrap">
              {CATEGORIES.map((c) => (
                <Chip key={c.value} active={fields.category === c.value} onClick={() => set('category', c.value)} ariaPressed={fields.category === c.value}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          <label className="field" style={{ marginTop: 16 }}>
            <span className="field__label">Serial number</span>
            <input
              className="input"
              value={fields.serial}
              onChange={(e) => set('serial', e.target.value)}
              placeholder="Optional — C02XK1ZZJGH5"
              maxLength={120}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <div className="field" style={{ marginTop: 16 }}>
            <span className="field__label">Quantity</span>
            <Stepper value={fields.quantity} onChange={(n) => set('quantity', n)} label="one unit per box" />
          </div>

          <label className="field" style={{ marginTop: 16 }}>
            <span className="field__label">Deliver to</span>
            <input
              className="input"
              value={fields.destination}
              onChange={(e) => set('destination', e.target.value)}
              placeholder="Optional — Ops desk 4"
              maxLength={120}
            />
            <span className="field__hint">Where it should end up in the new office.</span>
          </label>

          <label className="field" style={{ marginTop: 16 }}>
            <span className="field__label">Notes</span>
            <textarea
              className="textarea"
              value={fields.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional — cables included, which port it plugs into…"
              maxLength={2000}
            />
          </label>
        </div>

        {error && (
          <div style={{ marginTop: 12 }}>
            <div className="error-box">{error}</div>
          </div>
        )}

        <div className="flex" style={{ marginTop: 18, gap: 10 }}>
          <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={() => nav.pop()} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" style={{ flex: 2 }} disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </div>
  );
}