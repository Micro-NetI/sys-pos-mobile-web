//app\api\pos-mobile\contas-mesa\route.ts
import { NextRequest, NextResponse } from "next/server";

import { getPosMobileApi } from "@/lib/pos-mobile-api";
import type {
  POSMobileContasMesaResposta,
} from "@/types/contas";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
): Promise<NextResponse<POSMobileContasMesaResposta>> {
  try {
    const idMovimentoMesaTexto =
      request.nextUrl.searchParams.get(
        "idMovimentoMesa",
      );

    const idMovimentoMesa =
      Number(idMovimentoMesaTexto);

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

    const resposta =
      await getPosMobileApi<POSMobileContasMesaResposta>(
        `ContasMesa/${idMovimentoMesa}`,
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
      "Erro ao carregar as contas da mesa:",
      error,
    );

    return NextResponse.json(
      {
        sucesso: false,
        codigo: "ERRO_CONTAS_MESA",
        mensagem:
          "Não foi possível carregar as contas abertas da mesa.",
        versaoContrato: "1.0",
        dados: null,
      },
      {
        status: 500,
      },
    );
  }
}