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
  LOG TEMPORÁRIO DO JSON DE IMPRESSÃO
  ============================================================================

  Colocar false depois de terminarem os testes com o Kotlin.

  ATENÇÃO:
    o JSON da fatura pode conter:
      - nome do cliente;
      - NIF;
      - morada;
      - dados fiscais;
      - produtos;
      - pagamentos.

  Por isso este log deve ser apenas temporário.
  ============================================================================
*/
const LOG_JSON_IMPRESSAO_TPA =
  true;

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
  const codigoNormalizado =
    codigo
      .trim()
      .toUpperCase();

  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
      "SESSAO_SEM_POSTO",
      "SESSAO_SEM_UTILIZADOR",
    ].includes(
      codigoNormalizado,
    )
  ) {
    return 401;
  }

  if (
    [
      "PEDIDO_INVALIDO",
      "DADOS_IMPRESSAO_INVALIDOS",
      "DOCUMENTO_VENDA_INVALIDO",
    ].includes(
      codigoNormalizado,
    )
  ) {
    return 400;
  }

  if (
    codigoNormalizado ===
    "SISTEMA_OCUPADO"
  ) {
    return 503;
  }

  if (
    [
      "IMPRESSAO_TPA_SEM_DADOS",
      "ERRO_PREPARAR_IMPRESSAO_TPA",
    ].includes(
      codigoNormalizado,
    )
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

  const inicioMs =
    Date.now();

  /*
    Identificador apenas para conseguirmos seguir
    esta chamada nos logs.

    Não tem qualquer significado funcional.
  */
  const diagnosticoId =
    `TPA-PRINT-${inicioMs}`;

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
    console.error(
      "[TPA PRINT JSON] JSON inválido.",
      {
        diagnosticoId,
      },
    );

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
    console.error(
      "[TPA PRINT JSON] Token não indicado.",
      {
        diagnosticoId,

        idVndCabDocumento:
          pedido
            ?.idVndCabDocumento ??
          null,
      },
    );

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
    console.error(
      "[TPA PRINT JSON] Documento inválido.",
      {
        diagnosticoId,

        idVndCabDocumento:
          pedido.idVndCabDocumento,
      },
    );

    return respostaErro(
      400,
      "DOCUMENTO_VENDA_INVALIDO",
      "O identificador do documento de venda é inválido.",
    );
  }

  /*
    ==========================================================================
    LOG DO PEDIDO

    Não mostramos accessToken.
    ==========================================================================
  */

  console.log(
    "============================================================",
  );

  console.log(
    "[TPA PRINT JSON 01] PEDIDO",
    {
      diagnosticoId,

      hora:
        new Date(
          inicioMs,
        ).toISOString(),

      idVndCabDocumento:
        pedido.idVndCabDocumento,
    },
  );

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

    const fimMs =
      Date.now();

    /*
      ========================================================================
      LOG RESUMIDO
      ========================================================================
    */

    console.log(
      "[TPA PRINT JSON 02] RESPOSTA APIFNT",
      {
        diagnosticoId,

        hora:
          new Date(
            fimMs,
          ).toISOString(),

        duracaoMs:
          fimMs -
          inicioMs,

        idVndCabDocumento:
          pedido.idVndCabDocumento,

        sucesso:
          resultado.sucesso,

        codigo:
          resultado.codigo,

        mensagem:
          resultado.mensagem,

        temDados:
          resultado.dados !==
          null,
      },
    );

    /*
      ========================================================================
      JSON COMPLETO PARA COPIAR PARA O KOTLIN
      ========================================================================

      Este é o log que nos interessa.

      Vai aparecer no terminal onde está a correr o Next:

        [TPA PRINT JSON COMPLETO]

      O JSON fica formatado com indentação de 2 espaços para ser
      diretamente copiável para um ficheiro .json ou para testes Kotlin.
      ========================================================================
    */

    if (
      LOG_JSON_IMPRESSAO_TPA
    ) {
      console.log(
        "================ JSON FATURA / TPA =================",
      );

      console.log(
        "[TPA PRINT JSON COMPLETO]",
      );

      console.log(
        JSON.stringify(
          resultado,
          null,
          2,
        ),
      );

      console.log(
        "============== FIM JSON FATURA / TPA ===============",
      );
    }

    /*
      ========================================================================
      APENAS O OBJETO dados

      Também imprimimos isoladamente o payload que interessa ao Android.

      Assim tens duas versões no log:

        1. envelope completo:
             sucesso/codigo/mensagem/versaoContrato/dados

        2. apenas:
             dados

      Para testes dos modelos Kotlin normalmente a segunda é especialmente
      útil.
      ========================================================================
    */

    if (
      LOG_JSON_IMPRESSAO_TPA &&
      resultado.dados
    ) {
      console.log(
        "================ JSON DADOS TPA =====================",
      );

      console.log(
        "[TPA PRINT JSON DADOS]",
      );

      console.log(
        JSON.stringify(
          resultado.dados,
          null,
          2,
        ),
      );

      console.log(
        "============== FIM JSON DADOS TPA ===================",
      );
    }

    /*
      ========================================================================
      A resposta já vem no envelope normal:

        {
          sucesso,
          codigo,
          mensagem,
          versaoContrato,
          dados
        }
      ========================================================================
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

          /*
            Ajuda apenas a correlacionar a chamada nos testes.

            Não contém qualquer dado funcional ou sensível.
          */
          "X-TPA-Print-Trace-Id":
            diagnosticoId,
        },
      },
    );
  } catch (error) {
    const fimMs =
      Date.now();

    console.error(
      "[TPA PRINT JSON ERRO] Erro ao preparar impressão de venda TPA:",
      {
        diagnosticoId,

        hora:
          new Date(
            fimMs,
          ).toISOString(),

        duracaoMs:
          fimMs -
          inicioMs,

        idVndCabDocumento:
          pedido.idVndCabDocumento,

        erro:
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
      },
    );

    console.log(
      "============================================================",
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