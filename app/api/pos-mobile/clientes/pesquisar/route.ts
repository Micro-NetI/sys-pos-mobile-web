//app\api\pos-mobile\clientes\pesquisar\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobilePesquisarClientesResposta,
} from "@/types/pos-mobile-clientes";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

interface PesquisarClientesPedido {
  accessToken: string;
  pesquisa: string;
  limite?: number;
}

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse {
  return NextResponse.json(
    {
      sucesso: false,
      codigo,
      mensagem,
      versaoContrato: "1.0",
      dados: null,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    },
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    PesquisarClientesPedido;

  try {
    pedido =
      (await request.json()) as
        PesquisarClientesPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  /*
    ================================================================
    TOKEN
    ================================================================
  */

  if (
    typeof pedido?.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return respostaErro(
      401,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  /*
    ================================================================
    PESQUISA
    ================================================================
  */

  if (
    typeof pedido?.pesquisa !==
      "string" ||
    pedido.pesquisa.trim() === ""
  ) {
    return respostaErro(
      400,
      "PESQUISA_CLIENTE_OBRIGATORIA",
      "Indique o NIF, nome ou número do cliente.",
    );
  }

  const pesquisa =
    pedido.pesquisa.trim();

  /*
    Não bloqueamos aqui pesquisas numéricas
    de apenas um carácter porque podem representar
    diretamente o ID de um cliente, por exemplo 1.
  */

  if (
    pesquisa.length < 2 &&
    !/^\d+$/.test(pesquisa)
  ) {
    return respostaErro(
      400,
      "PESQUISA_CLIENTE_CURTA",
      "Indique pelo menos dois caracteres para pesquisar clientes.",
    );
  }

  /*
    ================================================================
    LIMITE
    ================================================================
  */

  let limite =
    typeof pedido.limite === "number" &&
    Number.isInteger(pedido.limite)
      ? pedido.limite
      : 50;

  if (limite <= 0) {
    limite =
      50;
  }

  if (limite > 100) {
    limite =
      100;
  }

  /*
    ================================================================
    APIFNT
    ================================================================
  */

  try {
    const resultado =
      await callPosMobileApi<POSMobilePesquisarClientesResposta>(
        "PesquisarClientes",
        {
          accessToken:
            pedido.accessToken.trim(),

          pesquisa,

          limite,
        },
      );

    /*
      ==============================================================
      STATUS HTTP
      ==============================================================

      O contrato funcional continua dentro do JSON,
      mas mapeamos os erros principais para HTTP.
    */

    const status =
      resultado.sucesso
        ? 200
        : [
              "TOKEN_OBRIGATORIO",
              "TOKEN_INVALIDO",
              "SESSAO_INVALIDA",
              "SESSAO_EXPIRADA",
            ].includes(
              resultado.codigo,
            )
          ? 401
          : [
                "PESQUISA_CLIENTE_OBRIGATORIA",
                "PESQUISA_CLIENTE_CURTA",
                "DADOS_PESQUISA_CLIENTES_INVALIDOS",
              ].includes(
                resultado.codigo,
              )
            ? 400
            : 500;

    return NextResponse.json(
      resultado,
      {
        status,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro ao pesquisar clientes no POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_CLIENTES",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}