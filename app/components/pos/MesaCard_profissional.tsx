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

interface ClassesEstadoMesa {
  cartao: string;
  faixa: string;
  badge: string;
  textoPosto: string;
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
): ClassesEstadoMesa {
  switch (estado) {
    case "OCUPADA":
      return {
        cartao:
          "border-rose-200 bg-white hover:border-rose-300",
        faixa:
          "bg-rose-500",
        badge:
          "bg-rose-100 text-rose-700 ring-rose-200",
        textoPosto:
          "text-rose-700",
      };

    case "EM_USO":
      return {
        cartao:
          "border-blue-200 bg-white hover:border-blue-300",
        faixa:
          "bg-blue-500",
        badge:
          "bg-blue-100 text-blue-700 ring-blue-200",
        textoPosto:
          "text-blue-700",
      };

    case "RESERVADA":
      return {
        cartao:
          "border-amber-200 bg-white hover:border-amber-300",
        faixa:
          "bg-amber-500",
        badge:
          "bg-amber-100 text-amber-700 ring-amber-200",
        textoPosto:
          "text-amber-700",
      };

    case "BLOQUEADA":
      return {
        cartao:
          "border-slate-300 bg-slate-50 text-slate-500",
        faixa:
          "bg-slate-500",
        badge:
          "bg-slate-200 text-slate-700 ring-slate-300",
        textoPosto:
          "text-slate-600",
      };

    default:
      return {
        cartao:
          "border-emerald-200 bg-white hover:border-emerald-300",
        faixa:
          "bg-emerald-500",
        badge:
          "bg-emerald-100 text-emerald-700 ring-emerald-200",
        textoPosto:
          "text-emerald-700",
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

function obterTextoPessoas(
  quantidade: number,
): string {
  return `${quantidade} ${
    quantidade === 1
      ? "pessoa"
      : "pessoas"
  }`;
}

function obterTextoContas(
  quantidade: number,
): string {
  return `${quantidade} ${
    quantidade === 1
      ? "conta"
      : "contas"
  }`;
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

  const postoEmUso =
    mesa.estado.postoEmUso?.trim() ||
    "";

  const temConsumo =
    mesa.estado.ocupada;

  return (
    <button
      type="button"
      disabled={
        desativada
      }
      onClick={() =>
        onSelecionar(
          mesa,
        )
      }
      aria-pressed={
        selecionada
      }
      aria-label={`${descricao}, ${obterTextoEstado(
        mesa.estadoVisual,
      )}`}
      className={[
        "group relative flex h-[170px] w-full flex-col overflow-hidden rounded-2xl border p-4 pl-5 text-left shadow-sm transition",
        "hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200",
        classes.cartao,
        selecionada
          ? "ring-2 ring-blue-500 ring-offset-2"
          : "",
        desativada
          ? "cursor-wait opacity-65"
          : "",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute inset-y-0 left-0 w-1.5",
          classes.faixa,
        ].join(" ")}
      />

      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            title={
              descricao
            }
            className="truncate pt-0.5 text-lg font-black tracking-tight text-slate-950"
          >
            {descricao}
          </h3>

          <div className="mt-2 flex min-w-0 items-center gap-2">
            <span
              className={[
                "inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset",
                classes.badge,
              ].join(" ")}
            >
              {obterTextoEstado(
                mesa.estadoVisual,
              )}
            </span>

            {mesa.estado.emUso &&
              postoEmUso && (
                <span
                  title={`Em utilização por ${postoEmUso}`}
                  className={[
                    "min-w-0 truncate text-[10px] font-black uppercase tracking-wide",
                    classes.textoPosto,
                  ].join(" ")}
                >
                  {postoEmUso}
                </span>
              )}
          </div>
        </div>

        <IconeEstadoMesa
          estado={
            mesa.estadoVisual
          }
          className="shrink-0 transition group-hover:scale-105"
        />
      </div>

      <div className="mt-auto">
        {temConsumo ? (
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-end justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Total
              </span>

              <strong className="truncate text-xl font-black tabular-nums text-slate-950">
                {formatarValor(
                  mesa.estado.valorAtual,
                )}
              </strong>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
              <span>
                {obterTextoPessoas(
                  mesa.estado.numeroPessoas,
                )}
              </span>

              <span>
                {obterTextoContas(
                  mesa.estado.numeroContas,
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-100 pt-3">
            <span className="text-[11px] font-semibold text-slate-400">
              Sem consumo registado
            </span>
          </div>
        )}
      </div>
    </button>
  );
}