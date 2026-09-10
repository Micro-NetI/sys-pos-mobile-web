// app/api/pos-mobile/pagamentos/imprimir/route.ts

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
export const maxDuration = 120;

interface ImprimirVendaPedido {
  accessToken: string;
  idVndCabDocumento: number;
  idPagamentoDoc: number;

  /*
    Apenas para diagnóstico de tempos.

    Estes campos vêm do browser/Next e NÃO são
    encaminhados para a APIFNT.
  */
  diagnosticoId?: string;
  browserStartedAtMs?: number;
}

interface ImprimirVendaRespostaDados {
  idVndCabDocumento: number;
  idPagamentoDoc: number;
  idPosto: number;
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

function obterStatusResposta(
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
      "DOCUMENTO_VENDA_INVALIDO",
      "DOCUMENTO_POSTO_INVALIDO",
      "PAGAMENTO_INVALIDO",
      "POSTO_SESSAO_INVALIDO",
      "UTILIZADOR_SESSAO_INVALIDO",
    ].includes(codigo)
  ) {
    return 400;
  }

  return 500;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const inicioRotaMs =
    Date.now();

  let pedido: ImprimirVendaPedido;

  try {
    pedido =
      (await request.json()) as
        ImprimirVendaPedido;
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

  if (
    !Number.isInteger(
      pedido.idVndCabDocumento,
    ) ||
    pedido.idVndCabDocumento <= 0
  ) {
    return respostaErro(
      400,
      "DOCUMENTO_VENDA_INVALIDO",
      "O identificador do documento de venda é inválido.",
    );
  }

  if (
    !Number.isInteger(
      pedido.idPagamentoDoc,
    ) ||
    pedido.idPagamentoDoc <= 0
  ) {
    return respostaErro(
      400,
      "PAGAMENTO_INVALIDO",
      "O identificador do pagamento é inválido.",
    );
  }

  /*
    ================================================================
    DIAGNÓSTICO - BROWSER -> NEXT
    ================================================================
  */

  const diagnosticoId =
    typeof pedido.diagnosticoId === "string" &&
    pedido.diagnosticoId.trim() !== ""
      ? pedido.diagnosticoId.trim()
      : [
          "PRINT",
          pedido.idVndCabDocumento,
          inicioRotaMs,
        ].join("-");

  let atrasoDesdeBrowserMs:
    number | null = null;

  if (
    typeof pedido.browserStartedAtMs ===
      "number" &&
    Number.isFinite(
      pedido.browserStartedAtMs,
    )
  ) {
    atrasoDesdeBrowserMs =
      inicioRotaMs -
      pedido.browserStartedAtMs;
  }

  console.log(
    "[PRINT NEXT 01] ENTROU ROTA",
    {
      diagnosticoId,

      hora:
        new Date(
          inicioRotaMs,
        ).toISOString(),

      atrasoDesdeBrowserMs,

      idVndCabDocumento:
        pedido.idVndCabDocumento,

      idPagamentoDoc:
        pedido.idPagamentoDoc,
    },
  );

  try {
    /*
      ================================================================
      DIAGNÓSTICO - NEXT -> APIFNT
      ================================================================
    */

    const inicioApiMs =
      Date.now();

    console.log(
      "[PRINT NEXT 02] ANTES APIFNT",
      {
        diagnosticoId,

        hora:
          new Date(
            inicioApiMs,
          ).toISOString(),

        desdeEntradaRotaMs:
          inicioApiMs -
          inicioRotaMs,

        idVndCabDocumento:
          pedido.idVndCabDocumento,

        idPagamentoDoc:
          pedido.idPagamentoDoc,
      },
    );

    /*
      IMPORTANTE:

      diagnosticoId e browserStartedAtMs NÃO são enviados
      para a APIFNT.

      O contrato Delphi mantém-se exatamente igual.
    */
    const resultado =
      await callPosMobileApi<ImprimirVendaRespostaDados>(
        "ImprimirVendaPagamento",
        {
          accessToken:
            pedido.accessToken.trim(),

          idVndCabDocumento:
            pedido.idVndCabDocumento,

          idPagamentoDoc:
            pedido.idPagamentoDoc,
        },
      );

    const fimApiMs =
      Date.now();

    const duracaoApiMs =
      fimApiMs -
      inicioApiMs;

    const duracaoTotalRotaMs =
      fimApiMs -
      inicioRotaMs;

    console.log(
      "[PRINT NEXT 03] DEPOIS APIFNT",
      {
        diagnosticoId,

        hora:
          new Date(
            fimApiMs,
          ).toISOString(),

        duracaoApiMs,

        duracaoTotalRotaMs,

        sucesso:
          resultado.sucesso,

        codigo:
          resultado.codigo,

        idVndCabDocumento:
          pedido.idVndCabDocumento,

        idPagamentoDoc:
          pedido.idPagamentoDoc,
      },
    );

    const status =
      resultado.sucesso
        ? 200
        : obterStatusResposta(
            resultado.codigo,
          );

    return NextResponse.json(
      resultado,
      {
        status,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          /*
            Estes headers permitem também ver os tempos
            no DevTools do browser.
          */
          "X-Print-Trace-Id":
            diagnosticoId,

          "Server-Timing":
            [
              `apifnt;dur=${duracaoApiMs}`,
              `total;dur=${duracaoTotalRotaMs}`,
            ].join(", "),
        },
      },
    );
  } catch (error) {
    const fimErroMs =
      Date.now();

    console.error(
      "[PRINT NEXT ERRO] Erro ao imprimir venda POS Mobile:",
      {
        diagnosticoId,

        hora:
          new Date(
            fimErroMs,
          ).toISOString(),

        duracaoTotalRotaMs:
          fimErroMs -
          inicioRotaMs,

        idVndCabDocumento:
          pedido.idVndCabDocumento,

        idPagamentoDoc:
          pedido.idPagamentoDoc,

        error,
      },
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_IMPRESSAO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
