import type { IconName } from '../icons';
import { Icon } from '../icons';

export type TabName = 'overview' | 'items' | 'boxes';

const TABS: { key: TabName; label: string; icon: IconName }[] = [
  { key: 'overview', label: 'Overview', icon: 'home' },
  { key: 'items', label: 'Items', icon: 'list' },
  { key: 'boxes', label: 'Boxes', icon: 'package' },
];

interface BottomNavProps {
  active: TabName;
  onChange: (tab: TabName) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav__inner">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`nav__tab${active === t.key ? ' nav__tab--active' : ''}`}
            onClick={() => onChange(t.key)}
            aria-current={active === t.key ? 'page' : undefined}
          >
            <span className="nav__tab-icon">
              <Icon name={t.icon} size={21} />
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}