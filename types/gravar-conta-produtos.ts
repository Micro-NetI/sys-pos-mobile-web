export interface POSMobileGravarContaProduto {
  idProduto: number;
  idBotao: number;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  precoVariavel: boolean;
  precoAlterado: boolean;
  justificacaoAlteracaoPreco: string;
  observacao: string;
  idGrupoPreparacao: number;
  idArmazem: number;
  idClassePrecos: number;
  idTabelaPrecos: number;
}

export interface POSMobileGravarContaProdutosPedido {
  accessToken: string;
  idPosto: number;
  idSala: number;
  idPagina: number;
  idMesa: number;
  idMovimentoMesa: number;
  idInternoConta: number;
  numeroConta: number;
  numeroPessoas: number;
  idClassePrecos: number;
  idEntidade?: number;
  nomeEntidade?: string;
  quarto?: string;
  idReserva?: number;
  observacaoMesa?: string;
  produtos: POSMobileGravarContaProduto[];
}

export interface POSMobileGravarContaProdutosDados {
  idMovimentoMesa: number;
  idInternoConta: number;
  numeroConta: number;
  numeroPessoas: number;
  numeroProdutosGravados: number;
  valorTotalGravado: number;
}

export interface POSMobileGravarContaProdutosResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileGravarContaProdutosDados | null;
}