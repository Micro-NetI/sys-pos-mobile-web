

import {
  useMemo,
} from "react";

import type {
  ItemPedidoEditor,
  ProgramaPedidoEditor,
} from "@/types/editor-pedido";

interface ResumoConsumosProps {
  linhas: ItemPedidoEditor[];

  /**
   * Bloqueia as ações enquanto a page está a gravar
   * ou a executar uma operação incompatível.
   */
  aConfirmar?: boolean;

  /**
   * Permite bloquear todo o painel a partir da page.
   */
  disabled?: boolean;

  /**
   * Mensagens continuam a ser produzidas pela page.
   * O componente apenas as apresenta.
   */
  mensagem?: string;
  mensagemErro?: string;

  /**
   * A lógica continua na page.tsx.
   */
  onAlterarQuantidade: (
    idLocal: string,
    incremento: number,
  ) => void;

  onRemoverLinha: (
    idLocal: string,
  ) => void;

  onEditarComentarios?: (
    idLocal: string,
  ) => void;

  /**
   * Deve ser ligado na page ao fluxo que grava apenas
   * os consumos pendentes e permanece na mesa.
   *
   * Não deve chamar diretamente pagamento.
   */
  onConfirmarConsumos: () => void;
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

function contarComentarios(
  linha: ItemPedidoEditor,
): number {
  const comentariosLinha =
    linha.comentarios?.length ??
    0;

  if (
    linha.tipoItem !==
    "PROGRAMA"
  ) {
    return comentariosLinha;
  }

  const comentariosComponentes =
    linha.componentes.reduce(
      (
        total,
        componente,
      ) =>
        total +
        (
          componente.comentarios
            ?.length ?? 0
        ),
      0,
    );

  return (
    comentariosLinha +
    comentariosComponentes
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

export default function ResumoConsumos({
  linhas,
  aConfirmar = false,
  disabled = false,
  mensagem = "",
  mensagemErro = "",
  onAlterarQuantidade,
  onRemoverLinha,
  onEditarComentarios,
  onConfirmarConsumos,
}: ResumoConsumosProps) {
  /*
    O separador Consumo trabalha APENAS com linhas locais NOVAS.

    As linhas EXISTENTES pertencem funcionalmente à Conta e
    não são apresentadas aqui.
  */
  const consumosNovos =
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

  const totalQuantidade =
    useMemo(
      () =>
        consumosNovos.reduce(
          (
            total,
            linha,
          ) =>
            total +
            linha.quantidade,
          0,
        ),
      [
        consumosNovos,
      ],
    );

  const totalValor =
    useMemo(
      () =>
        consumosNovos.reduce(
          (
            total,
            linha,
          ) =>
            total +
            linha.valorTotal,
          0,
        ),
      [
        consumosNovos,
      ],
    );

  const temPrecosPendentes =
    useMemo(
      () =>
        consumosNovos.some(
          (linha) =>
            !linha.precoEncontrado ||
            linha.preco <= 0,
        ),
      [
        consumosNovos,
      ],
    );

  const podeConfirmar =
    consumosNovos.length >
      0 &&
    !temPrecosPendentes &&
    !aConfirmar &&
    !disabled;

  return (
    <section className="flex min-h-0 flex-col bg-slate-50">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">
              Consumo
            </p>

            <h2 className="mt-0.5 text-lg font-black tracking-tight text-slate-950">
              Novos consumos
            </h2>

            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Apenas artigos ainda
              não confirmados.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <strong className="block text-xl font-black tracking-tight text-slate-950">
              {formatarValor(
                totalValor,
              )}
            </strong>

            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {formatarQuantidade(
                totalQuantidade,
              )}{" "}
              {totalQuantidade === 1
                ? "item"
                : "itens"}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [touch-action:pan-y] [-webkit-overflow-scrolling:touch] sm:p-4">
        {consumosNovos.length ===
        0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
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
                  d="M12 5v14M5 12h14"
                />
              </svg>
            </span>

            <h3 className="mt-4 text-base font-black text-slate-950">
              Sem novos consumos
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500">
              Adicione produtos no
              catálogo. Os artigos
              pendentes aparecem aqui
              antes de serem
              confirmados.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {consumosNovos.map(
              (linha) => {
                const numeroComentarios =
                  contarComentarios(
                    linha,
                  );

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
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="p-3">
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

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500">
                            <span>
                              {formatarQuantidade(
                                linha.quantidade,
                              )}{" "}
                              ×{" "}
                              {formatarValor(
                                linha.preco,
                              )}
                            </span>

                            {numeroComentarios >
                              0 && (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="text-slate-300"
                                >
                                  ·
                                </span>

                                <span>
                                  {
                                    numeroComentarios
                                  }{" "}
                                  {numeroComentarios ===
                                  1
                                    ? "comentário"
                                    : "comentários"}
                                </span>
                              </>
                            )}
                          </div>

                          {!linha.precoEncontrado && (
                            <p className="mt-1 text-[11px] font-bold text-amber-700">
                              Preço por
                              resolver antes
                              da confirmação.
                            </p>
                          )}
                        </div>

                        <strong className="shrink-0 whitespace-nowrap text-base font-black text-slate-950">
                          {formatarValor(
                            linha.valorTotal,
                          )}
                        </strong>
                      </div>

                      {programa &&
                        componentesSelecionados.length >
                          0 && (
                          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
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

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() =>
                              onAlterarQuantidade(
                                linha.idLocal,
                                -1,
                              )
                            }
                            disabled={
                              disabled ||
                              aConfirmar
                            }
                            aria-label={`Diminuir quantidade de ${linha.descricao}`}
                            className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg text-lg font-black text-slate-600 transition hover:bg-white hover:text-slate-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            −
                          </button>

                          <span className="min-w-9 px-1 text-center text-sm font-black text-slate-950">
                            {formatarQuantidade(
                              linha.quantidade,
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              onAlterarQuantidade(
                                linha.idLocal,
                                1,
                              )
                            }
                            disabled={
                              disabled ||
                              aConfirmar
                            }
                            aria-label={`Aumentar quantidade de ${linha.descricao}`}
                            className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg text-lg font-black text-blue-700 transition hover:bg-blue-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {onEditarComentarios && (
                            <button
                              type="button"
                              onClick={() =>
                                onEditarComentarios(
                                  linha.idLocal,
                                )
                              }
                              disabled={
                                disabled ||
                                aConfirmar
                              }
                              title="Comentários"
                              aria-label={`Editar comentários de ${linha.descricao}`}
                              className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
                                  d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
                                />
                              </svg>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onRemoverLinha(
                                linha.idLocal,
                              )
                            }
                            disabled={
                              disabled ||
                              aConfirmar
                            }
                            title="Remover"
                            aria-label={`Remover ${linha.descricao}`}
                            className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
                                d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"
                              />
                            </svg>
                          </button>
                        </div>
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
        {mensagemErro && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            {mensagemErro}
          </div>
        )}

        {!mensagemErro &&
          mensagem && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              {mensagem}
            </div>
          )}

        {temPrecosPendentes && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="mt-0.5 h-4 w-4 shrink-0"
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

            <span>
              Existem consumos sem
              preço válido. Resolva
              os preços antes de
              confirmar.
            </span>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              A confirmar
            </p>

            <p className="mt-0.5 text-sm font-bold text-slate-600">
              {formatarQuantidade(
                totalQuantidade,
              )}{" "}
              {totalQuantidade === 1
                ? "consumo"
                : "consumos"}
            </p>
          </div>

          <strong className="text-2xl font-black tracking-tight text-slate-950">
            {formatarValor(
              totalValor,
            )}
          </strong>
        </div>

        <button
          type="button"
          onClick={
            onConfirmarConsumos
          }
          disabled={
            !podeConfirmar
          }
          className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {aConfirmar ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 animate-spin"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  d="M20 12a8 8 0 1 1-2.34-5.66"
                />
              </svg>

              A confirmar...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2.3"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5 12 4 4L19 6"
                />
              </svg>

              Confirmar consumos
            </>
          )}
        </button>
      </div>
    </section>
  );
}
