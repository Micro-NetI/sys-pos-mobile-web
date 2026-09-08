"use client";

interface TecladoNumericoPOSProps {
  valor: string;
  onChange: (valor: string) => void;

  desativado?: boolean;
  permiteDecimal?: boolean;
  casasDecimais?: number;
  maximoDigitosInteiros?: number;

  className?: string;
}

function normalizarValor(
  valor: string,
  permiteDecimal: boolean,
): string {
  const apenasPermitidos =
    permiteDecimal
      ? valor.replace(/[^\d,]/g, "")
      : valor.replace(/\D/g, "");

  if (!permiteDecimal) {
    return apenasPermitidos;
  }

  const primeiraVirgula =
    apenasPermitidos.indexOf(",");

  if (primeiraVirgula < 0) {
    return apenasPermitidos;
  }

  return (
    apenasPermitidos.slice(
      0,
      primeiraVirgula + 1,
    ) +
    apenasPermitidos
      .slice(
        primeiraVirgula + 1,
      )
      .replace(/,/g, "")
  );
}

export default function TecladoNumericoPOS({
  valor,
  onChange,
  desativado = false,
  permiteDecimal = true,
  casasDecimais = 2,
  maximoDigitosInteiros = 7,
  className = "",
}: TecladoNumericoPOSProps) {
  function adicionarDigito(
    digito: string,
  ) {
    if (desativado) {
      return;
    }

    const atual =
      normalizarValor(
        valor,
        permiteDecimal,
      );

    const [
      parteInteira = "",
      parteDecimal,
    ] = atual.split(",");

    if (
      parteDecimal !== undefined &&
      parteDecimal.length >=
        casasDecimais
    ) {
      return;
    }

    if (
      parteDecimal === undefined &&
      parteInteira.length >=
        maximoDigitosInteiros
    ) {
      return;
    }

    if (
      parteDecimal === undefined &&
      parteInteira === "0"
    ) {
      onChange(
        digito === "0"
          ? "0"
          : digito,
      );

      return;
    }

    onChange(
      `${atual}${digito}`,
    );
  }

  function adicionarDecimal() {
    if (
      desativado ||
      !permiteDecimal
    ) {
      return;
    }

    const atual =
      normalizarValor(
        valor,
        true,
      );

    if (atual.includes(",")) {
      return;
    }

    onChange(
      atual === ""
        ? "0,"
        : `${atual},`,
    );
  }

  function apagarUltimo() {
    if (desativado) {
      return;
    }

    onChange(
      valor.slice(
        0,
        -1,
      ),
    );
  }

  function limpar() {
    if (desativado) {
      return;
    }

    onChange("");
  }

  const classeTecla =
    "flex min-h-16 touch-manipulation select-none items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-900 shadow-sm transition active:scale-95 active:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className={[
        "grid grid-cols-3 gap-3",
        className,
      ].join(" ")}
      aria-label="Teclado numérico"
    >
      {[
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
      ].map((digito) => (
        <button
          key={digito}
          type="button"
          onClick={() =>
            adicionarDigito(
              digito,
            )
          }
          disabled={desativado}
          className={classeTecla}
          aria-label={`Introduzir ${digito}`}
        >
          {digito}
        </button>
      ))}

      <button
        type="button"
        onClick={limpar}
        disabled={desativado}
        className="flex min-h-16 touch-manipulation select-none items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-3 text-base font-black text-red-700 transition active:scale-95 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Limpar
      </button>

      <button
        type="button"
        onClick={() =>
          adicionarDigito("0")
        }
        disabled={desativado}
        className={classeTecla}
        aria-label="Introduzir zero"
      >
        0
      </button>

      <button
        type="button"
        onClick={
          adicionarDecimal
        }
        disabled={
          desativado ||
          !permiteDecimal
        }
        className={classeTecla}
        aria-label="Introduzir separador decimal"
      >
        ,
      </button>

      <button
        type="button"
        onClick={apagarUltimo}
        disabled={
          desativado ||
          valor.length === 0
        }
        className="col-span-3 flex min-h-14 touch-manipulation select-none items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 text-base font-black text-slate-700 transition active:scale-[0.99] active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            strokeLinejoin="round"
            d="m10 7-5 5 5 5M5 12h14"
          />
        </svg>

        Apagar último
      </button>
    </div>
  );
}
