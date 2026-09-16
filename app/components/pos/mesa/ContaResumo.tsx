"use client";

import {
  useMemo,
} from "react";

import type {
  POSMobileContaMesa,
} from "@/types/contas";

import type {
  ItemPedidoEditor,
  ProgramaPedidoEditor,
} from "@/types/editor-pedido";

interface ContaResumoProps {
  conta: POSMobileContaMesa | null;

  linhas: ItemPedidoEditor[];

  /**
   * Linha persistida atualmente selecionada na page.
   * É apenas estado visual.
   */
  idLinhaSelecionada?: string | null;

  /**
   * Estado das operações já existentes na page.tsx.
   */
  aProcessar?: boolean;
  aGerarConsulta?: boolean;
  aAbrirSegue?: boolean;
  aPagar?: boolean;

  /**
   * Consulta já emitida durante o fluxo atual.
   */
  idConsultaMesaGerada?: number | null;

  /**
   * Mensagens continuam a ser produzidas pela page.
   */
  mensagem?: string;
  mensagemErro?: string;

  /**
   * Ações funcionais continuam na page.tsx.
   */
  onSelecionarLinha?: (
    idLocal: string,
  ) => void;

  onEditarLinha?: (
    idLocal: string,
  ) => void;

  onAlterarClientes?: () => void;

  onConsulta: () => void;

  onSegue?: () => void;

  onPagar: () => void;
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

function formatarQuantidade(
  quantidade: number,
): string {
  if (
    Number.isInteger(
      quantidade,
    )
  ) {
    return String(
      quantidade,
    );
  }

  return new Intl.NumberFormat(
    "pt-PT",
    {
      maximumFractionDigits: 3,
    },
  ).format(
    quantidade,
  );
}

function obterComponentesSelecionados(
  linha: ProgramaPedidoEditor,
) {
  return linha.componentes.filter(
    (componente) =>
      componente.selecionado,
  );
}

export default function ContaResumo({
  conta,
  linhas,
  idLinhaSelecionada = null,
  aProcessar = false,
  aGerarConsulta = false,
  aAbrirSegue = false,
  aPagar = false,
  idConsultaMesaGerada = null,
  mensagem = "",
  mensagemErro = "",
  onSelecionarLinha,
  onEditarLinha,
  onAlterarClientes,
  onConsulta,
  onSegue,
  onPagar,
}: ContaResumoProps) {
  /*
    A Conta apresenta apenas linhas já persistidas.

    Qualquer linha NOVA pertence ao separador Consumo e deve ser
    confirmada antes de a venda/pagamento ser iniciado.
  */
  const linhasConta =
    useMemo(
      () =>
        linhas.filter(
          (linha) =>
            linha.origem ===
            "EXISTENTE",
        ),
      [
        linhas,
      ],
    );

  const linhasNovasPendentes =
    useMemo(
      () =>
        linhas.filter(
          (linha) =>
            linha.origem ===
            "NOVA",
        ),
      [
        linhas,
      ],
    );

  const totalItensConta =
    useMemo(
      () =>
        linhasConta.reduce(
          (
            total,
            linha,
          ) =>
            total +
            linha.quantidade,
          0,
        ),
      [
        linhasConta,
      ],
    );

  const totalLinhasConta =
    linhasConta.length;

  /*
    Para a área Conta damos prioridade ao valor persistido devolvido
    pela API. Só usamos a soma visual das linhas como fallback.
  */
  const totalCalculadoLinhas =
    useMemo(
      () =>
        linhasConta.reduce(
          (
            total,
            linha,
          ) =>
            total +
            linha.valorTotal,
          0,
        ),
      [
        linhasConta,
      ],
    );

  const totalConta =
    conta?.valorTotal ??
    totalCalculadoLinhas;

  const descricaoConta =
    conta?.descricaoConta
      ?.trim() ||
    (
      conta
        ? `Conta ${conta.idConta}`
        : "Conta"
    );

  const numeroPessoas =
    conta?.numeroPessoas ??
    1;

  const temConsumosPendentes =
    linhasNovasPendentes.length >
    0;

  const contaDisponivel =
    conta !== null &&
    linhasConta.length >
      0 &&
    totalConta >
      0;

  const consultaJaGerada =
    typeof idConsultaMesaGerada ===
      "number" &&
    idConsultaMesaGerada >
      0;

  const bloqueado =
    aProcessar ||
    aGerarConsulta ||
    aAbrirSegue ||
    aPagar;

  const podeOperarConta =
    contaDisponivel &&
    !temConsumosPendentes &&
    !bloqueado;

  return (
    <section className="flex min-h-0 flex-col bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
              Conta
            </p>

            <h2 className="mt-0.5 truncate text-lg font-black tracking-tight text-slate-950">
              {
                descricaoConta
              }
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
              <span>
                {formatarQuantidade(
                  totalItensConta,
                )}{" "}
                {totalItensConta === 1
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
                {numeroPessoas}{" "}
                {numeroPessoas === 1
                  ? "cliente"
                  : "clientes"}
              </span>

              <span
                aria-hidden="true"
                className="text-slate-300"
              >
                ·
              </span>

              <span>
                {totalLinhasConta}{" "}
                {totalLinhasConta === 1
                  ? "linha"
                  : "linhas"}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <strong className="block whitespace-nowrap text-2xl font-black tracking-tight text-slate-950">
              {formatarValor(
                totalConta,
              )}
            </strong>

            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
              Total da conta
            </span>
          </div>
        </div>

        {onAlterarClientes && (
          <button
            type="button"
            onClick={
              onAlterarClientes
            }
            disabled={
              bloqueado ||
              !conta
            }
            className="mt-3 inline-flex h-9 touch-manipulation items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87"
              />
            </svg>

            Alterar clientes

            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] shadow-sm">
              {
                numeroPessoas
              }
            </span>
          </button>
        )}
      </div>

      {temConsumosPendentes && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
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
                  d="M12 9v4m0 4h.01M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </span>

            <div className="min-w-0">
              <p className="text-xs font-black text-amber-900">
                Existem consumos por
                confirmar
              </p>

              <p className="mt-0.5 text-[11px] font-semibold leading-5 text-amber-800">
                Confirme primeiro os{" "}
                {
                  linhasNovasPendentes
                    .length
                }{" "}
                {linhasNovasPendentes
                  .length === 1
                  ? "consumo novo"
                  : "consumos novos"}{" "}
                no separador Consumo
                antes de consultar,
                enviar ou pagar esta
                conta.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [touch-action:pan-y] [-webkit-overflow-scrolling:touch] sm:p-4">
        {!conta ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
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

                <path
                  strokeLinecap="round"
                  d="M8 8h8M8 12h8M8 16h5"
                />
              </svg>
            </span>

            <h3 className="mt-4 text-base font-black text-slate-950">
              Conta ainda não criada
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">
              Adicione produtos no
              Consumo e confirme-os.
              Depois da gravação, a
              conta passa a estar
              disponível aqui.
            </p>
          </div>
        ) : linhasConta.length ===
          0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <h3 className="text-base font-black text-slate-950">
              Conta sem consumos
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Não existem linhas
              persistidas nesta conta.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {linhasConta.map(
              (linha) => {
                const selecionada =
                  idLinhaSelecionada ===
                  linha.idLocal;

                const programa =
                  linha.tipoItem ===
                  "PROGRAMA"
                    ? linha
                    : null;

                const componentesSelecionados =
                  programa
                    ? obterComponentesSelecionados(
                        programa,
                      )
                    : [];

                return (
                  <article
                    key={
                      linha.idLocal
                    }
                    className={[
                      "overflow-hidden rounded-2xl border bg-white shadow-sm transition",
                      selecionada
                        ? "border-blue-300 ring-2 ring-blue-100"
                        : "border-slate-200",
                    ].join(
                      " ",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onSelecionarLinha?.(
                          linha.idLocal,
                        )
                      }
                      disabled={
                        !onSelecionarLinha
                      }
                      className="w-full p-3 text-left disabled:cursor-default"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-start gap-2">
                            <h3 className="min-w-0 flex-1 text-sm font-black leading-5 text-slate-950">
                              {
                                linha.descricao
                              }
                            </h3>

                            {linha.tipoItem ===
                              "PROGRAMA" && (
                              <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-violet-700">
                                Programa
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            {formatarQuantidade(
                              linha.quantidade,
                            )}{" "}
                            ×{" "}
                            {formatarValor(
                              linha.preco,
                            )}
                          </p>

                          {linha.observacao && (
                            <p className="mt-1 line-clamp-2 text-[10px] font-semibold text-slate-400">
                              {
                                linha.observacao
                              }
                            </p>
                          )}
                        </div>

                        <strong className="shrink-0 whitespace-nowrap text-base font-black text-slate-950">
                          {formatarValor(
                            linha.valorTotal,
                          )}
                        </strong>
                      </div>
                    </button>

                    {programa &&
                      componentesSelecionados.length >
                        0 && (
                        <div className="mx-3 mb-3 rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                            Componentes
                          </p>

                          <div className="mt-1.5 space-y-1">
                            {componentesSelecionados.map(
                              (
                                componente,
                              ) => (
                                <div
                                  key={
                                    componente.idLocal
                                  }
                                  className="flex min-w-0 items-center justify-between gap-3 text-[11px]"
                                >
                                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-600">
                                    {formatarQuantidade(
                                      componente.quantidade,
                                    )}{" "}
                                    ×{" "}
                                    {
                                      componente.descricao
                                    }
                                  </span>

                                  {componente.valorTotal >
                                    0 && (
                                    <span className="shrink-0 font-bold text-slate-500">
                                      {formatarValor(
                                        componente.valorTotal,
                                      )}
                                    </span>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {onEditarLinha && (
                      <div className="border-t border-slate-100 px-3 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            onEditarLinha(
                              linha.idLocal,
                            )
                          }
                          disabled={
                            bloqueado
                          }
                          className="inline-flex h-8 touch-manipulation items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-4 w-4"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="1"
                            />

                            <circle
                              cx="19"
                              cy="12"
                              r="1"
                            />

                            <circle
                              cx="5"
                              cy="12"
                              r="1"
                            />
                          </svg>

                          Opções da linha
                        </button>
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:p-4">
        {mensagemErro && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {
              mensagemErro
            }
          </div>
        )}

        {!mensagemErro &&
          mensagem && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              {
                mensagem
              }
            </div>
          )}

        {consultaJaGerada && (
          <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
            Consulta de Mesa{" "}
            {
              idConsultaMesaGerada
            }{" "}
            já gerada neste fluxo.
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Total
            </p>

            <p className="mt-0.5 text-sm font-bold text-slate-600">
              {formatarQuantidade(
                totalItensConta,
              )}{" "}
              {totalItensConta === 1
                ? "item"
                : "itens"}
            </p>
          </div>

          <strong className="text-2xl font-black tracking-tight text-slate-950">
            {formatarValor(
              totalConta,
            )}
          </strong>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={
              onConsulta
            }
            disabled={
              !podeOperarConta ||
              consultaJaGerada
            }
            className="flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-800 transition hover:bg-violet-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
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
                d="M6 3h9l3 3v15H6V3Z"
              />

              <path
                strokeLinecap="round"
                d="M9 10h6M9 14h6M9 18h4"
              />
            </svg>

            {aGerarConsulta
              ? "A gerar..."
              : "Consulta"}
          </button>

          {onSegue ? (
            <button
              type="button"
              onClick={
                onSegue
              }
              disabled={
                !podeOperarConta
              }
              className="flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 transition hover:bg-amber-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
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
                  d="m5 12 4 4L19 6"
                />
              </svg>

              {aAbrirSegue
                ? "A abrir..."
                : "Segue"}
            </button>
          ) : (
            <div />
          )}
        </div>

        <button
          type="button"
          onClick={
            onPagar
          }
          disabled={
            !podeOperarConta
          }
          className="mt-2 flex min-h-13 w-full touch-manipulation items-center justify-between gap-4 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
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
            </span>

            <span className="min-w-0 text-left">
              <span className="block text-sm font-black">
                {aPagar
                  ? "A processar..."
                  : "Pagar conta"}
              </span>

              <span className="mt-0.5 block text-[10px] font-semibold text-emerald-100">
                Venda / pagamento
              </span>
            </span>
          </span>

          <strong className="shrink-0 whitespace-nowrap text-lg font-black">
            {formatarValor(
              totalConta,
            )}
          </strong>
        </button>
      </div>
    </section>
  );
}
