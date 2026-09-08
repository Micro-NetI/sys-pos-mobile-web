//app\pos\cozinha\page.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


import PedidoCozinhaCard from "@/app/components/pos/cozinha/PedidoCozinhaCard";

import type {
  POSMobileMonitorPedidosDados,
  POSMobileMonitorPedidosResposta,
} from "@/types/pedidos-cozinha";

const INTERVALO_ATUALIZACAO_MS =
  5000;

function obterAccessToken(): string {
  if (
    typeof window ===
    "undefined"
  ) {
    return "";
  }

  return (
    window.sessionStorage.getItem(
      "posMobileAccessToken",
    ) ?? ""
  ).trim();
}
export default function CozinhaPage() {
  const router =
    useRouter();

  const [
    dados,
    setDados,
  ] =
    useState<POSMobileMonitorPedidosDados | null>(
      null,
    );

  const [
    idCategoriaPedido,
    setIDCategoriaPedido,
  ] =
    useState(0);

  const [
    aCarregar,
    setACarregar,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    ultimaAtualizacaoLocal,
    setUltimaAtualizacaoLocal,
  ] =
    useState("");

  const carregamentoEmCurso =
    useRef(false);

  const carregarPedidos =
    useCallback(
      async (
        categoria:
          number,
        mostrarLoading:
          boolean = false,
      ) => {
        if (
          carregamentoEmCurso.current
        ) {
          return;
        }

        const accessToken =
          obterAccessToken();

        if (!accessToken) {
          router.replace(
            "/login",
          );

          return;
        }

        carregamentoEmCurso.current =
          true;

        if (
          mostrarLoading
        ) {
          setACarregar(
            true,
          );
        }

        try {
          const response =
            await fetch(
              "/api/pos-mobile/monitor-pedidos",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                cache:
                  "no-store",

                body:
                  JSON.stringify(
                    {
                      accessToken,
                      idCategoriaPedido:
                        categoria,
                    },
                  ),
              },
            );

          const resultado =
            (await response.json()) as
              POSMobileMonitorPedidosResposta;

          if (
            response.status ===
              401 ||
            resultado.codigo ===
              "SESSAO_INVALIDA"
          ) {
            window.sessionStorage.clear();

            router.replace(
              "/login",
            );

            return;
          }

          if (
            !response.ok ||
            !resultado.sucesso ||
            !resultado.dados
          ) {
            throw new Error(
              resultado.mensagem ||
                "Não foi possível carregar os pedidos de cozinha.",
            );
          }

          setDados(
            resultado.dados,
          );

          setErro("");

          setUltimaAtualizacaoLocal(
            new Date().toLocaleTimeString(
              "pt-PT",
              {
                hour:
                  "2-digit",
                minute:
                  "2-digit",
                second:
                  "2-digit",
              },
            ),
          );
        } catch (error) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os pedidos de cozinha.",
          );
        } finally {
          carregamentoEmCurso.current =
            false;

          setACarregar(
            false,
          );
        }
      },
      [
        router,
      ],
    );

  useEffect(() => {
    void carregarPedidos(
      idCategoriaPedido,
      true,
    );
  }, [
    carregarPedidos,
    idCategoriaPedido,
  ]);

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          void carregarPedidos(
            idCategoriaPedido,
            false,
          );
        },
        INTERVALO_ATUALIZACAO_MS,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    carregarPedidos,
    idCategoriaPedido,
  ]);

  const totalCategoriaSelecionada =
    useMemo(
      () => {
        if (
          idCategoriaPedido ===
          0
        ) {
          return (
            dados?.totalPedidos ??
            0
          );
        }

        return (
          dados?.categorias.find(
            (
              categoria,
            ) =>
              categoria.idCategoriaPedido ===
              idCategoriaPedido,
          )?.totalPedidos ??
          0
        );
      },
      [
        dados,
        idCategoriaPedido,
      ],
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                SysPOS Mobile
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-slate-950">
                  Pedidos de cozinha
                </h1>

                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                  {
                    totalCategoriaSelecionada
                  }{" "}
                  pedido(s)
                </span>
              </div>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Atualização automática a cada 5 segundos
                {ultimaAtualizacaoLocal
                  ? ` · Última atualização ${ultimaAtualizacaoLocal}`
                  : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void carregarPedidos(
                    idCategoriaPedido,
                    true,
                  )
                }
                disabled={
                  aCarregar
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                {aCarregar
                  ? "A atualizar..."
                  : "Atualizar"}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/pos",
                  )
                }
                className="h-11 rounded-xl bg-slate-900 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
              >
                Mesas
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() =>
                setIDCategoriaPedido(
                  0,
                )
              }
              className={[
                "shrink-0 rounded-xl border px-4 py-2.5 text-xs font-black transition",
                idCategoriaPedido ===
                  0
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              Todos{" "}
              <span className="ml-1 opacity-80">
                {dados?.totalPedidos ??
                  0}
              </span>
            </button>

            {dados?.categorias.map(
              (
                categoria,
              ) => (
                <button
                  key={
                    categoria.idCategoriaPedido
                  }
                  type="button"
                  onClick={() =>
                    setIDCategoriaPedido(
                      categoria.idCategoriaPedido,
                    )
                  }
                  className={[
                    "shrink-0 rounded-xl border px-4 py-2.5 text-xs font-black transition",
                    idCategoriaPedido ===
                    categoria.idCategoriaPedido
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(
                    " ",
                  )}
                >
                  {
                    categoria.descricao
                  }{" "}
                  <span className="ml-1 opacity-80">
                    {
                      categoria.totalPedidos
                    }
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {erro}
          </div>
        )}

        {aCarregar &&
        !dados ? (
          <div className="grid min-h-[420px] place-items-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

              <p className="mt-4 text-sm font-bold text-slate-500">
                A carregar pedidos...
              </p>
            </div>
          </div>
        ) : dados &&
          dados.pedidos.length >
            0 ? (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {dados.pedidos.map(
              (
                pedido,
              ) => (
                <PedidoCozinhaCard
                  key={
                    pedido.idInterno
                  }
                  pedido={
                    pedido
                  }
                />
              ),
            )}
          </div>
        ) : (
          <div className="grid min-h-[420px] place-items-center">
            <div className="max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-2xl">
                ✓
              </div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                Sem pedidos pendentes
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                Não existem pedidos de cozinha pendentes nesta categoria.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
