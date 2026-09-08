//app\api\pos-mobile\estado-mesas\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileEstadoMesasResposta,
} from "@/types/estado-mesas";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: NextRequest,
): Promise<
  NextResponse<POSMobileEstadoMesasResposta>
> {
  try {
    const {
      searchParams,
    } = new URL(
      request.url,
    );

    const idPostoTexto =
      searchParams.get(
        "idPosto",
      );

    const idPosto =
      Number(
        idPostoTexto,
      );

    console.log(
      "========== ESTADO MESAS POS MOBILE ==========",
    );

    console.log(
      "ID do posto recebido:",
      idPostoTexto,
    );

    if (
      !idPostoTexto ||
      !Number.isInteger(
        idPosto,
      ) ||
      idPosto <= 0
    ) {
      console.error(
        "ID do posto inválido:",
        idPostoTexto,
      );

      return NextResponse.json(
        {
          sucesso: false,
          codigo:
            "POSTO_INVALIDO",
          mensagem:
            "O identificador do posto deve ser indicado e superior a zero.",
          versaoContrato:
            "1.0",
          dados: null,
        },
        {
          status: 400,
        },
      );
    }

    const endpoint =
      `EstadoMesasPosto/${idPosto}`;

    console.log(
      "Endpoint enviado:",
      endpoint,
    );

    const resposta =
      await getPosMobileApi<
        POSMobileEstadoMesasResposta
      >(
        endpoint,
      );

    console.log(
      "Resposta completa de EstadoMesasPosto:",
      JSON.stringify(
        resposta,
        null,
        2,
      ),
    );

    if (!resposta) {
      console.error(
        "A APIFNT não devolveu resposta.",
      );

      return NextResponse.json(
        {
          sucesso: false,
          codigo:
            "RESPOSTA_VAZIA",
          mensagem:
            "A APIFNT não devolveu uma resposta.",
          versaoContrato:
            "1.0",
          dados: null,
        },
        {
          status: 502,
        },
      );
    }

    if (
      !resposta.sucesso
    ) {
      console.error(
        "Erro devolvido por EstadoMesasPosto:",
        {
          codigo:
            resposta.codigo,
          mensagem:
            resposta.mensagem,
          dados:
            resposta.dados,
        },
      );
    }

    return NextResponse.json(
      resposta,
      {
        status:
          resposta.sucesso
            ? 200
            : 400,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );

  } catch (error) {
    console.error(
      "Erro ao carregar o estado das mesas:",
      error,
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    const classeErro =
      error instanceof Error
        ? error.name
        : "ErroDesconhecido";

    console.error(
      "Classe do erro:",
      classeErro,
    );

    console.error(
      "Mensagem original:",
      mensagem,
    );

    return NextResponse.json(
      {
        sucesso: false,
        codigo:
          "ERRO_ESTADO_MESAS",
        mensagem:
          `Não foi possível carregar o estado atual das mesas. ${classeErro}: ${mensagem}`,
        versaoContrato:
          "1.0",
        dados: null,
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}