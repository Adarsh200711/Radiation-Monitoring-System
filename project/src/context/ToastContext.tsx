import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, message, type, duration };
      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback((title: string, message?: string) => showToast({ title, message, type: 'success' }), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast({ title, message, type: 'warning' }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ title, message, type: 'error' }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ title, message, type: 'info' }), [showToast]);

  const typeStyles: Record<ToastType, { border: string; bg: string; icon: typeof Info; iconColor: string }> = {
    success: {
      border: 'border-emerald-500/30',
      bg: 'bg-slate-900/95 shadow-emerald-500/10',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-slate-900/95 shadow-amber-500/10',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    error: {
      border: 'border-red-500/30',
      bg: 'bg-slate-900/95 shadow-red-500/10',
      icon: AlertCircle,
      iconColor: 'text-red-400',
    },
    info: {
      border: 'border-sky-500/30',
      bg: 'bg-slate-900/95 shadow-sky-500/10',
      icon: Info,
      iconColor: 'text-sky-400',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast, success, warning, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => {
          const s = typeStyles[t.type];
          const IconComponent = s.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${s.border} ${s.bg}`}
            >
              <IconComponent className={`mt-0.5 h-4 w-4 flex-shrink-0 ${s.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-100">{t.title}</p>
                {t.message && <p className="mt-0.5 text-[11px] text-slate-400">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
