//app\api\pos-mobile\dados-segue-conta\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileDadosSegueConta,
  POSMobileDadosSegueContaResposta,
} from "@/types/impressao";

export const dynamic =
  "force-dynamic";

interface DadosSegueContaPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
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

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobileDadosSegueContaResposta> {
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
): Promise<
  NextResponse<POSMobileDadosSegueContaResposta>
> {
  let pedido:
    DadosSegueContaPedido;

  try {
    pedido =
      (await request.json()) as
        DadosSegueContaPedido;
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

  try {
    const resultado =
      await callPosMobileApi<POSMobileDadosSegueConta>(
        "DadosSegueConta",
        {
          accessToken:
            pedido.accessToken.trim(),
          idMovimentoMesa:
            pedido.idMovimentoMesa,
          idInternoConta:
            pedido.idInternoConta,
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
          : resultado.codigo ===
              "SEGUE_EM_PROCESSAMENTO"
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
      "Erro ao obter dados do segue:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_SEGUE",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
