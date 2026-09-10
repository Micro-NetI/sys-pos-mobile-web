import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterEstadoPagamentoIntegrado,
} from "@/lib/pos-mobile-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EstadoPagamentoPedido {
  accessToken: string;
  pedidoId: string;
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

function obterStatusResposta(
  codigo: string,
): number {
  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    [
      "PAGAMENTO_INTEGRADO_NAO_ENCONTRADO",
      "PEDIDO_NAO_ENCONTRADO",
    ].includes(codigo)
  ) {
    return 404;
  }

  if (
    [
      "ERRO_COMUNICACAO_TPA",
      "TPA_INDISPONIVEL",
    ].includes(codigo)
  ) {
    return 502;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido: EstadoPagamentoPedido;

  try {
    pedido =
      (await request.json()) as EstadoPagamentoPedido;
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

  if (
    typeof pedido?.pedidoId !==
      "string" ||
    pedido.pedidoId.trim() === ""
  ) {
    return respostaErro(
      400,
      "PEDIDO_ID_OBRIGATORIO",
      "O identificador do pedido de pagamento deve ser indicado.",
    );
  }

  try {
    const resultado =
      await obterEstadoPagamentoIntegrado(
        pedido.accessToken.trim(),
        pedido.pedidoId.trim(),
      );

    const status =
      resultado.sucesso
        ? 200
        : obterStatusResposta(
            resultado.codigo,
          );

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
      "Erro ao consultar estado do pagamento integrado POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_ESTADO_PAGAMENTO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}