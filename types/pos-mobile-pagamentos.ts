// types/pos-mobile-pagamentos.ts

/**
 * Contratos de pagamentos do POS Mobile.
 *
 * Abrange:
 *   - listagem dos métodos de pagamento;
 *   - preparação do pagamento/modal;
 *   - pagamento final.
 */

export interface POSMobilePagamentoOpcao {
  id: number;
  descricao: string;
}

export interface POSMobilePagamentoBotao {
  idInterno: number;
  descricao: string;

  idTipoDocVnd: number;
  idModoPagamento: number;
  tipoPagamento: number;

  ordem: number;

  nomeImagem: string;
  cor: string;
  corLetra: string;
  tamLetra: number;

  abreListaTipoServico: boolean;
  abreListaDescontos: boolean;
  abreListaTipoRefeicao: boolean;
  abreListaMercado: boolean;

  pedeReferencia: boolean;
  multiPagamento: boolean;
  enviaPedido: boolean;
  validaDadosFiscais: boolean;

  idTipoServico: number;
  idTipoDesconto: number;

  idgMapaConfPagamento: string;
}

export interface POSMobilePagamentosDados {
  pagamentos: POSMobilePagamentoBotao[];
  total: number;
  idPosto: number;
}

export interface POSMobilePagamentosResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobilePagamentosDados | null;
}

/* ========================================================================== */
/* PREPARAR PAGAMENTO                                                         */
/* ========================================================================== */

export interface POSMobilePrepararPagamentoPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idPagamentoDoc: number;

  cliente: {
    idEntidade: number;
  };
}

export interface POSMobilePrepararPagamentoMetodo {
  idPagamentoDoc: number;
  descricao: string;
  idTipoDocVnd: number;
  idModoPagamento: number;
  tipoPagamento: number;
}

export interface POSMobilePrepararPagamentoRequisitos {
  pedeTipoServico: boolean;
  pedeTipoRefeicao: boolean;
  pedeMercado: boolean;
  pedeDesconto: boolean;
  pedeReferencia: boolean;
  pedeValorEntregue: boolean;

  /**
   * Indica que o método de pagamento selecionado
   * corresponde ao débito em Conta Quarto.
   *
   * Esta decisão é feita pela APIFNT através da
   * configuração Kasbig do centro de exploração
   * associado ao posto da sessão.
   *
   * O frontend não deve determinar esta condição
   * pela descrição nem pelo ID do modo de pagamento.
   */
  pedeReservaHotel: boolean;

  validaDadosFiscais: boolean;
}

export interface POSMobilePrepararPagamentoPredefinidos {
  idTipoServico: number;
  idTipoRefeicao: number;
  idMercado: number;
  idTipoDesconto: number;
}

export interface POSMobilePagamentoMotivoDesconto {
  id: number;
  descricao: string;
  obrigaJustificacao: boolean;
}

export interface POSMobilePagamentoDescontoOpcao {
  id: number;
  descricao: string;
  percentagem: number;
  pedeMotivo: boolean;
  obrigaJustificacao: boolean;
  idTipoServicoAssociado: number;
  motivos: POSMobilePagamentoMotivoDesconto[];
}

export interface POSMobilePagamentoDescontoPreparacao {
  temDesconto: boolean;
  automatico: boolean;
  pedeSelecao: boolean;

  idDesconto: number;
  descricao: string;
  percentagem: number;

  pedeMotivo: boolean;
  obrigaJustificacao: boolean;
  idTipoServicoAssociado: number;

  motivos: POSMobilePagamentoMotivoDesconto[];
  opcoes: POSMobilePagamentoDescontoOpcao[];
}

export interface POSMobilePrepararPagamentoDados {
  pagamento: POSMobilePrepararPagamentoMetodo;

  valor: number;

  idPosto: number;

  requisitos:
    POSMobilePrepararPagamentoRequisitos;

  predefinidos:
    POSMobilePrepararPagamentoPredefinidos;

  tiposServico:
    POSMobilePagamentoOpcao[];

  tiposRefeicao:
    POSMobilePagamentoOpcao[];

  mercados:
    POSMobilePagamentoOpcao[];

  /**
   * Mantido pelo backend por compatibilidade
   * com a primeira versão.
   */
  descontos:
    POSMobilePagamentoOpcao[];

  /**
   * Estrutura completa usada pelo modal novo.
   */
  desconto:
    POSMobilePagamentoDescontoPreparacao;
}

export interface POSMobilePrepararPagamentoResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobilePrepararPagamentoDados
    | null;
}

/* ========================================================================== */
/* EFETUAR PAGAMENTO                                                          */
/* ========================================================================== */

export interface POSMobilePagamentoCliente {
  idEntidade: number;
}

export interface POSMobileEfetuarPagamentoPedido {
  accessToken: string;

  idMovimentoMesa: number;
  idInternoConta: number;

  idPagamentoDoc: number;

  cliente:
    POSMobilePagamentoCliente;

  idTipoServico: number;
  idTipoRefeicao: number;
  idMercado: number;

  /**
   * Para desconto automático pode continuar 0;
   * a APIFNT volta a resolvê-lo.
   */
  idTipoDesconto: number;

  idMotivoDesconto: number;

  justificacaoDesconto: string;

  referencia: string;

  valorEntregue: number;
}

export interface POSMobileEfetuarPagamentoDados {
  idVndCabDocumento: number;

  /**
   * Identificação legível do documento emitido,
   * devolvida pelo Fontenário através de:
   *
   * MotorFnt.VndDocumento.DaDescricaoDocumento(...)
   *
   * Exemplo:
   *   FT: A/1234
   */
  documento: string;

  idMovimentoMesa: number;
  idInternoConta: number;

  idPosto: number;

  valorDocumento: number;

  valorPago: number;

  troco: number;
}

export interface POSMobileEfetuarPagamentoResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobileEfetuarPagamentoDados
    | null;
}