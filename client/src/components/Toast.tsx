import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface Toast {
  id: number;
  message: string;
  tone: 'ok' | 'err';
}

type ShowToast = (message: string, tone?: Toast['tone']) => void;

const ToastContext = createContext<ShowToast>(() => {});

export function useToast(): ShowToast {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback<ShowToast>((message, tone = 'ok') => {
    counter.current += 1;
    const id = counter.current;
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            {toneDot(t.tone)}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function toneDot(tone: Toast['tone']) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: tone === 'ok' ? 'var(--ok)' : 'var(--danger)',
        display: 'inline-block',
        flex: '0 0 auto',
      }}
    />
  );
}