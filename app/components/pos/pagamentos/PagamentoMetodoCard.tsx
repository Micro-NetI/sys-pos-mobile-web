//app\components\pos\pagamentos\PagamentoMetodoCard.tsx
"use client";

import type {
  POSMobilePagamentoBotao,
} from "@/types/pos-mobile-pagamentos";

interface PagamentoMetodoCardProps {
  pagamento:
    POSMobilePagamentoBotao;

  emProcessamento?: boolean;

  desativado?: boolean;

  onSelecionar: (
    pagamento: POSMobilePagamentoBotao,
  ) => void;
}

/*
  Converte algumas das cores Delphi mais comuns.

  Mantemos a configuração visual do SysPOS,
  mas usamos a cor apenas como detalhe visual,
  evitando pintar o cartão inteiro.
*/
const CORES_DELPHI:
  Record<string, string> = {
    clblack: "#000000",
    clmaroon: "#800000",
    clgreen: "#008000",
    clolive: "#808000",
    clnavy: "#000080",
    clpurple: "#800080",
    clteal: "#008080",
    clgray: "#808080",
    clsilver: "#c0c0c0",

    clred: "#ff0000",
    cllime: "#00ff00",
    clyellow: "#ffff00",
    clblue: "#0000ff",
    clfuchsia: "#ff00ff",
    claqua: "#00ffff",
    clwhite: "#ffffff",

    clmoneygreen: "#c0dcc0",
    clskyblue: "#a6caf0",
    clcream: "#fffdd0",
    clmedgray: "#a0a0a4",

    clwindow: "#ffffff",
    clwindowtext: "#000000",
    clbtnface: "#f0f0f0",
    clbtntext: "#000000",

    clhighlight: "#0078d7",
    clhighlighttext: "#ffffff",
  };

function converterCorDelphi(
  valor:
    | string
    | null
    | undefined,
): string | undefined {
  if (!valor) {
    return undefined;
  }

  const normalizado =
    valor
      .trim()
      .toLowerCase();

  if (!normalizado) {
    return undefined;
  }

  const conhecida =
    CORES_DELPHI[
      normalizado
    ];

  if (conhecida) {
    return conhecida;
  }

  if (
    /^#[0-9a-f]{6}$/i.test(
      normalizado,
    )
  ) {
    return normalizado;
  }

  if (
    /^#[0-9a-f]{3}$/i.test(
      normalizado,
    )
  ) {
    return normalizado;
  }

  if (
    /^\$[0-9a-f]{8}$/i.test(
      normalizado,
    )
  ) {
    const numero =
      Number.parseInt(
        normalizado.slice(1),
        16,
      );

    if (
      !Number.isFinite(
        numero,
      )
    ) {
      return undefined;
    }

    const vermelho =
      numero & 0xff;

    const verde =
      (numero >> 8) & 0xff;

    const azul =
      (numero >> 16) & 0xff;

    return `#${vermelho
      .toString(16)
      .padStart(2, "0")}${verde
      .toString(16)
      .padStart(2, "0")}${azul
      .toString(16)
      .padStart(2, "0")}`;
  }

  return undefined;
}

function obterInicialPagamento(
  descricao: string,
): string {
  const descricaoNormalizada =
    descricao.trim();

  if (!descricaoNormalizada) {
    return "€";
  }

  return descricaoNormalizada
    .charAt(0)
    .toLocaleUpperCase(
      "pt-PT",
    );
}

export default function PagamentoMetodoCard({
  pagamento,
  emProcessamento = false,
  desativado = false,
  onSelecionar,
}: PagamentoMetodoCardProps) {
  const corConfigurada =
    converterCorDelphi(
      pagamento.cor,
    );

  const corTexto =
    converterCorDelphi(
      pagamento.corLetra,
    );

  return (
    <button
      type="button"
      disabled={desativado}
      onClick={() => {
        onSelecionar(
          pagamento,
        );
      }}
      title={pagamento.descricao}
      className="
        group
        relative
        flex
        min-h-[94px]
        flex-col
        justify-between
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-3
        text-left
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:border-emerald-300
        hover:shadow-md
        active:translate-y-0
        active:scale-[0.99]
        disabled:cursor-wait
        disabled:opacity-50
      "
    >
      {corConfigurada && (
        <span
          className="
            absolute
            inset-y-0
            left-0
            w-1
          "
          style={{
            backgroundColor:
              corConfigurada,
          }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <span
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-slate-100
            text-xs
            font-black
            text-slate-700
          "
          style={
            corConfigurada
              ? {
                  borderColor:
                    corConfigurada,

                  color:
                    corTexto ??
                    corConfigurada,
                }
              : undefined
          }
        >
          {obterInicialPagamento(
            pagamento.descricao,
          )}
        </span>

        {pagamento.idTipoDocVnd >
          0 && (
          <span
            title={`Tipo de documento ${pagamento.idTipoDocVnd}`}
            className="
              rounded-full
              bg-slate-100
              px-1.5
              py-0.5
              text-[8px]
              font-black
              text-slate-400
            "
          >
            DOC.{" "}
            {
              pagamento.idTipoDocVnd
            }
          </span>
        )}
      </div>

      <div className="mt-3 min-w-0">
        <p
          className="
            line-clamp-2
            text-[13px]
            font-black
            leading-4
            text-slate-900
          "
        >
          {
            pagamento.descricao
          }
        </p>

        {emProcessamento ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

            <span className="text-[9px] font-bold text-blue-600">
              A processar...
            </span>
          </div>
        ) : (
          <p className="mt-1 text-[9px] font-semibold text-slate-400">
            Toque para selecionar
          </p>
        )}
      </div>
    </button>
  );
}