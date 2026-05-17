"use client";

import { Download } from "lucide-react";

export async function exportToCSV(filename: string, rows: Record<string, any>[]) {
  // Send rows to protected server endpoint which validates auth cookie
  try {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, rows }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.message || `Export failed (${res.status})`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    // Fallback: notify user
    alert(err?.message || "Erro ao gerar exportação. Faça login e tente novamente.");
  }
}

export function ToolbarExport({
  onExport,
  count,
}: {
  onExport: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/10 active:scale-[0.99]"
    >
      <Download className="h-4 w-4 text-indigo-200" />
      Exportar CSV <span className="text-zinc-400">({count})</span>
    </button>
  );
}

