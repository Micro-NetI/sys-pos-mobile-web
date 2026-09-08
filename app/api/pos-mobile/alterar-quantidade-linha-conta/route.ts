//app\api\pos-mobile\alterar-quantidade-linha-conta\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileAlterarQuantidadeLinhaDados,
  POSMobileAlterarQuantidadeLinhaPedido,
  POSMobileAlterarQuantidadeLinhaResposta,
} from "@/types/quantidade-linha";

export const dynamic =
  "force-dynamic";

function criarRespostaErro(
  status: number,
  codigo: string,
  mensagem: string,
): NextResponse<POSMobileAlterarQuantidadeLinhaResposta> {
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

function inteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
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
      "SEM_PERMISSAO_ALTERAR_QUANTIDADE",
    ].includes(codigo)
  ) {
    return 403;
  }

  if (
    codigo ===
      "LINHA_NAO_ENCONTRADA"
  ) {
    return 404;
  }

  if (
    [
      "MOVIMENTO_MESA_FECHADO",
      "CONTA_FECHADA",
      "LINHA_NAO_DISPONIVEL",
      "LINHA_JA_ENVIADA_PRODUCAO",
      "LINHA_PROGRAMA_NAO_EDITAVEL",
      "LINHA_PROGRAMA_NAO_DISPONIVEL",
      "LINHA_PROGRAMA_JA_ENVIADA_PRODUCAO",
      "LINHA_HOTEL_NAO_EDITAVEL",
      "REGRA_LANCAMENTO_NAO_SUPORTADA",
      "SISTEMA_OCUPADO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

export async function POST(
  request: NextRequest,
): Promise<
  NextResponse<POSMobileAlterarQuantidadeLinhaResposta>
> {
  let pedido:
    POSMobileAlterarQuantidadeLinhaPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobileAlterarQuantidadeLinhaPedido;
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
      "DADOS_QUANTIDADE_INVALIDOS",
      "Os dados para alterar a quantidade não foram enviados.",
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
      pedido.idLinha,
    )
  ) {
    return criarRespostaErro(
      400,
      "LINHA_INVALIDA",
      "O identificador da linha deve ser superior a zero.",
    );
  }

  if (
    !quantidadePositiva(
      pedido.quantidade,
    )
  ) {
    return criarRespostaErro(
      400,
      "QUANTIDADE_INVALIDA",
      "A quantidade deve ser um número superior a zero.",
    );
  }

  if (
    typeof pedido.atualizarLinhasPrograma !==
      "boolean"
  ) {
    return criarRespostaErro(
      400,
      "ATUALIZAR_LINHAS_PROGRAMA_INVALIDO",
      "A opção de atualização das linhas do programa é inválida.",
    );
  }

  const pedidoNormalizado:
    POSMobileAlterarQuantidadeLinhaPedido =
    {
      accessToken:
        pedido.accessToken.trim(),

      idMovimentoMesa:
        pedido.idMovimentoMesa,

      idInternoConta:
        pedido.idInternoConta,

      idLinha:
        pedido.idLinha,

      quantidade:
        pedido.quantidade,

      atualizarLinhasPrograma:
        pedido.atualizarLinhasPrograma,
    };

  try {
    const resultado =
      await callPosMobileApi<
        POSMobileAlterarQuantidadeLinhaDados
      >(
        "AlterarQuantidadeLinhaConta",
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
      "Erro ao alterar a quantidade da linha:",
      error,
    );

    return criarRespostaErro(
      502,
      "ERRO_ALTERAR_QUANTIDADE_LINHA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
