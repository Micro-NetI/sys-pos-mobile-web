// app/api/pos-mobile/imprimir-pedido-cozinha-fisico/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
  A impressão física pode demorar dezenas de segundos.
  Esta rota é chamada separadamente do registo do pedido na produção.
*/
export const maxDuration = 120;

interface ImprimirPedidoCozinhaFisicoPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idSegue: number;
}

interface ImprimirPedidoCozinhaFisicoDados {
  idPosto: number;
  idUtilizador: number;
  idMovimentoMesa: number;
  idInternoConta: number;
  idSegue: number;
  imprimiu: boolean;
  mensagemImpressao: string;
  numeroLinhas: number;
  idLinhas: number[];
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

function inteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
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
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    [
      "MOVIMENTO_MESA_INVALIDO",
      "CONTA_INVALIDA",
      "SEGUE_INVALIDO",
      "POSTO_SESSAO_INVALIDO",
      "UTILIZADOR_SESSAO_INVALIDO",
    ].includes(codigo)
  ) {
    return 400;
  }

  if (
    [
      "PRODUCAO_NAO_REGISTADA",
    ].includes(codigo)
  ) {
    return 409;
  }

  if (
    [
      "IMPRESSAO_FISICA_EM_PROCESSAMENTO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 500;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    ImprimirPedidoCozinhaFisicoPedido;

  try {
    pedido =
      (await request.json()) as
        ImprimirPedidoCozinhaFisicoPedido;
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

  if (
    !inteiroPositivo(
      pedido.idMovimentoMesa,
    )
  ) {
    return respostaErro(
      400,
      "MOVIMENTO_MESA_INVALIDO",
      "O movimento da mesa deve ser indicado.",
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
      "A conta da mesa deve ser indicada.",
    );
  }

  if (
    !inteiroPositivo(
      pedido.idSegue,
    )
  ) {
    return respostaErro(
      400,
      "SEGUE_INVALIDO",
      "O identificador do Segue deve ser indicado.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi<
        ImprimirPedidoCozinhaFisicoDados
      >(
        "ImprimirPedidoCozinhaFisico",
        {
          accessToken:
            pedido.accessToken.trim(),
          idMovimentoMesa:
            pedido.idMovimentoMesa,
          idInternoConta:
            pedido.idInternoConta,
          idSegue:
            pedido.idSegue,
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
      "Erro na impressão física do pedido de cozinha:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_IMPRESSAO_FISICA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile para imprimir o pedido.",
    );
  }
}
