//app\components\pos\cozinha\PedidoCozinhaCard.tsx
"use client";

import type {
  POSMobilePedidoCozinha,
} from "@/types/pedidos-cozinha";

interface PedidoCozinhaCardProps {
  pedido: POSMobilePedidoCozinha;
}

function formatarQuantidade(
  quantidade: number,
) {
  if (
    Number.isInteger(
      quantidade,
    )
  ) {
    return String(
      quantidade,
    );
  }

  return quantidade
    .toFixed(3)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

function classeTempo(
  minutos: number,
) {
  if (minutos >= 20) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (minutos >= 10) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function PedidoCozinhaCard({
  pedido,
}: PedidoCozinhaCardProps) {
  const grupos =
    pedido.linhas.reduce<
      Record<
        string,
        typeof pedido.linhas
      >
    >(
      (
        acumulador,
        linha,
      ) => {
        const grupo =
          linha.grupoPreparacao.trim() ||
          "Sem grupo";

        if (
          !acumulador[
            grupo
          ]
        ) {
          acumulador[
            grupo
          ] = [];
        }

        acumulador[
          grupo
        ].push(
          linha,
        );

        return acumulador;
      },
      {},
    );

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-black text-slate-950">
                {pedido.mesa ||
                  `Pedido ${
                    pedido.printCode ||
                    pedido.idPedido
                  }`}
              </h2>

              {pedido.printCode && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
                  #
                  {
                    pedido.printCode
                  }
                </span>
              )}
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {[
                pedido.posto,
                pedido.sala,
                pedido.descricaoZona,
              ]
                .filter(
                  Boolean,
                )
                .join(
                  " · ",
                )}
            </p>
          </div>

          <span
            className={[
              "shrink-0 rounded-xl border px-3 py-2 text-xs font-black",
              classeTempo(
                pedido.minutosEspera,
              ),
            ].join(
              " ",
            )}
          >
            {
              pedido.minutosEspera
            }{" "}
            min
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl bg-white px-3 py-2">
            <p className="font-semibold text-slate-400">
              Hora
            </p>

            <p className="mt-0.5 font-black text-slate-700">
              {pedido.horaPedido ||
                "--:--"}
            </p>
          </div>

          <div className="rounded-xl bg-white px-3 py-2">
            <p className="font-semibold text-slate-400">
              Conta
            </p>

            <p className="mt-0.5 font-black text-slate-700">
              {pedido.idConta ||
                "-"}
            </p>
          </div>

          <div className="rounded-xl bg-white px-3 py-2">
            <p className="font-semibold text-slate-400">
              Pax
            </p>

            <p className="mt-0.5 font-black text-slate-700">
              {pedido.pax ||
                0}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-5">
        {Object.entries(
          grupos,
        ).map(
          ([
            grupo,
            linhas,
          ]) => (
            <section
              key={
                grupo
              }
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-100" />

                <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {
                    grupo
                  }
                </h3>

                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-2">
                {linhas.map(
                  (
                    linha,
                    indiceLinha,
                  ) => (
                    <div
                      key={`${pedido.idInterno}-${grupo}-${linha.idLinha}-${indiceLinha}`}
                      className={[
                        "rounded-2xl border px-3.5 py-3",
                        linha.anulado
                          ? "border-red-100 bg-red-50/70"
                          : "border-slate-100 bg-slate-50/60",
                      ].join(
                        " ",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={[
                              "text-sm font-extrabold text-slate-800",
                              linha.anulado
                                ? "line-through opacity-60"
                                : "",
                            ].join(
                              " ",
                            )}
                          >
                            <span className="mr-2 text-violet-700">
                              {formatarQuantidade(
                                linha.quantidade,
                              )}
                              ×
                            </span>

                            {
                              linha.descricaoProduto
                            }
                          </p>

                          {linha.comentario && (
                            <p className="mt-1 text-xs font-semibold italic text-slate-500">
                              {
                                linha.comentario
                              }
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {linha.segue && (
                            <span className="rounded-full bg-violet-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-violet-700">
                              Segue
                            </span>
                          )}

                          <span
                            title="Valor bruto de EstadoLinha devolvido pela APIFNT"
                            className="rounded-full bg-slate-200 px-2 py-1 text-[9px] font-black text-slate-600"
                          >
                            Estado{" "}
                            {
                              linha.estadoLinha
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          ),
        )}

        {pedido.linhas.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-400">
            Pedido sem linhas.
          </div>
        )}
      </div>
    </article>
  );
}