//app\api\pos-mobile\preparar-produto-programa\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileApiResponse,
  PrepararProgramaPedido,
  ProgramaResultado,
  TipoLancamentoPrograma,
} from "@/types/programas";

export const dynamic =
  "force-dynamic";

type PrepararProgramaResposta =
  POSMobileApiResponse<ProgramaResultado>;

const VERSAO_CONTRATO =
  "1.0";

function mascararToken(
  token: string,
): string {
  const valor =
    token.trim();

  if (valor.length <= 8) {
    return "***";
  }

  return `${valor.slice(0, 4)}...${valor.slice(-4)}`;
}

const TIPOS_LANCAMENTO_VALIDOS:
  TipoLancamentoPrograma[] =
  [
    "TOTAL",
    "PARCIAL",
    "MISTO",
    "LIVRE",
    "DESCONHECIDO",
  ];

function criarRespostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<PrepararProgramaResposta> {
  return NextResponse.json(
    {
      sucesso: false,
      codigo,
      mensagem,
      versaoContrato:
        VERSAO_CONTRATO,
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

function inteiroNaoNegativo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor >= 0
  );
}

function quantidadePositiva(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0
  );
}

function tipoLancamentoValido(
  valor: unknown,
): valor is TipoLancamentoPrograma {
  return (
    typeof valor === "string" &&
    TIPOS_LANCAMENTO_VALIDOS.includes(
      valor as TipoLancamentoPrograma,
    )
  );
}

function obterStatusErro(
  codigo: string,
): number {
  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    [
      "SEM_PERMISSAO_PREPARAR_PROGRAMA",
    ].includes(codigo)
  ) {
    return 403;
  }

  if (
    [
      "PROGRAMA_NAO_ENCONTRADO",
      "PRODUTO_PROGRAMA_NAO_ENCONTRADO",
      "PROGRAMA_PARCIAL_NAO_ENCONTRADO",
    ].includes(codigo)
  ) {
    return 404;
  }

  if (
    [
      "TIPO_PROGRAMA_NAO_IMPLEMENTADO",
      "PROGRAMA_SEM_COMPOSICAO",
      "PROGRAMA_INDISPONIVEL",
      "PRODUTO_PROGRAMA_INDISPONIVEL",
      "PRECO_PROGRAMA_INVALIDO",
      "PROGRAMA_PARCIAL_SEM_PRODUTOS",
      "PROGRAMA_PARCIAL_SEM_NIVEIS",
      "PREDEFINICAO_PROGRAMA_INVALIDA",
      "LIMITE_NIVEL_EXCEDIDO",
      "LIMITE_PROGRAMA_EXCEDIDO",
      "SISTEMA_OCUPADO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

function validarResultadoPrograma(
  resultado: ProgramaResultado,
): string | null {
  if (
    !resultado ||
    typeof resultado !== "object"
  ) {
    return (
      "A API POS Mobile devolveu " +
      "um resultado de programa inválido."
    );
  }

  if (
    resultado.idProdutoPrograma ===
      null ||
    !inteiroPositivo(
      resultado.idProdutoPrograma,
    )
  ) {
    return (
      "A API POS Mobile não devolveu " +
      "um identificador válido para o programa."
    );
  }

  if (
    typeof resultado.descricao !==
      "string" ||
    resultado.descricao.trim() === ""
  ) {
    return (
      "A API POS Mobile não devolveu " +
      "a descrição do programa."
    );
  }

  if (
    !tipoLancamentoValido(
      resultado.tipoLancamento,
    ) ||
    resultado.tipoLancamento ===
      "DESCONHECIDO"
  ) {
    return (
      "A API POS Mobile não devolveu " +
      "um tipo de lançamento válido."
    );
  }

  if (
    !quantidadePositiva(
      resultado.quantidadePrograma,
    )
  ) {
    return (
      "A API POS Mobile devolveu uma " +
      "quantidade de programa inválida."
    );
  }

  if (
    !Array.isArray(
      resultado.linhasFixas,
    )
  ) {
    return (
      "A lista de linhas fixas " +
      "do programa é inválida."
    );
  }

  if (
    !Array.isArray(
      resultado.produtos,
    )
  ) {
    return (
      "A lista de produtos " +
      "do programa é inválida."
    );
  }

  if (
    !Array.isArray(
      resultado.niveis,
    )
  ) {
    return (
      "A lista de níveis " +
      "do programa é inválida."
    );
  }

  if (
    !Array.isArray(
      resultado.grupos,
    )
  ) {
    return (
      "A lista de grupos " +
      "do programa é inválida."
    );
  }

  if (
    resultado.tipoLancamento ===
      "TOTAL" &&
    resultado.produtos.length === 0
  ) {
    return (
      "O programa total não possui " +
      "produtos configurados."
    );
  }

  if (
    resultado.tipoLancamento ===
      "PARCIAL" &&
    resultado.produtos.length === 0
  ) {
    return (
      "O programa parcial não possui " +
      "produtos disponíveis para seleção."
    );
  }

  if (
    resultado.tipoLancamento ===
      "PARCIAL" &&
    resultado.trabalhaComNiveis &&
    resultado.niveis.length === 0
  ) {
    return (
      "O programa parcial está configurado " +
      "para trabalhar com níveis, mas não " +
      "possui níveis configurados."
    );
  }

  return null;
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<PrepararProgramaResposta>
> {
  const inicio =
    Date.now();

  const identificadorPedido =
    crypto.randomUUID();

  console.log(
    `[POS Mobile][Preparar programa][${identificadorPedido}]`,
  );

  console.log(
    "Início do pedido:",
    new Date().toISOString(),
  );

  console.log(
    "Método:",
    request.method,
  );

  console.log(
    "URL Next:",
    request.nextUrl.pathname,
  );

  let pedido:
    PrepararProgramaPedido;

  try {
    pedido =
      (await request.json()) as
        PrepararProgramaPedido;
  } catch (error) {
    console.error(
      "Erro ao ler o JSON:",
      error,
    );

    console.log(
      "Duração:",
      `${Date.now() - inicio}ms`,
    );


    return criarRespostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  console.log(
    "Pedido recebido:",
    {
      ...pedido,
      accessToken:
        typeof pedido?.accessToken === "string"
          ? mascararToken(
              pedido.accessToken,
            )
          : pedido?.accessToken,
    },
  );

  if (
    !pedido ||
    typeof pedido !== "object"
  ) {
    return criarRespostaErro(
      400,
      "DADOS_PROGRAMA_INVALIDOS",
      "Os dados para preparar o produto-programa não foram enviados.",
    );
  }

  if (
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return criarRespostaErro(
      401,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  if (
    !inteiroPositivo(
      pedido.idPosto,
    )
  ) {
    return criarRespostaErro(
      400,
      "POSTO_INVALIDO",
      "O identificador do posto deve ser superior a zero.",
    );
  }

  if (
    !inteiroPositivo(
      pedido.idSala,
    )
  ) {
    return criarRespostaErro(
      400,
      "SALA_INVALIDA",
      "O identificador da sala deve ser superior a zero.",
    );
  }

  if (
    !inteiroPositivo(
      pedido.idProdutoPrograma,
    )
  ) {
    return criarRespostaErro(
      400,
      "PRODUTO_PROGRAMA_INVALIDO",
      "O identificador do produto-programa deve ser superior a zero.",
    );
  }

  if (
    pedido.idGrupoPreparacao !==
      null &&
    pedido.idGrupoPreparacao !==
      undefined &&
    !inteiroNaoNegativo(
      pedido.idGrupoPreparacao,
    )
  ) {
    return criarRespostaErro(
      400,
      "GRUPO_PREPARACAO_INVALIDO",
      "O identificador do grupo de preparação não pode ser negativo.",
    );
  }

  if (
    !quantidadePositiva(
      pedido.quantidade,
    )
  ) {
    return criarRespostaErro(
      400,
      "QUANTIDADE_PROGRAMA_INVALIDA",
      "A quantidade do produto-programa deve ser superior a zero.",
    );
  }

  const pedidoNormalizado:
    PrepararProgramaPedido =
    {
      accessToken:
        pedido.accessToken.trim(),

      idPosto:
        pedido.idPosto,

      idSala:
        pedido.idSala,

      idProdutoPrograma:
        pedido.idProdutoPrograma,

      idGrupoPreparacao:
        pedido.idGrupoPreparacao ??
        0,

      quantidade:
        pedido.quantidade,
    };

  console.log(
    "Pedido normalizado:",
    {
      ...pedidoNormalizado,
      accessToken:
        mascararToken(
          pedidoNormalizado.accessToken,
        ),
    },
  );

  console.log(
    "Endpoint APIFNT:",
    "PrepararProdutoPrograma",
  );

  try {
    const resultado =
      await callPosMobileApi<
        ProgramaResultado
      >(
        "PrepararProdutoPrograma",
        pedidoNormalizado,
      );

    console.log(
      "Resposta completa da APIFNT:",
      resultado,
    );

    console.log(
      "Resumo da resposta:",
      {
        sucesso:
          resultado?.sucesso,
        codigo:
          resultado?.codigo,
        mensagem:
          resultado?.mensagem,
        versaoContrato:
          resultado?.versaoContrato,
        temDados:
          Boolean(
            resultado?.dados,
          ),
        tipoLancamento:
          resultado?.dados
            ?.tipoLancamento,
        totalProdutos:
          resultado?.dados
            ?.produtos?.length ??
          null,
        totalLinhasFixas:
          resultado?.dados
            ?.linhasFixas?.length ??
          null,
        totalNiveis:
          resultado?.dados
            ?.niveis?.length ??
          null,
        totalGrupos:
          resultado?.dados
            ?.grupos?.length ??
          null,
      },
    );

    if (
      !resultado ||
      typeof resultado !== "object"
    ) {
      return criarRespostaErro(
        502,
        "RESPOSTA_API_INVALIDA",
        "A API POS Mobile devolveu uma resposta inválida.",
      );
    }

    if (!resultado.sucesso) {
      return NextResponse.json(
        {
          ...resultado,
          dados: null,
        },
        {
          status:
            obterStatusErro(
              resultado.codigo,
            ),

          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        },
      );
    }

    if (!resultado.dados) {
      return criarRespostaErro(
        502,
        "DADOS_PROGRAMA_AUSENTES",
        "A API POS Mobile confirmou a preparação, mas não devolveu os dados do programa.",
      );
    }

    const erroResultado =
      validarResultadoPrograma(
        resultado.dados,
      );

    if (erroResultado) {
      console.error(
        "Contrato inválido na preparação do programa:",
        {
          erro:
            erroResultado,

          idProdutoPrograma:
            pedidoNormalizado
              .idProdutoPrograma,

          tipoLancamento:
            resultado.dados
              .tipoLancamento,
        },
      );

      return criarRespostaErro(
        502,
        "CONTRATO_PROGRAMA_INVALIDO",
        erroResultado,
      );
    }

    console.log(
      "Resposta enviada pelo Next:",
      {
        status: 200,
        codigo:
          resultado.codigo,
        sucesso:
          resultado.sucesso,
      },
    );

    console.log(
      "Duração:",
      `${Date.now() - inicio}ms`,
    );


    return NextResponse.json(
      resultado,
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro ao preparar o produto-programa:",
      error,
    );

    return criarRespostaErro(
      502,
      "ERRO_PREPARAR_PROGRAMA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}