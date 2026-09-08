//types\postos.ts
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

  /**
   * Posto sugerido pelo servidor Next através de
   * POS_MOBILE_POSTO_ID.
   *
   * O valor será null quando a variável não estiver
   * configurada, for inválida ou não corresponder a
   * um dos postos devolvidos pela API Delphi.
   */
  idPostoPredefinido?: number | null;
}

export interface POSMobilePostosDisponiveisResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobilePostosDisponiveis | null;
}