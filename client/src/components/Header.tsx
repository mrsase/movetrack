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

export function BrandHeader() {
  return (
    <header className="hdr" style={{ paddingBottom: 6 }}>
      <div className="hdr__title" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
        <span className="hdr__brand">
          <Icon name="package" size={16} />
        </span>
        MoveTrack
      </div>
    </header>
  );
}