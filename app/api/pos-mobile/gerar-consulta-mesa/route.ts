import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

interface GerarConsultaMesaPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
}

interface GerarConsultaMesaDados {
  idConsMovimento: number;
  idMovimentoMesa: number;
  idInternoConta: number;
}

interface GerarConsultaMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: GerarConsultaMesaDados | null;
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

function inteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
  );
}

function obterStatusErro(
  codigo: string,
): number {
  switch (codigo) {
    case "TOKEN_OBRIGATORIO":
    case "MOVIMENTO_MESA_INVALIDO":
    case "CONTA_INVALIDA":
    case "DADOS_CONSULTA_MESA_INVALIDOS":
    case "PEDIDO_INVALIDO":
      return 400;

    case "SESSAO_INVALIDA":
    case "SESSAO_SEM_POSTO":
    case "SESSAO_SEM_UTILIZADOR":
      return 401;

    case "CONSULTA_MESA_SEM_IDENTIFICADOR":
    case "ERRO_GERAR_CONSULTA_MESA":
      return 422;

    default:
      return 400;
  }
}

export async function POST(
  request: NextRequest,
) {
  let pedido:
    GerarConsultaMesaPedido;

  try {
    pedido =
      (await request.json()) as
        GerarConsultaMesaPedido;
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
      "DADOS_CONSULTA_MESA_INVALIDOS",
      "Os dados para gerar a Consulta de Mesa não foram enviados.",
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

  const pedidoNormalizado:
    GerarConsultaMesaPedido = {
      accessToken:
        pedido.accessToken.trim(),

      idMovimentoMesa:
        pedido.idMovimentoMesa,

      idInternoConta:
        pedido.idInternoConta,
    };

  try {
    const resultado =
      await callPosMobileApi<
        GerarConsultaMesaDados
      >(
        "GerarConsultaMesa",
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
      "[POSMobile][GerarConsultaMesa] Erro:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_CONSULTA_MESA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}