import type { CRMStatus } from "@/lib/crm/types";

const stylesByStatus: Record<string, string> = {
  Ativa: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
  Bloqueada: "bg-rose-500/15 text-rose-200 border-rose-500/20",
  Aquecimento: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  Apagada: "bg-slate-500/15 text-slate-200 border-slate-500/20",
};

export function StatusBadge({ status }: { status: CRMStatus }) {
  const key = String(status ?? "");
  const cls = stylesByStatus[key] ?? "bg-zinc-500/15 text-zinc-200 border-zinc-500/20";

  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold " +
        cls
      }
      title={key}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {key || "—"}
    </span>
  );
}

