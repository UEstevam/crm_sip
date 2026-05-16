"use client";

import { useEffect, useState } from "react";
import type { CRMAccount } from "@/lib/crm/types";
import type { CRMStore } from "@/hooks/useCRMStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Toast, type ToastType } from "@/components/Toast";

const FIELD_DEFINITIONS = [
  {
    key: "nomeConta",
    label: "Nome da Conta",
    description: "Valores possíveis para o campo Nome da Conta.",
  },
  {
    key: "contaId",
    label: "ID da Conta",
    description: "Valores possíveis para o campo ID da Conta.",
  },
  {
    key: "responsavel",
    label: "Responsável",
    description: "Valores possíveis para o campo Responsável.",
  },
  {
    key: "antidetect",
    label: "Antidetect",
    description: "Valores possíveis para o campo Antidetect.",
  },
  {
    key: "status",
    label: "Status",
    description: "Valores possíveis para o campo Status.",
  },
  {
    key: "dominio",
    label: "Domínio",
    description: "Valores possíveis para o campo Domínio.",
  },
  {
    key: "fonte",
    label: "Fonte",
    description: "Valores possíveis para o campo Fonte da Conta.",
  },
  {
    key: "formaPagamento",
    label: "Forma de Pagamento",
    description: "Valores possíveis para o campo Forma de Pagamento.",
  },
  {
    key: "oferta",
    label: "Oferta",
    description: "Valores possíveis para o campo Oferta.",
  },
  {
    key: "inicioCa",
    label: "Início da CA",
    description: "Valores possíveis para o campo Início da CA.",
  },
] as const;

type FieldKey = (typeof FIELD_DEFINITIONS)[number]['key'];

type DraftValues = Record<string, string>;

type ConfirmState = {
  open: boolean;
  field: FieldKey | null;
  value: string | null;
};

function makeInitialAddValues() {
  return FIELD_DEFINITIONS.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {} as Record<FieldKey, string>);
}

function optionKey(field: FieldKey, value: string) {
  return `${field}:${value}`;
}

export function CRMFieldAdmin({ store }: { store: CRMStore }) {
  const [draftValues, setDraftValues] = useState<DraftValues>({});
  const [addValues, setAddValues] = useState<Record<FieldKey, string>>(
    () => makeInitialAddValues()
  );
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    field: null,
    value: null,
  });
  const [toast, setToast] = useState<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const next: DraftValues = {};
    for (const field of FIELD_DEFINITIONS) {
      for (const value of store.options[field.key]) {
        next[optionKey(field.key, value)] = value;
      }
    }
    setDraftValues(next);
  }, [store.options]);

  const showToast = (toastData: {
    type: ToastType;
    title: string;
    message?: string;
  }) => {
    setToast({ id: String(Date.now()), ...toastData });
  };

  const handleAddValue = (fieldKey: FieldKey) => {
    const value = String(addValues[fieldKey] ?? "").trim();
    if (!value) {
      showToast({ type: "error", title: "Valor obrigatório", message: "Digite um valor antes de adicionar." });
      return;
    }
    const exists = store.options[fieldKey].some(
      (item) => item.trim().toLowerCase() === value.toLowerCase()
    );
    if (exists) {
      showToast({ type: "error", title: "Valor já existe", message: "Esse valor já está presente neste campo." });
      return;
    }

    store.setOption(fieldKey, value);
    setAddValues((prev) => ({ ...prev, [fieldKey]: "" }));
    showToast({ type: "success", title: "Valor adicionado", message: "O valor foi incluído no campo." });
  };

  const handleRenameOption = (
    fieldKey: FieldKey,
    previousValue: string,
    nextValue: string
  ) => {
    const trimmed = String(nextValue ?? "").trim();
    if (!trimmed) {
      showToast({ type: "error", title: "Valor inválido", message: "Digite um valor válido para renomear." });
      return;
    }
    const result = store.renameOption(fieldKey, previousValue, trimmed);
    if (!result.ok) {
      showToast({ type: "error", title: "Falha ao renomear", message: result.reason });
      return;
    }
    showToast({ type: "success", title: "Valor atualizado", message: "O valor foi atualizado em opções e registros." });
  };

  const handleDeleteOption = () => {
    const fieldKey = confirm.field;
    const value = confirm.value;
    if (!fieldKey || !value) return;

    const result = store.removeOption(fieldKey, value);
    setConfirm({ open: false, field: null, value: null });
    if (!result.ok) {
      showToast({ type: "error", title: "Não foi possível excluir", message: result.reason });
      return;
    }

    showToast({ type: "success", title: "Valor excluído", message: "O valor foi removido do campo." });
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Admin de Campos</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie valores criáveis dos campos do CRUD. Edite e exclua opções por campo.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {FIELD_DEFINITIONS.map((field) => (
          <section key={field.key} className="rounded-3xl border border-white/10 bg-black/20 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-100">{field.label}</div>
                <div className="mt-1 text-xs text-zinc-500">{field.description}</div>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200">
                {store.options[field.key].length} valores
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={addValues[field.key]}
                onChange={(event) =>
                  setAddValues((prev) => ({
                    ...prev,
                    [field.key]: event.target.value,
                  }))
                }
                placeholder={`Novo valor para ${field.label}`}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-zinc-50 outline-none focus:border-indigo-400/30 focus:ring-2 focus:ring-indigo-400/15"
              />
              <button
                type="button"
                onClick={() => handleAddValue(field.key)}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Adicionar
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {store.options[field.key].length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-zinc-500">
                  Nenhum valor cadastrado ainda.
                </div>
              ) : (
                store.options[field.key].map((value) => {
                  const draftKey = optionKey(field.key, value);
                  const draft = draftValues[draftKey] ?? value;
                  const usedCount = store.accounts.filter(
                    (account) =>
                      String(account[field.key as keyof CRMAccount] ?? "")
                        .trim()
                        .toLowerCase() === value.toLowerCase()
                  ).length;
                  const hasChanged = draft.trim() !== value.trim();
                  const duplicate = store.options[field.key].some(
                    (item) =>
                      item.trim().toLowerCase() === draft.trim().toLowerCase() &&
                      item.trim().toLowerCase() !== value.toLowerCase()
                  );

                  return (
                    <div
                      key={value}
                      className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                        <div className="grid gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-zinc-100">{value}</span>
                            <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                              {usedCount} reg{usedCount === 1 ? "istro" : "istros"}
                            </span>
                          </div>
                          <input
                            value={draft}
                            onChange={(event) =>
                              setDraftValues((prev) => ({
                                ...prev,
                                [draftKey]: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-zinc-50 outline-none focus:border-indigo-400/30 focus:ring-2 focus:ring-indigo-400/15"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={!hasChanged || !draft.trim() || duplicate}
                            onClick={() => handleRenameOption(field.key, value, draft)}
                            className={
                              "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                              (hasChanged && draft.trim() && !duplicate
                                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                                : "bg-white/5 text-zinc-500 cursor-not-allowed")
                            }
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            disabled={usedCount > 0}
                            onClick={() =>
                              setConfirm({ open: true, field: field.key, value })
                            }
                            className={
                              "rounded-xl px-4 py-2 text-sm font-semibold transition " +
                              (usedCount === 0
                                ? "bg-rose-500 text-white hover:bg-rose-400"
                                : "bg-white/5 text-zinc-500 cursor-not-allowed")
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                      {duplicate ? (
                        <div className="mt-2 text-xs text-rose-300">
                          Esse valor já existe em outra opção.
                        </div>
                      ) : null}
                      {usedCount > 0 ? (
                        <div className="mt-2 text-xs text-zinc-400">
                          Não é possível excluir enquanto houver registros associados.
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>

      <ConfirmDialog
        open={confirm.open}
        tone="danger"
        title="Excluir valor?"
        description="Essa ação remove o valor do catálogo de opções. Registros existentes continuarão inalterados." 
        confirmText="Excluir"
        cancelText="Cancelar"
        onCancel={() => setConfirm({ open: false, field: null, value: null })}
        onConfirm={handleDeleteOption}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
