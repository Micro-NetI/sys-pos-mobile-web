//types\pedidos-cozinha.ts
export interface POSMobileMonitorPedidosPedido {
  accessToken: string;
  idCategoriaPedido: number;
}

export interface POSMobileCategoriaPedidoMonitor {
  idCategoriaPedido: number;
  descricao: string;
  ordem: number;
  totalPedidos: number;
}

export interface POSMobileLinhaPedidoCozinha {
  idLinha: number;
  idProduto: number;

  descricaoProduto: string;
  quantidade: number;
  comentario: string;

  grupoPreparacao: string;
  ordemGrupoPreparacao: number;

  tipoLinha: number;
  anulado: boolean;

  segue: boolean;
  horaSegue: string;

  /**
   * Valor real existente na base de dados.
   *
   * Nesta primeira fase a APIFNT ainda não traduz
   * este inteiro para PENDENTE / EM_PRODUCAO /
   * PRONTO / FEITO / SEM_EFEITO.
   */
  estadoLinha: number;
}

export interface POSMobilePedidoCozinha {
  idInterno: number;
  idPedido: string;
  printCode: string;
  tipoPedido: string;

  idCategoriaPedido: number;
  descricaoCategoria: string;

  idZonaPreparacao: number;
  descricaoZona: string;

  posto: string;
  sala: string;
  mesa: string;
  quarto: string;

  idMovimentoMesa: number;
  idInternoConta: number;
  idConta: number;
  pax: number;

  dataPedido: string;
  horaPedido: string;
  minutosEspera: number;

  corPedido: string;

  linhas: POSMobileLinhaPedidoCozinha[];
}

export interface POSMobileMonitorPedidosDados {
  idPostoSessao: number;
  atualizadoEm: string;
  totalPedidos: number;

  categorias: POSMobileCategoriaPedidoMonitor[];
  pedidos: POSMobilePedidoCozinha[];
}

export interface POSMobileMonitorPedidosResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobileMonitorPedidosDados
    | null;
}
