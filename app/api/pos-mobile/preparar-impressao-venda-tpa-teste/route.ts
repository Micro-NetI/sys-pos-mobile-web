// app/api/pos-mobile/preparar-impressao-venda-tpa-teste/route.ts

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

/*
  ============================================================================
  PEDIDO
  ============================================================================
*/

interface PrepararImpressaoVendaTPATestePedido {
  accessToken: string;
  idVndCabDocumento: number;
}

/*
  ============================================================================
  DADOS DEVOLVIDOS PELA APIFNT

  Para esta primeira fase deixamos a estrutura aberta.

  O objetivo é primeiro receber e visualizar o JSON real
  produzido por:

    MotorFnt.VndDocumento.PrepararImpressaoVendaTPATeste(...)

  Depois, quando estabilizarmos o contrato, criamos os types
  definitivos para documento, produtos, menus, IVA, QR Code, etc.
  ============================================================================
*/

type PrepararImpressaoVendaTPATesteDados =
  Record<string, unknown>;

/*
  ============================================================================
  RESPOSTA DE ERRO LOCAL
  ============================================================================
*/

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

/*
  ============================================================================
  STATUS HTTP

  A regra funcional continua na APIFNT.

  O Next apenas traduz alguns códigos para HTTP.
  ============================================================================
*/

function obterStatusResposta(
  codigo: string,
): number {
  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
      "SESSAO_SEM_POSTO",
      "SESSAO_SEM_UTILIZADOR",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    [
      "PEDIDO_INVALIDO",
      "DADOS_IMPRESSAO_INVALIDOS",
      "DOCUMENTO_VENDA_INVALIDO",
    ].includes(codigo)
  ) {
    return 400;
  }

  if (
    codigo === "SISTEMA_OCUPADO"
  ) {
    return 503;
  }

  if (
    [
      "IMPRESSAO_TPA_SEM_DADOS",
      "ERRO_PREPARAR_IMPRESSAO_TPA",
    ].includes(codigo)
  ) {
    return 500;
  }

  return 400;
}

/*
  ============================================================================
  POST /api/pos-mobile/preparar-impressao-venda-tpa-teste

  Browser / Next
       ↓
  PrepararImpressaoVendaTPATeste
       ↓
  APIFNT
       ↓
  MotorFnt
       ↓
  JSON da fatura para TPA

  IMPORTANTE:

    - não efetua pagamento;
    - não cria nova fatura;
    - não imprime;
    - apenas prepara os dados da impressão.
  ============================================================================
*/

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    PrepararImpressaoVendaTPATestePedido;

  /*
    ==========================================================================
    LER JSON
    ==========================================================================
  */

  try {
    pedido =
      (await request.json()) as
        PrepararImpressaoVendaTPATestePedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  /*
    ==========================================================================
    VALIDAR TOKEN
    ==========================================================================
  */

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

  /*
    ==========================================================================
    VALIDAR DOCUMENTO
    ==========================================================================
  */

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

  /*
    ==========================================================================
    APIFNT
    ==========================================================================
  */

  try {
    const resultado =
      await callPosMobileApi<
        PrepararImpressaoVendaTPATesteDados
      >(
        "PrepararImpressaoVendaTPATeste",
        {
          accessToken:
            pedido.accessToken.trim(),

          idVndCabDocumento:
            pedido.idVndCabDocumento,
        },
      );

    /*
      A resposta já vem no envelope normal:

        {
          sucesso,
          codigo,
          mensagem,
          versaoContrato,
          dados
        }
    */

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : obterStatusResposta(
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
      "Erro ao preparar impressão de venda TPA:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_IMPRESSAO_TPA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}