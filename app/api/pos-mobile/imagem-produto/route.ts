//app\api\pos-mobile\imagem-produto\route.ts
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

const TIPOS_CONTEUDO: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

function respostaNaoEncontrada(): NextResponse {
  return new NextResponse(null, {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function obterExtensao(
  nome: string,
): string {
  const indicePonto =
    nome.lastIndexOf(".");

  if (indicePonto < 0) {
    return "";
  }

  return nome
    .slice(indicePonto)
    .toLowerCase();
}

function validarNomeImagem(
  nomeRecebido: string | null,
): string | null {
  if (!nomeRecebido) {
    return null;
  }

  const nome =
    nomeRecebido.trim();

  if (!nome) {
    return null;
  }

  /*
    Aceitar apenas o nome do ficheiro.

    Bloqueia:
      ../ficheiro.png
      pasta/ficheiro.png
      pasta\ficheiro.png
      nomes com caracteres de controlo
  */
  if (
    nome.includes("..") ||
    nome.includes("/") ||
    nome.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(nome)
  ) {
    return null;
  }

  const extensao =
    obterExtensao(nome);

  if (!TIPOS_CONTEUDO[extensao]) {
    return null;
  }

  return nome;
}

async function carregarImagemDaApiFNT(
  nome: string,
): Promise<NextResponse | null> {
  const urlBase =
    process.env
      .FNT_API_URL
      ?.trim()
      .replace(/\/+$/, "");

  if (!urlBase) {
    console.error(
      "FNT_API_URL não está configurada.",
    );

    return null;
  }

  const urlImagem =
    `${urlBase}/images/pos/${encodeURIComponent(
      nome,
    )}`;

  const controlador =
    new AbortController();

  const timeout =
    setTimeout(
      () => controlador.abort(),
      5000,
    );

  try {
    const response =
      await fetch(
        urlImagem,
        {
          method: "GET",
          headers: {
            Accept:
              "image/png,image/jpeg,image/gif,image/webp,image/bmp,*/*",
          },
          cache: "no-store",
          signal:
            controlador.signal,
        },
      );

    if (!response.ok) {
      console.warn(
        `Imagem não encontrada na API FNT: ${urlImagem} (${response.status})`,
      );

      return null;
    }

    const tipoRecebido =
      response.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() ??
      "";

    /*
      Evita devolver como imagem uma página HTML
      ou uma resposta JSON de erro com estado 200.
    */
    if (
      tipoRecebido &&
      !tipoRecebido.startsWith(
        "image/",
      )
    ) {
      console.warn(
        `A API FNT devolveu um conteúdo que não é imagem: ${tipoRecebido}`,
      );

      return null;
    }

    const conteudo =
      await response.arrayBuffer();

    if (conteudo.byteLength === 0) {
      return null;
    }

    const extensao =
      obterExtensao(nome);

    const tipoConteudo =
      tipoRecebido ||
      TIPOS_CONTEUDO[extensao] ||
      "application/octet-stream";

    return new NextResponse(
      conteudo,
      {
        status: 200,
        headers: {
          "Content-Type":
            tipoConteudo,
          "Cache-Control":
            "public, max-age=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.name !== "AbortError"
    ) {
      console.error(
        "Erro ao carregar imagem da API FNT:",
        error,
      );
    }

    return null;
  } finally {
    clearTimeout(
      timeout,
    );
  }
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const nome =
    validarNomeImagem(
      request.nextUrl.searchParams.get(
        "nome",
      ),
    );

  if (!nome) {
    return respostaNaoEncontrada();
  }

  const resposta =
    await carregarImagemDaApiFNT(
      nome,
    );

  if (resposta) {
    return resposta;
  }

  return respostaNaoEncontrada();
}