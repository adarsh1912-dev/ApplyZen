import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div aria-live="polite" className="no-print pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
        {items.map(t => (
          <div key={t.id} role="status" className={`pointer-events-auto flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-card ${t.type === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200' : 'border-ink/15 bg-ink text-paper'}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.type === 'error' ? 'bg-red-500' : 'bg-emerald-400'}`} />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
