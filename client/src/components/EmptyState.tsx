import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  hint: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icon} size={26} />
      </div>
      <div className="empty__title">{title}</div>
      <div className="empty__hint">{hint}</div>
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}