"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
} from "react";

interface POSMobileCatalogoBotao {
  idBotao: number | null;
  idGrupo: number;
  idGProdutos: number;
  numeroPagina: number;
  posicao: number;

  tipoBotao:
    | "PRODUTO"
    | "LINK"
    | "DESCONHECIDO";

  idProduto: number | null;
  idGrupoLink: number | null;

  descricao: string;
  descricaoPagina: string | null;
  tipoProduto: string | null;

  preco: number;
  precoEncontrado: boolean;
  precoVariavel: boolean;

  cor: string | null;
  corLetra: string | null;
  corPreco: string | null;
  corPrecoLetra: string | null;
  nomeImagem: string | null;

  tamanhoLetra: number;
  letraNegrito: boolean;
  letraItalico: boolean;
  letraSublinhado: boolean;

  usaBevel: boolean;
  larguraBevel: number;
  corBevel: string | null;

  tamanhoBotao: number;

  favorito: boolean;
  visivel: boolean;

  abrirComentario: boolean;
  idGrupoComentario: number | null;
  fecharJanelaLink: boolean;
}

interface POSMobileCatalogoPagina {
  idGrupo: number;
  idGProdutos: number;
  numeroPagina: number;
  descricao: string | null;
  ordem: number;
  botoes: POSMobileCatalogoBotao[];
}

interface POSMobileCatalogoGrupo {
  idGrupo: number;
  descricao: string;
  ordem: number;

  favorito: boolean;
  visivel: boolean;

  cor: string | null;
  corLetra: string | null;
  nomeImagem: string | null;

  tamanhoLetra: number;
  letraNegrito: boolean;
  letraItalico: boolean;
  letraSublinhado: boolean;

  usaBevel: boolean;
  larguraBevel: number;
  corBevel: string | null;

  paginas: POSMobileCatalogoPagina[];
}

interface POSMobileCatalogo {
  grupos: POSMobileCatalogoGrupo[];
}

interface EstilosVisuaisBotao {
  cartao: CSSProperties;
  texto: CSSProperties;
  preco: CSSProperties;
}

interface EditorConsumoProps {
  catalogo: POSMobileCatalogo | null;

  idGrupoSelecionado: number | null;
  idPaginaSelecionada: number | null;

  pesquisa: string;

  aAdicionarPrograma?: boolean;

  /**
   * Chave temporária do produto acabado de adicionar.
   * É usada apenas para feedback visual.
   */
  produtoAdicionadoFeedback?: string | null;

  onSelecionarGrupo: (
    grupo: POSMobileCatalogoGrupo,
  ) => void;

  onSelecionarPagina: (
    pagina: POSMobileCatalogoPagina,
  ) => void;

  onPesquisaChange: (
    valor: string,
  ) => void;

  /**
   * A page continua responsável por decidir o comportamento:
   * PRODUTO -> pipeline normal de produto
   * LINK    -> abrir Grupo Link
   */
  onSelecionarBotao: (
    botao: POSMobileCatalogoBotao,
  ) => void;
}

const USAR_CONFIGURACAO_PRODUTOS =
  process.env
    .NEXT_PUBLIC_POS_USAR_CONFIGURACAO_PRODUTOS
    ?.trim()
    .toLowerCase() === "true";

const CORES_DELPHI: Record<
  string,
  string
> = {
  clblack: "#000000",
  clmaroon: "#800000",
  clgreen: "#008000",
  clolive: "#808000",
  clnavy: "#000080",
  clpurple: "#800080",
  clteal: "#008080",
  clgray: "#808080",
  clsilver: "#c0c0c0",
  clred: "#ff0000",
  cllime: "#00ff00",
  clyellow: "#ffff00",
  clblue: "#0000ff",
  clfuchsia: "#ff00ff",
  claqua: "#00ffff",
  clwhite: "#ffffff",
  clmoneygreen: "#c0dcc0",
  clskyblue: "#a6caf0",
  clcream: "#fffdd0",
  clmedgray: "#a0a0a4",
  clwindow: "#ffffff",
  clwindowtext: "#000000",
  clbtnface: "#f0f0f0",
  clbtntext: "#000000",
  clhighlight: "#0078d7",
  clhighlighttext: "#ffffff",
};

function limitarNumero(
  valor: number,
  minimo: number,
  maximo: number,
): number | null {
  if (!Number.isFinite(valor)) {
    return null;
  }

  return Math.min(
    maximo,
    Math.max(
      minimo,
      valor,
    ),
  );
}

function converterCorDelphi(
  valor: string | null,
): string | undefined {
  if (!valor) {
    return undefined;
  }

  const normalizado =
    valor
      .trim()
      .toLowerCase();

  if (!normalizado) {
    return undefined;
  }

  const corConhecida =
    CORES_DELPHI[
      normalizado
    ];

  if (corConhecida) {
    return corConhecida;
  }

  if (
    /^#[0-9a-f]{6}$/i.test(
      normalizado,
    )
  ) {
    return normalizado;
  }

  if (
    /^#[0-9a-f]{3}$/i.test(
      normalizado,
    )
  ) {
    return normalizado;
  }

  if (
    /^\$[0-9a-f]{8}$/i.test(
      normalizado,
    )
  ) {
    const numero =
      Number.parseInt(
        normalizado.slice(1),
        16,
      );

    if (
      !Number.isFinite(
        numero,
      )
    ) {
      return undefined;
    }

    const vermelho =
      numero & 0xff;

    const verde =
      (numero >> 8) & 0xff;

    const azul =
      (numero >> 16) & 0xff;

    return `#${vermelho
      .toString(16)
      .padStart(2, "0")}${verde
      .toString(16)
      .padStart(2, "0")}${azul
      .toString(16)
      .padStart(2, "0")}`;
  }

  return undefined;
}

function obterNomeImagemSeguro(
  nomeImagem: string | null,
): string | null {
  if (!nomeImagem) {
    return null;
  }

  const nome =
    nomeImagem.trim();

  if (
    !nome ||
    nome.includes("/") ||
    nome.includes("\\") ||
    nome.includes("..")
  ) {
    return null;
  }

  if (
    !/^[\p{L}\p{N} _().-]+\.(png|jpe?g|gif|webp|bmp)$/iu.test(
      nome,
    )
  ) {
    return null;
  }

  return nome;
}

function criarEstilosVisuaisBotao(
  botao: POSMobileCatalogoBotao,
): EstilosVisuaisBotao {
  const corFundo =
    converterCorDelphi(
      botao.cor,
    );

  const corTexto =
    converterCorDelphi(
      botao.corLetra,
    );

  const corFundoPreco =
    converterCorDelphi(
      botao.corPreco,
    );

  const corTextoPreco =
    converterCorDelphi(
      botao.corPrecoLetra,
    );

  const corBevel =
    converterCorDelphi(
      botao.corBevel,
    );

  const tamanhoLetra =
    limitarNumero(
      botao.tamanhoLetra,
      11,
      28,
    );

  const larguraBevel =
    limitarNumero(
      botao.larguraBevel,
      1,
      6,
    );

  return {
    cartao: {
      backgroundColor:
        corFundo,

      borderColor:
        botao.usaBevel
          ? corBevel
          : undefined,

      borderWidth:
        botao.usaBevel &&
        larguraBevel !== null
          ? `${larguraBevel}px`
          : undefined,
    },

    texto: {
      color:
        corTexto,

      fontSize:
        tamanhoLetra !== null
          ? `${tamanhoLetra}px`
          : undefined,

      fontWeight:
        botao.letraNegrito
          ? 700
          : undefined,

      fontStyle:
        botao.letraItalico
          ? "italic"
          : undefined,

      textDecoration:
        botao.letraSublinhado
          ? "underline"
          : undefined,
    },

    preco: {
      backgroundColor:
        corFundoPreco,

      color:
        corTextoPreco,
    },
  };
}

function criarEstilosVisuaisGrupo(
  grupo: POSMobileCatalogoGrupo,
): CSSProperties {
  const corFundo =
    converterCorDelphi(
      grupo.cor,
    );

  const corTexto =
    converterCorDelphi(
      grupo.corLetra,
    );

  const corBevel =
    converterCorDelphi(
      grupo.corBevel,
    );

  const tamanhoLetra =
    limitarNumero(
      grupo.tamanhoLetra,
      11,
      28,
    );

  const larguraBevel =
    limitarNumero(
      grupo.larguraBevel,
      1,
      6,
    );

  return {
    backgroundColor:
      corFundo,

    color:
      corTexto,

    fontSize:
      tamanhoLetra !== null
        ? `${tamanhoLetra}px`
        : undefined,

    fontWeight:
      grupo.letraNegrito
        ? 700
        : undefined,

    fontStyle:
      grupo.letraItalico
        ? "italic"
        : undefined,

    textDecoration:
      grupo.letraSublinhado
        ? "underline"
        : undefined,

    borderColor:
      grupo.usaBevel
        ? corBevel
        : undefined,

    borderWidth:
      grupo.usaBevel &&
      larguraBevel !== null
        ? `${larguraBevel}px`
        : undefined,

    borderStyle:
      grupo.usaBevel
        ? "solid"
        : undefined,
  };
}

function formatarValor(
  valor: number,
): string {
  return new Intl.NumberFormat(
    "pt-PT",
    {
      style: "currency",
      currency: "EUR",
    },
  ).format(valor);
}

function obterChaveFeedbackProduto(
  botao: POSMobileCatalogoBotao,
): string {
  if (
    botao.idBotao !== null
  ) {
    return `botao-${botao.idBotao}`;
  }

  return [
    "produto",
    botao.idGrupo,
    botao.idGProdutos,
    botao.posicao,
    botao.idProduto ?? 0,
  ].join("-");
}

export default function EditorConsumo({
  catalogo,
  idGrupoSelecionado,
  idPaginaSelecionada,
  pesquisa,
  aAdicionarPrograma = false,
  produtoAdicionadoFeedback = null,
  onSelecionarGrupo,
  onSelecionarPagina,
  onPesquisaChange,
  onSelecionarBotao,
}: EditorConsumoProps) {
  const gruposScrollRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const gruposBotaoRefs =
    useRef<
      Map<
        number,
        HTMLButtonElement
      >
    >(
      new Map(),
    );

  const gruposOrdenados =
    useMemo(() => {
      return [
        ...(catalogo?.grupos ??
          []),
      ].sort(
        (
          primeiro,
          segundo,
        ) =>
          primeiro.ordem -
          segundo.ordem,
      );
    }, [
      catalogo,
    ]);

  const grupoSelecionado =
    useMemo<
      POSMobileCatalogoGrupo | null
    >(() => {
      if (
        !catalogo ||
        idGrupoSelecionado ===
          null
      ) {
        return null;
      }

      return (
        catalogo.grupos.find(
          (grupo) =>
            grupo.idGrupo ===
            idGrupoSelecionado,
        ) ?? null
      );
    }, [
      catalogo,
      idGrupoSelecionado,
    ]);

  const paginasGrupoSelecionado =
    useMemo<
      POSMobileCatalogoPagina[]
    >(() => {
      if (!grupoSelecionado) {
        return [];
      }

      return [
        ...grupoSelecionado.paginas,
      ].sort(
        (
          primeira,
          segunda,
        ) =>
          primeira.ordem -
          segunda.ordem,
      );
    }, [
      grupoSelecionado,
    ]);

  const paginaSelecionada =
    useMemo<
      POSMobileCatalogoPagina | null
    >(() => {
      if (
        idPaginaSelecionada ===
        null
      ) {
        return null;
      }

      return (
        paginasGrupoSelecionado.find(
          (pagina) =>
            pagina.idGProdutos ===
            idPaginaSelecionada,
        ) ?? null
      );
    }, [
      paginasGrupoSelecionado,
      idPaginaSelecionada,
    ]);

  const botoesVisiveis =
    useMemo<
      POSMobileCatalogoBotao[]
    >(() => {
      if (!paginaSelecionada) {
        return [];
      }

      const termo =
        pesquisa
          .trim()
          .toLocaleLowerCase(
            "pt-PT",
          );

      return [
        ...paginaSelecionada.botoes,
      ]
        .filter(
          (botao) =>
            botao.visivel,
        )
        .filter(
          (botao) => {
            if (!termo) {
              return true;
            }

            return botao.descricao
              .toLocaleLowerCase(
                "pt-PT",
              )
              .includes(
                termo,
              );
          },
        )
        .sort(
          (
            primeiro,
            segundo,
          ) =>
            primeiro.posicao -
            segundo.posicao,
        );
    }, [
      paginaSelecionada,
      pesquisa,
    ]);

  useEffect(() => {
    if (
      idGrupoSelecionado ===
      null
    ) {
      return;
    }

    const contentor =
      gruposScrollRef.current;

    const botao =
      gruposBotaoRefs.current.get(
        idGrupoSelecionado,
      );

    if (
      !contentor ||
      !botao ||
      window.matchMedia(
        "(min-width: 1024px)",
      ).matches
    ) {
      return;
    }

    const destino =
      botao.offsetLeft -
      contentor.clientWidth /
        2 +
      botao.clientWidth /
        2;

    contentor.scrollTo({
      left:
        Math.max(
          0,
          destino,
        ),
      behavior:
        "smooth",
    });
  }, [
    idGrupoSelecionado,
  ]);

  return (
    <div className="grid min-h-0 grid-cols-1 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[220px_minmax(0,1fr)] 2xl:grid-cols-[180px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white p-3 lg:sticky lg:top-20 lg:flex lg:h-[calc(100dvh-5rem)] lg:min-h-0 lg:self-start lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r lg:p-4">
        <p className="shrink-0 px-2 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Grupos
        </p>

        <div
          ref={
            gruposScrollRef
          }
          className="flex gap-2 overflow-x-auto overscroll-contain [scrollbar-gutter:stable] lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1"
        >
          {gruposOrdenados.map(
            (grupo) => {
              const selecionado =
                grupo.idGrupo ===
                idGrupoSelecionado;

              const estilosGrupo =
                USAR_CONFIGURACAO_PRODUTOS
                  ? criarEstilosVisuaisGrupo(
                      grupo,
                    )
                  : undefined;

              return (
                <button
                  ref={(
                    elemento,
                  ) => {
                    if (
                      elemento
                    ) {
                      gruposBotaoRefs.current.set(
                        grupo.idGrupo,
                        elemento,
                      );
                    } else {
                      gruposBotaoRefs.current.delete(
                        grupo.idGrupo,
                      );
                    }
                  }}
                  key={
                    grupo.idGrupo
                  }
                  type="button"
                  onClick={() =>
                    onSelecionarGrupo(
                      grupo,
                    )
                  }
                  style={
                    estilosGrupo
                  }
                  title={
                    grupo.descricao
                  }
                  aria-pressed={
                    selecionado
                  }
                  className={[
                    "flex h-11 w-44 min-w-44 shrink-0 items-center overflow-hidden rounded-xl border px-3 text-left text-sm font-bold leading-tight transition lg:w-full lg:min-w-0 lg:max-w-full",
                    selecionado
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-inset ring-blue-400"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 hover:shadow-sm",
                  ].join(" ")}
                >
                  <span className="block min-w-0 flex-1 truncate">
                    {
                      grupo.descricao
                    }
                  </span>
                </button>
              );
            },
          )}
        </div>
      </aside>

      <section className="min-w-0 p-3 sm:p-5 lg:p-6">
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-4 lg:shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div className="hidden min-w-0 lg:block">
            <h2 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              {grupoSelecionado
                ?.descricao ??
                "Catálogo"}
            </h2>

            {paginaSelecionada
              ?.descricao &&
              paginasGrupoSelecionado
                .length >
                1 && (
                <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {
                    paginaSelecionada
                      .descricao
                  }
                </p>
              )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {paginasGrupoSelecionado
              .length >
              1 && (
              <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {paginasGrupoSelecionado.map(
                  (
                    pagina,
                  ) => (
                    <button
                      key={
                        pagina.idGProdutos
                      }
                      type="button"
                      onClick={() =>
                        onSelecionarPagina(
                          pagina,
                        )
                      }
                      className={[
                        "min-w-max rounded-lg px-4 py-2.5 text-xs font-bold transition",
                        pagina.idGProdutos ===
                        idPaginaSelecionada
                          ? "bg-slate-900 text-white shadow"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                      ].join(
                        " ",
                      )}
                    >
                      {pagina.descricao ||
                        `Página ${pagina.numeroPagina}`}
                    </button>
                  ),
                )}
              </div>
            )}

            <div className="relative sm:w-72">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>

              <input
                type="search"
                value={
                  pesquisa
                }
                onChange={(
                  event,
                ) =>
                  onPesquisaChange(
                    event.target
                      .value,
                  )
                }
                placeholder="Pesquisar produto..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {botoesVisiveis.length >
        0 ? (
          <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {botoesVisiveis.map(
              (botao) => {
                const podeAdicionar =
                  botao.tipoBotao ===
                    "PRODUTO" &&
                  Boolean(
                    botao.idBotao &&
                      botao.idProduto,
                  );

                const estilosConfigurados =
                  USAR_CONFIGURACAO_PRODUTOS
                    ? criarEstilosVisuaisBotao(
                        botao,
                      )
                    : null;

                const nomeImagem =
                  USAR_CONFIGURACAO_PRODUTOS
                    ? obterNomeImagemSeguro(
                        botao.nomeImagem,
                      )
                    : null;

                const chaveFeedbackProduto =
                  obterChaveFeedbackProduto(
                    botao,
                  );

                const acabouDeAdicionar =
                  podeAdicionar &&
                  produtoAdicionadoFeedback ===
                    chaveFeedbackProduto;

                return (
                  <button
                    key={
                      botao.idBotao ??
                      `${botao.idGrupo}-${botao.idGProdutos}-${botao.posicao}`
                    }
                    type="button"
                    onClick={() =>
                      onSelecionarBotao(
                        botao,
                      )
                    }
                    disabled={
                      botao.tipoBotao ===
                        "DESCONHECIDO" ||
                      aAdicionarPrograma
                    }
                    style={
                      estilosConfigurados
                        ?.cartao
                    }
                    className={[
                      "group relative flex h-full min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-xl border p-3 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",
                      acabouDeAdicionar
                        ? "scale-[0.985] ring-4 ring-blue-200 shadow-lg"
                        : "",
                      podeAdicionar
                        ? "border-slate-200 bg-white hover:border-blue-300"
                        : botao.tipoBotao ===
                            "LINK"
                          ? "border-violet-200 bg-violet-50 hover:border-violet-300"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60",
                    ].join(
                      " ",
                    )}
                  >
                    {acabouDeAdicionar && (
                      <span className="pointer-events-none absolute right-2 top-2 z-20 rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-md">
                        ✓ Adicionado
                      </span>
                    )}

                    <div className="w-full">
                      {nomeImagem && (
                        <img
                          src={`/api/pos-mobile/imagem-produto?nome=${encodeURIComponent(
                            nomeImagem,
                          )}`}
                          alt=""
                          loading="lazy"
                          onError={(
                            event,
                          ) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                          className="mb-3 h-20 w-full rounded-xl object-contain"
                        />
                      )}

                      {botao.tipoBotao ===
                        "LINK" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                          Abrir grupo
                        </span>
                      )}

                      <h3
                        style={
                          estilosConfigurados
                            ?.texto
                        }
                        className={[
                          "line-clamp-2 text-sm font-black leading-5 text-slate-900",
                          botao.tipoBotao ===
                          "LINK"
                            ? "mt-2"
                            : "",
                        ].join(
                          " ",
                        )}
                      >
                        {
                          botao.descricao
                        }
                      </h3>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3">
                      {botao.tipoBotao ===
                      "LINK" ? (
                        <span
                          style={
                            estilosConfigurados
                              ?.preco
                          }
                          className="inline-flex rounded-lg px-2 py-1 text-xs font-bold text-violet-700"
                        >
                          Continuar →
                        </span>
                      ) : botao.precoVariavel ? (
                        <span
                          style={
                            estilosConfigurados
                              ?.preco
                          }
                          className="inline-flex rounded-lg px-2 py-1 text-xs font-bold text-amber-700"
                        >
                          Preço variável
                        </span>
                      ) : botao.precoEncontrado ? (
                        <span
                          style={
                            estilosConfigurados
                              ?.preco
                          }
                          className="inline-flex rounded-lg px-2 py-1 text-lg font-black text-blue-700"
                        >
                          {formatarValor(
                            botao.preco,
                          )}
                        </span>
                      ) : (
                        <span
                          style={
                            estilosConfigurados
                              ?.preco
                          }
                          className="inline-flex rounded-lg px-2 py-1 text-xs font-bold text-slate-400"
                        >
                          Preço por carregar
                        </span>
                      )}

                      {podeAdicionar && (
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-black transition-all duration-150",
                            acabouDeAdicionar
                              ? "scale-110 bg-emerald-600 text-white"
                              : "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
                          ].join(
                            " ",
                          )}
                        >
                          {acabouDeAdicionar
                            ? "✓"
                            : "+"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              },
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h3 className="text-lg font-black sm:text-xl">
              Nenhum produto encontrado
            </h3>

            <p className="mt-2 text-slate-500">
              Esta página não tem
              botões visíveis ou a
              pesquisa não encontrou
              resultados.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
