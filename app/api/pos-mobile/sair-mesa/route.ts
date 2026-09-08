//app\api\pos-mobile\sair-mesa\route.ts

import { NextRequest, NextResponse } from "next/server";

import { callPosMobileApi } from "@/lib/pos-mobile-api";

interface UsoMesaPedido {
  accessToken: string;
  idPosto: number;
  idSala: number;
  idPagina: number;
  idMesa: number;
}

interface UsoMesaDados {
  idPosto: number;
  idSala: number;
  idPagina: number;
  idMesa: number;
  emUso: boolean;
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

function inteiroPositivo(
  valor: unknown,
): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor > 0
  );
}

export async function POST(
  request: NextRequest,
) {
  let pedido: UsoMesaPedido;

  try {
    pedido =
      (await request.json()) as UsoMesaPedido;
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
      "DADOS_USO_MESA_INVALIDOS",
      "Os dados para sair da mesa não foram enviados.",
    );
  }

  if (
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    return respostaErro(
      400,
      "TOKEN_OBRIGATORIO",
      "O token da sessão deve ser indicado.",
    );
  }

  if (!inteiroPositivo(pedido.idPosto)) {
    return respostaErro(
      400,
      "POSTO_INVALIDO",
      "O identificador do posto deve ser superior a zero.",
    );
  }

  if (!inteiroPositivo(pedido.idSala)) {
    return respostaErro(
      400,
      "SALA_INVALIDA",
      "O identificador da sala deve ser superior a zero.",
    );
  }

  if (!inteiroPositivo(pedido.idPagina)) {
    return respostaErro(
      400,
      "PAGINA_INVALIDA",
      "O identificador da página deve ser superior a zero.",
    );
  }

  if (!inteiroPositivo(pedido.idMesa)) {
    return respostaErro(
      400,
      "MESA_INVALIDA",
      "O identificador da mesa deve ser superior a zero.",
    );
  }

  try {
    const resultado =
      await callPosMobileApi<UsoMesaDados>(
        "SairMesa",
        {
          ...pedido,
          accessToken:
            pedido.accessToken.trim(),
        },
      );

    return NextResponse.json(
      resultado,
      {
        status:
          resultado.sucesso
            ? 200
            : resultado.codigo ===
                "MESA_EM_USO"
              ? 409
              : 400,
      },
    );
  } catch (error) {
    return respostaErro(
      502,
      "ERRO_SAIR_MESA",
      error instanceof Error
        ? error.message
        : "Não foi possível libertar a utilização da mesa.",
    );
  }
}