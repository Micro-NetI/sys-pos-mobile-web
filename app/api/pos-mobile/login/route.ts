//app\api\pos-mobile\login\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

interface LoginDispositivoPedido {
  identificador?: string | null;
  nome?: string | null;
}

interface LoginPedidoRecebido {
  /**
   * O posto passa a ser enviado pelo formulário de login.
   *
   * Durante a transição, quando não vier preenchido,
   * a rota ainda utiliza POS_MOBILE_POSTO_ID como fallback.
   */
  idPosto?: number;

  login?: string | null;
  password?: string | null;

  dispositivo?:
    LoginDispositivoPedido | null;
}

interface LoginOperadorPedido {
  idPosto: number;
  login: string;
  password: string;

  dispositivo: {
    identificador: string;
    nome: string;
  };
}

interface POSMobileUtilizadorLogin {
  idUtilizador: number;
  idRecursoHumano: number;
  login: string;
}

interface POSMobileSessaoLogin {
  accessToken: string;
  expiraEm: string;
}

interface POSMobileLoginDados {
  idPosto: number;

  utilizador:
    POSMobileUtilizadorLogin;

  sessao:
    POSMobileSessaoLogin;
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

function numeroInteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
  );
}

function obterPostoPredefinido():
  number {
  const valor =
    Number(
      process.env
        .POS_MOBILE_POSTO_ID,
    );

  if (
    !Number.isInteger(valor) ||
    valor <= 0
  ) {
    return 0;
  }

  return valor;
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
    LoginPedidoRecebido;

  try {
    pedidoRecebido =
      (await request.json()) as
        LoginPedidoRecebido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  if (
    !pedidoRecebido ||
    typeof pedidoRecebido !==
      "object"
  ) {
    return respostaErro(
      400,
      "DADOS_INVALIDOS",
      "Os dados de autenticação não foram enviados.",
    );
  }

  /*
    Nesta fase de transição:

    1. Usa o posto escolhido no login, quando enviado.
    2. Caso ainda não seja enviado pela página atual,
       utiliza POS_MOBILE_POSTO_ID.
    3. Depois de alterarmos o formulário, o fallback
       poderá ser mantido apenas como posto sugerido.
  */
  const idPosto =
    numeroInteiroPositivo(
      pedidoRecebido.idPosto,
    )
      ? pedidoRecebido.idPosto
      : obterPostoPredefinido();

  if (idPosto <= 0) {
    return respostaErro(
      400,
      "POSTO_INVALIDO",
      "Selecione um posto válido para iniciar a sessão.",
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

  /*
    A API Delphi permite login vazio quando a password
    identifica de forma única o operador.

    Por isso, a rota apenas obriga à palavra-passe.
  */
  if (password.trim() === "") {
    return respostaErro(
      400,
      "PASSWORD_OBRIGATORIA",
      "Indique a palavra-passe.",
    );
  }

  const identificadorDispositivo =
    normalizarTexto(
      pedidoRecebido
        .dispositivo
        ?.identificador,
    ) ||
    "sys-pos-mobile-web";

  const nomeDispositivo =
    normalizarTexto(
      pedidoRecebido
        .dispositivo
        ?.nome,
    ) ||
    "SysPOS Mobile Web";

  const pedidoApi:
    LoginOperadorPedido = {
      idPosto,
      login,
      password,

      dispositivo: {
        identificador:
          identificadorDispositivo,

        nome:
          nomeDispositivo,
      },
    };

  try {
    const resultado =
      await callPosMobileApi<
        POSMobileLoginDados
      >(
        "LoginOperador",
        pedidoApi,
      );

    const status =
      resultado.sucesso
        ? 200
        : resultado.codigo ===
              "CREDENCIAIS_INVALIDAS" ||
            resultado.codigo ===
              "UTILIZADOR_INVALIDO"
          ? 401
          : resultado.codigo ===
              "LOGIN_EM_PROCESSAMENTO"
            ? 409
            : 400;

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
      "Erro ao efetuar login no POS Mobile:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_LOGIN",
      "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}