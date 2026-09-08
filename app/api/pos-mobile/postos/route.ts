//app\api\pos-mobile\postos\route.ts
import {
  NextResponse,
} from "next/server";

import {
  getPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobilePostoDisponivel,
  POSMobilePostosDisponiveisResposta,
} from "@/types/postos";

export const dynamic =
  "force-dynamic";

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobilePostosDisponiveisResposta> {
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

function numeroInteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
  );
}

function obterIdPostoPredefinido(
  postos:
    POSMobilePostoDisponivel[],
): number | null {
  const valorConfigurado =
    Number(
      process.env
        .POS_MOBILE_POSTO_ID,
    );

  if (
    !numeroInteiroPositivo(
      valorConfigurado,
    )
  ) {
    return null;
  }

  const postoExiste =
    postos.some(
      (posto) =>
        posto.idPosto ===
        valorConfigurado,
    );

  return postoExiste
    ? valorConfigurado
    : null;
}

export async function GET(): Promise<
  NextResponse<POSMobilePostosDisponiveisResposta>
> {
  try {
    const resposta =
      await getPosMobileApi<POSMobilePostosDisponiveisResposta>(
        "PostosDisponiveis",
      );

    if (
      !resposta.sucesso
    ) {
      const status =
        resposta.codigo ===
          "POSTOS_NAO_ENCONTRADOS"
          ? 404
          : 400;

      return NextResponse.json(
        resposta,
        {
          status,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    if (!resposta.dados) {
      return respostaErro(
        502,
        "RESPOSTA_POSTOS_INVALIDA",
        "A API POS Mobile não devolveu os dados dos postos disponíveis.",
      );
    }

    const dados =
      resposta.dados;

    const postosValidos =
      dados.postos.filter(
        (posto) =>
          numeroInteiroPositivo(
            posto.idPosto,
          ),
      );

    if (
      postosValidos.length === 0
    ) {
      return respostaErro(
        404,
        "POSTOS_NAO_ENCONTRADOS",
        "Não existem postos disponíveis para iniciar a sessão.",
      );
    }

    const idPostoPredefinido =
      obterIdPostoPredefinido(
        postosValidos,
      );

    const respostaFinal:
      POSMobilePostosDisponiveisResposta =
      {
        ...resposta,

        dados: {
          ...dados,

          totalPostos:
            postosValidos.length,

          postos:
            postosValidos,

          idPostoPredefinido,
        },
      };

    return NextResponse.json(
      respostaFinal,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro ao carregar os postos disponíveis:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_POSTOS_DISPONIVEIS",
      "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}