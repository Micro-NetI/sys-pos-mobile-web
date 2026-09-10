// app\api\pos-mobile\efetuar-pagamento\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileEfetuarPagamentoPedido,
  POSMobileEfetuarPagamentoResposta,
} from "@/types/pos-mobile-pagamentos";

export const dynamic = "force-dynamic";

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

function numeroNaoNegativo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor >= 0
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido: POSMobileEfetuarPagamentoPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobileEfetuarPagamentoPedido;
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

  if (!inteiroPositivo(pedido.idMovimentoMesa)) {
    return respostaErro(
      400,
      "MOVIMENTO_MESA_INVALIDO",
      "O identificador do movimento da mesa deve ser superior a zero.",
    );
  }

  if (!inteiroPositivo(pedido.idInternoConta)) {
    return respostaErro(
      400,
      "CONTA_INVALIDA",
      "O identificador interno da conta deve ser superior a zero.",
    );
  }

  if (!inteiroPositivo(pedido.idPagamentoDoc)) {
    return respostaErro(
      400,
      "PAGAMENTO_INVALIDO",
      "O identificador do pagamento deve ser superior a zero.",
    );
  }

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

  if (!inteiroNaoNegativo(pedido.idTipoServico)) {
    return respostaErro(
      400,
      "TIPO_SERVICO_INVALIDO",
      "O Tipo de Serviço indicado é inválido.",
    );
  }

  if (!inteiroNaoNegativo(pedido.idTipoRefeicao)) {
    return respostaErro(
      400,
      "TIPO_REFEICAO_INVALIDO",
      "O Tipo de Refeição indicado é inválido.",
    );
  }

  if (!inteiroNaoNegativo(pedido.idMercado)) {
    return respostaErro(
      400,
      "MERCADO_INVALIDO",
      "O Mercado indicado é inválido.",
    );
  }

  if (!inteiroNaoNegativo(pedido.idTipoDesconto)) {
    return respostaErro(
      400,
      "DESCONTO_INVALIDO",
      "O Desconto indicado é inválido.",
    );
  }

  if (!inteiroNaoNegativo(pedido.idMotivoDesconto)) {
    return respostaErro(
      400,
      "MOTIVO_DESCONTO_INVALIDO",
      "O Motivo do Desconto indicado é inválido.",
    );
  }

  if (
    typeof pedido.justificacaoDesconto !== "string"
  ) {
    return respostaErro(
      400,
      "JUSTIFICACAO_DESCONTO_INVALIDA",
      "A Justificação do Desconto é inválida.",
    );
  }

  if (typeof pedido.referencia !== "string") {
    return respostaErro(
      400,
      "REFERENCIA_INVALIDA",
      "A Referência do pagamento é inválida.",
    );
  }

  if (!numeroNaoNegativo(pedido.valorEntregue)) {
    return respostaErro(
      400,
      "VALOR_ENTREGUE_INVALIDO",
      "O valor entregue é inválido.",
    );
  }

  /*
    O pagamento POS Mobile é gravado sem esperar pela impressora.
    Se a propriedade não vier, assumimos false nesta rota.
  */
  if (
    pedido.imprimir !== undefined &&
    typeof pedido.imprimir !== "boolean"
  ) {
    return respostaErro(
      400,
      "IMPRIMIR_INVALIDO",
      "A indicação de impressão é inválida.",
    );
  }

  const imprimir =
    pedido.imprimir ?? false;

  console.group(
    "========== EFETUAR PAGAMENTO - NEXT ==========",
  );

  console.log({
    idMovimentoMesa:
      pedido.idMovimentoMesa,
    idInternoConta:
      pedido.idInternoConta,
    idPagamentoDoc:
      pedido.idPagamentoDoc,
    idEntidade:
      pedido.cliente.idEntidade,
    idTipoServico:
      pedido.idTipoServico,
    idTipoRefeicao:
      pedido.idTipoRefeicao,
    idMercado:
      pedido.idMercado,
    idTipoDesconto:
      pedido.idTipoDesconto,
    idMotivoDesconto:
      pedido.idMotivoDesconto,
    justificacaoDesconto:
      pedido.justificacaoDesconto,
    referencia:
      pedido.referencia,
    valorEntregue:
      pedido.valorEntregue,
    imprimir,
  });

  console.groupEnd();

  try {
    const resultado =
      await callPosMobileApi(
        "EfetuarPagamento",
        {
          accessToken:
            pedido.accessToken.trim(),
          idMovimentoMesa:
            pedido.idMovimentoMesa,
          idInternoConta:
            pedido.idInternoConta,
          idPagamentoDoc:
            pedido.idPagamentoDoc,
          cliente: {
            idEntidade:
              pedido.cliente.idEntidade,
          },
          idTipoServico:
            pedido.idTipoServico,
          idTipoRefeicao:
            pedido.idTipoRefeicao,
          idMercado:
            pedido.idMercado,
          idTipoDesconto:
            pedido.idTipoDesconto,
          idMotivoDesconto:
            pedido.idMotivoDesconto,
          justificacaoDesconto:
            pedido.justificacaoDesconto.trim(),
          referencia:
            pedido.referencia.trim(),
          valorEntregue:
            pedido.valorEntregue,

          /*
            MUITO IMPORTANTE:
            não retirar este campo.

            Se não for enviado, o Delphi mantém:
              FImprimir := True
          */
          imprimir,
        },
      ) as POSMobileEfetuarPagamentoResposta;

    const status =
      resultado.sucesso
        ? 200
        : [
            "TOKEN_OBRIGATORIO",
            "TOKEN_INVALIDO",
            "SESSAO_INVALIDA",
            "SESSAO_EXPIRADA",
          ].includes(resultado.codigo)
          ? 401
          : [
              "MOVIMENTO_MESA_INVALIDO",
              "CONTA_INVALIDA",
              "PAGAMENTO_INVALIDO",
              "CLIENTE_INVALIDO",
              "PAGAMENTO_NAO_CONFIGURADO",
              "TIPO_DOCUMENTO_INVALIDO",
              "MODO_PAGAMENTO_INVALIDO",
              "TIPO_SERVICO_OBRIGATORIO",
              "TIPO_SERVICO_INVALIDO",
              "TIPO_REFEICAO_OBRIGATORIO",
              "TIPO_REFEICAO_INVALIDO",
              "MERCADO_OBRIGATORIO",
              "MERCADO_INVALIDO",
              "REFERENCIA_OBRIGATORIA",
              "DESCONTO_OBRIGATORIO",
              "DESCONTO_INVALIDO",
              "MOTIVO_DESCONTO_OBRIGATORIO",
              "MOTIVO_DESCONTO_INVALIDO",
              "JUSTIFICACAO_DESCONTO_OBRIGATORIA",
              "MULTIPAGAMENTO_NAO_SUPORTADO",
              "IMPRIMIR_INVALIDO",
            ].includes(resultado.codigo)
            ? 400
            : resultado.codigo ===
                "SISTEMA_OCUPADO"
              ? 409
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
      "Erro ao efetuar pagamento POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_PAGAMENTO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
