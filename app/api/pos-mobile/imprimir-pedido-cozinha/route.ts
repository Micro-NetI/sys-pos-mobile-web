//app\api\pos-mobile\imprimir-pedido-cozinha\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileImprimirPedidoCozinhaDados,
  POSMobileImprimirPedidoCozinhaPedido,
  POSMobileImprimirPedidoCozinhaResposta,
} from "@/types/impressao";

export const dynamic =
  "force-dynamic";

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobileImprimirPedidoCozinhaResposta> {
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

function inteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
  );
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<POSMobileImprimirPedidoCozinhaResposta>
> {
  let pedido:
    POSMobileImprimirPedidoCozinhaPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobileImprimirPedidoCozinhaPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  if (
    !pedido ||
    typeof pedido !== "object"
  ) {
    return respostaErro(
      400,
      "DADOS_IMPRESSAO_INVALIDOS",
      "Os dados da impressão não foram enviados.",
    );
  }

  if (
    typeof pedido.accessToken !==
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
    !inteiroPositivo(
      pedido.idMovimentoMesa,
    )
  ) {
    return respostaErro(
      400,
      "MOVIMENTO_MESA_INVALIDO",
      "O identificador do movimento da mesa deve ser superior a zero.",
    );
  }

  if (
    !inteiroPositivo(
      pedido.idInternoConta,
    )
  ) {
    return respostaErro(
      400,
      "CONTA_INVALIDA",
      "O identificador interno da conta deve ser superior a zero.",
    );
  }

  if (
    !Array.isArray(
      pedido.idLinhas,
    ) ||
    pedido.idLinhas.length === 0
  ) {
    return respostaErro(
      400,
      "LINHAS_OBRIGATORIAS",
      "Selecione pelo menos uma linha para enviar para a cozinha.",
    );
  }

  const idLinhas =
    Array.from(
      new Set(
        pedido.idLinhas,
      ),
    );

  if (
    idLinhas.some(
      (idLinha) =>
        !inteiroPositivo(
          idLinha,
        ),
    )
  ) {
    return respostaErro(
      400,
      "LINHA_INVALIDA",
      "Todos os identificadores das linhas devem ser inteiros superiores a zero.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi<POSMobileImprimirPedidoCozinhaDados>(
        "ImprimirPedidoCozinha",
        {
          accessToken:
            pedido.accessToken.trim(),
          idMovimentoMesa:
            pedido.idMovimentoMesa,
          idInternoConta:
            pedido.idInternoConta,
          idLinhas,
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
          : [
                "LINHAS_SEGUE_INVALIDAS",
                "IMPRESSAO_EM_PROCESSAMENTO",
              ].includes(
                resultado.codigo,
              )
            ? 409
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
      "Erro ao imprimir pedido de cozinha:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_IMPRESSAO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
