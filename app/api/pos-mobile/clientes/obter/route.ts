//app\api\pos-mobile\clientes\obter\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileClienteResumo,
} from "@/types/pos-mobile-clientes";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

interface ObterClientePedido {
  accessToken: string;

  /*
    ID interno da tab_cliente.

    Corresponde a:

      tab_cliente.vnume

    NÃO corresponde ao NIF.

    O NIF corresponde a:

      tab_cliente.vcont
  */
  idCliente: number;
}

interface POSMobileObterClienteDados {
  cliente:
    | POSMobileClienteResumo
    | null;
}

interface POSMobileObterClienteResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobileObterClienteDados
    | null;
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    ObterClientePedido;

  /*
    ==============================================================
    LER PEDIDO
    ==============================================================
  */

  try {
    pedido =
      (await request.json()) as
        ObterClientePedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  /*
    ==============================================================
    TOKEN
    ==============================================================
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
    ==============================================================
    CLIENTE

    idCliente:

      tab_cliente.vnume

    NIF:

      tab_cliente.vcont
    ==============================================================
  */

  if (
    !inteiroPositivo(
      pedido.idCliente,
    )
  ) {
    return respostaErro(
      400,
      "CLIENTE_INVALIDO",
      "O identificador interno do cliente deve ser superior a zero.",
    );
  }

  /*
    ==============================================================
    APIFNT
    ==============================================================
  */

  try {
    const resultado =
      await callPosMobileApi<POSMobileObterClienteResposta>(
        "ObterCliente",
        {
          accessToken:
            pedido.accessToken.trim(),

          idCliente:
            pedido.idCliente,
        },
      );

    /*
      ============================================================
      STATUS HTTP
      ============================================================
    */

    let status =
      500;

    if (
      resultado.sucesso
    ) {
      status =
        200;
    } else if (
      [
        "TOKEN_OBRIGATORIO",
        "TOKEN_INVALIDO",
        "SESSAO_INVALIDA",
        "SESSAO_EXPIRADA",
        "POSTO_SESSAO_INVALIDO",
      ].includes(
        resultado.codigo,
      )
    ) {
      status =
        401;
    } else if (
      resultado.codigo ===
      "CLIENTE_NAO_ENCONTRADO"
    ) {
      status =
        404;
    } else if (
      [
        "CLIENTE_INVALIDO",
        "DADOS_CLIENTE_INVALIDOS",
      ].includes(
        resultado.codigo,
      )
    ) {
      status =
        400;
    }

    /*
      ERRO_OBTER_CLIENTE e restantes erros
      não previstos ficam corretamente como 500.
    */

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
      "Erro ao obter cliente POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_CLIENTE",
      "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}