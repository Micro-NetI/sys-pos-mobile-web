//app\api\pos-mobile\pagamentos\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobilePagamentosResposta,
} from "@/types/pos-mobile-pagamentos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PagamentosPedido {
  accessToken: string;
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
  let pedido: PagamentosPedido;

  try {
    pedido =
      (await request.json()) as PagamentosPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

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

  try {
    const resultado =
      await callPosMobileApi<POSMobilePagamentosResposta>(
        "PagamentosDisponiveis",
        {
          accessToken:
            pedido.accessToken.trim(),
        },
      );

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
          : 400;

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
      "Erro ao carregar pagamentos POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_PAGAMENTOS",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}