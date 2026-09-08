//app\components\pos\programas\ProgramaParcialModal.tsx
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ProgramaLinhaPedido,
  ProgramaNivel,
  ProgramaProduto,
  ProgramaResultado,
} from "@/types/programas";

type EstadoProduto = {
  selecionado: boolean;
  quantidade: number;
};

type ProgramaParcialModalProps = {
  aberto: boolean;
  programa: ProgramaResultado | null;

  aConfirmar?: boolean;

  onFechar: () => void;

  onConfirmar: (
    linhas: ProgramaLinhaPedido[],
  ) => void | Promise<void>;
};

function normalizarQuantidadeInicial(
  produto: ProgramaProduto,
): number {
  const candidatos = [
    produto.quantidadeSelecionada,
    produto.quantidadePredefinida,
    produto.quantidade,
    produto.quantidadeBase,
    1,
  ];

  const quantidade =
    candidatos.find(
      (valor) =>
        typeof valor === "number" &&
        Number.isFinite(valor) &&
        valor > 0,
    ) ?? 1;

  return quantidade;
}

function criarEstadoInicial(
  programa: ProgramaResultado,
): Record<number, EstadoProduto> {
  const estado:
    Record<number, EstadoProduto> = {};

  for (const produto of programa.produtos) {
    if (
      produto.idProduto === null ||
      produto.idProduto <= 0
    ) {
      continue;
    }

    const selecionado =
      produto.produtoFixo ||
      produto.selecionado ||
      produto.predefinido;

    estado[produto.idProduto] = {
      selecionado,
      quantidade:
        selecionado
          ? normalizarQuantidadeInicial(
              produto,
            )
          : 0,
    };
  }

  return estado;
}

function formatarQuantidade(
  valor: number,
): string {
  return Number.isInteger(valor)
    ? String(valor)
    : valor.toFixed(2);
}

function obterDescricaoNivel(
  nivel: ProgramaNivel,
): string {
  return (
    nivel.descricao?.trim() ||
    `Nível ${nivel.idNivel ?? ""}`.trim()
  );
}

export default function ProgramaParcialModal({
  aberto,
  programa,
  aConfirmar = false,
  onFechar,
  onConfirmar,
}: ProgramaParcialModalProps) {
  const [
    estadoProdutos,
    setEstadoProdutos,
  ] = useState<
    Record<number, EstadoProduto>
  >({});

  const [
    mensagemErro,
    setMensagemErro,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!aberto || !programa) {
      return;
    }

    setEstadoProdutos(
      criarEstadoInicial(
        programa,
      ),
    );

    setMensagemErro(
      null,
    );
  }, [
    aberto,
    programa,
  ]);

  const produtosValidos =
    useMemo(
      () =>
        programa?.produtos.filter(
          (produto) =>
            produto.idProduto !== null &&
            produto.idProduto > 0,
        ) ?? [],
      [
        programa,
      ],
    );

  const produtosPorNivel =
    useMemo(() => {
      const mapa =
        new Map<
          number,
          ProgramaProduto[]
        >();

      for (
        const produto of
        produtosValidos
      ) {
        const idNivel =
          produto.idNivel ?? 0;

        const lista =
          mapa.get(
            idNivel,
          ) ?? [];

        lista.push(
          produto,
        );

        mapa.set(
          idNivel,
          lista,
        );
      }

      for (
        const lista of
        mapa.values()
      ) {
        lista.sort(
          (a, b) =>
            a.ordem - b.ordem ||
            (
              a.descricao ?? ""
            ).localeCompare(
              b.descricao ?? "",
              "pt-PT",
            ),
        );
      }

      return mapa;
    }, [
      produtosValidos,
    ]);

  const totaisPorNivel =
    useMemo(() => {
      const mapa =
        new Map<
          number,
          number
        >();

      for (
        const produto of
        produtosValidos
      ) {
        if (
          produto.idProduto === null
        ) {
          continue;
        }

        const estado =
          estadoProdutos[
            produto.idProduto
          ];

        if (
          !estado?.selecionado
        ) {
          continue;
        }

        const idNivel =
          produto.idNivel ?? 0;

        mapa.set(
          idNivel,
          (
            mapa.get(
              idNivel,
            ) ?? 0
          ) +
            estado.quantidade,
        );
      }

      return mapa;
    }, [
      estadoProdutos,
      produtosValidos,
    ]);

  const quantidadeTotalSelecionada =
    useMemo(
      () =>
        Object.values(
          estadoProdutos,
        ).reduce(
          (
            total,
            estado,
          ) =>
            estado.selecionado
              ? total +
                estado.quantidade
              : total,
          0,
        ),
      [
        estadoProdutos,
      ],
    );

  const numeroProdutosSelecionados =
    useMemo(
      () =>
        Object.values(
          estadoProdutos,
        ).filter(
          (estado) =>
            estado.selecionado,
        ).length,
      [
        estadoProdutos,
      ],
    );

  function alterarSelecao(
    produto: ProgramaProduto,
  ) {
    if (
      produto.idProduto === null ||
      produto.idProduto <= 0 ||
      produto.produtoFixo ||
      !produto.disponivel
    ) {
      return;
    }

    setMensagemErro(
      null,
    );

    setEstadoProdutos(
      (estadoAtual) => {
        const estado =
          estadoAtual[
            produto.idProduto!
          ] ?? {
            selecionado: false,
            quantidade: 0,
          };

        const vaiSelecionar =
          !estado.selecionado;

        return {
          ...estadoAtual,

          [produto.idProduto!]: {
            selecionado:
              vaiSelecionar,

            quantidade:
              vaiSelecionar
                ? Math.max(
                    estado.quantidade,
                    normalizarQuantidadeInicial(
                      produto,
                    ),
                  )
                : 0,
          },
        };
      },
    );
  }

  function alterarQuantidade(
    produto: ProgramaProduto,
    incremento: number,
  ) {
    if (
      produto.idProduto === null ||
      produto.idProduto <= 0
    ) {
      return;
    }

    setMensagemErro(
      null,
    );

    setEstadoProdutos(
      (estadoAtual) => {
        const estado =
          estadoAtual[
            produto.idProduto!
          ] ?? {
            selecionado: false,
            quantidade: 0,
          };

        const quantidadeAtual =
          estado.quantidade > 0
            ? estado.quantidade
            : normalizarQuantidadeInicial(
                produto,
              );

        const novaQuantidade =
          Math.max(
            produto.produtoFixo
              ? normalizarQuantidadeInicial(
                  produto,
                )
              : 1,
            quantidadeAtual +
              incremento,
          );

        return {
          ...estadoAtual,

          [produto.idProduto!]: {
            selecionado:
              true,

            quantidade:
              novaQuantidade,
          },
        };
      },
    );
  }

  function validarSelecao():
    | string
    | null {
    if (!programa) {
      return (
        "A configuração do programa não está disponível."
      );
    }

    if (
      programa.obrigaSelecao &&
      numeroProdutosSelecionados ===
        0
    ) {
      return (
        "Selecione pelo menos um produto."
      );
    }

    for (
      const produto of
      produtosValidos
    ) {
      if (
        produto.idProduto === null
      ) {
        continue;
      }

      const estado =
        estadoProdutos[
          produto.idProduto
        ];

      if (
        produto.produtoFixo &&
        !estado?.selecionado
      ) {
        return (
          `O produto "${produto.descricao ?? produto.idProduto}" é obrigatório.`
        );
      }

      if (
        estado?.selecionado &&
        (
          !Number.isFinite(
            estado.quantidade,
          ) ||
          estado.quantidade <= 0
        )
      ) {
        return (
          `A quantidade do produto "${produto.descricao ?? produto.idProduto}" é inválida.`
        );
      }
    }

    if (
      programa.trabalhaComNiveis
    ) {
      for (
        const nivel of
        programa.niveis
      ) {
        const idNivel =
          nivel.idNivel ?? 0;

        const quantidade =
          totaisPorNivel.get(
            idNivel,
          ) ?? 0;

        if (
          nivel.quantidadeMinima >
            0 &&
          quantidade <
            nivel.quantidadeMinima
        ) {
          return (
            `No nível "${obterDescricaoNivel(nivel)}" deve selecionar pelo menos ${formatarQuantidade(nivel.quantidadeMinima)} unidade(s).`
          );
        }

        if (
          nivel.quantidadePermitida >
            0 &&
          quantidade >
            nivel.quantidadePermitida
        ) {
          return (
            `No nível "${obterDescricaoNivel(nivel)}" só pode selecionar ${formatarQuantidade(nivel.quantidadePermitida)} unidade(s).`
          );
        }
      }
    }

    if (
      programa.quantidadeTotalPermitida >
        0 &&
      quantidadeTotalSelecionada >
        programa.quantidadeTotalPermitida
    ) {
      return (
        `Só pode selecionar ${formatarQuantidade(programa.quantidadeTotalPermitida)} unidade(s) no total.`
      );
    }

    if (
      programa.maximoProdutosDiferentes >
        0 &&
      numeroProdutosSelecionados >
        programa.maximoProdutosDiferentes
    ) {
      return (
        `Só pode selecionar ${programa.maximoProdutosDiferentes} produto(s) diferente(s).`
      );
    }

    return null;
  }

  function construirLinhas():
    ProgramaLinhaPedido[] {
    if (!programa) {
      return [];
    }

    return produtosValidos
      .filter(
        (produto) => {
          if (
            produto.idProduto === null
          ) {
            return false;
          }

          return Boolean(
            estadoProdutos[
              produto.idProduto
            ]?.selecionado,
          );
        },
      )
      .map(
        (
          produto,
        ): ProgramaLinhaPedido => {
          const idProduto =
            produto.idProduto!;

          const estado =
            estadoProdutos[
              idProduto
            ];

          return {
            idProduto,

            idNivel:
              produto.idNivel,

            idGrupoMenu:
              produto.idGrupoMenu,

            idGrupoPreparacao:
              produto.idGrupoPreparacao,

            quantidade:
              estado.quantidade,

            valorUnitario:
              produto.valorUnitario,

            valorFixo:
              produto.valorFixo,

            produtoFixo:
              produto.produtoFixo,

            produtoSemEscolha:
              produto.produtoSemEscolha,

                comentarios: [],
          };
        },
      );
  }

  async function confirmar() {
    const erro =
      validarSelecao();

    if (erro) {
      setMensagemErro(
        erro,
      );

      return;
    }

    setMensagemErro(
      null,
    );

    try {
      await onConfirmar(
        construirLinhas(),
      );
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar o programa.",
      );
    }
  }

  if (
    !aberto ||
    !programa
  ) {
    return null;
  }

  const niveisOrdenados =
    [...programa.niveis].sort(
      (a, b) =>
        a.ordem - b.ordem ||
        (
          a.descricao ?? ""
        ).localeCompare(
          b.descricao ?? "",
          "pt-PT",
        ),
    );

  const produtosSemNivel =
    produtosPorNivel.get(
      0,
    ) ?? [];

  function renderProduto(
    produto: ProgramaProduto,
  ) {
    if (
      produto.idProduto === null
    ) {
      return null;
    }

    const estado =
      estadoProdutos[
        produto.idProduto
      ] ?? {
        selecionado: false,
        quantidade: 0,
      };

    const desativado =
      !produto.disponivel ||
      aConfirmar;

    return (
      <div
        key={
          produto.idProduto
        }
        className={[
          "rounded-xl border p-3 transition",
          estado.selecionado
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 bg-white",
          !produto.disponivel
            ? "opacity-50"
            : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            disabled={
              desativado ||
              produto.produtoFixo
            }
            onClick={() =>
              alterarSelecao(
                produto,
              )
            }
            className={[
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold",
              estado.selecionado
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-transparent",
              produto.produtoFixo
                ? "cursor-not-allowed"
                : "",
            ].join(" ")}
            aria-label={
              estado.selecionado
                ? "Remover produto"
                : "Selecionar produto"
            }
          >
            ✓
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm text-slate-900">
                {produto.descricao ??
                  `Produto ${produto.idProduto}`}
              </strong>

              {produto.produtoFixo ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  Obrigatório
                </span>
              ) : null}

              {produto.predefinido ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Predefinido
                </span>
              ) : null}

              {!produto.disponivel ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  Indisponível
                </span>
              ) : null}
            </div>

            {estado.selecionado ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    desativado ||
                    (
                      produto.produtoFixo &&
                      estado.quantidade <=
                        normalizarQuantidadeInicial(
                          produto,
                        )
                    ) ||
                    (
                      !produto.produtoFixo &&
                      estado.quantidade <= 1
                    )
                  }
                  onClick={() =>
                    alterarQuantidade(
                      produto,
                      -1,
                    )
                  }
                  className="h-8 w-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>

                <span className="min-w-12 text-center text-sm font-bold text-slate-900">
                  {formatarQuantidade(
                    estado.quantidade,
                  )}
                </span>

                <button
                  type="button"
                  disabled={
                    desativado
                  }
                  onClick={() =>
                    alterarQuantidade(
                      produto,
                      1,
                    )
                  }
                  className="h-8 w-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="programa-parcial-titulo"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="programa-parcial-titulo"
                className="text-lg font-bold text-slate-900"
              >
                {programa.descricao ??
                  "Configurar programa"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Selecione os produtos e respetivas quantidades.
              </p>
            </div>

            <button
              type="button"
              disabled={
                aConfirmar
              }
              onClick={
                onFechar
              }
              className="rounded-lg px-3 py-1.5 text-xl leading-none text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {programa.trabalhaComNiveis ? (
            <div className="space-y-5">
              {niveisOrdenados.map(
                (nivel) => {
                  const idNivel =
                    nivel.idNivel ?? 0;

                  const produtos =
                    produtosPorNivel.get(
                      idNivel,
                    ) ?? [];

                  const quantidadeSelecionada =
                    totaisPorNivel.get(
                      idNivel,
                    ) ?? 0;

                  return (
                    <section
                      key={
                        idNivel
                      }
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-800">
                          {obterDescricaoNivel(
                            nivel,
                          )}
                        </h3>

                        <span className="text-sm font-semibold text-slate-600">
                          {formatarQuantidade(
                            quantidadeSelecionada,
                          )}
                          {" / "}
                          {nivel.quantidadePermitida >
                          0
                            ? formatarQuantidade(
                                nivel.quantidadePermitida,
                              )
                            : "sem limite"}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {produtos.map(
                          renderProduto,
                        )}
                      </div>
                    </section>
                  );
                },
              )}

              {produtosSemNivel.length >
              0 ? (
                <section>
                  <h3 className="mb-2 font-bold text-slate-800">
                    Outras opções
                  </h3>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {produtosSemNivel.map(
                      renderProduto,
                    )}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {produtosValidos.map(
                renderProduto,
              )}
            </div>
          )}

          {mensagemErro ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {mensagemErro}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-5 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              Produtos selecionados:{" "}
              <strong>
                {numeroProdutosSelecionados}
              </strong>
            </span>

            <span>
              Quantidade total:{" "}
              <strong>
                {formatarQuantidade(
                  quantidadeTotalSelecionada,
                )}
              </strong>

              {programa.quantidadeTotalPermitida >
              0
                ? ` / ${formatarQuantidade(
                    programa.quantidadeTotalPermitida,
                  )}`
                : ""}
            </span>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={
                aConfirmar
              }
              onClick={
                onFechar
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                aConfirmar
              }
              onClick={
                confirmar
              }
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aConfirmar
                ? "A adicionar..."
                : "Adicionar programa"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}