"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  POSMobileGrupoLink,
  POSMobileGrupoLinkBotao,
  POSMobileGrupoLinkResposta,
} from "@/types/pos-mobile-grupo-link";

interface Props {
  aberto: boolean;
  idGrupo: number | null;
  idSala: number | null;

  onFechar: () => void;

  onSelecionarProduto: (
    botao: POSMobileGrupoLinkBotao,
  ) => void;
}

export default function GrupoLinkModal({
  aberto,
  idGrupo,
  idSala,
  onFechar,
  onSelecionarProduto,
}: Props) {
  const [
    grupo,
    setGrupo,
  ] = useState<POSMobileGrupoLink | null>(
    null,
  );

  const [
    indicePagina,
    setIndicePagina,
  ] = useState(0);

  const [
    aCarregar,
    setACarregar,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  useEffect(() => {
    if (
      !aberto ||
      !idGrupo ||
      idGrupo <= 0 ||
      !idSala ||
      idSala <= 0
    ) {
      return;
    }

    let cancelado = false;

    async function carregar() {
      setACarregar(true);
      setErro("");
      setGrupo(null);
      setIndicePagina(0);

      try {
        const accessToken =
          sessionStorage.getItem(
            "posMobileAccessToken",
          );

        if (!accessToken) {
          throw new Error(
            "A sessão do POS Mobile não está disponível.",
          );
        }

        const response =
          await fetch(
            "/api/pos-mobile/grupo-link",
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
                idSala,
                idGrupo,
              }),
            },
          );

        const resultado =
          (await response.json()) as
            POSMobileGrupoLinkResposta;

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível carregar o grupo.",
          );
        }

        if (cancelado) {
          return;
        }

        setGrupo(
          resultado.dados,
        );
      } catch (error) {
        if (cancelado) {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao carregar o grupo.",
        );
      } finally {
        if (!cancelado) {
          setACarregar(false);
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [
    aberto,
    idGrupo,
    idSala,
  ]);

  const paginaAtual =
    useMemo(() => {
      if (!grupo) {
        return null;
      }

      return (
        grupo.paginas[
          indicePagina
        ] ?? null
      );
    }, [
      grupo,
      indicePagina,
    ]);

  if (!aberto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
              Grupo de produtos
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              {grupo?.descricao ??
                "Produtos"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        {aCarregar ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />

              <p className="mt-4 font-bold text-slate-600">
                A carregar produtos...
              </p>
            </div>
          </div>
        ) : erro ? (
          <div className="p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {erro}
            </div>
          </div>
        ) : grupo ? (
          <>
            {grupo.paginas.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 p-3">
                {grupo.paginas.map(
                  (pagina, indice) => (
                    <button
                      key={`${pagina.indice}-${indice}`}
                      type="button"
                      onClick={() =>
                        setIndicePagina(
                          indice,
                        )
                      }
                      className={[
                        "rounded-xl px-4 py-2 text-xs font-black",
                        indicePagina ===
                        indice
                          ? "bg-violet-600 text-white"
                          : "border border-slate-200 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      {pagina.descricao ||
                        `Página ${indice + 1}`}
                    </button>
                  ),
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {paginaAtual?.botoes
                  .slice()
                  .sort(
                    (
                      primeiro,
                      segundo,
                    ) =>
                      primeiro.posicao -
                      segundo.posicao,
                  )
                  .map((botao) => (
                    <button
                      key={`${botao.posicao}-${botao.idProduto}`}
                      type="button"
                      onClick={() =>
                        onSelecionarProduto(
                          botao,
                        )
                      }
                      disabled={
                        botao.tipoBotao
                          .trim()
                          .toUpperCase() !==
                        "PRODUTO"
                      }
                      className="flex min-h-[7rem] flex-col justify-between rounded-2xl border border-violet-200 bg-violet-50 p-3 text-left shadow-sm transition hover:border-violet-400 hover:shadow-md disabled:opacity-50"
                    >
                      <strong className="line-clamp-2 text-sm text-slate-950">
                        {botao.descricao}
                      </strong>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-black text-violet-700">
                          {new Intl.NumberFormat(
                            "pt-PT",
                            {
                              style:
                                "currency",
                              currency:
                                "EUR",
                            },
                          ).format(
                            botao.preco,
                          )}
                        </span>

                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
                          +
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}