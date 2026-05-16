import type { CRMAccount, CRMOptions } from "@/lib/crm/types";
import { initialOptions } from "@/lib/crm/initialOptions";

const STORAGE_KEY = "crm_dashboard_v1";

type PersistedState = {
  options: CRMOptions;
  accounts: CRMAccount[];
};

function safeParseJSON<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  const parsed = safeParseJSON<PersistedState>(
    window.localStorage.getItem(STORAGE_KEY)
  );
  return parsed;
}

export function getDefaultState(): PersistedState {
  return {
    options: initialOptions,
    accounts: [],
  };
}

export function savePersistedState(state: PersistedState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function normalizeOptions(options: CRMOptions): CRMOptions {
  const ensure = (arr: unknown) => (Array.isArray(arr) ? arr.filter(Boolean) : []);
  return {
    nomeConta: ensure(options.nomeConta).map(String),
    contaId: ensure(options.contaId).map(String),
    responsavel: ensure(options.responsavel).map(String),
    antidetect: ensure(options.antidetect).map(String),
    status: ensure(options.status).map(String),
    dominio: ensure(options.dominio).map(String),
    fonte: ensure(options.fonte).map(String),
    formaPagamento: ensure(options.formaPagamento).map(String),
    oferta: ensure(options.oferta).map(String),
    inicioCa: ensure(options.inicioCa).map(String),
  };
}

export function upsertOption(options: CRMOptions, key: keyof CRMOptions, value: string): CRMOptions {
  const v = String(value ?? "").trim();
  if (!v) return options;
  const current = options[key] ?? [];
  const exists = current.some((x) => String(x).trim().toLowerCase() === v.toLowerCase());
  if (exists) return options;
  return {
    ...options,
    [key]: [...current, v].sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}

export function createAccountFromForm(input: Omit<CRMAccount, "createdAt" | "updatedAt">): CRMAccount {
  const now = Date.now();
  return {
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateAccountTimestamp(account: CRMAccount): CRMAccount {
  return {
    ...account,
    updatedAt: Date.now(),
  };
}

