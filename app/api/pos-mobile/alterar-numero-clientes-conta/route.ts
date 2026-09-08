import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileAlterarNumeroClientesDados,
  POSMobileAlterarNumeroClientesPedido,
  POSMobileAlterarNumeroClientesResposta,
} from "@/types/numero-clientes";

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
): NextResponse<POSMobileAlterarNumeroClientesResposta> {
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
      "SEM_PERMISSAO_ALTERAR_NUMERO_CLIENTES"
  ) {
    return 403;
  }

  if (
    codigo ===
      "CONTA_NAO_ENCONTRADA"
  ) {
    return 404;
  }

  if (
    [
      "CONTA_FECHADA",
      "CONTA_POSTO_INVALIDO",
      "ALTERACAO_CLIENTES_EM_PROCESSAMENTO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<POSMobileAlterarNumeroClientesResposta>
> {
  let pedido:
    POSMobileAlterarNumeroClientesPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobileAlterarNumeroClientesPedido;
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
      "DADOS_ALTERAR_NUMERO_CLIENTES_INVALIDOS",
      "Os dados para alterar o número de clientes não foram enviados.",
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
      pedido.numeroPessoas,
    )
  ) {
    return respostaErro(
      400,
      "NUMERO_CLIENTES_INVALIDO",
      "O número de clientes deve ser um número inteiro superior a zero.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi<POSMobileAlterarNumeroClientesDados>(
        "AlterarNumeroClientesConta",
        {
          accessToken:
            pedido.accessToken.trim(),
          idMovimentoMesa:
            pedido.idMovimentoMesa,
          idInternoConta:
            pedido.idInternoConta,
          numeroPessoas:
            pedido.numeroPessoas,
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
      "Erro ao alterar o número de clientes da conta:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_ALTERAR_NUMERO_CLIENTES",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}