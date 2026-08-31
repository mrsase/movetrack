import type { ReactNode } from 'react';

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  ariaPressed?: boolean;
}

export function Chip({ active, onClick, children, className = '', ariaPressed }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip${active ? ' chip--active' : ''} ${className}`}
      onClick={onClick}
      aria-pressed={ariaPressed ?? active}
    >
      {children}
    </button>
  );
}