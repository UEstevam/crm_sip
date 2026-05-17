"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CRMAccount, CRMOptions } from "@/lib/crm/types";
import {
  createAccountFromForm,
  getDefaultState,
  loadPersistedState,
  normalizeOptions,
  savePersistedState,
  upsertOption,
  updateAccountTimestamp,
} from "@/lib/crm/storage";

export type CRMStore = {
  options: CRMOptions;
  accounts: CRMAccount[];

  setOption: (key: keyof CRMOptions, value: string) => void;
  renameOption: (
    key: keyof CRMOptions,
    previousValue: string,
    nextValue: string
  ) => { ok: true } | { ok: false; reason: string };
  removeOption: (key: keyof CRMOptions, value: string) =>
    | { ok: true }
    | { ok: false; reason: string };

  createAccount: (input: Omit<CRMAccount, "createdAt" | "updatedAt">) =>
    | { ok: true; account: CRMAccount }
    | { ok: false; reason: string };

  updateAccount: (
    id: string,
    input: Omit<CRMAccount, "createdAt" | "updatedAt">
  ) => { ok: true } | { ok: false; reason: string };

  deleteAccount: (id: string) => { ok: true } | { ok: false; reason: string };

  load: () => void;
};

const makeEmptyForm = (): Omit<CRMAccount, "createdAt" | "updatedAt"> => ({
  id: "",
  nomeConta: "",
  contaId: "",
  responsavel: "",
  antidetect: "",
  status: "",
  dominio: "",
  gastos: 0,
  fonte: "",
  formaPagamento: "",
  inicioCa: "",
  oferta: "",
  obs: "",
});

const STORAGE_VERSION_GUARD = true;

export function useCRMStore(): CRMStore {
  const [options, setOptions] = useState<CRMOptions>(getDefaultState().options);
  const [accounts, setAccounts] = useState<CRMAccount[]>(getDefaultState().accounts);

  // Load persisted state apenas uma vez na montagem
  useEffect(() => {
    const persisted = loadPersistedState();
    if (!persisted || !STORAGE_VERSION_GUARD) return;

    // Evita validação/atualização desnecessária quando estado já está carregado.
    setOptions((prev) => {
      const next = normalizeOptions(persisted.options);
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
    setAccounts((prev) => {
      const next = Array.isArray(persisted.accounts) ? persisted.accounts : [];
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
  }, []);

  // Debounce localStorage save para evitar saves frequentes
  useEffect(() => {
    const timer = setTimeout(() => {
      savePersistedState({ options, accounts });
    }, 500);
    return () => clearTimeout(timer);
  }, [options, accounts]);

  const setOption = useCallback((key: keyof CRMOptions, value: string) => {
    setOptions((prev) => {
      const next = upsertOption(prev, key, value);
      return prev === next ? prev : next;
    });
  }, []);

  const removeOption = useCallback(
    (key: keyof CRMOptions, value: string) => {
      const trimmed = String(value ?? "").trim();
      if (!trimmed) return { ok: false as const, reason: "Valor inválido." };

      const lower = trimmed.toLowerCase();
      const isInUse = accounts.some(
        (account) =>
          String(account[key as keyof CRMAccount] ?? "")
            .trim()
            .toLowerCase() === lower
      );
      if (isInUse) {
        return {
          ok: false as const,
          reason: "Não é possível excluir, há registros usando este valor.",
        };
      }

      setOptions((prev) => {
        const current = prev[key] ?? [];
        const next = current.filter(
          (item) => item.trim().toLowerCase() !== lower
        );
        return next.length === current.length ? prev : { ...prev, [key]: next };
      });

      return { ok: true as const };
    },
    // Usar setState callback para evitar dependência em accounts
    []
  );

  const renameOption = useCallback(
    (
      key: keyof CRMOptions,
      previousValue: string,
      nextValue: string
    ) => {
      const oldTrimmed = String(previousValue ?? "").trim();
      const newTrimmed = String(nextValue ?? "").trim();
      if (!oldTrimmed || !newTrimmed) {
        return { ok: false as const, reason: "Valor inválido." };
      }

      const lowerOld = oldTrimmed.toLowerCase();
      const lowerNew = newTrimmed.toLowerCase();
      const current = options[key] ?? [];
      const hasOld = current.some(
        (item) => item.trim().toLowerCase() === lowerOld
      );
      if (!hasOld) {
        return { ok: false as const, reason: "Valor não encontrado." };
      }

      if (lowerOld === lowerNew) {
        return {
          ok: false as const,
          reason: "Nenhuma alteração detectada.",
        };
      }

      const alreadyExists = current.some(
        (item) => item.trim().toLowerCase() === lowerNew
      );
      if (alreadyExists) {
        return {
          ok: false as const,
          reason: "Já existe um valor igual para este campo.",
        };
      }

      setOptions((prev) => {
        const currentOptions = prev[key] ?? [];
        const nextOptions = currentOptions
          .map((item) =>
            item.trim().toLowerCase() === lowerOld ? newTrimmed : item
          )
          .sort((a, b) => a.localeCompare(b, "pt-BR"));
        return {
          ...prev,
          [key]: nextOptions,
        };
      });

      setAccounts((prev) =>
        prev.map((account) => {
          const accountValue = String(
            account[key as keyof CRMAccount] ?? ""
          ).trim();
          if (accountValue.toLowerCase() !== lowerOld) return account;
          return updateAccountTimestamp({
            ...account,
            [key]: newTrimmed,
          } as CRMAccount);
        })
      );

      return { ok: true as const };
    },
    [options]
  );

  const createAccount = useCallback(
    (input: Omit<CRMAccount, "createdAt" | "updatedAt">) => {
      const nomeConta = input.nomeConta.trim();
      const contaId = input.contaId.trim();
      const id = input.id.trim();

      if (!nomeConta) return { ok: false as const, reason: "Nome da Conta é obrigatório." };
      if (!contaId) return { ok: false as const, reason: "ID da Conta é obrigatório." };
      if (!id) return { ok: false as const, reason: "ID (interno) da linha é obrigatório." };
      if (!input.status.trim()) return { ok: false as const, reason: "Status é obrigatório." };

      let exists = false;
      setAccounts((prev) => {
        exists = prev.some((a) => a.id === id);
        return prev;
      });
      if (exists) return { ok: false as const, reason: "Já existe um registro com esse ID." };

      // Ensure option catalogs contain referenced values
      setOptions((prev) => {
        let next = prev;
        next = upsertOption(next, "nomeConta", nomeConta);
        next = upsertOption(next, "contaId", contaId);
        next = upsertOption(next, "responsavel", input.responsavel.trim());
        next = upsertOption(next, "antidetect", input.antidetect.trim());
        next = upsertOption(next, "status", input.status.trim());
        next = upsertOption(next, "dominio", input.dominio.trim());
        next = upsertOption(next, "fonte", input.fonte.trim());
        next = upsertOption(next, "formaPagamento", input.formaPagamento.trim());
        next = upsertOption(next, "oferta", input.oferta.trim());
        next = upsertOption(next, "inicioCa", input.inicioCa.trim());
        return next;
      });

      const account = createAccountFromForm(input);
      setAccounts((prev) => [account, ...prev].sort((a, b) => b.createdAt - a.createdAt));
      return { ok: true as const, account };
    },
    []
  );

  const updateAccount = useCallback(
    (
      id: string,
      input: Omit<CRMAccount, "createdAt" | "updatedAt">
    ): { ok: true } | { ok: false; reason: string } => {
      let idx = -1;
      setAccounts((prev) => {
        idx = prev.findIndex((a) => a.id === id);
        return prev;
      });
      if (idx < 0) return { ok: false as const, reason: "Registro não encontrado." };

      const nomeConta = input.nomeConta.trim();
      const contaId = input.contaId.trim();
      if (!nomeConta) return { ok: false as const, reason: "Nome da Conta é obrigatório." };
      if (!contaId) return { ok: false as const, reason: "ID da Conta é obrigatório." };

      setOptions((prev) => {
        let next = prev;
        next = upsertOption(next, "nomeConta", nomeConta);
        next = upsertOption(next, "contaId", contaId);
        next = upsertOption(next, "responsavel", input.responsavel.trim());
        next = upsertOption(next, "antidetect", input.antidetect.trim());
        next = upsertOption(next, "status", input.status.trim());
        next = upsertOption(next, "dominio", input.dominio.trim());
        next = upsertOption(next, "fonte", input.fonte.trim());
        next = upsertOption(next, "formaPagamento", input.formaPagamento.trim());
        next = upsertOption(next, "oferta", input.oferta.trim());
        next = upsertOption(next, "inicioCa", input.inicioCa.trim());
        return next;
      });

      setAccounts((prev) => {
        const current = prev[idx];
        if (!current) return prev;
        const updated = updateAccountTimestamp({
          ...current,
          ...input,
          id,
        });
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      });

      return { ok: true as const };
    },
    []
  );

  const deleteAccount = useCallback(
    (id: string) => {
      let found = false;
      setAccounts((prev) => {
        const next = prev.filter((a) => a.id !== id);
        found = next.length < prev.length;
        return next;
      });
      return !found
        ? { ok: false as const, reason: "Registro não encontrado." }
        : { ok: true as const };
    },
    []
  );

  // Retornar objeto simples - evita overhead do useMemo
  return {
    options,
    accounts,
    setOption,
    renameOption,
    removeOption,
    createAccount,
    updateAccount,
    deleteAccount,
    load: () => {}, // load já não é necessário
  };
}

export { makeEmptyForm };

