"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  tone,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const toneCls = tone === "danger" ? "bg-rose-500" : "bg-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
        <div className="text-base font-semibold text-zinc-50">{title}</div>
        {description ? (
          <div className="mt-1 text-sm/6 text-zinc-300">{description}</div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              toneCls + " hover:opacity-95"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

