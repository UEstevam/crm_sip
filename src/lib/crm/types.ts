export type CRMStatus = string;

export type CRMAccount = {
  /** Identificador interno do registro (cada linha do CRUD) */
  id: string;
  nomeConta: string;
  contaId: string;
  responsavel: string;
  antidetect: string;
  status: CRMStatus;
  dominio: string;
  fonte: string;
  gastos: number;
  formaPagamento: string;
  inicioCa: string; // yyyy-mm-dd
  oferta: string;
  obs: string;
  createdAt: number;
  updatedAt: number;
};


export type CRMOptions = {
  nomeConta: string[];
  contaId: string[];
  responsavel: string[];
  antidetect: string[];
  status: string[];
  dominio: string[];
  fonte: string[];
  formaPagamento: string[];
  oferta: string[];
  inicioCa: string[]; // allow created custom dates if desired
};

