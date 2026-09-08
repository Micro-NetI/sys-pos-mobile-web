//types\contexto.ts
export type ContextoPostoIdentificacao = {
  idPosto: number;
  descricao: string;
};

export type ContextoPostoOperacao = {
  idCentroExploracao: number;
  descricaoCentroExploracao: string;

  idClassePrecos: number;
  descricaoClassePrecos: string;

  idCaixa: number;
  descricaoCaixa: string;

  idListaAprovisionamento: number;
  descricaoListaAprovisionamento: string;

  idProfitCenter: number;
  descricaoProfitCenter: string;

  idClienteIndiferenciado: number;
};

export type ContextoPostoMesas = {
  trabalhaComMesas: boolean;
  trabalhaComCartoes: boolean;
  obrigaMesa: boolean;
  verMesas: boolean;
  aberturaUnicaMesaDiaria: boolean;
  permiteTransferenciaBalcaoMesa: boolean;
  pedeNumeroClientes: boolean;
};

export type ContextoPostoSegue = {
  pedidosCozinhaSegue: boolean;
  pedidoSegueGrupoPreparacao: boolean;
  abreFormSegueClicarMesas: boolean;
};

export type ContextoPostoCatalogo = {
  multiClassesPrecos: boolean;
  pesquisaPorCodigoProduto: boolean;
  usaCodigoBarras: boolean;
};

export type ContextoPostoPagamento = {
  controlaTroco: boolean;
  trabalhaComTips: boolean;
  percentagemTips: number;
  fatorArredondamentoTips: number;
};

export type ContextoPostoDados = {
  posto: ContextoPostoIdentificacao;
  operacao: ContextoPostoOperacao;
  mesas: ContextoPostoMesas;
  segue: ContextoPostoSegue;
  catalogo: ContextoPostoCatalogo;
  pagamento: ContextoPostoPagamento;
};

export type ContextoPostoResposta = {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: ContextoPostoDados | null;
};