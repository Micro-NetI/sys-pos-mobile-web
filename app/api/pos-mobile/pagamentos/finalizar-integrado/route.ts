import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  finalizarPagamentoIntegrado,
} from "@/lib/pos-mobile-api";

import type {
  PagamentoPedido,
} from "@/lib/pos-mobile-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface FinalizarPagamentoPedido {
  accessToken: string;
  pedidoId: string;

  pagamento: Omit<
    PagamentoPedido,
    "accessToken"
  >;
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
      "PAGAMENTO_NAO_APROVADO",
      "VALOR_PAGAMENTO_ALTERADO",
      "PAGAMENTO_JA_ASSOCIADO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    FinalizarPagamentoPedido;

  try {
    pedido =
      (await request.json()) as
        FinalizarPagamentoPedido;
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

  if (
    !pedido.pagamento
  ) {
    return respostaErro(
      400,
      "DADOS_PAGAMENTO_INVALIDOS",
      "Os dados do pagamento devem ser indicados.",
    );
  }

  if (
    !Number.isInteger(
      pedido.pagamento
        .idMovimentoMesa,
    ) ||
    pedido.pagamento
      .idMovimentoMesa <= 0
  ) {
    return respostaErro(
      400,
      "MOVIMENTO_MESA_INVALIDO",
      "O identificador do movimento da mesa é inválido.",
    );
  }

  if (
    !Number.isInteger(
      pedido.pagamento
        .idInternoConta,
    ) ||
    pedido.pagamento
      .idInternoConta <= 0
  ) {
    return respostaErro(
      400,
      "CONTA_INVALIDA",
      "O identificador interno da conta é inválido.",
    );
  }

  if (
    !Number.isInteger(
      pedido.pagamento
        .idPagamentoDoc,
    ) ||
    pedido.pagamento
      .idPagamentoDoc <= 0
  ) {
    return respostaErro(
      400,
      "PAGAMENTO_INVALIDO",
      "O identificador do pagamento é inválido.",
    );
  }

  if (
    !pedido.pagamento.cliente ||
    !Number.isInteger(
      pedido.pagamento
        .cliente.idEntidade,
    ) ||
    pedido.pagamento
      .cliente.idEntidade <= 0
  ) {
    return respostaErro(
      400,
      "CLIENTE_INVALIDO",
      "O cliente do pagamento deve ser indicado.",
    );
  }

  try {
    const resultado =
      await finalizarPagamentoIntegrado(
        pedido.accessToken.trim(),
        pedido.pedidoId.trim(),
        pedido.pagamento,
      );

    /*
      JA_FINALIZADO é sucesso funcional.

      A APIFNT pode devolver o documento
      anteriormente associado ao pedido.
    */

    const sucesso =
      resultado.sucesso ||
      resultado.codigo ===
        "JA_FINALIZADO";

    const status =
      sucesso
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
      "Erro ao finalizar pagamento integrado POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_FINALIZAR_PAGAMENTO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}