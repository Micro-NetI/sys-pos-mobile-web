//app\components\pos\PrecoProdutoModal.tsx
"use client";

import {
  useEffect,
  useId,
  useState,
} from "react";

import TecladoNumericoPOS from "@/app/components/pos/TecladoNumericoPOS";

export interface PrecoProdutoConfirmado {
  preco: number;
  justificacao: string;
}

interface PrecoProdutoModalProps {
  aberto: boolean;
  nomeProduto: string;

  precoInicial?: number;
  motivos?: readonly string[];

  onFechar: () => void;
  onConfirmar: (
    resultado: PrecoProdutoConfirmado,
  ) => void;
}

const MOTIVOS_PRECO_PADRAO = [
  "Preço acordado",
  "Produto especial",
  "Preço autorizado",
  "Outro motivo",
] as const;

function formatarPrecoInicial(
  preco: number,
): string {
  if (
    !Number.isFinite(preco) ||
    preco <= 0
  ) {
    return "";
  }

  return preco
    .toFixed(2)
    .replace(".", ",");
}

function converterPreco(
  valor: string,
): number {
  return Number(
    valor
      .trim()
      .replace(",", "."),
  );
}

export default function PrecoProdutoModal({
  aberto,
  nomeProduto,
  precoInicial = 0,
  motivos = MOTIVOS_PRECO_PADRAO,
  onFechar,
  onConfirmar,
}: PrecoProdutoModalProps) {
  const tituloId = useId();
  const descricaoId = useId();

  const [
    precoIntroduzido,
    setPrecoIntroduzido,
  ] = useState("");

  const [
    motivoSelecionado,
    setMotivoSelecionado,
  ] = useState("");

  const [
    justificacaoLivre,
    setJustificacaoLivre,
  ] = useState("");

  const [
    mensagemErro,
    setMensagemErro,
  ] = useState("");

  const outroMotivo =
    motivos.at(-1) ??
    "Outro motivo";

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setPrecoIntroduzido(
      formatarPrecoInicial(
        precoInicial,
      ),
    );

    setMotivoSelecionado("");
    setJustificacaoLivre("");
    setMensagemErro("");
  }, [
    aberto,
    precoInicial,
    nomeProduto,
  ]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function tratarEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onFechar();
      }
    }

    window.addEventListener(
      "keydown",
      tratarEscape,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        tratarEscape,
      );
    };
  }, [
    aberto,
    onFechar,
  ]);

  if (!aberto) {
    return null;
  }

  function confirmar() {
    const preco =
      converterPreco(
        precoIntroduzido,
      );

    if (
      !Number.isFinite(preco) ||
      preco <= 0
    ) {
      setMensagemErro(
        "Indique um preço superior a zero.",
      );

      return;
    }

    if (!motivoSelecionado) {
      setMensagemErro(
        "Selecione o motivo do preço introduzido.",
      );

      return;
    }

    const exigeJustificacao =
      motivoSelecionado ===
        outroMotivo;

    if (
      exigeJustificacao &&
      justificacaoLivre.trim() ===
        ""
    ) {
      setMensagemErro(
        "Indique a justificação do preço introduzido.",
      );

      return;
    }

    onConfirmar({
      preco:
        Number(
          preco.toFixed(2),
        ),
      justificacao:
        exigeJustificacao
          ? justificacaoLivre.trim()
          : motivoSelecionado,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricaoId}
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/20 bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-600">
              Preço do produto
            </p>

            <h2
              id={tituloId}
              className="mt-2 truncate text-2xl font-black text-slate-950"
            >
              {nomeProduto}
            </h2>

            <p
              id={descricaoId}
              className="mt-1 text-sm text-slate-500"
            >
              Introduza o preço e selecione o respetivo motivo.
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition active:scale-95 active:bg-slate-100"
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

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section>
            <p className="mb-2 text-sm font-black text-slate-700">
              Preço unitário
            </p>

            <div
              className="flex min-h-20 items-center justify-end rounded-2xl border-2 border-amber-400 bg-amber-50 px-5 shadow-inner"
              aria-live="polite"
              aria-label={`Preço introduzido: ${precoIntroduzido || "0,00"} euros`}
            >
              <strong className="break-all text-right text-4xl font-black tracking-tight text-slate-950">
                {precoIntroduzido ||
                  "0,00"}
              </strong>

              <span className="ml-3 text-2xl font-black text-slate-400">
                €
              </span>
            </div>

            <TecladoNumericoPOS
              valor={
                precoIntroduzido
              }
              onChange={(valor) => {
                setPrecoIntroduzido(
                  valor,
                );

                setMensagemErro("");
              }}
              permiteDecimal
              casasDecimais={2}
              maximoDigitosInteiros={7}
              className="mt-4"
            />
          </section>

          <section>
            <p className="mb-3 text-sm font-black text-slate-700">
              Motivo do preço
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {motivos.map(
                (motivo) => {
                  const selecionado =
                    motivoSelecionado ===
                      motivo;

                  return (
                    <button
                      key={motivo}
                      type="button"
                      aria-pressed={
                        selecionado
                      }
                      onClick={() => {
                        setMotivoSelecionado(
                          motivo,
                        );

                        setJustificacaoLivre(
                          "",
                        );

                        setMensagemErro("");
                      }}
                      className={[
                        "min-h-16 touch-manipulation rounded-2xl border px-4 py-3 text-sm font-black transition active:scale-95",
                        selecionado
                          ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20"
                          : "border-slate-200 bg-white text-slate-700 active:bg-amber-50",
                      ].join(" ")}
                    >
                      {motivo}
                    </button>
                  );
                },
              )}
            </div>

            {motivoSelecionado ===
              outroMotivo && (
              <div className="mt-4">
                <label
                  htmlFor="justificacaoPrecoProduto"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  Justificação
                </label>

                <textarea
                  id="justificacaoPrecoProduto"
                  value={
                    justificacaoLivre
                  }
                  onChange={(event) => {
                    setJustificacaoLivre(
                      event.target.value,
                    );

                    setMensagemErro("");
                  }}
                  rows={4}
                  maxLength={500}
                  placeholder="Indique a razão do preço introduzido..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-base outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                />

                <p className="mt-1 text-right text-xs font-semibold text-slate-400">
                  {justificacaoLivre.length}
                  /500
                </p>
              </div>
            )}

            {mensagemErro && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {mensagemErro}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onFechar}
                className="min-h-14 touch-manipulation rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition active:scale-[0.99] active:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmar}
                className="min-h-14 touch-manipulation rounded-xl bg-amber-500 px-6 text-sm font-black text-white shadow-md shadow-amber-500/20 transition active:scale-[0.99] active:bg-amber-600"
              >
                Adicionar produto
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
