import {
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileCaixaDados,
} from "@/types/pos-mobile-caixa";

function statusResposta(
  sucesso: boolean,
  codigo: string,
): number {
  if (sucesso) {
    return 200;
  }

  switch (
    codigo
      .trim()
      .toUpperCase()
  ) {
    case "TOKEN_OBRIGATORIO":
    case "SESSAO_INVALIDA":
    case "SESSAO_EXPIRADA":
      return 401;

    case "CAIXA_NAO_CONFIGURADO":
    case "CAIXA_MAX_ABERTURAS":
    case "CAIXA_ESTADO_INVALIDO":
    case "CAIXA_NAO_ABERTO":
      return 409;

    case "POSTO_INVALIDO":
    case "CAIXA_NAO_EXISTE":
      return 400;

    default:
      return 400;
  }
}

export async function POST(
  request: Request,
) {
  let body:
    | {
        accessToken?: unknown;
      }
    | null = null;

  try {
    body =
      (await request.json()) as {
        accessToken?: unknown;
      };
  } catch {
    return NextResponse.json(
      {
        sucesso: false,
        codigo:
          "DADOS_CAIXA_INVALIDOS",
        mensagem:
          "Os dados para consultar o caixa são inválidos.",
        versaoContrato:
          "1.0",
        dados:
          null,
      },
      {
        status:
          400,
      },
    );
  }

  const accessToken =
    typeof body?.accessToken ===
    "string"
      ? body.accessToken.trim()
      : "";

  if (!accessToken) {
    return NextResponse.json(
      {
        sucesso: false,
        codigo:
          "TOKEN_OBRIGATORIO",
        mensagem:
          "O token da sessão deve ser indicado.",
        versaoContrato:
          "1.0",
        dados:
          null,
      },
      {
        status:
          401,
      },
    );
  }

  try {
    const resultado =
      await callPosMobileApi<
        POSMobileCaixaDados
      >(
        "EstadoCaixa",
        {
          accessToken,
        },
      );

    return NextResponse.json(
      resultado,
      {
        status:
          statusResposta(
            resultado.sucesso,
            resultado.codigo,
          ),
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro ao consultar o estado do caixa:",
      error,
    );

    return NextResponse.json(
      {
        sucesso: false,
        codigo:
          "ERRO_COMUNICACAO_CAIXA",
        mensagem:
          error instanceof Error
            ? error.message
            : "Não foi possível comunicar com a APIFNT.",
        versaoContrato:
          "1.0",
        dados:
          null,
      },
      {
        status:
          502,
      },
    );
  }
}