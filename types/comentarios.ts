//types\comentarios.ts
export interface POSMobileComentarioOpcao {
  idComentario: number;
  descricao: string;
  comentarioLivre: boolean;
}

export interface POSMobileGrupoComentario {
  idGrupoComentario: number;
  descricao: string;
  opcoes: POSMobileComentarioOpcao[];
}

export interface POSMobileComentariosDados {
  grupos: POSMobileGrupoComentario[];
}

export interface POSMobileComentariosResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileComentariosDados | null;
}

/**
 * Comentário já escolhido pelo operador para uma linha do pedido.
 *
 * Para uma opção fixa, `texto` será normalmente igual a `descricao`.
 * Para uma opção livre, `texto` contém o valor introduzido pelo operador.
 */
export interface POSMobileComentarioSelecionado {
  idComentario: number;
  descricao: string;
  comentarioLivre: boolean;
  texto: string;
}

export interface POSMobileGravarComentariosLinhaContaPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idLinha: number;

  comentarios:
    POSMobileComentarioSelecionado[];
}

export interface POSMobileGravarComentariosLinhaContaDados {
  idPosto: number;
  idUtilizador: number;

  idMovimentoMesa: number;
  idInternoConta: number;
  idLinha: number;

  numeroComentarios: number;

  comentarios:
    POSMobileComentarioSelecionado[];
}

export interface POSMobileGravarComentariosLinhaContaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobileGravarComentariosLinhaContaDados
    | null;
}