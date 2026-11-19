import type { ReactNode } from 'react';
import { Icon } from '../icons';

interface HeaderProps {
  title: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  brand?: boolean;
}

export function Header({ title, onBack, right, brand }: HeaderProps) {
  return (
    <header className="hdr">
      {onBack && (
        <button type="button" className="hdr__back" onClick={onBack} aria-label="Back">
          <Icon name="back" size={20} />
        </button>
      )}
      <h1 className="hdr__title">
        {brand && (
          <span className="hdr__brand">
            <Icon name="package" size={16} />
          </span>
        )}
        {title}
      </h1>
      {right}
    </header>
  );
}

interface BrandHeaderProps {
  /** Live count on the right, e.g. “10 / 46 delivered”. */
  right?: ReactNode;
}

/** The hazard bar: brand and the move's running total. */
export function BrandHeader({ right }: BrandHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <span className="topbar__brand">
          <Icon name="package" size={17} strokeWidth={2.2} />
          MoveTrack
        </span>
        {right && <span className="topbar__count">{right}</span>}
      </div>
    </header>
  );
}
