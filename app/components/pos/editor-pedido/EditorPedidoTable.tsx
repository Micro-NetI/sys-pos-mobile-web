//app\components\pos\editor-pedido\EditorPedidoTable.tsx
"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Table,
} from "@heroui/react";

import type {
  ItemPedidoEditor,
} from "@/types/editor-pedido";

interface EditorPedidoTableProps {
  linhas: ItemPedidoEditor[];

  idLinhaSelecionada:
    | string
    | null;

  idComponenteSelecionado:
    | string
    | null;

  modoMobile?: boolean;

  onSelecionarLinha: (
    idLinha: string,
  ) => void;

  onSelecionarComponente: (
    idLinha: string,
    idComponente: string,
  ) => void;

  onAlterarQuantidade: (
    idLinha: string,
    incremento: number,
  ) => void;

  onRemoverLinha: (
    idLinha: string,
  ) => void;
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

function obterEstadoLinha(
  linha: ItemPedidoEditor,
): {
  texto: string;
  classe: string;
} {
  if (linha.origem === "NOVA") {
    return {
      texto: "Novo",
      classe:
        "bg-emerald-100 text-emerald-700",
    };
  }

  if (linha.jaImpresso) {
    return {
      texto: "Pedido impresso",
      classe:
        "bg-amber-100 text-amber-800",
    };
  }

  return {
    texto: "Existente",
    classe:
      "bg-blue-100 text-blue-700",
  };
}

export default function EditorPedidoTable({
  linhas,
  idLinhaSelecionada,
  idComponenteSelecionado,
  modoMobile = false,
  onSelecionarLinha,
  onSelecionarComponente,
  onAlterarQuantidade,
  onRemoverLinha,
}: EditorPedidoTableProps) {
  const [
    programasExpandidos,
    setProgramasExpandidos,
  ] = useState<Set<string>>(
    () => new Set(),
  );

  const selectedKeys =
    useMemo(() => {
      if (!idLinhaSelecionada) {
        return new Set<string>();
      }

      return new Set([
        idLinhaSelecionada,
      ]);
    }, [
      idLinhaSelecionada,
    ]);

  function alternarPrograma(
    idLinha: string,
  ) {
    setProgramasExpandidos(
      (atuais) => {
        const novos =
          new Set(atuais);

        if (novos.has(idLinha)) {
          novos.delete(idLinha);
        } else {
          novos.add(idLinha);
        }

        return novos;
      },
    );
  }

  if (modoMobile) {
    if (linhas.length === 0) {
      return (
        <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 4h13"
              />
            </svg>
          </div>

          <p className="mt-3 text-sm font-black text-slate-800">
            Pedido vazio
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Feche o pedido e toque num produto
            para o adicionar.
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-full px-1 pb-3">
        <div className="space-y-2">
          {linhas.map((linha) => {
            const estado =
              obterEstadoLinha(linha);

            const linhaExistente =
              linha.origem ===
              "EXISTENTE";

            const programa =
              linha.tipoItem ===
              "PROGRAMA";

            const expandido =
              programa &&
              programasExpandidos.has(
                linha.idLocal,
              );

            const selecionada =
              idLinhaSelecionada ===
              linha.idLocal;

            return (
              <article
                key={linha.idLocal}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelecionarLinha(
                    linha.idLocal,
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();

                    onSelecionarLinha(
                      linha.idLocal,
                    );
                  }
                }}
                className={[
                  "rounded-2xl border bg-white p-3 shadow-sm transition",
                  selecionada
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-slate-200",
                ].join(" ")}
              >
                <div className="flex items-start gap-2">
                  {programa && (
                    <button
                      type="button"
                      aria-label={
                        expandido
                          ? "Recolher programa"
                          : "Expandir programa"
                      }
                      onClick={(event) => {
                        event.stopPropagation();

                        onSelecionarLinha(
                          linha.idLocal,
                        );

                        alternarPrograma(
                          linha.idLocal,
                        );
                      }}
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className={[
                          "h-4 w-4 transition-transform",
                          expandido
                            ? "rotate-90"
                            : "",
                        ].join(" ")}
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m9 18 6-6-6-6"
                        />
                      </svg>
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[14px] font-black leading-5 text-slate-950">
                          {linha.descricao}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={[
                              "rounded-md px-2 py-0.5 text-[9px] font-black",
                              estado.classe,
                            ].join(" ")}
                          >
                            {estado.texto}
                          </span>

                          {programa && (
                            <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[9px] font-black uppercase text-violet-700">
                              Programa
                            </span>
                          )}
                        </div>
                      </div>

                      <strong className="shrink-0 whitespace-nowrap text-[15px] font-black text-slate-950">
                        {linha.precoEncontrado
                          ? formatarValor(
                              linha.valorTotal,
                            )
                          : "—"}
                      </strong>
                    </div>

                    {linha.quantidade > 1 &&
                      linha.precoEncontrado && (
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          {formatarValor(
                            linha.preco,
                          )}{" "}
                          / un.
                        </p>
                      )}

                    {linha.comentarios.length >
                      0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {linha.comentarios
                          .slice(0, 2)
                          .map(
                            (comentario) => (
                              <span
                                key={`${linha.idLocal}-${comentario.idComentario}-${comentario.texto}`}
                                className="max-w-full truncate rounded-md bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700"
                              >
                                {
                                  comentario.texto
                                }
                              </span>
                            ),
                          )}

                        {linha.comentarios
                          .length > 2 && (
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                            +
                            {linha.comentarios
                              .length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {linha.observacao && (
                      <p className="mt-1.5 truncate text-[10px] font-medium text-slate-400">
                        {linha.observacao}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      {linhaExistente ? (
                        <div className="inline-flex h-9 items-center rounded-xl border border-blue-200 bg-blue-50 px-3">
                          <span className="text-[10px] font-bold uppercase text-blue-500">
                            Qtd.
                          </span>

                          <strong className="ml-2 text-sm font-black text-blue-800">
                            {linha.quantidade}
                          </strong>
                        </div>
                      ) : (
                        <div
                          className="inline-flex h-9 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelecionarLinha(
                                linha.idLocal,
                              );

                              onAlterarQuantidade(
                                linha.idLocal,
                                -1,
                              );
                            }}
                            aria-label={`Diminuir quantidade de ${linha.descricao}`}
                            className="flex h-full w-10 items-center justify-center text-lg font-black text-slate-500 active:bg-slate-200"
                          >
                            −
                          </button>

                          <span className="min-w-9 text-center text-sm font-black text-slate-900">
                            {linha.quantidade}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              onSelecionarLinha(
                                linha.idLocal,
                              );

                              onAlterarQuantidade(
                                linha.idLocal,
                                1,
                              );
                            }}
                            aria-label={`Aumentar quantidade de ${linha.descricao}`}
                            className="flex h-full w-10 items-center justify-center text-lg font-black text-blue-600 active:bg-blue-100"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {!linhaExistente && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            onRemoverLinha(
                              linha.idLocal,
                            );
                          }}
                          aria-label={`Remover ${linha.descricao}`}
                          title="Remover do pedido"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 active:bg-red-100"
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
                      )}
                    </div>

                    {programa &&
                      expandido && (
                        <div className="mt-3 space-y-1.5 border-l-2 border-violet-200 pl-2">
                          {linha.componentes
                            .filter(
                              (
                                componente,
                              ) =>
                                linha.tipoLancamento ===
                                  "TOTAL" ||
                                componente.selecionado,
                            )
                            .sort(
                              (
                                primeiro,
                                segundo,
                              ) =>
                                primeiro.ordem -
                                segundo.ordem,
                            )
                            .map(
                              (
                                componente,
                              ) => {
                                const componenteSelecionado =
                                  idComponenteSelecionado ===
                                  componente.idLocal;

                                return (
                                  <button
                                    key={
                                      componente.idLocal
                                    }
                                    type="button"
                                    onClick={(
                                      event,
                                    ) => {
                                      event.stopPropagation();

                                      onSelecionarComponente(
                                        linha.idLocal,
                                        componente.idLocal,
                                      );
                                    }}
                                    className={[
                                      "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition",
                                      componenteSelecionado
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-violet-100 bg-violet-50/50",
                                    ].join(
                                      " ",
                                    )}
                                  >
                                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-700">
                                      ↳{" "}
                                      {
                                        componente.descricao
                                      }
                                    </span>

                                    <span className="shrink-0 text-[10px] font-black text-slate-500">
                                      ×
                                      {
                                        componente.quantidade
                                      }
                                    </span>
                                  </button>
                                );
                              },
                            )}
                        </div>
                      )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Table
      variant="secondary"
      className="h-full min-h-0"
    >
      <Table.ScrollContainer className="h-full min-h-0 overflow-x-hidden overflow-y-auto">
        <Table.Content
          aria-label="Produtos do pedido"
          selectionMode="single"
          selectedKeys={
            selectedKeys
          }
          onSelectionChange={(
            keys,
          ) => {
            if (keys === "all") {
              return;
            }

            const primeiro =
              Array.from(keys)[0];

            if (
              primeiro ===
                undefined ||
              primeiro === null
            ) {
              return;
            }

            onSelecionarLinha(
              String(primeiro),
            );
          }}
          className="w-full table-fixed"
          style={{
            tableLayout: "fixed",
            width: "100%",
          }}
        >
          <Table.Header>
            <Table.Column
              id="produto"
              isRowHeader
              className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
            >
              Produto
            </Table.Column>

            <Table.Column
              id="quantidade"
              className="w-[72px] px-1 py-2 text-center text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 sm:w-[80px] sm:py-2.5 sm:text-[10px]"
            >
              Qtd.
            </Table.Column>

            <Table.Column
              id="total"
              className="w-[90px] px-1.5 py-2 text-right text-[9px] font-black uppercase tracking-[0.1em] text-slate-400 sm:w-[100px] sm:px-2 sm:py-2.5 sm:text-[10px]"
            >
              Total
            </Table.Column>
          </Table.Header>

          <Table.Body
            renderEmptyState={() => (
              <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2 4h13"
                    />
                  </svg>
                </div>

                <p className="mt-3 text-sm font-black text-slate-800">
                  Pedido vazio
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Toque num produto para
                  adicionar ao pedido.
                </p>
              </div>
            )}
          >
            {linhas.map((linha) => {
              const estado =
                obterEstadoLinha(
                  linha,
                );

              const linhaExistente =
                linha.origem ===
                "EXISTENTE";

              const programa =
                linha.tipoItem ===
                "PROGRAMA";

              const expandido =
                programa &&
                programasExpandidos.has(
                  linha.idLocal,
                );

              return (
                <Table.Row
                  key={linha.idLocal}
                  id={linha.idLocal}
                  className="cursor-pointer border-b border-slate-200 bg-white outline-none transition hover:bg-slate-50 data-[selected=true]:bg-blue-50"
                >
                  <Table.Cell className="max-w-0 overflow-hidden px-2 py-2 align-top sm:px-3 sm:py-2.5">
                    <div className="w-full min-w-0 overflow-hidden">
                      <div className="flex min-w-0 items-start gap-2">
                        {programa ? (
                          <button
                            type="button"
                            aria-label={
                              expandido
                                ? "Recolher programa"
                                : "Expandir programa"
                            }
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              onSelecionarLinha(
                                linha.idLocal,
                              );

                              alternarPrograma(
                                linha.idLocal,
                              );
                            }}
                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className={[
                                "h-4 w-4 transition-transform",
                                expandido
                                  ? "rotate-90"
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
                                d="m9 18 6-6-6-6"
                              />
                            </svg>
                          </button>
                        ) : (
                          <span className="w-6 shrink-0" />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-start gap-1.5">
                            <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-900">
                              {
                                linha.descricao
                              }
                            </span>

                            {programa && (
                              <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-violet-700">
                                Programa
                              </span>
                            )}

                            {!linhaExistente && (
                              <button
                                type="button"
                                onClick={(
                                  event,
                                ) => {
                                  event.stopPropagation();

                                  onRemoverLinha(
                                    linha.idLocal,
                                  );
                                }}
                                aria-label={`Remover ${linha.descricao}`}
                                title="Remover do pedido"
                                className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="h-3.5 w-3.5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18 18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                              className={[
                                "rounded-md px-1.5 py-0.5 text-[9px] font-bold",
                                estado.classe,
                              ].join(
                                " ",
                              )}
                            >
                              {
                                estado.texto
                              }
                            </span>

                            <span className="text-[10px] font-semibold text-slate-400">
                              {linha.precoVariavel
                                ? "Preço variável"
                                : !linha.precoEncontrado
                                  ? "Preço por carregar"
                                  : linha.quantidade > 1
                                    ? `${formatarValor(
                                        linha.preco,
                                      )} / un.`
                                    : null}
                            </span>
                          </div>

                          {linha.comentarios
                            .length >
                            0 && (
                            <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                              {linha.comentarios
                                .slice(
                                  0,
                                  2,
                                )
                                .map(
                                  (
                                    comentario,
                                  ) => (
                                    <span
                                      key={`${linha.idLocal}-${comentario.idComentario}-${comentario.texto}`}
                                      className="max-w-full truncate rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
                                    >
                                      {
                                        comentario.texto
                                      }
                                    </span>
                                  ),
                                )}

                              {linha
                                .comentarios
                                .length >
                                2 && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                                  +
                                  {linha
                                    .comentarios
                                    .length -
                                    2}
                                </span>
                              )}
                            </div>
                          )}

                          {linha.observacao && (
                            <p className="mt-1.5 truncate text-[10px] font-medium text-slate-400">
                              {
                                linha.observacao
                              }
                            </p>
                          )}

                          {programa &&
                            expandido && (
                              <div className="mt-2 w-full min-w-0 space-y-1 overflow-hidden border-l-2 border-violet-200 pl-2">
                                {linha.componentes
                                  .filter(
                                    (
                                      componente,
                                    ) =>
                                      linha.tipoLancamento ===
                                        "TOTAL" ||
                                      componente.selecionado,
                                  )
                                  .sort(
                                    (
                                      primeiro,
                                      segundo,
                                    ) =>
                                      primeiro.ordem -
                                      segundo.ordem,
                                  )
                                  .map(
                                    (
                                      componente,
                                    ) => {
                                      const selecionado =
                                        idComponenteSelecionado ===
                                        componente.idLocal;

                                      return (
                                        <button
                                          key={
                                            componente.idLocal
                                          }
                                          type="button"
                                          onClick={(
                                            event,
                                          ) => {
                                            event.stopPropagation();

                                            onSelecionarComponente(
                                              linha.idLocal,
                                              componente.idLocal,
                                            );
                                          }}
                                          className={[
                                            "block w-full min-w-0 overflow-hidden rounded-lg border px-2 py-1.5 text-left transition",
                                            selecionado
                                              ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                                              : "border-transparent hover:border-violet-200 hover:bg-violet-50",
                                          ].join(
                                            " ",
                                          )}
                                        >
                                          <div className="flex min-w-0 items-center justify-between gap-2 overflow-hidden">
                                            <span className="block min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-700">
                                              ↳{" "}
                                              {
                                                componente.descricao
                                              }
                                            </span>

                                            <span className="shrink-0 text-[10px] font-black text-slate-400">
                                              ×
                                              {
                                                componente.quantidade
                                              }
                                            </span>
                                          </div>

                                          {componente
                                            .comentarios
                                            .length >
                                            0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                              {componente.comentarios
                                                .slice(
                                                  0,
                                                  2,
                                                )
                                                .map(
                                                  (
                                                    comentario,
                                                  ) => (
                                                    <span
                                                      key={`${componente.idLocal}-${comentario.idComentario}-${comentario.texto}`}
                                                      className="max-w-full truncate rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700"
                                                    >
                                                      {
                                                        comentario.texto
                                                      }
                                                    </span>
                                                  ),
                                                )}

                                              {componente
                                                .comentarios
                                                .length >
                                                2 && (
                                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                                                  +
                                                  {componente
                                                    .comentarios
                                                    .length -
                                                    2}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </button>
                                      );
                                    },
                                  )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </Table.Cell>

                  <Table.Cell className="overflow-hidden px-0.5 py-2 text-center align-top sm:px-1 sm:py-2.5">
                    {linhaExistente ? (
                      <span className="inline-flex min-w-7 justify-center rounded-lg border border-blue-200 bg-white px-1.5 py-1 text-xs font-black text-blue-700">
                        {
                          linha.quantidade
                        }
                      </span>
                    ) : (
                      <div
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white"
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation();
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelecionarLinha(
                              linha.idLocal,
                            );

                            onAlterarQuantidade(
                              linha.idLocal,
                              -1,
                            );
                          }}
                          aria-label={`Diminuir quantidade de ${linha.descricao}`}
                          className="flex h-7 w-5 items-center justify-center rounded-l-lg text-sm font-black text-slate-500 transition hover:bg-slate-100 sm:w-6"
                        >
                          −
                        </button>

                        <span className="min-w-5 text-center text-xs font-black text-slate-700 sm:min-w-6">
                          {
                            linha.quantidade
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            onSelecionarLinha(
                              linha.idLocal,
                            );

                            onAlterarQuantidade(
                              linha.idLocal,
                              1,
                            );
                          }}
                          aria-label={`Aumentar quantidade de ${linha.descricao}`}
                          className="flex h-7 w-5 items-center justify-center rounded-r-lg text-sm font-black text-slate-500 transition hover:bg-slate-100 sm:w-6"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </Table.Cell>

                  <Table.Cell className="overflow-hidden px-1.5 py-2 text-right align-top sm:px-2 sm:py-2.5">
                    <strong className="block min-w-0 whitespace-nowrap pt-1 text-[13px] font-black text-slate-950 sm:text-sm">
                      {linha.precoEncontrado
                        ? formatarValor(
                            linha.valorTotal,
                          )
                        : "—"}
                    </strong>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
