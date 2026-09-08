//app\api\pos-mobile\anular-linha-conta\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileAnularLinhaDados,
  POSMobileAnularLinhaPedido,
  POSMobileAnularLinhaResposta,
} from "@/types/anulacao";

export const dynamic =
  "force-dynamic";

const LIMITE_JUSTIFICACAO =
  1000;

function inteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
  );
}

function inteiroNaoNegativo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor >= 0
  );
}

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobileAnularLinhaResposta> {
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
      "MOTIVO_ANULACAO_OBRIGATORIO",
      "MOTIVO_ANULACAO_INVALIDO",
      "JUSTIFICACAO_OBRIGATORIA",
    ].includes(codigo)
  ) {
    return 422;
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
  NextResponse<POSMobileAnularLinhaResposta>
> {
  let pedido:
    POSMobileAnularLinhaPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobileAnularLinhaPedido;
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
      "Os dados da anulação não foram enviados.",
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

  if (
    !inteiroNaoNegativo(
      pedido.idMotivoAnulacao,
    )
  ) {
    return respostaErro(
      400,
      "MOTIVO_ANULACAO_INVALIDO",
      "O identificador do motivo de anulação deve ser um número inteiro igual ou superior a zero.",
    );
  }

  if (
    typeof pedido.justificacao !==
      "string"
  ) {
    return respostaErro(
      400,
      "JUSTIFICACAO_INVALIDA",
      "A justificação deve ser enviada como texto.",
    );
  }

  const justificacao =
    pedido.justificacao.trim();

  if (
    justificacao.length >
    LIMITE_JUSTIFICACAO
  ) {
    return respostaErro(
      400,
      "JUSTIFICACAO_DEMASIADO_LONGA",
      `A justificação não pode exceder ${LIMITE_JUSTIFICACAO} caracteres.`,
    );
  }

  try {
    const resultado =
      await callPosMobileApi<POSMobileAnularLinhaDados>(
        "AnularLinhaConta",
        {
          accessToken:
            pedido.accessToken.trim(),
          idMovimentoMesa:
            pedido.idMovimentoMesa,
          idInternoConta:
            pedido.idInternoConta,
          idLinha:
            pedido.idLinha,
          idMotivoAnulacao:
            pedido.idMotivoAnulacao,
          justificacao,
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
      "Erro ao anular linha da conta:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_ANULAR_LINHA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
