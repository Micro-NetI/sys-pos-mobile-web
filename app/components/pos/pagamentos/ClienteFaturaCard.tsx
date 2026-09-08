//app\components\pos\pagamentos\ClienteFaturaCard.tsx
"use client";

import type {
  POSMobileClienteResumo,
} from "@/types/pos-mobile-clientes";

interface ClienteFaturaCardProps {
  clienteSelecionado:
    | POSMobileClienteResumo
    | null;

  idClienteIndiferenciado: number;

  desativado?: boolean;

  onSelecionarCliente: () => void;
}

export default function ClienteFaturaCard({
  clienteSelecionado,
  idClienteIndiferenciado,
  desativado = false,
  onSelecionarCliente,
}: ClienteFaturaCardProps) {
  const ehConsumidorFinal =
    !clienteSelecionado ||
    clienteSelecionado.idCliente ===
      idClienteIndiferenciado;

  const nomeCliente =
    ehConsumidorFinal
      ? "Consumidor Final"
      : clienteSelecionado?.nome ??
        "Consumidor Final";

  const detalhesCliente =
    !ehConsumidorFinal &&
    clienteSelecionado
      ? [
          `N.º ${clienteSelecionado.idCliente}`,

          clienteSelecionado.nif
            ? `NIF ${clienteSelecionado.nif}`
            : null,
        ]
          .filter(
            (
              valor,
            ): valor is string =>
              Boolean(valor),
          )
          .join(" · ")
      : "";

  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        rounded-2xl
        border
        border-slate-200
        bg-white
        px-4
        py-3
        shadow-sm
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-blue-50
            text-blue-600
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4.5 w-4.5"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="7"
              r="4"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 21a8 8 0 0 0-16 0"
            />
          </svg>
        </span>

        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            Cliente da fatura
          </p>

          <p
            title={nomeCliente}
            className="truncate text-sm font-black text-slate-900"
          >
            {nomeCliente}
          </p>

          {detalhesCliente && (
            <p
              title={detalhesCliente}
              className="mt-0.5 truncate text-[10px] font-semibold text-slate-400"
            >
              {detalhesCliente}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={
          onSelecionarCliente
        }
        disabled={desativado}
        className="
          h-9
          shrink-0
          rounded-xl
          border
          border-blue-200
          bg-blue-50
          px-3
          text-[11px]
          font-black
          text-blue-700
          transition
          hover:border-blue-300
          hover:bg-blue-100
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {ehConsumidorFinal
          ? "Selecionar cliente"
          : "Alterar"}
      </button>
    </div>
  );
}