//types\configuracao.ts
export type EstadoVisualMesa =
  | "LIVRE"
  | "OCUPADA"
  | "EM_USO"
  | "RESERVADA"
  | "BLOQUEADA";

export interface POSMobileEstadoMesa {
  idSala: number;
  idPagina: number;
  idMesa: number;

  ocupada: boolean;
  emUso: boolean;
  reservada: boolean;
  bloqueada: boolean;

  idDocumento: number | null;
  utilizador: string | null;
  horaAbertura: string | null;
  valorAtual: number;
}

export interface POSMobileMesa {
  idSala: number;
  idPagina: number;
  idMesa: number;
  numeroMesa: number;
  descricao: string;
  numeroLugares: number;
  posicao: number;
  ordem: number;
}

export interface POSMobilePagina {
  idSala: number;
  idPagina: number;
  ordem: number;
  mesas: POSMobileMesa[];
}

export interface POSMobileSala {
  idSala: number;
  descricao: string;
  ordem: number;
  idClassePrecos?: number;
  paginas: POSMobilePagina[];
}

export interface POSMobilePosto {
  idPosto: number;
  descricao: string;
}

export interface POSMobileConfiguracao {
  posto: POSMobilePosto;
  salas: POSMobileSala[];
}

export interface POSMobileConfiguracaoResponse {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileConfiguracao | null;
}

export interface POSMobileUtilizadorSessao {
  idUtilizador: number;
  idRecursoHumano: number;
  login: string;
}