import { useState } from 'react';
import { Sheet } from './Sheet';
import { Icon } from '../icons';

interface ConfirmSheetProps {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/** Small confirm dialog backed by Sheet. */
export function ConfirmSheet({ title, body, confirmLabel, onConfirm, onClose }: ConfirmSheetProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} title={title}>
      <p className="muted" style={{ fontSize: 14.5 }}>
        {body}
      </p>
      {error && <p className="field__error mt">{error}</p>}
      <div className="flex-column mt" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn--danger-solid btn--block" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={onClose} disabled={busy}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

export function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button type="button" className="icon-btn icon-btn--danger" onClick={onDelete} aria-label="Delete">
      <Icon name="trash" size={17} />
    </button>
  );
}