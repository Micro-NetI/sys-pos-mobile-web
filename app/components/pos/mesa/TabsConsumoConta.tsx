"use client";

export type SeparadorMesa =
  | "CONSUMO"
  | "CONTA";

interface TabsConsumoContaProps {
  separador: SeparadorMesa;

  /**
   * Número total de itens atualmente existentes
   * no pedido/conta.
   *
   * É apenas informação visual.
   */
  totalItens?: number;

  /**
   * Impede a troca de separador enquanto decorrem
   * operações que não devem ser interrompidas.
   */
  disabled?: boolean;

  onAlterar: (
    separador: SeparadorMesa,
  ) => void;
}

export default function TabsConsumoConta({
  separador,
  totalItens = 0,
  disabled = false,
  onAlterar,
}: TabsConsumoContaProps) {
  const quantidade =
    Number.isFinite(totalItens)
      ? Math.max(
          0,
          Math.trunc(totalItens),
        )
      : 0;

  return (
    <div className="bg-white px-3 py-2 sm:px-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() =>
            onAlterar(
              "CONSUMO",
            )
          }
          disabled={
            disabled
          }
          aria-pressed={
            separador ===
            "CONSUMO"
          }
          className={[
            "flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl px-3",
            "text-sm font-black transition active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            separador ===
            "CONSUMO"
              ? [
                  "bg-white",
                  "text-blue-700",
                  "shadow-sm",
                  "ring-1 ring-slate-200",
                ].join(" ")
              : [
                  "text-slate-500",
                  "hover:bg-white/70",
                  "hover:text-slate-900",
                ].join(" "),
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h10"
            />
          </svg>

          <span>
            Consumo
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            onAlterar(
              "CONTA",
            )
          }
          disabled={
            disabled
          }
          aria-pressed={
            separador ===
            "CONTA"
          }
          className={[
            "flex h-10 touch-manipulation items-center justify-center gap-2 rounded-xl px-3",
            "text-sm font-black transition active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            separador ===
            "CONTA"
              ? [
                  "bg-white",
                  "text-blue-700",
                  "shadow-sm",
                  "ring-1 ring-slate-200",
                ].join(" ")
              : [
                  "text-slate-500",
                  "hover:bg-white/70",
                  "hover:text-slate-900",
                ].join(" "),
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-2-1.33V4a1 1 0 0 1 1-1Z"
            />

            <path
              strokeLinecap="round"
              d="M8 8h8M8 12h8M8 16h5"
            />
          </svg>

          <span>
            Conta
          </span>

          {quantidade > 0 && (
            <span
              className={[
                "inline-flex min-w-5 items-center justify-center rounded-full",
                "px-1.5 py-0.5 text-[10px] font-black",
                separador ===
                "CONTA"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-200 text-slate-600",
              ].join(" ")}
            >
              {quantidade > 99
                ? "99+"
                : quantidade}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
