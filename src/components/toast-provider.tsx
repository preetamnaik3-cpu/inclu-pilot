"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: number;
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id" | "createdAt">) => void;
  dismissToast: (id: string) => void;
  toasts: ToastItem[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToasts() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id" | "createdAt">) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const createdAt = Date.now();
      const item: ToastItem = { ...toast, id, createdAt };

      setToasts((prev) => [item, ...prev].slice(0, 3));
      window.setTimeout(() => {
        dismissToast(id);
      }, 6000);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({ pushToast, dismissToast, toasts }),
    [dismissToast, pushToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function ToastViewport({
  onNavigate,
}: {
  onNavigate: (href: string) => void;
}) {
  const ctx = useToasts();
  if (!ctx) return null;

  return (
    <div className="fixed left-1/2 top-3 z-[60] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 space-y-2">
      {ctx.toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left shadow-[var(--shadow-card)]"
          onClick={() => {
            ctx.dismissToast(t.id);
            onNavigate(t.href);
          }}
        >
          <p className="text-sm font-semibold text-stone-900">{t.title}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-stone-600">
            {t.body}
          </p>
        </button>
      ))}
    </div>
  );
}

