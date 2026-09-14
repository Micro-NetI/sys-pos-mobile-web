// types/postos.ts

export interface POSMobilePostoDisponivel {
  idPosto: number;
  codigo: string;
  descricao: string;
  nomeExibicao: string;
  numeroSalas: number;
}

export interface POSMobilePostosDisponiveis {
  totalPostos: number;
  postos: POSMobilePostoDisponivel[];
}

export interface POSMobilePostosDisponiveisResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobilePostosDisponiveis | null;
}