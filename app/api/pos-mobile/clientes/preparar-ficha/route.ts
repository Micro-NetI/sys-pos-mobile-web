//app\api\pos-mobile\clientes\preparar-ficha\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobilePrepararFichaClienteDados,
  POSMobilePrepararFichaClientePedido,
  POSMobilePrepararFichaClienteResposta,
} from "@/types/pos-mobile-clientes-ficha";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/*
  ============================================================================
  RESPOSTA DE ERRO LOCAL
  ============================================================================
*/

function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobilePrepararFichaClienteResposta> {
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

/*
  ============================================================================
  MAPEAR STATUS DEVOLVIDO PELA APIFNT
  ============================================================================
*/

function obterStatus(
  sucesso: boolean,
  codigo: string,
): number {
  if (sucesso) {
    return 200;
  }

  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
    ].includes(
      codigo,
    )
  ) {
    return 401;
  }

  if (
    codigo ===
      "ERRO_PREPARAR_FICHA_CLIENTE"
  ) {
    return 500;
  }

  return 400;
}

/*
  ============================================================================
  POST /api/pos-mobile/clientes/preparar-ficha

  Browser
      ↓
  Next.js
      ↓
  APIFNT / PrepararFichaCliente

  IMPORTANTE:
    - o browser envia apenas o accessToken;
    - não envia IDPosto;
    - o posto continua a ser obtido pela sessão na APIFNT;
    - o país predefinido vem do servidor;
    - não existe Portugal=1 hardcoded no frontend.
  ============================================================================
*/

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<POSMobilePrepararFichaClienteResposta>
> {
  let pedido:
    POSMobilePrepararFichaClientePedido;

  /*
    ==========================================================================
    JSON
    ==========================================================================
  */

  try {
    pedido =
      (await request.json()) as
        POSMobilePrepararFichaClientePedido;
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
      "FICHA_CLIENTE_INVALIDA",
      "Os dados para preparar a ficha de cliente não foram enviados.",
    );
  }

  /*
    ==========================================================================
    TOKEN

    Não guardamos nem reinterpretamos o posto no Next.

    O accessToken é a autoridade da sessão.
    ==========================================================================
  */

  if (
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() ===
      ""
  ) {
    return respostaErro(
      401,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  const pedidoNormalizado:
    POSMobilePrepararFichaClientePedido =
    {
      accessToken:
        pedido.accessToken.trim(),
    };

  /*
    ==========================================================================
    APIFNT
    ==========================================================================
  */

  try {
    const resultado =
      await callPosMobileApi<
        POSMobilePrepararFichaClienteDados
      >(
        "PrepararFichaCliente",
        pedidoNormalizado,
      );

    /*
      Validação defensiva da resposta de sucesso.

      Se a APIFNT disser sucesso mas não devolver os dados
      necessários ao formulário, não entregamos um contrato
      incoerente ao browser.
    */
    if (
      resultado.sucesso &&
      (
        !resultado.dados ||
        !Array.isArray(
          resultado.dados.paises,
        )
      )
    ) {
      return respostaErro(
        502,
        "RESPOSTA_FICHA_CLIENTE_INVALIDA",
        "A API POS Mobile devolveu uma resposta inválida ao preparar a ficha de cliente.",
      );
    }

    return NextResponse.json(
      resultado as
        POSMobilePrepararFichaClienteResposta,
      {
        status:
          obterStatus(
            resultado.sucesso,
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
      "[POSMobile][Clientes][PrepararFicha] Erro:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_PREPARAR_FICHA_CLIENTE",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}