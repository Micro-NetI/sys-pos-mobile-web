import type {
  ContextoPostoDados,
} from "@/types/contexto";

type TipoItemContexto =
  | "POSTO"
  | "SALA"
  | "CENTRO"
  | "CLASSE"
  | "CAIXA"
  | "PROFIT_CENTER"
  | "APROVISIONAMENTO";

interface ItemContexto {
  chave: string;
  tipo: TipoItemContexto;
  etiqueta: string;
  descricao: string;
  id: number | null;
  destaque?: boolean;
}

interface BarraContextoPOSProps {
  contexto: ContextoPostoDados | null;

  idSala?: number | null;
  descricaoSala?: string | null;

  className?: string;

  /**
   * Distância, em píxeis, entre o topo da janela e a barra.
   *
   * Na página principal:
   * - 64 px do cabeçalho;
   * - 64 px da linha das salas;
   * - total: 128 px.
   *
   * No editor da mesa:
   * - 64 px do cabeçalho;
   * - total: 64 px.
   */
  topOffset?: number;

  /**
   * Quando verdadeiro, apresenta também a lista de
   * aprovisionamento, caso esteja configurada.
   */
  mostrarAprovisionamento?: boolean;
}

function normalizarDescricao(
  descricao: string | null | undefined,
): string {
  return descricao?.trim() ?? "";
}

function resolverDescricao(
  descricao: string | null | undefined,
  id: number | null | undefined,
): string {
  const descricaoNormalizada =
    normalizarDescricao(descricao);

  if (descricaoNormalizada) {
    return descricaoNormalizada;
  }

  if (
    typeof id === "number" &&
    Number.isInteger(id) &&
    id > 0
  ) {
    return "Descrição não disponível";
  }

  return "Não configurado";
}

function classesPorTipo(
  tipo: TipoItemContexto,
  destaque: boolean,
): {
  cartao: string;
  icone: string;
  etiqueta: string;
} {
  if (destaque) {
    return {
      cartao:
        "border-blue-200 bg-blue-50/90 shadow-blue-100/60",
      icone:
        "bg-blue-600 text-white",
      etiqueta:
        "text-blue-700",
    };
  }

  switch (tipo) {
    case "SALA":
      return {
        cartao:
          "border-emerald-200 bg-emerald-50/80 shadow-emerald-100/50",
        icone:
          "bg-emerald-600 text-white",
        etiqueta:
          "text-emerald-700",
      };

    case "CLASSE":
      return {
        cartao:
          "border-violet-200 bg-violet-50/70 shadow-violet-100/50",
        icone:
          "bg-violet-600 text-white",
        etiqueta:
          "text-violet-700",
      };

    case "CAIXA":
      return {
        cartao:
          "border-amber-200 bg-amber-50/70 shadow-amber-100/50",
        icone:
          "bg-amber-500 text-white",
        etiqueta:
          "text-amber-700",
      };

    default:
      return {
        cartao:
          "border-slate-200 bg-white shadow-slate-200/60",
        icone:
          "bg-slate-100 text-slate-600",
        etiqueta:
          "text-slate-500",
      };
  }
}

function IconeContexto({
  tipo,
}: {
  tipo: TipoItemContexto;
}) {
  const classe =
    "h-4 w-4";

  switch (tipo) {
    case "POSTO":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={classe}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 21v-5h6v5M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"
          />
        </svg>
      );

    case "SALA":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={classe}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4h16v16H4z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 20V9h6v11M12 14h.01"
          />
        </svg>
      );

    case "CENTRO":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={classe}
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
            strokeLinejoin="round"
            d="M12 7v5l3 2"
          />
        </svg>
      );

    case "CLASSE":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={classe}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"
          />
        </svg>
      );

    case "CAIXA":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={classe}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7h16v12H4zM7 7V4h10v3"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h8M8 15h5"
          />
        </svg>
      );

    case "PROFIT_CENTER":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={classe}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v18M17 7.5C17 5.6 15 4 12.5 4S8 5.3 8 7s1.7 2.5 4.5 3S17 11.6 17 14s-2 4-4.5 4S8 16.4 8 14.5"
          />
        </svg>
      );

    case "APROVISIONAMENTO":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={classe}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7 12 3l8 4-8 4-8-4Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4 12 8 4 8-4M4 17l8 4 8-4"
          />
        </svg>
      );
  }
}

function CartaoContexto({
  item,
}: {
  item: ItemContexto;
}) {
  const classes =
    classesPorTipo(
      item.tipo,
      Boolean(item.destaque),
    );

  const tituloTecnico =
    item.id && item.id > 0
      ? `${item.etiqueta}: ${item.descricao} · ID ${item.id}`
      : `${item.etiqueta}: ${item.descricao}`;

  return (
    <div
      title={tituloTecnico}
      className={[
        "flex h-14 min-w-[170px] shrink-0 items-center gap-3 rounded-xl border px-3 shadow-sm",
        classes.cartao,
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          classes.icone,
        ].join(" ")}
      >
        <IconeContexto
          tipo={item.tipo}
        />
      </span>

      <span className="min-w-0">
        <span
          className={[
            "block text-[9px] font-black uppercase tracking-[0.16em]",
            classes.etiqueta,
          ].join(" ")}
        >
          {item.etiqueta}
        </span>

        <strong className="mt-0.5 block truncate text-sm font-black text-slate-900">
          {item.descricao}
        </strong>
      </span>
    </div>
  );
}

function BarraContextoCarregamento() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({
        length: 5,
      }).map((_, indice) => (
        <div
          key={indice}
          className="h-14 min-w-[170px] animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

export default function BarraContextoPOS({
  contexto,
  idSala = null,
  descricaoSala = null,
  className = "",
  topOffset = 64,
  mostrarAprovisionamento = false,
}: BarraContextoPOSProps) {
  const itens: ItemContexto[] =
    contexto
      ? [
          {
            chave: "posto",
            tipo: "POSTO",
            etiqueta: "Posto",
            descricao:
              resolverDescricao(
                contexto.posto.descricao,
                contexto.posto.idPosto,
              ),
            id:
              contexto.posto.idPosto,
            destaque: true,
          },

          ...(descricaoSala || idSala
            ? [
                {
                  chave: "sala",
                  tipo:
                    "SALA" as const,
                  etiqueta: "Sala",
                  descricao:
                    resolverDescricao(
                      descricaoSala,
                      idSala,
                    ),
                  id: idSala,
                },
              ]
            : []),

          {
            chave: "centro",
            tipo: "CENTRO",
            etiqueta:
              "Centro de exploração",
            descricao:
              resolverDescricao(
                contexto.operacao
                  .descricaoCentroExploracao,
                contexto.operacao
                  .idCentroExploracao,
              ),
            id:
              contexto.operacao
                .idCentroExploracao,
          },

          {
            chave: "classe",
            tipo: "CLASSE",
            etiqueta:
              "Classe de preços",
            descricao:
              resolverDescricao(
                contexto.operacao
                  .descricaoClassePrecos,
                contexto.operacao
                  .idClassePrecos,
              ),
            id:
              contexto.operacao
                .idClassePrecos,
          },

          {
            chave: "caixa",
            tipo: "CAIXA",
            etiqueta: "Caixa",
            descricao:
              resolverDescricao(
                contexto.operacao
                  .descricaoCaixa,
                contexto.operacao
                  .idCaixa,
              ),
            id:
              contexto.operacao.idCaixa,
          },

          {
            chave: "profit-center",
            tipo: "PROFIT_CENTER",
            etiqueta: "Profit center",
            descricao:
              resolverDescricao(
                contexto.operacao
                  .descricaoProfitCenter,
                contexto.operacao
                  .idProfitCenter,
              ),
            id:
              contexto.operacao
                .idProfitCenter,
          },

          ...(mostrarAprovisionamento &&
          (
            contexto.operacao
              .idListaAprovisionamento >
              0 ||
            normalizarDescricao(
              contexto.operacao
                .descricaoListaAprovisionamento,
            )
          )
            ? [
                {
                  chave:
                    "aprovisionamento",
                  tipo:
                    "APROVISIONAMENTO" as const,
                  etiqueta:
                    "Aprovisionamento",
                  descricao:
                    resolverDescricao(
                      contexto.operacao
                        .descricaoListaAprovisionamento,
                      contexto.operacao
                        .idListaAprovisionamento,
                    ),
                  id:
                    contexto.operacao
                      .idListaAprovisionamento,
                },
              ]
            : []),
        ]
      : [];

  return (
    <section
      aria-label="Contexto operacional do POS"
      style={{
        top: `${topOffset}px`,
      }}
      className={[
        "fixed inset-x-0 z-40 h-20 overflow-hidden border-b border-slate-200/90 bg-slate-100/95 px-3 py-2 shadow-sm backdrop-blur-md sm:px-5 lg:px-6",
        className,
      ].join(" ")}
    >
      <div className="mx-auto max-w-[1920px]">
        {contexto ? (
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin]">
            {itens.map((item) => (
              <CartaoContexto
                key={item.chave}
                item={item}
              />
            ))}
          </div>
        ) : (
          <BarraContextoCarregamento />
        )}
      </div>
    </section>
  );
}