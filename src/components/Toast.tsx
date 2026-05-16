"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export function Toast({
  toast,
  onClose,
}: {
  toast: { id: string; type: ToastType; title: string; message?: string } | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!toast) return;
    const t = window.setTimeout(() => onClose(), 3600);
    return () => window.clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;

  const palette: Record<ToastType, string> = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-100",
    info: "border-indigo-500/30 bg-indigo-500/10 text-indigo-100",
  };

  const cls = palette[toast.type];

  return (
    <div
      className={
        "fixed right-4 top-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] transform transition-all duration-300 " +
        (mounted ? "translate-y-0 opacity-100" : "translate-y-[-6px] opacity-0")
      }
    >
      <div className={`rounded-xl border px-4 py-3 shadow-xl ${cls}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{toast.title}</div>
            {toast.message ? (
              <div className="mt-0.5 text-sm/6 opacity-90">{toast.message}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-current/70 transition hover:bg-black/20 hover:text-current"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

