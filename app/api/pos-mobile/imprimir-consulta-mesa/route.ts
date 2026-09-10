import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

interface ImprimirConsultaMesaPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idConsMovimento: number;
}

interface ImprimirConsultaMesaDados {
  idMovimentoMesa: number;
  idInternoConta: number;
  idConsMovimento: number;
  idPosto: number;
}

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
) {
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
) {
  let pedido:
    ImprimirConsultaMesaPedido;

  try {
    pedido =
      (await request.json()) as
        ImprimirConsultaMesaPedido;
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
      "DADOS_IMPRESSAO_CONSULTA_INVALIDOS",
      "Os dados para imprimir a Consulta de Mesa não foram enviados.",
    );
  }

  if (
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return respostaErro(
      400,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  if (
    !Number.isInteger(
      pedido.idMovimentoMesa,
    ) ||
    pedido.idMovimentoMesa <= 0
  ) {
    return respostaErro(
      400,
      "MOVIMENTO_MESA_INVALIDO",
      "O movimento da mesa é inválido.",
    );
  }

  if (
    !Number.isInteger(
      pedido.idInternoConta,
    ) ||
    pedido.idInternoConta <= 0
  ) {
    return respostaErro(
      400,
      "CONTA_INVALIDA",
      "A conta é inválida.",
    );
  }

  if (
    !Number.isInteger(
      pedido.idConsMovimento,
    ) ||
    pedido.idConsMovimento <= 0
  ) {
    return respostaErro(
      400,
      "CONSULTA_MESA_INVALIDA",
      "A Consulta de Mesa é inválida.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi<
        ImprimirConsultaMesaDados
      >(
        "ImprimirConsultaMesa",
        {
          accessToken:
            pedido.accessToken.trim(),

          idMovimentoMesa:
            pedido.idMovimentoMesa,

          idInternoConta:
            pedido.idInternoConta,

          idConsMovimento:
            pedido.idConsMovimento,
        },
      );

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : 422,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "[POSMobile][ImprimirConsultaMesa]",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_IMPRESSAO_CONSULTA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}