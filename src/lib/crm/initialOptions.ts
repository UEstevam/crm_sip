import type { CRMOptions } from "@/lib/crm/types";

export const initialOptions: CRMOptions = {
  nomeConta: ["Conta Alfa", "Conta Beta", "Conta Gama"],
  contaId: ["A-100", "B-200", "G-300"],
  responsavel: ["Equipe Comercial", "CS - Sucesso do Cliente", "Marketing"],
  antidetect: ["Dolphin", "AdsPower", "Incogniton"],
  status: ["Ativa", "Bloqueada", "Em Verificação de Anunciante", "Aquecimento", "Apagada"],
  dominio: ["exemplo.com", "site.com", "minhaempresa.io"],
  fonte: ["BM própria", "Perfil comprado", "Agência"],
  formaPagamento: ["Cartão de Crédito", "Pix", "Saldo"],
  oferta: ["Black", "White", "Nicho X"],
  inicioCa: ["2026-01-01"],
};

