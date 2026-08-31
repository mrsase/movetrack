import { CategoryIcon } from '../icons';
import { StatusChip } from './StatusChip';
import { ITEM_STATUS_META } from '../lib/meta';
import { categoryColor, categoryLabel } from '../lib/categories';
import type { Item } from '../types';

interface ItemRowProps {
  item: Item;
  onClick?: () => void;
  sub?: string;
  dimmed?: boolean;
}

export function ItemRow({ item, onClick, sub, dimmed }: ItemRowProps) {
  const status = ITEM_STATUS_META[item.status];
  return (
    <button type="button" className={`row${dimmed ? ' dimmed' : ''}`} onClick={onClick} style={{ '--ic': categoryColor(item.category) } as React.CSSProperties}>
      <span className="row__icon">
        <CategoryIcon category={item.category} size={19} />
      </span>
      <span className="row__body">
        <span className="row__title">{item.name}</span>
        <span className="row__meta">
          <span>{categoryLabel(item.category)}</span>
          {item.serial && (
            <>
              <span className="dot" />
              <span className="mono">{item.serial}</span>
            </>
          )}
          {sub && (
            <>
              <span className="dot" />
              <span>{sub}</span>
            </>
          )}
        </span>
      </span>
      <span className="row__right">
        <StatusChip label={status.label} color={status.color} />
        {item.quantity > 1 && <span className="row__qty">×{item.quantity}</span>}
      </span>
    </button>
  );
}