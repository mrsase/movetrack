interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function Stepper({ value, onChange, min = 1, max = 9999, label }: StepperProps) {
  return (
    <div className="flex">
      <div className="stepper">
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Decrease"
        >
          −
        </button>
        <span className="stepper__value">{value}</span>
        <button
          type="button"
          className="stepper__btn"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Increase"
        >
          +
        </button>
      </div>
      {label && <span className="muted" style={{ fontSize: 13.5 }}>{label}</span>}
    </div>
  );
}