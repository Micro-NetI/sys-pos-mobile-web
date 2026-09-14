// app/api/pos-mobile/preparar-login/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  PrepararLoginDados,
  PrepararLoginRequest,
} from "@/types/autenticacao";


interface PrepararLoginPedidoRecebido {
  login?: string | null;
  password?: string | null;
}


function respostaErro(
  status: number,
  codigo: string,
  mensagem: string,
) {
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


function normalizarTexto(
  valor: unknown,
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}


export async function POST(
  request: NextRequest,
) {
  let pedidoRecebido:
    PrepararLoginPedidoRecebido;

  try {
    pedidoRecebido =
      (await request.json()) as
        PrepararLoginPedidoRecebido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }


  if (
    !pedidoRecebido ||
    typeof pedidoRecebido !== "object"
  ) {
    return respostaErro(
      400,
      "DADOS_INVALIDOS",
      "Os dados de autenticação não foram enviados.",
    );
  }


  const login =
    normalizarTexto(
      pedidoRecebido.login,
    );


  const password =
    typeof pedidoRecebido.password ===
      "string"
      ? pedidoRecebido.password
      : "";


  if (password.trim() === "") {
    return respostaErro(
      400,
      "PASSWORD_OBRIGATORIA",
      "Introduza o PIN do operador.",
    );
  }


  const pedidoApi:
    PrepararLoginRequest = {
      login,
      password,
    };


  try {
    const resultado =
      await callPosMobileApi<
        PrepararLoginDados
      >(
        "PrepararLoginOperador",
        pedidoApi,
      );


    let status = 400;

    if (resultado.sucesso) {
      status = 200;
    } else {
      switch (resultado.codigo) {
        case "CREDENCIAIS_INVALIDAS":
        case "UTILIZADOR_INVALIDO":
          status = 401;
          break;

        case "POSTOS_UTILIZADOR_NAO_ENCONTRADOS":
          status = 403;
          break;

        case "LOGIN_EM_PROCESSAMENTO":
          status = 409;
          break;

        default:
          status = 400;
          break;
      }
    }


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
      "Erro ao preparar login no POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_PREPARAR_LOGIN",
      "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}