import { BOX_STATUS_META } from '../lib/meta';
import type { Box } from '../types';

interface BoxTileProps {
  box: Box;
  onClick: () => void;
}

/**
 * One carton on the floor board.
 *
 * The tile carries the physical truth of the box: number, label, destination,
 * contents, and a status stamp. Unsealed boxes are drawn dashed, as an open
 * carton would be; delivered boxes are tinted and stamped.
 */
export function BoxTile({ box, onClick }: BoxTileProps) {
  const meta = BOX_STATUS_META[box.status];
  const name = box.label ?? `Box ${box.id}`;
  const count = box.items_total === 0 ? 'empty' : `${box.items_total} item${box.items_total === 1 ? '' : 's'}`;

  return (
    <button
      type="button"
      className={`tile tile--${box.status}`}
      onClick={onClick}
      aria-label={`${name} · ${count} · ${meta.label}`}
    >
      <span className="tile__num">{String(box.id).padStart(2, '0')}</span>
      <span className="tile__label">{name}</span>
      <span className="tile__dest">{box.destination ?? 'no destination set'}</span>
      <span className="tile__foot">
        <span className="tile__count">{count}</span>
        <span className="tile__stamp">{meta.label}</span>
      </span>
    </button>
  );
}
