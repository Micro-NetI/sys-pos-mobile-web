import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileConfiguracaoResponse,
} from "@/types/configuracao";

export const dynamic =
  "force-dynamic";

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobileConfiguracaoResponse> {
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

function obterIdPosto(
  request: NextRequest,
): number {
  const valor =
    request.nextUrl.searchParams.get(
      "idPosto",
    );

  const idPosto =
    Number(valor);

  if (
    !Number.isInteger(idPosto) ||
    idPosto <= 0
  ) {
    return 0;
  }

  return idPosto;
}

export async function GET(
  request: NextRequest,
): Promise<
  NextResponse<POSMobileConfiguracaoResponse>
> {
  const idPosto =
    obterIdPosto(request);

  if (idPosto <= 0) {
    return respostaErro(
      400,
      "POSTO_INVALIDO",
      "O identificador do posto deve ser superior a zero.",
    );
  }

  try {
    console.log(
      "========== CONFIGURAÇÃO POS MOBILE ==========",
    );

    console.log(
      "ID do posto recebido:",
      idPosto,
    );

    console.log(
      "Endpoint enviado:",
      `ConfiguracaoSalasMesas/${idPosto}`,
    );

    const configuracao =
      await getPosMobileApi<POSMobileConfiguracaoResponse>(
        `ConfiguracaoSalasMesas/${idPosto}`,
      );

    console.log(
      "Configuração recebida:",
      configuracao,
    );

    console.log(
      "==============================================",
    );

    const status =
      configuracao.sucesso
        ? 200
        : configuracao.codigo ===
              "POSTO_INEXISTENTE" ||
            configuracao.codigo ===
              "CONFIGURACAO_NAO_ENCONTRADA"
          ? 404
          : 400;

    return NextResponse.json(
      configuracao,
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
      "Erro ao obter salas e mesas:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_CONFIGURACAO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}

// import { NextResponse } from "next/server";

// import { env } from "@/lib/env";
// import { getPosMobileApi } from "@/lib/pos-mobile-api";

// export async function GET() {
//   try {
//     console.log(
//       "========== CONFIGURAÇÃO POS MOBILE ==========",
//     );

//     console.log(
//       "ID do posto carregado:",
//       env.postoId,
//     );

//     console.log(
//       "Tipo do ID do posto:",
//       typeof env.postoId,
//     );

//     console.log(
//       "Endpoint enviado:",
//       `ConfiguracaoSalasMesas/${env.postoId}`,
//     );

//     const configuracao =
//       await getPosMobileApi<unknown>(
//         `ConfiguracaoSalasMesas/${env.postoId}`,
//       );

//     console.log(
//       "Configuração recebida:",
//       configuracao,
//     );

//     console.log(
//       "==============================================",
//     );

//     return NextResponse.json(
//       configuracao,
//       {
//         status: 200,
//       },
//     );
//   } catch (error) {
//     const mensagem =
//       error instanceof Error
//         ? error.message
//         : "Ocorreu um erro inesperado.";

//     console.error(
//       "Erro ao obter salas e mesas:",
//       error,
//     );

//     return NextResponse.json(
//       {
//         sucesso: false,
//         codigo: "ERRO_CONFIGURACAO",
//         mensagem,
//         versaoContrato: "1.0",
//         dados: null,
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }