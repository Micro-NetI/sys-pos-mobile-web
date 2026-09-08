//types\anulacao.ts
export interface POSMobilePrepararAnulacaoLinhaPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idLinha: number;
}

export interface POSMobileAnularLinhaPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idLinha: number;
  idMotivoAnulacao: number;
  justificacao: string;
}

export interface POSMobileMotivoAnulacao {
  idMotivo: number;
  descricao: string;
  obrigaJustificacao: boolean;
}

export interface POSMobilePrepararAnulacaoLinhaDados {
  idPosto: number;
  idUtilizador: number;
  login: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idLinha: number;
  idProduto: number;
  descricao: string;
  quantidade: number;
  valor: number;
  tipoLinha: number;
  idLinhaPai: number;
  ePrograma: boolean;
  eLinhaPrograma: boolean;
  registoEntrada: boolean;
  jaImpresso: boolean;
  exigeMotivo: boolean;
  podeAnular: boolean;
  mensagemRegra: string;
  idLinhasAfetadas: number[];
  motivos: POSMobileMotivoAnulacao[];
}

export interface POSMobileAnularLinhaDados {
  idPosto: number;
  idUtilizador: number;
  login: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idLinha: number;
  anulada: boolean;
  idLinhasAnuladas: number[];
  impressaoAnulacaoNecessaria: boolean;
  impressaoAnulacaoEfetuada: boolean;
  mensagemImpressao: string;
  aprovisionamentoAtualizado: boolean;
  mensagemAprovisionamento: string;
  valorTotalConta: number;
}

export interface POSMobilePrepararAnulacaoLinhaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobilePrepararAnulacaoLinhaDados | null;
}

export interface POSMobileAnularLinhaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileAnularLinhaDados | null;
}
