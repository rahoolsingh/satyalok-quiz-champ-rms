import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const colors: Record<ToastType, React.CSSProperties> = {
    success: { background: '#166534', color: 'white' },
    error: { background: '#dc2626', color: 'white' },
    info: { background: '#1a237e', color: 'white' },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={styles.container} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...colors[t.type] }} role="alert">
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 9999 },
  toast: { padding: '12px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', maxWidth: '320px', animation: 'fadeIn 0.2s ease' },
};
