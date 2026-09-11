//app\pos\mesa\[idMesa]\page.tsx
"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Modal,
} from "@heroui/react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  mensagensPOS,
} from "@/app/components/pos/mensagens/mensagensPOS";
import ComentarioProdutoModal from "@/app/components/pos/ComentarioProdutoModal";
import PrecoProdutoModal from "@/app/components/pos/PrecoProdutoModal";
import SeguePedidoModal from "@/app/components/pos/SeguePedidoModal";
import ProgramaParcialModal from "@/app/components/pos/programas/ProgramaParcialModal";
import PesquisarClienteModal from "@/app/components/pos/clientes/PesquisarClienteModal";
import PagamentoDrawer from "@/app/components/pos/pagamentos/PagamentoDrawer";
import ReservasHotelModal from "@/app/components/pos/pagamentos/ReservasHotelModal";
import EditorPedidoTable from "@/app/components/pos/editor-pedido/EditorPedidoTable";
import CatalogoGrupoLink from "@/app/components/pos/CatalogoGrupoLink";
import PagamentoConfirmacaoModal, {
  type PagamentoConfirmacaoValores,
} from "@/app/components/pos/pagamentos/PagamentoConfirmacaoModal";
import {
  usePOSContexto,
} from "@/app/pos/POSContextoContext";

import type {
  POSMobileComentarioSelecionado,
  POSMobileGravarComentariosLinhaContaResposta,
} from "@/types/comentarios";
import type {
  POSMobileContaMesa,
  POSMobileContaMesaResposta,
  POSMobileProdutoConta,
} from "@/types/contas";
import type {
  POSMobileAnularLinhaResposta,
  POSMobilePrepararAnulacaoLinhaDados,
  POSMobilePrepararAnulacaoLinhaResposta,
} from "@/types/anulacao";
import type {
  POSMobileAlterarNumeroClientesResposta,
} from "@/types/numero-clientes";
import type {
  POSMobileAlterarQuantidadeLinhaResposta,
} from "@/types/quantidade-linha";
import type {
  AdicionarProgramaResultado,
  AdicionarProgramaPedido,
  POSMobileApiResponse,
  ProgramaLinhaPedido,
  ProgramaResultado,
} from "@/types/programas";
import type {
  POSMobileEfetuarPagamentoResposta,
  POSMobilePagamentoBotao,
  POSMobilePagamentosResposta,
  POSMobilePrepararPagamentoDados,
  POSMobilePrepararPagamentoResposta,
} from "@/types/pos-mobile-pagamentos";
import type {
  POSMobileClienteResumo,
} from "@/types/pos-mobile-clientes";
import type {
  POSMobileAssociarReservaHotelResposta,
  POSMobileHotelReserva,
} from "@/types/pos-mobile-hotel";
import type {
  POSMobileGrupoLinkBotao,
} from "@/types/pos-mobile-grupo-link";
import type {
  POSMobileDadosSegueContaResposta,
} from "@/types/impressao";
import {
  criarProgramaPedidoEditor,
} from "@/types/editor-pedido";
import type {
  ItemPedidoEditor,
  ProdutoPedidoEditor,
  ProgramaComponenteEditor,
  ProgramaPedidoEditor,
} from "@/types/editor-pedido";

interface POSMobileCatalogoContexto {
  idPosto: number;
  idSala: number;
  idCentroExploracao: number;
  idTabelaPrecos: number | null;
  idClassePrecosPosto: number | null;
  idClassePrecosSala: number | null;
  idClassePrecosEfetiva: number | null;
  origemClassePrecos:
    | "POSTO"
    | "SALA"
    | "NAO_DEFINIDA";
}

interface POSMobileCatalogoBotao {
  idBotao: number | null;
  idGrupo: number;
  idGProdutos: number;
  numeroPagina: number;
  posicao: number;

  tipoBotao:
    | "PRODUTO"
    | "LINK"
    | "DESCONHECIDO";

  idProduto: number | null;
  idGrupoLink: number | null;

  descricao: string;
  descricaoPagina: string | null;
  tipoProduto: string | null;

  preco: number;
  precoEncontrado: boolean;
  precoVariavel: boolean;

  cor: string | null;
  corLetra: string | null;
  corPreco: string | null;
  corPrecoLetra: string | null;
  nomeImagem: string | null;

  tamanhoLetra: number;
  letraNegrito: boolean;
  letraItalico: boolean;
  letraSublinhado: boolean;

  usaBevel: boolean;
  larguraBevel: number;
  corBevel: string | null;

  tamanhoBotao: number;

  favorito: boolean;
  visivel: boolean;

  abrirComentario: boolean;
  idGrupoComentario: number | null;
  fecharJanelaLink: boolean;
}

interface POSMobileCatalogoPagina {
  idGrupo: number;
  idGProdutos: number;
  numeroPagina: number;
  descricao: string | null;
  ordem: number;
  botoes: POSMobileCatalogoBotao[];
}

interface POSMobileCatalogoGrupo {
  idGrupo: number;
  descricao: string;
  ordem: number;

  favorito: boolean;
  visivel: boolean;

  cor: string | null;
  corLetra: string | null;
  nomeImagem: string | null;

  tamanhoLetra: number;
  letraNegrito: boolean;
  letraItalico: boolean;
  letraSublinhado: boolean;

  usaBevel: boolean;
  larguraBevel: number;
  corBevel: string | null;

  paginas: POSMobileCatalogoPagina[];
}

interface POSMobileCatalogo {
  contexto: POSMobileCatalogoContexto;
  grupos: POSMobileCatalogoGrupo[];
}

interface POSMobileCatalogoResponse {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileCatalogo | null;
}

interface DadosMesaEmAbertura {
  idPosto: number;
  idSala: number;
  idPagina: number;
  idMesa: number;
  numeroMesa: number;
  descricaoMesa: string;
  descricaoSala: string;
  numeroPessoas: number;
  numeroLugares: number;
}

interface ProdutoPendenteComentario {
  botao: POSMobileCatalogoBotao;
  preco: number;
  precoAlterado: boolean;
  justificacaoAlteracaoPreco: string | null;
}

interface ProgramaParcialPendente {
  botao: POSMobileCatalogoBotao;
  programa: ProgramaResultado;
}

interface ProgramaComponenteSelecionado {
  programa: ProgramaPedidoEditor;
  componente: ProgramaComponenteEditor;
}

interface PagamentoPreparadoContexto {
  accessToken: string;

  idMovimentoMesa: number;
  idInternoConta: number;

  idCliente: number;
  descricaoCliente: string;

  pagamento: POSMobilePagamentoBotao;
}

/*
  ============================================================================
  PAGAMENTO INTEGRADO / TPA
  ============================================================================

  Estes contratos são locais à página e representam apenas as respostas das
  rotas Next.js de pagamento integrado.

  A decisão de utilizar integração continua a vir da resposta preparada pela
  APIFNT. O browser não decide TipoDoc, ModoPagamento, posto ou utilizador.
  ============================================================================
*/
interface PagamentoPedidoFuncional {
  accessToken: string;

  idMovimentoMesa: number;
  idInternoConta: number;
  idPagamentoDoc: number;

  cliente: {
    idEntidade: number;
  };

  idTipoServico: number;
  idTipoRefeicao: number;
  idMercado: number;
  idTipoDesconto: number;
  idMotivoDesconto: number;

  justificacaoDesconto: string;
  referencia: string;
  valorEntregue: number;

  /*
    A venda é gravada sem esperar pela impressão física.
    A impressão é solicitada depois, numa operação independente.
  */
  imprimir: boolean;
}

interface POSMobilePagamentoIntegradoDados {
  pedidoId: string;
  estado: string;
  transactionId: string;
  referencia: string;
  valor: number;
  valorCentimos: number;
  idVndCabDocumento: number;
  documento: string;
}

interface POSMobilePagamentoIntegradoResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobilePagamentoIntegradoDados | null;
}

interface PagamentoIntegradoVisual {
  pedidoId: string;
  estado: string;
  mensagem: string;
  valor: number;
}

interface PagamentoIntegradoPendente {
  pedidoId: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idPagamentoDoc: number;
}

interface ContaPersistidaResultado {
  idMovimentoMesa: number;
  idInternoConta: number;
}

interface GrupoLinkAtivo {
  idGrupo: number;
  descricaoOrigem: string;
  fechaJanelaLink: boolean;
}

type AcaoAposSegue =
  | "SAIR"
  | "CONSULTA_MESA"
  | null;

function converterProdutoContaParaLinhaEditor(
  produto: POSMobileProdutoConta,
  indice: number,
): ProdutoPedidoEditor {
  return {
    tipoItem:
      "PRODUTO",
    idLocal:
      `existente-${produto.idLinha ?? indice}`,
    origem:
      "EXISTENTE",
    idBotao: null,
    idLinha:
      produto.idLinha,
    idProduto:
      produto.idProduto ?? 0,
    descricao:
      produto.descricao ||
      `Produto ${produto.idProduto ?? ""}`,
    quantidade:
      produto.quantidade,
    preco:
      produto.precoUnitario,
    valorTotal:
      produto.valorTotal,
    precoEncontrado: true,
    precoVariavel: false,
    precoAlterado: false,
    justificacaoAlteracaoPreco: null,
    jaImpresso:
      produto.jaImpresso,
    anulado:
      produto.anulado,
    idGrupoPreparacao:
      produto.idGrupoPreparacao,
    observacao:
      produto.observacao,
    comentarios:
      produto.comentarios ?? [],
  };
}


function converterProdutosContaParaEditor(
  produtos: POSMobileProdutoConta[],
): ItemPedidoEditor[] {
  const produtosAtivos =
    produtos.filter(
      (produto) =>
        !produto.anulado,
    );

  const componentesPorLinhaPai =
    new Map<
      number,
      POSMobileProdutoConta[]
    >();

  for (const produto of produtosAtivos) {
    if (
      produto.tipoLinha !==
        "LINHA_PROGRAMA" ||
      !produto.idLinhaPai ||
      produto.idLinhaPai <= 0
    ) {
      continue;
    }

    const componentes =
      componentesPorLinhaPai.get(
        produto.idLinhaPai,
      ) ?? [];

    componentes.push(
      produto,
    );

    componentesPorLinhaPai.set(
      produto.idLinhaPai,
      componentes,
    );
  }

  const resultado:
    ItemPedidoEditor[] = [];

  produtosAtivos.forEach(
    (produto, indice) => {
      if (
        produto.tipoLinha ===
        "LINHA_PROGRAMA"
      ) {
        return;
      }

      if (
        produto.tipoLinha !==
          "PROGRAMA" ||
        !produto.idLinha ||
        produto.idLinha <= 0
      ) {
        resultado.push(
          converterProdutoContaParaLinhaEditor(
            produto,
            indice,
          ),
        );

        return;
      }

      const componentesConta =
        componentesPorLinhaPai.get(
          produto.idLinha,
        ) ?? [];

      const quantidadePrograma =
        produto.quantidade > 0
          ? produto.quantidade
          : 1;

      const programa:
        ProgramaPedidoEditor = {
          tipoItem:
            "PROGRAMA",

          idLocal:
            `programa-existente-${produto.idLinha}`,

          origem:
            "EXISTENTE",

          idBotao:
            null,

          idLinha:
            produto.idLinha,

          idProduto:
            produto.idProduto ?? 0,

          idProdutoPrograma:
            produto.idProdutoPrograma ??
            produto.idProduto ??
            0,

          descricao:
            produto.descricao ??
            `Programa ${produto.idProduto ?? ""}`,

          quantidade:
            quantidadePrograma,

          preco:
            produto.precoUnitario,

          valorTotal:
            produto.valorTotal,

          precoEncontrado:
            true,

          precoVariavel:
            false,

          precoAlterado:
            false,

          justificacaoAlteracaoPreco:
            null,

          jaImpresso:
            produto.jaImpresso,

          anulado:
            produto.anulado,

          idGrupoPreparacao:
            produto.idGrupoPreparacao,

          observacao:
            produto.observacao,

          comentarios:
            produto.comentarios ?? [],

          tipoLancamento:
            "TOTAL",

          modoQuantidade:
            "NAO_DEFINIDO",

          idTipoPrograma:
            produto.idTipoPrograma,

          idTipoDesconto:
            null,

          obrigaSelecao:
            false,

          trabalhaComNiveis:
            false,

          quantidadeTotalPermitida:
            0,

          maximoProdutosDiferentes:
            0,

          linhasFixas:
            [],

          componentes:
            componentesConta.map(
              (
                componente,
                indiceComponente,
              ) => ({
                idLocal:
                  `programa-${produto.idLinha}-componente-${componente.idLinha ?? indiceComponente}`,

                idLinha:
                  componente.idLinha,

                idProduto:
                  componente.idProduto ?? 0,

                descricao:
                  componente.descricao ??
                  `Produto ${componente.idProduto ?? ""}`,

                idNivel:
                  null,

                idGrupoMenu:
                  null,

                idGrupoPreparacao:
                  componente.idGrupoPreparacao,

                quantidadeBase:
                  componente.quantidade /
                  quantidadePrograma,

                quantidade:
                  componente.quantidade,

                quantidadePredefinida:
                  componente.quantidade,

                valorUnitario:
                  componente.precoUnitario,

                valorTotal:
                  componente.valorTotal,

                valorFixo:
                  true,

                precoValido:
                  true,

                disponivel:
                  true,

                selecionado:
                  true,

                predefinido:
                  true,

                produtoFixo:
                  true,

                produtoSemEscolha:
                  false,

                ordem:
                  indiceComponente,

                observacao:
                  componente.observacao,

                comentarios:
                  componente.comentarios ??
                  [],
              }),
            ),

          niveis:
            [],

          grupos:
            [],
        };

      resultado.push(
        programa,
      );
    },
  );

  return resultado;
}

interface POSMobileProdutoAdicionadoResultado {
  idLinha: number | null;
  idProduto: number | null;
  descricao: string | null;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
}

interface POSMobileAdicionarProdutosContaDados {
  idMovimentoMesa: number | null;
  idInternoConta: number | null;
  numeroProdutosAdicionados: number;
  valorAdicionado: number;
  valorTotalConta: number;
  produtos: POSMobileProdutoAdicionadoResultado[];
}

interface POSMobileAdicionarProdutosContaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileAdicionarProdutosContaDados | null;
}


interface POSMobileGravarContaProdutosDados {
  idMovimentoMesa: number;
  idInternoConta: number;
  numeroConta: number;
  numeroPessoas: number;
  numeroProdutosGravados: number;
  valorTotalGravado: number;
}

interface POSMobileGravarContaProdutosResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileGravarContaProdutosDados | null;
}


interface POSMobileUsoMesaDados {
  idPosto: number;
  idSala: number;
  idPagina: number;
  idMesa: number;
  emUso: boolean;
}

interface POSMobileUsoMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileUsoMesaDados | null;
}

/*
  ============================================================================
  CONSULTA DE MESA
  ============================================================================

  Contrato devolvido por:
    POST /api/pos-mobile/gerar-consulta-mesa

  idConsMovimento é o identificador interno da Consulta de Mesa gerada.
  ============================================================================
*/
interface POSMobileConsultaMesaDados {
  idConsMovimento: number;
  idMovimentoMesa: number;
  idInternoConta: number;
}

interface POSMobileConsultaMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileConsultaMesaDados | null;
}

interface EstilosVisuaisBotao {
  cartao: CSSProperties;
  texto: CSSProperties;
  preco: CSSProperties;
}

const COMENTARIOS_INICIAIS_VAZIOS:
  POSMobileComentarioSelecionado[] = [];

const USAR_CONFIGURACAO_PRODUTOS =
  process.env
    .NEXT_PUBLIC_POS_USAR_CONFIGURACAO_PRODUTOS
    ?.trim()
    .toLowerCase() === "true";

const CORES_DELPHI: Record<string, string> = {
  clblack: "#000000",
  clmaroon: "#800000",
  clgreen: "#008000",
  clolive: "#808000",
  clnavy: "#000080",
  clpurple: "#800080",
  clteal: "#008080",
  clgray: "#808080",
  clsilver: "#c0c0c0",
  clred: "#ff0000",
  cllime: "#00ff00",
  clyellow: "#ffff00",
  clblue: "#0000ff",
  clfuchsia: "#ff00ff",
  claqua: "#00ffff",
  clwhite: "#ffffff",
  clmoneygreen: "#c0dcc0",
  clskyblue: "#a6caf0",
  clcream: "#fffdd0",
  clmedgray: "#a0a0a4",
  clwindow: "#ffffff",
  clwindowtext: "#000000",
  clbtnface: "#f0f0f0",
  clbtntext: "#000000",
  clhighlight: "#0078d7",
  clhighlighttext: "#ffffff",
};

function limitarNumero(
  valor: number,
  minimo: number,
  maximo: number,
): number | null {
  if (!Number.isFinite(valor)) {
    return null;
  }

  return Math.min(
    maximo,
    Math.max(minimo, valor),
  );
}

function converterCorDelphi(
  valor: string | null,
): string | undefined {
  if (!valor) {
    return undefined;
  }

  const normalizado = valor
    .trim()
    .toLowerCase();

  if (!normalizado) {
    return undefined;
  }

  const corConhecida =
    CORES_DELPHI[normalizado];

  if (corConhecida) {
    return corConhecida;
  }

  if (/^#[0-9a-f]{6}$/i.test(normalizado)) {
    return normalizado;
  }

  if (/^#[0-9a-f]{3}$/i.test(normalizado)) {
    return normalizado;
  }

  if (/^\$[0-9a-f]{8}$/i.test(normalizado)) {
    const numero = Number.parseInt(
      normalizado.slice(1),
      16,
    );

    if (!Number.isFinite(numero)) {
      return undefined;
    }

    const vermelho = numero & 0xff;
    const verde = (numero >> 8) & 0xff;
    const azul = (numero >> 16) & 0xff;

    return `#${vermelho
      .toString(16)
      .padStart(2, "0")}${verde
      .toString(16)
      .padStart(2, "0")}${azul
      .toString(16)
      .padStart(2, "0")}`;
  }

  return undefined;
}

function obterNomeImagemSeguro(
  nomeImagem: string | null,
): string | null {
  if (!nomeImagem) {
    return null;
  }

  const nome = nomeImagem.trim();

  if (
    !nome ||
    nome.includes("/") ||
    nome.includes("\\") ||
    nome.includes("..")
  ) {
    return null;
  }

  if (
    !/^[\p{L}\p{N} _().-]+\.(png|jpe?g|gif|webp|bmp)$/iu.test(
      nome,
    )
  ) {
    return null;
  }

  return nome;
}

function criarEstilosVisuaisBotao(
  botao: POSMobileCatalogoBotao,
): EstilosVisuaisBotao {
  const corFundo =
    converterCorDelphi(botao.cor);

  const corTexto =
    converterCorDelphi(
      botao.corLetra,
    );

  const corFundoPreco =
    converterCorDelphi(
      botao.corPreco,
    );

  const corTextoPreco =
    converterCorDelphi(
      botao.corPrecoLetra,
    );

  const corBevel =
    converterCorDelphi(
      botao.corBevel,
    );

  const tamanhoLetra =
    limitarNumero(
      botao.tamanhoLetra,
      11,
      28,
    );

  const larguraBevel =
    limitarNumero(
      botao.larguraBevel,
      1,
      6,
    );

  return {
    cartao: {
      backgroundColor: corFundo,
      borderColor:
        botao.usaBevel
          ? corBevel
          : undefined,
      borderWidth:
        botao.usaBevel &&
        larguraBevel !== null
          ? `${larguraBevel}px`
          : undefined,
    },
    texto: {
      color: corTexto,
      fontSize:
        tamanhoLetra !== null
          ? `${tamanhoLetra}px`
          : undefined,
      fontWeight:
        botao.letraNegrito
          ? 700
          : undefined,
      fontStyle:
        botao.letraItalico
          ? "italic"
          : undefined,
      textDecoration:
        botao.letraSublinhado
          ? "underline"
          : undefined,
    },
    preco: {
      backgroundColor: corFundoPreco,
      color: corTextoPreco,
    },
  };
}

function criarEstilosVisuaisGrupo(
  grupo: POSMobileCatalogoGrupo,
): CSSProperties {
  const corFundo =
    converterCorDelphi(
      grupo.cor,
    );

  const corTexto =
    converterCorDelphi(
      grupo.corLetra,
    );

  const corBevel =
    converterCorDelphi(
      grupo.corBevel,
    );

  const tamanhoLetra =
    limitarNumero(
      grupo.tamanhoLetra,
      11,
      28,
    );

  const larguraBevel =
    limitarNumero(
      grupo.larguraBevel,
      1,
      6,
    );

  return {
    backgroundColor:
      corFundo,

    color:
      corTexto,

    fontSize:
      tamanhoLetra !== null
        ? `${tamanhoLetra}px`
        : undefined,

    fontWeight:
      grupo.letraNegrito
        ? 700
        : undefined,

    fontStyle:
      grupo.letraItalico
        ? "italic"
        : undefined,

    textDecoration:
      grupo.letraSublinhado
        ? "underline"
        : undefined,

    borderColor:
      grupo.usaBevel
        ? corBevel
        : undefined,

    borderWidth:
      grupo.usaBevel &&
      larguraBevel !== null
        ? `${larguraBevel}px`
        : undefined,

    borderStyle:
      grupo.usaBevel
        ? "solid"
        : undefined,
  };
}

function formatarValor(
  valor: number,
): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valor);
}

function obterChaveFeedbackProduto(
  botao: POSMobileCatalogoBotao,
): string {
  if (botao.idBotao !== null) {
    return `botao-${botao.idBotao}`;
  }

  return [
    "produto",
    botao.idGrupo,
    botao.idGProdutos,
    botao.posicao,
    botao.idProduto ?? 0,
  ].join("-");
}

function criarAssinaturaComentarios(
  comentarios: POSMobileComentarioSelecionado[],
): string {
  return [...comentarios]
    .sort((primeiro, segundo) => {
      if (
        primeiro.idComentario !==
        segundo.idComentario
      ) {
        return (
          primeiro.idComentario -
          segundo.idComentario
        );
      }

      return primeiro.texto.localeCompare(
        segundo.texto,
        "pt-PT",
      );
    })
    .map((comentario) => {
      return [
        comentario.idComentario,
        comentario.comentarioLivre
          ? "1"
          : "0",
        comentario.texto
          .trim()
          .toLocaleLowerCase("pt-PT"),
      ].join(":");
    })
    .join("|");
}

function obterIdNumerico(
  valor: string | null,
): number {
  if (!valor) {
    return 0;
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return 0;
  }

  return numero;
}

function descricaoContextoCompacta(
  descricao: string | null | undefined,
  etiqueta: string,
  id: number | null | undefined,
): string | null {
  const texto =
    descricao?.trim() ?? "";

  if (texto) {
    return texto;
  }

  if (
    typeof id === "number" &&
    Number.isInteger(id) &&
    id > 0
  ) {
    return `${etiqueta} ${id}`;
  }

  return null;
}

function lerDadosMesaGuardados():
  | DadosMesaEmAbertura
  | null {
  const valorGuardado =
    sessionStorage.getItem(
      "posMobileMesaEmAbertura",
    );

  if (!valorGuardado) {
    return null;
  }

  try {
    return JSON.parse(
      valorGuardado,
    ) as DadosMesaEmAbertura;
  } catch {
    sessionStorage.removeItem(
      "posMobileMesaEmAbertura",
    );

    return null;
  }
}

function normalizarEstadoPagamentoIntegrado(
  estado: string | null | undefined,
): string {
  return (estado ?? "")
    .trim()
    .toUpperCase();
}

function aguardar(
  milissegundos: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milissegundos,
    );
  });
}

function obterIntegracaoPagamentoPreparado(
  dados: POSMobilePrepararPagamentoDados,
): {
  integracaoPagamento: boolean;
  tipoIntegracaoPagamento: string;
} {
  /*
    O contrato TypeScript antigo pode ainda não declarar estes dois campos.
    A APIFNT passou a devolvê-los dentro de dados.pagamento.

    O cast local mantém esta página compatível enquanto os tipos partilhados
    são atualizados, sem transformar o browser em fonte de verdade.
  */
  const dadosComIntegracao =
    dados as POSMobilePrepararPagamentoDados & {
      pagamento?: {
        integracaoPagamento?: boolean;
        tipoIntegracaoPagamento?:
          | string
          | null;
      };
    };

  return {
    integracaoPagamento:
      dadosComIntegracao.pagamento
        ?.integracaoPagamento === true,

    tipoIntegracaoPagamento:
      normalizarEstadoPagamentoIntegrado(
        dadosComIntegracao.pagamento
          ?.tipoIntegracaoPagamento,
      ),
  };
}

/*
  ============================================================================
  IMPRESSÃO NÃO BLOQUEANTE
  ============================================================================
  A venda já está persistida quando esta função é chamada.

  Não existe await no ponto de utilização: uma impressora lenta, desligada ou
  com spooler bloqueado não atrasa o fecho da venda nem a navegação do POS.

  keepalive permite ao browser continuar o pequeno pedido mesmo quando a
  página navega imediatamente para /pos.
  ============================================================================
*/
function solicitarImpressaoVenda(
  accessToken: string,
  idVndCabDocumento: number,
  idPagamentoDoc: number,
): void {
  const token =
    accessToken.trim();

  if (
    token === "" ||
    !Number.isInteger(
      idVndCabDocumento,
    ) ||
    idVndCabDocumento <= 0 ||
    !Number.isInteger(
      idPagamentoDoc,
    ) ||
    idPagamentoDoc <= 0
  ) {
    console.error(
      "[PRINT BROWSER ERRO] Impressão não solicitada: dados inválidos.",
      {
        idVndCabDocumento,
        idPagamentoDoc,
      },
    );

    return;
  }

  /*
    ==========================================================================
    DIAGNÓSTICO DE TEMPOS DA IMPRESSÃO
    ==========================================================================

    Não usamos sendBeacon neste teste.

    O objetivo é perceber exatamente onde está a demora:

      Browser
        ↓
      Route Next /api/pos-mobile/pagamentos/imprimir
        ↓
      APIFNT / ImprimirVendaPagamento
        ↓
      MotorFnt.POSMovimentoMesa.ImprimirVendaPOSMobile
        ↓
      spooler / impressora

    fetch + keepalive:
      - inicia o pedido HTTP imediatamente;
      - permite que o pedido continue mesmo que a página navegue;
      - continua SEM await, portanto a venda não fica bloqueada.
    ==========================================================================
  */

  const browserStartedAtMs =
    Date.now();

  const diagnosticoId =
    `PRINT-${idVndCabDocumento}-${browserStartedAtMs}`;

  const payload = {
    accessToken:
      token,

    idVndCabDocumento,

    idPagamentoDoc,

    /*
      Usados apenas pela Route Next para correlacionar os logs.
      NÃO são encaminhados para a APIFNT.
    */
    diagnosticoId,

    browserStartedAtMs,
  };

  console.log(
    "[PRINT BROWSER 01] ANTES FETCH",
    {
      diagnosticoId,

      hora:
        new Date(
          browserStartedAtMs,
        ).toISOString(),

      idVndCabDocumento,

      idPagamentoDoc,
    },
  );

  /*
    IMPORTANTE:
    não fazer await aqui.

    A impressão continua independente da venda.
  */
  void fetch(
    "/api/pos-mobile/pagamentos/imprimir",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "application/json",
      },

      body:
        JSON.stringify(
          payload,
        ),

      keepalive:
        true,
    },
  )
    .then(
      async (
        response,
      ) => {
        const fimMs =
          Date.now();

        console.log(
          "[PRINT BROWSER 02] RESPOSTA NEXT",
          {
            diagnosticoId,

            hora:
              new Date(
                fimMs,
              ).toISOString(),

            duracaoTotalMs:
              fimMs -
              browserStartedAtMs,

            status:
              response.status,

            ok:
              response.ok,

            idVndCabDocumento,

            idPagamentoDoc,

            serverTiming:
              response.headers.get(
                "Server-Timing",
              ),

            traceResposta:
              response.headers.get(
                "X-Print-Trace-Id",
              ),
          },
        );

        if (
          response.ok
        ) {
          return;
        }

        let detalhe =
          "";

        try {
          detalhe =
            await response.text();
        } catch {
          detalhe =
            "";
        }

        console.error(
          "[PRINT BROWSER ERRO] A impressão devolveu erro.",
          {
            diagnosticoId,

            status:
              response.status,

            detalhe,

            idVndCabDocumento,

            idPagamentoDoc,
          },
        );
      },
    )
    .catch(
      (
        error,
      ) => {
        const fimMs =
          Date.now();

        console.error(
          "[PRINT BROWSER ERRO] Falha ao solicitar impressão.",
          {
            diagnosticoId,

            hora:
              new Date(
                fimMs,
              ).toISOString(),

            duracaoAteErroMs:
              fimMs -
              browserStartedAtMs,

            error,

            idVndCabDocumento,

            idPagamentoDoc,
          },
        );
      },
    );
}


/*
  ============================================================================
  IMPRESSÃO NÃO BLOQUEANTE - CONSULTA DE MESA
  ============================================================================

  A Consulta de Mesa já foi criada e persistida quando esta função é chamada.

  Não existe await no ponto de utilização. Assim:
    - o modal "A processar..." fecha logo após a geração da Consulta;
    - o fluxo pode continuar para o Segue;
    - uma demora do spooler/impressora não bloqueia a geração da Consulta;
    - keepalive permite ao pedido continuar mesmo que a página navegue.

  IMPORTANTE:
  esta função apenas solicita a impressão. Nunca volta a gerar a Consulta.
  ============================================================================
*/
function solicitarImpressaoConsultaMesa(
  accessToken: string,
  idMovimentoMesa: number,
  idInternoConta: number,
  idConsMovimento: number,
): void {
  const token =
    accessToken.trim();

  if (
    token === "" ||
    !Number.isInteger(
      idMovimentoMesa,
    ) ||
    idMovimentoMesa <= 0 ||
    !Number.isInteger(
      idInternoConta,
    ) ||
    idInternoConta <= 0 ||
    !Number.isInteger(
      idConsMovimento,
    ) ||
    idConsMovimento <= 0
  ) {
    console.error(
      "[CONSULTA PRINT BROWSER ERRO] Impressão não solicitada: dados inválidos.",
      {
        idMovimentoMesa,
        idInternoConta,
        idConsMovimento,
      },
    );

    return;
  }

  const browserStartedAtMs =
    Date.now();

  const diagnosticoId =
    `PRINT-CONSULTA-${idConsMovimento}-${browserStartedAtMs}`;

  const payload = {
    accessToken:
      token,

    idMovimentoMesa,

    idInternoConta,

    idConsMovimento,

    diagnosticoId,

    browserStartedAtMs,
  };

  console.log(
    "[CONSULTA PRINT BROWSER 01] ANTES FETCH",
    {
      diagnosticoId,

      hora:
        new Date(
          browserStartedAtMs,
        ).toISOString(),

      idMovimentoMesa,

      idInternoConta,

      idConsMovimento,
    },
  );

  void fetch(
    "/api/pos-mobile/imprimir-consulta-mesa",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "application/json",
      },

      body:
        JSON.stringify(
          payload,
        ),

      keepalive:
        true,
    },
  )
    .then(
      async (
        response,
      ) => {
        const fimMs =
          Date.now();

        console.log(
          "[CONSULTA PRINT BROWSER 02] RESPOSTA NEXT",
          {
            diagnosticoId,

            hora:
              new Date(
                fimMs,
              ).toISOString(),

            duracaoTotalMs:
              fimMs -
              browserStartedAtMs,

            status:
              response.status,

            ok:
              response.ok,

            idMovimentoMesa,

            idInternoConta,

            idConsMovimento,
          },
        );

        if (
          response.ok
        ) {
          return;
        }

        let detalhe =
          "";

        try {
          detalhe =
            await response.text();
        } catch {
          detalhe =
            "";
        }

        console.error(
          "[CONSULTA PRINT BROWSER ERRO] A impressão devolveu erro.",
          {
            diagnosticoId,

            status:
              response.status,

            detalhe,

            idMovimentoMesa,

            idInternoConta,

            idConsMovimento,
          },
        );
      },
    )
    .catch(
      (
        error,
      ) => {
        const fimMs =
          Date.now();

        console.error(
          "[CONSULTA PRINT BROWSER ERRO] Falha ao solicitar impressão.",
          {
            diagnosticoId,

            hora:
              new Date(
                fimMs,
              ).toISOString(),

            duracaoAteErroMs:
              fimMs -
              browserStartedAtMs,

            error,

            idMovimentoMesa,

            idInternoConta,

            idConsMovimento,
          },
        );
      },
    );
}

export default function MesaProfissionalPage() {
  const router = useRouter();
  const params = useParams<{
    idMesa: string;
  }>();
  const searchParams =
    useSearchParams();

  const {
    contextoPosto,
  } = usePOSContexto();
console.log(
  "CONTEXTO POSTO:",
  contextoPosto,
);

console.log(
  "CLIENTE INDIFERENCIADO:",
  contextoPosto?.operacao
    .idClienteIndiferenciado,
);

  const [dadosMesa, setDadosMesa] =
    useState<DadosMesaEmAbertura | null>(
      null,
    );

  const [catalogo, setCatalogo] =
    useState<POSMobileCatalogo | null>(
      null,
    );

  const [
    grupoLinkAtivo,
    setGrupoLinkAtivo,
  ] = useState<GrupoLinkAtivo | null>(
    null,
  );

  const [
    idGrupoSelecionado,
    setIdGrupoSelecionado,
  ] = useState<number | null>(null);

  const [
    idPaginaSelecionada,
    setIdPaginaSelecionada,
  ] = useState<number | null>(null);

  const gruposScrollRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const gruposBotaoRefs =
    useRef<
      Map<number, HTMLButtonElement>
    >(new Map());

  const [linhasEditor, setLinhasEditor] =
    useState<ItemPedidoEditor[]>([]);

  const [contaCarregada, setContaCarregada] =
    useState<POSMobileContaMesa | null>(
      null,
    );

  const [modoEditor, setModoEditor] =
    useState<"ABERTURA" | "CONTA">(
      "ABERTURA",
    );

  const [pesquisa, setPesquisa] =
    useState("");

  const [aCarregar, setACarregar] =
    useState(true);

  const [mensagemErro, setMensagemErro] =
    useState("");

  const [aEnviar, setAEnviar] =
    useState(false);

  const [
    aAdicionarPrograma,
    setAAdicionarPrograma,
  ] = useState(false);

  const [
    programaParcialPendente,
    setProgramaParcialPendente,
  ] = useState<ProgramaParcialPendente | null>(
    null,
  );

  const [
    mostrarSegue,
    setMostrarSegue,
  ] = useState(false);

  const [
    contaSeguePendente,
    setContaSeguePendente,
  ] = useState<{
    idMovimentoMesa: number;
    idInternoConta: number;
  } | null>(null);

  const [aSairMesa, setASairMesa] =
    useState(false);

  const [
    mostrarConfirmacaoSaida,
    setMostrarConfirmacaoSaida,
  ] = useState(false);

  const ignorarAvisoSaidaRef =
    useRef(false);

  /*
    Bloqueio síncrono do fluxo de preparação de pagamento.

    O useState só atualiza no render seguinte; por isso, em dispositivos
    touch ou perante eventos repetidos, duas chamadas podiam iniciar
    a preparação do mesmo pagamento em simultâneo.
  */
  const pagamentoEmSelecaoRef =
    useRef(false);

  /*
    Bloqueio síncrono da confirmação/execução do pagamento.

    O useState só atualiza no render seguinte, por isso este ref impede
    duplo clique/toque antes de a interface ficar visualmente bloqueada.
  */
  const pagamentoEmExecucaoRef =
    useRef(false);

  /*
    ==========================================================================
    CONFIRMAÇÃO DE IMPRESSÃO
    ==========================================================================

    Esta confirmação é um Modal HeroUI real, e não um Toast.

    O pagamento fica literalmente à espera da Promise até o operador
    clicar em "Sim" ou "Não".

    O modal:
      - não fecha por timeout;
      - não fecha ao clicar no fundo;
      - não fecha com ESC;
      - não possui botão X;
      - só fecha através dos botões Sim/Não.
    ==========================================================================
  */
  /*
    ==========================================================================
    COMPORTAMENTO DA IMPRESSÃO
    ==========================================================================

    true:
      - depois de a venda estar gravada, apresenta o Modal HeroUI
        "Deseja imprimir o talão?"
      - só imprime se o operador escolher "Sim".

    false:
      - não apresenta a pergunta;
      - imprime sempre automaticamente, mas continua através da rota de
        impressão separada;
      - pedido.imprimir continua false, portanto nunca voltamos a prender
        a faturação à impressão interna do Delphi.

    Mais tarde este estado pode ser inicializado através da configuração
    do posto/cliente sem alterar o fluxo do pagamento.
    ==========================================================================
  */
  const [
    perguntarAntesDeImprimir,
  ] = useState(true);

  const [
    mostrarConfirmacaoImpressao,
    setMostrarConfirmacaoImpressao,
  ] = useState(false);

  const resolverConfirmacaoImpressaoRef =
    useRef<
      ((imprimir: boolean) => void) |
      null
    >(null);

  /*
    Novo fluxo de pagamento:

      1. o operador escolhe o método no PagamentoDrawer;
      2. o Next chama /api/pos-mobile/preparar-pagamento;
      3. a APIFNT devolve requisitos, predefinidos e regras de desconto;
      4. abrimos PagamentoConfirmacaoModal;
      5. só depois da confirmação chamamos EfetuarPagamento.

    Desta forma o frontend deixa de inventar Tipo de Serviço,
    Tipo de Refeição, descontos, motivos, referência ou troco.
  */
  const [
    dadosPagamentoPreparado,
    setDadosPagamentoPreparado,
  ] =
    useState<POSMobilePrepararPagamentoDados | null>(
      null,
    );

  const [
    contextoPagamentoPreparado,
    setContextoPagamentoPreparado,
  ] =
    useState<PagamentoPreparadoContexto | null>(
      null,
    );

  const [
    aPrepararPagamento,
    setAPrepararPagamento,
  ] = useState(false);

  const [
    mostrarReservasHotel,
    setMostrarReservasHotel,
  ] = useState(false);

  const [
    aAssociarReservaHotel,
    setAAssociarReservaHotel,
  ] = useState(false);

  const [
    mensagemOperacao,
    setMensagemOperacao,
  ] = useState("");

  const [
    mensagemErroOperacao,
    setMensagemErroOperacao,
  ] = useState("");

  const [
    botaoPrecoEmEdicao,
    setBotaoPrecoEmEdicao,
  ] =
    useState<POSMobileCatalogoBotao | null>(
      null,
    );

  const [
    produtoPendenteComentario,
    setProdutoPendenteComentario,
  ] =
    useState<ProdutoPendenteComentario | null>(
      null,
    );

  const [
    idLinhaSelecionada,
    setIdLinhaSelecionada,
  ] = useState<string | null>(null);

  const [
    idLinhaComentarioEmEdicao,
    setIdLinhaComentarioEmEdicao,
  ] = useState<string | null>(null);

  const [
    idComponenteProgramaSelecionado,
    setIdComponenteProgramaSelecionado,
  ] = useState<string | null>(null);

  const [
    operacaoLinhaAberta,
    setOperacaoLinhaAberta,
  ] = useState<
    | "QUANTIDADE"
    | "ANULAR"
    | null
  >(null);

  const [
    quantidadeOperacaoLinha,
    setQuantidadeOperacaoLinha,
  ] = useState("");

  const [
    mensagemErroOperacaoLinha,
    setMensagemErroOperacaoLinha,
  ] = useState("");

  const [
    dadosPreparacaoAnulacao,
    setDadosPreparacaoAnulacao,
  ] =
    useState<POSMobilePrepararAnulacaoLinhaDados | null>(
      null,
    );

  const [
    aPrepararAnulacao,
    setAPrepararAnulacao,
  ] = useState(false);

  const [
    aAnularLinha,
    setAAnularLinha,
  ] = useState(false);

  const [
    aAlterarQuantidadeLinha,
    setAAlterarQuantidadeLinha,
  ] = useState(false);

  const [
    idMotivoAnulacao,
    setIdMotivoAnulacao,
  ] = useState("");

  const [
    justificacaoAnulacao,
    setJustificacaoAnulacao,
  ] = useState("");

  const [
    mostrarAlterarClientes,
    setMostrarAlterarClientes,
  ] = useState(false);

  const [
    numeroClientesIntroduzido,
    setNumeroClientesIntroduzido,
  ] = useState("");

  const [
    mensagemErroClientes,
    setMensagemErroClientes,
  ] = useState("");

  const [
    aAlterarNumeroClientes,
    setAAlterarNumeroClientes,
  ] = useState(false);

  const [
    aGravarComentariosLinha,
    setAGravarComentariosLinha,
  ] = useState(false);

  const [
    mensagemErroComentariosLinha,
    setMensagemErroComentariosLinha,
  ] = useState("");

  /*
    A janela de Segue pode ser aberta por três motivos:

      - manualmente, apenas para enviar linhas;
      - antes de sair da mesa;
      - depois de gerar uma Consulta de Mesa.

    Guardamos a ação pendente para que fechar/cancelar o Segue
    nunca seja confundido com um envio concluído.
  */
  const [
    acaoAposSegue,
    setAcaoAposSegue,
  ] = useState<AcaoAposSegue>(null);

  const [
    ecranInteiro,
    setEcranInteiro,
  ] = useState(false);

  /*
    Feedback visual de adição de produto.

    Não usamos Toast em cada toque porque num POS seria demasiado intrusivo.
    O cartão do produto e a barra do Pedido recebem um realce curto e, quando
    suportado pelo dispositivo, é emitida uma vibração muito breve.
  */
  const [
    produtoAdicionadoFeedback,
    setProdutoAdicionadoFeedback,
  ] = useState<string | null>(null);

  const feedbackProdutoTimeoutRef =
    useRef<number | null>(
      null,
    );

  /*
    Pedido em mobile:

    Em ecrãs inferiores a lg o catálogo ocupa a área principal e o pedido
    deixa de ficar abaixo dos produtos. Uma barra fixa apresenta o resumo
    e abre este bottom sheet sem alterar a lógica funcional do editor.
  */
  const [
    mostrarPedidoMobile,
    setMostrarPedidoMobile,
  ] = useState(false);

  const [
    mostrarConfirmacaoLinhasPrograma,
    setMostrarConfirmacaoLinhasPrograma,
  ] = useState(false);

  /*
    ==========================================================================
    CONSULTA DE MESA
    ==========================================================================

    A geração é confirmada num modal próprio antes de chamar a API.

    Mantemos um estado de processamento independente para impedir
    duplo clique/toque e evitar a criação repetida do documento.
    ==========================================================================
  */
  const [
    mostrarConfirmacaoConsultaMesa,
    setMostrarConfirmacaoConsultaMesa,
  ] = useState(false);

  const [
    aGerarConsultaMesa,
    setAGerarConsultaMesa,
  ] = useState(false);

  /*
    Depois de a APIFNT confirmar a geração da Consulta de Mesa,
    guardamos o ID até o fluxo terminar.

    Isto impede uma segunda emissão acidental caso o envio para
    a cozinha ou a libertação da mesa falhe posteriormente.
  */
  const [
    idConsultaMesaGerada,
    setIdConsultaMesaGerada,
  ] = useState<number | null>(null);

  const [
    pagamentos,
    setPagamentos,
  ] = useState<POSMobilePagamentoBotao[]>([]);

  const [
    mostrarPagamentos,
    setMostrarPagamentos,
  ] = useState(false);

  const [
    aCarregarPagamentos,
    setACarregarPagamentos,
  ] = useState(false);

  const [
    mensagemErroPagamentos,
    setMensagemErroPagamentos,
  ] = useState("");

  const [
    pesquisaPagamento,
    setPesquisaPagamento,
  ] = useState("");

  const [
    aEfetuarPagamento,
    setAEfetuarPagamento,
  ] = useState(false);

  const [
    idPagamentoEmProcessamento,
    setIdPagamentoEmProcessamento,
  ] = useState<number | null>(null);

  /*
    Pedido TPA que já foi criado no SysFlowTPAService mas ainda não terminou
    o ciclo completo no browser.

    É mantido num ref de propósito: perante uma falha transitória de rede, uma
    nova confirmação retoma o MESMO PedidoId em vez de iniciar uma segunda
    cobrança no terminal.
  */
  const pagamentoIntegradoPendenteRef =
    useRef<PagamentoIntegradoPendente | null>(
      null,
    );

  const [
    pagamentoIntegradoVisual,
    setPagamentoIntegradoVisual,
  ] = useState<PagamentoIntegradoVisual | null>(
    null,
  );

  const [
    mostrarPesquisarCliente,
    setMostrarPesquisarCliente,
  ] = useState(false);

  const [
    clienteSelecionado,
    setClienteSelecionado,
  ] = useState<POSMobileClienteResumo | null>(
    null,
  );

  const [
    accessTokenCliente,
    setAccessTokenCliente,
  ] = useState("");

  const carregarCatalogo =
    useCallback(async () => {
      setACarregar(true);
      setMensagemErro("");

      try {
        const token =
          sessionStorage.getItem(
            "posMobileAccessToken",
          );

        if (!token) {
          router.replace("/login");
          return;
        }

        const idMesa =
          obterIdNumerico(
            params.idMesa,
          );

        if (idMesa <= 0) {
          throw new Error(
            "O identificador da mesa é inválido.",
          );
        }

        const dadosGuardados =
          lerDadosMesaGuardados();

        const idPosto =
          dadosGuardados?.idPosto ??
          obterIdNumerico(
            searchParams.get(
              "idPosto",
            ),
          );

        const idSala =
          dadosGuardados?.idSala ??
          obterIdNumerico(
            searchParams.get(
              "idSala",
            ),
          );

        const idPagina =
          dadosGuardados?.idPagina ??
          obterIdNumerico(
            searchParams.get(
              "idPagina",
            ),
          );

        const numeroMesa =
          dadosGuardados?.numeroMesa ??
          Number(
            searchParams.get(
              "numeroMesa",
            ) ?? 0,
          );

        const numeroPessoas =
          dadosGuardados?.numeroPessoas ??
          Number(
            searchParams.get(
              "numeroPessoas",
            ) ?? 1,
          );

        const modoConta =
          searchParams.get("modo") ===
          "conta";

        const idMovimentoMesa =
          obterIdNumerico(
            searchParams.get(
              "idMovimentoMesa",
            ),
          );

        const idInterno =
          obterIdNumerico(
            searchParams.get(
              "idInterno",
            ),
          );

        if (
          modoConta &&
          (
            idMovimentoMesa <= 0 ||
            idInterno <= 0
          )
        ) {
          throw new Error(
            "Não foi possível identificar a conta selecionada.",
          );
        }

        if (
          idPosto <= 0 ||
          idSala <= 0
        ) {
          throw new Error(
            "Não foi possível identificar o posto e a sala da mesa.",
          );
        }

        const dadosResolvidos: DadosMesaEmAbertura =
          {
            idPosto,
            idSala,
            idPagina,
            idMesa,
            numeroMesa,
            descricaoMesa:
              dadosGuardados?.descricaoMesa ??
              searchParams.get(
                "descricaoMesa",
              ) ??
              `Mesa ${numeroMesa || idMesa}`,
            descricaoSala:
              dadosGuardados?.descricaoSala ??
              searchParams.get(
                "descricaoSala",
              ) ??
              "",
            numeroPessoas:
              Number.isInteger(
                numeroPessoas,
              ) &&
              numeroPessoas > 0
                ? numeroPessoas
                : 1,
            numeroLugares:
              dadosGuardados?.numeroLugares ??
              Number(
                searchParams.get(
                  "numeroLugares",
                ) ?? 0,
              ),
          };

        setDadosMesa(
          dadosResolvidos,
        );

        console.log(
          "========== CATÁLOGO DA MESA ==========",
        );

        console.log(
          "Dados da mesa:",
          dadosResolvidos,
        );

        const urlCatalogo =
          `/api/pos-mobile/catalogo?idPosto=${idPosto}&idSala=${idSala}`;

        const urlConta =
          `/api/pos-mobile/conta-mesa?idMovimentoMesa=${idMovimentoMesa}&idInterno=${idInterno}`;

        /*
          Não deixar um fetch pendente sem await.

          Antes eram iniciados os pedidos do catálogo e da conta,
          mas o código aguardava primeiro apenas o catálogo.
          Se o pedido da conta falhasse entretanto, o browser
          registava unhandledRejection: Failed to fetch.
        */
        const [
          responseCatalogo,
          responseConta,
        ] = await Promise.all([
          fetch(
            urlCatalogo,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              cache: "no-store",
            },
          ),

          modoConta
            ? fetch(
                urlConta,
                {
                  method: "GET",
                  headers: {
                    Accept:
                      "application/json",
                  },
                  cache: "no-store",
                },
              )
            : Promise.resolve(null),
        ]);

        const resultadoCatalogo =
          (await responseCatalogo.json()) as POSMobileCatalogoResponse;

        console.log(
          "Resposta do catálogo:",
          resultadoCatalogo,
        );

        if (
          !responseCatalogo.ok ||
          !resultadoCatalogo.sucesso ||
          !resultadoCatalogo.dados
        ) {
          throw new Error(
            resultadoCatalogo.mensagem ||
              "Não foi possível carregar o catálogo.",
          );
        }

        let contaResolvida:
          | POSMobileContaMesa
          | null = null;

        if (modoConta) {
          if (!responseConta) {
            throw new Error(
              "Não foi possível iniciar o pedido da conta da mesa.",
            );
          }

          const resultadoConta =
            (await responseConta.json()) as POSMobileContaMesaResposta;

          console.log(
            "Resposta da conta:",
            resultadoConta,
          );

          if (
            !responseConta.ok ||
            !resultadoConta.sucesso ||
            !resultadoConta.dados
          ) {
            throw new Error(
              resultadoConta.mensagem ||
                "Não foi possível carregar a conta da mesa.",
            );
          }

          contaResolvida =
            resultadoConta.dados;

          setContaCarregada(
            contaResolvida,
          );

          setModoEditor("CONTA");

          setDadosMesa(
            {
              ...dadosResolvidos,
              numeroPessoas:
                contaResolvida.numeroPessoas > 0
                  ? contaResolvida.numeroPessoas
                  : dadosResolvidos.numeroPessoas,
              descricaoMesa:
                contaResolvida.descricaoMesa ||
                dadosResolvidos.descricaoMesa,
              descricaoSala:
                contaResolvida.descricaoSala ||
                dadosResolvidos.descricaoSala,
            },
          );

          setLinhasEditor(
            converterProdutosContaParaEditor(
              contaResolvida.produtos,
            ),
          );
        } else {
          setContaCarregada(null);
          setModoEditor("ABERTURA");
          setLinhasEditor([]);
        }

        const gruposOrdenados = [
          ...resultadoCatalogo.dados.grupos,
        ]
          .filter(
            (grupo) =>
              grupo.visivel,
          )
          .sort(
            (primeiro, segundo) =>
              primeiro.ordem -
              segundo.ordem,
          );

        const catalogoNormalizado: POSMobileCatalogo =
          {
            ...resultadoCatalogo.dados,
            grupos: gruposOrdenados,
          };

        setCatalogo(
          catalogoNormalizado,
        );

        const primeiroGrupo =
          gruposOrdenados[0] ??
          null;

        setIdGrupoSelecionado(
          primeiroGrupo?.idGrupo ??
            null,
        );

        const paginasOrdenadas =
          primeiroGrupo
            ? [
                ...primeiroGrupo.paginas,
              ].sort(
                (
                  primeira,
                  segunda,
                ) =>
                  primeira.ordem -
                  segunda.ordem,
              )
            : [];

        setIdPaginaSelecionada(
          paginasOrdenadas[0]
            ?.idGProdutos ??
            null,
        );
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.";

        setMensagemErro(mensagem);
      } finally {
        setACarregar(false);
      }
    }, [
      params.idMesa,
      router,
      searchParams,
    ]);

  useEffect(() => {
    void carregarCatalogo();
  }, [carregarCatalogo]);

  useEffect(() => {
    function atualizarEstadoEcranInteiro() {
      setEcranInteiro(
        document.fullscreenElement !==
          null,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      atualizarEstadoEcranInteiro,
    );

    atualizarEstadoEcranInteiro();

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        atualizarEstadoEcranInteiro,
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (
        feedbackProdutoTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          feedbackProdutoTimeoutRef.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!mostrarPedidoMobile) {
      return;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function fecharComEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setMostrarPedidoMobile(
          false,
        );
      }
    }

    window.addEventListener(
      "keydown",
      fecharComEscape,
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        fecharComEscape,
      );
    };
  }, [mostrarPedidoMobile]);

  useEffect(() => {
    if (
      idGrupoSelecionado === null
    ) {
      return;
    }

    const contentor =
      gruposScrollRef.current;

    const botao =
      gruposBotaoRefs.current.get(
        idGrupoSelecionado,
      );

    if (
      !contentor ||
      !botao ||
      window.matchMedia(
        "(min-width: 1024px)",
      ).matches
    ) {
      return;
    }

    const destino =
      botao.offsetLeft -
      contentor.clientWidth / 2 +
      botao.clientWidth / 2;

    contentor.scrollTo({
      left: Math.max(0, destino),
      behavior: "smooth",
    });
  }, [idGrupoSelecionado]);

  const grupoSelecionado =
    useMemo<POSMobileCatalogoGrupo | null>(
      () => {
        if (
          !catalogo ||
          idGrupoSelecionado === null
        ) {
          return null;
        }

        return (
          catalogo.grupos.find(
            (grupo) =>
              grupo.idGrupo ===
              idGrupoSelecionado,
          ) ?? null
        );
      },
      [
        catalogo,
        idGrupoSelecionado,
      ],
    );

  const paginasGrupoSelecionado =
    useMemo<
      POSMobileCatalogoPagina[]
    >(() => {
      if (!grupoSelecionado) {
        return [];
      }

      return [
        ...grupoSelecionado.paginas,
      ].sort(
        (primeira, segunda) =>
          primeira.ordem -
          segunda.ordem,
      );
    }, [grupoSelecionado]);

  const paginaSelecionada =
    useMemo<
      POSMobileCatalogoPagina | null
    >(() => {
      if (
        idPaginaSelecionada === null
      ) {
        return null;
      }

      return (
        paginasGrupoSelecionado.find(
          (pagina) =>
            pagina.idGProdutos ===
            idPaginaSelecionada,
        ) ?? null
      );
    }, [
      paginasGrupoSelecionado,
      idPaginaSelecionada,
    ]);

  const botoesVisiveis =
    useMemo<
      POSMobileCatalogoBotao[]
    >(() => {
      if (!paginaSelecionada) {
        return [];
      }

      const termo =
        pesquisa
          .trim()
          .toLocaleLowerCase(
            "pt-PT",
          );

      return [
        ...paginaSelecionada.botoes,
      ]
        .filter(
          (botao) =>
            botao.visivel,
        )
        .filter((botao) => {
          if (!termo) {
            return true;
          }

          return botao.descricao
            .toLocaleLowerCase(
              "pt-PT",
            )
            .includes(termo);
        })
        .sort(
          (primeiro, segundo) =>
            primeiro.posicao -
            segundo.posicao,
        );
    }, [
      paginaSelecionada,
      pesquisa,
    ]);

  const totalEditor =
    useMemo(() => {
      return linhasEditor.reduce(
        (total, linha) => {
          if (
            !linha.precoEncontrado
          ) {
            return total;
          }

          return (
            total +
            linha.valorTotal
          );
        },
        0,
      );
    }, [linhasEditor]);

  const totalItensPedido =
    useMemo(() => {
      return linhasEditor.reduce(
        (total, linha) =>
          total + linha.quantidade,
        0,
      );
    }, [linhasEditor]);

  const totalLinhasNovas =
    useMemo(() => {
      return linhasEditor.filter(
        (linha) =>
          linha.origem === "NOVA",
      ).length;
    }, [linhasEditor]);

  const totalLinhasExistentes =
    useMemo(() => {
      return linhasEditor.filter(
        (linha) =>
          linha.origem ===
          "EXISTENTE",
      ).length;
    }, [linhasEditor]);

  const pagamentosFiltrados =
    useMemo(() => {
      const termo =
        pesquisaPagamento
          .trim()
          .toLocaleLowerCase(
            "pt-PT",
          );

      return [...pagamentos]
        .filter((pagamento) => {
          if (!termo) {
            return true;
          }

          return pagamento.descricao
            .toLocaleLowerCase(
              "pt-PT",
            )
            .includes(termo);
        })
        .sort(
          (primeiro, segundo) => {
            if (
              primeiro.ordem !==
              segundo.ordem
            ) {
              return (
                primeiro.ordem -
                segundo.ordem
              );
            }

            return primeiro.descricao.localeCompare(
              segundo.descricao,
              "pt-PT",
            );
          },
        );
    }, [
      pagamentos,
      pesquisaPagamento,
    ]);

  const pagamentosPrincipais =
    useMemo(() => {
      return pagamentosFiltrados.filter(
        (pagamento) =>
          pagamento.idTipoDocVnd > 0 &&
          !pagamento.multiPagamento,
      );
    }, [pagamentosFiltrados]);

  const pagamentosIndisponiveis =
    useMemo(() => {
      return pagamentosFiltrados.filter(
        (pagamento) =>
          pagamento.idTipoDocVnd <= 0 ||
          pagamento.multiPagamento,
      );
    }, [pagamentosFiltrados]);

  const totalProdutosNovos =
    useMemo(() => {
      return linhasEditor
        .filter(
          (linha) =>
            linha.origem === "NOVA",
        )
        .reduce(
          (total, linha) =>
            total + linha.quantidade,
          0,
        );
    }, [linhasEditor]);

  const temPrecosPendentes =
    useMemo(() => {
      return linhasEditor.some(
        (linha) =>
          !linha.precoEncontrado,
      );
    }, [linhasEditor]);

  const temAlteracoesPendentes =
    useMemo(() => {
      return linhasEditor.some(
        (linha) =>
          linha.origem === "NOVA",
      );
    }, [linhasEditor]);

  const linhaSelecionada =
    useMemo<ItemPedidoEditor | null>(() => {
      if (!idLinhaSelecionada) {
        return null;
      }

      return (
        linhasEditor.find(
          (linha) =>
            linha.idLocal ===
            idLinhaSelecionada,
        ) ?? null
      );
    }, [
      idLinhaSelecionada,
      linhasEditor,
    ]);

  const linhaComentarioEmEdicao =
    useMemo<ItemPedidoEditor | null>(() => {
      if (!idLinhaComentarioEmEdicao) {
        return null;
      }

      return (
        linhasEditor.find(
          (linha) =>
            linha.idLocal ===
            idLinhaComentarioEmEdicao,
        ) ?? null
      );
    }, [
      idLinhaComentarioEmEdicao,
      linhasEditor,
    ]);

  const componenteProgramaSelecionado =
    useMemo<ProgramaComponenteSelecionado | null>(() => {
      if (!idComponenteProgramaSelecionado) {
        return null;
      }

      for (const linha of linhasEditor) {
        if (linha.tipoItem !== "PROGRAMA") {
          continue;
        }

        const componente =
          linha.componentes.find(
            (item) =>
              item.idLocal ===
              idComponenteProgramaSelecionado,
          );

        if (componente) {
          return {
            programa: linha,
            componente,
          };
        }
      }

      return null;
    }, [
      idComponenteProgramaSelecionado,
      linhasEditor,
    ]);

  const componenteComentarioEmEdicao =
    useMemo<ProgramaComponenteSelecionado | null>(() => {
      if (!idLinhaComentarioEmEdicao) {
        return null;
      }

      for (const linha of linhasEditor) {
        if (linha.tipoItem !== "PROGRAMA") {
          continue;
        }

        const componente =
          linha.componentes.find(
            (item) =>
              item.idLocal ===
              idLinhaComentarioEmEdicao,
          );

        if (componente) {
          return {
            programa: linha,
            componente,
          };
        }
      }

      return null;
    }, [
      idLinhaComentarioEmEdicao,
      linhasEditor,
    ]);

  const motivoAnulacaoSelecionado =
    useMemo(() => {
      const idMotivo =
        Number(
          idMotivoAnulacao,
        );

      if (
        !dadosPreparacaoAnulacao ||
        !Number.isInteger(idMotivo) ||
        idMotivo <= 0
      ) {
        return null;
      }

      return (
        dadosPreparacaoAnulacao.motivos.find(
          (motivo) =>
            motivo.idMotivo ===
            idMotivo,
        ) ?? null
      );
    }, [
      dadosPreparacaoAnulacao,
      idMotivoAnulacao,
    ]);

  const resumoContextoCabecalho =
    useMemo(() => {
      if (!contextoPosto) {
        return "";
      }

      const itens = [
        descricaoContextoCompacta(
          contextoPosto.posto.descricao,
          "Posto",
          contextoPosto.posto.idPosto,
        ),

        descricaoContextoCompacta(
          contextoPosto.operacao
            .descricaoCentroExploracao,
          "Centro",
          contextoPosto.operacao
            .idCentroExploracao,
        ),

        descricaoContextoCompacta(
          contextoPosto.operacao
            .descricaoClassePrecos,
          "Classe",
          contextoPosto.operacao
            .idClassePrecos,
        ),

        descricaoContextoCompacta(
          contextoPosto.operacao
            .descricaoCaixa,
          "Caixa",
          contextoPosto.operacao
            .idCaixa,
        ),

        contextoPosto.operacao
          .idProfitCenter > 0
          ? descricaoContextoCompacta(
              contextoPosto.operacao
                .descricaoProfitCenter,
              "Profit center",
              contextoPosto.operacao
                .idProfitCenter,
            )
          : null,
      ].filter(
        (item): item is string =>
          Boolean(item),
      );

      return itens.join(" · ");
    }, [contextoPosto]);

  const idClassePrecosEfetiva =
    catalogo?.contexto
      .idClassePrecosEfetiva ??
    null;

  const mostrarClasseEfetiva =
    typeof idClassePrecosEfetiva ===
      "number" &&
    idClassePrecosEfetiva > 0 &&
    (
      !contextoPosto ||
      idClassePrecosEfetiva !==
        contextoPosto.operacao
          .idClassePrecos
    );

  useEffect(() => {
    function tratarBeforeUnload(
      event: BeforeUnloadEvent,
    ) {
      if (
        !temAlteracoesPendentes ||
        ignorarAvisoSaidaRef.current
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      tratarBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        tratarBeforeUnload,
      );
    };
  }, [temAlteracoesPendentes]);

  async function carregarPagamentos(
    forcarAtualizacao = false,
  ) {
    if (
      aCarregarPagamentos ||
      (
        pagamentos.length > 0 &&
        !forcarAtualizacao
      )
    ) {
      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setACarregarPagamentos(true);
    setMensagemErroPagamentos("");

    try {
      const response =
        await fetch(
          "/api/pos-mobile/pagamentos",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobilePagamentosResposta;

      if (response.status === 401) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível carregar os pagamentos disponíveis.",
        );
      }

      setPagamentos(
        resultado.dados.pagamentos ??
          [],
      );
    } catch (error) {
      setPagamentos([]);

      setMensagemErroPagamentos(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao carregar os pagamentos.",
      );
    } finally {
      setACarregarPagamentos(false);
    }
  }

  async function abrirPagamentos() {
    setMensagemOperacao("");
    setMensagemErroOperacao("");
    setMensagemErroPagamentos("");
    setPesquisaPagamento("");

    if (modoEditor !== "CONTA") {
      setMensagemErroOperacao(
        "A conta deve estar gravada antes de efetuar o pagamento.",
      );

      return;
    }

    if (!contaCarregada) {
      setMensagemErroOperacao(
        "Não foi possível identificar a conta a pagar.",
      );

      return;
    }

    if (temAlteracoesPendentes) {
      setMensagemErroOperacao(
        "Envie primeiro os produtos novos antes de abrir o pagamento.",
      );

      return;
    }

    if (temPrecosPendentes) {
      setMensagemErroOperacao(
        "Existem produtos sem preço válido. Resolva os preços antes de pagar.",
      );

      return;
    }

    const {
      idMovimentoMesa,
      idInternoConta,
    } = obterIdentificacaoContaAtual();

    if (
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      setMensagemErroOperacao(
        "Não foi possível identificar o movimento e a conta.",
      );

      return;
    }

    setMostrarPagamentos(true);

    if (pagamentos.length === 0) {
      await carregarPagamentos();
    }
  }

  function fecharPagamentos() {
    if (
      aCarregarPagamentos ||
      aPrepararPagamento ||
      aEfetuarPagamento ||
      aAssociarReservaHotel ||
      mostrarReservasHotel ||
      dadosPagamentoPreparado !== null ||
      pagamentoIntegradoPendenteRef.current !==
        null
    ) {
      return;
    }

    setMostrarPagamentos(false);
    setMensagemErroPagamentos("");
    setPesquisaPagamento("");
  }

  function abrirPesquisaCliente() {
    if (
      aCarregarPagamentos ||
      aPrepararPagamento ||
      aEfetuarPagamento ||
      pagamentoIntegradoPendenteRef.current !==
        null
    ) {
      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const idClienteIndiferenciado =
      contextoPosto?.operacao
        .idClienteIndiferenciado ??
      0;

    if (
      !Number.isInteger(
        idClienteIndiferenciado,
      ) ||
      idClienteIndiferenciado <= 0
    ) {
      setMensagemErroPagamentos(
        "Não existe cliente indiferenciado configurado no contexto do posto.",
      );

      return;
    }

    setAccessTokenCliente(
      accessToken,
    );

    setMostrarPesquisarCliente(
      true,
    );
  }

  function fecharPesquisaCliente() {
    setMostrarPesquisarCliente(
      false,
    );

    setAccessTokenCliente(
      "",
    );
  }

  function fecharConfirmacaoPagamento() {
    if (
      aEfetuarPagamento ||
      pagamentoIntegradoPendenteRef.current !==
        null
    ) {
      if (
        pagamentoIntegradoPendenteRef.current !==
        null
      ) {
        setMensagemErroPagamentos(
          "Existe um pagamento TPA em curso ou com resultado por confirmar. Volte a confirmar para retomar a consulta do mesmo pedido.",
        );
      }

      return;
    }

    setDadosPagamentoPreparado(
      null,
    );

    setContextoPagamentoPreparado(
      null,
    );

    setMensagemErroPagamentos(
      "",
    );
  }


  function fecharReservasHotel() {
    if (aAssociarReservaHotel) {
      return;
    }

    setMostrarReservasHotel(
      false,
    );

    /*
      Cancelar a seleção da reserva cancela também a
      preparação atual deste pagamento.

      O PagamentoDrawer permanece aberto para o operador
      poder escolher novamente ROOM CHARGE ou outro método.
    */
    setDadosPagamentoPreparado(
      null,
    );

    setContextoPagamentoPreparado(
      null,
    );

    setMensagemErroPagamentos(
      "",
    );
  }


  async function associarReservaHotel(
    reserva: POSMobileHotelReserva,
  ) {
    if (
      aAssociarReservaHotel ||
      !dadosPagamentoPreparado ||
      !contextoPagamentoPreparado
    ) {
      return;
    }

    const {
      accessToken,
      idMovimentoMesa,
      idInternoConta,
    } =
      contextoPagamentoPreparado;

    setAAssociarReservaHotel(
      true,
    );

    setMensagemErroPagamentos(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/pos-mobile/associar-reserva-hotel",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify({
                accessToken,
                idMovimentoMesa,
                idInternoConta,
                idReserva:
                  reserva.idReserva,
                quarto:
                  reserva.quarto,
              }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobileAssociarReservaHotelResposta;

      if (
        response.status === 401
      ) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace(
          "/login",
        );

        return;
      }

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível associar a reserva à conta.",
        );
      }

      /*
        A reserva já ficou associada à conta na APIFNT.

        Mantemos dadosPagamentoPreparado e
        contextoPagamentoPreparado para o passo seguinte:
        PagamentoConfirmacaoModal.
      */
      setMostrarReservasHotel(
        false,
      );

      setMensagemErroPagamentos(
        "",
      );

      setMensagemOperacao(
        `Quarto ${resultado.dados.reserva.quarto} · ${resultado.dados.reserva.cliente} associado à conta.`,
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao associar a reserva à conta.";

      console.error(
        "Erro ao associar reserva do hotel:",
        error,
      );

      setMensagemErroPagamentos(
        mensagem,
      );

      mensagensPOS.pagamentoErro(
        mensagem,
      );
    } finally {
      setAAssociarReservaHotel(
        false,
      );
    }
  }


  async function selecionarPagamento(
    pagamento: POSMobilePagamentoBotao,
  ) {
    /*
      A seleção do método NÃO efetua já o pagamento.

      Primeiro pedimos à APIFNT para preparar o pagamento.
      É a APIFNT que decide:

        - se pede Tipo de Serviço;
        - se pede Tipo de Refeição;
        - se pede Mercado;
        - se pede Referência;
        - se pede Valor Entregue;
        - se pede seleção de Reserva / Quarto;
        - se existe desconto automático;
        - se o operador tem de escolher desconto;
        - se o desconto pede motivo;
        - se o motivo/desconto obriga justificação;
        - se o documento valida dados fiscais.
    */
    if (
      pagamentoEmSelecaoRef.current ||
      aPrepararPagamento ||
      aEfetuarPagamento ||
      aAssociarReservaHotel ||
      mostrarReservasHotel ||
      dadosPagamentoPreparado !== null ||
      pagamentoIntegradoPendenteRef.current !==
        null
    ) {
      console.warn(
        "Seleção de pagamento ignorada: já existe uma operação de pagamento em curso.",
        {
          idPagamento:
            pagamento.idInterno,
          pagamento:
            pagamento.descricao,
        },
      );

      return;
    }

    pagamentoEmSelecaoRef.current =
      true;

    setMensagemErroPagamentos(
      "",
    );

    try {
      if (
        pagamento.idTipoDocVnd <=
        0
      ) {
        throw new Error(
          `O pagamento "${pagamento.descricao}" não possui tipo de documento configurado e não pode ser utilizado.`,
        );
      }

      if (
        pagamento.multiPagamento
      ) {
        throw new Error(
          "O multi-pagamento ainda não está disponível nesta fase.",
        );
      }

      const accessToken =
        sessionStorage.getItem(
          "posMobileAccessToken",
        );

      if (!accessToken) {
        router.replace(
          "/login",
        );

        return;
      }

      const {
        idMovimentoMesa,
        idInternoConta,
      } =
        obterIdentificacaoContaAtual();

      if (
        idMovimentoMesa <= 0 ||
        idInternoConta <= 0
      ) {
        throw new Error(
          "Não foi possível identificar o movimento e a conta.",
        );
      }

      /*
        CLIENTE DA FATURAÇÃO

        Regra:
          - cliente escolhido pelo operador;
          - caso contrário, cliente indiferenciado devolvido
            pelo contexto do posto;
          - nunca assumir Consumidor Final = 1.
      */
      const idClientePagamento =
        clienteSelecionado?.idCliente ??
        contextoPosto?.operacao
          .idClienteIndiferenciado ??
        0;

      if (
        !Number.isInteger(
          idClientePagamento,
        ) ||
        idClientePagamento <= 0
      ) {
        throw new Error(
          "Não existe um cliente válido para preparar o pagamento.",
        );
      }

      const descricaoClientePagamento =
        clienteSelecionado?.nome
          ?.trim() ||
        "Consumidor Final";

      setAPrepararPagamento(
        true,
      );

      setIdPagamentoEmProcessamento(
        pagamento.idInterno,
      );

      console.group(
        "========== PREPARAR PAGAMENTO POS MOBILE ==========",
      );

      console.log(
        "Pagamento selecionado:",
        pagamento,
      );

      console.log(
        "Conta:",
        {
          idMovimentoMesa,
          idInternoConta,
        },
      );

      console.log(
        "Cliente:",
        {
          idEntidade:
            idClientePagamento,
          descricao:
            descricaoClientePagamento,
        },
      );

      const response =
        await fetch(
          "/api/pos-mobile/preparar-pagamento",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify({
                accessToken,

                idMovimentoMesa,
                idInternoConta,

                idPagamentoDoc:
                  pagamento.idInterno,

                cliente: {
                  idEntidade:
                    idClientePagamento,
                },
              }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobilePrepararPagamentoResposta;

      console.log(
        "HTTP status:",
        response.status,
      );

      console.log(
        "Resposta PrepararPagamento:",
        resultado,
      );

      console.groupEnd();

      if (
        response.status === 401
      ) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace(
          "/login",
        );

        return;
      }

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível preparar o pagamento.",
        );
      }

      /*
        Guardamos exatamente a resposta preparada pela APIFNT.

        O modal passa a trabalhar sobre estes dados.
      */
      setDadosPagamentoPreparado(
        resultado.dados,
      );

      setContextoPagamentoPreparado({
        accessToken,

        idMovimentoMesa,
        idInternoConta,

        idCliente:
          idClientePagamento,

        descricaoCliente:
          descricaoClientePagamento,

        pagamento,
      });

      /*
        A identificação de Conta Quarto vem exclusivamente
        da APIFNT através de requisitos.pedeReservaHotel.

        Não identificar pelo texto "ROOM CHARGE" nem pelo
        idModoPagamento no browser.
      */
      setMostrarReservasHotel(
        resultado.dados.requisitos
          .pedeReservaHotel === true,
      );

    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao preparar o pagamento.";

      console.error(
        "Erro ao preparar pagamento:",
        error,
      );

      setMensagemErroPagamentos(
        mensagem,
      );

      mensagensPOS.pagamentoErro(
        mensagem,
      );

      setDadosPagamentoPreparado(
        null,
      );

      setContextoPagamentoPreparado(
        null,
      );

      setMostrarReservasHotel(
        false,
      );
    } finally {
      setAPrepararPagamento(
        false,
      );

      setIdPagamentoEmProcessamento(
        null,
      );

      pagamentoEmSelecaoRef.current =
        false;
    }
  }


  async function executarFluxoPagamentoIntegrado(
    pedido: PagamentoPedidoFuncional,
    valorPreparado: number,
  ): Promise<POSMobilePagamentoIntegradoDados> {
    const estadosFinalizaveis =
      new Set([
        "APROVADO",
        "ERRO_GRAVACAO_VENDA",
        "ASSOCIADO_VENDA",
      ]);

    const estadosFalha =
      new Set([
        "RECUSADO",
        "CANCELADO",
        "ERRO",
        "ERRO_ENVIO",
        "EXPIRADO",
      ]);

    let pedidoId = "";
    let estadoAtual = "";
    let valorAtual = valorPreparado;

    const pendenteAtual =
      pagamentoIntegradoPendenteRef.current;

    if (pendenteAtual) {
      if (
        pendenteAtual.idMovimentoMesa !==
          pedido.idMovimentoMesa ||
        pendenteAtual.idInternoConta !==
          pedido.idInternoConta ||
        pendenteAtual.idPagamentoDoc !==
          pedido.idPagamentoDoc
      ) {
        throw new Error(
          "Existe outro pagamento TPA pendente de confirmação. Não é possível iniciar um novo pagamento enquanto o anterior não for resolvido.",
        );
      }

      pedidoId =
        pendenteAtual.pedidoId;

      setPagamentoIntegradoVisual({
        pedidoId,
        estado: "A_RETOMAR",
        mensagem:
          "A retomar a consulta do pagamento já iniciado no terminal...",
        valor: valorAtual,
      });
    } else {
      setPagamentoIntegradoVisual({
        pedidoId: "",
        estado: "A_INICIAR",
        mensagem:
          "A enviar o pagamento para o terminal...",
        valor: valorAtual,
      });

      console.group(
        "========== INICIAR PAGAMENTO INTEGRADO ==========" ,
      );

      console.log(
        "Pedido:",
        pedido,
      );

      const responseInicio =
        await fetch(
          "/api/pos-mobile/pagamentos/iniciar-integrado",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify(
                pedido,
              ),
          },
        );

      const resultadoInicio =
        (await responseInicio.json()) as
          POSMobilePagamentoIntegradoResposta;

      console.log(
        "HTTP status:",
        responseInicio.status,
      );

      console.log(
        "Resposta:",
        resultadoInicio,
      );

      console.groupEnd();

      if (
        responseInicio.status === 401
      ) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace(
          "/login",
        );

        throw new Error(
          "A sessão expirou durante o pagamento.",
        );
      }

      if (
        !responseInicio.ok ||
        !resultadoInicio.sucesso ||
        !resultadoInicio.dados
      ) {
        throw new Error(
          resultadoInicio.mensagem ||
            "Não foi possível iniciar o pagamento no TPA.",
        );
      }

      pedidoId =
        resultadoInicio.dados.pedidoId
          ?.trim() ?? "";

      if (!pedidoId) {
        throw new Error(
          "O serviço TPA não devolveu o identificador do pedido.",
        );
      }

      pagamentoIntegradoPendenteRef.current = {
        pedidoId,
        idMovimentoMesa:
          pedido.idMovimentoMesa,
        idInternoConta:
          pedido.idInternoConta,
        idPagamentoDoc:
          pedido.idPagamentoDoc,
      };

      estadoAtual =
        normalizarEstadoPagamentoIntegrado(
          resultadoInicio.dados.estado,
        );

      valorAtual =
        resultadoInicio.dados.valor > 0
          ? resultadoInicio.dados.valor
          : valorPreparado;

      setPagamentoIntegradoVisual({
        pedidoId,
        estado:
          estadoAtual ||
          "EM_PROCESSAMENTO",
        mensagem:
          resultadoInicio.mensagem ||
          "Aguarde a confirmação no terminal.",
        valor: valorAtual,
      });

      if (
        estadosFalha.has(
          estadoAtual,
        )
      ) {
        pagamentoIntegradoPendenteRef.current =
          null;

        throw new Error(
          resultadoInicio.mensagem ||
            `O pagamento terminou com o estado ${estadoAtual}.`,
        );
      }
    }

    /*
      ========================================================================
      POLLING
      ========================================================================

      Se houver uma falha transitória de rede depois de o PedidoId existir,
      não criamos outro pagamento. Continuamos a tentar consultar o mesmo
      pedido durante a janela normal do TPA.
      ========================================================================
    */
    if (
      !estadosFinalizaveis.has(
        estadoAtual,
      )
    ) {
      const limiteConsulta =
        Date.now() + 130000;

      let ultimaMensagemComunicacao = "";

      while (
        Date.now() < limiteConsulta
      ) {
        await aguardar(2000);

        let responseEstado: Response;
        let resultadoEstado:
          | POSMobilePagamentoIntegradoResposta
          | null = null;

        try {
          responseEstado =
            await fetch(
              "/api/pos-mobile/pagamentos/estado-integrado",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Accept:
                    "application/json",
                },
                body:
                  JSON.stringify({
                    accessToken:
                      pedido.accessToken,
                    pedidoId,
                  }),
              },
            );

          resultadoEstado =
            (await responseEstado.json()) as
              POSMobilePagamentoIntegradoResposta;
        } catch (error) {
          ultimaMensagemComunicacao =
            error instanceof Error
              ? error.message
              : "Falha de comunicação.";

          setPagamentoIntegradoVisual({
            pedidoId,
            estado:
              estadoAtual ||
              "EM_PROCESSAMENTO",
            mensagem:
              "A recuperar a ligação e a confirmar o estado do pagamento...",
            valor: valorAtual,
          });

          continue;
        }

        if (
          responseEstado.status === 401
        ) {
          sessionStorage.removeItem(
            "posMobileAccessToken",
          );

          router.replace(
            "/login",
          );

          throw new Error(
            "A sessão expirou durante a confirmação do pagamento.",
          );
        }

        if (
          !responseEstado.ok ||
          !resultadoEstado?.sucesso ||
          !resultadoEstado.dados
        ) {
          ultimaMensagemComunicacao =
            resultadoEstado?.mensagem ||
            `Não foi possível consultar o TPA. HTTP ${responseEstado.status}.`;

          setPagamentoIntegradoVisual({
            pedidoId,
            estado:
              estadoAtual ||
              "EM_PROCESSAMENTO",
            mensagem:
              "A confirmar o resultado do pagamento no terminal...",
            valor: valorAtual,
          });

          continue;
        }

        ultimaMensagemComunicacao = "";

        estadoAtual =
          normalizarEstadoPagamentoIntegrado(
            resultadoEstado.dados.estado,
          );

        if (
          resultadoEstado.dados.valor > 0
        ) {
          valorAtual =
            resultadoEstado.dados.valor;
        }

        setPagamentoIntegradoVisual({
          pedidoId,
          estado:
            estadoAtual ||
            "EM_PROCESSAMENTO",
          mensagem:
            resultadoEstado.mensagem ||
            "A aguardar confirmação no terminal...",
          valor: valorAtual,
        });

        if (
          estadosFinalizaveis.has(
            estadoAtual,
          )
        ) {
          break;
        }

        if (
          estadosFalha.has(
            estadoAtual,
          )
        ) {
          pagamentoIntegradoPendenteRef.current =
            null;

          throw new Error(
            resultadoEstado.mensagem ||
              `O pagamento terminou com o estado ${estadoAtual}.`,
          );
        }
      }

      if (
        !estadosFinalizaveis.has(
          estadoAtual,
        )
      ) {
        /*
          Mantemos pagamentoIntegradoPendenteRef.

          Se o operador voltar a confirmar, retomamos este PedidoId em vez de
          criar uma segunda cobrança potencialmente duplicada.
        */
        throw new Error(
          ultimaMensagemComunicacao
            ? `Não foi possível confirmar o resultado do pagamento no terminal. ${ultimaMensagemComunicacao} Não repita o pagamento sem voltar a consultar este pedido.`
            : "Não foi possível confirmar o resultado do pagamento no terminal dentro do tempo esperado. Volte a confirmar para consultar o mesmo pedido; não inicie uma nova cobrança.",
        );
      }
    }

    /*
      ========================================================================
      FINALIZAR
      ========================================================================

      Mesmo depois de APROVADO o browser não grava diretamente a venda.
      A APIFNT volta a confirmar o PedidoId, o posto, a conta, o botão, o
      cliente e o valor antes de persistir o documento.
      ========================================================================
    */
    setPagamentoIntegradoVisual({
      pedidoId,
      estado:
        estadoAtual ||
        "APROVADO",
      mensagem:
        "Pagamento confirmado. A emitir o documento de venda...",
      valor: valorAtual,
    });

    const {
      accessToken,
      ...pagamentoFinal
    } = pedido;

    let responseFinal: Response;

    try {
      responseFinal =
        await fetch(
          "/api/pos-mobile/pagamentos/finalizar-integrado",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify({
                accessToken,
                pedidoId,
                pagamento:
                  pagamentoFinal,
              }),
          },
        );
    } catch (error) {
      /*
        O PedidoId continua guardado para que uma nova confirmação retome a
        mesma operação e a finalização seja repetida de forma idempotente.
      */
      throw new Error(
        error instanceof Error
          ? `O pagamento foi enviado ao TPA, mas não foi possível confirmar a gravação da venda: ${error.message}`
          : "O pagamento foi enviado ao TPA, mas não foi possível confirmar a gravação da venda.",
      );
    }

    const resultadoFinal =
      (await responseFinal.json()) as
        POSMobilePagamentoIntegradoResposta;

    if (
      responseFinal.status === 401
    ) {
      sessionStorage.removeItem(
        "posMobileAccessToken",
      );

      router.replace(
        "/login",
      );

      throw new Error(
        "A sessão expirou durante a finalização do pagamento.",
      );
    }

    if (
      !responseFinal.ok ||
      !resultadoFinal.sucesso ||
      !resultadoFinal.dados
    ) {
      /*
        Não limpamos o PedidoId aqui.

        O TPA pode já ter aprovado. Uma nova confirmação chama novamente a
        finalização do MESMO pedido, protegida pela idempotência da APIFNT.
      */
      throw new Error(
        resultadoFinal.mensagem ||
          "Não foi possível finalizar o pagamento integrado.",
      );
    }

    pagamentoIntegradoPendenteRef.current =
      null;

    setPagamentoIntegradoVisual({
      pedidoId,
      estado:
        normalizarEstadoPagamentoIntegrado(
          resultadoFinal.dados.estado,
        ) ||
        "ASSOCIADO_VENDA",
      mensagem:
        resultadoFinal.mensagem ||
        "Pagamento concluído com sucesso.",
      valor:
        resultadoFinal.dados.valor,
    });

    return resultadoFinal.dados;
  }


  function pedirConfirmacaoImpressao():
    Promise<boolean> {
    /*
      Se, por qualquer motivo, já existir uma confirmação aberta,
      não criamos uma segunda.
    */
    if (
      resolverConfirmacaoImpressaoRef.current !==
      null
    ) {
      console.warn(
        "Confirmação de impressão ignorada: já existe um modal aberto.",
      );

      return Promise.resolve(
        false,
      );
    }

    return new Promise<boolean>(
      (resolve) => {
        resolverConfirmacaoImpressaoRef.current =
          resolve;

        setMostrarConfirmacaoImpressao(
          true,
        );
      },
    );
  }


  function responderConfirmacaoImpressao(
    imprimir: boolean,
  ) {
    const resolver =
      resolverConfirmacaoImpressaoRef.current;

    if (!resolver) {
      return;
    }

    /*
      Limpamos primeiro para impedir um segundo clique no mesmo botão.
    */
    resolverConfirmacaoImpressaoRef.current =
      null;

    setMostrarConfirmacaoImpressao(
      false,
    );

    resolver(
      imprimir,
    );
  }


  async function confirmarPagamentoPreparado(
    valores: PagamentoConfirmacaoValores,
  ) {
    if (
      pagamentoEmExecucaoRef.current ||
      aEfetuarPagamento ||
      !dadosPagamentoPreparado ||
      !contextoPagamentoPreparado
    ) {
      return;
    }

    const {
      accessToken,
      idMovimentoMesa,
      idInternoConta,
      idCliente,
      descricaoCliente,
      pagamento,
    } =
      contextoPagamentoPreparado;

    /*
      Bloqueio síncrono imediato contra duplo clique/toque.
    */
    pagamentoEmExecucaoRef.current =
      true;

    setMensagemErroPagamentos(
      "",
    );

    setAEfetuarPagamento(
      true,
    );

    setIdPagamentoEmProcessamento(
      pagamento.idInterno,
    );

    let documentoConcluido = "";
    let valorDocumentoConcluido = 0;
    let idVndCabDocumentoConcluido = 0;

    try {
      /*
        O modal devolve apenas valores que:

          - foram predefinidos pela APIFNT; ou
          - foram escolhidos pelo operador porque a APIFNT
            indicou que eram necessários.

        O método de pagamento continua identificado apenas
        por idPagamentoDoc. IDTipoDocVnd e IDModoPagamento
        são novamente resolvidos no servidor.
      */
      const pedido:
        PagamentoPedidoFuncional = {
          accessToken,

          idMovimentoMesa,
          idInternoConta,

          idPagamentoDoc:
            pagamento.idInterno,

          cliente: {
            idEntidade:
              idCliente,
          },

          idTipoServico:
            valores.idTipoServico,

          idTipoRefeicao:
            valores.idTipoRefeicao,

          idMercado:
            valores.idMercado,

          /*
            Num desconto automático o modal devolve 0.
            A APIFNT volta a resolver o desconto associado
            ao método de pagamento.

            Num desconto selecionável vem o ID escolhido
            pelo operador.
          */
          idTipoDesconto:
            valores.idTipoDesconto,

          idMotivoDesconto:
            valores.idMotivoDesconto,

          justificacaoDesconto:
            valores.justificacaoDesconto,

          referencia:
            valores.referencia,

          valorEntregue:
            valores.valorEntregue,

          /*
            REGRA GERAL DO POS MOBILE:
            a gravação da venda nunca aguarda pela impressora.
          */
          imprimir: false,
        };

      const integracao =
        obterIntegracaoPagamentoPreparado(
          dadosPagamentoPreparado,
        );

      if (
        integracao.integracaoPagamento &&
        integracao.tipoIntegracaoPagamento !==
          "TPA"
      ) {
        throw new Error(
          `O tipo de integração de pagamento "${integracao.tipoIntegracaoPagamento || "NÃO DEFINIDO"}" ainda não é suportado pelo POS Mobile.`,
        );
      }

      if (
        integracao.integracaoPagamento &&
        integracao.tipoIntegracaoPagamento ===
          "TPA"
      ) {
        console.group(
          "========== PAGAMENTO INTEGRADO POS MOBILE ==========" ,
        );

        console.log(
          "Pagamento:",
          pagamento,
        );

        console.log(
          "Preparação:",
          dadosPagamentoPreparado,
        );

        console.log(
          "Pedido final:",
          pedido,
        );

        const resultadoIntegrado =
          await executarFluxoPagamentoIntegrado(
            pedido,
            dadosPagamentoPreparado.valor,
          );

        console.log(
          "Pagamento integrado concluído:",
          resultadoIntegrado,
        );

        console.groupEnd();

        documentoConcluido =
          resultadoIntegrado.documento;

        valorDocumentoConcluido =
          resultadoIntegrado.valor;

        idVndCabDocumentoConcluido =
          resultadoIntegrado.idVndCabDocumento;
      } else {
        /*
          ====================================================================
          PAGAMENTO NORMAL
          ====================================================================

          Este é o fluxo que já existia. Mantém-se exatamente separado do
          pagamento integrado.
          ====================================================================
        */
        console.group(
          "========== EFETUAR PAGAMENTO POS MOBILE ==========" ,
        );

        console.log(
          "Pagamento:",
          pagamento,
        );

        console.log(
          "Preparação:",
          dadosPagamentoPreparado,
        );

        console.log(
          "Pedido final:",
          pedido,
        );

        const response =
          await fetch(
            "/api/pos-mobile/efetuar-pagamento",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body:
                JSON.stringify(
                  pedido,
                ),
            },
          );

        const resultado =
          (await response.json()) as
            POSMobileEfetuarPagamentoResposta;

        console.log(
          "HTTP status:",
          response.status,
        );

        console.log(
          "Resposta:",
          resultado,
        );

        console.groupEnd();

        if (
          response.status === 401
        ) {
          sessionStorage.removeItem(
            "posMobileAccessToken",
          );

          router.replace(
            "/login",
          );

          return;
        }

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível efetuar o pagamento.",
          );
        }

        documentoConcluido =
          resultado.dados.documento;

        valorDocumentoConcluido =
          resultado.dados.valorDocumento;

        idVndCabDocumentoConcluido =
          resultado.dados.idVndCabDocumento;
      }

      /*
        ========================================================================
        IMPRESSÃO DO TALÃO
        ========================================================================

        A venda JÁ ESTÁ GRAVADA neste ponto.

        Só agora abrimos o Modal HeroUI e aguardamos explicitamente a decisão
        do operador. O Modal só fecha quando clicar em "Sim" ou "Não".

        pedido.imprimir continua sempre false, portanto a gravação da venda
        nunca fica dependente da impressora.
        ========================================================================
      */
      /*
        A venda já foi concluída com sucesso.

        Fechamos AGORA o PagamentoConfirmacaoModal original antes de abrir
        a pergunta de impressão.

        Sem isto, dadosPagamentoPreparado continuava preenchido e o modal
        "Confirmar pagamento" permanecia aberto em estado "A processar...",
        enquanto a função ficava em await à espera de um segundo modal que
        não ficava acessível ao operador.
      */
      setDadosPagamentoPreparado(
        null,
      );

      setContextoPagamentoPreparado(
        null,
      );

      setMostrarPagamentos(
        false,
      );

      /*
        No fluxo TPA, pagamentoIntegradoVisual continua preenchido com o
        estado final (por exemplo ASSOCIADO_VENDA) até ao finally.

        Como vamos ficar em await à espera da resposta do operador no modal
        de impressão, temos de fechar explicitamente o overlay visual do TPA
        ANTES de abrir esse modal.

        Caso contrário, o pagamento já está faturado mas o ecrã continua a
        mostrar "Pagamento TPA / A aguardar pagamento no terminal" por cima
        da confirmação de impressão.
      */
      setPagamentoIntegradoVisual(
        null,
      );

      /*
        Se a configuração mandar perguntar, ficamos à espera do Modal HeroUI
        e só continuamos depois de o operador clicar em "Sim" ou "Não".

        Se não mandar perguntar, o valor fica True e a impressão separada
        é solicitada automaticamente.
      */
      let desejaImprimir =
        true;

      if (
        perguntarAntesDeImprimir
      ) {
        desejaImprimir =
          await pedirConfirmacaoImpressao();
      }

      if (
        desejaImprimir
      ) {
        console.log(
          "[PRINT BROWSER 00] OPERADOR/CONFIGURAÇÃO MANDOU IMPRIMIR",
          {
            hora:
              new Date().toISOString(),

            perguntarAntesDeImprimir,

            idVndCabDocumento:
              idVndCabDocumentoConcluido,

            idPagamentoDoc:
              pagamento.idInterno,
          },
        );

        solicitarImpressaoVenda(
          accessToken,
          idVndCabDocumentoConcluido,
          pagamento.idInterno,
        );
      } else {
        console.log(
          "[PRINT BROWSER 00] OPERADOR ESCOLHEU NÃO IMPRIMIR",
          {
            hora:
              new Date().toISOString(),

            idVndCabDocumento:
              idVndCabDocumentoConcluido,

            idPagamentoDoc:
              pagamento.idInterno,
          },
        );
      }

      /*
        A partir deste momento a venda já foi gravada.

        Não devemos repetir a faturação mesmo que a libertação
        da mesa falhe.
      */

      /*
        A faturação já foi concluída neste ponto.

        Mostramos imediatamente a mensagem ao operador antes de aguardar
        qualquer operação auxiliar, nomeadamente a libertação da mesa.
        A impressão também já foi solicitada acima de forma não bloqueante.
      */
      mensagensPOS.pagamentoSucesso({
        documento:
          documentoConcluido,

        valor:
          valorDocumentoConcluido,

        pagamento:
          pagamento.descricao,

        cliente:
          descricaoCliente,
      });

      try {
        await sairMesa();
      } catch (error) {
        console.error(
          "Pagamento concluído, mas ocorreu um erro ao libertar a mesa:",
          error,
        );
      }

      ignorarAvisoSaidaRef.current =
        true;

      sessionStorage.removeItem(
        "posMobileMesaEmAbertura",
      );

      sessionStorage.removeItem(
        "posMobileContaSelecionada",
      );

      router.replace(
        "/pos",
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao efetuar o pagamento.";

      console.error(
        "Erro ao efetuar pagamento:",
        error,
      );

      /*
        Mantemos o modal aberto.

        Para pagamentos normais o operador pode corrigir Tipo de Serviço,
        motivo, referência, valor entregue, etc.

        Para TPA, se já existe PedidoId mas houve uma falha transitória de
        comunicação/finalização, o ref do pedido permanece guardado. Uma nova
        confirmação retoma o MESMO PedidoId e não inicia uma segunda cobrança.
      */
      setMensagemErroPagamentos(
        mensagem,
      );

      mensagensPOS.pagamentoErro(
        mensagem,
      );
    } finally {
      pagamentoEmExecucaoRef.current =
        false;

      setPagamentoIntegradoVisual(
        null,
      );

      setAEfetuarPagamento(
        false,
      );

      setIdPagamentoEmProcessamento(
        null,
      );
    }
  }


  function testarToastPOS() {
    console.log(
      "========== TESTE TOAST POS ==========",
    );

    mensagensPOS.sucesso({
      titulo:
        "Teste Toast POS",

      descricao:
        "Se está a ver esta mensagem, o provider e o z-index do Toast estão a funcionar.",

      duracao:
        8000,
    });
  }


  async function alternarEcranInteiro() {
    setMensagemErroOperacao("");

    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error(
        "Não foi possível alterar o ecrã inteiro:",
        error,
      );

      setMensagemErroOperacao(
        "Não foi possível alterar o modo de ecrã inteiro.",
      );
    }
  }

  function selecionarGrupo(
    grupo: POSMobileCatalogoGrupo,
  ) {
    const paginasOrdenadas = [
      ...grupo.paginas,
    ].sort(
      (primeira, segunda) =>
        primeira.ordem -
        segunda.ordem,
    );

    setIdGrupoSelecionado(
      grupo.idGrupo,
    );

    setIdPaginaSelecionada(
      paginasOrdenadas[0]
        ?.idGProdutos ??
        null,
    );

    setPesquisa("");
  }

  function selecionarPagina(
    pagina: POSMobileCatalogoPagina,
  ) {
    setIdPaginaSelecionada(
      pagina.idGProdutos,
    );

    setPesquisa("");
  }

  function sinalizarProdutoAdicionado(
    botao: POSMobileCatalogoBotao,
  ) {
    const chave =
      obterChaveFeedbackProduto(
        botao,
      );

    setProdutoAdicionadoFeedback(
      chave,
    );

    if (
      feedbackProdutoTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        feedbackProdutoTimeoutRef.current,
      );
    }

    if (
      typeof navigator !== "undefined" &&
      "vibrate" in navigator
    ) {
      navigator.vibrate(25);
    }

    feedbackProdutoTimeoutRef.current =
      window.setTimeout(() => {
        setProdutoAdicionadoFeedback(
          null,
        );

        feedbackProdutoTimeoutRef.current =
          null;
      }, 650);
  }

  function adicionarProdutoResolvido(
    botao: POSMobileCatalogoBotao,
    preco: number,
    precoAlterado: boolean,
    justificacaoAlteracaoPreco:
      | string
      | null,
    comentarios:
      POSMobileComentarioSelecionado[],
  ) {
    setMensagemOperacao("");
    setMensagemErroOperacao("");

    const comentariosLinha =
      comentarios.map(
        (comentario) => ({
          ...comentario,
          texto:
            comentario.texto.trim(),
        }),
      );

    const assinaturaComentarios =
      criarAssinaturaComentarios(
        comentariosLinha,
      );

    setLinhasEditor(
      (linhasAtuais) => {
        const linhaExistente =
          linhasAtuais.find(
            (linha) =>
              linha.origem ===
                "NOVA" &&
              (
                botao.idBotao !== null
                  ? linha.idBotao ===
                      botao.idBotao
                  : linha.idProduto ===
                      botao.idProduto
              ) &&
              linha.preco === preco &&
              criarAssinaturaComentarios(
                linha.comentarios,
              ) ===
                assinaturaComentarios,
          );

        if (linhaExistente) {
          return linhasAtuais.map(
            (linha) => {
              if (
                linha.idLocal !==
                linhaExistente.idLocal
              ) {
                return linha;
              }

              const quantidade =
                linha.quantidade + 1;

              return {
                ...linha,
                quantidade,
                valorTotal:
                  linha.preco *
                  quantidade,
              };
            },
          );
        }

        return [
          ...linhasAtuais,
          {
            tipoItem:
              "PRODUTO",
            idLocal:
              `nova-${botao.idBotao ?? `produto-${botao.idProduto ?? 0}`}-${Date.now()}`,
            origem: "NOVA",
            idBotao:
              botao.idBotao,
            idLinha: null,
            idProduto:
              botao.idProduto ?? 0,
            descricao:
              botao.descricao,
            quantidade: 1,
            preco,
            valorTotal: preco,
            precoEncontrado: true,
            precoVariavel:
              botao.precoVariavel,
            precoAlterado,
            justificacaoAlteracaoPreco,
            jaImpresso: false,
            anulado: false,
            idGrupoPreparacao: null,
            observacao: null,
            comentarios:
              comentariosLinha,
          },
        ];
      },
    );

    sinalizarProdutoAdicionado(
      botao,
    );
  }

  function prepararAdicaoProdutoResolvido(
    botao: POSMobileCatalogoBotao,
    preco: number,
    precoAlterado: boolean,
    justificacaoAlteracaoPreco:
      | string
      | null,
  ) {
    if (botao.abrirComentario) {
      setMensagemErroComentariosLinha(
        "",
      );

      setProdutoPendenteComentario({
        botao,
        preco,
        precoAlterado,
        justificacaoAlteracaoPreco,
      });

      return;
    }

    adicionarProdutoResolvido(
      botao,
      preco,
      precoAlterado,
      justificacaoAlteracaoPreco,
      [],
    );
  }

  async function prepararPrograma(
    botao: POSMobileCatalogoBotao,
  ) {
    setMensagemOperacao("");
    setMensagemErroOperacao("");

    if (aAdicionarPrograma) {
      return;
    }

    if (
      !botao.idProduto ||
      botao.idProduto <= 0
    ) {
      setMensagemErroOperacao(
        "O botão não possui um produto-programa válido.",
      );

      return;
    }

    if (!dadosMesa) {
      setMensagemErroOperacao(
        "Não foi possível identificar os dados da mesa.",
      );

      return;
    }

    if (
      !botao.precoEncontrado ||
      !Number.isFinite(botao.preco) ||
      botao.preco <= 0
    ) {
      setMensagemErroOperacao(
        `Não foi encontrado um preço válido para "${botao.descricao}".`,
      );

      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setAAdicionarPrograma(true);

    try {
      const responsePreparacao =
        await fetch(
          "/api/pos-mobile/preparar-produto-programa",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idPosto:
                dadosMesa.idPosto,
              idSala:
                dadosMesa.idSala,
              idProdutoPrograma:
                botao.idProduto,
              idGrupoPreparacao: 0,
              quantidade: 1,
            }),
          },
        );

      const resultadoPreparacao =
        (await responsePreparacao.json()) as
          POSMobileApiResponse<
            ProgramaResultado
          >;

      console.group(
        "========== PREPARAÇÃO DO PROGRAMA ==========",
      );

      console.log(
        "HTTP status:",
        responsePreparacao.status,
      );

      console.log(
        "Botão selecionado:",
        botao,
      );

      console.log(
        "Resposta completa:",
        resultadoPreparacao,
      );

      console.log(
        "Dados do programa:",
        resultadoPreparacao.dados,
      );

      console.log(
        "Produtos:",
        resultadoPreparacao.dados?.produtos,
      );

      console.log(
        "Linhas fixas:",
        resultadoPreparacao.dados?.linhasFixas,
      );

      console.log(
        "Níveis:",
        resultadoPreparacao.dados?.niveis,
      );

      console.log(
        "Grupos:",
        resultadoPreparacao.dados?.grupos,
      );

      console.table(
        [
          ...(resultadoPreparacao.dados?.linhasFixas ?? []),
          ...(resultadoPreparacao.dados?.produtos ?? []),
        ].map(
          (produto, indice) => ({
            indice,
            idProduto:
              produto.idProduto,
            descricao:
              produto.descricao,
            idNivel:
              produto.idNivel,
            idGrupoMenu:
              produto.idGrupoMenu,
            quantidadeBase:
              produto.quantidadeBase,
            quantidade:
              produto.quantidade,
            valorUnitario:
              produto.valorUnitario,
            precoValido:
              produto.precoValido,
            disponivel:
              produto.disponivel,
            predefinido:
              produto.predefinido,
            produtoFixo:
              produto.produtoFixo,
            produtoSemEscolha:
              produto.produtoSemEscolha,
          }),
        ),
      );

      console.groupEnd();

      if (
        responsePreparacao.status ===
        401
      ) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace("/login");
        return;
      }

      if (
        !responsePreparacao.ok ||
        !resultadoPreparacao.sucesso ||
        !resultadoPreparacao.dados
      ) {
        throw new Error(
          resultadoPreparacao.mensagem ||
            "Não foi possível preparar o programa.",
        );
      }

      const programaPreparado =
        resultadoPreparacao.dados;

      if (
        !programaPreparado.idProdutoPrograma ||
        programaPreparado.idProdutoPrograma <= 0
      ) {
        throw new Error(
          "A API não devolveu um produto-programa válido.",
        );
      }

      if (
        programaPreparado.tipoLancamento ===
        "DESCONHECIDO"
      ) {
        throw new Error(
          "Não foi possível determinar o tipo de lançamento do programa.",
        );
      }

      if (
        programaPreparado.produtos.length === 0 &&
        programaPreparado.linhasFixas.length === 0
      ) {
        throw new Error(
          "O programa não possui produtos configurados.",
        );
      }

      if (
        programaPreparado.tipoLancamento ===
        "PARCIAL"
      ) {
        setProgramaParcialPendente({
          botao,
          programa:
            programaPreparado,
        });

        return;
      }

      if (
        programaPreparado.tipoLancamento !==
        "TOTAL"
      ) {
        throw new Error(
          `O tipo de programa "${programaPreparado.tipoLancamento}" ainda não está disponível no editor.`,
        );
      }

      const programaEditor =
        criarProgramaPedidoEditor(
          programaPreparado,
          botao.idBotao,
          botao.preco,
          0,
        );

      setLinhasEditor(
        (itensAtuais) => [
          ...itensAtuais,
          programaEditor,
        ],
      );

      setMensagemOperacao(
        `"${programaEditor.descricao}" foi adicionado ao pedido e aguarda envio.`,
      );
    } catch (error) {
      setMensagemErroOperacao(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao preparar o programa.",
      );
    } finally {
      setAAdicionarPrograma(false);
    }
  }


  async function confirmarProgramaParcial(
    linhas: ProgramaLinhaPedido[],
  ) {
    if (!programaParcialPendente) {
      throw new Error(
        "Não existe um programa parcial em preparação.",
      );
    }

    const {
      botao,
      programa,
    } = programaParcialPendente;

    const linhasPorProduto =
      new Map(
        linhas.map(
          (linha) => [
            linha.idProduto,
            linha,
          ],
        ),
      );

    const programaEditor =
      criarProgramaPedidoEditor(
        programa,
        botao.idBotao,
        botao.preco,
        0,
      );

    const programaEditorAtualizado:
      ProgramaPedidoEditor = {
        ...programaEditor,

        componentes:
          programaEditor.componentes.map(
            (componente) => {
              const linha =
                linhasPorProduto.get(
                  componente.idProduto,
                );

              if (!linha) {
                return {
                  ...componente,
                  selecionado:
                    false,
                  quantidade:
                    0,
                  valorTotal:
                    0,
                };
              }

              return {
                ...componente,

                idNivel:
                  linha.idNivel,

                idGrupoMenu:
                  linha.idGrupoMenu,

                idGrupoPreparacao:
                  linha.idGrupoPreparacao,

                quantidade:
                  linha.quantidade,

                valorUnitario:
                  linha.valorUnitario,

                valorTotal:
                  linha.valorUnitario *
                  linha.quantidade,

                valorFixo:
                  linha.valorFixo,

                selecionado:
                  true,

                produtoFixo:
                  linha.produtoFixo,

                produtoSemEscolha:
                  linha.produtoSemEscolha,
              };
            },
          ),
      };

    setLinhasEditor(
      (itensAtuais) => [
        ...itensAtuais,
        programaEditorAtualizado,
      ],
    );

    setProgramaParcialPendente(
      null,
    );

    setMensagemOperacao(
      `"${programaEditorAtualizado.descricao}" foi configurado e adicionado ao pedido.`,
    );

    setMensagemErroOperacao(
      "",
    );
  }


  function converterBotaoGrupoLinkParaCatalogo(
    botao: POSMobileGrupoLinkBotao,
  ): POSMobileCatalogoBotao {
    const tipoBotao =
      botao.tipoBotao
        ?.trim()
        .toUpperCase();

    return {
      /*
        O contrato atual do Grupo Link não devolve ID_Botao.
        Mantemos null. O editor usa o ID do produto como fallback
        para agregar linhas novas quando não existe ID_Botao.
      */
      idBotao: null,

      idGrupo:
        grupoLinkAtivo?.idGrupo ??
        0,

      idGProdutos: 0,
      numeroPagina: 0,

      posicao:
        botao.posicao,

      tipoBotao:
        tipoBotao === "PRODUTO"
          ? "PRODUTO"
          : tipoBotao === "LINK"
            ? "LINK"
            : "DESCONHECIDO",

      idProduto:
        botao.idProduto > 0
          ? botao.idProduto
          : null,

      idGrupoLink:
        botao.idGrupoLink > 0
          ? botao.idGrupoLink
          : null,

      descricao:
        botao.descricao,

      descricaoPagina:
        null,

      tipoProduto:
        botao.tipoProduto?.trim() ||
        null,

      preco:
        botao.preco,

      /*
        O endpoint de Grupo Link devolve o preço já calculado.
        Caso venha a zero, a pipeline normal abre o editor de preço.
      */
      precoEncontrado:
        Number.isFinite(
          botao.preco,
        ),

      precoVariavel:
        false,

      cor:
        botao.cor?.trim() ||
        null,

      corLetra:
        botao.corLetra?.trim() ||
        null,

      corPreco: null,
      corPrecoLetra: null,

      nomeImagem:
        botao.nomeImagem?.trim() ||
        null,

      tamanhoLetra:
        botao.tamanhoLetra,

      letraNegrito:
        botao.letraNegrito,

      letraItalico:
        botao.letraItalico,

      letraSublinhado:
        botao.letraSublinhado,

      usaBevel: false,
      larguraBevel: 0,
      corBevel: null,

      tamanhoBotao:
        botao.tamanhoBotao,

      favorito: false,
      visivel: true,

      abrirComentario:
        botao.abrirComentario,

      idGrupoComentario:
        botao.idGrupoComentario > 0
          ? botao.idGrupoComentario
          : null,

      fecharJanelaLink:
        botao.fechaJanelaLink,
    };
  }

  function selecionarProdutoGrupoLink(
    botaoGrupoLink: POSMobileGrupoLinkBotao,
  ) {
    const botao =
      converterBotaoGrupoLinkParaCatalogo(
        botaoGrupoLink,
      );

    if (
      botao.tipoBotao !==
        "PRODUTO" ||
      !botao.idProduto ||
      botao.idProduto <= 0
    ) {
      setMensagemErroOperacao(
        "O botão do Grupo Link não possui um produto válido.",
      );

      return;
    }

    /*
      Usa exatamente a mesma pipeline do catálogo principal:
        - programas;
        - preço;
        - comentários;
        - editor do pedido.
    */
    adicionarProduto(
      botao,
    );
  }


  function adicionarProduto(
    botao: POSMobileCatalogoBotao,
  ) {
    console.group(
      "========== CLIQUE NO BOTÃO DO CATÁLOGO ==========",
    );

    console.log(
      "Botão selecionado:",
      {
        idBotao:
          botao.idBotao,
        idProduto:
          botao.idProduto,
        descricao:
          botao.descricao,
        tipoBotao:
          botao.tipoBotao,
        tipoProduto:
          botao.tipoProduto,
        preco:
          botao.preco,
        precoEncontrado:
          botao.precoEncontrado,
        precoVariavel:
          botao.precoVariavel,
      },
    );

    console.groupEnd();
    if (
      botao.tipoBotao === "LINK"
    ) {
      if (
        !botao.idGrupoLink ||
        botao.idGrupoLink <= 0
      ) {
        setMensagemErroOperacao(
          `O link "${botao.descricao}" não possui um grupo de destino válido.`,
        );

        return;
      }

      setMensagemOperacao("");
      setMensagemErroOperacao("");

      setGrupoLinkAtivo({
        idGrupo:
          botao.idGrupoLink,

        descricaoOrigem:
          botao.descricao,

        fechaJanelaLink:
          botao.fecharJanelaLink,
      });

      return;
    }

    if (
      botao.tipoBotao !==
        "PRODUTO" ||
      !botao.idProduto
    ) {
      return;
    }

    setMensagemOperacao("");
    setMensagemErroOperacao("");

    const tipoProduto =
      botao.tipoProduto
        ?.trim()
        .toUpperCase() ?? "";

    if (tipoProduto === "PRG") {
      void prepararPrograma(
        botao,
      );

      return;
    }

    if (
      botao.precoVariavel ||
      !botao.precoEncontrado ||
      botao.preco <= 0
    ) {
      setBotaoPrecoEmEdicao(
        botao,
      );

      return;
    }

    prepararAdicaoProdutoResolvido(
      botao,
      botao.preco,
      false,
      null,
    );
  }

  function confirmarComentariosProduto(
    comentarios:
      POSMobileComentarioSelecionado[],
  ) {
    if (!produtoPendenteComentario) {
      return;
    }

    const produto =
      produtoPendenteComentario;

    setProdutoPendenteComentario(
      null,
    );

    adicionarProdutoResolvido(
      produto.botao,
      produto.preco,
      produto.precoAlterado,
      produto.justificacaoAlteracaoPreco,
      comentarios,
    );
  }

  function abrirComentariosLinhaSelecionada() {
    setMensagemOperacao("");
    setMensagemErroOperacao("");
    setMensagemErroComentariosLinha("");

    if (componenteProgramaSelecionado) {
      const {
        programa,
        componente,
      } = componenteProgramaSelecionado;

      if (
        programa.origem === "EXISTENTE" &&
        (
          !componente.idLinha ||
          componente.idLinha <= 0
        )
      ) {
        setMensagemErroOperacao(
          "O componente selecionado não possui um identificador válido.",
        );

        return;
      }

      setIdLinhaComentarioEmEdicao(
        componente.idLocal,
      );

      return;
    }

    if (!linhaSelecionada) {
      setMensagemErroOperacao(
        "Selecione primeiro um produto no editor do pedido.",
      );

      return;
    }

    if (
      linhaSelecionada.tipoItem ===
      "PROGRAMA"
    ) {
      setMensagemErroOperacao(
        "Selecione um dos componentes do programa para adicionar comentários.",
      );

      return;
    }

    if (
      linhaSelecionada.origem ===
        "EXISTENTE" &&
      (
        !linhaSelecionada.idLinha ||
        linhaSelecionada.idLinha <= 0
      )
    ) {
      setMensagemErroOperacao(
        "A linha selecionada não possui um identificador válido.",
      );

      return;
    }

    setIdLinhaComentarioEmEdicao(
      linhaSelecionada.idLocal,
    );
  }

  async function confirmarComentariosLinha(
    comentarios:
      POSMobileComentarioSelecionado[],
  ) {
    if (
      !idLinhaComentarioEmEdicao
    ) {
      return;
    }

    const comentariosNormalizadosComponente =
      comentarios.map(
        (comentario) => ({
          ...comentario,
          descricao:
            comentario.descricao.trim() ||
            comentario.texto.trim(),
          texto:
            comentario.texto.trim(),
        }),
      );

    if (componenteComentarioEmEdicao) {
      const {
        programa,
        componente,
      } = componenteComentarioEmEdicao;

      if (programa.origem === "NOVA") {
        setLinhasEditor(
          (linhasAtuais) =>
            linhasAtuais.map(
              (linha) => {
                if (
                  linha.tipoItem !== "PROGRAMA" ||
                  linha.idLocal !== programa.idLocal
                ) {
                  return linha;
                }

                return {
                  ...linha,
                  componentes:
                    linha.componentes.map(
                      (item) =>
                        item.idLocal === componente.idLocal
                          ? {
                              ...item,
                              comentarios:
                                comentariosNormalizadosComponente,
                            }
                          : item,
                    ),
                };
              },
            ),
        );

        setIdLinhaComentarioEmEdicao(null);
        setMensagemErroComentariosLinha("");
        setMensagemOperacao(
          comentariosNormalizadosComponente.length > 0
            ? `Comentários de "${componente.descricao}" atualizados no pedido.`
            : `Os comentários de "${componente.descricao}" foram removidos do pedido.`,
        );

        return;
      }

      if (aGravarComentariosLinha) {
        return;
      }

      if (
        !componente.idLinha ||
        componente.idLinha <= 0
      ) {
        setMensagemErroComentariosLinha(
          "O componente selecionado não possui um identificador válido.",
        );

        return;
      }

      const accessToken =
        sessionStorage.getItem(
          "posMobileAccessToken",
        );

      if (!accessToken) {
        router.replace("/login");
        return;
      }

      const {
        idMovimentoMesa,
        idInternoConta,
      } = obterIdentificacaoContaAtual();

      if (
        idMovimentoMesa <= 0 ||
        idInternoConta <= 0
      ) {
        setMensagemErroComentariosLinha(
          "Não foi possível identificar o movimento e a conta.",
        );

        return;
      }

      setAGravarComentariosLinha(true);
      setMensagemErroComentariosLinha("");

      try {
        const response =
          await fetch(
            "/api/pos-mobile/comentarios",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify({
                accessToken,
                idMovimentoMesa,
                idInternoConta,
                idLinha:
                  componente.idLinha,
                comentarios:
                  comentariosNormalizadosComponente,
              }),
            },
          );

        const resultado =
          (await response.json()) as
            POSMobileGravarComentariosLinhaContaResposta;

        if (response.status === 401) {
          sessionStorage.removeItem(
            "posMobileAccessToken",
          );

          router.replace("/login");
          return;
        }

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível gravar os comentários do componente.",
          );
        }

        const comentariosGravados =
          resultado.dados.comentarios.map(
            (comentario) => ({
              ...comentario,
              descricao:
                comentario.descricao.trim() ||
                comentario.texto.trim(),
              texto:
                comentario.texto.trim(),
            }),
          );

        setLinhasEditor(
          (linhasAtuais) =>
            linhasAtuais.map(
              (linha) => {
                if (
                  linha.tipoItem !== "PROGRAMA" ||
                  linha.idLocal !== programa.idLocal
                ) {
                  return linha;
                }

                return {
                  ...linha,
                  componentes:
                    linha.componentes.map(
                      (item) =>
                        item.idLocal === componente.idLocal
                          ? {
                              ...item,
                              comentarios:
                                comentariosGravados,
                            }
                          : item,
                    ),
                };
              },
            ),
        );

        setContaCarregada(
          (contaAtual) => {
            if (!contaAtual) {
              return contaAtual;
            }

            return {
              ...contaAtual,
              produtos:
                contaAtual.produtos.map(
                  (produto) =>
                    produto.idLinha ===
                    componente.idLinha
                      ? {
                          ...produto,
                          comentarios:
                            comentariosGravados,
                        }
                      : produto,
                ),
            };
          },
        );

        setIdLinhaComentarioEmEdicao(null);
        setMensagemErroComentariosLinha("");
        setMensagemOperacao(
          resultado.mensagem ||
            (
              comentariosGravados.length > 0
                ? `Comentários de "${componente.descricao}" gravados com sucesso.`
                : `Os comentários de "${componente.descricao}" foram removidos.`
            ),
        );
      } catch (error) {
        setMensagemErroComentariosLinha(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao gravar os comentários do componente.",
        );
      } finally {
        setAGravarComentariosLinha(false);
      }

      return;
    }

    const linhaEmEdicao =
      linhasEditor.find(
        (linha) =>
          linha.idLocal ===
          idLinhaComentarioEmEdicao,
      );

    if (!linhaEmEdicao) {
      setMensagemErroComentariosLinha(
        "A linha em edição deixou de estar disponível.",
      );

      return;
    }

    const comentariosNormalizados =
      comentarios.map(
        (comentario) => ({
          ...comentario,
          descricao:
            comentario.descricao.trim() ||
            comentario.texto.trim(),
          texto:
            comentario.texto.trim(),
        }),
      );

    if (
      linhaEmEdicao.origem ===
        "NOVA"
    ) {
      setLinhasEditor(
        (linhasAtuais) =>
          linhasAtuais.map(
            (linha) => {
              if (
                linha.idLocal !==
                linhaEmEdicao.idLocal
              ) {
                return linha;
              }

              return {
                ...linha,
                comentarios:
                  comentariosNormalizados,
              };
            },
          ),
      );

      setIdLinhaComentarioEmEdicao(
        null,
      );

      setMensagemErroComentariosLinha(
        "",
      );

      setMensagemOperacao(
        comentariosNormalizados.length > 0
          ? `Comentários de "${linhaEmEdicao.descricao}" atualizados no pedido.`
          : `Os comentários de "${linhaEmEdicao.descricao}" foram removidos do pedido.`,
      );

      return;
    }

    if (aGravarComentariosLinha) {
      return;
    }

    if (
      !linhaEmEdicao.idLinha ||
      linhaEmEdicao.idLinha <= 0
    ) {
      setMensagemErroComentariosLinha(
        "A linha selecionada não possui um identificador válido.",
      );

      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const {
      idMovimentoMesa,
      idInternoConta,
    } = obterIdentificacaoContaAtual();

    if (
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      setMensagemErroComentariosLinha(
        "Não foi possível identificar o movimento e a conta.",
      );

      return;
    }

    setAGravarComentariosLinha(
      true,
    );

    setMensagemErroComentariosLinha(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/pos-mobile/comentarios",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idMovimentoMesa,
              idInternoConta,
              idLinha:
                linhaEmEdicao.idLinha,
              comentarios:
                comentariosNormalizados,
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobileGravarComentariosLinhaContaResposta;

      if (response.status === 401) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível gravar os comentários da linha.",
        );
      }

      const comentariosGravados =
        resultado.dados.comentarios.map(
          (comentario) => ({
            ...comentario,
            descricao:
              comentario.descricao.trim() ||
              comentario.texto.trim(),
            texto:
              comentario.texto.trim(),
          }),
        );

      setLinhasEditor(
        (linhasAtuais) =>
          linhasAtuais.map(
            (linha) => {
              if (
                linha.idLocal !==
                linhaEmEdicao.idLocal
              ) {
                return linha;
              }

              return {
                ...linha,
                comentarios:
                  comentariosGravados,
              };
            },
          ),
      );

      setContaCarregada(
        (contaAtual) => {
          if (!contaAtual) {
            return contaAtual;
          }

          return {
            ...contaAtual,
            produtos:
              contaAtual.produtos.map(
                (produto) => {
                  if (
                    produto.idLinha !==
                    linhaEmEdicao.idLinha
                  ) {
                    return produto;
                  }

                  return {
                    ...produto,
                    comentarios:
                      comentariosGravados,
                  };
                },
              ),
          };
        },
      );

      setIdLinhaComentarioEmEdicao(
        null,
      );

      setMensagemErroComentariosLinha(
        "",
      );

      setMensagemOperacao(
        resultado.mensagem ||
          (
            comentariosGravados.length > 0
              ? `Comentários de "${linhaEmEdicao.descricao}" gravados com sucesso.`
              : `Os comentários de "${linhaEmEdicao.descricao}" foram removidos.`
          ),
      );
    } catch (error) {
      setMensagemErroComentariosLinha(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao gravar os comentários da linha.",
      );
    } finally {
      setAGravarComentariosLinha(
        false,
      );
    }
  }

  function fecharModalComentarios() {
    if (aGravarComentariosLinha) {
      return;
    }

    setProdutoPendenteComentario(
      null,
    );

    setIdLinhaComentarioEmEdicao(
      null,
    );

    setMensagemErroComentariosLinha(
      "",
    );
  }


  function abrirAlterarQuantidadeLinha() {
    setMensagemOperacao("");
    setMensagemErroOperacao("");
    setMensagemErroOperacaoLinha("");

    if (!linhaSelecionada) {
      setMensagemErroOperacao(
        "Selecione primeiro uma linha do pedido.",
      );

      return;
    }

    if (
      linhaSelecionada.origem ===
        "EXISTENTE" &&
      (
        !linhaSelecionada.idLinha ||
        linhaSelecionada.idLinha <= 0
      )
    ) {
      setMensagemErroOperacao(
        "A linha selecionada não possui um identificador válido.",
      );

      return;
    }

    setQuantidadeOperacaoLinha(
      String(
        linhaSelecionada.quantidade,
      ).replace(".", ","),
    );

    setOperacaoLinhaAberta(
      "QUANTIDADE",
    );
  }

  async function recarregarContaMantendoProdutosNovos(
    idMovimentoMesa: number,
    idInternoConta: number,
    idsLocaisGravados: string[] = [],
  ) {
    const idsGravados =
      new Set(
        idsLocaisGravados,
      );

    const response =
      await fetch(
        `/api/pos-mobile/conta-mesa?idMovimentoMesa=${idMovimentoMesa}&idInterno=${idInternoConta}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
          cache: "no-store",
        },
      );

    const resultado =
      (await response.json()) as
        POSMobileContaMesaResposta;

    console.group(
      "========== RECARGA DA CONTA APÓS PROGRAMA ==========",
    );

    console.log(
      "HTTP status:",
      response.status,
    );

    console.log(
      "Resposta completa da conta:",
      resultado,
    );

    console.log(
      "Conta:",
      resultado.dados,
    );

    console.log(
      "Produtos devolvidos pela conta:",
      resultado.dados?.produtos,
    );

    console.log(
      "Quantidade de produtos:",
      resultado.dados?.produtos?.length ??
        0,
    );

    console.table(
      (resultado.dados?.produtos ?? []).map(
        (produto, indice) => ({
          indice,
          idLinha:
            produto.idLinha,
          idLinhaPai:
            produto.idLinhaPai,
          tipoLinha:
            produto.tipoLinha,
          idProduto:
            produto.idProduto,
          idProdutoPrograma:
            produto.idProdutoPrograma,
          descricao:
            produto.descricao,
          quantidade:
            produto.quantidade,
          precoUnitario:
            produto.precoUnitario,
          valorTotal:
            produto.valorTotal,
          idGrupoPreparacao:
            produto.idGrupoPreparacao,
          anulado:
            produto.anulado,
        }),
      ),
    );

    console.groupEnd();

    if (
      !response.ok ||
      !resultado.sucesso ||
      !resultado.dados
    ) {
      throw new Error(
        resultado.mensagem ||
          "Não foi possível atualizar os dados da conta.",
      );
    }

    console.log(
      "A converter produtos da conta para o editor.",
    );

    const linhasExistentes =
      converterProdutosContaParaEditor(
        resultado.dados.produtos,
      );

    console.log(
      "Linhas existentes convertidas:",
      linhasExistentes,
    );

    setContaCarregada(
      resultado.dados,
    );

    setLinhasEditor(
      (linhasAtuais) => [
        ...linhasExistentes,

        ...linhasAtuais.filter(
          (linha) =>
            linha.origem ===
              "NOVA" &&
            !idsGravados.has(
              linha.idLocal,
            ),
        ),
      ],
    );
  }

  async function confirmarAlteracaoQuantidadeLinha(
    atualizarLinhasPrograma?: boolean,
  ) {
    if (
      !linhaSelecionada ||
      operacaoLinhaAberta !==
        "QUANTIDADE"
    ) {
      return;
    }

    const quantidade =
      Number(
        quantidadeOperacaoLinha
          .trim()
          .replace(",", "."),
      );

    if (
      !Number.isFinite(
        quantidade,
      ) ||
      quantidade <= 0
    ) {
      setMensagemErroOperacaoLinha(
        "Indique uma quantidade superior a zero.",
      );

      return;
    }

    if (
      linhaSelecionada.tipoItem ===
        "PROGRAMA" &&
      atualizarLinhasPrograma ===
        undefined
    ) {
      setMostrarConfirmacaoLinhasPrograma(
        true,
      );

      return;
    }

    if (
      linhaSelecionada.origem ===
        "NOVA"
    ) {
      setLinhasEditor(
        (itensAtuais) =>
          itensAtuais.map(
            (item) => {
              if (
                item.idLocal !==
                linhaSelecionada.idLocal
              ) {
                return item;
              }

              if (
                item.tipoItem ===
                "PROGRAMA"
              ) {
                return {
                  ...item,
                  quantidade,
                  valorTotal:
                    item.preco *
                    quantidade,

                  componentes:
                    atualizarLinhasPrograma
                      ? item.componentes.map(
                          (componente) => {
                            /*
                              Regra correta:
                                nova quantidade da linha =
                                  quantidade atual da linha
                                  / quantidade atual do menu
                                  * nova quantidade do menu.

                              Exemplo:
                                menu atual = 1
                                linha atual = 2
                                novo menu = 3
                                nova linha = 2 / 1 * 3 = 6

                              Desta forma não dependemos de quantidadeBase,
                              que pode não representar a seleção efetiva
                              efetuada num programa parcial.
                            */
                            const quantidadeLinha =
                              item.quantidade > 0
                                ? (
                                    componente.quantidade /
                                    item.quantidade
                                  ) *
                                  quantidade
                                : componente.quantidade;

                            return {
                              ...componente,

                              quantidade:
                                quantidadeLinha,

                              valorTotal:
                                componente.valorUnitario *
                                quantidadeLinha,
                            };
                          },
                        )
                      : item.componentes,
                };
              }

              return {
                ...item,
                quantidade,
                valorTotal:
                  item.preco *
                  quantidade,
              };
            },
          ),
      );

      setMostrarConfirmacaoLinhasPrograma(
        false,
      );

      setOperacaoLinhaAberta(
        null,
      );

      setMensagemErroOperacaoLinha(
        "",
      );

      setMensagemOperacao(
        `Quantidade de "${linhaSelecionada.descricao}" alterada para ${quantidade}.`,
      );

      return;
    }

    if (aAlterarQuantidadeLinha) {
      return;
    }

    if (
      !linhaSelecionada.idLinha ||
      linhaSelecionada.idLinha <= 0
    ) {
      setMensagemErroOperacaoLinha(
        "A linha selecionada não possui um identificador válido.",
      );

      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const {
      idMovimentoMesa,
      idInternoConta,
    } = obterIdentificacaoContaAtual();

    if (
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      setMensagemErroOperacaoLinha(
        "Não foi possível identificar o movimento e a conta.",
      );

      return;
    }

    setAAlterarQuantidadeLinha(
      true,
    );

    setMensagemErroOperacaoLinha(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/pos-mobile/alterar-quantidade-linha-conta",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idMovimentoMesa,
              idInternoConta,
              idLinha:
                linhaSelecionada.idLinha,
              quantidade,

              atualizarLinhasPrograma:
                linhaSelecionada.tipoItem ===
                  "PROGRAMA"
                  ? Boolean(
                      atualizarLinhasPrograma,
                    )
                  : false,
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobileAlterarQuantidadeLinhaResposta;

      if (response.status === 401) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível alterar a quantidade da linha.",
        );
      }

      const dadosQuantidade =
        resultado.dados;

      setLinhasEditor(
        (linhasAtuais) =>
          linhasAtuais.map(
            (linha) => {
              if (
                linha.idLocal !==
                linhaSelecionada.idLocal
              ) {
                return linha;
              }

              return {
                ...linha,
                quantidade:
                  dadosQuantidade.quantidadeAtual,
                preco:
                  dadosQuantidade.precoUnitario,
                valorTotal:
                  dadosQuantidade.valorTotalLinha,
              };
            },
          ),
      );

      setContaCarregada(
        (contaAtual) => {
          if (!contaAtual) {
            return contaAtual;
          }

          return {
            ...contaAtual,
            valorTotal:
              dadosQuantidade.valorTotalConta,
            produtos:
              contaAtual.produtos.map(
                (produto) => {
                  if (
                    produto.idLinha !==
                    dadosQuantidade.idLinha
                  ) {
                    return produto;
                  }

                  return {
                    ...produto,
                    quantidade:
                      dadosQuantidade.quantidadeAtual,
                    precoUnitario:
                      dadosQuantidade.precoUnitario,
                    valorTotal:
                      dadosQuantidade.valorTotalLinha,
                  };
                },
              ),
          };
        },
      );

      if (
        dadosQuantidade
          .linhasProgramaAtualizadas >
        0
      ) {
        await recarregarContaMantendoProdutosNovos(
          idMovimentoMesa,
          idInternoConta,
        );
      }

      setQuantidadeOperacaoLinha(
        String(
          dadosQuantidade.quantidadeAtual,
        ).replace(".", ","),
      );

      setMostrarConfirmacaoLinhasPrograma(
        false,
      );

      setOperacaoLinhaAberta(
        null,
      );

      setMensagemErroOperacaoLinha(
        "",
      );

      setMensagemOperacao(
        resultado.mensagem ||
          `Quantidade de "${linhaSelecionada.descricao}" alterada para ${dadosQuantidade.quantidadeAtual}.`,
      );
    } catch (error) {
      setMensagemErroOperacaoLinha(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao alterar a quantidade da linha.",
      );
    } finally {
      setAAlterarQuantidadeLinha(
        false,
      );
    }
  }


  function limparEstadoAnulacaoLinha() {
    setDadosPreparacaoAnulacao(
      null,
    );

    setAPrepararAnulacao(
      false,
    );

    setAAnularLinha(
      false,
    );

    setIdMotivoAnulacao(
      "",
    );

    setJustificacaoAnulacao(
      "",
    );
  }

  function fecharOperacaoLinha() {
    if (
      aAnularLinha ||
      aAlterarQuantidadeLinha
    ) {
      return;
    }

    setOperacaoLinhaAberta(
      null,
    );

    setMensagemErroOperacaoLinha(
      "",
    );

    limparEstadoAnulacaoLinha();
  }

  async function abrirAnularLinha() {
    setMensagemOperacao("");
    setMensagemErroOperacao("");
    setMensagemErroOperacaoLinha("");
    limparEstadoAnulacaoLinha();

    if (!linhaSelecionada) {
      setMensagemErroOperacao(
        "Selecione primeiro uma linha do pedido.",
      );

      return;
    }

    setOperacaoLinhaAberta(
      "ANULAR",
    );

    if (
      linhaSelecionada.origem ===
      "NOVA"
    ) {
      return;
    }

    if (
      !linhaSelecionada.idLinha ||
      linhaSelecionada.idLinha <= 0
    ) {
      setMensagemErroOperacaoLinha(
        "A linha selecionada não possui um identificador válido.",
      );

      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const {
      idMovimentoMesa,
      idInternoConta,
    } = obterIdentificacaoContaAtual();

    if (
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      setMensagemErroOperacaoLinha(
        "Não foi possível identificar o movimento e a conta.",
      );

      return;
    }

    setAPrepararAnulacao(
      true,
    );

    try {
      const response =
        await fetch(
          "/api/pos-mobile/preparar-anulacao-linha",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idMovimentoMesa,
              idInternoConta,
              idLinha:
                linhaSelecionada.idLinha,
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobilePrepararAnulacaoLinhaResposta;

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível preparar a anulação da linha.",
        );
      }

      setDadosPreparacaoAnulacao(
        resultado.dados,
      );

      if (
        resultado.dados.exigeMotivo &&
        resultado.dados.motivos.length ===
          1
      ) {
        setIdMotivoAnulacao(
          String(
            resultado.dados.motivos[0]
              .idMotivo,
          ),
        );
      }

      if (
        !resultado.dados.podeAnular
      ) {
        setMensagemErroOperacaoLinha(
          resultado.dados.mensagemRegra ||
            "A linha não pode ser anulada.",
        );
      }
    } catch (error) {
      setDadosPreparacaoAnulacao(
        null,
      );

      setMensagemErroOperacaoLinha(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao preparar a anulação.",
      );
    } finally {
      setAPrepararAnulacao(
        false,
      );
    }
  }

  async function confirmarAnulacaoLinha() {
    if (
      !linhaSelecionada ||
      operacaoLinhaAberta !==
        "ANULAR"
    ) {
      return;
    }

    if (
      linhaSelecionada.origem ===
      "NOVA"
    ) {
      const descricao =
        linhaSelecionada.descricao;

      removerLinha(
        linhaSelecionada.idLocal,
      );

      fecharOperacaoLinha();

      setMensagemOperacao(
        `A linha "${descricao}" foi removida do pedido ainda não gravado.`,
      );

      return;
    }

    if (
      aPrepararAnulacao ||
      aAnularLinha
    ) {
      return;
    }

    if (
      !dadosPreparacaoAnulacao
    ) {
      setMensagemErroOperacaoLinha(
        "As regras da anulação ainda não foram carregadas.",
      );

      return;
    }

    if (
      !dadosPreparacaoAnulacao.podeAnular
    ) {
      setMensagemErroOperacaoLinha(
        dadosPreparacaoAnulacao.mensagemRegra ||
          "A linha não pode ser anulada.",
      );

      return;
    }

    const idMotivo =
      Number(
        idMotivoAnulacao || "0",
      );

    if (
      dadosPreparacaoAnulacao.exigeMotivo &&
      (
        !Number.isInteger(idMotivo) ||
        idMotivo <= 0
      )
    ) {
      setMensagemErroOperacaoLinha(
        "Selecione o motivo da anulação.",
      );

      return;
    }

    if (
      idMotivo > 0 &&
      !motivoAnulacaoSelecionado
    ) {
      setMensagemErroOperacaoLinha(
        "O motivo de anulação selecionado não é válido.",
      );

      return;
    }

    if (
      motivoAnulacaoSelecionado
        ?.obrigaJustificacao &&
      justificacaoAnulacao.trim() ===
        ""
    ) {
      setMensagemErroOperacaoLinha(
        "O motivo selecionado obriga a indicar uma justificação.",
      );

      return;
    }

    if (
      !linhaSelecionada.idLinha ||
      linhaSelecionada.idLinha <= 0
    ) {
      setMensagemErroOperacaoLinha(
        "A linha selecionada não possui um identificador válido.",
      );

      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const {
      idMovimentoMesa,
      idInternoConta,
    } = obterIdentificacaoContaAtual();

    if (
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      setMensagemErroOperacaoLinha(
        "Não foi possível identificar o movimento e a conta.",
      );

      return;
    }

    setAAnularLinha(
      true,
    );

    setMensagemErroOperacaoLinha(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/pos-mobile/anular-linha-conta",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idMovimentoMesa,
              idInternoConta,
              idLinha:
                linhaSelecionada.idLinha,
              idMotivoAnulacao:
                Number.isInteger(idMotivo) &&
                idMotivo > 0
                  ? idMotivo
                  : 0,
              justificacao:
                justificacaoAnulacao.trim(),
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobileAnularLinhaResposta;

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados ||
        !resultado.dados.anulada
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível anular a linha.",
        );
      }

      const dadosAnulacao =
        resultado.dados;

      const idsLinhasAnuladas =
        dadosAnulacao.idLinhasAnuladas.length >
        0
          ? dadosAnulacao.idLinhasAnuladas
          : [
              linhaSelecionada.idLinha,
            ];

      const idsAnulados =
        new Set(
          idsLinhasAnuladas,
        );

      setLinhasEditor(
        (linhasAtuais) =>
          linhasAtuais.filter(
            (linha) =>
              !linha.idLinha ||
              !idsAnulados.has(
                linha.idLinha,
              ),
          ),
      );

      setContaCarregada(
        (contaAtual) => {
          if (!contaAtual) {
            return contaAtual;
          }

          return {
            ...contaAtual,
            valorTotal:
              dadosAnulacao.valorTotalConta,
            produtos:
              contaAtual.produtos.filter(
                (produto) =>
                  !produto.idLinha ||
                  !idsAnulados.has(
                    produto.idLinha,
                  ),
              ),
          };
        },
      );

      setIdLinhaSelecionada(
        null,
      );

      setOperacaoLinhaAberta(
        null,
      );

      limparEstadoAnulacaoLinha();

      const avisos: string[] = [];

      if (
        dadosAnulacao
          .impressaoAnulacaoNecessaria &&
        !dadosAnulacao
          .impressaoAnulacaoEfetuada
      ) {
        avisos.push(
          dadosAnulacao.mensagemImpressao ||
            "A anulação não foi impressa na cozinha.",
        );
      }

      if (
        !dadosAnulacao
          .aprovisionamentoAtualizado &&
        dadosAnulacao
          .mensagemAprovisionamento
      ) {
        avisos.push(
          dadosAnulacao.mensagemAprovisionamento,
        );
      }

      setMensagemOperacao(
        avisos.length > 0
          ? `${resultado.mensagem} ${avisos.join(" ")}`
          : resultado.mensagem ||
              `A linha "${linhaSelecionada.descricao}" foi anulada.`,
      );
    } catch (error) {
      setMensagemErroOperacaoLinha(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao anular a linha.",
      );
    } finally {
      setAAnularLinha(
        false,
      );
    }
  }


  function fecharAlterarNumeroClientes() {
    if (aAlterarNumeroClientes) {
      return;
    }

    setMostrarAlterarClientes(
      false,
    );

    setMensagemErroClientes(
      "",
    );
  }

  function abrirAlterarNumeroClientes() {
    setMensagemOperacao("");
    setMensagemErroOperacao("");
    setMensagemErroClientes("");

    setNumeroClientesIntroduzido(
      String(
        contaCarregada?.numeroPessoas ??
          dadosMesa?.numeroPessoas ??
          1,
      ),
    );

    setMostrarAlterarClientes(
      true,
    );
  }

  function atualizarContaSelecionadaNaSessao(
    numeroPessoas: number,
  ) {
    const chave =
      "posMobileContaSelecionada";

    const valorAtual =
      sessionStorage.getItem(
        chave,
      );

    if (!valorAtual) {
      return;
    }

    try {
      const contaSelecionada =
        JSON.parse(
          valorAtual,
        ) as Record<
          string,
          unknown
        >;

      sessionStorage.setItem(
        chave,
        JSON.stringify({
          ...contaSelecionada,
          numeroPessoas,
        }),
      );
    } catch (error) {
      console.warn(
        "Não foi possível atualizar a conta selecionada na sessão:",
        error,
      );
    }
  }

  async function confirmarAlteracaoNumeroClientes() {
    const numeroClientes =
      Number(
        numeroClientesIntroduzido
          .trim(),
      );

    if (
      !Number.isInteger(
        numeroClientes,
      ) ||
      numeroClientes <= 0
    ) {
      setMensagemErroClientes(
        "Indique um número inteiro superior a zero.",
      );

      return;
    }

    if (
      modoEditor !== "CONTA" ||
      !contaCarregada
    ) {
      setDadosMesa(
        (dadosAtuais) => {
          if (!dadosAtuais) {
            return dadosAtuais;
          }

          return {
            ...dadosAtuais,
            numeroPessoas:
              numeroClientes,
          };
        },
      );

      setMostrarAlterarClientes(
        false,
      );

      setMensagemOperacao(
        `Número de clientes alterado para ${numeroClientes}. A alteração será gravada com a nova conta.`,
      );

      return;
    }

    if (aAlterarNumeroClientes) {
      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    const {
      idMovimentoMesa,
      idInternoConta,
    } = obterIdentificacaoContaAtual();

    if (
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      setMensagemErroClientes(
        "Não foi possível identificar o movimento e a conta.",
      );

      return;
    }

    setAAlterarNumeroClientes(
      true,
    );

    setMensagemErroClientes(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/pos-mobile/alterar-numero-clientes-conta",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idMovimentoMesa,
              idInternoConta,
              numeroPessoas:
                numeroClientes,
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobileAlterarNumeroClientesResposta;

      if (response.status === 401) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível alterar o número de clientes.",
        );
      }

      const numeroAtual =
        resultado.dados
          .numeroPessoasAtual;

      setContaCarregada(
        (contaAtual) => {
          if (!contaAtual) {
            return contaAtual;
          }

          return {
            ...contaAtual,
            numeroPessoas:
              numeroAtual,
          };
        },
      );

      setDadosMesa(
        (dadosAtuais) => {
          if (!dadosAtuais) {
            return dadosAtuais;
          }

          return {
            ...dadosAtuais,
            numeroPessoas:
              numeroAtual,
          };
        },
      );

      atualizarContaSelecionadaNaSessao(
        numeroAtual,
      );

      setNumeroClientesIntroduzido(
        String(
          numeroAtual,
        ),
      );

      setMostrarAlterarClientes(
        false,
      );

      setMensagemOperacao(
        resultado.mensagem ||
          `Número de clientes alterado para ${numeroAtual}.`,
      );
    } catch (error) {
      setMensagemErroClientes(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao alterar o número de clientes.",
      );
    } finally {
      setAAlterarNumeroClientes(
        false,
      );
    }
  }


  function abrirSegueManual() {
    setMensagemOperacao("");
    setMensagemErroOperacao("");

    if (
      temAlteracoesPendentes
    ) {
      setMensagemErroOperacao(
        "Grave primeiro os produtos novos antes de abrir o segue.",
      );

      return;
    }

    const {
      idMovimentoMesa,
      idInternoConta,
    } = obterIdentificacaoContaAtual();

    if (
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      setMensagemErroOperacao(
        "Não foi possível identificar o movimento e a conta.",
      );

      return;
    }

    /*
      O Segue manual só existe quando estamos numa conta já carregada.

      Ao fechar ou concluir o Segue regressamos às Mesas, por isso
      existe sempre uma ação de saída associada.

      Se já foi gerada uma Consulta de Mesa mantemos essa indicação
      apenas para preservar o contexto do fluxo.
    */
    setAcaoAposSegue(
      idConsultaMesaGerada &&
      idConsultaMesaGerada > 0
        ? "CONSULTA_MESA"
        : "SAIR",
    );

    setContaSeguePendente({
      idMovimentoMesa,
      idInternoConta,
    });

    setMostrarSegue(
      true,
    );
  }

function alterarQuantidade(
  idLocal: string,
  alteracao: number,
) {
  setLinhasEditor(
    (linhasAtuais) => {
      const linhaAtual =
        linhasAtuais.find(
          (linha) =>
            linha.idLocal ===
            idLocal,
        );

      if (
        !linhaAtual ||
        linhaAtual.origem ===
          "EXISTENTE"
      ) {
        return linhasAtuais;
      }

      const quantidadeAnteriorMenu =
        linhaAtual.quantidade;

      const novaQuantidadeMenu =
        quantidadeAnteriorMenu +
        alteracao;

      if (
        novaQuantidadeMenu <= 0
      ) {
        if (
          idLinhaSelecionada ===
          idLocal
        ) {
          setIdLinhaSelecionada(
            null,
          );

          setIdComponenteProgramaSelecionado(
            null,
          );
        }

        return linhasAtuais.filter(
          (linha) =>
            linha.idLocal !==
            idLocal,
        );
      }

      return linhasAtuais.map(
        (linha) => {
          if (
            linha.idLocal !==
              idLocal ||
            linha.origem ===
              "EXISTENTE"
          ) {
            return linha;
          }

          if (
            linha.tipoItem ===
            "PROGRAMA"
          ) {
            return {
              ...linha,

              quantidade:
                novaQuantidadeMenu,

              valorTotal:
                linha.preco *
                novaQuantidadeMenu,

              componentes:
                linha.componentes.map(
                  (componente) => {
                    /*
                      Regra do menu:

                        nova quantidade da linha =
                          quantidade atual da linha
                          / quantidade atual do menu
                          * nova quantidade do menu

                      Exemplo:
                        menu 1 -> linha 2
                        menu 2 -> linha 4
                        menu 3 -> linha 6
                    */
                    const quantidadeLinha =
                      quantidadeAnteriorMenu > 0
                        ? (
                            componente.quantidade /
                            quantidadeAnteriorMenu
                          ) *
                          novaQuantidadeMenu
                        : componente.quantidade;

                    return {
                      ...componente,

                      quantidade:
                        quantidadeLinha,

                      valorTotal:
                        componente.valorUnitario *
                        quantidadeLinha,
                    };
                  },
                ),
            };
          }

          return {
            ...linha,

            quantidade:
              novaQuantidadeMenu,

            valorTotal:
              linha.preco *
              novaQuantidadeMenu,
          };
        },
      );
    },
  );
}

  function removerLinha(
    idLocal: string,
  ) {
    setLinhasEditor(
      (linhasAtuais) =>
        linhasAtuais.filter(
          (linha) =>
            linha.idLocal !==
              idLocal ||
            linha.origem ===
              "EXISTENTE",
        ),
    );

    if (
      idLinhaSelecionada ===
      idLocal
    ) {
      setIdLinhaSelecionada(
        null,
      );
    }
  }

  function limparProdutosNovos() {
    setLinhasEditor(
      (linhasAtuais) =>
        linhasAtuais.filter(
          (linha) =>
            linha.origem ===
            "EXISTENTE",
        ),
    );

    if (
      linhaSelecionada?.origem ===
      "NOVA"
    ) {
      setIdLinhaSelecionada(
        null,
      );
    }
  }

  function deveAbrirSegueAoSair(): boolean {
    return Boolean(
      contextoPosto?.segue
        .pedidosCozinhaSegue &&
      contextoPosto?.segue
        .abreFormSegueClicarMesas
    );
  }

  /*
    Consulta o mesmo endpoint usado pelo SeguePedidoModal para saber se
    existem efetivamente linhas pendentes de envio.

    Assim evitamos abrir um Segue vazio e, sobretudo, evitamos ficar
    presos num ciclo ao tentar sair de uma conta que já não tem linhas
    por enviar.
  */
  async function existemLinhasPendentesSegue(
    idMovimentoMesa: number,
    idInternoConta: number,
  ): Promise<boolean> {
    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      throw new Error(
        "A sessão do operador não está disponível.",
      );
    }

    const response =
      await fetch(
        "/api/pos-mobile/dados-segue-conta",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            accessToken,
            idMovimentoMesa,
            idInternoConta,
          }),
        },
      );

    const resultado =
      (await response.json()) as
        POSMobileDadosSegueContaResposta;

    if (response.status === 401) {
      sessionStorage.removeItem(
        "posMobileAccessToken",
      );

      router.replace("/login");

      throw new Error(
        "A sessão do operador expirou.",
      );
    }

    if (
      !response.ok ||
      !resultado.sucesso ||
      !resultado.dados
    ) {
      throw new Error(
        resultado.mensagem ||
          "Não foi possível validar os pedidos pendentes da cozinha.",
      );
    }

    return resultado.dados.linhas.some(
      (linha) =>
        !linha.bloqueado &&
        !linha.anulado &&
        !linha.segue,
    );
  }

  /*
    Devolve true quando o fluxo de saída deve ficar interrompido:
      - porque o Segue foi aberto; ou
      - porque não foi possível validar as linhas pendentes.

    Devolve false quando não existe Segue a apresentar e o chamador
    pode continuar para a libertação da mesa.
  */
  async function abrirSegueAntesDeSair(
    idMovimentoMesa: number,
    idInternoConta: number,
    acao: Exclude<AcaoAposSegue, null> =
      "SAIR",
  ): Promise<boolean> {
    if (
      !deveAbrirSegueAoSair() ||
      idMovimentoMesa <= 0 ||
      idInternoConta <= 0
    ) {
      return false;
    }

    try {
      const temLinhasPendentes =
        await existemLinhasPendentesSegue(
          idMovimentoMesa,
          idInternoConta,
        );

      if (!temLinhasPendentes) {
        return false;
      }

      setAcaoAposSegue(
        acao,
      );

      setContaSeguePendente({
        idMovimentoMesa,
        idInternoConta,
      });

      setMostrarSegue(true);

      return true;
    } catch (error) {
      setMensagemErroOperacao(
        error instanceof Error
          ? error.message
          : "Não foi possível validar o envio para a cozinha.",
      );

      /*
        Bloqueamos a saída. Se não sabemos se existem linhas pendentes,
        não devemos libertar a mesa silenciosamente.
      */
      return true;
    }
  }

  function obterIdentificacaoContaAtual(): {
    idMovimentoMesa: number;
    idInternoConta: number;
  } {
    return {
      idMovimentoMesa:
        contaCarregada?.idMovimentoMesa ??
        obterIdNumerico(
          searchParams.get(
            "idMovimentoMesa",
          ),
        ),
      idInternoConta:
        contaCarregada?.idInterno ??
        obterIdNumerico(
          searchParams.get(
            "idInterno",
          ),
        ),
    };
  }

  /*
    ==========================================================================
    CONSULTA DE MESA - ABRIR CONFIRMAÇÃO
    ==========================================================================

    O botão pode ser usado tanto em ABERTURA como numa CONTA já existente.

    Se a mesa ainda não estiver persistida, ou se existirem produtos novos,
    a própria operação vai primeiro gravar/atualizar a conta e só depois
    gerar a Consulta de Mesa.
    ==========================================================================
  */
  function abrirConfirmacaoConsultaMesa() {
    setMensagemOperacao("");
    setMensagemErroOperacao("");

    if (
      aGerarConsultaMesa ||
      aEnviar ||
      aPrepararPagamento ||
      aEfetuarPagamento ||
      mostrarPagamentos
    ) {
      return;
    }

    if (
      idConsultaMesaGerada &&
      idConsultaMesaGerada > 0
    ) {
      setMensagemErroOperacao(
        `A Consulta de Mesa ${idConsultaMesaGerada} já foi gerada. Conclua o envio para a cozinha e a saída da mesa antes de iniciar outra consulta.`,
      );

      return;
    }

    if (linhasEditor.length === 0) {
      setMensagemErroOperacao(
        "Adicione pelo menos um produto antes de gerar a Consulta de Mesa.",
      );

      return;
    }

    if (temPrecosPendentes) {
      setMensagemErroOperacao(
        "Existem produtos sem preço válido. Resolva os preços antes de gerar a Consulta de Mesa.",
      );

      return;
    }

    if (
      modoEditor === "CONTA" &&
      !contaCarregada
    ) {
      setMensagemErroOperacao(
        "Não foi possível identificar a conta atual.",
      );

      return;
    }

    setMostrarConfirmacaoConsultaMesa(
      true,
    );
  }

  /*
    ==========================================================================
    CONSULTA DE MESA - GERAR
    ==========================================================================

    Ordem funcional:

      1. Se necessário, abrir/gravar a conta e os produtos novos;
      2. gerar a Consulta de Mesa;
      3. solicitar a impressão numa operação independente, sem await;
      4. verificar se existem linhas pendentes para a cozinha;
      5. se a configuração exigir Segue, abrir o Segue;
      6. depois do envio concluído (ou se não houver linhas), libertar a mesa.

    A partir do momento em que a APIFNT confirma a Consulta de Mesa,
    nunca repetimos automaticamente a emissão, mesmo que uma fase posterior
    falhe.
    ==========================================================================
  */
  async function gerarConsultaMesa() {
    if (
      aGerarConsultaMesa ||
      idConsultaMesaGerada !== null
    ) {
      return;
    }

    setMensagemOperacao("");
    setMensagemErroOperacao("");

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setAGerarConsultaMesa(
      true,
    );

    try {
      let identificacao:
        ContaPersistidaResultado |
        null = null;

      /*
        Quando a conta ainda não existe ou possui produtos novos,
        gravamos primeiro sem sair e sem abrir o Segue.
      */
      if (
        modoEditor !== "CONTA" ||
        !contaCarregada ||
        temAlteracoesPendentes
      ) {
identificacao =
  (
    await gravarProdutosPendentes(
      false,
    )
  ) ?? null;
        if (!identificacao) {
          return;
        }
      } else {
        const contaAtual =
          obterIdentificacaoContaAtual();

        if (
          contaAtual.idMovimentoMesa <= 0 ||
          contaAtual.idInternoConta <= 0
        ) {
          throw new Error(
            "Não foi possível identificar o movimento e a conta.",
          );
        }

        identificacao =
          contaAtual;
      }

      const response =
        await fetch(
          "/api/pos-mobile/gerar-consulta-mesa",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idMovimentoMesa:
                identificacao.idMovimentoMesa,
              idInternoConta:
                identificacao.idInternoConta,
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobileConsultaMesaResposta;

      if (response.status === 401) {
        sessionStorage.removeItem(
          "posMobileAccessToken",
        );

        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        if (
          resultado.codigo ===
            "SESSAO_INVALIDA" ||
          resultado.codigo ===
            "SESSAO_SEM_POSTO" ||
          resultado.codigo ===
            "SESSAO_SEM_UTILIZADOR"
        ) {
          sessionStorage.removeItem(
            "posMobileAccessToken",
          );

          router.replace("/login");
          return;
        }

        throw new Error(
          resultado.mensagem ||
            "Não foi possível gerar a Consulta de Mesa.",
        );
      }

      /*
        A Consulta já existe neste ponto. Este ID protege contra
        uma segunda emissão acidental se a cozinha/saída falhar.
      */
      setIdConsultaMesaGerada(
        resultado.dados.idConsMovimento,
      );

      setMostrarConfirmacaoConsultaMesa(
        false,
      );

      /*
        A Consulta já está persistida.

        A impressão é deliberadamente disparada sem await:
        o spooler/impressora nunca volta a prender este fluxo.
      */
      solicitarImpressaoConsultaMesa(
        accessToken,
        identificacao.idMovimentoMesa,
        identificacao.idInternoConta,
        resultado.dados.idConsMovimento,
      );

      setMensagemOperacao(
        `${resultado.mensagem} Documento ${resultado.dados.idConsMovimento}.`,
      );

      const segueAberto =
        await abrirSegueAntesDeSair(
          identificacao.idMovimentoMesa,
          identificacao.idInternoConta,
          "CONSULTA_MESA",
        );

      if (segueAberto) {
        return;
      }

      /*
        Não existem linhas de Segue pendentes (ou a configuração não
        exige a janela). Podemos libertar a mesa sem voltar a emitir
        a Consulta de Mesa.
      */
      await concluirSaidaEditor();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao gerar a Consulta de Mesa.";

      setMensagemErroOperacao(
        mensagem,
      );

      console.error(
        "Erro ao gerar Consulta de Mesa:",
        error,
      );
    } finally {
      setAGerarConsultaMesa(
        false,
      );
    }
  }

  async function sairMesa(): Promise<boolean> {
    if (!dadosMesa) {
      setMensagemErroOperacao(
        "Não foi possível identificar os dados da mesa.",
      );
      return false;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      router.replace("/login");
      return false;
    }

    setASairMesa(true);

    try {
      const response =
        await fetch(
          "/api/pos-mobile/sair-mesa",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idPosto:
                dadosMesa.idPosto,
              idSala:
                dadosMesa.idSala,
              idPagina:
                dadosMesa.idPagina,
              idMesa:
                dadosMesa.idMesa,
            }),
          },
        );

      const resultado =
        (await response.json()) as POSMobileUsoMesaResposta;

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados ||
        resultado.dados.emUso
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível libertar a utilização da mesa.",
        );
      }

      return true;
    } catch (error) {
      setMensagemErroOperacao(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao libertar a mesa.",
      );

      return false;
    } finally {
      setASairMesa(false);
    }
  }


  /*
    ==========================================================================
    GRAVAR PRODUTOS PENDENTES
    ==========================================================================

    Esta função grava produtos/programas na conta.

      finalizarFluxo = False
        -> grava e permanece no editor.
           É usado, por exemplo, pela Consulta de Mesa antes de gerar
           o respetivo documento.

      finalizarFluxo = True
        -> fluxo normal de "Abrir mesa" / "Enviar novos":
           depois de gravar, abre o Segue quando configurado e existirem
           linhas pendentes; ao terminar o Segue regressa às Mesas.

    A saída explícita pelo botão "Mesas" não depende do Segue.
    ==========================================================================
  */
  async function gravarProdutosPendentes(
    finalizarFluxo = true,
  ): Promise<
    ContaPersistidaResultado |
    undefined
  > {
    console.group(
      "========== INÍCIO DO ENVIO DO PEDIDO ==========",
    );

    console.log(
      "Estado atual do editor:",
      linhasEditor,
    );

    console.log(
      "Conta carregada:",
      contaCarregada,
    );

    console.log(
      "Dados da mesa:",
      dadosMesa,
    );

    setMensagemOperacao("");
    setMensagemErroOperacao("");

    if (!dadosMesa) {
      setMensagemErroOperacao(
        "Não foi possível identificar os dados da mesa.",
      );
      return;
    }

    const token =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    const itensNovos =
      linhasEditor.filter(
        (item) =>
          item.origem === "NOVA",
      );

    if (itensNovos.length === 0) {
      setMensagemErroOperacao(
        "Não existem produtos ou programas novos para enviar.",
      );
      return;
    }

    const produtosNovos =
      itensNovos.filter(
        (item): item is ProdutoPedidoEditor =>
          item.tipoItem === "PRODUTO",
      );

    const programasNovos =
      itensNovos.filter(
        (item): item is ProgramaPedidoEditor =>
          item.tipoItem === "PROGRAMA",
      );

    console.log(
      "Itens novos:",
      itensNovos,
    );

    console.log(
      "Produtos normais novos:",
      produtosNovos,
    );

    console.log(
      "Programas novos:",
      programasNovos,
    );

    console.table(
      itensNovos.map(
        (item, indice) => ({
          indice,
          tipoItem:
            item.tipoItem,
          idLocal:
            item.idLocal,
          descricao:
            item.descricao,
          origem:
            item.origem,
          quantidade:
            item.quantidade,
          preco:
            item.preco,
          valorTotal:
            item.valorTotal,
        }),
      ),
    );

    const produtoInvalido =
      produtosNovos.find(
        (produto) =>
          !produto.precoEncontrado ||
          produto.preco <= 0 ||
          produto.quantidade <= 0 ||
          produto.valorTotal <= 0,
      );

    if (produtoInvalido) {
      setMensagemErroOperacao(
        `O produto "${produtoInvalido.descricao}" não possui preço ou quantidade válidos.`,
      );
      return;
    }
    

    for (const programa of programasNovos) {
      
      if (
        !programa.precoEncontrado ||
        programa.preco <= 0 ||
        programa.quantidade <= 0 ||
        programa.valorTotal <= 0
      ) {
        setMensagemErroOperacao(
          `O programa "${programa.descricao}" não possui preço ou quantidade válidos.`,
        );
        return;
      }

      const componentesSelecionados =
        programa.componentes.filter(
          (componente) =>
            componente.selecionado,
        );

      if (
        programa.obrigaSelecao &&
        componentesSelecionados.length === 0
      ) {
        setMensagemErroOperacao(
          `Selecione os componentes do programa "${programa.descricao}".`,
        );
        return;
      }

      if (
        programa.maximoProdutosDiferentes > 0 &&
        componentesSelecionados.length >
          programa.maximoProdutosDiferentes
      ) {
        setMensagemErroOperacao(
          `O programa "${programa.descricao}" permite no máximo ${programa.maximoProdutosDiferentes} produtos diferentes.`,
        );
        return;
      }

      const quantidadeSelecionada =
        componentesSelecionados.reduce(
          (total, componente) =>
            total + componente.quantidade,
          0,
        );

      if (
        programa.quantidadeTotalPermitida > 0 &&
        quantidadeSelecionada !==
          programa.quantidadeTotalPermitida *
            programa.quantidade
      ) {
        console.error(
          "Quantidade selecionada inválida:",
          {
            quantidadeSelecionada,
            quantidadeEsperada:
              programa.quantidadeTotalPermitida *
              programa.quantidade,
          },
        );

        console.groupEnd();

        setMensagemErroOperacao(
          `A quantidade selecionada no programa "${programa.descricao}" deve ser ${programa.quantidadeTotalPermitida * programa.quantidade}.`,
        );
        return;
      }

      console.log(
        "Validação concluída com sucesso.",
      );

      console.groupEnd();
    }

    console.group(
      "========== PREPARAÇÃO DOS PRODUTOS NORMAIS ==========",
    );

    const produtosPedido =
      produtosNovos.map(
        (produto) => ({
          idProduto:
            produto.idProduto,
          idBotao:
            produto.idBotao,
          descricao:
            produto.descricao,
          quantidade:
            produto.quantidade,
          precoUnitario:
            produto.preco,
          valorTotal:
            Number(
              produto.valorTotal.toFixed(
                2,
              ),
            ),
          precoVariavel:
            produto.precoVariavel,
          precoAlterado:
            produto.precoAlterado,
          justificacaoAlteracaoPreco:
            produto.justificacaoAlteracaoPreco,
          observacao:
            produto.observacao,
          comentarios:
            produto.comentarios.map(
              (comentario) => ({
                idComentario:
                  comentario.idComentario,
                descricao:
                  comentario.descricao,
                comentarioLivre:
                  comentario.comentarioLivre,
                texto:
                  comentario.texto,
              }),
            ),
          idGrupoPreparacao:
            produto.idGrupoPreparacao,
          idArmazem: null,
          idClassePrecos:
            catalogo?.contexto
              .idClassePrecosEfetiva ??
            null,
          idTabelaPrecos:
            catalogo?.contexto
              .idTabelaPrecos ??
            null,
        }),
      );

    console.log(
      "Produtos normais convertidos para pedido:",
      produtosPedido,
    );

  console.table(
  produtosPedido.map(
    (produto, indice) => ({
      indice,
      idProduto:
        produto.idProduto,
      descricao:
        produto.descricao,
      quantidade:
        produto.quantidade,
      preco:
        produto.precoUnitario,
      valorTotal:
        produto.valorTotal,
    }),
  ),
);
 

    console.groupEnd();

    setAEnviar(true);

    let idMovimentoMesaGravado = 0;
    let idInternoContaGravado = 0;

    try {
      if (modoEditor === "CONTA") {
        if (!contaCarregada) {
          throw new Error(
            "Não foi possível identificar a conta selecionada.",
          );
        }

        idMovimentoMesaGravado =
          contaCarregada.idMovimentoMesa ??
          obterIdNumerico(
            searchParams.get(
              "idMovimentoMesa",
            ),
          );

        idInternoContaGravado =
          contaCarregada.idInterno ??
          obterIdNumerico(
            searchParams.get(
              "idInterno",
            ),
          );

        if (
          idMovimentoMesaGravado <= 0 ||
          idInternoContaGravado <= 0
        ) {
          throw new Error(
            "Não foi possível identificar o movimento e a conta.",
          );
        }

        if (produtosPedido.length > 0) {
          const responseProdutos =
            await fetch(
              "/api/pos-mobile/adicionar-produtos-conta",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                  Accept:
                    "application/json",
                },
                body: JSON.stringify({
                  accessToken: token,
                  idPosto:
                    dadosMesa.idPosto,
                  idMovimentoMesa:
                    idMovimentoMesaGravado,
                  idInternoConta:
                    idInternoContaGravado,
                  produtos:
                    produtosPedido,
                }),
              },
            );

          const resultadoProdutos =
            (await responseProdutos.json()) as
              POSMobileAdicionarProdutosContaResposta;

          if (
            !responseProdutos.ok ||
            !resultadoProdutos.sucesso ||
            !resultadoProdutos.dados
          ) {
            throw new Error(
              resultadoProdutos.mensagem ||
                "Não foi possível enviar os produtos.",
            );
          }
        }
      } else {
        // if (produtosPedido.length === 0) {
        //   throw new Error(
        //     "Para abrir uma nova conta com um programa, adicione primeiro pelo menos um produto normal. A criação direta de uma conta apenas com programas ainda não está disponível.",
        //   );
        // }

        const idClassePrecos =
          catalogo?.contexto
            .idClassePrecosEfetiva ??
          0;

        const responseConta =
          await fetch(
            "/api/pos-mobile/gravar-conta-produtos",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify({
                accessToken: token,
                idPosto:
                  dadosMesa.idPosto,
                idSala:
                  dadosMesa.idSala,
                idPagina:
                  dadosMesa.idPagina,
                idMesa:
                  dadosMesa.idMesa,
                idMovimentoMesa: 0,
                idInternoConta: 0,
                numeroConta: 1,
                numeroPessoas:
                  dadosMesa.numeroPessoas,
                idEntidade: 0,
                nomeEntidade: "",
                quarto: "",
                idReserva: 0,
                observacaoMesa: "",
                idClassePrecos,
                produtos:
                  produtosPedido,
              }),
            },
          );

        const resultadoConta =
          (await responseConta.json()) as
            POSMobileGravarContaProdutosResposta;

        if (
          !responseConta.ok ||
          !resultadoConta.sucesso ||
          !resultadoConta.dados
        ) {
          throw new Error(
            resultadoConta.mensagem ||
              "Não foi possível abrir a mesa e gravar os produtos.",
          );
        }

        idMovimentoMesaGravado =
          resultadoConta.dados.idMovimentoMesa;

        idInternoContaGravado =
          resultadoConta.dados.idInternoConta;

        sessionStorage.setItem(
          "posMobileContaSelecionada",
          JSON.stringify({
            modo: "conta",
            idPosto:
              dadosMesa.idPosto,
            idSala:
              dadosMesa.idSala,
            idPagina:
              dadosMesa.idPagina,
            idMesa:
              dadosMesa.idMesa,
            numeroMesa:
              dadosMesa.numeroMesa,
            descricaoMesa:
              dadosMesa.descricaoMesa,
            descricaoSala:
              dadosMesa.descricaoSala,
            numeroPessoas:
              resultadoConta.dados.numeroPessoas,
            numeroLugares:
              dadosMesa.numeroLugares,
            idMovimentoMesa:
              resultadoConta.dados.idMovimentoMesa,
            idInterno:
              resultadoConta.dados.idInternoConta,
            idConta:
              resultadoConta.dados.numeroConta,
          }),
        );
      }

      for (const programa of programasNovos) {
        const linhasSelecionadas =
          programa.tipoLancamento === "TOTAL"
            ? []
            : programa.componentes
                .filter(
                  (componente) =>
                    componente.selecionado,
                )
                .map(
                  (componente) => ({
                    idProduto:
                      componente.idProduto,
                    idNivel:
                      componente.idNivel,
                    idGrupoMenu:
                      componente.idGrupoMenu,
                    idGrupoPreparacao:
                      componente.idGrupoPreparacao,
                    quantidade:
                      componente.quantidade,
                    valorUnitario:
                      componente.valorUnitario,
                    valorFixo:
                      componente.valorFixo,
                    produtoFixo:
                      componente.produtoFixo,
                    produtoSemEscolha:
                      componente.produtoSemEscolha,

                    comentarios:
                      componente.comentarios ?? [],
                  }),
                );

        const pedidoPrograma:
          AdicionarProgramaPedido = {
            accessToken: token,
            idPosto:
              dadosMesa.idPosto,
            idMovimentoMesa:
              idMovimentoMesaGravado,
            idInternoConta:
              idInternoContaGravado,
            idProdutoPrograma:
              programa.idProdutoPrograma,
            idGrupoPreparacao:
              programa.idGrupoPreparacao,
            quantidadePrograma:
              programa.quantidade,
            tipoLancamento:
              programa.tipoLancamento,
            modoQuantidade:
              programa.modoQuantidade,
            valorMenu:
              programa.preco,
            linhas:
              linhasSelecionadas,
          };

        console.group(
          `========== ENVIO DO PROGRAMA: ${programa.descricao} ==========`,
        );

        console.log(
          "Programa do editor:",
          programa,
        );

        console.log(
          "Componentes selecionados:",
          programa.componentes.filter(
            (componente) =>
              componente.selecionado,
          ),
        );

        console.log(
          "Pedido enviado à API:",
          pedidoPrograma,
        );

        console.table(
          pedidoPrograma.linhas.map(
            (linha, indice) => ({
              indice,
              idProduto:
                linha.idProduto,
              idNivel:
                linha.idNivel,
              idGrupoMenu:
                linha.idGrupoMenu,
              idGrupoPreparacao:
                linha.idGrupoPreparacao,
              quantidade:
                linha.quantidade,
              valorUnitario:
                linha.valorUnitario,
              produtoFixo:
                linha.produtoFixo,
              produtoSemEscolha:
                linha.produtoSemEscolha,
            }),
          ),
        );

        const responsePrograma =
          await fetch(
            "/api/pos-mobile/adicionar-produto-programa-conta",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify(
                pedidoPrograma,
              ),
            },
          );

        const resultadoPrograma =
          (await responsePrograma.json()) as
            POSMobileApiResponse<
              AdicionarProgramaResultado
            >;

        console.log(
          "HTTP status:",
          responsePrograma.status,
        );

        console.log(
          "Resposta completa da gravação:",
          resultadoPrograma,
        );

        console.log(
          "Dados devolvidos:",
          resultadoPrograma.dados,
        );

        console.log(
          "Número de linhas adicionadas:",
          resultadoPrograma.dados
            ?.numeroLinhasAdicionadas,
        );

        console.log(
          "ID da linha do programa:",
          resultadoPrograma.dados
            ?.idLinhaPrograma,
        );

        console.log(
          "Linhas devolvidas:",
          resultadoPrograma.dados?.linhas,
        );

        console.table(
          (resultadoPrograma.dados?.linhas ?? []).map(
            (linha, indice) => ({
              indice,
              idLinha:
                linha.idLinha,
              idLinhaPai:
                linha.idLinhaPai,
              idProduto:
                linha.idProduto,
              descricao:
                linha.descricao,
              quantidade:
                linha.quantidade,
              valorTotal:
                linha.valorTotal,
            }),
          ),
        );

        if (
          !responsePrograma.ok ||
          !resultadoPrograma.sucesso ||
          !resultadoPrograma.dados
        ) {
          console.error(
            "Falha ao gravar o programa:",
            resultadoPrograma,
          );

          console.groupEnd();

          throw new Error(
            resultadoPrograma.mensagem ||
              `Não foi possível gravar o programa "${programa.descricao}".`,
          );
        }

        const dadosPrograma =
          resultadoPrograma.dados;

        if (
          !dadosPrograma.idLinhaPrograma ||
          dadosPrograma.idLinhaPrograma <= 0
        ) {
          console.error(
            "A API não confirmou a linha principal do programa:",
            dadosPrograma,
          );

          console.groupEnd();

          throw new Error(
            `A API não confirmou a linha principal do programa "${programa.descricao}".`,
          );
        }

        if (
          dadosPrograma.numeroLinhasAdicionadas <= 0 ||
          dadosPrograma.linhas.length === 0
        ) {
          console.error(
            "A API não confirmou linhas gravadas para o programa:",
            dadosPrograma,
          );

          console.groupEnd();

          throw new Error(
            `A API não confirmou as linhas do programa "${programa.descricao}".`,
          );
        }

        const linhaSemIdentificador =
          dadosPrograma.linhas.find(
            (linha) =>
              !linha.idLinha ||
              linha.idLinha <= 0,
          );

        if (linhaSemIdentificador) {
          console.error(
            "A API devolveu uma linha sem identificador:",
            linhaSemIdentificador,
          );

          console.groupEnd();

          throw new Error(
            `A API devolveu uma linha sem identificador no programa "${programa.descricao}".`,
          );
        }

        const linhaPrograma =
          dadosPrograma.linhas.find(
            (linha) =>
              linha.idLinha ===
              dadosPrograma.idLinhaPrograma,
          );

        if (!linhaPrograma) {
          console.error(
            "A linha principal indicada não consta da lista devolvida:",
            {
              idLinhaPrograma:
                dadosPrograma.idLinhaPrograma,
              linhas:
                dadosPrograma.linhas,
            },
          );

          console.groupEnd();

          throw new Error(
            `A linha principal do programa "${programa.descricao}" não consta das linhas devolvidas pela API.`,
          );
        }

        const componentesSemPai =
          dadosPrograma.linhas.filter(
            (linha) =>
              linha.idLinha !==
                dadosPrograma.idLinhaPrograma &&
              (
                !linha.idLinhaPai ||
                linha.idLinhaPai !==
                  dadosPrograma.idLinhaPrograma
              ),
          );

        if (
          componentesSemPai.length > 0
        ) {
          console.error(
            "Existem componentes sem ligação à linha principal:",
            componentesSemPai,
          );

          console.groupEnd();

          throw new Error(
            `A API devolveu componentes sem ligação válida ao programa "${programa.descricao}".`,
          );
        }

        console.log(
          "Programa gravado e identificado com sucesso.",
          {
            idLinhaPrograma:
              dadosPrograma.idLinhaPrograma,
            numeroLinhas:
              dadosPrograma.numeroLinhasAdicionadas,
          },
        );

        console.groupEnd();
      }

      console.log(
        "Todos os pedidos foram enviados sem erro.",
      );

      const idsLocaisGravados =
        itensNovos.map(
          (item) =>
            item.idLocal,
        );

      console.log(
        "A recarregar a conta e a remover apenas os itens locais confirmados:",
        idsLocaisGravados,
      );

      await recarregarContaMantendoProdutosNovos(
        idMovimentoMesaGravado,
        idInternoContaGravado,
        idsLocaisGravados,
      );

      setIdLinhaSelecionada(
        null,
      );

      console.log(
        "Conta recarregada a partir da base de dados.",
      );

      /*
        A partir deste momento já temos uma conta persistida.
        Isto é essencial para o fluxo da Consulta de Mesa, que pode
        começar ainda no modo ABERTURA.
      */
      setModoEditor(
        "CONTA",
      );

      const identificacaoPersistida:
        ContaPersistidaResultado = {
          idMovimentoMesa:
            idMovimentoMesaGravado,
          idInternoConta:
            idInternoContaGravado,
        };

      if (!finalizarFluxo) {
        return identificacaoPersistida;
      }

      // {
      //   ================================================================
      //   FLUXO NORMAL - ABRIR MESA / ENVIAR NOVOS
      //   ================================================================

      //   Mantemos o comportamento tradicional:

      //     1. gravar a conta / os produtos novos;
      //     2. se o posto estiver configurado para Segue e existirem
      //        linhas pendentes, abrir o Segue;
      //     3. ao fechar ou concluir o Segue, regressar às Mesas.

      //   A ação explícita "Mesas" é diferente:
      //   essa pode sair sem obrigar ao envio para a cozinha.
      //   ================================================================
      // }
      if (
        await abrirSegueAntesDeSair(
          idMovimentoMesaGravado,
          idInternoContaGravado,
          "SAIR",
        )
      ) {
        return identificacaoPersistida;
      }

      await concluirSaidaEditor();

      return identificacaoPersistida;
    } catch (error) {
      console.error(
        "ERRO NO ENVIO DO PEDIDO:",
        error,
      );

      setMensagemErroOperacao(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao enviar os produtos e programas.",
      );
    } finally {
      console.log(
        "Fim do processo de envio.",
      );

      console.groupEnd();

      setAEnviar(false);
    }
  }

  /*
    ==========================================================================
    ABRIR MESA / ENVIAR NOVOS
    ==========================================================================

    Este é o fluxo operacional normal do pedido:

      - grava a conta / os produtos;
      - abre o Segue quando a configuração do posto o exigir e existirem
        linhas pendentes;
      - ao fechar ou concluir o Segue, regressa às Mesas.

    Isto é diferente do botão "Mesas", que permite abandonar o editor
    sem obrigar ao envio à cozinha.
    ==========================================================================
  */
  async function enviarProdutosNovos() {
    await gravarProdutosPendentes(
      true,
    );
  }

  /*
    ==========================================================================
    PAGAR DIRETAMENTE A PARTIR DA ABERTURA DA MESA
    ==========================================================================

    Permite ao operador lançar os produtos e seguir diretamente para o
    pagamento sem ter de:

      1. abrir/gravar a mesa;
      2. regressar/entrar novamente na conta;
      3. só depois abrir os pagamentos.

    Tecnicamente continuamos a respeitar a regra do Motor: o pagamento só
    começa depois de existir uma conta persistida.

    Por isso, quando estamos em ABERTURA:
      - gravamos primeiro a mesa e os produtos com finalizarFluxo = false;
      - NÃO abrimos o Segue nem saímos do editor;
      - a conta fica carregada em modo CONTA;
      - abrimos de seguida o mesmo PagamentoDrawer já usado pelas contas.

    Se por algum motivo esta função for chamada já em CONTA, reutilizamos o
    fluxo normal de abrirPagamentos sem alterar o comportamento existente.
    ==========================================================================
  */
  async function pagarPedidoAntesDeAbrir() {
    if (
      aEnviar ||
      aSairMesa ||
      aAdicionarPrograma ||
      aCarregarPagamentos ||
      aPrepararPagamento ||
      aEfetuarPagamento
    ) {
      return;
    }

    setMensagemOperacao("");
    setMensagemErroOperacao("");
    setMensagemErroPagamentos("");
    setPesquisaPagamento("");

    if (linhasEditor.length === 0) {
      setMensagemErroOperacao(
        "Adicione pelo menos um produto antes de pagar.",
      );
      return;
    }

    if (totalEditor <= 0) {
      setMensagemErroOperacao(
        "O total do pedido tem de ser superior a zero para efetuar o pagamento.",
      );
      return;
    }

    if (temPrecosPendentes) {
      setMensagemErroOperacao(
        "Existem produtos sem preço válido. Resolva os preços antes de pagar.",
      );
      return;
    }

    /*
      Numa conta já persistida mantemos exatamente o comportamento anterior.
    */
    if (modoEditor === "CONTA") {
      setMostrarPedidoMobile(false);
      await abrirPagamentos();
      return;
    }

    /*
      Em ABERTURA, gravamos primeiro sem concluir o fluxo operacional.

      Isto evita:
        - abrir o Segue;
        - libertar a mesa;
        - navegar para /pos.

      O resultado devolve a identificação persistida e
      recarregarContaMantendoProdutosNovos atualiza contaCarregada/linhasEditor.
    */
    const identificacao =
      await gravarProdutosPendentes(
        false,
      );

    if (!identificacao) {
      return;
    }

    /*
      Fechamos apenas o bottom sheet do pedido no telemóvel.
      No desktop este estado já está normalmente a false e não tem efeito.
    */
    setMostrarPedidoMobile(false);

    /*
      Não chamamos abrirPagamentos() aqui porque, dentro deste mesmo handler,
      modoEditor/contaCarregada ainda podem refletir o render anterior.

      A conta já foi confirmada pela API e recarregada. Abrimos diretamente o
      drawer; quando o operador escolher um método, o render seguinte já terá
      a conta persistida em estado e obterIdentificacaoContaAtual() trabalhará
      sobre os IDs corretos.
    */
    setMostrarPagamentos(true);

    if (pagamentos.length === 0) {
      await carregarPagamentos();
    }
  }

  async function concluirSaidaEditor() {
    const mesaLibertada =
      await sairMesa();

    if (!mesaLibertada) {
      return;
    }

    ignorarAvisoSaidaRef.current =
      true;

    sessionStorage.removeItem(
      "posMobileMesaEmAbertura",
    );

    sessionStorage.removeItem(
      "posMobileContaSelecionada",
    );

    router.replace("/pos");
  }

  async function voltarParaMesas() {
    if (
      aEnviar ||
      aSairMesa ||
      aGerarConsultaMesa
    ) {
      return;
    }

    setMensagemOperacao("");
    setMensagemErroOperacao("");

    if (temAlteracoesPendentes) {
      setMostrarConfirmacaoSaida(true);
      return;
    }

    // {
    //   ================================================================
    //   VOLTAR ÀS MESAS
    //   ================================================================

    //   O envio para a cozinha NÃO bloqueia a saída da mesa.

    //   Se não existem alterações locais por gravar, libertamos apenas
    //   a utilização da mesa e regressamos à lista.

    //   Linhas de produção ainda pendentes permanecem na conta e podem
    //   ser enviadas mais tarde, reabrindo a mesa e utilizando o botão
    //   "Segue".
    //   ================================================================
    // }
    await concluirSaidaEditor();
  }

  async function sairSemGravar() {
    setMostrarConfirmacaoSaida(false);
    await concluirSaidaEditor();
  }

  async function gravarESair() {
    setMostrarConfirmacaoSaida(false);

    /*
      Esta ação pertence ao botão "Mesas".

      O operador escolheu sair do editor, por isso:
        1. gravamos primeiro os produtos pendentes;
        2. NÃO obrigamos a abrir o Segue;
        3. libertamos a utilização da mesa;
        4. regressamos às Mesas.

      Os pedidos de cozinha que fiquem pendentes podem ser enviados
      posteriormente reabrindo a mesa e usando o botão Segue.
    */
    const identificacao =
      await gravarProdutosPendentes(
        false,
      );

    if (!identificacao) {
      return;
    }

    await concluirSaidaEditor();
  }

  if (aCarregar) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-4 font-semibold text-slate-600">
            A carregar catálogo e dados da conta...
          </p>
        </div>
      </main>
    );
  }

  if (mensagemErro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black">
            Não foi possível carregar
          </h1>

          <p className="mt-3 text-slate-500">
            {mensagemErro}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                void voltarParaMesas()
              }
              className="h-12 rounded-xl border border-slate-200 px-5 font-bold text-slate-600 transition hover:bg-slate-100"
            >
              Voltar às mesas
            </button>

            <button
              type="button"
              onClick={() =>
                void carregarCatalogo()
              }
              className="h-12 rounded-xl bg-blue-600 px-6 font-bold text-white transition hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f8] pb-24 text-slate-900 lg:pb-0">
      {/* ============================================================
          BOTÃO TEMPORÁRIO DE TESTE DO TOAST

          Fica acima dos drawers/modais do POS para permitir testar
          o Toast mesmo com o pagamento aberto.

          Depois de validarmos o Toast, pode ser removido.
          ============================================================ */}
      
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-md backdrop-blur">
        <div className="flex min-h-14 flex-nowrap items-center gap-1 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:min-h-16 sm:gap-2 sm:px-4 sm:py-2 lg:h-20 lg:min-h-20 lg:overflow-visible lg:gap-3 lg:px-6 lg:py-0">
          <div className="min-w-[104px] flex-1 lg:min-w-0">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
              <div className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-blue-400 bg-gradient-to-br from-blue-600 to-blue-700 px-2 py-1.5 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-300/50 sm:min-w-48 sm:rounded-2xl sm:px-3 sm:py-2 lg:w-auto lg:gap-3 lg:px-4">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-sm font-black ring-1 ring-inset ring-white/20 sm:h-9 sm:w-9 sm:rounded-xl sm:text-base"
                >
                  S
                </span>

                <div className="min-w-0">
                  <p className="truncate text-[8px] font-black uppercase tracking-[0.12em] text-blue-100 sm:text-[9px] sm:tracking-[0.16em]">
                    <span className="sm:hidden">SysPOS · Mesa</span>
                    <span className="hidden sm:inline">SysPOS · Mesa selecionada</span>
                  </p>

                  <h1 className="truncate text-base font-black leading-tight tracking-tight sm:text-xl">
                    {dadosMesa?.descricaoMesa ??
                      "Mesa"}
                  </h1>
                </div>
              </div>

              <div className="hidden min-w-0 max-w-44 shrink items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-sm sm:flex">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="2"
                    />
                  </svg>
                </span>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
                    Sala
                  </p>

                  <p
                    title={
                      dadosMesa?.descricaoSala ||
                      "Sala"
                    }
                    className="truncate text-sm font-black text-emerald-950"
                  >
                    {dadosMesa?.descricaoSala ||
                      "Sala"}
                  </p>
                </div>
              </div>

              <div className="hidden min-w-0 flex-1 flex-col gap-1.5 md:flex">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700 shadow-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-3.5 w-3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87"
                      />
                    </svg>

                    {dadosMesa?.numeroPessoas ??
                      1}{" "}
                    pessoa
                    {(dadosMesa?.numeroPessoas ??
                      1) !== 1
                      ? "s"
                      : ""}
                  </span>

                  {contaCarregada && (
                    <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-black text-rose-700 shadow-sm">
                      {contaCarregada.descricaoConta ||
                        `Conta ${contaCarregada.idConta}`}
                      {" · "}
                      {formatarValor(
                        contaCarregada.valorTotal,
                      )}
                    </span>
                  )}

                  {mostrarClasseEfetiva && (
                    <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 xl:inline-flex">
                      Classe{" "}
                      {idClassePrecosEfetiva}
                    </span>
                  )}
                </div>

                {resumoContextoCabecalho && (
                  <p
                    title={
                      resumoContextoCabecalho
                    }
                    className="truncate text-[10px] font-semibold text-slate-500"
                  >
                    {resumoContextoCabecalho}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={
              abrirAlterarNumeroClientes
            }
            disabled={
              aEnviar ||
              aSairMesa ||
              !dadosMesa
            }
            title="Alterar o número de clientes da mesa"
            className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-1.5 text-sm font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:gap-2 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87"
              />
            </svg>

            <span className="hidden sm:inline">
              Clientes
            </span>

            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-emerald-800 shadow-sm">
              {dadosMesa?.numeroPessoas ??
                contaCarregada?.numeroPessoas ??
                1}
            </span>
          </button>

          <button
            type="button"
            onClick={
              abrirConfirmacaoConsultaMesa
            }
            disabled={
              aEnviar ||
              aSairMesa ||
              aGerarConsultaMesa ||
              aPrepararPagamento ||
              aEfetuarPagamento ||
              linhasEditor.length === 0 ||
              temPrecosPendentes ||
              (
                idConsultaMesaGerada !== null &&
                idConsultaMesaGerada > 0
              )
            }
            title={
              idConsultaMesaGerada &&
              idConsultaMesaGerada > 0
                ? `Consulta de Mesa ${idConsultaMesaGerada} já gerada`
                : linhasEditor.length === 0
                  ? "Adicione produtos antes de gerar a Consulta de Mesa"
                  : temPrecosPendentes
                    ? "Resolva primeiro os preços pendentes"
                    : modoEditor === "ABERTURA"
                      ? "Abrir a mesa, gravar os produtos e gerar a Consulta de Mesa"
                      : temAlteracoesPendentes
                        ? "Gravar os produtos novos e gerar a Consulta de Mesa"
                        : "Gerar Consulta de Mesa"
            }
            aria-label="Gerar Consulta de Mesa"
            className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-2 text-sm font-bold text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 3h9l3 3v15H6V3Z"
              />

              <path
                strokeLinecap="round"
                d="M9 10h6M9 14h6M9 18h4"
              />
            </svg>

            <span className="hidden sm:inline">
              Consulta
            </span>
          </button>

          {modoEditor === "CONTA" &&
            contaCarregada && (
              <button
                type="button"
                onClick={
                  abrirSegueManual
                }
                disabled={
                  aEnviar ||
                  aSairMesa ||
                  aGerarConsultaMesa ||
                  aPrepararPagamento ||
                  aEfetuarPagamento ||
                  temAlteracoesPendentes
                }
                title={
                  temAlteracoesPendentes
                    ? "Envie primeiro os produtos novos."
                    : "Abrir o Segue da conta."
                }
                aria-label="Abrir Segue"
                className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2 text-sm font-bold text-amber-800 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 10a4 4 0 0 1 1-7.87A5 5 0 0 1 16.9 3 4 4 0 0 1 18 10v2H6v-2Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 12v7h10v-7M10 16h4"
                  />
                </svg>

                <span className="hidden sm:inline">
                  Segue
                </span>
              </button>
            )}

          <button
            type="button"
            onClick={() =>
              void voltarParaMesas()
            }
            disabled={
              aEnviar ||
              aSairMesa ||
              aGerarConsultaMesa
            }
            title="Voltar à lista de mesas"
            aria-label="Voltar às mesas"
            className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2 text-sm font-bold text-blue-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 10h14M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M6 10v7m12-7v7M4 17h16"
              />
            </svg>

            <span className="hidden sm:inline">
              Mesas
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              void alternarEcranInteiro()
            }
            title={
              ecranInteiro
                ? "Sair do ecrã inteiro"
                : "Abrir em ecrã inteiro"
            }
            aria-label={
              ecranInteiro
                ? "Sair do ecrã inteiro"
                : "Abrir em ecrã inteiro"
            }
            className="hidden h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 lg:flex"
          >
            {ecranInteiro ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"
                />
              </svg>
            )}
          </button>
        </div>
      </header>
      <div className="grid min-h-0 grid-cols-1 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[220px_minmax(0,1fr)_390px] 2xl:grid-cols-[180px_minmax(0,1fr)_420px]">
        {!grupoLinkAtivo && (
          <aside className="border-b border-slate-200 bg-white p-3 lg:sticky lg:top-20 lg:flex lg:h-[calc(100dvh-5rem)] lg:min-h-0 lg:self-start lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r lg:p-4">
            <p className="shrink-0 px-2 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Grupos
            </p>

            <div
              ref={gruposScrollRef}
              className="flex gap-2 overflow-x-auto overscroll-contain [scrollbar-gutter:stable] lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1"
            >
              {catalogo?.grupos.map(
                (grupo) => {
                  const selecionado =
                    grupo.idGrupo ===
                    idGrupoSelecionado;

                  const estilosGrupo =
                    USAR_CONFIGURACAO_PRODUTOS
                      ? criarEstilosVisuaisGrupo(
                          grupo,
                        )
                      : undefined;

                  return (
                    <button
                      ref={(elemento) => {
                        if (elemento) {
                          gruposBotaoRefs.current.set(
                            grupo.idGrupo,
                            elemento,
                          );
                        } else {
                          gruposBotaoRefs.current.delete(
                            grupo.idGrupo,
                          );
                        }
                      }}
                      key={
                        grupo.idGrupo
                      }
                      type="button"
                      onClick={() =>
                        selecionarGrupo(
                          grupo,
                        )
                      }
                      style={
                        estilosGrupo
                      }
                      title={
                        grupo.descricao
                      }
                      aria-pressed={
                        selecionado
                      }
                      className={[
                        "flex h-11 w-44 min-w-44 shrink-0 items-center overflow-hidden rounded-xl border px-3 text-left text-sm font-bold leading-tight transition lg:w-full lg:min-w-0 lg:max-w-full",
                        selecionado
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-inset ring-blue-400"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 hover:shadow-sm",
                      ].join(" ")}
                    >
                      <span className="block min-w-0 flex-1 truncate">
                        {grupo.descricao}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </aside>
        )}

        <section
          className={[
            "min-w-0 p-3 sm:p-5 lg:p-6",
            grupoLinkAtivo
              ? "lg:col-span-2"
              : "",
          ].join(" ")}
        >
          {grupoLinkAtivo ? (
            <CatalogoGrupoLink
              idGrupo={
                grupoLinkAtivo.idGrupo
              }
              idSala={
                dadosMesa?.idSala ??
                0
              }
              descricaoOrigem={
                grupoLinkAtivo.descricaoOrigem
              }
              fechaJanelaLinkOrigem={
                grupoLinkAtivo.fechaJanelaLink
              }
              onVoltar={() => {
                setGrupoLinkAtivo(
                  null,
                );

                setMensagemErroOperacao(
                  "",
                );
              }}
              onSelecionarProduto={
                selecionarProdutoGrupoLink
              }
            />
          ) : (
            <>
                <div className="mb-3 flex flex-col gap-3 sm:mb-4 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-4 lg:shadow-sm xl:flex-row xl:items-center xl:justify-between">
                  <div className="hidden min-w-0 lg:block">
                    <h2 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                      {grupoSelecionado?.descricao ??
                        "Catálogo"}
                    </h2>

                    {paginaSelecionada?.descricao &&
                      paginasGrupoSelecionado.length >
                        1 && (
                        <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          {
                            paginaSelecionada.descricao
                          }
                        </p>
                      )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {paginasGrupoSelecionado.length >
                      1 && (
                      <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        {paginasGrupoSelecionado.map(
                          (pagina) => (
                            <button
                              key={
                                pagina.idGProdutos
                              }
                              type="button"
                              onClick={() =>
                                selecionarPagina(
                                  pagina,
                                )
                              }
                              className={[
                                "min-w-max rounded-lg px-4 py-2.5 text-xs font-bold transition",
                                pagina.idGProdutos ===
                                idPaginaSelecionada
                                  ? "bg-slate-900 text-white shadow"
                                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                              ].join(" ")}
                            >
                              {pagina.descricao ||
                                `Página ${pagina.numeroPagina}`}
                            </button>
                          ),
                        )}
                      </div>
                    )}

                    <div className="relative sm:w-72">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <circle
                            cx="11"
                            cy="11"
                            r="7"
                          />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                      </span>

                      <input
                        type="search"
                        value={pesquisa}
                        onChange={(event) =>
                          setPesquisa(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Pesquisar produto..."
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {botoesVisiveis.length > 0 ? (
                  <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {botoesVisiveis.map(
                      (botao) => {
                        const podeAdicionar =
                          botao.tipoBotao ===
                            "PRODUTO" &&
                          Boolean(
                            botao.idBotao &&
                              botao.idProduto,
                          );

                        const estilosConfigurados =
                          USAR_CONFIGURACAO_PRODUTOS
                            ? criarEstilosVisuaisBotao(
                                botao,
                              )
                            : null;

                        const nomeImagem =
                          USAR_CONFIGURACAO_PRODUTOS
                            ? obterNomeImagemSeguro(
                                botao.nomeImagem,
                              )
                            : null;

                        const chaveFeedbackProduto =
                          obterChaveFeedbackProduto(
                            botao,
                          );

                        const acabouDeAdicionar =
                          podeAdicionar &&
                          produtoAdicionadoFeedback ===
                            chaveFeedbackProduto;

                        return (
                          <button
                            key={
                              botao.idBotao ??
                              `${botao.idGrupo}-${botao.idGProdutos}-${botao.posicao}`
                            }
                            type="button"
                            onClick={() =>
                              adicionarProduto(
                                botao,
                              )
                            }
                            disabled={
                              botao.tipoBotao ===
                                "DESCONHECIDO" ||
                              aAdicionarPrograma
                            }
                            style={
                              estilosConfigurados
                                ?.cartao
                            }
                            className={[
                              "group relative flex h-full min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-xl border p-3 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",
                              acabouDeAdicionar
                                ? "scale-[0.985] ring-4 ring-blue-200 shadow-lg"
                                : "",
                              podeAdicionar
                                ? "border-slate-200 bg-white hover:border-blue-300"
                                : botao.tipoBotao ===
                                    "LINK"
                                  ? "border-violet-200 bg-violet-50 hover:border-violet-300"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60",
                            ].join(" ")}
                          >
                            {acabouDeAdicionar && (
                              <span className="pointer-events-none absolute right-2 top-2 z-20 rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-md">
                                ✓ Adicionado
                              </span>
                            )}

                            <div className="w-full">
                              {nomeImagem && (
                                <img
                                  src={`/api/pos-mobile/imagem-produto?nome=${encodeURIComponent(
                                    nomeImagem,
                                  )}`}
                                  alt=""
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                  className="mb-3 h-20 w-full rounded-xl object-contain"
                                />
                              )}

                              {botao.tipoBotao ===
                                "LINK" && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                                  Abrir grupo
                                </span>
                              )}

                              <h3
                                style={
                                  estilosConfigurados
                                    ?.texto
                                }
                                className={[
                                  "line-clamp-2 text-sm font-black leading-5 text-slate-900",
                                  botao.tipoBotao ===
                                  "LINK"
                                    ? "mt-2"
                                    : "",
                                ].join(" ")}
                              >
                                {
                                  botao.descricao
                                }
                              </h3>
                            </div>

                            <div className="mt-3 flex items-end justify-between gap-3">
                              {botao.tipoBotao ===
                              "LINK" ? (
                                <span
                                  style={
                                    estilosConfigurados
                                      ?.preco
                                  }
                                  className="inline-flex rounded-lg px-2 py-1 text-xs font-bold text-violet-700"
                                >
                                  Continuar →
                                </span>
                              ) : botao.precoVariavel ? (
                                <span
                                  style={
                                    estilosConfigurados
                                      ?.preco
                                  }
                                  className="inline-flex rounded-lg px-2 py-1 text-xs font-bold text-amber-700"
                                >
                                  Preço variável
                                </span>
                              ) : botao.precoEncontrado ? (
                                <span
                                  style={
                                    estilosConfigurados
                                      ?.preco
                                  }
                                  className="inline-flex rounded-lg px-2 py-1 text-lg font-black text-blue-700"
                                >
                                  {formatarValor(
                                    botao.preco,
                                  )}
                                </span>
                              ) : (
                                <span
                                  style={
                                    estilosConfigurados
                                      ?.preco
                                  }
                                  className="inline-flex rounded-lg px-2 py-1 text-xs font-bold text-slate-400"
                                >
                                  Preço por carregar
                                </span>
                              )}

                              {podeAdicionar && (
                                <span
                                  className={[
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-black transition-all duration-150",
                                    acabouDeAdicionar
                                      ? "scale-110 bg-emerald-600 text-white"
                                      : "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
                                  ].join(" ")}
                                >
                                  {acabouDeAdicionar
                                    ? "✓"
                                    : "+"}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <h3 className="text-lg font-black sm:text-xl">
                      Nenhum produto encontrado
                    </h3>

                    <p className="mt-2 text-slate-500">
                      Esta página não tem botões
                      visíveis ou a pesquisa não
                      encontrou resultados.
                    </p>
                  </div>
                )}
            </>
          )}
        </section>

        <aside className="hidden border-t border-slate-200 bg-white lg:block lg:border-l lg:border-t-0">
          <div className="flex min-h-0 flex-col lg:sticky lg:top-20 lg:h-[calc(100dvh-5rem)] lg:overflow-hidden">
            <div className="shrink-0 border-b border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Pedido
                </h2>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {linhasEditor.reduce(
                    (
                      total,
                      linha,
                    ) =>
                      total +
                      linha.quantidade,
                    0,
                  )}
                </span>
              </div>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {linhasEditor.filter(
                  (linha) =>
                    linha.origem ===
                    "EXISTENTE",
                ).length}{" "}
                existentes
                {" · "}
                {linhasEditor.filter(
                  (linha) =>
                    linha.origem ===
                    "NOVA",
                ).length}{" "}
                novos
              </p>
            </div>

            <div className="h-[46dvh] min-h-[260px] max-h-[430px] overflow-hidden lg:h-auto lg:max-h-none lg:min-h-0 lg:flex-1">
              <EditorPedidoTable
                linhas={
                  linhasEditor
                }
                idLinhaSelecionada={
                  idLinhaSelecionada
                }
                idComponenteSelecionado={
                  idComponenteProgramaSelecionado
                }
                onSelecionarLinha={(
                  idLinha,
                ) => {
                  setIdLinhaSelecionada(
                    idLinha,
                  );

                  setIdComponenteProgramaSelecionado(
                    null,
                  );

                  setMensagemErroOperacao(
                    "",
                  );
                }}
                onSelecionarComponente={(
                  idLinha,
                  idComponente,
                ) => {
                  setIdLinhaSelecionada(
                    idLinha,
                  );

                  setIdComponenteProgramaSelecionado(
                    idComponente,
                  );

                  setMensagemErroOperacao(
                    "",
                  );
                }}
                onAlterarQuantidade={(
                  idLinha,
                  incremento,
                ) => {
                  alterarQuantidade(
                    idLinha,
                    incremento,
                  );
                }}
                onRemoverLinha={(
                  idLinha,
                ) => {
                  removerLinha(
                    idLinha,
                  );
                }}
              />
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white p-3 shadow-[0_-10px_25px_rgba(15,23,42,0.06)] sm:p-4">
              {(linhaSelecionada ||
                componenteProgramaSelecionado) && (
                <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Linha selecionada
                      </p>

                      <p className="mt-1 truncate text-sm font-black text-slate-950">
                        {componenteProgramaSelecionado
                          ?.componente.descricao ??
                          linhaSelecionada?.descricao}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Qtd.{" "}
                        {componenteProgramaSelecionado
                          ?.componente.quantidade ??
                          linhaSelecionada?.quantidade ??
                          0}
                        {" · "}
                        {formatarValor(
                          componenteProgramaSelecionado
                            ?.componente.valorTotal ??
                            linhaSelecionada?.valorTotal ??
                            0,
                        )}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full px-2 py-1 text-[10px] font-black",
                        componenteProgramaSelecionado
                          ? componenteProgramaSelecionado
                              .programa.origem ===
                            "EXISTENTE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                          : linhaSelecionada?.origem ===
                            "EXISTENTE"
                            ? linhaSelecionada.jaImpresso
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700",
                      ].join(" ")}
                    >
                      {componenteProgramaSelecionado
                        ? componenteProgramaSelecionado
                            .programa.origem ===
                          "EXISTENTE"
                          ? "Componente existente"
                          : "Componente novo"
                        : linhaSelecionada?.origem ===
                          "EXISTENTE"
                          ? linhaSelecionada.jaImpresso
                            ? "Pedido impresso"
                            : "Existente"
                          : "Novo"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={
                        abrirAlterarQuantidadeLinha
                      }
                      disabled={
                        componenteProgramaSelecionado !==
                          null ||
                        aEnviar ||
                        aSairMesa ||
                        aAlterarQuantidadeLinha
                      }
                      className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-2 text-[11px] font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          d="M5 12h14M12 5v14"
                        />
                      </svg>

                      Quantidade
                    </button>

                    <button
                      type="button"
                      onClick={
                        abrirComentariosLinhaSelecionada
                      }
                      disabled={
                        aEnviar ||
                        aSairMesa ||
                        aGravarComentariosLinha
                      }
                      className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2 text-[11px] font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                        />
                      </svg>

                      Comentário
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void abrirAnularLinha()
                      }
                      disabled={
                        componenteProgramaSelecionado !==
                          null ||
                        aEnviar ||
                        aSairMesa
                      }
                      className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2 text-[11px] font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"
                        />
                      </svg>

                      Anular
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">
                  {modoEditor === "CONTA"
                    ? "Total da conta"
                    : "Total do pedido"}
                </span>

                <strong className="text-2xl font-black text-slate-950">
                  {formatarValor(
                    totalEditor,
                  )}
                </strong>
              </div>

              {totalProdutosNovos > 0 && (
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {totalProdutosNovos}{" "}
                  {totalProdutosNovos === 1
                    ? "produto por enviar"
                    : "produtos por enviar"}
                </p>
              )}

              {temPrecosPendentes && (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  Existem produtos sem preço
                  carregado. O total ainda não é
                  definitivo.
                </p>
              )}

              {mensagemOperacao && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {mensagemOperacao}
                </div>
              )}

              {aAdicionarPrograma && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                  A preparar e adicionar o programa...
                </div>
              )}

              {mensagemErroOperacao && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {mensagemErroOperacao}
                </div>
              )}

              <div className="mt-4">
                {/* ============================================================
                    AÇÕES DO PEDIDO
                    ============================================================ */}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={
                      limparProdutosNovos
                    }
                    disabled={
                      totalProdutosNovos ===
                      0
                    }
                    className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {modoEditor === "CONTA"
                      ? "Limpar novos"
                      : "Limpar pedido"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void enviarProdutosNovos()
                    }
                    disabled={
                      aEnviar ||
                      aAdicionarPrograma ||
                      linhasEditor.length ===
                        0 ||
                      totalProdutosNovos ===
                        0 ||
                      temPrecosPendentes
                    }
                    className="h-12 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {aEnviar
                      ? modoEditor === "CONTA"
                        ? "A enviar..."
                        : "A abrir..."
                      : modoEditor === "CONTA"
                        ? "Enviar novos"
                        : "Abrir mesa"}
                  </button>
                </div>

                {modoEditor === "ABERTURA" && (
                  <button
                    type="button"
                    onClick={() =>
                      void pagarPedidoAntesDeAbrir()
                    }
                    disabled={
                      aEnviar ||
                      aSairMesa ||
                      aAdicionarPrograma ||
                      aCarregarPagamentos ||
                      aPrepararPagamento ||
                      aEfetuarPagamento ||
                      linhasEditor.length === 0 ||
                      totalEditor <= 0 ||
                      totalProdutosNovos === 0 ||
                      temPrecosPendentes
                    }
                    title="Abrir a mesa, gravar o pedido e seguir diretamente para o pagamento."
                    className="group mt-3 flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-emerald-600 bg-emerald-600 px-4 py-3 text-white shadow-md shadow-emerald-600/15 transition hover:border-emerald-700 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:border-emerald-200 disabled:bg-emerald-200 disabled:text-white/80 disabled:shadow-none"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="2"
                          />

                          <path
                            strokeLinecap="round"
                            d="M3 10h18M7 15h3"
                          />
                        </svg>
                      </span>

                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-black">
                          {aEnviar
                            ? "A abrir mesa..."
                            : aCarregarPagamentos
                              ? "A carregar pagamentos..."
                              : "Pagar agora"}
                        </span>

                        <span className="mt-0.5 block text-[11px] font-semibold text-emerald-50/90">
                          Abre a mesa e segue diretamente para pagamentos
                        </span>
                      </span>
                    </span>

                    <strong className="shrink-0 text-lg font-black">
                      {formatarValor(
                        totalEditor,
                      )}
                    </strong>
                  </button>
                )}

                {/* ============================================================
                    PAGAMENTO
                    ============================================================ */}

                {modoEditor === "CONTA" && (
                  <button
                    type="button"
                    onClick={() =>
                      void abrirPagamentos()
                    }
                    disabled={
                      aEnviar ||
                      aSairMesa ||
                      aAdicionarPrograma ||
                      aCarregarPagamentos ||
                      !contaCarregada ||
                      linhasEditor.length === 0 ||
                      totalEditor <= 0 ||
                      temAlteracoesPendentes ||
                      temPrecosPendentes
                    }
                    title={
                      temAlteracoesPendentes
                        ? "Envie primeiro os produtos novos."
                        : temPrecosPendentes
                          ? "Resolva primeiro os preços pendentes."
                          : "Pagar esta conta."
                    }
                    className="group mt-3 flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-emerald-600 bg-emerald-600 px-4 py-3 text-white shadow-md shadow-emerald-600/15 transition hover:border-emerald-700 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:border-emerald-200 disabled:bg-emerald-200 disabled:text-white/80 disabled:shadow-none"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="2"
                          />

                          <path
                            strokeLinecap="round"
                            d="M3 10h18M7 15h3"
                          />
                        </svg>
                      </span>

                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-black">
                          Pagar conta
                        </span>

                        <span className="mt-0.5 block text-[10px] font-semibold text-emerald-100">
                          Escolher forma de pagamento
                        </span>
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <strong className="block text-xl font-black tracking-tight">
                        {formatarValor(
                          totalEditor,
                        )}
                      </strong>

                      <span className="block text-[9px] font-bold uppercase tracking-wide text-emerald-100">
                        Total
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ============================================================
          PEDIDO MOBILE

          A partir de lg o painel lateral original continua a ser usado.
          Em mobile esta barra fica sempre visível e abre o pedido como
          bottom sheet, evitando obrigar o operador a fazer scroll até ao
          final do catálogo.
          ============================================================ */}

      <div
        className={[
          "fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur transition-colors duration-200 lg:hidden",
          produtoAdicionadoFeedback
            ? "border-blue-300 bg-blue-50/95"
            : "border-slate-200",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() =>
            setMostrarPedidoMobile(true)
          }
          aria-expanded={
            mostrarPedidoMobile
          }
          aria-controls="pedido-mobile-sheet"
          className={[
            "mx-auto flex w-full max-w-2xl touch-manipulation items-center gap-3 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] text-left transition-all duration-150 active:bg-slate-50",
            produtoAdicionadoFeedback
              ? "scale-[1.01]"
              : "",
          ].join(" ")}
        >
          <span
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-all duration-150",
              produtoAdicionadoFeedback
                ? "scale-110 bg-emerald-600 shadow-emerald-600/20"
                : "bg-blue-600 shadow-blue-600/20",
            ].join(" ")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 4h13"
              />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-950">
                Pedido
              </span>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                {totalItensPedido}
              </span>
            </div>

            <p
              className={[
                "truncate text-[10px] font-semibold transition-colors",
                produtoAdicionadoFeedback
                  ? "text-emerald-700"
                  : "text-slate-400",
              ].join(" ")}
            >
              {produtoAdicionadoFeedback ? (
                <>✓ Produto adicionado</>
              ) : (
                <>
                  {totalLinhasExistentes}{" "}
                  existentes
                  {" · "}
                  {totalLinhasNovas} novos
                </>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <strong className="block whitespace-nowrap text-base font-black text-slate-950">
              {formatarValor(totalEditor)}
            </strong>

            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
              {totalItensPedido === 1
                ? "1 item"
                : `${totalItensPedido} itens`}
            </span>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m6 15 6-6 6 6"
              />
            </svg>
          </span>
        </button>
      </div>

      {mostrarPedidoMobile && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Fechar pedido"
            onClick={() =>
              setMostrarPedidoMobile(
                false,
              )
            }
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
          />

          <section
            id="pedido-mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Pedido"
            className="absolute inset-x-0 bottom-0 flex h-[82dvh] max-h-[82dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-slate-200 bg-white shadow-2xl"
          >
            <div className="shrink-0 pt-2">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300" />
            </div>

            <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 4h13"
                  />
                </svg>
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Pedido
                </h2>

                <p className="text-xs font-semibold text-slate-400">
                  {totalItensPedido === 1
                    ? "1 item"
                    : `${totalItensPedido} itens`}
                  {" · "}
                  {formatarValor(
                    totalEditor,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarPedidoMobile(
                    false,
                  )
                }
                aria-label="Fechar pedido"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:bg-slate-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
              <EditorPedidoTable
                modoMobile
                linhas={linhasEditor}
                idLinhaSelecionada={
                  idLinhaSelecionada
                }
                idComponenteSelecionado={
                  idComponenteProgramaSelecionado
                }
                onSelecionarLinha={(
                  idLinha,
                ) => {
                  setIdLinhaSelecionada(
                    idLinha,
                  );

                  setIdComponenteProgramaSelecionado(
                    null,
                  );

                  setMensagemErroOperacao(
                    "",
                  );
                }}
                onSelecionarComponente={(
                  idLinha,
                  idComponente,
                ) => {
                  setIdLinhaSelecionada(
                    idLinha,
                  );

                  setIdComponenteProgramaSelecionado(
                    idComponente,
                  );

                  setMensagemErroOperacao(
                    "",
                  );
                }}
                onAlterarQuantidade={(
                  idLinha,
                  incremento,
                ) => {
                  alterarQuantidade(
                    idLinha,
                    incremento,
                  );
                }}
                onRemoverLinha={(
                  idLinha,
                ) => {
                  removerLinha(
                    idLinha,
                  );
                }}
              />
            </div>

            {(linhaSelecionada ||
              componenteProgramaSelecionado) && (
              <div className="shrink-0 border-t border-slate-100 px-3 py-2">
                <div className="rounded-2xl bg-slate-50 p-2">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <p className="min-w-0 flex-1 truncate text-xs font-black text-slate-800">
                      {componenteProgramaSelecionado
                        ?.componente
                        .descricao ??
                        linhaSelecionada
                          ?.descricao}
                    </p>

                    <span className="shrink-0 text-[10px] font-bold text-slate-400">
                      Qtd. {
                        componenteProgramaSelecionado
                          ?.componente.quantidade ??
                        linhaSelecionada
                          ?.quantidade ??
                        0
                      }
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarPedidoMobile(
                          false,
                        );

                        abrirAlterarQuantidadeLinha();
                      }}
                      disabled={
                        componenteProgramaSelecionado !==
                          null ||
                        aEnviar ||
                        aSairMesa ||
                        aAlterarQuantidadeLinha
                      }
                      className="h-10 rounded-xl border border-violet-200 bg-violet-50 text-[11px] font-black text-violet-700 transition disabled:opacity-40"
                    >
                      Quantidade
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMostrarPedidoMobile(
                          false,
                        );

                        abrirComentariosLinhaSelecionada();
                      }}
                      disabled={
                        aEnviar ||
                        aSairMesa ||
                        aGravarComentariosLinha
                      }
                      className="h-10 rounded-xl border border-blue-200 bg-blue-50 text-[11px] font-black text-blue-700 transition disabled:opacity-40"
                    >
                      Comentário
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMostrarPedidoMobile(
                          false,
                        );

                        void abrirAnularLinha();
                      }}
                      disabled={
                        componenteProgramaSelecionado !==
                          null ||
                        aEnviar ||
                        aSairMesa
                      }
                      className="h-10 rounded-xl border border-red-200 bg-red-50 text-[11px] font-black text-red-700 transition disabled:opacity-40"
                    >
                      Anular
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-10px_25px_rgba(15,23,42,0.06)]">
              {temPrecosPendentes && (
                <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  Existem produtos sem preço
                  carregado. O total ainda não é
                  definitivo.
                </div>
              )}

              {mensagemErroOperacao && (
                <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {mensagemErroOperacao}
                </div>
              )}

              {mensagemOperacao && (
                <div className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  {mensagemOperacao}
                </div>
              )}

              {aAdicionarPrograma && (
                <div className="mb-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                  A preparar e adicionar o programa...
                </div>
              )}

              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    {modoEditor === "CONTA"
                      ? "Total da conta"
                      : "Total do pedido"}
                  </p>

                  <strong className="text-2xl font-black text-slate-950">
                    {formatarValor(
                      totalEditor,
                    )}
                  </strong>
                </div>

                {totalProdutosNovos >
                  0 && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-700">
                    {totalProdutosNovos}{" "}
                    {totalProdutosNovos === 1
                      ? "por enviar"
                      : "por enviar"}
                  </span>
                )}
              </div>

              {totalProdutosNovos > 0 ? (
                modoEditor === "ABERTURA" ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        void pagarPedidoAntesDeAbrir()
                      }
                      disabled={
                        aEnviar ||
                        aSairMesa ||
                        aAdicionarPrograma ||
                        aCarregarPagamentos ||
                        aPrepararPagamento ||
                        aEfetuarPagamento ||
                        linhasEditor.length === 0 ||
                        totalEditor <= 0 ||
                        totalProdutosNovos === 0 ||
                        temPrecosPendentes
                      }
                      className="flex h-14 w-full items-center justify-between rounded-2xl bg-emerald-600 px-4 text-white shadow-md shadow-emerald-600/20 transition active:scale-[0.99] disabled:bg-emerald-200"
                    >
                      <span className="text-left">
                        <span className="block text-sm font-black">
                          {aEnviar
                            ? "A abrir mesa..."
                            : aCarregarPagamentos
                              ? "A carregar pagamentos..."
                              : "Pagar agora"}
                        </span>

                        <span className="mt-0.5 block text-[10px] font-semibold text-emerald-50/90">
                          Abre a mesa e segue para pagamentos
                        </span>
                      </span>

                      <strong className="shrink-0 text-lg font-black">
                        {formatarValor(
                          totalEditor,
                        )}
                      </strong>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={
                          limparProdutosNovos
                        }
                        disabled={
                          totalProdutosNovos === 0 ||
                          aEnviar
                        }
                        className="h-11 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition disabled:opacity-40"
                      >
                        Limpar pedido
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMostrarPedidoMobile(
                            false,
                          );

                          void enviarProdutosNovos();
                        }}
                        disabled={
                          aEnviar ||
                          aAdicionarPrograma ||
                          linhasEditor.length === 0 ||
                          totalProdutosNovos === 0 ||
                          temPrecosPendentes
                        }
                        className="h-11 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 transition disabled:opacity-40"
                      >
                        {aEnviar
                          ? "A abrir..."
                          : "Abrir mesa"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                    <button
                      type="button"
                      onClick={
                        limparProdutosNovos
                      }
                      disabled={
                        totalProdutosNovos ===
                        0
                      }
                      className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition disabled:opacity-40"
                    >
                      Limpar novos
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMostrarPedidoMobile(
                          false,
                        );

                        void enviarProdutosNovos();
                      }}
                      disabled={
                        aEnviar ||
                        aAdicionarPrograma ||
                        linhasEditor.length ===
                          0 ||
                        totalProdutosNovos ===
                          0 ||
                        temPrecosPendentes
                      }
                      className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-md shadow-blue-600/20 transition disabled:bg-blue-300"
                    >
                      {aEnviar
                        ? "A enviar..."
                        : "Enviar novos"}
                    </button>
                  </div>
                )
              ) : modoEditor === "CONTA" ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarPedidoMobile(
                        false,
                      );

                      abrirSegueManual();
                    }}
                    disabled={
                      aEnviar ||
                      aSairMesa ||
                      aGerarConsultaMesa ||
                      aPrepararPagamento ||
                      aEfetuarPagamento ||
                      temAlteracoesPendentes
                    }
                    className="h-12 rounded-xl border border-amber-300 bg-amber-50 text-sm font-black text-amber-800 transition disabled:opacity-40"
                  >
                    Segue
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarPedidoMobile(
                        false,
                      );

                      void abrirPagamentos();
                    }}
                    disabled={
                      aEnviar ||
                      aSairMesa ||
                      aAdicionarPrograma ||
                      aCarregarPagamentos ||
                      !contaCarregada ||
                      linhasEditor.length === 0 ||
                      totalEditor <= 0 ||
                      temAlteracoesPendentes ||
                      temPrecosPendentes
                    }
                    className="h-12 rounded-xl bg-emerald-600 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition disabled:bg-emerald-200"
                  >
                    Pagar
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}

      <PagamentoDrawer
        aberto={
          mostrarPagamentos
        }
        descricaoMesa={
          dadosMesa?.descricaoMesa ??
          "Mesa"
        }
        descricaoConta={
          contaCarregada
            ? (
                contaCarregada.descricaoConta ||
                `Conta ${contaCarregada.idConta}`
              )
            : ""
        }
        total={
          totalEditor
        }
        numeroLinhas={
          linhasEditor.length
        }
        pagamentos={
          pagamentosPrincipais
        }
        pagamentosIndisponiveis={
          pagamentosIndisponiveis
        }
        clienteSelecionado={
          clienteSelecionado
        }
        idClienteIndiferenciado={
          contextoPosto?.operacao
            .idClienteIndiferenciado ??
          0
        }
        pesquisa={
          pesquisaPagamento
        }
        aCarregar={
          aCarregarPagamentos
        }
        aEfetuarPagamento={
          aPrepararPagamento ||
          aEfetuarPagamento
        }
        idPagamentoEmProcessamento={
          idPagamentoEmProcessamento
        }
        mensagemErro={
          mensagemErroPagamentos
        }
        totalConfiguracoes={
          pagamentos.length
        }
        onPesquisaChange={(valor) => {
          setPesquisaPagamento(
            valor,
          );

          setMensagemErroPagamentos(
            "",
          );
        }}
        onSelecionarPagamento={(
          pagamento,
        ) => {
          void selecionarPagamento(
            pagamento,
          );
        }}
        onSelecionarCliente={
          abrirPesquisaCliente
        }
        onAtualizar={() => {
          void carregarPagamentos(
            true,
          );
        }}
        onFechar={
          fecharPagamentos
        }
      />

      <ReservasHotelModal
        open={
          mostrarReservasHotel
        }
        accessToken={
          contextoPagamentoPreparado
            ?.accessToken ??
          ""
        }
        busy={
          aAssociarReservaHotel
        }
        mensagemErro={
          mensagemErroPagamentos
        }
        onClose={
          fecharReservasHotel
        }
        onSelecionar={(
          reserva,
        ) => {
          void associarReservaHotel(
            reserva,
          );
        }}
      />

      <PagamentoConfirmacaoModal
        open={
          dadosPagamentoPreparado !==
            null &&
          !mostrarReservasHotel
        }
        dados={
          dadosPagamentoPreparado
        }
        cliente={
          contextoPagamentoPreparado
            ? {
                idEntidade:
                  contextoPagamentoPreparado.idCliente,

                nome:
                  contextoPagamentoPreparado.descricaoCliente,
              }
            : null
        }
        busy={
          aEfetuarPagamento
        }
        onClose={
          fecharConfirmacaoPagamento
        }
        onConfirm={(
          valores,
        ) => {
          void confirmarPagamentoPreparado(
            valores,
          );
        }}
      />

      <Modal>
        <Modal.Backdrop
          isOpen={
            mostrarConfirmacaoImpressao
          }
          isDismissable={
            false
          }
          isKeyboardDismissDisabled={
            true
          }
          variant="blur"
        >
          <Modal.Container
            placement="center"
            size="sm"
          >
            <Modal.Dialog
              aria-labelledby="titulo-confirmacao-impressao"
              aria-describedby="descricao-confirmacao-impressao"
            >
              {/*
                Não existe Modal.CloseTrigger de propósito.
                Só os botões Sim/Não podem fechar este modal.
              */}

              <Modal.Header>
                <Modal.Heading
                  id="titulo-confirmacao-impressao"
                >
                  Imprimir talão
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body>
                <p
                  id="descricao-confirmacao-impressao"
                  className="
                    text-sm
                    leading-6
                    text-slate-600
                  "
                >
                  A venda foi concluída.
                  Deseja imprimir o talão?
                </p>
              </Modal.Body>

              <Modal.Footer>
                <div
                  className="
                    grid
                    w-full
                    grid-cols-2
                    gap-3
                  "
                >
                  <button
                    type="button"
                    onClick={() => {
                      responderConfirmacaoImpressao(
                        false,
                      );
                    }}
                    className="
                      h-12
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      text-sm
                      font-black
                      text-slate-700
                      shadow-sm
                      transition
                      hover:bg-slate-50
                      active:scale-[0.99]
                    "
                  >
                    Não
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      responderConfirmacaoImpressao(
                        true,
                      );
                    }}
                    className="
                      h-12
                      rounded-xl
                      bg-emerald-600
                      text-sm
                      font-black
                      text-white
                      shadow-md
                      shadow-emerald-600/20
                      transition
                      hover:bg-emerald-700
                      active:scale-[0.99]
                    "
                  >
                    Sim
                  </button>
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {pagamentoIntegradoVisual &&
        !mostrarConfirmacaoImpressao && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7 animate-pulse"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="3"
                    width="14"
                    height="18"
                    rx="2"
                  />
                  <path
                    strokeLinecap="round"
                    d="M8 7h8M8 11h8M9 17h6"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
                  Pagamento TPA
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  A aguardar pagamento no terminal
                </h2>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

              <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                {formatarValor(
                  pagamentoIntegradoVisual.valor,
                )}
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {pagamentoIntegradoVisual.mensagem}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                  Estado
                </p>

                <p className="mt-1 truncate font-black text-slate-900">
                  {pagamentoIntegradoVisual.estado ||
                    "EM_PROCESSAMENTO"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                  Pedido
                </p>

                <p
                  className="mt-1 truncate font-mono text-xs font-bold text-slate-700"
                  title={
                    pagamentoIntegradoVisual.pedidoId
                  }
                >
                  {pagamentoIntegradoVisual.pedidoId ||
                    "A criar..."}
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-semibold leading-5 text-slate-500">
              Não feche esta janela nem repita o pagamento.
              Se houver uma falha de comunicação, o sistema
              retomará o mesmo pedido TPA.
            </p>
          </div>
        </div>
      )}

      {mostrarConfirmacaoConsultaMesa && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 3h9l3 3v15H6V3Z"
                />

                <path
                  strokeLinecap="round"
                  d="M9 10h6M9 14h6M9 18h4"
                />
              </svg>
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-violet-600">
              Consulta de Mesa
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Gerar Consulta de Mesa?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Será gerada a Consulta de Mesa de{" "}
              <strong>
                {dadosMesa?.descricaoMesa ??
                  "Mesa"}
              </strong>
              .
            </p>

            <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                    {modoEditor === "ABERTURA"
                      ? "Mesa por abrir"
                      : "Conta"}
                  </p>

                  <p className="mt-1 truncate font-black text-slate-950">
                    {contaCarregada
                      ? contaCarregada.descricaoConta ||
                        `Conta ${contaCarregada.idConta}`
                      : dadosMesa?.descricaoMesa ??
                        "Nova conta"}
                  </p>
                </div>

                <strong className="shrink-0 text-xl font-black text-violet-800">
                  {formatarValor(
                    totalEditor,
                  )}
                </strong>
              </div>
            </div>

            {modoEditor === "ABERTURA" ? (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-800">
                A mesa ainda não está gravada. Ao continuar, a mesa será aberta, os produtos serão gravados e só depois será gerada a Consulta de Mesa.
              </div>
            ) : totalProdutosNovos > 0 ? (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-800">
                Existem {totalProdutosNovos}{" "}
                {totalProdutosNovos === 1
                  ? "produto novo"
                  : "produtos novos"}
                . Serão gravados antes de gerar a Consulta de Mesa.
              </div>
            ) : (
              <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
                A conta já está atualizada. A Consulta de Mesa será gerada diretamente.
              </p>
            )}

            {deveAbrirSegueAoSair() && (
              <p className="mt-3 text-xs font-semibold leading-5 text-amber-700">
                Depois da Consulta, se existirem linhas pendentes para produção, será aberto o Segue para confirmar o envio à cozinha.
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setMostrarConfirmacaoConsultaMesa(
                    false,
                  )
                }
                disabled={
                  aGerarConsultaMesa ||
                  aEnviar
                }
                className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void gerarConsultaMesa()
                }
                disabled={
                  aGerarConsultaMesa ||
                  aEnviar
                }
                className="h-12 rounded-xl bg-violet-600 px-6 text-sm font-black text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aGerarConsultaMesa ||
                aEnviar
                  ? "A processar..."
                  : modoEditor ===
                      "ABERTURA"
                    ? "Abrir e gerar"
                    : totalProdutosNovos > 0
                      ? "Gravar e gerar"
                      : "Gerar Consulta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmacaoLinhasPrograma &&
        linhaSelecionada?.tipoItem ===
          "PROGRAMA" && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                Produto-menu
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Atualizar componentes?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Deseja atualizar proporcionalmente as quantidades
                das linhas do menu
                {" "}
                <strong>
                  {linhaSelecionada.descricao}
                </strong>
                ?
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  disabled={
                    aAlterarQuantidadeLinha
                  }
                  onClick={() =>
                    setMostrarConfirmacaoLinhasPrograma(
                      false,
                    )
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={
                    aAlterarQuantidadeLinha
                  }
                  onClick={() => {
                    void confirmarAlteracaoQuantidadeLinha(
                      false,
                    );
                  }}
                  className="h-12 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                >
                  Não
                </button>

                <button
                  type="button"
                  disabled={
                    aAlterarQuantidadeLinha
                  }
                  onClick={() => {
                    void confirmarAlteracaoQuantidadeLinha(
                      true,
                    );
                  }}
                  className="h-12 rounded-xl bg-violet-600 px-4 text-sm font-black text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {aAlterarQuantidadeLinha
                    ? "A atualizar..."
                    : "Sim"}
                </button>
              </div>
            </div>
          </div>
        )}

      {operacaoLinhaAberta &&
        linhaSelecionada && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Operação da linha
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {operacaoLinhaAberta ===
                  "QUANTIDADE"
                    ? "Alterar quantidade"
                    : "Anular linha"}
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {linhaSelecionada.descricao}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharOperacaoLinha
                }
                disabled={
                  aAnularLinha ||
                  aAlterarQuantidadeLinha
                }
                aria-label="Fechar operação da linha"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              </button>
            </div>

            {operacaoLinhaAberta ===
            "QUANTIDADE" ? (
              <>
                <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={
                        aAlterarQuantidadeLinha
                      }
                      onClick={() => {
                        const valorAtual =
                          Number(
                            quantidadeOperacaoLinha
                              .replace(
                                ",",
                                ".",
                              ),
                          ) || 0;

                        setQuantidadeOperacaoLinha(
                          String(
                            Math.max(
                              0,
                              valorAtual -
                                1,
                            ),
                          ),
                        );

                        setMensagemErroOperacaoLinha(
                          "",
                        );
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-200 bg-white text-2xl font-black text-violet-700 transition hover:bg-violet-100"
                    >
                      −
                    </button>

                    <input
                      type="text"
                      inputMode="decimal"
                      disabled={
                        aAlterarQuantidadeLinha
                      }
                      value={
                        quantidadeOperacaoLinha
                      }
                      onChange={(event) => {
                        setQuantidadeOperacaoLinha(
                          event.target.value,
                        );

                        setMensagemErroOperacaoLinha(
                          "",
                        );
                      }}
                      className="h-14 w-32 rounded-2xl border border-violet-200 bg-white text-center text-2xl font-black text-slate-950 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      autoFocus
                    />

                    <button
                      type="button"
                      disabled={
                        aAlterarQuantidadeLinha
                      }
                      onClick={() => {
                        const valorAtual =
                          Number(
                            quantidadeOperacaoLinha
                              .replace(
                                ",",
                                ".",
                              ),
                          ) || 0;

                        setQuantidadeOperacaoLinha(
                          String(
                            valorAtual +
                              1,
                          ),
                        );

                        setMensagemErroOperacaoLinha(
                          "",
                        );
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-200 bg-white text-2xl font-black text-violet-700 transition hover:bg-violet-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {linhaSelecionada.origem ===
                  "EXISTENTE" && (
                  <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold leading-6 text-violet-800">
                    A alteração será gravada imediatamente. Linhas já enviadas para produção, linhas internas de menus e itens incluídos no hotel serão recusados pela API.
                  </div>
                )}
              </>
            ) : (
              <>
                {linhaSelecionada.origem ===
                "NOVA" ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="font-black text-red-800">
                      Confirma a remoção desta linha?
                    </p>

                    <p className="mt-2 text-sm leading-6 text-red-700">
                      A linha ainda não foi gravada e será apenas removida do pedido atual.
                    </p>
                  </div>
                ) : aPrepararAnulacao ? (
                  <div className="mt-6 flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <div className="text-center">
                      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />

                      <p className="mt-3 text-sm font-bold text-slate-600">
                        A validar as regras da anulação...
                      </p>
                    </div>
                  </div>
                ) : dadosPreparacaoAnulacao ? (
                  <div className="mt-6 space-y-4">
                    <div
                      className={[
                        "rounded-2xl border p-4",
                        dadosPreparacaoAnulacao.podeAnular
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-amber-50",
                      ].join(" ")}
                    >
                      <p
                        className={[
                          "font-black",
                          dadosPreparacaoAnulacao.podeAnular
                            ? "text-red-800"
                            : "text-amber-800",
                        ].join(" ")}
                      >
                        {dadosPreparacaoAnulacao.podeAnular
                          ? "Confirma a anulação desta linha?"
                          : "Esta linha não pode ser anulada"}
                      </p>

                      <p
                        className={[
                          "mt-2 text-sm leading-6",
                          dadosPreparacaoAnulacao.podeAnular
                            ? "text-red-700"
                            : "text-amber-700",
                        ].join(" ")}
                      >
                        {dadosPreparacaoAnulacao.mensagemRegra}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {dadosPreparacaoAnulacao.jaImpresso && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-800">
                            Será comunicada à cozinha
                          </span>
                        )}

                        {dadosPreparacaoAnulacao.registoEntrada && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-800">
                            Motivo obrigatório
                          </span>
                        )}

                        {dadosPreparacaoAnulacao.ePrograma && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-black text-violet-800">
                            Menu · {dadosPreparacaoAnulacao.idLinhasAfetadas.length} linhas
                          </span>
                        )}
                      </div>
                    </div>

                    {dadosPreparacaoAnulacao.podeAnular &&
                      dadosPreparacaoAnulacao.exigeMotivo && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label
                          htmlFor="motivoAnulacaoLinha"
                          className="block text-sm font-black text-slate-800"
                        >
                          Motivo da anulação
                        </label>

                        <select
                          id="motivoAnulacaoLinha"
                          value={
                            idMotivoAnulacao
                          }
                          onChange={(event) => {
                            setIdMotivoAnulacao(
                              event.target.value,
                            );

                            setJustificacaoAnulacao(
                              "",
                            );

                            setMensagemErroOperacaoLinha(
                              "",
                            );
                          }}
                          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        >
                          <option value="">
                            Selecione o motivo
                          </option>

                          {dadosPreparacaoAnulacao.motivos.map(
                            (motivo) => (
                              <option
                                key={
                                  motivo.idMotivo
                                }
                                value={
                                  motivo.idMotivo
                                }
                              >
                                {motivo.descricao}
                              </option>
                            ),
                          )}
                        </select>

                        {motivoAnulacaoSelecionado
                          ?.obrigaJustificacao && (
                          <div className="mt-4">
                            <label
                              htmlFor="justificacaoAnulacaoLinha"
                              className="block text-sm font-black text-slate-800"
                            >
                              Justificação
                            </label>

                            <textarea
                              id="justificacaoAnulacaoLinha"
                              value={
                                justificacaoAnulacao
                              }
                              onChange={(event) => {
                                setJustificacaoAnulacao(
                                  event.target.value,
                                );

                                setMensagemErroOperacaoLinha(
                                  "",
                                );
                              }}
                              rows={3}
                              maxLength={1000}
                              placeholder="Indique a justificação da anulação..."
                              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                            />

                            <p className="mt-1 text-right text-[11px] font-semibold text-slate-400">
                              {justificacaoAnulacao.length}/1000
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {dadosPreparacaoAnulacao.podeAnular &&
                      dadosPreparacaoAnulacao.jaImpresso && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
                        A linha já foi enviada para produção. Depois da anulação, será emitido o respetivo talão para a cozinha.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="font-black text-red-800">
                      Não foi possível validar a anulação
                    </p>

                    <p className="mt-2 text-sm leading-6 text-red-700">
                      Feche esta janela e tente novamente.
                    </p>
                  </div>
                )}
              </>
            )}

            {mensagemErroOperacaoLinha && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {
                  mensagemErroOperacaoLinha
                }
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  fecharOperacaoLinha
                }
                disabled={
                  aAnularLinha ||
                  aAlterarQuantidadeLinha
                }
                className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    operacaoLinhaAberta ===
                    "QUANTIDADE"
                  ) {
                    void confirmarAlteracaoQuantidadeLinha();
                    return;
                  }

                  void confirmarAnulacaoLinha();
                }}
                disabled={
                  aAnularLinha ||
                  aAlterarQuantidadeLinha ||
                  (
                    operacaoLinhaAberta ===
                      "ANULAR" &&
                    linhaSelecionada.origem ===
                      "EXISTENTE" &&
                    (
                      aPrepararAnulacao ||
                      !dadosPreparacaoAnulacao ||
                      !dadosPreparacaoAnulacao.podeAnular
                    )
                  )
                }
                className={[
                  "h-12 rounded-xl px-6 text-sm font-black text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-50",
                  operacaoLinhaAberta ===
                  "QUANTIDADE"
                    ? "bg-violet-600 shadow-violet-600/20 hover:bg-violet-700"
                    : "bg-red-600 shadow-red-600/20 hover:bg-red-700",
                ].join(" ")}
              >
                {operacaoLinhaAberta ===
                "QUANTIDADE"
                  ? aAlterarQuantidadeLinha
                    ? "A atualizar..."
                    : "Alterar quantidade"
                  : linhaSelecionada.origem ===
                      "NOVA"
                    ? "Remover linha"
                    : aPrepararAnulacao
                      ? "A validar..."
                      : aAnularLinha
                        ? "A anular..."
                        : dadosPreparacaoAnulacao
                            ?.jaImpresso
                          ? "Anular e imprimir"
                          : "Anular linha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarAlterarClientes && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Mesa / conta
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Alterar número de clientes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {dadosMesa?.descricaoMesa ??
                    "Mesa"}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharAlterarNumeroClientes
                }
                disabled={
                  aAlterarNumeroClientes
                }
                aria-label="Fechar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <button
                type="button"
                onClick={() => {
                  const valorAtual =
                    Number(
                      numeroClientesIntroduzido,
                    ) || 1;

                  setNumeroClientesIntroduzido(
                    String(
                      Math.max(
                        1,
                        valorAtual - 1,
                      ),
                    ),
                  );

                  setMensagemErroClientes(
                    "",
                  );
                }}
                disabled={
                  aAlterarNumeroClientes
                }
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-white text-2xl font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                −
              </button>

              <input
                type="number"
                min={1}
                step={1}
                disabled={
                  aAlterarNumeroClientes
                }
                value={
                  numeroClientesIntroduzido
                }
                onChange={(event) => {
                  setNumeroClientesIntroduzido(
                    event.target.value,
                  );

                  setMensagemErroClientes(
                    "",
                  );
                }}
                className="h-14 w-28 rounded-2xl border border-emerald-200 bg-white text-center text-2xl font-black text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                autoFocus
              />

              <button
                type="button"
                onClick={() => {
                  const valorAtual =
                    Number(
                      numeroClientesIntroduzido,
                    ) || 0;

                  setNumeroClientesIntroduzido(
                    String(
                      valorAtual + 1,
                    ),
                  );

                  setMensagemErroClientes(
                    "",
                  );
                }}
                disabled={
                  aAlterarNumeroClientes
                }
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-white text-2xl font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>

            {modoEditor === "CONTA" &&
              contaCarregada && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                Valor atual da conta:{" "}
                <strong>
                  {contaCarregada.numeroPessoas}
                </strong>{" "}
                {contaCarregada.numeroPessoas === 1
                  ? "cliente"
                  : "clientes"}.
                A alteração será gravada imediatamente.
              </div>
            )}

            {mensagemErroClientes && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {
                  mensagemErroClientes
                }
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  fecharAlterarNumeroClientes
                }
                disabled={
                  aAlterarNumeroClientes
                }
                className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void confirmarAlteracaoNumeroClientes()
                }
                disabled={
                  aAlterarNumeroClientes
                }
                className="h-12 rounded-xl bg-emerald-600 px-6 text-sm font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aAlterarNumeroClientes
                  ? "A atualizar..."
                  : modoEditor === "CONTA" &&
                      contaCarregada
                    ? "Gravar alteração"
                    : "Atualizar clientes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarConfirmacaoSaida && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Existem produtos por gravar
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Foram adicionados {totalProdutosNovos}{" "}
              {totalProdutosNovos === 1
                ? "produto"
                : "produtos"}{" "}
              ao pedido. Escolha como pretende sair da mesa.
            </p>

            {temPrecosPendentes && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Existem produtos sem preço definido. Resolva os preços antes de gravar.
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  setMostrarConfirmacaoSaida(false)
                }
                disabled={aEnviar || aSairMesa}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continuar
              </button>

              <button
                type="button"
                onClick={() =>
                  void sairSemGravar()
                }
                disabled={aEnviar || aSairMesa}
                className="h-12 rounded-xl border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sair sem gravar
              </button>

              <button
                type="button"
                onClick={() =>
                  void gravarESair()
                }
                disabled={
                  aEnviar ||
                  aSairMesa ||
                  temPrecosPendentes ||
                  totalProdutosNovos === 0
                }
                className="h-12 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {aEnviar
                  ? "A gravar..."
                  : "Gravar e sair"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contaSeguePendente && (
        <SeguePedidoModal
          aberto={
            mostrarSegue
          }
          descricaoMesa={
            dadosMesa?.descricaoMesa ??
            "Mesa"
          }
          idMovimentoMesa={
            contaSeguePendente
              .idMovimentoMesa
          }
          idInternoConta={
            contaSeguePendente
              .idInternoConta
          }
          onEnviado={async () => {
            /*
              O envio foi concluído.

              Fechamos o Segue, libertamos a utilização da mesa e
              regressamos à lista de Mesas.
            */
            setMostrarSegue(false);
            setContaSeguePendente(
              null,
            );
            setAcaoAposSegue(
              null,
            );

            await concluirSaidaEditor();
          }}
          onFechar={() => {
            /*
              Fechar o Segue NÃO obriga o operador a enviar para a cozinha.

              A conta e os pedidos pendentes continuam persistidos.
              Libertamos apenas a utilização da mesa e regressamos às Mesas.

              Quando a mesa for reaberta, o botão Segue estará disponível
              junto da Consulta para retomar o envio.
            */
            setMostrarSegue(false);
            setContaSeguePendente(
              null,
            );
            setAcaoAposSegue(
              null,
            );

            void concluirSaidaEditor();
          }}
        />
      )}

      <ProgramaParcialModal
        aberto={
          programaParcialPendente !==
          null
        }
        programa={
          programaParcialPendente
            ?.programa ??
          null
        }
        aConfirmar={
          aAdicionarPrograma
        }
        onFechar={() => {
          if (
            aAdicionarPrograma
          ) {
            return;
          }

          setProgramaParcialPendente(
            null,
          );
        }}
        onConfirmar={
          confirmarProgramaParcial
        }
      />

      <ComentarioProdutoModal
        aberto={
          produtoPendenteComentario !==
            null ||
          idLinhaComentarioEmEdicao !==
            null
        }
        idGrupoComentario={
          produtoPendenteComentario
            ? produtoPendenteComentario
                .botao.idGrupoComentario ??
              0
            : idLinhaComentarioEmEdicao
              ? 0
              : null
        }
        nomeProduto={
          produtoPendenteComentario
            ?.botao.descricao ??
          componenteComentarioEmEdicao
            ?.componente.descricao ??
          linhaComentarioEmEdicao
            ?.descricao ??
          ""
        }
        comentariosIniciais={
          produtoPendenteComentario
            ? COMENTARIOS_INICIAIS_VAZIOS
            : componenteComentarioEmEdicao
                ?.componente.comentarios ??
              linhaComentarioEmEdicao
                ?.comentarios ??
              COMENTARIOS_INICIAIS_VAZIOS
        }
        aConfirmar={
          aGravarComentariosLinha
        }
        erroConfirmacao={
          mensagemErroComentariosLinha
        }
        onFechar={
          fecharModalComentarios
        }
        onConfirmar={(comentarios) => {
          if (produtoPendenteComentario) {
            confirmarComentariosProduto(
              comentarios,
            );

            return;
          }

          void confirmarComentariosLinha(
            comentarios,
          );
        }}
      />

      <PesquisarClienteModal
        aberto={
          mostrarPesquisarCliente
        }
        accessToken={
          accessTokenCliente
        }
        idClienteIndiferenciado={
          contextoPosto?.operacao
            .idClienteIndiferenciado ??
          0
        }
        clienteSelecionado={
          clienteSelecionado
        }
        onSelecionar={(cliente) => {
          setClienteSelecionado(
            cliente,
          );

          setMensagemErroPagamentos(
            "",
          );

          fecharPesquisaCliente();
        }}
        onFechar={
          fecharPesquisaCliente
        }
      />

      <PrecoProdutoModal
        aberto={
          botaoPrecoEmEdicao !==
          null
        }
        nomeProduto={
          botaoPrecoEmEdicao
            ?.descricao ??
          ""
        }
        precoInicial={
          botaoPrecoEmEdicao
            ?.preco ??
          0
        }
        motivos={[
          "Preço acordado",
          "Produto especial",
          "Preço autorizado",
          "Outro motivo",
        ]}
        onFechar={() => {
          setBotaoPrecoEmEdicao(
            null,
          );
        }}
        onConfirmar={({
          preco,
          justificacao,
        }) => {
          if (!botaoPrecoEmEdicao) {
            return;
          }

          const botao =
            botaoPrecoEmEdicao;

          setBotaoPrecoEmEdicao(
            null,
          );

          prepararAdicaoProdutoResolvido(
            botao,
            preco,
            true,
            justificacao,
          );
        }}
      />
    </main>
  );
}