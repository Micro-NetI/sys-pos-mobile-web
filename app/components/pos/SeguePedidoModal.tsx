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

type HistoricoSegue =
  POSMobileDadosSegueConta["historico"][number];

interface SegueHistoricoVisual {
  historico: HistoricoSegue;
  grupos: GrupoVisual[];
  numeroLinhasEncontradas: number;
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

function criarGruposVisuais(
  linhas: POSMobileSegueLinha[],
): GrupoVisual[] {
  const mapa =
    new Map<string, GrupoVisual>();

  for (const linha of linhas) {
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
    (primeiro, segundo) => {
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
      return criarGruposVisuais(
        linhasDisponiveis,
      );
    }, [linhasDisponiveis]);

  /*
    O histórico deixa de viver apenas na coluna lateral.

    Cada Segue é também reconstruído na zona principal através dos IDs
    das linhas devolvidos pela APIFNT. Desta forma o operador vê a mesma
    fronteira funcional do POS desktop: linhas já enviadas, separador do
    Segue respetivo e, por baixo, o próximo conjunto ainda por enviar.
  */
  const historicoOrdenado =
    useMemo<HistoricoSegue[]>(() => {
      return (dados?.historico ?? [])
        .slice()
        .sort(
          (primeiro, segundo) =>
            primeiro.idSegue -
            segundo.idSegue,
        );
    }, [dados]);

  const historicoVisual =
    useMemo<SegueHistoricoVisual[]>(() => {
      const linhasPorId =
        new Map<number, POSMobileSegueLinha>();

      for (
        const linha of
        dados?.linhas ?? []
      ) {
        linhasPorId.set(
          linha.idLinha,
          linha,
        );
      }

      return historicoOrdenado.map(
        (historico) => {
          const linhas =
            historico.idLinhas
              .map((idLinha) =>
                linhasPorId.get(
                  idLinha,
                ),
              )
              .filter(
                (linha): linha is POSMobileSegueLinha =>
                  linha !== undefined,
              );

          return {
            historico,
            grupos:
              criarGruposVisuais(
                linhas,
              ),
            numeroLinhasEncontradas:
              linhas.length,
          };
        },
      );
    }, [
      dados,
      historicoOrdenado,
    ]);

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

  function dispararImpressaoFisica(
    accessToken: string,
    idSegue: number,
  ) {
    /*
      V6 - impressão física desacoplada.

      O pedido já foi registado na produção pela chamada principal.
      Esta segunda chamada é deliberadamente NÃO bloqueante para a UI.

      keepalive ajuda a manter o pedido HTTP mesmo quando o modal fecha
      e a página regressa imediatamente ao ecrã das mesas.
    */
    void fetch(
      "/api/pos-mobile/imprimir-pedido-cozinha-fisico",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        keepalive: true,
        body: JSON.stringify({
          accessToken,
          idMovimentoMesa,
          idInternoConta,
          idSegue,
        }),
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          const texto =
            await response.text();

          console.error(
            "A impressão física do pedido de cozinha falhou.",
            {
              idMovimentoMesa,
              idInternoConta,
              idSegue,
              status: response.status,
              resposta: texto,
            },
          );
        }
      })
      .catch((error) => {
        /*
          A falha do papel não altera o sucesso do pedido de produção.
          O Segue já está persistido e pode estar visível no monitor.
        */
        console.error(
          "Não foi possível iniciar/concluir a impressão física do pedido de cozinha.",
          {
            idMovimentoMesa,
            idInternoConta,
            idSegue,
            error,
          },
        );
      });
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

      const idSegue =
        resultado.dados.idSegue;

      /*
        O servidor já confirmou o registo na produção.
        Disparamos agora o papel numa segunda chamada e NÃO aguardamos.
      */
      dispararImpressaoFisica(
        accessToken,
        idSegue,
      );

      setMensagemSucesso(
        `Segue ${idSegue} enviado com sucesso.`,
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:p-3 lg:p-5">
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[96dvh] sm:max-w-6xl sm:rounded-3xl sm:border sm:border-white/20 lg:max-h-[94dvh]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white sm:px-5 sm:py-4 lg:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300 sm:text-[10px] sm:tracking-[0.2em]">
              Pedido de produção
            </p>

            <div className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="truncate text-lg font-black sm:text-xl lg:text-2xl">
                Segue · {descricaoMesa}
              </h2>

              {!aCarregar && dados && (
                <span className="shrink-0 text-[11px] font-bold text-slate-300 sm:text-xs">
                  {linhasDisponiveis.length} por enviar
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={aEnviar}
            aria-label="Fechar janela do segue"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50 sm:h-11 sm:w-11"
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

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-h-0 overflow-y-auto bg-slate-100 px-3 pb-4 pt-0 sm:px-4 sm:pb-5 lg:p-5">
            {/*
              Em mobile esta barra fica presa ao topo da lista. Assim o operador
              pode percorrer dezenas de produtos sem perder a contagem nem os
              comandos de seleção.
            */}
            <div className="sticky top-0 z-20 -mx-3 mb-3 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:-mx-4 sm:px-4 lg:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-950">
                    {idLinhasSelecionadas.length} selecionada
                    {idLinhasSelecionadas.length === 1 ? "" : "s"}
                  </span>
                  <span className="ml-1.5 text-[11px] font-semibold text-slate-400">
                    de {linhasDisponiveis.length}
                  </span>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={selecionarTodos}
                    disabled={linhasDisponiveis.length === 0}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 disabled:opacity-40"
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={limparSelecao}
                    disabled={idLinhasSelecionadas.length === 0}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 disabled:opacity-40"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            {aCarregar ? (
              <div className="flex min-h-72 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                  <p className="mt-3 text-sm font-bold text-slate-600">
                    A carregar linhas do segue...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/*
                  Histórico compacto. Fica recolhido por defeito para não empurrar
                  os produtos pendentes para baixo quando existem muitos Segues.
                  O operador abre apenas o Segue que quiser consultar.
                */}
                {historicoVisual.length > 0 && (
                  <section className="space-y-1.5 pt-1 lg:pt-0">
                    <div className="flex items-center justify-between gap-3 px-0.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Já enviado
                      </p>
                      <span className="text-[11px] font-bold text-slate-400">
                        {historicoVisual.length} segue
                        {historicoVisual.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {historicoVisual.map(
                      ({
                        historico,
                        grupos,
                        numeroLinhasEncontradas,
                      }) => (
                        <details
                          key={historico.idSegue}
                          className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2.5 marker:content-none sm:px-4">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-3.5 w-3.5"
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
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-2">
                                <strong className="shrink-0 text-sm text-slate-800">
                                  Segue {historico.idSegue}
                                </strong>
                                <span className="truncate text-[11px] font-semibold text-slate-500">
                                  {historico.horaSegue || "—"}
                                  {historico.utilizadorSegue
                                    ? ` · ${historico.utilizadorSegue}`
                                    : ""}
                                </span>
                              </div>
                            </div>

                            <span className="shrink-0 text-[11px] font-bold text-slate-500">
                              {historico.idLinhas.length} linha
                              {historico.idLinhas.length === 1 ? "" : "s"}
                            </span>

                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m6 9 6 6 6-6"
                              />
                            </svg>
                          </summary>

                          <div className="border-t border-slate-100 bg-slate-50/70 px-2 py-2 sm:px-3">
                            {grupos.length > 0 ? (
                              <div className="space-y-2">
                                {grupos.map((grupo) => {
                                  const corGrupo =
                                    converterCorDelphi(
                                      grupo.corGrupo,
                                    );

                                  return (
                                    <div
                                      key={`${historico.idSegue}-${grupo.chave}`}
                                      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                                    >
                                      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                                        <span
                                          className="h-5 w-1.5 shrink-0 rounded-full bg-slate-300"
                                          style={{
                                            backgroundColor:
                                              corGrupo,
                                          }}
                                        />
                                        <p className="min-w-0 flex-1 truncate text-xs font-black text-slate-700">
                                          <span className="mr-1.5 font-bold uppercase text-slate-400">
                                            {grupo.zonaPreparacao}
                                          </span>
                                          {grupo.grupoPreparacao}
                                        </p>
                                      </div>

                                      <div className="divide-y divide-slate-100">
                                        {grupo.linhas.map(
                                          (linha) => (
                                            <div
                                              key={linha.idLinha}
                                              className="flex items-start gap-2 px-3 py-2"
                                            >
                                              <span className="mt-0.5 text-xs font-black text-emerald-600">
                                                ✓
                                              </span>
                                              <p
                                                className={[
                                                  "min-w-0 flex-1 text-sm font-semibold text-slate-600",
                                                  linha.anulado
                                                    ? "line-through opacity-60"
                                                    : "",
                                                ].join(" ")}
                                              >
                                                {linha.descricao}
                                              </p>
                                              <span className="shrink-0 text-xs font-bold text-slate-400">
                                                {linha.quantidade}×
                                              </span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="px-2 py-2 text-xs font-semibold text-slate-500">
                                {numeroLinhasEncontradas === 0
                                  ? "As linhas deste segue já não estão disponíveis no detalhe atual da conta."
                                  : "Sem detalhe disponível."}
                              </p>
                            )}
                          </div>
                        </details>
                      ),
                    )}
                  </section>
                )}

                {/* Separador funcional do novo Segue: pequeno e inequívoco. */}
                <div className="flex items-center gap-2 py-1">
                  <span className="h-5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <strong className="text-xs font-black uppercase tracking-[0.12em] text-slate-800">
                    Por enviar
                  </strong>
                  <div className="h-px flex-1 bg-slate-300" />
                  <span className="shrink-0 text-xs font-black text-slate-500">
                    {linhasDisponiveis.length} linha
                    {linhasDisponiveis.length === 1 ? "" : "s"}
                  </span>
                </div>

                {gruposVisuais.length > 0 ? (
                  <div className="space-y-2.5">
                    {gruposVisuais.map((grupo) => {
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
                          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              alternarGrupo(
                                grupo,
                              )
                            }
                            className="flex w-full items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5 text-left transition hover:bg-slate-50 sm:px-4"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                className="h-7 w-1.5 shrink-0 rounded-full bg-slate-300"
                                style={{
                                  backgroundColor:
                                    corGrupo,
                                }}
                              />

                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {grupo.zonaPreparacao}
                                </p>
                                <h3 className="truncate text-sm font-black text-slate-900 sm:text-base">
                                  {grupo.grupoPreparacao}
                                </h3>
                              </div>
                            </div>

                            <span
                              className={[
                                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black sm:text-xs",
                                todosSelecionados
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-600",
                              ].join(" ")}
                            >
                              {todosSelecionados
                                ? "Tudo"
                                : grupo.linhas.length}
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
                                    key={linha.idLinha}
                                    type="button"
                                    onClick={() =>
                                      alternarLinha(
                                        linha.idLinha,
                                      )
                                    }
                                    className={[
                                      "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition sm:gap-3 sm:px-4",
                                      selecionada
                                        ? "bg-blue-50"
                                        : "hover:bg-slate-50",
                                    ].join(" ")}
                                  >
                                    <span
                                      className={[
                                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 sm:h-6 sm:w-6 sm:rounded-md",
                                        selecionada
                                          ? "border-blue-600 bg-blue-600 text-white"
                                          : "border-slate-300 bg-white",
                                      ].join(" ")}
                                    >
                                      {selecionada && (
                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
                                      <div className="flex items-start gap-2">
                                        <p className="min-w-0 flex-1 text-sm font-bold leading-5 text-slate-900">
                                          {linha.descricao}
                                        </p>
                                        <span className="shrink-0 pt-0.5 text-xs font-black text-slate-500">
                                          {linha.quantidade}×
                                        </span>
                                      </div>

                                      {(linha.jaImpresso ||
                                        linha.selecionadoPorDefeito) && (
                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold sm:text-[11px]">
                                          {linha.jaImpresso && (
                                            <span className="inline-flex items-center gap-1 text-slate-400">
                                              <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                className="h-3 w-3"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                aria-hidden="true"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M6 9V3h12v6M6 18h12v3H6v-3Zm-2-9h16a2 2 0 0 1 2 2v5h-4v-3H6v3H2v-5a2 2 0 0 1 2-2Z"
                                                />
                                              </svg>
                                              Já impresso
                                            </span>
                                          )}

                                          {linha.selecionadoPorDefeito && (
                                            <span className="text-amber-700">
                                              Predefinida
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                    <div>
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m5 12 4 4L19 6"
                          />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-base font-black text-slate-900">
                        Não existem linhas por enviar
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Todas as linhas já foram enviadas ou não possuem configuração de produção.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Desktop / tablet largo: painel lateral fixo. */}
          <aside className="hidden min-h-0 flex-col border-l border-slate-200 bg-white lg:flex">
            <div className="border-b border-slate-200 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Novo segue
              </p>

              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-black text-slate-950">
                    {idLinhasSelecionadas.length}
                  </p>
                  <p className="text-sm font-semibold text-slate-500">
                    linha
                    {idLinhasSelecionadas.length === 1 ? "" : "s"} selecionada
                    {idLinhasSelecionadas.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-xs font-black text-slate-400">
                  / {linhasDisponiveis.length}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={selecionarTodos}
                  disabled={linhasDisponiveis.length === 0}
                  className="h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Selecionar tudo
                </button>
                <button
                  type="button"
                  onClick={limparSelecao}
                  disabled={idLinhasSelecionadas.length === 0}
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

              {historicoOrdenado.length ? (
                <div className="mt-3 space-y-1.5">
                  {historicoOrdenado
                    .slice()
                    .reverse()
                    .map((historico) => (
                      <div
                        key={historico.idSegue}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
                          ✓
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-xs text-slate-800">
                              Segue {historico.idSegue}
                            </strong>
                            <span className="shrink-0 text-[10px] font-bold text-slate-500">
                              {historico.horaSegue || "—"}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                            {historico.idLinhas.length} linha
                            {historico.idLinhas.length === 1 ? "" : "s"}
                            {historico.utilizadorSegue
                              ? ` · ${historico.utilizadorSegue}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
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
                  idLinhasSelecionadas.length === 0
                }
                className="min-h-12 w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                {aEnviar
                  ? "A enviar segue..."
                  : `Enviar segue · ${idLinhasSelecionadas.length}`}
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

        {/* Mobile / tablet estreito: ações sempre visíveis no fundo. */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] lg:hidden">
          {(mensagemSucesso || mensagemErro) && (
            <div
              className={[
                "mb-2 rounded-lg px-3 py-2 text-xs font-semibold",
                mensagemErro
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700",
              ].join(" ")}
            >
              {mensagemErro || mensagemSucesso}
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2 sm:grid-cols-[minmax(0,1fr)_110px]">
            <button
              type="button"
              onClick={() =>
                void enviarSelecionados()
              }
              disabled={
                aEnviar ||
                aCarregar ||
                idLinhasSelecionadas.length === 0
              }
              className="h-12 rounded-xl bg-amber-500 px-3 text-sm font-black text-white shadow-sm transition active:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {aEnviar
                ? "A enviar..."
                : `Enviar segue · ${idLinhasSelecionadas.length}`}
            </button>

            <button
              type="button"
              onClick={onFechar}
              disabled={aEnviar}
              className="h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
