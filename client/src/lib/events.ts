/** Tiny pub/sub used to refresh any view after a mutation elsewhere. */
type Listener = () => void;

const listeners = new Set<Listener>();

export const bus = {
  emit(): void {
    for (const l of listeners) l();
  },
  on(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};