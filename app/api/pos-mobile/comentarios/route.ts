//app\api\pos-mobile\comentarios\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
  getPosMobileApi,
} from "@/lib/pos-mobile-api";

import type {
  POSMobileComentarioSelecionado,
  POSMobileComentariosResposta,
  POSMobileGravarComentariosLinhaContaDados,
  POSMobileGravarComentariosLinhaContaPedido,
} from "@/types/comentarios";

export const dynamic =
  "force-dynamic";

const TAMANHO_MAXIMO_COMENTARIO =
  500;

function criarRespostaErro(
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

function numeroInteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
  );
}

function validarComentario(
  comentario: unknown,
  indice: number,
): string | null {
  if (
    !comentario ||
    typeof comentario !==
      "object"
  ) {
    return (
      `O comentário da posição ${
        indice + 1
      } é inválido.`
    );
  }

  const valor =
    comentario as
      Partial<POSMobileComentarioSelecionado>;

  if (
    !numeroInteiroPositivo(
      valor.idComentario,
    )
  ) {
    return (
      `O comentário da posição ${
        indice + 1
      } não possui um identificador válido.`
    );
  }

  if (
    typeof valor.comentarioLivre !==
      "boolean"
  ) {
    return (
      `O tipo do comentário ${
        valor.idComentario
      } é inválido.`
    );
  }

  if (
    typeof valor.texto !==
      "string" ||
    valor.texto.trim() === ""
  ) {
    return (
      `O comentário ${
        valor.idComentario
      } não possui texto.`
    );
  }

  if (
    valor.texto.trim().length >
      TAMANHO_MAXIMO_COMENTARIO
  ) {
    return (
      `O comentário ${
        valor.idComentario
      } ultrapassa o limite de ${
        TAMANHO_MAXIMO_COMENTARIO
      } caracteres.`
    );
  }

  if (
    valor.descricao !==
      undefined &&
    typeof valor.descricao !==
      "string"
  ) {
    return (
      `A descrição do comentário ${
        valor.idComentario
      } é inválida.`
    );
  }

  return null;
}

function normalizarComentarios(
  comentarios:
    POSMobileComentarioSelecionado[],
): POSMobileComentarioSelecionado[] {
  return comentarios.map(
    (comentario) => {
      const texto =
        comentario.texto.trim();

      const descricao =
        comentario.descricao
          ?.trim() ||
        texto;

      return {
        idComentario:
          comentario.idComentario,
        descricao,
        comentarioLivre:
          comentario.comentarioLivre,
        texto,
      };
    },
  );
}

function obterStatusGravacao(
  codigo: string,
): number {
  if (
    [
      "TOKEN_OBRIGATORIO",
      "TOKEN_INVALIDO",
      "SESSAO_INVALIDA",
      "SESSAO_EXPIRADA",
      "SESSAO_SEM_LOGIN",
    ].includes(codigo)
  ) {
    return 401;
  }

  if (
    codigo ===
      "SEM_PERMISSAO_COMENTARIOS"
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
      "SISTEMA_OCUPADO",
    ].includes(codigo)
  ) {
    return 409;
  }

  return 400;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const idGrupoComentarioTexto =
    request.nextUrl.searchParams.get(
      "idGrupoComentario",
    );

  if (
    idGrupoComentarioTexto ===
      null ||
    idGrupoComentarioTexto.trim() ===
      ""
  ) {
    return criarRespostaErro(
      400,
      "GRUPO_COMENTARIO_OBRIGATORIO",
      "O identificador do grupo de comentários deve ser indicado.",
    );
  }

  const idGrupoComentario =
    Number(
      idGrupoComentarioTexto,
    );

  if (
    !Number.isInteger(
      idGrupoComentario,
    ) ||
    idGrupoComentario < 0
  ) {
    return criarRespostaErro(
      400,
      "GRUPO_COMENTARIO_INVALIDO",
      "O identificador do grupo de comentários deve ser um número inteiro igual ou superior a zero.",
    );
  }

  try {
    const resposta =
      await getPosMobileApi<POSMobileComentariosResposta>(
        `ComentariosProduto/${idGrupoComentario}`,
      );

    const status =
      resposta.sucesso
        ? 200
        : [
              "GRUPO_COMENTARIO_INEXISTENTE",
              "GRUPO_COMENTARIO_NAO_ENCONTRADO",
              "GRUPO_COMENTARIOS_NAO_ENCONTRADO",
            ].includes(
              resposta.codigo,
            )
          ? 404
          : 400;

    return NextResponse.json(
      resposta,
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
      "Erro ao carregar os comentários do produto:",
      error,
    );

    return criarRespostaErro(
      502,
      "ERRO_COMENTARIOS_PRODUTO",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  let pedido:
    POSMobileGravarComentariosLinhaContaPedido;

  try {
    pedido =
      (await request.json()) as
        POSMobileGravarComentariosLinhaContaPedido;
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
      "DADOS_COMENTARIOS_INVALIDOS",
      "Os dados para gravar os comentários da linha não foram enviados.",
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
    !numeroInteiroPositivo(
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
    !numeroInteiroPositivo(
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
    !numeroInteiroPositivo(
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
    !Array.isArray(
      pedido.comentarios,
    )
  ) {
    return criarRespostaErro(
      400,
      "COMENTARIOS_OBRIGATORIOS",
      "A propriedade comentários deve ser enviada, mesmo quando a lista esteja vazia.",
    );
  }

  for (
    let indice = 0;
    indice <
      pedido.comentarios.length;
    indice += 1
  ) {
    const erro =
      validarComentario(
        pedido.comentarios[
          indice
        ],
        indice,
      );

    if (erro) {
      return criarRespostaErro(
        400,
        "COMENTARIO_INVALIDO",
        erro,
      );
    }
  }

  const pedidoNormalizado:
    POSMobileGravarComentariosLinhaContaPedido =
    {
      accessToken:
        pedido.accessToken.trim(),
      idMovimentoMesa:
        pedido.idMovimentoMesa,
      idInternoConta:
        pedido.idInternoConta,
      idLinha:
        pedido.idLinha,
      comentarios:
        normalizarComentarios(
          pedido.comentarios,
        ),
    };

  try {
    const resultado =
      await callPosMobileApi<
        POSMobileGravarComentariosLinhaContaDados
      >(
        "GravarComentariosLinhaConta",
        pedidoNormalizado,
      );

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : obterStatusGravacao(
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
      "Erro ao gravar os comentários da linha:",
      error,
    );

    return criarRespostaErro(
      502,
      "ERRO_GRAVAR_COMENTARIOS_LINHA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}
