//app\components\pos\DadosPostoPopover.tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ContextoPostoDados,
} from "@/types/contexto";

interface DadosPostoPopoverProps {
  contexto: ContextoPostoDados | null;
  className?: string;
}

interface LinhaContextoProps {
  etiqueta: string;
  valor: string;
  detalhe?: string | null;
}

function LinhaContexto({
  etiqueta,
  valor,
  detalhe,
}: LinhaContextoProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          {etiqueta}
        </p>

        <p className="mt-1 break-words text-sm font-black text-slate-900">
          {valor}
        </p>
      </div>

      {detalhe && (
        <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
          {detalhe}
        </span>
      )}
    </div>
  );
}

function valorDescricao(
  descricao: string | null | undefined,
  fallback: string,
): string {
  const valor =
    descricao?.trim() ?? "";

  return valor || fallback;
}

export default function DadosPostoPopover({
  contexto,
  className = "",
}: DadosPostoPopoverProps) {
  const [aberto, setAberto] =
    useState(false);

  const contentorRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function tratarCliqueExterior(
      event: MouseEvent,
    ) {
      if (
        window.matchMedia(
          "(min-width: 640px)",
        ).matches &&
        contentorRef.current &&
        !contentorRef.current.contains(
          event.target as Node,
        )
      ) {
        setAberto(false);
      }
    }

    function tratarTecla(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      tratarCliqueExterior,
    );

    document.addEventListener(
      "keydown",
      tratarTecla,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        tratarCliqueExterior,
      );

      document.removeEventListener(
        "keydown",
        tratarTecla,
      );
    };
  }, [aberto]);

  const posto =
    valorDescricao(
      contexto?.posto.descricao,
      contexto?.posto.idPosto
        ? `Posto ${contexto.posto.idPosto}`
        : "Não definido",
    );

  const centroExploracao =
    valorDescricao(
      contexto?.operacao
        .descricaoCentroExploracao,
      contexto?.operacao
        .idCentroExploracao
        ? `Centro ${contexto.operacao.idCentroExploracao}`
        : "Não definido",
    );

  const classePrecos =
    valorDescricao(
      contexto?.operacao
        .descricaoClassePrecos,
      contexto?.operacao
        .idClassePrecos
        ? `Classe ${contexto.operacao.idClassePrecos}`
        : "Não definida",
    );

  const caixa =
    valorDescricao(
      contexto?.operacao.descricaoCaixa,
      contexto?.operacao.idCaixa
        ? `Caixa ${contexto.operacao.idCaixa}`
        : "Não definida",
    );

  const profitCenter =
    valorDescricao(
      contexto?.operacao
        .descricaoProfitCenter,
      contexto?.operacao.idProfitCenter
        ? `Profit center ${contexto.operacao.idProfitCenter}`
        : "Não definido",
    );

  return (
    <div
      ref={contentorRef}
      className={[
        "relative shrink-0",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() =>
          setAberto(
            (valorAtual) =>
              !valorAtual,
          )
        }
        disabled={!contexto}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        title="Consultar os dados operacionais do posto"
        className={[
          "flex h-10 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-black shadow-sm transition sm:h-11 sm:px-3",
          aberto
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
          !contexto
            ? "cursor-not-allowed opacity-50"
            : "",
        ].join(" ")}
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
            r="9"
          />
          <path
            strokeLinecap="round"
            d="M12 11v6M12 7h.01"
          />
        </svg>

        <span className="hidden md:inline">
          Dados do posto
        </span>

        <span className="md:hidden">
          Dados
        </span>
      </button>

      {aberto && contexto && (
        <>
          <button
            type="button"
            aria-label="Fechar dados do posto"
            onClick={() =>
              setAberto(false)
            }
            className="fixed inset-0 z-[79] cursor-default bg-slate-950/35 backdrop-blur-[1px] sm:hidden"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Dados operacionais do posto"
            className="
              fixed inset-x-3 bottom-3 z-[80]
              max-h-[78dvh] overflow-y-auto
              rounded-3xl border border-slate-200 bg-white shadow-2xl
              sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.5rem)]
              sm:max-h-[calc(100dvh-6rem)] sm:w-[22rem] sm:rounded-2xl
            "
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/95 px-4 py-3 backdrop-blur">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                  Configuração operacional
                </p>

                <h2 className="mt-1 break-words text-base font-black text-slate-950">
                  {posto}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAberto(false)
                }
                aria-label="Fechar dados do posto"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
                    d="M6 6l12 12M18 6 6 18"
                  />
                </svg>
              </button>
            </div>

            <div className="px-4 py-1">
              <LinhaContexto
                etiqueta="Posto"
                valor={posto}
                detalhe={
                  contexto.posto.idPosto > 0
                    ? `ID ${contexto.posto.idPosto}`
                    : null
                }
              />

              <LinhaContexto
                etiqueta="Centro de exploração"
                valor={centroExploracao}
                detalhe={
                  contexto.operacao
                    .idCentroExploracao > 0
                    ? `ID ${contexto.operacao.idCentroExploracao}`
                    : null
                }
              />

              <LinhaContexto
                etiqueta="Classe de preços"
                valor={classePrecos}
                detalhe={
                  contexto.operacao
                    .idClassePrecos > 0
                    ? `ID ${contexto.operacao.idClassePrecos}`
                    : null
                }
              />

              <LinhaContexto
                etiqueta="Caixa"
                valor={caixa}
                detalhe={
                  contexto.operacao.idCaixa > 0
                    ? `ID ${contexto.operacao.idCaixa}`
                    : null
                }
              />

              {(
                contexto.operacao.idProfitCenter > 0 ||
                contexto.operacao.descricaoProfitCenter?.trim()
              ) && (
                <LinhaContexto
                  etiqueta="Profit center"
                  valor={profitCenter}
                  detalhe={
                    contexto.operacao.idProfitCenter > 0
                      ? `ID ${contexto.operacao.idProfitCenter}`
                      : null
                  }
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
