import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileMonitorPedidosDados,
  POSMobileMonitorPedidosPedido,
  POSMobileMonitorPedidosResposta,
} from "@/types/pedidos-cozinha";

export const dynamic =
  "force-dynamic";

function criarRespostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobileMonitorPedidosResposta> {
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

function inteiroNaoNegativo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor >= 0
  );
}

function obterStatusErro(
  codigo: string,
): number {
  if (
    [
      "TOKEN_OBRIGATORIO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    codigo ===
    "CATEGORIA_PEDIDO_INVALIDA"
  ) {
    return 400;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<POSMobileMonitorPedidosResposta>
> {
  let pedido:
    POSMobileMonitorPedidosPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobileMonitorPedidosPedido;
  } catch {
    return criarRespostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  if (
    !pedido ||
    typeof pedido !== "object"
  ) {
    return criarRespostaErro(
      400,
      "DADOS_MONITOR_PEDIDOS_INVALIDOS",
      "Os dados para consultar o monitor de pedidos não foram enviados.",
    );
  }

  if (
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return criarRespostaErro(
      401,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  if (
    !inteiroNaoNegativo(
      pedido.idCategoriaPedido,
    )
  ) {
    return criarRespostaErro(
      400,
      "CATEGORIA_PEDIDO_INVALIDA",
      "A categoria de pedido deve ser zero ou um número inteiro positivo.",
    );
  }

  const pedidoNormalizado:
    POSMobileMonitorPedidosPedido =
    {
      accessToken:
        pedido.accessToken.trim(),

      idCategoriaPedido:
        pedido.idCategoriaPedido,
    };

  try {
    /*
     * DataSnap:
     *
     * Delphi:
     *   updateObterMonitorPedidos
     *
     * URL pública:
     *   ObterMonitorPedidos
     *
     * Mantém o mesmo padrão dos restantes
     * métodos update... da APIFNT.
     */
    const resultado =
      await callPosMobileApi<
        POSMobileMonitorPedidosDados
      >(
        "ObterMonitorPedidos",
        pedidoNormalizado,
      );

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : obterStatusErro(
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
      "Erro ao consultar o monitor de pedidos:",
      error,
    );

    return criarRespostaErro(
      502,
      "ERRO_MONITOR_PEDIDOS",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
