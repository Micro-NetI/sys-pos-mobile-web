export interface POSMobileImprimirPedidoCozinhaPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idLinhas: number[];
}

export interface POSMobileImprimirPedidoCozinhaDados {
  idPosto: number;
  idUtilizador: number;
  idMovimentoMesa: number;
  idInternoConta: number;
  idSegue: number;
  imprimiu: boolean;
  mensagemImpressao: string;
  numeroLinhas: number;
  idLinhas: number[];
}

export interface POSMobileImprimirPedidoCozinhaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados:
    | POSMobileImprimirPedidoCozinhaDados
    | null;
}

export interface POSMobileSegueLinha {
  idLinha: number;
  idProduto: number;
  descricao: string;
  quantidade: string;
  zonaPreparacao: string;
  idGrupoPreparacao: number;
  grupoPreparacao: string;
  ordemGrupo: number;
  corGrupo: string;
  selecionadoPorDefeito: boolean;
  jaImpresso: boolean;
  segue: boolean;
  idSegue: number;
  dataSegue: string | null;
  horaSegue: string | null;
  utilizadorSegue: string | null;
  anulado: boolean;
  bloqueado: boolean;
}

export interface POSMobileSegueGrupo {
  idGrupoPreparacao: number;
  descricao: string;
  ordem: number;
  cor: string;
  numeroLinhasDisponiveis: number;
}

export interface POSMobileSegueHistorico {
  idSegue: number;
  dataSegue: string | null;
  horaSegue: string | null;
  utilizadorSegue: string | null;
  idLinhas: number[];
}

export interface POSMobileDadosSegueConta {
  idPosto: number;
  idUtilizador: number;
  idMovimentoMesa: number;
  idInternoConta: number;
  temProdutosDisponiveis: boolean;
  linhas: POSMobileSegueLinha[];
  grupos: POSMobileSegueGrupo[];
  historico: POSMobileSegueHistorico[];
}

export interface POSMobileDadosSegueContaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados:
    | POSMobileDadosSegueConta
    | null;
}
