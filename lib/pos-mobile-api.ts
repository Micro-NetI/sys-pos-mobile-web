import { env } from "@/lib/env";

import type {
  ApiResponse,
} from "@/types/autenticacao";

import type {
  ContextoPostoDados,
} from "@/types/contexto";

function createBasicAuthorization(): string {
  const credentials = Buffer.from(
    `${env.apiUsername}:${env.apiPassword}`,
    "utf8",
  ).toString("base64");

  return `Basic ${credentials}`;
}

function limitarTexto(
  texto: string,
  tamanhoMaximo = 2000,
): string {
  if (texto.length <= tamanhoMaximo) {
    return texto;
  }

  return `${texto.slice(0, tamanhoMaximo)}...`;
}

function interpretarRespostaDataSnap<T>(
  responseText: string,
): T {
  let payload: unknown;

  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(
      `A APIFNT não devolveu JSON válido: ${limitarTexto(
        responseText,
      )}`,
    );
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("result" in payload)
  ) {
    throw new Error(
      "A APIFNT devolveu uma estrutura sem a propriedade result.",
    );
  }

  const dataSnapPayload = payload as {
    result?: unknown[];
  };

  if (!Array.isArray(dataSnapPayload.result)) {
    throw new Error(
      "A propriedade result devolvida pela APIFNT não é uma lista.",
    );
  }

  const primeiroResultado =
    dataSnapPayload.result[0];

  if (primeiroResultado === undefined) {
    throw new Error(
      "A APIFNT devolveu uma resposta sem resultado.",
    );
  }

  /*
    Alguns métodos DataSnap devolvem um objeto diretamente:

    {
      "result": [
        {
          "sucesso": true
        }
      ]
    }

    Outros devolvem JSON convertido numa string:

    {
      "result": [
        "{\"sucesso\":true}"
      ]
    }
  */
  if (typeof primeiroResultado === "string") {
    try {
      return JSON.parse(
        primeiroResultado,
      ) as T;
    } catch {
      throw new Error(
        `A APIFNT devolveu JSON interno inválido: ${limitarTexto(
          primeiroResultado,
        )}`,
      );
    }
  }

  return primeiroResultado as T;
}

async function executarPedidoApi(
  url: string,
  options: RequestInit,
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,

      headers: {
        Accept: "application/json",

        Authorization:
          createBasicAuthorization(),

        ...options.headers,
      },

      cache: "no-store",
    });
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    throw new Error(
      `Não foi possível comunicar com a APIFNT: ${mensagem}`,
    );
  }

  const responseText =
    await response.text();

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        `A APIFNT recusou a autenticação. HTTP ${response.status}.`,
      );
    }

    throw new Error(
      `Erro na APIFNT. HTTP ${response.status}: ${limitarTexto(
        responseText,
      )}`,
    );
  }

  if (!responseText.trim()) {
    throw new Error(
      "A APIFNT devolveu uma resposta vazia.",
    );
  }

  return responseText;
}

/**
 * Executa um método POST do módulo POS Mobile.
 *
 * Exemplo:
 *
 * callPosMobileApi<LoginResultado>(
 *   "updateLoginOperador",
 *   dadosLogin,
 * );
 */
export async function callPosMobileApi<T>(
  endpoint: string,
  body: unknown,
): Promise<ApiResponse<T>> {
  const endpointNormalizado =
    endpoint.replace(/^\/+/, "");

  const url =
    `${env.apiUrl}/TSysModulePOSMobile/` +
    endpointNormalizado;

  console.log(
    "Endpoint POST enviado:",
    endpointNormalizado,
  );

  console.log(
    "URL completa enviada à APIFNT:",
    url,
  );

  const responseText =
    await executarPedidoApi(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
      },

      body: JSON.stringify(body),
    });

  return interpretarRespostaDataSnap<
    ApiResponse<T>
  >(responseText);
}

/**
 * Executa um método GET do módulo POS Mobile.
 *
 * O tipo T deve corresponder ao primeiro elemento
 * devolvido dentro de:
 *
 * {
 *   "result": [
 *     T
 *   ]
 * }
 */
export async function getPosMobileApi<T>(
  endpoint: string,
): Promise<T> {
  const endpointNormalizado =
    endpoint.replace(/^\/+/, "");

  const url =
    `${env.apiUrl}/TSysModulePOSMobile/` +
    endpointNormalizado;

  console.log(
    "Endpoint GET enviado:",
    endpointNormalizado,
  );

  console.log(
    "URL completa enviada à APIFNT:",
    url,
  );

  const responseText =
    await executarPedidoApi(url, {
      method: "GET",
    });

  return interpretarRespostaDataSnap<T>(
    responseText,
  );
}

/**
 * Obtém o contexto operacional do posto.
 *
 * Endpoint Delphi:
 *
 * ContextoPosto/{idPosto}
 *
 * Exemplo:
 *
 * ContextoPosto/4
 */
export async function obterContextoPosto(
  idPosto: number,
): Promise<ApiResponse<ContextoPostoDados>> {
  if (
    !Number.isInteger(idPosto) ||
    idPosto <= 0
  ) {
    throw new Error(
      "O identificador do posto deve ser um número inteiro superior a zero.",
    );
  }

  console.log(
    "========== CONTEXTO POS MOBILE ==========",
  );

  console.log(
    "ID do posto carregado:",
    idPosto,
  );

  const endpoint =
    `ContextoPosto/${idPosto}`;

  console.log(
    "Endpoint enviado:",
    endpoint,
  );

  const resposta =
    await getPosMobileApi<
      ApiResponse<ContextoPostoDados>
    >(
      endpoint,
    );

  if (
    resposta.sucesso &&
    resposta.dados
  ) {
    resposta.dados.segue = {
      pedidosCozinhaSegue:
        resposta.dados.segue
          ?.pedidosCozinhaSegue ??
        false,

      pedidoSegueGrupoPreparacao:
        resposta.dados.segue
          ?.pedidoSegueGrupoPreparacao ??
        false,

      abreFormSegueClicarMesas:
        resposta.dados.segue
          ?.abreFormSegueClicarMesas ??
        false,
    };
  }

  console.log(
    "Contexto recebido:",
    resposta,
  );

  return resposta;
}

/* ==========================================================================
   PAGAMENTOS INTEGRADOS / TPA
   ========================================================================== */

export interface PagamentoClientePedido {
  idEntidade: number;
}

export interface PagamentoPedido {
  accessToken: string;

  idMovimentoMesa: number;
  idInternoConta: number;
  idPagamentoDoc: number;

  cliente: PagamentoClientePedido;

  idTipoServico?: number;
  idTipoRefeicao?: number;
  idMercado?: number;

  idTipoDesconto?: number;
  idMotivoDesconto?: number;
  justificacaoDesconto?: string;

  referencia?: string;
  valorEntregue?: number;

  imprimir?: boolean;
  enviarEmail?: boolean;
  email?: string;

  idReservaHotel?: number;
}

export interface PagamentoIntegradoDados {
  pedidoId: string;
  estado: string;
  transactionId: string;
  referencia: string;

  valor: number;
  valorCentimos: number;

  idVndCabDocumento: number;
  documento: string;
}


/* ==========================================================================
   INICIAR PAGAMENTO INTEGRADO
   ========================================================================== */

export async function iniciarPagamentoIntegrado(
  pedido: PagamentoPedido,
): Promise<
  ApiResponse<PagamentoIntegradoDados>
> {
  if (
    !pedido ||
    typeof pedido.accessToken !==
      "string" ||
    pedido.accessToken.trim() === ""
  ) {
    throw new Error(
      "O token da sessão deve ser indicado.",
    );
  }

  if (
    !Number.isInteger(
      pedido.idMovimentoMesa,
    ) ||
    pedido.idMovimentoMesa <= 0
  ) {
    throw new Error(
      "O movimento da mesa é inválido.",
    );
  }

  if (
    !Number.isInteger(
      pedido.idInternoConta,
    ) ||
    pedido.idInternoConta <= 0
  ) {
    throw new Error(
      "A conta é inválida.",
    );
  }

  if (
    !Number.isInteger(
      pedido.idPagamentoDoc,
    ) ||
    pedido.idPagamentoDoc <= 0
  ) {
    throw new Error(
      "O pagamento é inválido.",
    );
  }

  if (
    !pedido.cliente ||
    !Number.isInteger(
      pedido.cliente.idEntidade,
    ) ||
    pedido.cliente.idEntidade <= 0
  ) {
    throw new Error(
      "O cliente do pagamento é inválido.",
    );
  }

  console.log(
    "========== INICIAR PAGAMENTO INTEGRADO ==========",
  );

  console.log(
    "Pedido:",
    pedido,
  );

  return callPosMobileApi<
    PagamentoIntegradoDados
  >(
    "IniciarPagamentoIntegrado",
    {
      ...pedido,

      accessToken:
        pedido.accessToken.trim(),
    },
  );
}


/* ==========================================================================
   CONSULTAR ESTADO DO PAGAMENTO INTEGRADO
   ========================================================================== */

export async function obterEstadoPagamentoIntegrado(
  accessToken: string,
  pedidoId: string,
): Promise<
  ApiResponse<PagamentoIntegradoDados>
> {
  const token =
    accessToken?.trim() ?? "";

  const idPedido =
    pedidoId?.trim() ?? "";

  if (!token) {
    throw new Error(
      "O token da sessão deve ser indicado.",
    );
  }

  if (!idPedido) {
    throw new Error(
      "O identificador do pedido de pagamento deve ser indicado.",
    );
  }

  console.log(
    "========== ESTADO PAGAMENTO INTEGRADO ==========",
  );

  console.log(
    "PedidoId:",
    idPedido,
  );

  return callPosMobileApi<
    PagamentoIntegradoDados
  >(
    "EstadoPagamentoIntegrado",
    {
      accessToken:
        token,

      pedidoId:
        idPedido,
    },
  );
}


/* ==========================================================================
   FINALIZAR PAGAMENTO INTEGRADO
   ========================================================================== */

export async function finalizarPagamentoIntegrado(
  accessToken: string,
  pedidoId: string,
  pagamento: Omit<
    PagamentoPedido,
    "accessToken"
  >,
): Promise<
  ApiResponse<PagamentoIntegradoDados>
> {
  const token =
    accessToken?.trim() ?? "";

  const idPedido =
    pedidoId?.trim() ?? "";

  if (!token) {
    throw new Error(
      "O token da sessão deve ser indicado.",
    );
  }

  if (!idPedido) {
    throw new Error(
      "O identificador do pedido de pagamento deve ser indicado.",
    );
  }

  if (!pagamento) {
    throw new Error(
      "Os dados do pagamento devem ser indicados.",
    );
  }

  console.log(
    "========== FINALIZAR PAGAMENTO INTEGRADO ==========",
  );

  console.log(
    "PedidoId:",
    idPedido,
  );

  console.log(
    "Pagamento:",
    pagamento,
  );

  return callPosMobileApi<
    PagamentoIntegradoDados
  >(
    "FinalizarPagamentoIntegrado",
    {
      accessToken:
        token,

      pedidoId:
        idPedido,

      pagamento,
    },
  );
}


/* ==========================================================================
   AUXILIARES DO FLUXO TPA
   ========================================================================== */

export function pagamentoIntegradoTerminou(
  estado: string,
): boolean {
  const estadoNormalizado =
    estado
      ?.trim()
      .toUpperCase() ?? "";

  return [
    "APROVADO",
    "RECUSADO",
    "CANCELADO",
    "ERRO",
    "ERRO_ENVIO",
    "EXPIRADO",
    "ASSOCIADO_VENDA",
    "ERRO_GRAVACAO_VENDA",
  ].includes(
    estadoNormalizado,
  );
}

export function pagamentoIntegradoAprovado(
  estado: string,
): boolean {
  const estadoNormalizado =
    estado
      ?.trim()
      .toUpperCase() ?? "";

  return (
    estadoNormalizado ===
      "APROVADO" ||
    estadoNormalizado ===
      "ASSOCIADO_VENDA"
  );
}