//app\api\pos-mobile\adicionar-produto-programa-conta\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  AdicionarProgramaPedido,
  AdicionarProgramaResultado,
  ModoQuantidadePrograma,
  POSMobileApiResponse,
  ProgramaLinhaPedido,
  TipoLancamentoPrograma,
} from "@/types/programas";

export const dynamic =
  "force-dynamic";

type AdicionarProgramaResposta =
  POSMobileApiResponse<
    AdicionarProgramaResultado
  >;

const VERSAO_CONTRATO =
  "1.0";

const TIPOS_LANCAMENTO_VALIDOS:
  TipoLancamentoPrograma[] =
  [
    "TOTAL",
    "PARCIAL",
    "MISTO",
    "LIVRE",
    "DESCONHECIDO",
  ];

const MODOS_QUANTIDADE_VALIDOS:
  ModoQuantidadePrograma[] =
  [
    "TODOS_IGUAIS",
    "CONFIGURAR_INDIVIDUALMENTE",
    "NAO_DEFINIDO",
  ];

function criarRespostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<AdicionarProgramaResposta> {
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

function numeroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0
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

function booleano(
  valor: unknown,
): valor is boolean {
  return (
    typeof valor === "boolean"
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

function modoQuantidadeValido(
  valor: unknown,
): valor is ModoQuantidadePrograma {
  return (
    typeof valor === "string" &&
    MODOS_QUANTIDADE_VALIDOS.includes(
      valor as ModoQuantidadePrograma,
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
      "POSTO_SESSAO_INVALIDO",
      "SEM_PERMISSAO_ADICIONAR_PROGRAMA",
    ].includes(codigo)
  ) {
    return 403;
  }

  if (
    [
      "PROGRAMA_NAO_ENCONTRADO",
      "PRODUTO_PROGRAMA_NAO_ENCONTRADO",
      "CONTA_NAO_ENCONTRADA",
    ].includes(codigo)
  ) {
    return 404;
  }

  if (
    [
      "MOVIMENTO_MESA_FECHADO",
      "CONTA_FECHADA",
      "PROGRAMA_INDISPONIVEL",
      "PROGRAMA_SEM_COMPOSICAO",
      "TIPO_PROGRAMA_NAO_IMPLEMENTADO",
      "TIPO_PROGRAMA_INVALIDO",
      "SELECAO_PROGRAMA_VAZIA",
      "SELECAO_PROGRAMA_INVALIDA",
      "PRODUTO_COMPONENTE_REPETIDO",
      "PRODUTO_FORA_DO_PROGRAMA",
      "NIVEL_COMPONENTE_INVALIDO",
      "PRODUTO_FIXO_ALTERADO",
      "PRODUTO_FIXO_OBRIGATORIO",
      "LIMITE_NIVEL_ULTRAPASSADO",
      "MINIMO_NIVEL_NAO_ATINGIDO",
      "LIMITE_PROGRAMA_ULTRAPASSADO",
      "MAXIMO_PRODUTOS_ULTRAPASSADO",
      "SISTEMA_OCUPADO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

function validarLinhaPrograma(
  linha: ProgramaLinhaPedido,
  indice: number,
): string | null {
  if (
    !linha ||
    typeof linha !== "object"
  ) {
    return (
      `A linha ${indice + 1} do programa é inválida.`
    );
  }

  if (
    !inteiroPositivo(
      linha.idProduto,
    )
  ) {
    return (
      `A linha ${indice + 1} não possui um produto válido.`
    );
  }

  if (
    linha.idNivel !== null &&
    linha.idNivel !== undefined &&
    !inteiroNaoNegativo(
      linha.idNivel,
    )
  ) {
    return (
      `O nível do produto ${linha.idProduto} é inválido.`
    );
  }

  if (
    linha.idGrupoMenu !== null &&
    linha.idGrupoMenu !== undefined &&
    !inteiroNaoNegativo(
      linha.idGrupoMenu,
    )
  ) {
    return (
      `O grupo de menu do produto ${linha.idProduto} é inválido.`
    );
  }

  if (
    linha.idGrupoPreparacao !== null &&
    linha.idGrupoPreparacao !== undefined &&
    !inteiroNaoNegativo(
      linha.idGrupoPreparacao,
    )
  ) {
    return (
      `O grupo de preparação do produto ${linha.idProduto} é inválido.`
    );
  }

  if (
    !numeroPositivo(
      linha.quantidade,
    )
  ) {
    return (
      `A quantidade do produto ${linha.idProduto} deve ser superior a zero.`
    );
  }

  if (
    !numeroNaoNegativo(
      linha.valorUnitario,
    )
  ) {
    return (
      `O valor unitário do produto ${linha.idProduto} não pode ser negativo.`
    );
  }

  if (
    !booleano(
      linha.valorFixo,
    )
  ) {
    return (
      `O campo valorFixo do produto ${linha.idProduto} é inválido.`
    );
  }

  if (
    !booleano(
      linha.produtoFixo,
    )
  ) {
    return (
      `O campo produtoFixo do produto ${linha.idProduto} é inválido.`
    );
  }

  if (
    !booleano(
      linha.produtoSemEscolha,
    )
  ) {
    return (
      `O campo produtoSemEscolha do produto ${linha.idProduto} é inválido.`
    );
  }

  return null;
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<AdicionarProgramaResposta>
> {
  let pedido:
    AdicionarProgramaPedido;

  try {
    pedido =
      (await request.json()) as
        AdicionarProgramaPedido;
  } catch {
    return criarRespostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  if (
    !pedido ||
    typeof pedido !== "object"
  ) {
    return criarRespostaErro(
      400,
      "DADOS_PROGRAMA_INVALIDOS",
      "Os dados para adicionar o produto-programa não foram enviados.",
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
      pedido.idMovimentoMesa,
    )
  ) {
    return criarRespostaErro(
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
    return criarRespostaErro(
      400,
      "CONTA_INVALIDA",
      "O identificador interno da conta deve ser superior a zero.",
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
    !numeroPositivo(
      pedido.quantidadePrograma,
    )
  ) {
    return criarRespostaErro(
      400,
      "QUANTIDADE_PROGRAMA_INVALIDA",
      "A quantidade do produto-programa deve ser superior a zero.",
    );
  }

  if (
    !tipoLancamentoValido(
      pedido.tipoLancamento,
    ) ||
    pedido.tipoLancamento ===
      "DESCONHECIDO"
  ) {
    return criarRespostaErro(
      400,
      "TIPO_PROGRAMA_INVALIDO",
      "O tipo de lançamento do programa é inválido.",
    );
  }

  if (
    !modoQuantidadeValido(
      pedido.modoQuantidade,
    )
  ) {
    return criarRespostaErro(
      400,
      "MODO_QUANTIDADE_INVALIDO",
      "O modo de quantidade do programa é inválido.",
    );
  }

  if (
    !numeroNaoNegativo(
      pedido.valorMenu,
    )
  ) {
    return criarRespostaErro(
      400,
      "VALOR_MENU_INVALIDO",
      "O valor do menu não pode ser negativo.",
    );
  }

  if (
    !Array.isArray(
      pedido.linhas,
    )
  ) {
    return criarRespostaErro(
      400,
      "LINHAS_PROGRAMA_INVALIDAS",
      "A lista de linhas do programa é inválida.",
    );
  }

  if (
    pedido.tipoLancamento ===
      "PARCIAL" &&
    pedido.linhas.length === 0
  ) {
    return criarRespostaErro(
      400,
      "SELECAO_PROGRAMA_VAZIA",
      "Selecione pelo menos um produto para o programa parcial.",
    );
  }

  for (
    let indice = 0;
    indice < pedido.linhas.length;
    indice += 1
  ) {
    const erroLinha =
      validarLinhaPrograma(
        pedido.linhas[
          indice
        ],
        indice,
      );

    if (erroLinha) {
      return criarRespostaErro(
        400,
        "LINHA_PROGRAMA_INVALIDA",
        erroLinha,
      );
    }
  }

  const pedidoNormalizado:
    AdicionarProgramaPedido =
    {
      accessToken:
        pedido.accessToken.trim(),

      idPosto:
        pedido.idPosto,

      idMovimentoMesa:
        pedido.idMovimentoMesa,

      idInternoConta:
        pedido.idInternoConta,

      idProdutoPrograma:
        pedido.idProdutoPrograma,

      idGrupoPreparacao:
        pedido.idGrupoPreparacao ??
        0,

      quantidadePrograma:
        pedido.quantidadePrograma,

      tipoLancamento:
        pedido.tipoLancamento,

      modoQuantidade:
        pedido.modoQuantidade,

      valorMenu:
        pedido.valorMenu,

      linhas:
        pedido.tipoLancamento ===
          "TOTAL"
          ? []
          : pedido.linhas.map(
              (
                linha,
              ): ProgramaLinhaPedido => ({
                idProduto:
                  linha.idProduto,

                idNivel:
                  linha.idNivel ??
                  0,

                idGrupoMenu:
                  linha.idGrupoMenu ??
                  0,

                idGrupoPreparacao:
                  linha.idGrupoPreparacao ??
                  0,

                quantidade:
                  linha.quantidade,

                valorUnitario:
                  linha.valorUnitario,

                valorFixo:
                  linha.valorFixo,

                produtoFixo:
                  linha.produtoFixo,

                produtoSemEscolha:
                  linha.produtoSemEscolha,

                /*
                 * O objeto Delphi ainda tenta ler o campo
                 * "comentarios". Enquanto a gravação dos
                 * comentários dos componentes está desativada,
                 * enviamos sempre uma lista vazia.
                 */
                comentarios: [],
              }),
            ),
    };

  try {
    console.log(
      "[POSMobile][AdicionarProdutoProgramaConta] Pedido recebido",
      {
        idPosto:
          pedidoNormalizado.idPosto,
        idMovimentoMesa:
          pedidoNormalizado.idMovimentoMesa,
        idInternoConta:
          pedidoNormalizado.idInternoConta,
        idProdutoPrograma:
          pedidoNormalizado.idProdutoPrograma,
        tipoLancamento:
          pedidoNormalizado.tipoLancamento,
        quantidadePrograma:
          pedidoNormalizado.quantidadePrograma,
        numeroLinhas:
          pedidoNormalizado.linhas.length,
      },
    );

    const resultado =
      await callPosMobileApi<
        AdicionarProgramaResultado
      >(
        "AdicionarProdutoProgramaConta",
        pedidoNormalizado,
      );

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : obterStatusErro(
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
      "Erro ao adicionar o produto-programa à conta:",
      error,
    );

    return criarRespostaErro(
      502,
      "ERRO_ADICIONAR_PROGRAMA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}