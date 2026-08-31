import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../icons';

interface SheetProps {
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({ onClose, title, children }: SheetProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grab" />
        {title && <h2 className="sheet__title">{title}</h2>}
        <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}