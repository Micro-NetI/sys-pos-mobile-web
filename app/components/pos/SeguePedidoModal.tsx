//app\components\pos\SeguePedidoModal.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  POSMobileDadosSegueConta,
  POSMobileDadosSegueContaResposta,
  POSMobileImprimirPedidoCozinhaResposta,
  POSMobileSegueLinha,
} from "@/types/impressao";

interface SeguePedidoModalProps {
  aberto: boolean;
  descricaoMesa: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  onFechar: () => void;
  onEnviado?: () =>
    | Promise<void>
    | void;
}

interface GrupoVisual {
  chave: string;
  zonaPreparacao: string;
  idGrupoPreparacao: number;
  grupoPreparacao: string;
  ordemGrupo: number;
  corGrupo: string;
  linhas: POSMobileSegueLinha[];
}

const CORES_DELPHI: Record<string, string> = {
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

function converterCorDelphi(
  valor: string | null | undefined,
): string | undefined {
  const normalizado =
    valor?.trim().toLowerCase();

  if (!normalizado) {
    return undefined;
  }

  const conhecida =
    CORES_DELPHI[normalizado];

  if (conhecida) {
    return conhecida;
  }

  if (
    /^#[0-9a-f]{3}$/i.test(
      normalizado,
    ) ||
    /^#[0-9a-f]{6}$/i.test(
      normalizado,
    )
  ) {
    return normalizado;
  }

  if (/^\$[0-9a-f]{8}$/i.test(normalizado)) {
    const numero =
      Number.parseInt(
        normalizado.slice(1),
        16,
      );

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

function linhaDisponivel(
  linha: POSMobileSegueLinha,
): boolean {
  return (
    !linha.bloqueado &&
    !linha.anulado &&
    !linha.segue
  );
}

export default function SeguePedidoModal({
  aberto,
  descricaoMesa,
  idMovimentoMesa,
  idInternoConta,
  onFechar,
  onEnviado,
}: SeguePedidoModalProps) {
  const [dados, setDados] =
    useState<POSMobileDadosSegueConta | null>(
      null,
    );

  const [
    idLinhasSelecionadas,
    setIdLinhasSelecionadas,
  ] = useState<number[]>([]);

  const [aCarregar, setACarregar] =
    useState(false);

  const [aEnviar, setAEnviar] =
    useState(false);

  const [mensagemErro, setMensagemErro] =
    useState("");

  const [mensagemSucesso, setMensagemSucesso] =
    useState("");

  const carregarDados =
    useCallback(async () => {
      if (!aberto) {
        return;
      }

      const accessToken =
        sessionStorage.getItem(
          "posMobileAccessToken",
        );

      if (!accessToken) {
        setMensagemErro(
          "A sessão do operador não está disponível.",
        );
        return;
      }

      setACarregar(true);
      setMensagemErro("");

      try {
        const response =
          await fetch(
            "/api/pos-mobile/dados-segue-conta",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body: JSON.stringify({
                accessToken,
                idMovimentoMesa,
                idInternoConta,
              }),
            },
          );

        const resultado =
          (await response.json()) as
            POSMobileDadosSegueContaResposta;

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível carregar os dados do segue.",
          );
        }

        setDados(
          resultado.dados,
        );

        setIdLinhasSelecionadas(
          resultado.dados.linhas
            .filter(
              (linha) =>
                linhaDisponivel(
                  linha,
                ) &&
                linha.selecionadoPorDefeito,
            )
            .map(
              (linha) =>
                linha.idLinha,
            ),
        );
      } catch (error) {
        setDados(null);
        setIdLinhasSelecionadas([]);

        setMensagemErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao carregar o segue.",
        );
      } finally {
        setACarregar(false);
      }
    }, [
      aberto,
      idInternoConta,
      idMovimentoMesa,
    ]);

  useEffect(() => {
    if (!aberto) {
      setDados(null);
      setIdLinhasSelecionadas([]);
      setMensagemErro("");
      setMensagemSucesso("");
      return;
    }

    void carregarDados();
  }, [
    aberto,
    carregarDados,
  ]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function tratarTecla(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape" &&
        !aEnviar
      ) {
        onFechar();
      }
    }

    window.addEventListener(
      "keydown",
      tratarTecla,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        tratarTecla,
      );
    };
  }, [
    aberto,
    aEnviar,
    onFechar,
  ]);

  const linhasDisponiveis =
    useMemo(() => {
      return (
        dados?.linhas.filter(
          linhaDisponivel,
        ) ?? []
      );
    }, [dados]);

  const gruposVisuais =
    useMemo<GrupoVisual[]>(() => {
      const mapa =
        new Map<
          string,
          GrupoVisual
        >();

      for (
        const linha of
        linhasDisponiveis
      ) {
        const chave = [
          linha.zonaPreparacao,
          linha.idGrupoPreparacao,
        ].join(":");

        const existente =
          mapa.get(chave);

        if (existente) {
          existente.linhas.push(
            linha,
          );
          continue;
        }

        mapa.set(
          chave,
          {
            chave,
            zonaPreparacao:
              linha.zonaPreparacao,
            idGrupoPreparacao:
              linha.idGrupoPreparacao,
            grupoPreparacao:
              linha.grupoPreparacao,
            ordemGrupo:
              linha.ordemGrupo,
            corGrupo:
              linha.corGrupo,
            linhas: [
              linha,
            ],
          },
        );
      }

      return Array.from(
        mapa.values(),
      ).sort(
        (
          primeiro,
          segundo,
        ) => {
          const zona =
            primeiro.zonaPreparacao.localeCompare(
              segundo.zonaPreparacao,
              "pt-PT",
            );

          if (zona !== 0) {
            return zona;
          }

          return (
            primeiro.ordemGrupo -
            segundo.ordemGrupo
          );
        },
      );
    }, [linhasDisponiveis]);

  function alternarLinha(
    idLinha: number,
  ) {
    setMensagemErro("");
    setMensagemSucesso("");

    setIdLinhasSelecionadas(
      (idsAtuais) => {
        if (
          idsAtuais.includes(
            idLinha,
          )
        ) {
          return idsAtuais.filter(
            (idAtual) =>
              idAtual !== idLinha,
          );
        }

        return [
          ...idsAtuais,
          idLinha,
        ];
      },
    );
  }

  function selecionarTodos() {
    setIdLinhasSelecionadas(
      linhasDisponiveis.map(
        (linha) =>
          linha.idLinha,
      ),
    );
  }

  function limparSelecao() {
    setIdLinhasSelecionadas(
      [],
    );
  }

  function alternarGrupo(
    grupo: GrupoVisual,
  ) {
    const idsGrupo =
      grupo.linhas.map(
        (linha) =>
          linha.idLinha,
      );

    const grupoCompleto =
      idsGrupo.every(
        (idLinha) =>
          idLinhasSelecionadas.includes(
            idLinha,
          ),
      );

    setIdLinhasSelecionadas(
      (idsAtuais) => {
        if (grupoCompleto) {
          return idsAtuais.filter(
            (idLinha) =>
              !idsGrupo.includes(
                idLinha,
              ),
          );
        }

        return Array.from(
          new Set([
            ...idsAtuais,
            ...idsGrupo,
          ]),
        );
      },
    );
  }

  async function enviarSelecionados() {
    if (
      idLinhasSelecionadas.length ===
      0
    ) {
      setMensagemErro(
        "Selecione pelo menos uma linha para enviar.",
      );
      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (!accessToken) {
      setMensagemErro(
        "A sessão do operador não está disponível.",
      );
      return;
    }

    setAEnviar(true);
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const response =
        await fetch(
          "/api/pos-mobile/imprimir-pedido-cozinha",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idMovimentoMesa,
              idInternoConta,
              idLinhas:
                idLinhasSelecionadas,
            }),
          },
        );

      const resultado =
        (await response.json()) as
          POSMobileImprimirPedidoCozinhaResposta;

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível enviar o pedido para a cozinha.",
        );
      }

      setMensagemSucesso(
        `Segue ${resultado.dados.idSegue} enviado com sucesso.`,
      );

      setIdLinhasSelecionadas(
        [],
      );

      await carregarDados();
      await onEnviado?.();
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao enviar o segue.",
      );
    } finally {
      setAEnviar(false);
    }
  }

  if (!aberto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">
              Pedido de produção
            </p>

            <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">
              Segue · {descricaoMesa}
            </h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={aEnviar}
            aria-label="Fechar janela do segue"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                d="M6 6l12 12M18 6 6 18"
              />
            </svg>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_310px]">
          <section className="min-h-0 overflow-y-auto bg-slate-100 p-4 sm:p-5">
            {aCarregar ? (
              <div className="flex min-h-80 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

                  <p className="mt-4 font-bold text-slate-600">
                    A carregar linhas do segue...
                  </p>
                </div>
              </div>
            ) : gruposVisuais.length > 0 ? (
              <div className="space-y-4">
                {gruposVisuais.map(
                  (grupo) => {
                    const idsGrupo =
                      grupo.linhas.map(
                        (linha) =>
                          linha.idLinha,
                      );

                    const todosSelecionados =
                      idsGrupo.every(
                        (idLinha) =>
                          idLinhasSelecionadas.includes(
                            idLinha,
                          ),
                      );

                    const corGrupo =
                      converterCorDelphi(
                        grupo.corGrupo,
                      );

                    return (
                      <article
                        key={grupo.chave}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            alternarGrupo(
                              grupo,
                            )
                          }
                          className="flex w-full items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="h-9 w-2 shrink-0 rounded-full bg-slate-300"
                              style={{
                                backgroundColor:
                                  corGrupo,
                              }}
                            />

                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-400">
                                {grupo.zonaPreparacao}
                              </p>

                              <h3 className="truncate font-black text-slate-900">
                                {grupo.grupoPreparacao}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-black",
                              todosSelecionados
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            {todosSelecionados
                              ? "Selecionado"
                              : `${grupo.linhas.length} linhas`}
                          </span>
                        </button>

                        <div className="divide-y divide-slate-100">
                          {grupo.linhas.map(
                            (linha) => {
                              const selecionada =
                                idLinhasSelecionadas.includes(
                                  linha.idLinha,
                                );

                              return (
                                <button
                                  key={
                                    linha.idLinha
                                  }
                                  type="button"
                                  onClick={() =>
                                    alternarLinha(
                                      linha.idLinha,
                                    )
                                  }
                                  className={[
                                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                                    selecionada
                                      ? "bg-blue-50"
                                      : "hover:bg-slate-50",
                                  ].join(" ")}
                                >
                                  <span
                                    className={[
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
                                      selecionada
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-300 bg-white",
                                    ].join(" ")}
                                  >
                                    {selecionada && (
                                      <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-4 w-4"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        aria-hidden="true"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="m5 12 4 4L19 6"
                                        />
                                      </svg>
                                    )}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900">
                                      {linha.descricao}
                                    </p>

                                    <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                                      <span>
                                        Qtd. {linha.quantidade}
                                      </span>

                                      {linha.jaImpresso && (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                                          Pedido já impresso
                                        </span>
                                      )}

                                      {linha.selecionadoPorDefeito && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                                          Seleção predefinida
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            },
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Não existem linhas por enviar
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Todas as linhas desta conta já foram enviadas ou não possuem configuração de produção.
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="flex min-h-0 flex-col border-t border-slate-200 bg-white lg:border-l lg:border-t-0">
            <div className="border-b border-slate-200 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Seleção
              </p>

              <p className="mt-1 text-2xl font-black text-slate-950">
                {idLinhasSelecionadas.length}
              </p>

              <p className="text-sm font-semibold text-slate-500">
                linhas preparadas para envio
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={selecionarTodos}
                  disabled={
                    linhasDisponiveis.length ===
                    0
                  }
                  className="h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Selecionar tudo
                </button>

                <button
                  type="button"
                  onClick={limparSelecao}
                  disabled={
                    idLinhasSelecionadas.length ===
                    0
                  }
                  className="h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Histórico de segue
              </p>

              {dados?.historico.length ? (
                <div className="mt-3 space-y-2">
                  {dados.historico
                    .slice()
                    .sort(
                      (
                        primeiro,
                        segundo,
                      ) =>
                        segundo.idSegue -
                        primeiro.idSegue,
                    )
                    .map(
                      (historico) => (
                        <div
                          key={
                            historico.idSegue
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm text-slate-900">
                              Segue {historico.idSegue}
                            </strong>

                            <span className="text-xs font-bold text-slate-500">
                              {historico.horaSegue ||
                                "—"}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {historico.idLinhas.length} linhas
                            {historico.utilizadorSegue
                              ? ` · ${historico.utilizadorSegue}`
                              : ""}
                          </p>
                        </div>
                      ),
                    )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Ainda não existem segues registados.
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              {mensagemSucesso && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  {mensagemSucesso}
                </div>
              )}

              {mensagemErro && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {mensagemErro}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  void enviarSelecionados()
                }
                disabled={
                  aEnviar ||
                  aCarregar ||
                  idLinhasSelecionadas.length ===
                    0
                }
                className="h-12 w-full rounded-xl bg-amber-500 text-sm font-black text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {aEnviar
                  ? "A enviar para a cozinha..."
                  : "Enviar para a cozinha"}
              </button>

              <button
                type="button"
                onClick={onFechar}
                disabled={aEnviar}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Fechar
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
