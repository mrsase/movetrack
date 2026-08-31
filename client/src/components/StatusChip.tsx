interface StatusChipProps {
  label: string;
  color: string;
}

export function StatusChip({ label, color }: StatusChipProps) {
  return (
    <span className="status-chip" style={{ '--sc': color } as React.CSSProperties}>
      {label}
    </span>
  );
}