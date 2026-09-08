//app\api\pos-mobile\grupo-link\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileGrupoLinkResposta,
} from "@/types/pos-mobile-grupo-link";

export const dynamic = "force-dynamic";

interface GrupoLinkPedido {
  accessToken: string;
  idSala: number;
  idGrupo: number;
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido: GrupoLinkPedido;

  try {
    pedido =
      (await request.json()) as GrupoLinkPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  if (
    typeof pedido?.accessToken !== "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return respostaErro(
      401,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  if (!inteiroPositivo(pedido.idSala)) {
    return respostaErro(
      400,
      "SALA_INVALIDA",
      "O identificador da sala deve ser superior a zero.",
    );
  }

  if (!inteiroPositivo(pedido.idGrupo)) {
    return respostaErro(
      400,
      "GRUPO_LINK_INVALIDO",
      "O identificador do grupo deve ser superior a zero.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi<POSMobileGrupoLinkResposta>(
        "GrupoLinkProdutos",
        {
          accessToken:
            pedido.accessToken.trim(),

          idSala:
            pedido.idSala,

          idGrupo:
            pedido.idGrupo,
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
          ].includes(resultado.codigo)
          ? 401
          : [
              "SALA_INVALIDA",
              "GRUPO_LINK_INVALIDO",
            ].includes(resultado.codigo)
            ? 400
            : resultado.codigo ===
                "GRUPO_LINK_NAO_ENCONTRADO"
              ? 404
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
      "Erro ao obter grupo link:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_GRUPO_LINK",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}