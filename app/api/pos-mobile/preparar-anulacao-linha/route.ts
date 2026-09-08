//app\api\pos-mobile\preparar-anulacao-linha\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobilePrepararAnulacaoLinhaDados,
  POSMobilePrepararAnulacaoLinhaPedido,
  POSMobilePrepararAnulacaoLinhaResposta,
} from "@/types/anulacao";

export const dynamic =
  "force-dynamic";

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
): NextResponse<POSMobilePrepararAnulacaoLinhaResposta> {
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

function obterStatus(
  codigo: string,
): number {
  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    codigo ===
      "SEM_PERMISSAO_ANULAR_LINHA"
  ) {
    return 403;
  }

  if (
    codigo ===
      "LINHA_NAO_ENCONTRADA"
  ) {
    return 404;
  }

  if (
    [
      "LINHA_NAO_PODE_SER_ANULADA",
      "LINHA_JA_ALTERADA",
      "LINHA_PERTENCE_MENU",
      "SISTEMA_OCUPADO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<POSMobilePrepararAnulacaoLinhaResposta>
> {
  let pedido:
    POSMobilePrepararAnulacaoLinhaPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobilePrepararAnulacaoLinhaPedido;
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
      "DADOS_ANULACAO_INVALIDOS",
      "Os dados para preparar a anulação não foram enviados.",
    );
  }

  if (
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return respostaErro(
      401,
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

  if (
    !inteiroPositivo(
      pedido.idLinha,
    )
  ) {
    return respostaErro(
      400,
      "LINHA_INVALIDA",
      "O identificador da linha deve ser superior a zero.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi<POSMobilePrepararAnulacaoLinhaDados>(
        "PrepararAnulacaoLinha",
        {
          accessToken:
            pedido.accessToken.trim(),
          idMovimentoMesa:
            pedido.idMovimentoMesa,
          idInternoConta:
            pedido.idInternoConta,
          idLinha:
            pedido.idLinha,
        },
      );

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : obterStatus(
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
      "Erro ao preparar anulação da linha:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_PREPARAR_ANULACAO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
