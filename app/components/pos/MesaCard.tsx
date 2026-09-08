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
  badge: string;
} {
  switch (estado) {
    case "OCUPADA":
      return {
        cartao:
          "border-rose-200 bg-rose-50/55 hover:border-rose-300",
        badge:
          "bg-rose-100 text-rose-700 ring-rose-200",
      };

    case "EM_USO":
      return {
        cartao:
          "border-blue-200 bg-blue-50/60 hover:border-blue-300",
        badge:
          "bg-blue-100 text-blue-700 ring-blue-200",
      };

    case "RESERVADA":
      return {
        cartao:
          "border-amber-200 bg-amber-50/60 hover:border-amber-300",
        badge:
          "bg-amber-100 text-amber-700 ring-amber-200",
      };

    case "BLOQUEADA":
      return {
        cartao:
          "border-slate-300 bg-slate-100 text-slate-500",
        badge:
          "bg-slate-200 text-slate-700 ring-slate-300",
      };

    default:
      return {
        cartao:
          "border-emerald-200 bg-emerald-50/45 hover:border-emerald-300",
        badge:
          "bg-emerald-100 text-emerald-700 ring-emerald-200",
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
        "group relative flex h-[165px] w-full flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition",
        "sm:h-[175px] sm:p-4",
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
      <div className="flex shrink-0 items-start justify-between gap-3">
        <h3
          title={
            descricao
          }
          className="min-w-0 flex-1 truncate pt-1 text-base font-black tracking-tight text-slate-950 sm:text-lg"
        >
          {descricao}
        </h3>

        <IconeEstadoMesa
          estado={
            mesa.estadoVisual
          }
          className="transition group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex min-w-0 shrink-0 items-center gap-2">
        <span
          className={[
            "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset",
            classes.badge,
          ].join(" ")}
        >
          {obterTextoEstado(
            mesa.estadoVisual,
          )}
        </span>

        {mesa.estado.emUso &&
          mesa.estado.postoEmUso && (
            <span
              title={`Em utilização por ${mesa.estado.postoEmUso}`}
              className="min-w-0 truncate text-[11px] font-bold text-blue-700"
            >
              {mesa.estado.postoEmUso}
            </span>
          )}
      </div>

      <div className="mt-auto">
        {mesa.estado.ocupada && (
          <div className="border-t border-slate-200/80 pt-3">
            <div className="flex items-end justify-between gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Total
              </span>

              <strong className="truncate text-lg font-black text-slate-950">
                {formatarValor(
                  mesa.estado.valorAtual,
                )}
              </strong>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
              <span>
                {mesa.estado.numeroPessoas}{" "}
                {mesa.estado.numeroPessoas === 1
                  ? "pessoa"
                  : "pessoas"}
              </span>

              <span>
                {mesa.estado.numeroContas}{" "}
                {mesa.estado.numeroContas === 1
                  ? "conta"
                  : "contas"}
              </span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

// "use client";

// import type {
//   POSMobileMesa,
// } from "@/types/configuracao";

// import type {
//   POSMobileEstadoMesa,
//   POSMobileEstadoVisualMesa as EstadoVisualMesa,
// } from "@/types/estado-mesas";

// import IconeEstadoMesa from "./IconeEstadoMesa";

// interface POSMobileEstadoMesaComAcesso
//   extends POSMobileEstadoMesa {
//   idPostoMovimento?: number | null;
//   podeEntrar?: boolean;
//   podeAbrir?: boolean;
//   codigoAcesso?: string | null;
//   mensagemAcesso?: string | null;
// }

// export interface MesaComEstadoCard
//   extends POSMobileMesa {
//   estado: POSMobileEstadoMesaComAcesso;
//   estadoVisual: EstadoVisualMesa;
// }

// interface MesaCardProps {
//   mesa: MesaComEstadoCard;
//   selecionada: boolean;
//   desativada?: boolean;

//   onSelecionar: (
//     mesa: MesaComEstadoCard,
//   ) => void;
// }

// function obterTextoEstado(
//   estado: EstadoVisualMesa,
// ): string {
//   switch (estado) {
//     case "OCUPADA":
//       return "Ocupada";

//     case "EM_USO":
//       return "Em uso";

//     case "RESERVADA":
//       return "Reservada";

//     case "BLOQUEADA":
//       return "Bloqueada";

//     default:
//       return "Livre";
//   }
// }

// function obterClassesEstado(
//   estado: EstadoVisualMesa,
// ): {
//   cartao: string;
//   faixa: string;
//   badge: string;
// } {
//   switch (estado) {
//     case "OCUPADA":
//       return {
//         cartao:
//           "border-rose-200 bg-rose-50/55 hover:border-rose-300",
//         faixa:
//           "bg-rose-500",
//         badge:
//           "bg-rose-100 text-rose-700 ring-rose-200",
//       };

//     case "EM_USO":
//       return {
//         cartao:
//           "border-blue-200 bg-blue-50/60 hover:border-blue-300",
//         faixa:
//           "bg-blue-500",
//         badge:
//           "bg-blue-100 text-blue-700 ring-blue-200",
//       };

//     case "RESERVADA":
//       return {
//         cartao:
//           "border-amber-200 bg-amber-50/60 hover:border-amber-300",
//         faixa:
//           "bg-amber-500",
//         badge:
//           "bg-amber-100 text-amber-700 ring-amber-200",
//       };

//     case "BLOQUEADA":
//       return {
//         cartao:
//           "border-slate-300 bg-slate-100 text-slate-500",
//         faixa:
//           "bg-slate-500",
//         badge:
//           "bg-slate-200 text-slate-700 ring-slate-300",
//       };

//     default:
//       return {
//         cartao:
//           "border-emerald-200 bg-emerald-50/45 hover:border-emerald-300",
//         faixa:
//           "bg-emerald-500",
//         badge:
//           "bg-emerald-100 text-emerald-700 ring-emerald-200",
//       };
//   }
// }

// function formatarValor(
//   valor: number,
// ): string {
//   return new Intl.NumberFormat(
//     "pt-PT",
//     {
//       style: "currency",
//       currency: "EUR",
//     },
//   ).format(valor);
// }

// export default function MesaCard({
//   mesa,
//   selecionada,
//   desativada = false,
//   onSelecionar,
// }: MesaCardProps) {
//   const classes =
//     obterClassesEstado(
//       mesa.estadoVisual,
//     );

//   const descricao =
//     mesa.descricao?.trim() ||
//     `Mesa ${mesa.numeroMesa}`;

//   return (
//     <button
//       type="button"
//       disabled={desativada}
//       onClick={() =>
//         onSelecionar(mesa)
//       }
//       aria-pressed={selecionada}
//       aria-label={`${descricao}, ${obterTextoEstado(
//         mesa.estadoVisual,
//       )}`}
//       className={[
//         /*
//           Altura fixa para todos os cartões,
//           independentemente do conteúdo.
//         */
//         "group relative flex h-[165px] w-full flex-col overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition",

//         "sm:h-[175px] sm:p-4",

//         "hover:-translate-y-0.5 hover:shadow-md",

//         "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200",

//         classes.cartao,

//         selecionada
//           ? "ring-2 ring-blue-500 ring-offset-2"
//           : "",

//         desativada
//           ? "cursor-wait opacity-65"
//           : "",
//       ].join(" ")}
//     >
//       <span
//         aria-hidden="true"
//         className={[
//           "absolute inset-x-0 top-0 h-1",
//           classes.faixa,
//         ].join(" ")}
//       />

//       <div className="flex shrink-0 items-start justify-between gap-3 pt-1">
//         <div className="min-w-0 pt-1">
//           <h3
//             title={descricao}
//             className="truncate text-base font-black tracking-tight text-slate-950 sm:text-lg"
//           >
//             {descricao}
//           </h3>

//           {/*
//             Removido porque não era claro para o utilizador
//             e repetia muitas vezes o nome da mesa.

//             <p className="mt-1 text-xs font-semibold text-slate-400">
//               N.º {mesa.numeroMesa}
//             </p>
//           */}
//         </div>

//         <IconeEstadoMesa
//           estado={
//             mesa.estadoVisual
//           }
//           className="h-10 w-10 transition group-hover:scale-105"
//         />
//       </div>

//       <div className="mt-3 shrink-0">
//         <span
//           className={[
//             "inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset",
//             classes.badge,
//           ].join(" ")}
//         >
//           {obterTextoEstado(
//             mesa.estadoVisual,
//           )}
//         </span>
//       </div>

//       {/*
//         A zona inferior fica sempre encostada
//         ao fundo do cartão.
//       */}
//       <div className="mt-auto">
//         {mesa.estado.ocupada && (
//           <div className="border-t border-slate-200/80 pt-3">
//             <div className="flex items-end justify-between gap-3">
//               <span className="text-xs font-semibold text-slate-500">
//                 Total
//               </span>

//               <strong className="truncate text-lg font-black text-slate-950">
//                 {formatarValor(
//                   mesa.estado.valorAtual,
//                 )}
//               </strong>
//             </div>

//             <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
//               <span>
//                 {mesa.estado.numeroPessoas}{" "}
//                 {mesa.estado.numeroPessoas === 1
//                   ? "pessoa"
//                   : "pessoas"}
//               </span>

//               <span>
//                 {mesa.estado.numeroContas}{" "}
//                 {mesa.estado.numeroContas === 1
//                   ? "conta"
//                   : "contas"}
//               </span>
//             </div>
//           </div>
//         )}

//         {/*
//           Removido porque repetia o significado
//           do badge "Livre", "Reservada" ou "Bloqueada".

//           Exemplo anterior:
//           "Disponível para abrir"
//           "Mesa reservada"
//           "Acesso indisponível"
//         */}

//         {mesa.estado.emUso && (
//           <div className="truncate rounded-xl border border-blue-200 bg-blue-100/80 px-3 py-2 text-[11px] font-bold text-blue-800">
//             Em utilização
//             {mesa.estado.postoEmUso
//               ? ` por ${mesa.estado.postoEmUso}`
//               : ""}
//           </div>
//         )}
//       </div>
//     </button>
//   );
// }