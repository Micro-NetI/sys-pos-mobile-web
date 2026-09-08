import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileAssociarReservaHotelPedido,
  POSMobileAssociarReservaHotelResposta,
} from "@/types/pos-mobile-hotel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse {
  console.error(
    "[AssociarReservaHotel] Resposta de erro:",
    {
      status,
      codigo,
      mensagem,
    },
  );

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
      "POSTO_SESSAO_INVALIDO",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    [
      "CONTA_MESA_NAO_ENCONTRADA",
      "RESERVA_HOTEL_NAO_ENCONTRADA",
      "INTERFACE_KASBIG_NAO_CONFIGURADA",
      "INHOUSE_NAO_ENCONTRADO",
    ].includes(codigo)
  ) {
    return 404;
  }

  if (
    [
      "CONTA_MESA_FECHADA",
      "ERRO_CONFIRMAR_ASSOCIACAO_HOTEL",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    POSMobileAssociarReservaHotelPedido;

  console.log(
    "============================================================",
  );
  console.log(
    "[AssociarReservaHotel] Pedido recebido no Next",
  );
  console.log(
    "============================================================",
  );

  try {
    pedido =
      (await request.json()) as
        POSMobileAssociarReservaHotelPedido;
  } catch (error) {
    console.error(
      "[AssociarReservaHotel] JSON inválido:",
      error,
    );

    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  /*
    Não registamos o accessToken no log.
  */
  console.log(
    "[AssociarReservaHotel] Pedido recebido:",
    {
      temAccessToken:
        typeof pedido?.accessToken ===
          "string" &&
        pedido.accessToken.trim() !== "",

      idMovimentoMesa:
        pedido?.idMovimentoMesa,

      idInternoConta:
        pedido?.idInternoConta,

      idReserva:
        pedido?.idReserva,

      quarto:
        pedido?.quarto,
    },
  );

  if (
    typeof pedido?.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    console.error(
      "[AssociarReservaHotel] Token não indicado.",
    );

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
    console.error(
      "[AssociarReservaHotel] Movimento de mesa inválido:",
      pedido.idMovimentoMesa,
    );

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
    console.error(
      "[AssociarReservaHotel] Conta inválida:",
      pedido.idInternoConta,
    );

    return respostaErro(
      400,
      "CONTA_MESA_INVALIDA",
      "A conta da mesa deve ser indicada.",
    );
  }

  if (
    !inteiroPositivo(
      pedido.idReserva,
    )
  ) {
    console.error(
      "[AssociarReservaHotel] Reserva inválida:",
      pedido.idReserva,
    );

    return respostaErro(
      400,
      "RESERVA_HOTEL_INVALIDA",
      "A reserva do hotel deve ser indicada.",
    );
  }

  if (
    typeof pedido.quarto !==
      "string" ||
    pedido.quarto.trim() === ""
  ) {
    console.error(
      "[AssociarReservaHotel] Quarto inválido:",
      pedido.quarto,
    );

    return respostaErro(
      400,
      "QUARTO_HOTEL_INVALIDO",
      "O quarto deve ser indicado.",
    );
  }

  const pedidoAPIFNT = {
    accessToken:
      pedido.accessToken.trim(),

    idMovimentoMesa:
      pedido.idMovimentoMesa,

    idInternoConta:
      pedido.idInternoConta,

    idReserva:
      pedido.idReserva,

    quarto:
      pedido.quarto.trim(),
  };

  console.log(
    "[AssociarReservaHotel] Pedido funcional que será enviado à APIFNT:",
    {
      idMovimentoMesa:
        pedidoAPIFNT.idMovimentoMesa,

      idInternoConta:
        pedidoAPIFNT.idInternoConta,

      idReserva:
        pedidoAPIFNT.idReserva,

      quarto:
        pedidoAPIFNT.quarto,
    },
  );

  try {
    /*
      Cliente e datas não são enviados como autoridade.
      A APIFNT volta a lê-los do INHOUSE.dat.
    */

    console.log(
      "[AssociarReservaHotel] A chamar endpoint APIFNT: AssociarReservaHotelConta",
    );

    const resultado =
      await callPosMobileApi<POSMobileAssociarReservaHotelResposta>(
        "AssociarReservaHotelConta",
        pedidoAPIFNT,
      );

    console.log(
      "[AssociarReservaHotel] Resposta recebida da APIFNT:",
      resultado,
    );

    const status =
      resultado.sucesso
        ? 200
        : statusErro(
            resultado.codigo,
          );

    console.log(
      "[AssociarReservaHotel] Resultado final:",
      {
        sucesso:
          resultado.sucesso,

        codigo:
          resultado.codigo,

        mensagem:
          resultado.mensagem,

        statusHTTP:
          status,

        temDados:
          resultado.dados !== null,
      },
    );

    if (
      resultado.dados
    ) {
      console.log(
        "[AssociarReservaHotel] Dados devolvidos:",
        resultado.dados,
      );
    }

    console.log(
      "============================================================",
    );

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
      "============================================================",
    );

    console.error(
      "[AssociarReservaHotel] Exceção ao comunicar com a APIFNT:",
      error,
    );

    console.error(
      "[AssociarReservaHotel] Contexto do pedido:",
      {
        idMovimentoMesa:
          pedido.idMovimentoMesa,

        idInternoConta:
          pedido.idInternoConta,

        idReserva:
          pedido.idReserva,

        quarto:
          pedido.quarto.trim(),
      },
    );

    if (
      error instanceof Error
    ) {
      console.error(
        "[AssociarReservaHotel] Error.name:",
        error.name,
      );

      console.error(
        "[AssociarReservaHotel] Error.message:",
        error.message,
      );

      console.error(
        "[AssociarReservaHotel] Error.stack:",
        error.stack,
      );
    }

    console.error(
      "============================================================",
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_ASSOCIAR_RESERVA_HOTEL",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}