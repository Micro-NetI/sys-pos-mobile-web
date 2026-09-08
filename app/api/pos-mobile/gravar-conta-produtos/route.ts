//app\api\pos-mobile\gravar-conta-produtos\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  callPosMobileApi,
} from "@/lib/pos-mobile-api";

interface ComentarioProdutoPedido {
  idComentario: number;
  descricao: string;
  comentarioLivre: boolean;
  texto: string;
}

interface ProdutoNovaContaPedido {
  idProduto: number;
  idBotao: number | null;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  precoVariavel: boolean;
  precoAlterado: boolean;
  justificacaoAlteracaoPreco:
    string | null;
  observacao: string | null;
  idGrupoPreparacao: number | null;
  idArmazem: number | null;
  idClassePrecos: number | null;
  idTabelaPrecos: number | null;

  /**
   * O campo pode não existir em pedidos antigos.
   * Antes do envio para a API Delphi é normalizado
   * para uma lista vazia.
   */
  comentarios?:
    ComentarioProdutoPedido[];
}

interface ProdutoNovaContaNormalizado
  extends Omit<
    ProdutoNovaContaPedido,
    "comentarios"
  > {
  comentarios:
    ComentarioProdutoPedido[];
}

interface GravarContaProdutosPedido {
  accessToken: string;
  idPosto: number;

  idSala: number;
  idPagina: number;
  idMesa: number;

  idMovimentoMesa: number;
  idInternoConta: number;
  numeroConta: number;
  numeroPessoas: number;

  idEntidade?: number;
  nomeEntidade?: string | null;
  quarto?: string | null;
  idReserva?: number;
  observacaoMesa?: string | null;

  idClassePrecos: number;

  produtos:
    ProdutoNovaContaPedido[];
}

interface GravarContaProdutosPedidoNormalizado
  extends Omit<
    GravarContaProdutosPedido,
    "produtos"
  > {
  produtos:
    ProdutoNovaContaNormalizado[];
}

interface GravarContaProdutosDados {
  idMovimentoMesa: number;
  idInternoConta: number;
  numeroConta: number;
  numeroPessoas: number;
  numeroProdutosGravados: number;
  valorTotalGravado: number;
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

function numeroInteiroNaoNegativo(
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

function textoOuNullValido(
  valor: unknown,
): valor is string | null | undefined {
  return (
    valor === undefined ||
    valor === null ||
    typeof valor === "string"
  );
}

function validarComentario(
  comentario:
    ComentarioProdutoPedido,
  indiceProduto: number,
  indiceComentario: number,
): string | null {
  if (
    !comentario ||
    typeof comentario !== "object"
  ) {
    return (
      `O comentário da posição ${
        indiceComentario + 1
      } do produto da posição ${
        indiceProduto + 1
      } é inválido.`
    );
  }

  if (
    !numeroInteiroPositivo(
      comentario.idComentario,
    )
  ) {
    return (
      `O comentário da posição ${
        indiceComentario + 1
      } do produto da posição ${
        indiceProduto + 1
      } não possui um identificador válido.`
    );
  }

  if (
    typeof comentario.descricao !==
    "string"
  ) {
    return (
      `A descrição do comentário ${
        comentario.idComentario
      } é inválida.`
    );
  }

  if (
    typeof comentario.comentarioLivre !==
    "boolean"
  ) {
    return (
      `A indicação de comentário livre do comentário ${
        comentario.idComentario
      } é inválida.`
    );
  }

  if (
    typeof comentario.texto !==
    "string"
  ) {
    return (
      `O texto do comentário ${
        comentario.idComentario
      } é inválido.`
    );
  }

  const descricao =
    comentario.descricao.trim();

  const texto =
    comentario.texto.trim();

  if (
    descricao === "" &&
    texto === ""
  ) {
    return (
      `O comentário ${
        comentario.idComentario
      } deve possuir descrição ou texto.`
    );
  }

  if (
    comentario.comentarioLivre &&
    texto === ""
  ) {
    return (
      `Deve indicar o texto do comentário livre ${
        comentario.idComentario
      }.`
    );
  }

  return null;
}

function validarProduto(
  produto: ProdutoNovaContaPedido,
  indice: number,
): string | null {
  if (
    !produto ||
    typeof produto !== "object"
  ) {
    return (
      `O produto da posição ${
        indice + 1
      } é inválido.`
    );
  }

  if (
    !numeroInteiroPositivo(
      produto.idProduto,
    )
  ) {
    return (
      `O produto da posição ${
        indice + 1
      } não possui um identificador válido.`
    );
  }

  if (
    typeof produto.descricao !==
      "string" ||
    produto.descricao.trim() === ""
  ) {
    return (
      `O produto ${
        produto.idProduto
      } não possui descrição.`
    );
  }

  if (
    !numeroPositivo(
      produto.quantidade,
    )
  ) {
    return (
      `A quantidade do produto ${
        produto.idProduto
      } deve ser superior a zero.`
    );
  }

  if (
    !numeroNaoNegativo(
      produto.precoUnitario,
    )
  ) {
    return (
      `O preço unitário do produto ${
        produto.idProduto
      } é inválido.`
    );
  }

  if (
    !numeroNaoNegativo(
      produto.valorTotal,
    )
  ) {
    return (
      `O valor total do produto ${
        produto.idProduto
      } é inválido.`
    );
  }

  const valorCalculado =
    produto.quantidade *
    produto.precoUnitario;

  if (
    Math.abs(
      valorCalculado -
        produto.valorTotal,
    ) > 0.01
  ) {
    return (
      `O valor total do produto ${
        produto.idProduto
      } não corresponde à quantidade multiplicada pelo preço unitário.`
    );
  }

  if (
    typeof produto.precoVariavel !==
    "boolean"
  ) {
    return (
      `A indicação de preço variável do produto ${
        produto.idProduto
      } é inválida.`
    );
  }

  if (
    typeof produto.precoAlterado !==
    "boolean"
  ) {
    return (
      `A indicação de preço alterado do produto ${
        produto.idProduto
      } é inválida.`
    );
  }

  if (
    produto.precoAlterado &&
    (
      typeof produto
        .justificacaoAlteracaoPreco !==
        "string" ||
      produto
        .justificacaoAlteracaoPreco
        .trim() === ""
    )
  ) {
    return (
      `Deve indicar a justificação da alteração de preço do produto ${
        produto.idProduto
      }.`
    );
  }

  if (
    produto.precoVariavel &&
    produto.precoUnitario <= 0
  ) {
    return (
      `Deve indicar o preço do produto variável ${
        produto.idProduto
      }.`
    );
  }

  if (
    !textoOuNullValido(
      produto.observacao,
    )
  ) {
    return (
      `A observação do produto ${
        produto.idProduto
      } é inválida.`
    );
  }

  if (
    produto.comentarios !==
      undefined &&
    !Array.isArray(
      produto.comentarios,
    )
  ) {
    return (
      `A lista de comentários do produto ${
        produto.idProduto
      } é inválida.`
    );
  }

  const comentarios =
    produto.comentarios ?? [];

  for (
    let indiceComentario = 0;
    indiceComentario <
      comentarios.length;
    indiceComentario += 1
  ) {
    const erroComentario =
      validarComentario(
        comentarios[
          indiceComentario
        ],
        indice,
        indiceComentario,
      );

    if (erroComentario) {
      return erroComentario;
    }
  }

  return null;
}

function normalizarComentario(
  comentario:
    ComentarioProdutoPedido,
): ComentarioProdutoPedido {
  const descricao =
    comentario.descricao.trim();

  const textoRecebido =
    comentario.texto.trim();

  return {
    idComentario:
      comentario.idComentario,

    descricao,

    comentarioLivre:
      comentario.comentarioLivre,

    texto:
      textoRecebido ||
      descricao,
  };
}

function normalizarPedido(
  pedido:
    GravarContaProdutosPedido,
): GravarContaProdutosPedidoNormalizado {
  return {
    ...pedido,

    produtos:
      pedido.produtos.map(
        (produto) => ({
          ...produto,

          descricao:
            produto.descricao.trim(),

          justificacaoAlteracaoPreco:
            produto
              .justificacaoAlteracaoPreco
              ?.trim() || null,

          observacao:
            produto.observacao
              ?.trim() || null,

          comentarios:
            (
              produto.comentarios ??
              []
            ).map(
              normalizarComentario,
            ),
        }),
      ),
  };
}

export async function POST(
  request: NextRequest,
) {
  let pedido:
    GravarContaProdutosPedido;

  try {
    pedido =
      (await request.json()) as
        GravarContaProdutosPedido;
  } catch {
    return respostaErro(
      400,
      "JSON_INVALIDO",
      "O corpo do pedido não contém um JSON válido.",
    );
  }

  if (
    !pedido ||
    typeof pedido !== "object"
  ) {
    return respostaErro(
      400,
      "DADOS_INVALIDOS",
      "Os dados para gravar a conta e os produtos não foram enviados.",
    );
  }

  if (
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return respostaErro(
      401,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  if (
    !numeroInteiroPositivo(
      pedido.idPosto,
    )
  ) {
    return respostaErro(
      400,
      "POSTO_INVALIDO",
      "O identificador do posto deve ser superior a zero.",
    );
  }

  if (
    !numeroInteiroPositivo(
      pedido.idSala,
    )
  ) {
    return respostaErro(
      400,
      "SALA_INVALIDA",
      "O identificador da sala deve ser superior a zero.",
    );
  }

  if (
    !numeroInteiroPositivo(
      pedido.idPagina,
    )
  ) {
    return respostaErro(
      400,
      "PAGINA_INVALIDA",
      "O identificador da página deve ser superior a zero.",
    );
  }

  if (
    !numeroInteiroPositivo(
      pedido.idMesa,
    )
  ) {
    return respostaErro(
      400,
      "MESA_INVALIDA",
      "O identificador da mesa deve ser superior a zero.",
    );
  }

  if (
    !numeroInteiroNaoNegativo(
      pedido.idMovimentoMesa,
    )
  ) {
    return respostaErro(
      400,
      "MOVIMENTO_MESA_INVALIDO",
      "O identificador do movimento da mesa não pode ser negativo.",
    );
  }

  if (
    !numeroInteiroNaoNegativo(
      pedido.idInternoConta,
    )
  ) {
    return respostaErro(
      400,
      "CONTA_INVALIDA",
      "O identificador interno da conta não pode ser negativo.",
    );
  }

  if (
    pedido.idInternoConta > 0 &&
    pedido.idMovimentoMesa <= 0
  ) {
    return respostaErro(
      400,
      "CONTA_SEM_MOVIMENTO",
      "Foi indicada uma conta existente sem o respetivo movimento de mesa.",
    );
  }

  if (
    !numeroInteiroPositivo(
      pedido.numeroConta,
    )
  ) {
    return respostaErro(
      400,
      "NUMERO_CONTA_INVALIDO",
      "O número da conta deve ser superior a zero.",
    );
  }

  if (
    !numeroInteiroNaoNegativo(
      pedido.numeroPessoas,
    )
  ) {
    return respostaErro(
      400,
      "NUMERO_PESSOAS_INVALIDO",
      "O número de pessoas não pode ser negativo.",
    );
  }

  if (
    !numeroInteiroNaoNegativo(
      pedido.idClassePrecos,
    )
  ) {
    return respostaErro(
      400,
      "CLASSE_PRECOS_INVALIDA",
      "O identificador da classe de preços é inválido.",
    );
  }

  if (
    !Array.isArray(
      pedido.produtos,
    )
  ) {
    return respostaErro(
      400,
      "LISTA_PRODUTOS_INVALIDA",
      "A lista de produtos é inválida.",
    );
  }

  for (
    let indice = 0;
    indice <
      pedido.produtos.length;
    indice += 1
  ) {
    const erro =
      validarProduto(
        pedido.produtos[
          indice
        ],
        indice,
      );

    if (erro) {
      return respostaErro(
        400,
        "PRODUTO_INVALIDO",
        erro,
      );
    }
  }

  const pedidoNormalizado =
    normalizarPedido(
      pedido,
    );

  try {
    const resultado =
      await callPosMobileApi<
        GravarContaProdutosDados
      >(
        "GravarContaProdutos",
        pedidoNormalizado,
      );

    const status =
      resultado.sucesso
        ? 200
        : resultado.codigo ===
              "TOKEN_INVALIDO" ||
            resultado.codigo ===
              "SESSAO_EXPIRADA"
          ? 401
          : resultado.codigo ===
                "MESA_EM_USO" ||
              resultado.codigo ===
                "ACESSO_MESA_NEGADO"
            ? 409
            : 400;

    return NextResponse.json(
      resultado,
      {
        status,
      },
    );
  } catch (error) {
    console.error(
      "Erro ao gravar a conta e os produtos:",
      error,
    );

    return respostaErro(
      500,
      "ERRO_GRAVAR_CONTA_PRODUTOS",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}