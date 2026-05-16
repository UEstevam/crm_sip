"use client";

import { useMemo, useState } from "react";
import type { CRMAccount, CRMOptions } from "@/lib/crm/types";
import type { CRMStore } from "@/hooks/useCRMStore";
import { makeEmptyForm } from "@/hooks/useCRMStore";
import { ComboboxCreatable } from "@/components/ComboboxCreatable";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Toast, type ToastType } from "@/components/Toast";
import { exportToCSV, ToolbarExport } from "@/components/ToolbarExport";

const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);

function formatDateInput(v: string) {
  if (!v) return "";
  // expecting yyyy-mm-dd already
  return v.slice(0, 10);
}

type CRMFormProps = {
  store: CRMStore;
};

export function CRMForm({ store }: CRMFormProps) {
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<CRMAccount, "createdAt" | "updatedAt">>(() =>
    makeEmptyForm()
  );


  const [confirm, setConfirm] = useState<{ open: boolean; id: string | null }>(
    { open: false, id: null }
  );

  const [toast, setToast] = useState<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
  } | null>(null);

  const options = store.options;

  const canSubmit = useMemo(() => {
    if (!form.nomeConta.trim()) return false;
    if (!form.contaId.trim()) return false;
    if (!form.status.trim()) return false;
    if (!form.inicioCa.trim()) return false;
    return true;
  }, [form]);

  const resetForm = () => {
    setMode("create");
    setEditingId(null);
    setForm(makeEmptyForm());
  };

  const showToast = (t: { type: ToastType; title: string; message?: string }) => {
    setToast({ id: String(Date.now()), ...t });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      showToast({
        type: "error",
        title: "Campos obrigatórios faltando",
        message: "Preencha Nome da Conta, ID da Conta, Status e Início da CA.",
      });
      return;
    }

    if (mode === "create") {
      const res = store.createAccount({
        ...form,
        gastos: Number(form.gastos ?? 0),
      });
      if (!res.ok) {
        showToast({ type: "error", title: "Não foi possível salvar", message: res.reason });
        return;
      }
      showToast({
        type: "success",
        title: "Conta salva",
        message: "Registro criado com sucesso.",
      });
      resetForm();
    } else {
      if (!editingId) return;
      const res = store.updateAccount(editingId, {
        ...form,
        gastos: Number(form.gastos ?? 0),
      });
      if (!res.ok) {
        showToast({ type: "error", title: "Não foi possível atualizar", message: res.reason });
        return;
      }
      showToast({
        type: "success",
        title: "Atualizado",
        message: "Registro atualizado com sucesso.",
      });
      resetForm();
    }
  };

  const accounts = store.accounts;

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">CRUD de Contas</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Crie, edite e exclua registros. Todas as opções dos selects são criáveis e persistem via LocalStorage.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-3xl border border-white/10 bg-black/20 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-zinc-200">
                {mode === "create" ? "Inserir novo registro" : "Editar registro"}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {mode === "create" ? "Preencha os campos para salvar" : "Atualize os campos e confirme"}
              </div>
            </div>
            {mode === "edit" && form.status ? <StatusBadge status={form.status} /> : null}
          </div>

          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ComboboxCreatable
                label="Nome da Conta"
                value={form.nomeConta}
                options={options.nomeConta}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("nomeConta", v)}
                onChange={(v) => setForm((p) => ({ ...p, nomeConta: v }))}
              />
              <ComboboxCreatable
                label="ID da Conta"
                value={form.contaId}
                options={options.contaId}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("contaId", v)}
                onChange={(v) => {
                  // Regras UX: o CRUD usa `id` como identificador interno.
                  // Para evitar erro confuso, sincronizamos `id` com o campo "ID da Conta".
                  setForm((p) => ({ ...p, contaId: v, id: v }));
                }}
              />
              <ComboboxCreatable
                label="Responsável"
                value={form.responsavel}
                options={options.responsavel}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("responsavel", v)}
                onChange={(v) => setForm((p) => ({ ...p, responsavel: v }))}
              />

              <ComboboxCreatable
                label="Antidetect"
                value={form.antidetect}
                options={options.antidetect}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("antidetect", v)}
                onChange={(v) => setForm((p) => ({ ...p, antidetect: v }))}
              />
              <ComboboxCreatable
                label="Status"
                value={form.status}
                options={options.status}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("status", v)}
                onChange={(v) => setForm((p) => ({ ...p, status: v }))}
              />
              <ComboboxCreatable
                label="Domínio"
                value={form.dominio}
                options={options.dominio}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("dominio", v)}
                onChange={(v) => setForm((p) => ({ ...p, dominio: v }))}
              />
              <ComboboxCreatable
                label="Fonte da Conta"
                value={form.fonte}
                options={options.fonte}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("fonte", v)}
                onChange={(v) => setForm((p) => ({ ...p, fonte: v }))}
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-200">
                  Gastos da Conta
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={Number.isFinite(form.gastos) ? form.gastos : 0}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gastos: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-zinc-50 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-400/30 focus:ring-2 focus:ring-indigo-400/15"
                />
                <div className="text-xs text-zinc-500">{money(form.gastos)}</div>
              </div>
              <ComboboxCreatable
                label="Forma de Pagamento"
                value={form.formaPagamento}
                options={options.formaPagamento}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("formaPagamento", v)}
                onChange={(v) => setForm((p) => ({ ...p, formaPagamento: v }))}
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-200">
                  Início da CA
                </label>
                <input
                  type="date"
                  value={formatDateInput(form.inicioCa)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, inicioCa: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-zinc-50 outline-none ring-0 focus:border-indigo-400/30 focus:ring-2 focus:ring-indigo-400/15"
                />
              </div>
              <ComboboxCreatable
                label="Oferta"
                value={form.oferta}
                options={options.oferta}
                placeholder="Digite para filtrar ou criar"
                onCreateOption={(v) => store.setOption("oferta", v)}
                onChange={(v) => setForm((p) => ({ ...p, oferta: v }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-200">OBS</label>
              <textarea
                value={form.obs}
                onChange={(e) => setForm((p) => ({ ...p, obs: e.target.value }))}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-zinc-50 outline-none ring-0 placeholder:text-zinc-500 focus:border-indigo-400/30 focus:ring-2 focus:ring-indigo-400/15"
                placeholder="Anotações relevantes..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {mode === "edit" ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                  onClick={() => setForm(makeEmptyForm())}
                >
                  Limpar
                </button>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={
                    "rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition " +
                    (canSubmit
                      ? "bg-indigo-500 hover:opacity-95 active:scale-[0.99]"
                      : "bg-indigo-500/50 cursor-not-allowed")
                  }
                >
                  {mode === "create" ? "Salvar" : "Atualizar"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-100">Registros</div>
              <div className="mt-1 text-xs text-zinc-500">
                {accounts.length === 0 ? "Nenhum registro ainda." : `Total: ${accounts.length}`}
              </div>
            </div>

            <ToolbarExport
              count={accounts.length}
              onExport={() => {
                const rows = accounts.map((a) => ({
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
                  createdAt: new Date(a.createdAt).toISOString(),
                  updatedAt: new Date(a.updatedAt).toISOString(),
                }));
                exportToCSV("crm-accounts.csv", rows);
              }}
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950/90">
                  <tr className="text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Conta ID</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Antidetect</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Gastos</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                        Comece criando um registro.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((a) => (
                      <tr key={a.id} className="hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-50">{a.nomeConta}</div>
                          <div className="text-xs text-zinc-500">{a.id}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-200">{a.contaId}</td>
                        <td className="px-4 py-3 text-zinc-200">{a.responsavel}</td>
                        <td className="px-4 py-3 text-zinc-200">{a.antidetect}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-200">
                          {money(a.gastos)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMode("edit");
                                setEditingId(a.id);
                                setForm({
                                  id: a.id,
                                  nomeConta: a.nomeConta,
                                  contaId: a.contaId,
                                  responsavel: a.responsavel,
                                  antidetect: a.antidetect,
                                  status: a.status,
                                  dominio: a.dominio,
                                  gastos: a.gastos,
                                  fonte: a.fonte,
                                  formaPagamento: a.formaPagamento,
                                  inicioCa: a.inicioCa,
                                  oferta: a.oferta,
                                  obs: a.obs,
                                });
                              }}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirm({ open: true, id: a.id })}
                              className="rounded-xl bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 ring-1 ring-rose-500/30 transition hover:bg-rose-500/25"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <ConfirmDialog
            open={confirm.open}
            tone="danger"
            title="Excluir registro?"
            description="Essa ação não pode ser desfeita. O registro e as opções continuam salvos no seu navegador."
            confirmText="Excluir"
            cancelText="Cancelar"
            onCancel={() => setConfirm({ open: false, id: null })}
            onConfirm={() => {
              const id = confirm.id;
              if (!id) return;
              const res = store.deleteAccount(id);
              setConfirm({ open: false, id: null });
              if (!res.ok) {
                showToast({ type: "error", title: "Falha ao excluir", message: res.reason });
                return;
              }
              showToast({ type: "success", title: "Excluído", message: "Registro removido com sucesso." });
              if (editingId === id) resetForm();
            }}
          />

          <Toast toast={toast} onClose={() => setToast(null)} />
        </section>
      </div>
    </div>
  );
}

