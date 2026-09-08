import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

interface LogoutPedido {
  accessToken?: string;
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
  let pedido: LogoutPedido;

  try {
    pedido =
      (await request.json()) as LogoutPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  const accessToken =
    typeof pedido?.accessToken === "string"
      ? pedido.accessToken.trim()
      : "";

  if (!accessToken) {
    return respostaErro(
      400,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi(
        "LogoutOperador",
        {
          accessToken,
        },
      );

    const status =
      resultado.sucesso
        ? 200
        : [
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
      "Erro ao terminar sessão POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_LOGOUT",
      "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}