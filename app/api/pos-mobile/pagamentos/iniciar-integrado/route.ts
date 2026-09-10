// app/api/pos-mobile/pagamentos/iniciar-integrado/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  iniciarPagamentoIntegrado,
} from "@/lib/pos-mobile-api";

import type {
  PagamentoPedido,
} from "@/lib/pos-mobile-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;


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
      "ERRO_COMUNICACAO_TPA",
      "ERRO_ENVIO",
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
  let pedido: PagamentoPedido;

  try {
    pedido =
      (await request.json()) as PagamentoPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }


  /*
    TOKEN
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
    MOVIMENTO
  */

  if (
    !Number.isInteger(
      pedido.idMovimentoMesa,
    ) ||
    pedido.idMovimentoMesa <= 0
  ) {
    return respostaErro(
      400,
      "MOVIMENTO_MESA_INVALIDO",
      "O identificador do movimento da mesa é inválido.",
    );
  }


  /*
    CONTA
  */

  if (
    !Number.isInteger(
      pedido.idInternoConta,
    ) ||
    pedido.idInternoConta <= 0
  ) {
    return respostaErro(
      400,
      "CONTA_INVALIDA",
      "O identificador interno da conta é inválido.",
    );
  }


  /*
    PAGAMENTO
  */

  if (
    !Number.isInteger(
      pedido.idPagamentoDoc,
    ) ||
    pedido.idPagamentoDoc <= 0
  ) {
    return respostaErro(
      400,
      "PAGAMENTO_INVALIDO",
      "O identificador do pagamento é inválido.",
    );
  }


  /*
    CLIENTE
  */

  if (
    !pedido.cliente ||
    !Number.isInteger(
      pedido.cliente.idEntidade,
    ) ||
    pedido.cliente.idEntidade <= 0
  ) {
    return respostaErro(
      400,
      "CLIENTE_INVALIDO",
      "O cliente do pagamento deve ser indicado.",
    );
  }


  try {
    console.log(
      "========== NEXT - INICIAR PAGAMENTO INTEGRADO ==========",
    );

    console.log(
      "Pedido recebido:",
      {
        idMovimentoMesa:
          pedido.idMovimentoMesa,

        idInternoConta:
          pedido.idInternoConta,

        idPagamentoDoc:
          pedido.idPagamentoDoc,

        idEntidade:
          pedido.cliente.idEntidade,
      },
    );


    const resultado =
      await iniciarPagamentoIntegrado(
        {
          ...pedido,

          accessToken:
            pedido.accessToken.trim(),
        },
      );


    console.log(
      "Resposta APIFNT - IniciarPagamentoIntegrado:",
      resultado,
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
      "Erro ao iniciar pagamento integrado POS Mobile:",
      error,
    );


    return respostaErro(
      502,
      "ERRO_COMUNICACAO_PAGAMENTO_INTEGRADO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}