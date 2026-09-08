interface PagamentoContaDrawerProps {
  aberto: boolean;
  total: number;
  descricaoMesa: string;
  descricaoConta: string;

  idMovimentoMesa: number;
  idInternoConta: number;

  //pagamentos: POSMobilePagamentoBotao[];

  onFechar: () => void;
  onPagamentoConcluido: () => void;
}