"use client";

import { Download } from "lucide-react";

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    const blob = new Blob([""], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/["\n,;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(
    "\n"
  );

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

