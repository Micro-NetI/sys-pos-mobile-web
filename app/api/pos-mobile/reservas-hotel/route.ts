import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileHotelReservasResposta,
} from "@/types/pos-mobile-hotel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ReservasHotelPedido {
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

function statusErro(
  codigo: string,
): number {
  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
      "POSTO_SESSAO_INVALIDO",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    [
      "INTERFACE_KASBIG_NAO_CONFIGURADA",
      "PATH_KASBIG_NAO_CONFIGURADO",
      "INHOUSE_NAO_ENCONTRADO",
    ].includes(codigo)
  ) {
    return 404;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido: ReservasHotelPedido;

  try {
    pedido =
      (await request.json()) as
        ReservasHotelPedido;
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
    /*
      Não enviamos posto, centro de exploração ou PathKasbig.

      A APIFNT resolve:
        accessToken
          -> sessão
          -> posto
          -> centro de exploração
          -> Kasbig
          -> PathKasbig
          -> INHOUSE.dat
    */
    const resultado =
      await callPosMobileApi<POSMobileHotelReservasResposta>(
        "ReservasHotel",
        {
          accessToken:
            pedido.accessToken.trim(),
        },
      );

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : statusErro(
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
      "Erro ao consultar reservas do hotel:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_RESERVAS_HOTEL",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}