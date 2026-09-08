//app\api\pos-mobile\conta-mesa\route.ts
import { NextRequest, NextResponse } from "next/server";

import { getPosMobileApi } from "@/lib/pos-mobile-api";
import type {
  POSMobileContaMesaResposta,
} from "@/types/contas";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<POSMobileContaMesaResposta>> {
  try {
    const idMovimentoMesaTexto =
      request.nextUrl.searchParams.get(
        "idMovimentoMesa",
      );

    const idInternoTexto =
      request.nextUrl.searchParams.get(
        "idInterno",
      );

    const idMovimentoMesa =
      Number(idMovimentoMesaTexto);

    const idInterno =
      Number(idInternoTexto);

    if (
      !idMovimentoMesaTexto ||
      !Number.isInteger(idMovimentoMesa) ||
      idMovimentoMesa <= 0
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          codigo: "MOVIMENTO_MESA_INVALIDO",
          mensagem:
            "O identificador do movimento da mesa deve ser indicado e superior a zero.",
          versaoContrato: "1.0",
          dados: null,
        },
        {
          status: 400,
        },
      );
    }

    if (
      !idInternoTexto ||
      !Number.isInteger(idInterno) ||
      idInterno <= 0
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          codigo: "CONTA_INVALIDA",
          mensagem:
            "O identificador interno da conta deve ser indicado e superior a zero.",
          versaoContrato: "1.0",
          dados: null,
        },
        {
          status: 400,
        },
      );
    }

    const resposta =
      await getPosMobileApi<POSMobileContaMesaResposta>(
        `ContaMesa/${idMovimentoMesa}/${idInterno}`,
      );

    return NextResponse.json(
      resposta,
      {
        status: resposta.sucesso ? 200 : 400,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro ao carregar a conta da mesa:",
      error,
    );

    return NextResponse.json(
      {
        sucesso: false,
        codigo: "ERRO_CONTA_MESA",
        mensagem:
          "Não foi possível carregar os dados da conta da mesa.",
        versaoContrato: "1.0",
        dados: null,
      },
      {
        status: 500,
      },
    );
  }
}