"use client";

import {
  useEffect,
  useMemo,
} from "react";

export interface ContaRapidaItem {
  idMovimentoMesa: number;
  idInternoConta: number;

  numeroConta: number;
  descricaoConta: string;

  numeroPessoas: number;
  numeroItens: number;

  valorTotal: number;

  /**
   * Permite realçar a conta que está atualmente aberta
   * no editor.
   */
  selecionada?: boolean;

  /**
   * Se a API vier a devolver uma conta indisponível para
   * pagamento, a page pode desligar apenas o botão Pagar.
   */
  podePagar?: boolean;

  /**
   * Mensagem opcional da API para explicar por que motivo
   * a conta não pode ser paga.
   */
  mensagemPagamento?: string | null;
}

interface ContasRapidasDrawerProps {
  open: boolean;

  descricaoMesa?: string;
  descricaoSala?: string;

  contas: ContaRapidaItem[];

  aCarregar?: boolean;

  /**
   * ID da conta que está atualmente a executar uma ação.
   * Usado apenas para feedback/bloqueio visual.
   */
  idInternoContaEmProcessamento?:
    | number
    | null;

  mensagemErro?: string;

  onFechar: () => void;

  /**
   * Abre a conta no editor.
   * A page continua responsável por sessionStorage,
   * carregamento da conta e atualização do estado.
   */
  onAbrirConta: (
    conta: ContaRapidaItem,
  ) => void;

  /**
   * Inicia o mesmo fluxo de pagamento já existente
   * para a conta escolhida.
   */
  onPagarConta: (
    conta: ContaRapidaItem,
  ) => void;

  /**
   * Atualização opcional da lista.
   */
  onAtualizar?: () => void;
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

export default function ContasRapidasDrawer({
  open,
  descricaoMesa = "Mesa",
  descricaoSala = "",
  contas,
  aCarregar = false,
  idInternoContaEmProcessamento = null,
  mensagemErro = "",
  onFechar,
  onAbrirConta,
  onPagarConta,
  onAtualizar,
}: ContasRapidasDrawerProps) {
  const totalContas =
    contas.length;

  const valorTotalMesa =
    useMemo(
      () =>
        contas.reduce(
          (
            total,
            conta,
          ) =>
            total +
            conta.valorTotal,
          0,
        ),
      [
        contas,
      ],
    );

  const totalItens =
    useMemo(
      () =>
        contas.reduce(
          (
            total,
            conta,
          ) =>
            total +
            conta.numeroItens,
          0,
        ),
      [
        contas,
      ],
    );

  /*
    Bloqueia o scroll da página enquanto o Drawer está aberto.
  */
  useEffect(() => {
    if (!open) {
      return;
    }

    const overflowAnterior =
      document.body.style
        .overflow;

    document.body.style
      .overflow = "hidden";

    function fecharComEscape(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onFechar();
      }
    }

    window.addEventListener(
      "keydown",
      fecharComEscape,
    );

    return () => {
      document.body.style
        .overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        fecharComEscape,
      );
    };
  }, [
    open,
    onFechar,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Fechar contas"
        onClick={
          onFechar
        }
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Contas de ${descricaoMesa}`}
        className={[
          "absolute flex overflow-hidden border-slate-200 bg-slate-50 shadow-2xl",
          "inset-x-0 bottom-0 h-[86dvh] max-h-[86dvh] flex-col rounded-t-[28px] border-t",
          "lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:max-h-none lg:w-[460px] lg:rounded-none lg:border-l lg:border-t-0",
        ].join(" ")}
      >
        <div className="shrink-0 bg-white lg:hidden">
          <div className="pt-2">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300" />
          </div>
        </div>

        <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-4 pt-3 sm:px-5 lg:pt-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
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
                  strokeLinejoin="round"
                  d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-2-1.33V4a1 1 0 0 1 1-1Z"
                />

                <path
                  strokeLinecap="round"
                  d="M8 8h8M8 12h8M8 16h5"
                />
              </svg>
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
                Acesso rápido
              </p>

              <h2 className="mt-0.5 truncate text-xl font-black tracking-tight text-slate-950">
                Contas da{" "}
                {
                  descricaoMesa
                }
              </h2>

              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                {descricaoSala
                  ? `${descricaoSala} · `
                  : ""}
                {totalContas}{" "}
                {totalContas === 1
                  ? "conta"
                  : "contas"}{" "}
                abertas
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {onAtualizar && (
                <button
                  type="button"
                  onClick={
                    onAtualizar
                  }
                  disabled={
                    aCarregar ||
                    idInternoContaEmProcessamento !==
                      null
                  }
                  title="Atualizar contas"
                  aria-label="Atualizar contas"
                  className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={[
                      "h-5 w-5",
                      aCarregar
                        ? "animate-spin"
                        : "",
                    ].join(
                      " ",
                    )}
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 6v6h-6M4 18v-6h6M6.5 8A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 11.5-2"
                    />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={
                  onFechar
                }
                aria-label="Fechar"
                className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 active:scale-95"
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
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                Contas
              </p>

              <strong className="mt-0.5 block text-base font-black text-slate-950">
                {
                  totalContas
                }
              </strong>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                Itens
              </p>

              <strong className="mt-0.5 block text-base font-black text-slate-950">
                {
                  totalItens
                }
              </strong>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wide text-emerald-600">
                Total
              </p>

              <strong className="mt-0.5 block truncate text-base font-black text-emerald-800">
                {formatarValor(
                  valorTotalMesa,
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [touch-action:pan-y] [-webkit-overflow-scrolling:touch] sm:p-4">
          {mensagemErro && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {
                mensagemErro
              }
            </div>
          )}

          {aCarregar &&
          contas.length ===
            0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={
                      item
                    }
                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="h-4 w-28 rounded bg-slate-200" />

                    <div className="mt-3 h-3 w-44 rounded bg-slate-100" />

                    <div className="mt-4 flex gap-2">
                      <div className="h-10 flex-1 rounded-xl bg-slate-100" />

                      <div className="h-10 flex-1 rounded-xl bg-slate-200" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : contas.length ===
            0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-2-1.33V4a1 1 0 0 1 1-1Z"
                  />
                </svg>
              </span>

              <h3 className="mt-4 text-base font-black text-slate-950">
                Sem contas abertas
              </h3>

              <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
                Não existem contas
                disponíveis nesta mesa.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contas.map(
                (conta) => {
                  const emProcessamento =
                    idInternoContaEmProcessamento ===
                    conta.idInternoConta;

                  const podePagar =
                    conta.podePagar !==
                    false;

                  return (
                    <article
                      key={
                        conta.idInternoConta
                      }
                      className={[
                        "overflow-hidden rounded-2xl border bg-white shadow-sm transition",
                        conta.selecionada
                          ? "border-blue-300 ring-2 ring-blue-100"
                          : "border-slate-200",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <h3 className="truncate text-base font-black text-slate-950">
                                {conta.descricaoConta ||
                                  `Conta ${conta.numeroConta}`}
                              </h3>

                              {conta.selecionada && (
                                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-blue-700">
                                  Atual
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
                              <span>
                                {
                                  conta.numeroItens
                                }{" "}
                                {conta.numeroItens ===
                                1
                                  ? "item"
                                  : "itens"}
                              </span>

                              <span
                                aria-hidden="true"
                                className="text-slate-300"
                              >
                                ·
                              </span>

                              <span>
                                {
                                  conta.numeroPessoas
                                }{" "}
                                {conta.numeroPessoas ===
                                1
                                  ? "cliente"
                                  : "clientes"}
                              </span>
                            </div>
                          </div>

                          <strong className="shrink-0 whitespace-nowrap text-xl font-black tracking-tight text-slate-950">
                            {formatarValor(
                              conta.valorTotal,
                            )}
                          </strong>
                        </div>

                        {!podePagar &&
                          conta.mensagemPagamento && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-5 text-amber-800">
                            {
                              conta.mensagemPagamento
                            }
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onAbrirConta(
                                conta,
                              )
                            }
                            disabled={
                              emProcessamento ||
                              (
                                idInternoContaEmProcessamento !==
                                null
                              )
                            }
                            className="flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 transition hover:bg-blue-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 12h14M13 6l6 6-6 6"
                              />
                            </svg>

                            {emProcessamento
                              ? "A abrir..."
                              : "Abrir"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onPagarConta(
                                conta,
                              )
                            }
                            disabled={
                              !podePagar ||
                              conta.valorTotal <=
                                0 ||
                              emProcessamento ||
                              (
                                idInternoContaEmProcessamento !==
                                null
                              )
                            }
                            title={
                              !podePagar
                                ? conta.mensagemPagamento ||
                                  "Esta conta não pode ser paga."
                                : "Pagar esta conta."
                            }
                            className="flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-emerald-600/15 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-4 w-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <rect
                                x="3"
                                y="5"
                                width="18"
                                height="14"
                                rx="2"
                              />

                              <path
                                strokeLinecap="round"
                                d="M3 10h18M7 15h3"
                              />
                            </svg>

                            {emProcessamento
                              ? "A processar..."
                              : "Pagar"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                Total da mesa
              </p>

              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {totalContas}{" "}
                {totalContas === 1
                  ? "conta"
                  : "contas"}{" "}
                · {totalItens}{" "}
                {totalItens === 1
                  ? "item"
                  : "itens"}
              </p>
            </div>

            <strong className="text-2xl font-black tracking-tight text-slate-950">
              {formatarValor(
                valorTotalMesa,
              )}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}
