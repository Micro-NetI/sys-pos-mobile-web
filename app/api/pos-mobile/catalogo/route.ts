
//app\api\pos-mobile\catalogo\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPosMobileApi,
} from "@/lib/pos-mobile-api";

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

function criarRespostaErro(
  codigo: string,
  mensagem: string,
): POSMobileCatalogoResponse {
  return {
    sucesso: false,
    codigo,
    mensagem,
    versaoContrato: "1.0",
    dados: null,
  };
}

function obterInteiroPositivo(
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

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const idPosto =
      obterInteiroPositivo(
        request.nextUrl.searchParams.get(
          "idPosto",
        ),
      );

    const idSala =
      obterInteiroPositivo(
        request.nextUrl.searchParams.get(
          "idSala",
        ),
      );

    console.log(
      "========== ROTA CATÁLOGO POS MOBILE ==========",
    );

    console.log(
      "ID do posto recebido:",
      idPosto,
    );

    console.log(
      "ID da sala recebida:",
      idSala,
    );

    if (idPosto <= 0) {
      return NextResponse.json(
        criarRespostaErro(
          "POSTO_INVALIDO",
          "O identificador do posto deve ser um número inteiro superior a zero.",
        ),
        {
          status: 400,
        },
      );
    }

    if (idSala <= 0) {
      return NextResponse.json(
        criarRespostaErro(
          "SALA_INVALIDA",
          "O identificador da sala deve ser um número inteiro superior a zero.",
        ),
        {
          status: 400,
        },
      );
    }

    const endpoint =
      `CatalogoPosto/${idPosto}/${idSala}`;

    console.log(
      "Endpoint enviado à APIFNT:",
      endpoint,
    );

    const resultado =
      await getPosMobileApi<
        POSMobileCatalogoResponse
      >(
        endpoint,
      );

    console.log(
      "Resposta do catálogo recebida da APIFNT:",
      resultado,
    );

    if (
      !resultado.sucesso ||
      !resultado.dados
    ) {
      return NextResponse.json(
        resultado,
        {
          status: 400,
        },
      );
    }

    console.log(
      "Contexto do catálogo:",
      resultado.dados.contexto,
    );

    console.log(
      "Total de grupos:",
      resultado.dados.grupos.length,
    );

    const totalPaginas =
      resultado.dados.grupos.reduce(
        (total, grupo) =>
          total +
          grupo.paginas.length,
        0,
      );

    const totalBotoes =
      resultado.dados.grupos.reduce(
        (totalGrupos, grupo) =>
          totalGrupos +
          grupo.paginas.reduce(
            (
              totalPaginasGrupo,
              pagina,
            ) =>
              totalPaginasGrupo +
              pagina.botoes.length,
            0,
          ),
        0,
      );

    console.log(
      "Total de páginas:",
      totalPaginas,
    );

    console.log(
      "Total de botões:",
      totalBotoes,
    );

    return NextResponse.json(
      resultado,
      {
        status: 200,
      },
    );
  } catch (error) {
    const mensagemTecnica =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    console.error(
      "Erro ao carregar catálogo:",
      mensagemTecnica,
    );

    return NextResponse.json(
      criarRespostaErro(
        "ERRO_CATALOGO",
        "Não foi possível carregar o catálogo de produtos.",
      ),
      {
        status: 500,
      },
    );
  }
}