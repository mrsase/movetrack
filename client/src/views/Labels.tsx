import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Box } from '../types';
import { Header } from '../components/Header';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton, ErrorBox } from '../components/Feedback';
import { Icon } from '../icons';
import { pluralize } from '../lib/format';
import { useBusRefresh, useRefreshKey, errorMessage } from '../hooks';
import type { Nav } from '../nav';

interface LabelsProps {
  nav: Nav;
  /** When set, print only this box (even if it is already unpacked). */
  onlyBoxId?: number;
}

/**
 * Print-friendly box labels.
 *
 * One card per active box, 90 × 60 mm on paper. The screen chrome is hidden by
 * `@media print` in theme.css. Unpacked boxes are excluded so a reprint after
 * the move does not waste paper.
 */
export function Labels({ nav, onlyBoxId }: LabelsProps) {
  const tick = useBusRefresh();
  const [boxes, setBoxes] = useState<Box[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, retry] = useRefreshKey();

  useEffect(() => {
    let alive = true;
    setError(null);
    api
      .boxes()
      .then((res) => {
        if (alive) setBoxes(res.data);
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [tick, attempt]);

  const visible = (boxes ?? []).filter((b) =>
    onlyBoxId !== undefined ? b.id === onlyBoxId : b.status !== 'unpacked',
  );

  return (
    <div className="screen screen--labels">
      <div className="no-print">
        <Header
          title={onlyBoxId !== undefined ? 'Box label' : 'Box labels'}
          onBack={() => nav.pop()}
          right={
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()} disabled={visible.length === 0}>
              <Icon name="printer" size={15} />
              Print
            </button>
          }
        />
      </div>

      {error && <ErrorBox message={error} onRetry={retry} />}
      {!boxes && !error && <ListSkeleton rows={2} />}

      {boxes && visible.length === 0 && (
        <EmptyState
          icon="printer"
          title="Nothing to print"
          hint={
            onlyBoxId !== undefined
              ? 'This box does not exist any more.'
              : 'Create a box first — its label appears here until the box is unpacked.'
          }
        />
      )}

      {visible.length > 0 && (
        <>
          <p className="muted no-print" style={{ fontSize: 13, margin: '0 4px 12px' }}>
            {pluralize(visible.length, 'label')} · 90 × 60 mm · set your printer to “actual size”.
          </p>
          <div className="labels">
            {visible.map((box) => (
              <article key={box.id} className="label" aria-label={`Label for ${box.label ?? `Box ${box.id}`}`}>
                <div className="label__brand">
                  <span className="label__mark">▣</span> MOVETRACK
                </div>
                <div className="label__title">{box.label ?? `Box ${box.id}`}</div>
                {box.destination && <div className="label__dest">→ {box.destination}</div>}
                <div className="label__meta">
                  box #{box.id} · {pluralize(box.items_total, 'item')} · {box.status}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Labels;
