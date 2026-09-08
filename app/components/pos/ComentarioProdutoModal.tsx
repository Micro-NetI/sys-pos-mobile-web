//app\components\pos\ComentarioProdutoModal.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  POSMobileComentarioSelecionado,
  POSMobileComentariosResposta,
  POSMobileGrupoComentario,
} from "@/types/comentarios";

interface ComentarioProdutoModalProps {
  aberto: boolean;

  /**
   * 0:
   *   devolve todos os grupos de comentários e é usado
   *   pelo botão geral "Comentário".
   *
   * > 0:
   *   devolve apenas o grupo associado ao produto.
   */
  idGrupoComentario: number | null;

  nomeProduto: string;

  comentariosIniciais?:
    POSMobileComentarioSelecionado[];

  aConfirmar?: boolean;

  erroConfirmacao?:
    | string
    | null;

  onFechar: () => void;

  onConfirmar: (
    comentarios:
      POSMobileComentarioSelecionado[],
  ) => void;
}

interface EstadoOpcao {
  selecionado: boolean;
  texto: string;
}

type EstadoOpcoes =
  Record<number, EstadoOpcao>;

function criarEstadoInicial(
  comentarios:
    | POSMobileComentarioSelecionado[]
    | undefined,
): EstadoOpcoes {
  const estado: EstadoOpcoes = {};

  for (
    const comentario of
    comentarios ?? []
  ) {
    estado[
      comentario.idComentario
    ] = {
      selecionado: true,
      texto: comentario.texto,
    };
  }

  return estado;
}

export default function ComentarioProdutoModal({
  aberto,
  idGrupoComentario,
  nomeProduto,
  comentariosIniciais = [],
  aConfirmar = false,
  erroConfirmacao = null,
  onFechar,
  onConfirmar,
}: ComentarioProdutoModalProps) {
  const [
    grupos,
    setGrupos,
  ] = useState<
    POSMobileGrupoComentario[]
  >([]);

  const [
    estadoOpcoes,
    setEstadoOpcoes,
  ] = useState<EstadoOpcoes>({});

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState<string | null>(null);

  const [
    idGrupoAberto,
    setIdGrupoAberto,
  ] = useState<number | null>(
    null,
  );

  const carregarComentarios =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {
        /*
          null significa que não foi recebido
          qualquer identificador.

          O valor 0 é válido e corresponde ao
          botão geral "Comentário", que deve
          carregar todos os grupos.
        */
        if (
          idGrupoComentario === null ||
          idGrupoComentario < 0
        ) {
          setGrupos([]);

          setErro(
            "Não foi indicado um grupo de comentários válido.",
          );

          return;
        }

        setCarregando(true);
        setErro(null);
        setGrupos([]);
        setIdGrupoAberto(null);

        try {
          const response =
            await fetch(
              `/api/pos-mobile/comentarios?idGrupoComentario=${idGrupoComentario}`,
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                },
                cache: "no-store",
                signal,
              },
            );

          const resposta =
            (await response.json()) as
              POSMobileComentariosResposta;

          if (
            !response.ok ||
            !resposta.sucesso
          ) {
            throw new Error(
              resposta.mensagem ||
              "Não foi possível carregar os comentários.",
            );
          }

          const gruposRecebidos =
            resposta.dados?.grupos ??
            [];

          const gruposValidos =
            gruposRecebidos.filter(
              (grupo) =>
                grupo &&
                Number.isInteger(
                  grupo.idGrupoComentario,
                ) &&
                grupo.idGrupoComentario >
                0,
            );

          /*
            Quando foi pedido um grupo específico,
            mantemos apenas esse grupo.

            Quando idGrupoComentario = 0,
            mantemos todos os grupos recebidos.
          */
          const gruposResolvidos =
            idGrupoComentario === 0
              ? gruposValidos
              : gruposValidos.filter(
                (grupo) =>
                  grupo.idGrupoComentario ===
                  idGrupoComentario,
              );

          if (
            gruposResolvidos.length === 0
          ) {
            throw new Error(
              idGrupoComentario === 0
                ? "Não existem grupos de comentários configurados."
                : "O grupo de comentários não possui opções configuradas.",
            );
          }

          setGrupos(
            gruposResolvidos,
          );
        } catch (error) {
          if (
            error instanceof
            DOMException &&
            error.name ===
            "AbortError"
          ) {
            return;
          }

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os comentários.",
          );
        } finally {
          if (!signal?.aborted) {
            setCarregando(false);
          }
        }
      },
      [
        idGrupoComentario,
      ],
    );

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setEstadoOpcoes(
      criarEstadoInicial(
        comentariosIniciais,
      ),
    );

    const controller =
      new AbortController();

    void carregarComentarios(
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [
    aberto,
    comentariosIniciais,
    carregarComentarios,
  ]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const tratarTecla = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        !aConfirmar
      ) {
        onFechar();
      }
    };

    window.addEventListener(
      "keydown",
      tratarTecla,
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        tratarTecla,
      );
    };
  }, [
    aberto,
    aConfirmar,
    onFechar,
  ]);

  const assinaturaComentariosIniciais =
    useMemo(
      () =>
        comentariosIniciais
          .map(
            (comentario) =>
              comentario.idComentario,
          )
          .sort(
            (primeiro, segundo) =>
              primeiro - segundo,
          )
          .join("|"),
      [
        comentariosIniciais,
      ],
    );

  useEffect(() => {
    if (
      !aberto ||
      grupos.length === 0
    ) {
      return;
    }

    const idsSelecionados =
      new Set(
        assinaturaComentariosIniciais
          .split("|")
          .map((valor) =>
            Number(valor),
          )
          .filter(
            (valor) =>
              Number.isInteger(valor) &&
              valor > 0,
          ),
      );

    const grupoComSelecao =
      grupos.find((grupo) =>
        grupo.opcoes.some(
          (opcao) =>
            idsSelecionados.has(
              opcao.idComentario,
            ),
        ),
      );

    setIdGrupoAberto(
      (grupoAtual) => {
        const grupoAtualExiste =
          grupoAtual !== null &&
          grupos.some(
            (grupo) =>
              grupo.idGrupoComentario ===
              grupoAtual,
          );

        if (grupoAtualExiste) {
          return grupoAtual;
        }

        return (
          grupoComSelecao
            ?.idGrupoComentario ??
          grupos[0]
            .idGrupoComentario
        );
      },
    );
  }, [
    aberto,
    assinaturaComentariosIniciais,
    grupos,
  ]);

  const numeroSelecionados =
    useMemo(() => {
      return Object.values(
        estadoOpcoes,
      ).filter(
        (item) =>
          item.selecionado,
      ).length;
    }, [
      estadoOpcoes,
    ]);

  const subtitulo =
    useMemo(() => {
      if (
        idGrupoComentario === 0
      ) {
        return "Todos os grupos de comentários";
      }

      if (
        grupos.length === 1
      ) {
        return (
          grupos[0].descricao ||
          "Comentários"
        );
      }

      return "";
    }, [
      grupos,
      idGrupoComentario,
    ]);

  const alternarOpcao = (
    idComentario: number,
    descricao: string,
  ) => {
    setEstadoOpcoes(
      (estadoAtual) => {
        const atual =
          estadoAtual[
          idComentario
          ];

        const novoSelecionado =
          !atual?.selecionado;

        return {
          ...estadoAtual,

          [idComentario]: {
            selecionado:
              novoSelecionado,

            texto:
              atual?.texto ||
              descricao,
          },
        };
      },
    );
  };

  const alterarTextoLivre = (
    idComentario: number,
    texto: string,
  ) => {
    setEstadoOpcoes(
      (estadoAtual) => ({
        ...estadoAtual,

        [idComentario]: {
          selecionado: true,
          texto,
        },
      }),
    );
  };

  const limparSelecao = () => {
    setEstadoOpcoes({});
  };

  const confirmar = () => {
    if (
      aConfirmar ||
      grupos.length === 0
    ) {
      return;
    }

    const comentarios:
      POSMobileComentarioSelecionado[] =
      grupos
        .flatMap(
          (grupo) =>
            grupo.opcoes ?? [],
        )
        .filter(
          (opcao) =>
            Boolean(
              estadoOpcoes[
                opcao.idComentario
              ]?.selecionado,
            ),
        )
        .map((opcao) => {
          const estado =
            estadoOpcoes[
            opcao.idComentario
            ];

          const texto =
            opcao.comentarioLivre
              ? estado?.texto.trim() ??
              ""
              : opcao.descricao.trim();

          return {
            idComentario:
              opcao.idComentario,

            descricao:
              opcao.descricao,

            comentarioLivre:
              opcao.comentarioLivre,

            texto,
          };
        })
        .filter(
          (comentario) =>
            !comentario
              .comentarioLivre ||
            comentario.texto !== "",
        );

    onConfirmar(
      comentarios,
    );
  };

  if (!aberto) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-end justify-center
        bg-slate-950/55 p-0
        backdrop-blur-[2px]
        sm:items-center sm:p-6
      "
      role="presentation"
    >
      <section
        aria-labelledby="comentario-produto-titulo"
        aria-modal="true"
        className="
          flex h-[92dvh] w-full
          flex-col overflow-hidden
          rounded-t-3xl bg-white
          shadow-2xl
          sm:h-[760px]
          sm:max-h-[calc(100dvh-3rem)]
          sm:max-w-4xl sm:rounded-3xl
        "
        role="dialog"
      >
        <header
          className="
            flex items-start
            justify-between gap-4
            border-b border-slate-200
            px-5 py-4 sm:px-6
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-xs font-semibold
                uppercase tracking-[0.16em]
                text-slate-500
              "
            >
              Comentários do produto
            </p>

            <h2
              id="comentario-produto-titulo"
              className="
                mt-1 truncate text-xl
                font-bold text-slate-950
                sm:text-2xl
              "
            >
              {nomeProduto}
            </h2>

            {subtitulo ? (
              <p
                className="
                  mt-1 text-sm
                  text-slate-600
                "
              >
                {subtitulo}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Fechar comentários"
            className="
              flex h-11 w-11 shrink-0
              items-center justify-center
              rounded-full border
              border-slate-200 bg-white
              text-2xl leading-none
              text-slate-600 transition
              hover:bg-slate-100
              active:scale-95
            "
            disabled={aConfirmar}
            onClick={onFechar}
            type="button"
          >
            ×
          </button>
        </header>

        <div
          className="
            min-h-0 flex-1
            overflow-y-auto
            overscroll-contain
            px-5 py-5 sm:px-6
          "
        >
          {carregando ? (
            <div
              className="
                flex min-h-52 flex-col
                items-center justify-center
                gap-3 text-center
              "
            >
              <div
                aria-hidden="true"
                className="
                  h-9 w-9 animate-spin
                  rounded-full border-4
                  border-slate-200
                  border-t-blue-600
                "
              />

              <p
                className="
                  text-sm font-medium
                  text-slate-600
                "
              >
                A carregar comentários…
              </p>
            </div>
          ) : null}

          {!carregando &&
            erro ? (
            <div
              className="
                flex min-h-52 flex-col
                items-center justify-center
                rounded-2xl border
                border-red-200 bg-red-50
                p-6 text-center
              "
            >
              <p
                className="
                  font-semibold
                  text-red-800
                "
              >
                Não foi possível carregar
              </p>

              <p
                className="
                  mt-2 max-w-lg text-sm
                  text-red-700
                "
              >
                {erro}
              </p>

              <button
                className="
                  mt-5 min-h-11
                  rounded-xl bg-red-700
                  px-5 py-2.5
                  font-semibold text-white
                  transition
                  hover:bg-red-800
                  active:scale-[0.98]
                "
                onClick={() => {
                  void carregarComentarios();
                }}
                type="button"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {!carregando &&
            !erro &&
            grupos.length > 0 ? (
            <div className="space-y-3">
              {grupos.map(
                (grupo) => {
                  const grupoAberto =
                    idGrupoAberto ===
                    grupo.idGrupoComentario;

                  const numeroSelecionadosGrupo =
                    grupo.opcoes.filter(
                      (opcao) =>
                        Boolean(
                          estadoOpcoes[
                            opcao.idComentario
                          ]?.selecionado,
                        ),
                    ).length;

                  const idConteudoGrupo =
                    `comentarios-grupo-${grupo.idGrupoComentario}`;

                  return (
                    <section
                      className={[
                        "overflow-hidden rounded-2xl border bg-white transition",
                        grupoAberto
                          ? "border-blue-300 shadow-sm ring-2 ring-blue-100"
                          : "border-slate-200",
                      ].join(" ")}
                      key={
                        grupo.idGrupoComentario
                      }
                    >
                      <button
                        aria-controls={
                          idConteudoGrupo
                        }
                        aria-expanded={
                          grupoAberto
                        }
                        className="
                          flex min-h-16 w-full
                          touch-manipulation
                          items-center gap-3
                          px-4 py-3 text-left
                          transition
                          hover:bg-slate-50
                          disabled:cursor-not-allowed
                          disabled:opacity-70
                          sm:px-5
                        "
                        disabled={
                          aConfirmar
                        }
                        onClick={() => {
                          setIdGrupoAberto(
                            (grupoAtual) =>
                              grupoAtual ===
                                grupo.idGrupoComentario
                                ? null
                                : grupo.idGrupoComentario,
                          );
                        }}
                        type="button"
                      >
                        <span
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black",
                            grupoAberto
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600",
                          ].join(" ")}
                        >
                          {
                            numeroSelecionadosGrupo
                          }
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className="
                              block truncate
                              text-base font-black
                              text-slate-900
                              sm:text-lg
                            "
                          >
                            {grupo.descricao ||
                              `Grupo ${grupo.idGrupoComentario}`}
                          </span>

                          <span
                            className="
                              mt-0.5 block
                              text-xs font-semibold
                              text-slate-500
                            "
                          >
                            {
                              grupo.opcoes.length
                            }{" "}
                            {grupo.opcoes.length ===
                              1
                              ? "opção"
                              : "opções"}
                            {numeroSelecionadosGrupo >
                              0
                              ? ` · ${numeroSelecionadosGrupo} selecionada${numeroSelecionadosGrupo ===
                                1
                                ? ""
                                : "s"
                              }`
                              : ""}
                          </span>
                        </span>

                        <svg
                          aria-hidden="true"
                          className={[
                            "h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200",
                            grupoAberto
                              ? "rotate-180"
                              : "",
                          ].join(" ")}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {grupoAberto ? (
                        <div
                          className="
                            border-t
                            border-slate-200
                            bg-slate-50/70
                            p-4 sm:p-5
                          "
                          id={
                            idConteudoGrupo
                          }
                        >
                          {grupo.opcoes.length >
                            0 ? (
                            <div
                              className="
                                grid grid-cols-1
                                gap-3
                                sm:grid-cols-2
                              "
                            >
                              {grupo.opcoes.map(
                                (opcao) => {
                                  const estado =
                                    estadoOpcoes[
                                    opcao
                                      .idComentario
                                    ];

                                  const selecionado =
                                    Boolean(
                                      estado
                                        ?.selecionado,
                                    );

                                  return (
                                    <article
                                      className={[
                                        "rounded-2xl border-2 p-4 transition",
                                        selecionado
                                          ? "border-blue-600 bg-blue-50 shadow-sm"
                                          : "border-slate-200 bg-white hover:border-slate-300",
                                      ].join(" ")}
                                      key={
                                        opcao.idComentario
                                      }
                                    >
                                      <button
                                        aria-pressed={
                                          selecionado
                                        }
                                        className="
                                          flex min-h-12
                                          w-full
                                          touch-manipulation
                                          items-center
                                          gap-3 text-left
                                          disabled:cursor-not-allowed
                                          disabled:opacity-70
                                        "
                                        disabled={
                                          aConfirmar
                                        }
                                        onClick={() => {
                                          alternarOpcao(
                                            opcao.idComentario,
                                            opcao.descricao,
                                          );
                                        }}
                                        type="button"
                                      >
                                        <span
                                          aria-hidden="true"
                                          className={[
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold",
                                            selecionado
                                              ? "border-blue-600 bg-blue-600 text-white"
                                              : "border-slate-300 bg-white text-transparent",
                                          ].join(" ")}
                                        >
                                          ✓
                                        </span>

                                        <span
                                          className="
                                            min-w-0
                                            flex-1
                                            font-semibold
                                            text-slate-900
                                          "
                                        >
                                          {
                                            opcao.descricao
                                          }
                                        </span>

                                        {opcao.comentarioLivre ? (
                                          <span
                                            className="
                                              shrink-0
                                              rounded-full
                                              bg-slate-100
                                              px-2.5 py-1
                                              text-xs
                                              font-semibold
                                              text-slate-600
                                            "
                                          >
                                            Texto livre
                                          </span>
                                        ) : null}
                                      </button>

                                      {opcao.comentarioLivre &&
                                        selecionado ? (
                                        <textarea
                                          className="
                                            mt-3 min-h-24
                                            w-full resize-y
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white px-3
                                            py-3 text-base
                                            text-slate-950
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-600
                                            focus:ring-4
                                            focus:ring-blue-100
                                            disabled:cursor-not-allowed
                                            disabled:opacity-70
                                          "
                                          disabled={
                                            aConfirmar
                                          }
                                          maxLength={
                                            500
                                          }
                                          onChange={(
                                            event,
                                          ) => {
                                            alterarTextoLivre(
                                              opcao.idComentario,
                                              event
                                                .target
                                                .value,
                                            );
                                          }}
                                          placeholder="Introduza o comentário…"
                                          value={
                                            estado
                                              ?.texto ??
                                            ""
                                          }
                                        />
                                      ) : null}
                                    </article>
                                  );
                                },
                              )}
                            </div>
                          ) : (
                            <p
                              className="
                                rounded-xl border
                                border-dashed
                                border-slate-300
                                bg-white p-4
                                text-sm
                                text-slate-500
                              "
                            >
                              Este grupo não possui
                              opções configuradas.
                            </p>
                          )}
                        </div>
                      ) : null}
                    </section>
                  );
                },
              )}
            </div>
          ) : null}
        </div>

        {erroConfirmacao ? (
          <div
            role="alert"
            className="
              mx-5 mb-4 rounded-xl
              border border-red-200
              bg-red-50 px-4 py-3
              text-sm font-semibold
              text-red-700 sm:mx-6
            "
          >
            {erroConfirmacao}
          </div>
        ) : null}

        <footer
          className="
            border-t border-slate-200
            bg-slate-50 px-5 py-4
            sm:px-6
          "
        >
          <div
            className="
              flex flex-col-reverse
              gap-3 sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <button
              className="
                min-h-12 rounded-xl
                border border-slate-300
                bg-white px-5 py-3
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-100
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              disabled={
                aConfirmar ||
                numeroSelecionados ===
                0
              }
              onClick={limparSelecao}
              type="button"
            >
              Limpar seleção
            </button>

            <div
              className="
                flex flex-col gap-3
                sm:flex-row
              "
            >
              <button
                className="
                  min-h-12 rounded-xl
                  border border-slate-300
                  bg-white px-6 py-3
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  active:scale-[0.98]
                "
                disabled={aConfirmar}
                onClick={onFechar}
                type="button"
              >
                Cancelar
              </button>

              <button
                className="
                  min-h-12 rounded-xl
                  bg-blue-600 px-7 py-3
                  font-bold text-white
                  shadow-sm transition
                  hover:bg-blue-700
                  active:scale-[0.98]
                  disabled:cursor-not-allowed
                  disabled:bg-slate-300
                  disabled:shadow-none
                "
                disabled={
                  aConfirmar ||
                  carregando ||
                  Boolean(erro) ||
                  grupos.length === 0
                }
                onClick={confirmar}
                type="button"
              >
                {aConfirmar
                  ? "A gravar..."
                  : numeroSelecionados > 0
                    ? `Confirmar (${numeroSelecionados})`
                    : "Adicionar sem comentário"}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}