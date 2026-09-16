"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  POSMobileCaixaDados,
} from "@/types/pos-mobile-caixa";

interface AbrirCaixaModalProps {
  mostrar: boolean;
  caixa: POSMobileCaixaDados | null;

  aAbrir?: boolean;
  mensagemErro?: string;

  onCancelar: () => void;

  onConfirmar: (
    fundoCaixa: number,
  ) => void | Promise<void>;
}

function normalizarValor(
  valor: string,
): number {
  const numero =
    Number(
      valor
        .trim()
        .replace(",", "."),
    );

  return Number.isFinite(numero)
    ? numero
    : Number.NaN;
}

export default function AbrirCaixaModal({
  mostrar,
  caixa,
  aAbrir = false,
  mensagemErro = "",
  onCancelar,
  onConfirmar,
}: AbrirCaixaModalProps) {
  const [
    fundoCaixa,
    setFundoCaixa,
  ] = useState("0");

  const [
    erroLocal,
    setErroLocal,
  ] = useState("");

  useEffect(() => {
    if (!mostrar) {
      return;
    }

    setFundoCaixa("0");
    setErroLocal("");
  }, [
    mostrar,
    caixa?.idCaixa,
  ]);

  if (
    !mostrar ||
    !caixa
  ) {
    return null;
  }

  const confirmar = () => {
    const valor =
      caixa.pedeFundoCaixa
        ? normalizarValor(
            fundoCaixa,
          )
        : 0;

    if (
      !Number.isFinite(
        valor,
      ) ||
      valor < 0
    ) {
      setErroLocal(
        "Introduza um fundo de caixa válido.",
      );

      return;
    }

    setErroLocal("");

    void onConfirmar(
      valor,
    );
  };

  const erro =
    erroLocal ||
    mensagemErro;

  return (
    <div
      className="
        fixed
        inset-0
        z-[180]
        flex
        items-center
        justify-center
        bg-slate-950/55
        p-4
        backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-label="Abrir caixa"
    >
      <div
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >
        <div
          className="
            border-b
            border-slate-200
            bg-slate-50
            px-5
            py-4
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <span
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-emerald-100
                text-emerald-700
              "
              aria-hidden="true"
            >
              €
            </span>

            <div>
              <h2
                className="
                  text-lg
                  font-black
                  text-slate-950
                "
              >
                Abrir caixa
              </h2>

              <p
                className="
                  mt-0.5
                  text-sm
                  font-semibold
                  text-slate-500
                "
              >
                Caixa {caixa.idCaixa}
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            space-y-4
            px-5
            py-5
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-amber-200
              bg-amber-50
              px-4
              py-3
              text-sm
              font-semibold
              leading-6
              text-amber-900
            "
          >
            O caixa deste posto está fechado.
            É necessário abri-lo antes de
            concluir a venda.
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-3
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-4
              text-sm
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Aberturas
              </p>

              <p
                className="
                  mt-1
                  font-black
                  text-slate-800
                "
              >
                {caixa.numeroAberturas}
                {caixa.maximoAberturas > 0
                  ? ` / ${caixa.maximoAberturas}`
                  : ""}
              </p>
            </div>

            <div>
              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Fundo
              </p>

              <p
                className="
                  mt-1
                  font-black
                  text-slate-800
                "
              >
                {caixa.pedeFundoCaixa
                  ? "Obrigatório"
                  : "Não solicitado"}
              </p>
            </div>
          </div>

          {caixa.pedeFundoCaixa && (
            <label
              className="
                block
              "
            >
              <span
                className="
                  mb-2
                  block
                  text-sm
                  font-black
                  text-slate-700
                "
              >
                Fundo de caixa
              </span>

              <div
                className="
                  flex
                  h-14
                  items-center
                  rounded-2xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  focus-within:border-emerald-500
                  focus-within:ring-4
                  focus-within:ring-emerald-100
                "
              >
                <span
                  className="
                    mr-2
                    font-black
                    text-slate-400
                  "
                >
                  €
                </span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={fundoCaixa}
                  disabled={aAbrir}
                  onChange={(
                    event,
                  ) => {
                    setFundoCaixa(
                      event.target.value,
                    );

                    setErroLocal("");
                  }}
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                      confirmar();
                    }
                  }}
                  autoFocus
                  className="
                    h-full
                    min-w-0
                    flex-1
                    bg-transparent
                    text-xl
                    font-black
                    text-slate-950
                    outline-none
                  "
                />
              </div>
            </label>
          )}

          {erro && (
            <div
              className="
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                font-bold
                leading-6
                text-red-700
              "
            >
              {erro}
            </div>
          )}
        </div>

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-slate-200
            bg-slate-50
            px-5
            py-4
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            disabled={aAbrir}
            onClick={onCancelar}
            className="
              h-12
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              text-sm
              font-bold
              text-slate-600
              transition
              hover:bg-slate-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={aAbrir}
            onClick={confirmar}
            className="
              h-12
              rounded-xl
              bg-emerald-600
              px-6
              text-sm
              font-black
              text-white
              shadow-md
              shadow-emerald-600/20
              transition
              hover:bg-emerald-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {aAbrir
              ? "A abrir caixa..."
              : "Abrir caixa e continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
