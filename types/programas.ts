/**
 * Contratos dos produtos-programa do POS Mobile.
 *
 * Este ficheiro representa os dados trocados entre
 * o frontend Next.js e a APIFNT.
 *
 * O estado puramente visual do editor, como:
 * - expandido;
 * - em edição;
 * - erros locais;
 * - identificadores temporários;
 *
 * deve continuar em:
 * `src/types/editor-pedido.ts`.
 *
 * Nota:
 * Os campos `selecionado` e `quantidadeSelecionada`
 * pertencem ao contrato da API porque representam o
 * estado inicial oficial devolvido pela APIFNT, incluindo
 * predefinições e produtos fixos.
 */
//types\programas.ts
import type {
  POSMobileComentarioSelecionado,
} from "@/types/comentarios";

export type TipoLancamentoPrograma =
  | "TOTAL"
  | "PARCIAL"
  | "MISTO"
  | "LIVRE"
  | "DESCONHECIDO";

export type ModoQuantidadePrograma =
  | "TODOS_IGUAIS"
  | "CONFIGURAR_INDIVIDUALMENTE"
  | "NAO_DEFINIDO";

/**
 * Pedido enviado à API para obter a composição,
 * regras e opções de um produto-programa.
 */
export interface PrepararProgramaPedido {
  accessToken: string;

  idPosto: number;
  idSala: number;

  idProdutoPrograma: number;
  idGrupoPreparacao: number | null;

  quantidade: number;
}

/**
 * Nível configurado num programa parcial, misto
 * ou livre.
 */
export interface ProgramaNivel {
  idNivel: number | null;

  descricao: string | null;
  ordem: number;

  /**
   * Quantidade mínima obrigatória neste nível.
   *
   * Zero significa que não existe mínimo obrigatório.
   */
  quantidadeMinima: number;

  /**
   * Quantidade máxima permitida neste nível.
   *
   * A APIFNT já devolve este valor multiplicado pela
   * quantidade atual do programa.
   */
  quantidadePermitida: number;

  /**
   * Quantidade inicialmente selecionada pela APIFNT,
   * normalmente proveniente das predefinições.
   */
  quantidadeSelecionada: number;

  /**
   * Produto usado para representar a opção
   * "não escolher".
   */
  idProdutoNaoEscolha: number | null;
}

/**
 * Produto disponível ou incluído num programa.
 */
export interface ProgramaProduto {
  idProduto: number | null;
  descricao: string | null;

  idNivel: number | null;
  idGrupoMenu: number | null;
  idGrupoPreparacao: number | null;

  /**
   * Quantidade configurada na definição do programa.
   */
  quantidadeBase: number;

  /**
   * Quantidade efetiva usada para a composição.
   *
   * Num programa total contém a quantidade final.
   * Num programa parcial contém a quantidade selecionada,
   * quando o produto está selecionado.
   */
  quantidade: number;

  /**
   * Quantidade configurada na predefinição.
   */
  quantidadePredefinida: number;

  /**
   * Quantidade inicialmente selecionada no contrato
   * devolvido pela APIFNT.
   */
  quantidadeSelecionada: number;

  /**
   * Preço informativo devolvido pela API.
   *
   * A APIFNT deve voltar a obter o preço oficial
   * no momento da gravação.
   */
  valorUnitario: number;

  /**
   * Indica se o valor do componente é fixo.
   */
  valorFixo: boolean;

  precoValido: boolean;
  disponivel: boolean;

  /**
   * Indica que o produto foi configurado como
   * predefinição do programa.
   */
  predefinido: boolean;

  /**
   * Estado inicial oficial da seleção devolvido
   * pela APIFNT.
   */
  selecionado: boolean;

  /**
   * Produto obrigatório que o utilizador não pode
   * remover da composição.
   */
  produtoFixo: boolean;

  /**
   * Produto que representa a opção "sem escolha".
   */
  produtoSemEscolha: boolean;

  ordem: number;
}

/**
 * Grupo de opções de um programa misto ou livre.
 */
export interface ProgramaGrupo {
  idGrupoMenu: number | null;

  descricao: string | null;
  ordem: number;

  quantidadeMinima: number;
  quantidadeMaxima: number;

  produtos: ProgramaProduto[];
}

/**
 * Resultado devolvido pela preparação do programa.
 */
export interface ProgramaResultado {
  idProdutoPrograma: number | null;
  descricao: string | null;

  tipoLancamento: TipoLancamentoPrograma;

  idTipoPrograma: number | null;
  idTipoDesconto: number | null;

  quantidadePrograma: number;
  precoPrograma: number;

  /**
   * Indica se o utilizador tem de efetuar escolhas
   * antes de adicionar o programa ao pedido.
   */
  obrigaSelecao: boolean;

  /**
   * Indica se as regras estão organizadas por níveis.
   */
  trabalhaComNiveis: boolean;

  /**
   * Quantidade total de componentes permitida.
   *
   * Zero significa que não existe uma regra global
   * ou que a regra está definida apenas por níveis.
   */
  quantidadeTotalPermitida: number;

  /**
   * Número máximo de produtos diferentes.
   *
   * Zero significa que não existe limite global.
   */
  maximoProdutosDiferentes: number;

  /**
   * Linhas sempre incluídas no programa.
   */
  linhasFixas: ProgramaProduto[];

  /**
   * Produtos incluídos ou disponíveis para seleção.
   */
  produtos: ProgramaProduto[];

  niveis: ProgramaNivel[];
  grupos: ProgramaGrupo[];
}

/**
 * Linha selecionada pelo utilizador para enviar
 * na gravação de um programa parcial, misto ou livre.
 */
export interface ProgramaLinhaPedido {
  idProduto: number;

  idNivel: number | null;
  idGrupoMenu: number | null;
  idGrupoPreparacao: number | null;

  quantidade: number;

  /**
   * Valores informativos.
   *
   * A APIFNT volta a validar o preço oficial.
   */
  valorUnitario: number;
  valorFixo: boolean;

  produtoFixo: boolean;
  produtoSemEscolha: boolean;
}

/**
 * Pedido para gravar um programa na conta.
 */
export interface AdicionarProgramaPedido {
  accessToken: string;

  idPosto: number;
  idMovimentoMesa: number;
  idInternoConta: number;

  idProdutoPrograma: number;
  idGrupoPreparacao: number | null;

  quantidadePrograma: number;

  tipoLancamento: TipoLancamentoPrograma;
  modoQuantidade: ModoQuantidadePrograma;

  /**
   * Mantido por compatibilidade.
   *
   * A APIFNT não deve confiar neste valor para
   * determinar o preço oficial do programa.
   */
  valorMenu: number;

  /**
   * TOTAL:
   * normalmente vazio.
   *
   * PARCIAL, MISTO ou LIVRE:
   * contém apenas as linhas selecionadas.
   */
  linhas: ProgramaLinhaPedido[];
}

/**
 * Linha efetivamente criada pela APIFNT.
 */
export interface ProgramaLinhaResultado {
  idLinha: number | null;
  idLinhaPai: number | null;

  idProduto: number | null;
  descricao: string | null;

  quantidade: number;
  valorTotal: number;
}

/**
 * Resultado da gravação do programa.
 */
export interface AdicionarProgramaResultado {
  idMovimentoMesa: number | null;
  idInternoConta: number | null;

  idLinhaPrograma: number | null;
  idProdutoPrograma: number | null;

  quantidadePrograma: number;
  valorPrograma: number;
  valorTotalConta: number;

  numeroLinhasAdicionadas: number;

  linhas: ProgramaLinhaResultado[];
}

/**
 * Estrutura comum das respostas da API POS Mobile.
 */
export interface POSMobileApiResponse<T> {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: T | null;
}

export interface ProgramaLinhaPedido {
  idProduto: number;

  idNivel: number | null;
  idGrupoMenu: number | null;
  idGrupoPreparacao: number | null;

  quantidade: number;

  valorUnitario: number;
  valorFixo: boolean;

  produtoFixo: boolean;
  produtoSemEscolha: boolean;

  comentarios:
    POSMobileComentarioSelecionado[];
}