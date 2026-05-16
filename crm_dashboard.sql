-- CRM Dashboard - Contas (schema)
-- SGBD: compatível com PostgreSQL (ajuste AUTO INCREMENT/INT se necessário)

-- Caso você queira resetar:
-- DROP TABLE IF EXISTS crm_account_options; 
-- DROP TABLE IF EXISTS crm_accounts;

CREATE TABLE IF NOT EXISTS crm_accounts (
  id TEXT PRIMARY KEY,                     -- Identificador interno (campo interno do CRUD)

  nome_conta TEXT NOT NULL,
  conta_id TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  antidetect TEXT NOT NULL,
  status TEXT NOT NULL,
  dominio TEXT NOT NULL,
  fonte TEXT NOT NULL,
  gastos NUMERIC(18,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL,
  inicio_ca DATE NOT NULL,
  oferta TEXT NOT NULL,
  obs TEXT NOT NULL DEFAULT '',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_accounts_status ON crm_accounts(status);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_responsavel ON crm_accounts(responsavel);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_antidetect ON crm_accounts(antidetect);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_inicio_ca ON crm_accounts(inicio_ca);

-- Opções criáveis (catálogos) para manter consistência e auditoria
-- Você pode manter como catálogo por campo.
CREATE TABLE IF NOT EXISTS crm_account_options (
  id SERIAL PRIMARY KEY,
  option_key TEXT NOT NULL,              -- ex: 'nomeConta', 'contaId', 'responsavel', 'antidetect', 'status', etc.
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(option_key, value)
);

CREATE INDEX IF NOT EXISTS idx_crm_account_options_option_key ON crm_account_options(option_key);

