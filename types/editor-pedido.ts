/**
 * Modelo local do editor do pedido.
 *
 * Este ficheiro não representa diretamente o contrato da APIFNT.
 * Guarda o estado necessário para editar produtos e programas antes
 * do envio, incluindo seleção de componentes, identificadores locais
 * e dados de apresentação.
 *
 * Regras:
 * - um produto normal é um item simples;
 * - um programa é um item composto com componentes associados;
 * - num programa TOTAL, todos os componentes ficam selecionados;
 * - num programa PARCIAL, MISTO ou LIVRE, apenas os componentes
 *   escolhidos serão enviados para gravação;
 * - a APIFNT continua responsável pela validação final.
 */
//types\editor-pedido.ts

import type {
  ModoQuantidadePrograma,
  ProgramaGrupo,
  ProgramaNivel,
  ProgramaProduto,
  ProgramaResultado,
  TipoLancamentoPrograma,
} from "@/types/programas";

import type {
  POSMobileComentarioSelecionado,
} from "@/types/comentarios";

export type OrigemItemEditor =
  | "EXISTENTE"
  | "NOVA";

interface ItemPedidoEditorBase {
  idLocal: string;
  origem: OrigemItemEditor;

  idBotao: number | null;
  idLinha: number | null;

  descricao: string;
  quantidade: number;

  preco: number;
  valorTotal: number;

  precoEncontrado: boolean;
  precoVariavel: boolean;
  precoAlterado: boolean;

  justificacaoAlteracaoPreco:
    | string
    | null;

  jaImpresso: boolean;
  anulado: boolean;

  idGrupoPreparacao:
    | number
    | null;

  observacao:
    | string
    | null;

  comentarios:
    POSMobileComentarioSelecionado[];
}

export interface ProdutoPedidoEditor
  extends ItemPedidoEditorBase {
  tipoItem: "PRODUTO";

  idProduto: number;
}

export interface ProgramaComponenteEditor {
  idLocal: string;

  idLinha: number | null;

  idProduto: number;
  descricao: string;

  idNivel: number | null;
  idGrupoMenu: number | null;
  idGrupoPreparacao: number | null;

  quantidadeBase: number;
  quantidade: number;
  quantidadePredefinida: number;

  valorUnitario: number;
  valorTotal: number;

  valorFixo: boolean;

  precoValido: boolean;
  disponivel: boolean;

  selecionado: boolean;

  predefinido: boolean;
  produtoFixo: boolean;
  produtoSemEscolha: boolean;

  ordem: number;

  observacao: string | null;

  comentarios:
    POSMobileComentarioSelecionado[];
}

export interface ProgramaPedidoEditor
  extends ItemPedidoEditorBase {
  tipoItem: "PROGRAMA";

  /**
   * Mantido também em `idProduto` para compatibilidade com
   * operações genéricas já existentes no editor.
   */
  idProduto: number;
  idProdutoPrograma: number;

  tipoLancamento:
    TipoLancamentoPrograma;

  modoQuantidade:
    ModoQuantidadePrograma;

  idTipoPrograma: number | null;
  idTipoDesconto: number | null;

  obrigaSelecao: boolean;
  trabalhaComNiveis: boolean;

  quantidadeTotalPermitida: number;
  maximoProdutosDiferentes: number;

  linhasFixas:
    ProgramaComponenteEditor[];

  componentes:
    ProgramaComponenteEditor[];

  niveis:
    ProgramaNivel[];

  grupos:
    ProgramaGrupo[];
}

export type ItemPedidoEditor =
  | ProdutoPedidoEditor
  | ProgramaPedidoEditor;

export function criarComponenteProgramaEditor(
  produto: ProgramaProduto,
  idProgramaLocal: string,
  indice: number,
  tipoLancamento: TipoLancamentoPrograma,
): ProgramaComponenteEditor {
  const idProduto =
    produto.idProduto ?? 0;

  const selecionado =
    tipoLancamento === "TOTAL" ||
    produto.produtoFixo ||
    produto.predefinido;

  return {
    idLocal:
      `${idProgramaLocal}-componente-${indice}-${idProduto}`,

    idLinha:
      null,

    idProduto,

    descricao:
      produto.descricao ??
      `Produto ${idProduto}`,

    idNivel:
      produto.idNivel,

    idGrupoMenu:
      produto.idGrupoMenu,

    idGrupoPreparacao:
      produto.idGrupoPreparacao,

    quantidadeBase:
      produto.quantidadeBase,

    quantidade:
      produto.quantidade,

    quantidadePredefinida:
      produto.quantidadePredefinida,

    valorUnitario:
      produto.valorUnitario,

    valorTotal:
      0,

    valorFixo:
      produto.valorFixo,

    precoValido:
      produto.precoValido,

    disponivel:
      produto.disponivel,

    selecionado,

    predefinido:
      produto.predefinido,

    produtoFixo:
      produto.produtoFixo,

    produtoSemEscolha:
      produto.produtoSemEscolha,

    ordem:
      produto.ordem,

    observacao:
      null,

    comentarios:
      [],
  };
}

export function criarProgramaPedidoEditor(
  programa: ProgramaResultado,
  idBotao: number | null,
  precoCatalogo: number,
  idGrupoPreparacao: number | null,
): ProgramaPedidoEditor {
  const idProdutoPrograma =
    programa.idProdutoPrograma ?? 0;

  if (idProdutoPrograma <= 0) {
    throw new Error(
      "O programa preparado não possui um produto válido.",
    );
  }

  const idLocal =
    `programa-${idProdutoPrograma}-${Date.now()}`;

  const quantidade =
    programa.quantidadePrograma > 0
      ? programa.quantidadePrograma
      : 1;

  const preco =
    programa.precoPrograma > 0
      ? programa.precoPrograma
      : precoCatalogo;

  const componentes =
    programa.produtos.map(
      (produto, indice) =>
        criarComponenteProgramaEditor(
          produto,
          idLocal,
          indice,
          programa.tipoLancamento,
        ),
    );

  const linhasFixas =
    programa.linhasFixas.map(
      (produto, indice) =>
        criarComponenteProgramaEditor(
          produto,
          `${idLocal}-fixa`,
          indice,
          programa.tipoLancamento,
        ),
    );

  return {
    tipoItem:
      "PROGRAMA",

    idLocal,
    origem:
      "NOVA",

    idBotao,
    idLinha:
      null,

    idProduto:
      idProdutoPrograma,

    idProdutoPrograma,

    descricao:
      programa.descricao ??
      `Programa ${idProdutoPrograma}`,

    quantidade,

    preco,

    valorTotal:
      preco * quantidade,

    precoEncontrado:
      preco > 0,

    precoVariavel:
      false,

    precoAlterado:
      false,

    justificacaoAlteracaoPreco:
      null,

    jaImpresso:
      false,

    anulado:
      false,

    idGrupoPreparacao,

    observacao:
      null,

    comentarios:
      [],

    tipoLancamento:
      programa.tipoLancamento,

    modoQuantidade:
      "NAO_DEFINIDO",

    idTipoPrograma:
      programa.idTipoPrograma,

    idTipoDesconto:
      programa.idTipoDesconto,

    obrigaSelecao:
      programa.obrigaSelecao,

    trabalhaComNiveis:
      programa.trabalhaComNiveis,

    quantidadeTotalPermitida:
      programa.quantidadeTotalPermitida,

    maximoProdutosDiferentes:
      programa.maximoProdutosDiferentes,

    linhasFixas,

    componentes,

    niveis:
      programa.niveis,

    grupos:
      programa.grupos,
  };
}