"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  POSMobileGrupoLink,
  POSMobileGrupoLinkBotao,
  POSMobileGrupoLinkResposta,
} from "@/types/pos-mobile-grupo-link";

interface Props {
  idGrupo: number;

  idSala: number;

  descricaoOrigem?: string | null;

  /*
    Corresponde ao FechaJanelaLink
    do botão que abriu este catálogo.

    É opcional para não quebrar chamadas
    existentes do componente.
  */
  fechaJanelaLinkOrigem?: boolean;

  onVoltar: () => void;

  onSelecionarProduto: (
    botao: POSMobileGrupoLinkBotao,
  ) => void;
}

interface HistoricoGrupoLink {
  idGrupo: number;

  indicePagina: number;

  pesquisa: string;

  fechaJanelaLink: boolean;
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

function normalizarTipoBotao(
  tipoBotao: string,
): string {
  return tipoBotao
    .trim()
    .toUpperCase();
}

export default function CatalogoGrupoLink({
  idGrupo,
  idSala,
  descricaoOrigem,
  fechaJanelaLinkOrigem = false,
  onVoltar,
  onSelecionarProduto,
}: Props) {
  const [
    grupo,
    setGrupo,
  ] =
    useState<POSMobileGrupoLink | null>(
      null,
    );

  const [
    idGrupoAtual,
    setIdGrupoAtual,
  ] =
    useState<number>(
      idGrupo,
    );

  const [
    historico,
    setHistorico,
  ] =
    useState<HistoricoGrupoLink[]>(
      [],
    );

  const [
    indicePagina,
    setIndicePagina,
  ] =
    useState(
      0,
    );

  const [
    pesquisa,
    setPesquisa,
  ] =
    useState(
      "",
    );

  const [
    fechaJanelaLinkAtual,
    setFechaJanelaLinkAtual,
  ] =
    useState(
      fechaJanelaLinkOrigem,
    );

  const [
    aCarregar,
    setACarregar,
  ] =
    useState(
      true,
    );

  const [
    mensagemErro,
    setMensagemErro,
  ] =
    useState(
      "",
    );

  /*
    Feedback visual para produtos dentro de Grupo Link.

    O catálogo principal já dá feedback quando a adição é efetivamente
    concluída. Aqui damos também feedback imediato no cartão tocado, para
    o operador perceber que a seleção foi registada. Não alteramos a
    pipeline funcional nem o comportamento de FechaJanelaLink.
  */
  const [
    produtoSelecionadoFeedback,
    setProdutoSelecionadoFeedback,
  ] = useState<string | null>(null);

  const feedbackProdutoTimeoutRef =
    useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (
        feedbackProdutoTimeoutRef.current !==
        null
      ) {
        window.clearTimeout(
          feedbackProdutoTimeoutRef.current,
        );
      }
    };
  }, []);

  /*
    Quando o grupo inicial vindo do pai muda,
    iniciamos uma nova navegação.
  */
  useEffect(() => {
    setIdGrupoAtual(
      idGrupo,
    );

    setHistorico(
      [],
    );

    setIndicePagina(
      0,
    );

    setPesquisa(
      "",
    );

    setGrupo(
      null,
    );

    setMensagemErro(
      "",
    );

    setFechaJanelaLinkAtual(
      fechaJanelaLinkOrigem,
    );
  }, [
    idGrupo,
    fechaJanelaLinkOrigem,
  ]);

  /*
    Carrega sempre o grupo atualmente selecionado.

    Não interessa se veio:
      - do catálogo principal;
      - de outro LINK;
      - de um LINK dentro de outro LINK.
  */
  useEffect(() => {
    let cancelado =
      false;

    async function carregarGrupo() {
      setACarregar(
        true,
      );

      setMensagemErro(
        "",
      );

      setGrupo(
        null,
      );

      try {
        const accessToken =
          sessionStorage.getItem(
            "posMobileAccessToken",
          );

        if (!accessToken) {
          throw new Error(
            "A sessão do POS Mobile não está disponível.",
          );
        }

        if (
          !Number.isInteger(
            idGrupoAtual,
          ) ||
          idGrupoAtual <= 0
        ) {
          throw new Error(
            "O grupo de ligação é inválido.",
          );
        }

        if (
          !Number.isInteger(
            idSala,
          ) ||
          idSala <= 0
        ) {
          throw new Error(
            "A sala é inválida.",
          );
        }

        const response =
          await fetch(
            "/api/pos-mobile/grupo-link",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              cache:
                "no-store",

              body:
                JSON.stringify({
                  accessToken,

                  idSala,

                  idGrupo:
                    idGrupoAtual,
                }),
            },
          );

        const resultado =
          (await response.json()) as
            POSMobileGrupoLinkResposta;

        console.group(
          "========== CATÁLOGO GRUPO LINK ==========",
        );

        console.log(
          "ID Grupo:",
          idGrupoAtual,
        );

        console.log(
          "ID Sala:",
          idSala,
        );

        console.log(
          "HTTP:",
          response.status,
        );

        console.log(
          "Resposta:",
          resultado,
        );

        console.groupEnd();

        if (
          cancelado
        ) {
          return;
        }

        if (
          response.status ===
          401
        ) {
          sessionStorage.removeItem(
            "posMobileAccessToken",
          );

          window.location.href =
            "/login";

          return;
        }

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível carregar o grupo de produtos.",
          );
        }

        setGrupo(
          resultado.dados,
        );
      } catch (error) {
        if (
          cancelado
        ) {
          return;
        }

        setMensagemErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao carregar o grupo.",
        );
      } finally {
        if (
          !cancelado
        ) {
          setACarregar(
            false,
          );
        }
      }
    }

    void carregarGrupo();

    return () => {
      cancelado =
        true;
    };
  }, [
    idGrupoAtual,
    idSala,
  ]);

  const paginas =
    useMemo(() => {
      if (
        !grupo
      ) {
        return [];
      }

      return [
        ...grupo.paginas,
      ].sort(
        (
          primeira,
          segunda,
        ) =>
          primeira.indice -
          segunda.indice,
      );
    }, [
      grupo,
    ]);

  const paginaAtual =
    useMemo(() => {
      if (
        paginas.length ===
        0
      ) {
        return null;
      }

      return (
        paginas[
          indicePagina
        ] ??
        paginas[0] ??
        null
      );
    }, [
      paginas,
      indicePagina,
    ]);

  /*
    Mostramos PRODUTO e LINK.

    DESCONHECIDO continua escondido
    enquanto não tratarmos tbsair.
  */
  const botoesVisiveis =
    useMemo(() => {
      if (
        !paginaAtual
      ) {
        return [];
      }

      const termo =
        pesquisa
          .trim()
          .toLocaleLowerCase(
            "pt-PT",
          );

      return [
        ...paginaAtual.botoes,
      ]
        .filter(
          (botao) => {
            const tipo =
              normalizarTipoBotao(
                botao.tipoBotao,
              );

            return (
              tipo ===
                "PRODUTO" ||
              tipo ===
                "LINK"
            );
          },
        )
        .filter(
          (botao) => {
            if (
              !termo
            ) {
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
      paginaAtual,
      pesquisa,
    ]);

  function abrirGrupoLink(
    botao: POSMobileGrupoLinkBotao,
  ) {
    if (
      normalizarTipoBotao(
        botao.tipoBotao,
      ) !==
      "LINK"
    ) {
      return;
    }

    if (
      !Number.isInteger(
        botao.idGrupoLink,
      ) ||
      botao.idGrupoLink <=
        0
    ) {
      setMensagemErro(
        `O link "${botao.descricao}" não possui um grupo de destino válido.`,
      );

      return;
    }

    /*
      Guardamos o estado atual antes
      de navegar para o novo grupo.
    */
    setHistorico(
      (
        historicoAtual,
      ) => [
        ...historicoAtual,

        {
          idGrupo:
            idGrupoAtual,

          indicePagina,

          pesquisa,

          fechaJanelaLink:
            fechaJanelaLinkAtual,
        },
      ],
    );

    setIdGrupoAtual(
      botao.idGrupoLink,
    );

    /*
      A configuração do novo formulário link
      vem do botão LINK que estamos a abrir.
    */
    setFechaJanelaLinkAtual(
      botao.fechaJanelaLink,
    );

    setIndicePagina(
      0,
    );

    setPesquisa(
      "",
    );

    setMensagemErro(
      "",
    );
  }

  function voltar() {
    if (
      historico.length ===
      0
    ) {
      onVoltar();

      return;
    }

    const anterior =
      historico[
        historico.length -
          1
      ];

    setHistorico(
      (
        historicoAtual,
      ) =>
        historicoAtual.slice(
          0,
          -1,
        ),
    );

    setIdGrupoAtual(
      anterior.idGrupo,
    );

    setIndicePagina(
      anterior.indicePagina,
    );

    setPesquisa(
      anterior.pesquisa,
    );

    setFechaJanelaLinkAtual(
      anterior.fechaJanelaLink,
    );

    setMensagemErro(
      "",
    );
  }

  function obterChaveFeedbackProduto(
    botao: POSMobileGrupoLinkBotao,
  ): string {
    return [
      idGrupoAtual,
      paginaAtual?.indice ?? 0,
      botao.posicao,
      botao.idProduto ?? 0,
      botao.descricao,
    ].join("-");
  }

  function sinalizarProdutoSelecionado(
    botao: POSMobileGrupoLinkBotao,
  ) {
    const chave =
      obterChaveFeedbackProduto(
        botao,
      );

    setProdutoSelecionadoFeedback(
      chave,
    );

    if (
      feedbackProdutoTimeoutRef.current !==
      null
    ) {
      window.clearTimeout(
        feedbackProdutoTimeoutRef.current,
      );
    }

    feedbackProdutoTimeoutRef.current =
      window.setTimeout(() => {
        setProdutoSelecionadoFeedback(
          null,
        );

        feedbackProdutoTimeoutRef.current =
          null;
      }, 650);
  }

  function selecionarBotao(
    botao: POSMobileGrupoLinkBotao,
  ) {
    const tipo =
      normalizarTipoBotao(
        botao.tipoBotao,
      );

    if (
      tipo ===
      "LINK"
    ) {
      abrirGrupoLink(
        botao,
      );

      return;
    }

    if (
      tipo !==
      "PRODUTO"
    ) {
      return;
    }

    if (
      !botao.idProduto ||
      botao.idProduto <=
        0
    ) {
      setMensagemErro(
        `O botão "${botao.descricao}" não possui um produto válido.`,
      );

      return;
    }

    sinalizarProdutoSelecionado(
      botao,
    );

    onSelecionarProduto(
      botao,
    );

    /*
      Replica o FechaJanelaLink do POS.

      Se o LINK que abriu este nível
      estiver configurado para fechar,
      regressamos imediatamente ao catálogo.
    */
    if (
      fechaJanelaLinkAtual
    ) {
      onVoltar();
    }
  }

  if (
    aCarregar
  ) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />

          <p className="mt-4 font-bold text-slate-600">
            A carregar produtos...
          </p>
        </div>
      </div>
    );
  }

  if (
    mensagemErro
  ) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={
            voltar
          }
          className="mb-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          <span aria-hidden="true">
            ←
          </span>

          Voltar
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-black text-red-800">
            Não foi possível abrir o grupo
          </p>

          <p className="mt-2 text-sm text-red-700">
            {
              mensagemErro
            }
          </p>
        </div>
      </div>
    );
  }

  if (
    !grupo
  ) {
    return null;
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={
                voltar
              }
              title="Voltar"
              aria-label="Voltar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              ←
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                Grupo de produtos
              </p>

              <h2 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950">
                {grupo.descricao ||
                  descricaoOrigem ||
                  "Produtos"}
              </h2>

              {historico.length >
                0 && (
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Nível{" "}
                  {historico.length +
                    1}
                </p>
              )}

              {historico.length ===
                0 &&
                descricaoOrigem &&
                descricaoOrigem !==
                  grupo.descricao && (
                  <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                    Aberto através de{" "}
                    {
                      descricaoOrigem
                    }
                  </p>
                )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {paginas.length >
              1 && (
              <div className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
                {paginas.map(
                  (
                    pagina,
                    indice,
                  ) => (
                    <button
                      key={`${pagina.indice}-${indice}`}
                      type="button"
                      onClick={() => {
                        setIndicePagina(
                          indice,
                        );

                        setPesquisa(
                          "",
                        );
                      }}
                      className={[
                        "min-w-max rounded-lg px-4 py-2.5 text-xs font-black transition",

                        indice ===
                        indicePagina
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-white hover:text-violet-700",
                      ].join(
                        " ",
                      )}
                    >
                      {pagina.descricao ||
                        `Página ${
                          indice +
                          1
                        }`}
                    </button>
                  ),
                )}
              </div>
            )}

            <div className="relative sm:w-64">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
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
                  setPesquisa(
                    event.target
                      .value,
                  )
                }
                placeholder="Pesquisar neste grupo..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>
          </div>
        </div>
      </div>

      {botoesVisiveis.length >
      0 ? (
        <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {botoesVisiveis.map(
            (
              botao,
            ) => {
              const tipo =
                normalizarTipoBotao(
                  botao.tipoBotao,
                );

              const eLink =
                tipo ===
                "LINK";

              const chaveFeedbackProduto =
                obterChaveFeedbackProduto(
                  botao,
                );

              const acabouDeSelecionar =
                !eLink &&
                produtoSelecionadoFeedback ===
                  chaveFeedbackProduto;

              return (
                <button
                  key={[
                    idGrupoAtual,
                    paginaAtual
                      ?.indice ??
                      0,
                    botao.posicao,
                    botao.idProduto,
                    botao.idGrupoLink,
                    botao.descricao,
                  ].join(
                    "-",
                  )}
                  type="button"
                  onClick={() =>
                    selecionarBotao(
                      botao,
                    )
                  }
                  className={[
                    "group relative flex min-h-[6.5rem] flex-col justify-between overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition-all duration-150",

                    "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]",

                    acabouDeSelecionar
                      ? "scale-[0.985] ring-4 ring-blue-200 shadow-lg"
                      : "",

                    eLink
                      ? "border-violet-300 bg-violet-50 hover:border-violet-500"
                      : "border-violet-200 bg-white hover:border-violet-400",
                  ].join(
                    " ",
                  )}
                >
                  {acabouDeSelecionar && (
                    <span className="pointer-events-none absolute right-2 top-2 z-20 rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-md">
                      ✓ Selecionado
                    </span>
                  )}

                  <div className="min-w-0">
                    {eLink && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-violet-500">
                        Abrir grupo
                      </span>
                    )}

                    <p
                      className={[
                        "line-clamp-2 text-sm font-black leading-5 text-slate-900",

                        eLink
                          ? "mt-1"
                          : "",
                      ].join(
                        " ",
                      )}
                    >
                      {
                        botao.descricao
                      }
                    </p>

                    {!eLink &&
                      botao.tipoProduto
                        ?.trim()
                        .toUpperCase() ===
                        "PRG" && (
                        <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-violet-700">
                          Menu
                        </span>
                      )}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    {eLink ? (
                      <>
                        <strong className="text-xs font-black text-violet-700">
                          Continuar
                        </strong>

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-lg font-black text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white">
                          →
                        </span>
                      </>
                    ) : (
                      <>
                        <strong className="text-base font-black text-violet-700">
                          {formatarValor(
                            botao.preco,
                          )}
                        </strong>

                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-black transition",
                            acabouDeSelecionar
                              ? "scale-110 bg-emerald-600 text-white"
                              : "bg-violet-100 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
                          ].join(" ")}
                        >
                          {acabouDeSelecionar
                            ? "✓"
                            : "+"}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            },
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-black text-slate-900">
            Nenhum produto encontrado
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Esta página não possui produtos ou grupos,
            ou a pesquisa não encontrou resultados.
          </p>
        </div>
      )}
    </div>
  );
}