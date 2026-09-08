export interface POSMobileGrupoLinkBotao {
  posicao: number;

  tipoBotao: string;

  /*
    Produto:
      idProduto > 0
      idGrupoLink = 0

    Link:
      idProduto = 0
      idGrupoLink > 0
  */
  idProduto: number;

  idGrupoLink: number;

  tipoProduto: string;

  descricao: string;

  preco: number;

  cor: string;
  corLetra: string;

  tamanhoLetra: number;

  letraNegrito: boolean;
  letraItalico: boolean;
  letraSublinhado: boolean;

  tamanhoBotao: number;

  nomeImagem: string;

  abrirComentario: boolean;

  idGrupoComentario: number;

  abrirObservacao: boolean;

  fechaJanelaLink: boolean;
}

export interface POSMobileGrupoLinkPagina {
  indice: number;

  descricao: string;

  botoes: POSMobileGrupoLinkBotao[];
}

export interface POSMobileGrupoLink {
  idGrupo: number;

  descricao: string;

  paginas: POSMobileGrupoLinkPagina[];
}

export interface POSMobileGrupoLinkResposta {
  sucesso: boolean;

  codigo: string;

  mensagem: string;

  versaoContrato: string;

  dados: POSMobileGrupoLink | null;
}