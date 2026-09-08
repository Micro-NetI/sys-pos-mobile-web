export interface POSMobileAlterarNumeroClientesPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  numeroPessoas: number;
}

export interface POSMobileAlterarNumeroClientesDados {
  idPosto: number;
  idUtilizador: number;
  idMovimentoMesa: number;
  idInternoConta: number;
  numeroPessoasAnterior: number;
  numeroPessoasAtual: number;
}

export interface POSMobileAlterarNumeroClientesResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados:
    | POSMobileAlterarNumeroClientesDados
    | null;
}