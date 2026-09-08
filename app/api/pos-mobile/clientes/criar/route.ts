//app\api\pos-mobile\clientes\criar\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileCriarClienteDados,
  POSMobileCriarClientePedido,
  POSMobileCriarClienteResposta,
  POSMobileTipoClienteFicha,
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
): NextResponse<POSMobileCriarClienteResposta> {
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
  HELPERS
  ============================================================================
*/

function texto(
  valor: unknown,
): string {
  return typeof valor ===
    "string"
    ? valor.trim()
    : "";
}

function inteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor ===
      "number" &&
    Number.isInteger(
      valor,
    ) &&
    valor > 0
  );
}

function tipoClienteValido(
  valor: unknown,
): valor is POSMobileTipoClienteFicha {
  return (
    valor ===
      "INDIVIDUAL" ||
    valor ===
      "EMPRESA"
  );
}

/*
  ============================================================================
  STATUS HTTP

  A regra funcional continua sempre na APIFNT/MotorFnt.

  O Next apenas traduz o código funcional para um
  status HTTP apropriado.
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
    [
      "NIF_DUPLICADO",
      "CLIENTE_NOME_DUPLICADO",
    ].includes(
      codigo,
    )
  ) {
    return 409;
  }

  if (
    [
      "CLIENTE_CRIADO_NAO_ENCONTRADO",
      "ERRO_CRIAR_CLIENTE",
    ].includes(
      codigo,
    )
  ) {
    return 500;
  }

  return 400;
}

/*
  ============================================================================
  POST /api/pos-mobile/clientes/criar

  Browser
      ↓
  Next.js
      ↓
  APIFNT / CriarCliente
      ↓
  MotorFnt

  IMPORTANTE:
    - nenhuma regra fiscal é implementada no React ou no Next;
    - o Next valida apenas o contrato básico;
    - o NIF/NIPC é validado no MotorFnt;
    - NIF/NIPC repetido é recusado pela API;
    - o posto vem exclusivamente da sessão associada ao accessToken.
  ============================================================================
*/

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<POSMobileCriarClienteResposta>
> {
  let pedido:
    POSMobileCriarClientePedido;

  /*
    ==========================================================================
    JSON
    ==========================================================================
  */

  try {
    pedido =
      (await request.json()) as
        POSMobileCriarClientePedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  if (
    !pedido ||
    typeof pedido !==
      "object"
  ) {
    return respostaErro(
      400,
      "CLIENTE_INVALIDO",
      "Os dados para criar o cliente não foram enviados.",
    );
  }

  /*
    ==========================================================================
    TOKEN
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

  /*
    ==========================================================================
    TIPO DE CLIENTE
    ==========================================================================
  */

  if (
    !tipoClienteValido(
      pedido.tipoCliente,
    )
  ) {
    return respostaErro(
      400,
      "TIPO_CLIENTE_INVALIDO",
      "O tipo de cliente deve ser INDIVIDUAL ou EMPRESA.",
    );
  }

  /*
    ==========================================================================
    PAÍS
    ==========================================================================
  */

  if (
    !inteiroPositivo(
      pedido.idPais,
    )
  ) {
    return respostaErro(
      400,
      "PAIS_OBRIGATORIO",
      "Selecione o país do cliente.",
    );
  }

  /*
    ==========================================================================
    SEM NIF
    ==========================================================================
  */

  if (
    typeof pedido.semNif !==
      "boolean"
  ) {
    return respostaErro(
      400,
      "SEM_NIF_INVALIDO",
      "A indicação Sem NIF/NIPC é inválida.",
    );
  }

  /*
    ==========================================================================
    CAMPOS ESPECÍFICOS

    Não tentamos aplicar regras fiscais aqui.
    Apenas garantimos que o pedido possui a
    identificação mínima do tipo escolhido.
    ==========================================================================
  */

  if (
    pedido.tipoCliente ===
      "INDIVIDUAL" &&
    texto(
      pedido.nome,
    ) === ""
  ) {
    return respostaErro(
      400,
      "NOME_CLIENTE_OBRIGATORIO",
      "Indique o nome do cliente.",
    );
  }

  if (
    pedido.tipoCliente ===
      "EMPRESA" &&
    texto(
      pedido.designacao,
    ) === ""
  ) {
    return respostaErro(
      400,
      "DESIGNACAO_EMPRESA_OBRIGATORIA",
      "Indique a designação da empresa.",
    );
  }

  if (
    !pedido.semNif &&
    texto(
      pedido.nif,
    ) === ""
  ) {
    return respostaErro(
      400,
      "NIF_OBRIGATORIO",
      "Indique o NIF/NIPC ou selecione a opção Sem NIF/NIPC.",
    );
  }

  /*
    ==========================================================================
    NORMALIZAR PEDIDO

    Os campos específicos do tipo não selecionado
    são enviados vazios.

    Isto evita que valores residuais de uma mudança:
      Particular → Empresa
      Empresa → Particular
    cheguem ao backend.
    ==========================================================================
  */

  const pedidoNormalizado:
    POSMobileCriarClientePedido =
    {
      accessToken:
        pedido.accessToken.trim(),

      tipoCliente:
        pedido.tipoCliente,

      nome:
        pedido.tipoCliente ===
          "INDIVIDUAL"
          ? texto(
              pedido.nome,
            )
          : "",

      apelido:
        pedido.tipoCliente ===
          "INDIVIDUAL"
          ? texto(
              pedido.apelido,
            )
          : "",

      designacao:
        pedido.tipoCliente ===
          "EMPRESA"
          ? texto(
              pedido.designacao,
            )
          : "",

      abreviatura:
        pedido.tipoCliente ===
          "EMPRESA"
          ? texto(
              pedido.abreviatura,
            )
          : "",

      idPais:
        pedido.idPais,

      nif:
        pedido.semNif
          ? ""
          : texto(
              pedido.nif,
            ),

      semNif:
        pedido.semNif,

      email:
        texto(
          pedido.email,
        ),

      telemovel:
        texto(
          pedido.telemovel,
        ),

      morada:
        texto(
          pedido.morada,
        ),

      codigoPostal:
        texto(
          pedido.codigoPostal,
        ),

      localidade:
        texto(
          pedido.localidade,
        ),
    };

  /*
    ==========================================================================
    APIFNT
    ==========================================================================
  */

  try {
    const resultado =
      await callPosMobileApi<
        POSMobileCriarClienteDados
      >(
        "CriarCliente",
        pedidoNormalizado,
      );

    /*
      Sucesso sem cliente não é um contrato válido.

      O backend foi desenhado para devolver imediatamente
      a ficha criada, porque o POS Mobile vai selecioná-la
      logo após a criação.
    */
    if (
      resultado.sucesso &&
      (
        !resultado.dados ||
        !resultado.dados.cliente ||
        !Number.isInteger(
          resultado.dados.cliente
            .idCliente,
        ) ||
        resultado.dados.cliente
            .idCliente <= 0
      )
    ) {
      return respostaErro(
        502,
        "RESPOSTA_CLIENTE_CRIADO_INVALIDA",
        "A API POS Mobile não devolveu corretamente o cliente criado.",
      );
    }

    return NextResponse.json(
      resultado as
        POSMobileCriarClienteResposta,
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
      "[POSMobile][Clientes][Criar] Erro:",
      error,
    );

    return respostaErro(
      502,
      "ERRO_COMUNICACAO_CRIAR_CLIENTE",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}