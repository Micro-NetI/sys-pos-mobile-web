export interface POSMobileCaixaDados {
  idPosto: number;
  idCaixa: number;
  idCabCaixa: number;

  aberto: boolean;
  podeAbrir: boolean;
  pedeFundoCaixa: boolean;

  numeroAberturas: number;
  maximoAberturas: number;

  fundoCaixa: number;

  abertoAgora: boolean;
  jaEstavaAberto: boolean;
}

export interface POSMobileCaixaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileCaixaDados | null;
}

export interface POSMobileAbrirCaixaPedido {
  accessToken: string;
  fundoCaixa: number;
}