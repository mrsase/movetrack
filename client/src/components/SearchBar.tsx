import { Icon } from '../icons';

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = 'Search…', autoFocus }: SearchBarProps) {
  return (
    <div className="search">
      <span className="search__icon">
        <Icon name="search" size={18} />
      </span>
      <input
        className="search__input"
        type="search"
        inputMode="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
      {value && (
        <button type="button" className="search__clear" onClick={() => onChange('')} aria-label="Clear search">
          <Icon name="close" size={15} />
        </button>
      )}
    </div>
  );
}