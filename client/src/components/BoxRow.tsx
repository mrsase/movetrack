import { Icon } from '../icons';
import { StatusChip } from './StatusChip';
import { BOX_STATUS_META } from '../lib/meta';
import type { Box } from '../types';

interface BoxRowProps {
  box: Box;
  onClick?: () => void;
}

export function BoxRow({ box, onClick }: BoxRowProps) {
  const meta = BOX_STATUS_META[box.status];
  const pct = box.items_total === 0 ? 0 : Math.round((box.items_delivered / box.items_total) * 100);
  return (
    <button type="button" className="row" onClick={onClick}>
      <span className="row__icon" style={{ color: 'var(--ink-2)' }}>
        <Icon name="package" size={19} />
      </span>
      <span className="row__body">
        <span className="row__title">{box.label ?? `Box ${box.id}`}</span>
        <span className="row__meta">
          <span>{box.items_total === 0 ? 'empty' : `${box.items_total} item${box.items_total === 1 ? '' : 's'}`}</span>
          {box.items_delivered > 0 && (
            <>
              <span className="dot" />
              <span>{box.items_delivered} delivered</span>
            </>
          )}
        </span>
        {box.destination && <span className="row__meta">→ {box.destination}</span>}
        {box.items_delivered > 0 && (
          <span className="progress" style={{ display: 'block', marginTop: 8 }}>
            <span className={`progress__fill${pct === 100 ? ' progress__fill--good' : ''}`} style={{ width: `${pct}%` }} />
          </span>
        )}
      </span>
      <span className="row__right">
        <StatusChip label={meta.label} color={meta.color} />
        <Icon name="chevron-right" size={16} style={{ color: 'var(--muted)' }} />
      </span>
    </button>
  );
}