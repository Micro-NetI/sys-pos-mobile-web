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

  /*
    Configuração do produto associado correspondente
    ao produto + tabela de preços efetiva.

    modoLancamento:
      1 = manual
      2 = automático
      3 = pergunta ao operador

    preco:
      preço do produto associado na mesma tabela de preços
      efetiva utilizada para o produto principal.

    precoEncontrado:
      indica se foi encontrado preço para o associado
      nessa tabela efetiva.

    Quando não existe configuração ativa:
      produtoAssociado = null
  */
  produtoAssociado: {
    idProduto: number;

    descricao: string;

    modoLancamento: number;

    preco: number;

    precoEncontrado: boolean;
  } | null;

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