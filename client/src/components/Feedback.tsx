/** Placeholder shimmer blocks shown while a view loads. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="list-loading" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skel" />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box">
      <div>Could not reach the server: {message}</div>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm mt" style={{ marginTop: 10 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}