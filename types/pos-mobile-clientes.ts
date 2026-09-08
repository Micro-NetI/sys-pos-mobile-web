//types\pos-mobile-clientes.ts
export interface POSMobileClienteResumo {
  idCliente: number;
  subTipoEntidade: number;

  nif: string | null;
  nome: string;
  localidade: string | null;
  pais: string | null;
}

export interface POSMobilePesquisarClientesDados {
  pesquisa: string;
  total: number;
  clientes: POSMobileClienteResumo[];
}

export interface POSMobilePesquisarClientesResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados: POSMobilePesquisarClientesDados | null;
}

export interface POSMobilePesquisarClientesPedido {
  accessToken: string;
  pesquisa: string;
  limite?: number;
}