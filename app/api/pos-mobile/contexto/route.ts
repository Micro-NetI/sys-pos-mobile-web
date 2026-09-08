//app\api\pos-mobile\contexto\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  obterContextoPosto,
} from "@/lib/pos-mobile-api";

import type {
  ApiResponse,
} from "@/types/autenticacao";

import type {
  ContextoPostoDados,
} from "@/types/contexto";

function criarRespostaErro(
  codigo: string,
  mensagem: string,
): ApiResponse<ContextoPostoDados> {
  return {
    sucesso: false,
    codigo,
    mensagem,
    versaoContrato: "1.0",
    dados: null,
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const idPostoTexto =
      request.nextUrl.searchParams.get(
        "idPosto",
      );

    const idPosto =
      Number(idPostoTexto);

    console.log(
      "========== ROTA CONTEXTO POS MOBILE ==========",
    );

    console.log(
      "ID do posto recebido na rota:",
      idPosto,
    );

    if (
      !Number.isInteger(idPosto) ||
      idPosto <= 0
    ) {
      return NextResponse.json(
        criarRespostaErro(
          "POSTO_INVALIDO",
          "O identificador do posto deve ser um número inteiro superior a zero.",
        ),
        {
          status: 400,
        },
      );
    }

    const resposta =
      await obterContextoPosto(
        idPosto,
      );

    console.log(
      "Resposta do contexto recebida da APIFNT:",
      resposta,
    );

    if (
      !resposta.sucesso ||
      !resposta.dados
    ) {
      return NextResponse.json(
        resposta,
        {
          status: 400,
        },
      );
    }

    console.log(
      "Posto:",
      resposta.dados.posto,
    );

    console.log(
      "Operação:",
      resposta.dados.operacao,
    );

    console.log(
      "Mesas:",
      resposta.dados.mesas,
    );

    console.log(
      "Segue:",
      resposta.dados.segue,
    );

    console.log(
      "Catálogo:",
      resposta.dados.catalogo,
    );

    console.log(
      "Pagamento:",
      resposta.dados.pagamento,
    );

    return NextResponse.json(
      resposta,
      {
        status: 200,
      },
    );
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    console.error(
      "Erro na rota de contexto:",
      mensagem,
    );

    return NextResponse.json(
      criarRespostaErro(
        "ERRO_CONTEXTO_POSTO",
        "Não foi possível carregar o contexto do posto.",
      ),
      {
        status: 500,
      },
    );
  }
}