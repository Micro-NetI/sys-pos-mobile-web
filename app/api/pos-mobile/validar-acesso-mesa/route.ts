//app\api\pos-mobile\validar-acesso-mesa\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getPosMobileApi,
} from "@/lib/pos-mobile-api";

interface POSMobileEstadoMesaValidacao {
  idPosto: number | null;
  idSala: number | null;
  idPagina: number | null;
  idMesa: number | null;
  numeroMesa: number;
  descricaoMesa: string | null;
  descricaoSala: string | null;
  estado:
    | "LIVRE"
    | "OCUPADA"
    | "EM_USO"
    | "RESERVADA"
    | "BLOQUEADA";
  ocupada: boolean;
  emUso: boolean;
  reservada: boolean;
  bloqueada: boolean;
  idMovimentoMesa: number | null;
  idPostoMovimento: number | null;
  numeroContas: number;
  numeroPessoas: number;
  valorAtual: number;
  utilizador: string | null;
  postoEmUso: string | null;
  dataAbertura: string | null;
  horaAbertura: string | null;
  podeEntrar: boolean;
  podeAbrir: boolean;
  codigoAcesso: string | null;
  mensagemAcesso: string | null;
}

interface POSMobileValidarAcessoMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileEstadoMesaValidacao | null;
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

function lerInteiroPositivo(
  request: NextRequest,
  nome: string,
): number | null {
  const valorTexto =
    request.nextUrl.searchParams.get(
      nome,
    );

  if (!valorTexto) {
    return null;
  }

  const valor =
    Number(valorTexto);

  if (
    !Number.isInteger(valor) ||
    valor <= 0
  ) {
    return null;
  }

  return valor;
}

export async function GET(
  request: NextRequest,
) {
  const idPosto =
    lerInteiroPositivo(
      request,
      "idPosto",
    );

  const idSala =
    lerInteiroPositivo(
      request,
      "idSala",
    );

  const idPagina =
    lerInteiroPositivo(
      request,
      "idPagina",
    );

  const idMesa =
    lerInteiroPositivo(
      request,
      "idMesa",
    );

  if (idPosto === null) {
    return respostaErro(
      400,
      "POSTO_INVALIDO",
      "O identificador do posto deve ser superior a zero.",
    );
  }

  if (idSala === null) {
    return respostaErro(
      400,
      "SALA_INVALIDA",
      "O identificador da sala deve ser superior a zero.",
    );
  }

  if (idPagina === null) {
    return respostaErro(
      400,
      "PAGINA_INVALIDA",
      "O identificador da página deve ser superior a zero.",
    );
  }

  if (idMesa === null) {
    return respostaErro(
      400,
      "MESA_INVALIDA",
      "O identificador da mesa deve ser superior a zero.",
    );
  }

  try {
    const resultado =
      await getPosMobileApi<POSMobileValidarAcessoMesaResposta>(
        [
          "ValidarAcessoMesa",
          idPosto,
          idSala,
          idPagina,
          idMesa,
        ].join("/"),
      );

    const status =
      resultado.sucesso
        ? 200
        : resultado.codigo ===
              "MESA_ABERTA_NOUTRO_POSTO" ||
            resultado.codigo ===
              "MESA_EM_USO" ||
            resultado.codigo ===
              "MESA_BLOQUEADA" ||
            resultado.codigo ===
              "MESA_RESERVADA"
          ? 409
          : resultado.codigo ===
                "POSTO_INEXISTENTE" ||
              resultado.codigo ===
                "MESA_NAO_DISPONIVEL_NO_POSTO" ||
              resultado.codigo ===
                "ESTADO_MESA_NAO_ENCONTRADO"
            ? 404
            : 400;

    return NextResponse.json(
      resultado,
      {
        status,
      },
    );
  } catch (error) {
    console.error(
      "Erro ao validar acesso à mesa:",
      error,
    );

    return respostaErro(
      500,
      "ERRO_VALIDAR_ACESSO_MESA",
      error instanceof Error
        ? error.message
        : "Não foi possível comunicar com a API POS Mobile.",
    );
  }
}