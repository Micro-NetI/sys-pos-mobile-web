//types\estado-mesas.ts
export type POSMobileEstadoVisualMesa =
  | "LIVRE"
  | "OCUPADA"
  | "EM_USO"
  | "RESERVADA"
  | "BLOQUEADA";

export interface POSMobileEstadoMesa {
  idPosto: number | null;
  idSala: number | null;
  idPagina: number | null;
  idMesa: number | null;

  numeroMesa: number;

  descricaoMesa: string | null;
  descricaoSala: string | null;

  estado: POSMobileEstadoVisualMesa;

  ocupada: boolean;
  emUso: boolean;
  reservada: boolean;
  bloqueada: boolean;

  idMovimentoMesa: number | null;

  numeroContas: number;
  numeroPessoas: number;

  valorAtual: number;

  utilizador: string | null;
  postoEmUso: string | null;

  dataAbertura: string | null;
  horaAbertura: string | null;
}

export interface POSMobileEstadoMesasPosto {
  idPosto: number | null;
  dataAtualizacao: string | null;
  mesas: POSMobileEstadoMesa[];
}

export interface POSMobileEstadoMesasResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileEstadoMesasPosto | null;
}