"use client";

import type {
  POSMobileMesa,
} from "@/types/configuracao";

import type {
  POSMobileEstadoMesa,
  POSMobileEstadoVisualMesa as EstadoVisualMesa,
} from "@/types/estado-mesas";

import IconeEstadoMesa from "./IconeEstadoMesa";

interface POSMobileEstadoMesaComAcesso
  extends POSMobileEstadoMesa {
  idPostoMovimento?: number | null;
  podeEntrar?: boolean;
  podeAbrir?: boolean;
  codigoAcesso?: string | null;
  mensagemAcesso?: string | null;
}

export interface MesaComEstadoCard
  extends POSMobileMesa {
  estado: POSMobileEstadoMesaComAcesso;
  estadoVisual: EstadoVisualMesa;
}

interface MesaCardProps {
  mesa: MesaComEstadoCard;
  selecionada: boolean;
  desativada?: boolean;

  onSelecionar: (
    mesa: MesaComEstadoCard,
  ) => void;
}

function obterTextoEstado(
  estado: EstadoVisualMesa,
): string {
  switch (estado) {
    case "OCUPADA":
      return "Ocupada";

    case "EM_USO":
      return "Em uso";

    case "RESERVADA":
      return "Reservada";

    case "BLOQUEADA":
      return "Bloqueada";

    default:
      return "Livre";
  }
}

function obterClassesEstado(
  estado: EstadoVisualMesa,
): {
  cartao: string;
  faixa: string;
  textoEstado: string;
} {
  switch (estado) {
    case "OCUPADA":
      return {
        cartao:
          "border-rose-200 bg-white hover:border-rose-300",
        faixa:
          "bg-rose-500",
        textoEstado:
          "text-rose-600",
      };

    case "EM_USO":
      return {
        cartao:
          "border-blue-200 bg-white hover:border-blue-300",
        faixa:
          "bg-blue-500",
        textoEstado:
          "text-blue-600",
      };

    case "RESERVADA":
      return {
        cartao:
          "border-amber-200 bg-white hover:border-amber-300",
        faixa:
          "bg-amber-500",
        textoEstado:
          "text-amber-600",
      };

    case "BLOQUEADA":
      return {
        cartao:
          "border-slate-300 bg-slate-50 text-slate-500",
        faixa:
          "bg-slate-500",
        textoEstado:
          "text-slate-600",
      };

    default:
      return {
        cartao:
          "border-emerald-200 bg-white hover:border-emerald-300",
        faixa:
          "bg-emerald-500",
        textoEstado:
          "text-emerald-600",
      };
  }
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

export default function MesaCard({
  mesa,
  selecionada,
  desativada = false,
  onSelecionar,
}: MesaCardProps) {
  const classes =
    obterClassesEstado(
      mesa.estadoVisual,
    );

  const descricao =
    mesa.descricao?.trim() ||
    `Mesa ${mesa.numeroMesa}`;

  const textoPessoas =
    mesa.estado.numeroPessoas === 1
      ? "1 pessoa"
      : `${mesa.estado.numeroPessoas} pessoas`;

  const textoContas =
    mesa.estado.numeroContas === 1
      ? "1 conta"
      : `${mesa.estado.numeroContas} contas`;

  const temResumoConsumo =
    mesa.estado.ocupada ||
    mesa.estado.valorAtual > 0 ||
    mesa.estado.numeroPessoas > 0 ||
    mesa.estado.numeroContas > 0;

  return (
    <button
      type="button"
      disabled={desativada}
      onClick={() =>
        onSelecionar(mesa)
      }
      aria-pressed={selecionada}
      aria-label={`${descricao}, ${obterTextoEstado(
        mesa.estadoVisual,
      )}`}
      className={[
        "group relative flex h-[118px] w-full flex-col overflow-hidden rounded-2xl border px-3.5 py-3 text-left shadow-sm transition",
        "sm:h-[126px] sm:px-4 sm:py-3.5",
        "hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200",
        classes.cartao,
        selecionada
          ? "ring-2 ring-blue-500 ring-offset-1"
          : "",
        desativada
          ? "cursor-wait opacity-65"
          : "",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute inset-y-0 left-0 w-1",
          classes.faixa,
        ].join(" ")}
      />

      <div className="flex shrink-0 items-start justify-between gap-2 pl-1">
        <div className="min-w-0 flex-1">
          <h3
            title={descricao}
            className="truncate text-base font-black leading-tight tracking-tight text-slate-950 sm:text-lg"
          >
            {descricao}
          </h3>

          <span
            className={[
              "mt-1 block text-[11px] font-bold leading-none sm:text-xs",
              classes.textoEstado,
            ].join(" ")}
          >
            {obterTextoEstado(
              mesa.estadoVisual,
            )}
          </span>
        </div>

        <IconeEstadoMesa
          estado={mesa.estadoVisual}
          className="h-8 w-8 shrink-0 transition group-hover:scale-105 sm:h-9 sm:w-9"
        />
      </div>

      <div className="mt-auto pl-1">
        {temResumoConsumo && (
          <div className="border-t border-slate-200/80 pt-2">
            <div className="flex min-w-0 items-end justify-between gap-2">
              <strong className="min-w-0 truncate text-lg font-black leading-none text-slate-950 sm:text-xl">
                {formatarValor(
                  mesa.estado.valorAtual,
                )}
              </strong>
            </div>

            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold text-slate-500 sm:text-[11px]">
              <span className="truncate">
                {textoPessoas}
              </span>

              <span
                aria-hidden="true"
                className="shrink-0 text-slate-300"
              >
                ·
              </span>

              <span className="truncate">
                {textoContas}
              </span>
            </div>
          </div>
        )}

        {mesa.estado.emUso && (
          <div className="truncate border-t border-blue-100 pt-2 text-[10px] font-bold text-blue-700 sm:text-[11px]">
            Em utilização
            {mesa.estado.postoEmUso
              ? ` · ${mesa.estado.postoEmUso}`
              : ""}
          </div>
        )}
      </div>
    </button>
  );
}
