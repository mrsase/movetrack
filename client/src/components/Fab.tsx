import type { IconName } from '../icons';
import { Icon } from '../icons';

interface FabProps {
  icon?: IconName;
  label: string;
  onClick: () => void;
}

export function Fab({ icon = 'plus', label, onClick }: FabProps) {
  return (
    <button type="button" className="fab" onClick={onClick} aria-label={label}>
      <Icon name={icon} size={24} strokeWidth={2.1} />
    </button>
  );
}