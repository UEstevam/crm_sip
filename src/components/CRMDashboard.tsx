"use client";

import { useMemo, useState, memo, useCallback } from "react";
import type { CRMAccount } from "@/lib/crm/types";
import { StatusBadge } from "@/components/StatusBadge";
import { ToolbarExport, exportToCSV } from "@/components/ToolbarExport";

const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);

type SortKey =
  | "gastosDesc"
  | "gastosAsc"
  | "inicioDesc"
  | "inicioAsc"
  | "updatedDesc";

type Props = {
  accounts: CRMAccount[];
};

const ROWS_PER_PAGE = 20;

function toDateTs(s: string) {
  const d = new Date(s);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

// Memoize row component para evitar re-render desnecessários
const TableRow = memo(function TableRow({ account }: { account: CRMAccount }) {
  return (
    <tr className="hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="font-semibold text-zinc-50">{account.nomeConta}</div>
        <div className="text-xs text-zinc-500">{account.contaId}</div>
      </td>
      <td className="px-4 py-3 text-zinc-200">{account.responsavel}</td>
      <td className="px-4 py-3 text-zinc-200">{account.antidetect}</td>
      <td className="px-4 py-3">
        <StatusBadge status={account.status} />
      </td>
      <td className="px-4 py-3 text-zinc-200">{account.dominio}</td>
      <td className="px-4 py-3 text-right text-zinc-200">{money(account.gastos)}</td>
      <td className="px-4 py-3 text-zinc-200">{account.inicioCa}</td>
      <td className="px-4 py-3">
        <div className="text-xs text-zinc-400">Use "CRUD / Contas" para editar.</div>
      </td>
    </tr>
  );
});

export function CRMDashboard({ accounts }: Props) {
  const [status, setStatus] = useState<string>("Todos");
  const [responsavel, setResponsavel] = useState<string>("Todos");
  const [antidetect, setAntidetect] = useState<string>("Todos");
  const [q, setQ] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("gastosDesc");
  const [groupBy, setGroupBy] = useState<"responsavel" | "antidetect">("responsavel");
  const [currentPage, setCurrentPage] = useState(0);

  // Extrair opciones unicamente
  const statuses = useMemo(() => {
    const set = new Set(accounts.map((a) => a.status).filter(Boolean));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [accounts]);

  const responsaveis = useMemo(() => {
    const set = new Set(accounts.map((a) => a.responsavel).filter(Boolean));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [accounts]);

  const antidetects = useMemo(() => {
    const set = new Set(accounts.map((a) => a.antidetect).filter(Boolean));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [accounts]);

  // Filtrar y ordenar registros
  const filteredSorted = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const filtered = accounts.filter((a) => {
      if (status !== "Todos" && a.status !== status) return false;
      if (responsavel !== "Todos" && a.responsavel !== responsavel) return false;
      if (antidetect !== "Todos" && a.antidetect !== antidetect) return false;
      if (qq) {
        const hay = `${a.nomeConta} ${a.contaId}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortKey === "gastosDesc") return (b.gastos ?? 0) - (a.gastos ?? 0);
      if (sortKey === "gastosAsc") return (a.gastos ?? 0) - (b.gastos ?? 0);
      if (sortKey === "inicioDesc") return toDateTs(b.inicioCa) - toDateTs(a.inicioCa);
      if (sortKey === "inicioAsc") return toDateTs(a.inicioCa) - toDateTs(b.inicioCa);
      if (sortKey === "updatedDesc") return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
      return 0;
    });
    return sorted;
  }, [accounts, status, responsavel, antidetect, q, sortKey]);

  // Paginación para renderizar solo 20 filas por vez
  const paginatedRows = useMemo(() => {
    const start = currentPage * ROWS_PER_PAGE;
    return filteredSorted.slice(start, start + ROWS_PER_PAGE);
  }, [filteredSorted, currentPage]);

  const totalPages = Math.ceil(filteredSorted.length / ROWS_PER_PAGE);

  // Resetear página cuando filtros cambian
  const handleFilterChange = useCallback((newValue: string, filterType: 'status' | 'responsavel' | 'antidetect' | 'q' | 'sort') => {
    setCurrentPage(0);
    if (filterType === 'status') setStatus(newValue);
    else if (filterType === 'responsavel') setResponsavel(newValue);
    else if (filterType === 'antidetect') setAntidetect(newValue);
    else if (filterType === 'q') setQ(newValue);
    else if (filterType === 'sort') setSortKey(newValue as SortKey);
  }, []);

  // KPIs - calcular solo cuando accounts o groupBy cambian
  const kpis = useMemo(() => {
    const active = accounts.filter((a) => String(a.status).toLowerCase() === "ativa").length;
    const blocked = accounts.filter((a) => String(a.status).toLowerCase() === "bloqueada").length;
    const verification = accounts.filter(
      (a) => String(a.status).toLowerCase() === "em verificação de anunciante"
    ).length;
    const gastoTotal = accounts.reduce((acc, a) => acc + (Number.isFinite(a.gastos) ? a.gastos : 0), 0);
    const averageGasto = accounts.length ? gastoTotal / accounts.length : 0;

    const by = new Map<string, number>();
    for (const a of accounts) {
      const k = groupBy === "responsavel" ? a.responsavel : a.antidetect;
      const cur = by.get(k) ?? 0;
      by.set(k, cur + (Number.isFinite(a.gastos) ? a.gastos : 0));
    }
    const dist = Array.from(by.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { active, blocked, verification, gastoTotal, averageGasto, dist };
  }, [accounts, groupBy]);

  const exportRows = useMemo(() => {
    return filteredSorted.map((a) => ({
      id: a.id,
      nomeConta: a.nomeConta,
      contaId: a.contaId,
      responsavel: a.responsavel,
      antidetect: a.antidetect,
      status: a.status,
      dominio: a.dominio,
      fonte: a.fonte,
      gastos: a.gastos,
      formaPagamento: a.formaPagamento,
      inicioCa: a.inicioCa,
      oferta: a.oferta,
      obs: a.obs,
      updatedAt: new Date(a.updatedAt).toISOString(),
      createdAt: new Date(a.createdAt).toISOString(),
    }));
  }, [filteredSorted]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">CRM Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Painel gerencial com visão clara de contas, filtros rápidos e exportação de dados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ToolbarExport
            onExport={() => exportToCSV("crm-accounts-visible.csv", exportRows)}
            count={filteredSorted.length}
          />
          <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-100">
            {filteredSorted.length} registros visíveis
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm min-h-[150px]">
          <div className="text-sm font-semibold text-zinc-200">Contas Ativas</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-3xl font-semibold text-emerald-200">{kpis.active}</div>
            <StatusBadge status={"Ativa"} />
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm min-h-[150px]">
          <div className="text-sm font-semibold text-zinc-200">Contas Suspensas</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-3xl font-semibold text-rose-200">{kpis.blocked}</div>
            <StatusBadge status={"Bloqueada"} />
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm min-h-[150px]">
          <div className="text-sm font-semibold text-zinc-200">Verificação de Anunciante</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-3xl font-semibold text-amber-200">{kpis.verification}</div>
            <div className="rounded-2xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100 ring-1 ring-amber-400/20">
              Status
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm min-h-[150px]">
          <div className="text-sm font-semibold text-zinc-200">Gasto Total</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-3xl font-semibold text-indigo-200">{money(kpis.gastoTotal)}</div>
            <div className="rounded-2xl bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-400/20">
              {accounts.length} registros
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm min-h-[150px]">
          <div className="text-sm font-semibold text-zinc-200">Média por Conta</div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-3xl font-semibold text-sky-200">{money(kpis.averageGasto)}</div>
            <div className="rounded-2xl bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100 ring-1 ring-sky-400/20">
              Média
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Status</label>
              <select
                value={status}
                onChange={(e) => handleFilterChange(e.target.value, 'status')}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-indigo-400/30"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Responsável</label>
              <select
                value={responsavel}
                onChange={(e) => handleFilterChange(e.target.value, 'responsavel')}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-indigo-400/30"
              >
                {responsaveis.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Antidetect</label>
              <select
                value={antidetect}
                onChange={(e) => handleFilterChange(e.target.value, 'antidetect')}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-indigo-400/30"
              >
                {antidetects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Busca</label>
              <input
                value={q}
                onChange={(e) => handleFilterChange(e.target.value, 'q')}
                placeholder="Nome / ID"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-50 outline-none placeholder:text-zinc-500 focus:border-indigo-400/30"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Ordenar registros
            </div>
            <select
              value={sortKey}
              onChange={(e) => handleFilterChange(e.target.value, 'sort')}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-50 outline-none focus:border-indigo-400/30"
            >
              <option value="gastosDesc">Gasto (maior → menor)</option>
              <option value="gastosAsc">Gasto (menor → maior)</option>
              <option value="inicioDesc">Início (mais recente)</option>
              <option value="inicioAsc">Início (mais antigo)</option>
              <option value="updatedDesc">Atualização (mais recente)</option>
            </select>
            <div className="rounded-3xl bg-white/5 p-4 text-sm text-zinc-300">
              <div className="font-semibold text-zinc-100">Filtros ativos</div>
              <div className="mt-2 space-y-2 text-xs text-zinc-400">
                <div>Status: <span className="font-medium text-zinc-200">{status}</span></div>
                <div>Responsável: <span className="font-medium text-zinc-200">{responsavel}</span></div>
                <div>Antidetect: <span className="font-medium text-zinc-200">{antidetect}</span></div>
                <div>Busca: <span className="font-medium text-zinc-200">{q || "Nenhuma"}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Top {groupBy === "responsavel" ? "Responsáveis" : "Antidetect"}</div>
            <div className="mt-1 text-sm text-zinc-400">Distribuição de gastos separados do painel de contas.</div>
          </div>
          <div className="rounded-2xl bg-zinc-950/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
            {groupBy === "responsavel" ? "Responsável" : "Antidetect"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {kpis.dist.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
              Sem dados para distribuição.
            </div>
          ) : (
            kpis.dist.map(([k, v]) => (
              <div key={k} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold text-zinc-100 truncate">{k}</div>
                <div className="mt-3 text-3xl font-semibold text-indigo-200">{money(v)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/20 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-100">Contas</div>
            <div className="mt-1 text-sm text-zinc-400">Visualização limpa e isolada das contas.</div>
          </div>
          <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
            {filteredSorted.length} resultados
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-950/90">
                <tr className="text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Antidetect</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Domínio</th>
                  <th className="px-4 py-3 text-right">Gastos</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-500">
                      Nenhum registro com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((a) => (
                    <TableRow key={a.id} account={a} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Página {currentPage + 1} de {totalPages} • {filteredSorted.length} registros totais
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
