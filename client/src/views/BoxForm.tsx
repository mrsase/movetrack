import { useState } from 'react';
import { api } from '../api';
import { Header } from '../components/Header';
import { useToast } from '../components/Toast';
import { errorMessage } from '../hooks';
import type { Nav } from '../nav';

export function BoxForm({ nav }: { nav: Nav }) {
  const toast = useToast();
  const [label, setLabel] = useState('');
  const [destination, setDestination] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const created = await api.createBox({
        label: label.trim() || null,
        destination: destination.trim() || null,
      });
      toast(`Box ready — “${created.label ?? `Box ${created.id}`}”`);
      nav.replace({ name: 'box', id: created.id });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <Header title="New box" onBack={() => nav.pop()} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="card">
          <label className="field">
            <span className="field__label">Label</span>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Cables — floor 3 (auto-named “Box N” if empty)"
              autoFocus
              maxLength={120}
            />
          </label>
          <label className="field" style={{ marginTop: 16 }}>
            <span className="field__label">Deliver to</span>
            <input
              className="input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Optional — room or desk at the new office"
              maxLength={120}
            />
            <span className="field__hint">Shown on the label so movers know where it goes.</span>
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
            {busy ? 'Creating…' : 'Create box'}
          </button>
        </div>
      </form>
    </div>
  );
}