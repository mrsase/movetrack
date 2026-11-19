import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Box } from '../types';
import { Header } from '../components/Header';
import { BoxRow } from '../components/BoxRow';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton, ErrorBox } from '../components/Feedback';
import { Icon } from '../icons';
import { useBusRefresh, useRefreshKey, errorMessage } from '../hooks';
import type { Nav } from '../nav';

export function Boxes({ nav }: { nav: Nav }) {
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

  const active = boxes?.filter((b) => b.status !== 'unpacked') ?? [];
  const unpacked = boxes?.filter((b) => b.status === 'unpacked') ?? [];

  return (
    <div className="screen">
      <Header
        title="Boxes"
        brand
        right={
          <div className="flex" style={{ gap: 6 }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => nav.push({ name: 'labels' })}>
              <Icon name="printer" size={15} />
              Labels
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => nav.push({ name: 'box-new' })}>
              <Icon name="plus" size={15} strokeWidth={2.4} />
              New box
            </button>
          </div>
        }
      />

      {error && <ErrorBox message={error} onRetry={retry} />}
      {!boxes && !error && <ListSkeleton rows={4} />}

      {boxes && boxes.length === 0 && (
        <EmptyState
          icon="package"
          title="No boxes yet"
          hint="Create a box when you have a handful of items to pack — each box can hold as much as fits."
          action={
            <button type="button" className="btn btn--primary" onClick={() => nav.push({ name: 'box-new' })}>
              <Icon name="plus" size={16} strokeWidth={2.4} />
              Create a box
            </button>
          }
        />
      )}

      {boxes && boxes.length > 0 && (
        <>
          {active.length > 0 && (
            <>
              <h2 className="section-title">On the way ({active.length})</h2>
              {active.map((b) => (
                <BoxRow key={b.id} box={b} onClick={() => nav.push({ name: 'box', id: b.id })} />
              ))}
            </>
          )}
          {unpacked.length > 0 && (
            <>
              <h2 className="section-title">Done ({unpacked.length})</h2>
              {unpacked.map((b) => (
                <BoxRow key={b.id} box={b} onClick={() => nav.push({ name: 'box', id: b.id })} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}