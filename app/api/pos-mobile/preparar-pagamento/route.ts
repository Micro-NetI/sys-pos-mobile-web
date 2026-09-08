//app\api\pos-mobile\preparar-pagamento\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobilePrepararPagamentoResposta,
} from "@/types/pos-mobile-pagamentos";

export const dynamic =
  "force-dynamic";


interface PrepararPagamentoPedido {
  accessToken: string;

  idMovimentoMesa: number;
  idInternoConta: number;
  idPagamentoDoc: number;

  cliente: {
    idEntidade: number;
  };
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


/* ============================================================================
 * POST /api/pos-mobile/preparar-pagamento
 * ============================================================================
 *
 * Esta rota NÃO efetua o pagamento.
 *
 * Serve para perguntar à APIFNT quais os dados necessários antes
 * da confirmação final:
 *
 *   - Tipo de Serviço;
 *   - Tipo de Refeição;
 *   - Mercado;
 *   - Referência;
 *   - Valor entregue;
 *   - Desconto automático;
 *   - Seleção de desconto;
 *   - Motivo do desconto;
 *   - Justificação;
 *   - Validação de dados fiscais.
 *
 * IMPORTANTE:
 *
 *   - O frontend não envia IDPosto como autoridade.
 *   - O posto é resolvido pela APIFNT através do accessToken.
 *   - O utilizador/login também é resolvido pela sessão.
 *   - IDTipoDocVnd e IDModoPagamento nunca são aceites do browser.
 *   - O desconto automático é novamente resolvido no servidor.
 * ========================================================================== */

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    PrepararPagamentoPedido;

  try {
    pedido =
      (await request.json()) as
        PrepararPagamentoPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }


  /* ==========================================================================
   * TOKEN
   * ======================================================================== */

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


  /* ==========================================================================
   * MOVIMENTO / CONTA
   * ======================================================================== */

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


  /* ==========================================================================
   * PAGAMENTO
   * ======================================================================== */

  if (
    !inteiroPositivo(
      pedido.idPagamentoDoc,
    )
  ) {
    return respostaErro(
      400,
      "PAGAMENTO_INVALIDO",
      "O identificador do pagamento deve ser superior a zero.",
    );
  }


  /* ==========================================================================
   * CLIENTE
   * ========================================================================
   *
   * O cliente pode ser:
   *
   *   - o cliente escolhido pelo operador;
   *   - o cliente indiferenciado devolvido pelo contexto do posto.
   *
   * Nunca assumir Consumidor Final = 1.
   * ======================================================================== */

  if (
    !pedido.cliente ||
    !inteiroPositivo(
      pedido.cliente.idEntidade,
    )
  ) {
    return respostaErro(
      400,
      "CLIENTE_INVALIDO",
      "O cliente do pagamento deve ser indicado.",
    );
  }


  try {
    /* ========================================================================
     * APIFNT
     * ========================================================================
     *
     * O ServerMethods aceita idEntidade diretamente.
     *
     * Mantemos cliente.idEntidade no contrato browser -> Next porque é
     * o mesmo formato utilizado em EfetuarPagamento.
     *
     * O Next apenas converte para o contrato da APIFNT.
     * ====================================================================== */

    const resultado =
      await callPosMobileApi(
        "PrepararPagamento",
        {
          accessToken:
            pedido.accessToken.trim(),

          idMovimentoMesa:
            pedido.idMovimentoMesa,

          idInternoConta:
            pedido.idInternoConta,

          idPagamentoDoc:
            pedido.idPagamentoDoc,

          idEntidade:
            pedido.cliente.idEntidade,
        },
      ) as
        POSMobilePrepararPagamentoResposta;


    /* ========================================================================
     * STATUS HTTP
     * ====================================================================== */

    const status =
      resultado.sucesso
        ? 200
        : [
            "TOKEN_OBRIGATORIO",
            "TOKEN_INVALIDO",
            "SESSAO_INVALIDA",
            "SESSAO_EXPIRADA",
          ].includes(
            resultado.codigo,
          )
          ? 401
          : [
              "MOVIMENTO_MESA_INVALIDO",
              "CONTA_INVALIDA",
              "PAGAMENTO_INVALIDO",
              "CLIENTE_INVALIDO",
              "PAGAMENTO_NAO_CONFIGURADO",
              "TIPO_DOCUMENTO_INVALIDO",
              "MODO_PAGAMENTO_INVALIDO",
              "MULTIPAGAMENTO_NAO_SUPORTADO",
            ].includes(
              resultado.codigo,
            )
            ? 400
            : 422;


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
      "Erro ao preparar pagamento POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_PREPARAR_PAGAMENTO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}