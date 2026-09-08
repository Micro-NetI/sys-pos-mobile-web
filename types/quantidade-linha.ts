//types\quantidade-linha.ts
export interface POSMobileAlterarQuantidadeLinhaPedido {
  accessToken: string;

  idMovimentoMesa: number;
  idInternoConta: number;
  idLinha: number;

  quantidade: number;

  /**
   * Num produto normal deve ser false.
   *
   * Num programa/menu:
   * true  -> atualiza proporcionalmente as linhas componentes;
   * false -> altera apenas a linha principal.
   */
  atualizarLinhasPrograma: boolean;
}

export interface POSMobileAlterarQuantidadeLinhaDados {
  idPosto: number;
  idUtilizador: number;

  idMovimentoMesa: number;
  idInternoConta: number;

  idLinha: number;
  idProduto: number;

  descricao: string | null;

  quantidadeAnterior: number;
  quantidadeAtual: number;

  precoUnitario: number;
  valorTotalLinha: number;
  valorTotalConta: number;

  regraProdutoLancamento: number;
  linhasProgramaAtualizadas: number;
}

export interface POSMobileAlterarQuantidadeLinhaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobileAlterarQuantidadeLinhaDados
    | null;
}
