//app\components\pos\pagamentos\PagamentoDrawer.tsx
"use client";

import ClienteFaturaCard from "@/app/components/pos/pagamentos/ClienteFaturaCard";
import PagamentoMetodoCard from "@/app/components/pos/pagamentos/PagamentoMetodoCard";

import type {
  POSMobileClienteResumo,
} from "@/types/pos-mobile-clientes";

import type {
  POSMobilePagamentoBotao,
} from "@/types/pos-mobile-pagamentos";

interface PagamentoDrawerProps {
  aberto: boolean;

  descricaoMesa: string;

  descricaoConta: string;

  total: number;

  numeroLinhas: number;

  pagamentos:
    POSMobilePagamentoBotao[];

  pagamentosIndisponiveis:
    POSMobilePagamentoBotao[];

  clienteSelecionado:
    | POSMobileClienteResumo
    | null;

  idClienteIndiferenciado:
    number;

  pesquisa: string;

  aCarregar: boolean;

  aEfetuarPagamento: boolean;

  idPagamentoEmProcessamento:
    number | null;

  mensagemErro: string;

  totalConfiguracoes: number;

  onPesquisaChange: (
    valor: string,
  ) => void;

  onSelecionarPagamento: (
    pagamento:
      POSMobilePagamentoBotao,
  ) => void;

  onSelecionarCliente:
    () => void;

  onAtualizar:
    () => void;

  onFechar:
    () => void;
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

export default function PagamentoDrawer({
  aberto,
  descricaoMesa,
  descricaoConta,
  total,
  numeroLinhas,
  pagamentos,
  pagamentosIndisponiveis,
  clienteSelecionado,
  idClienteIndiferenciado,
  pesquisa,
  aCarregar,
  aEfetuarPagamento,
  idPagamentoEmProcessamento,
  mensagemErro,
  totalConfiguracoes,
  onPesquisaChange,
  onSelecionarPagamento,
  onSelecionarCliente,
  onAtualizar,
  onFechar,
}: PagamentoDrawerProps) {
  if (!aberto) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[95]
        bg-slate-950/45
        backdrop-blur-[2px]
      "
    >
      {/* =========================================================
          OVERLAY
          ========================================================= */}

      <button
        type="button"
        aria-label="Fechar pagamentos"
        onClick={onFechar}
        disabled={
          aEfetuarPagamento
        }
        className="
          absolute
          inset-0
          h-full
          w-full
          cursor-default
        "
      />

      {/* =========================================================
          DRAWER
          ========================================================= */}

      <aside
        className="
          absolute
          inset-y-0
          right-0
          flex
          w-full
          max-w-[480px]
          flex-col
          border-l
          border-slate-200
          bg-slate-50
          shadow-[-24px_0_60px_rgba(15,23,42,0.16)]
        "
      >
        {/* =======================================================
            CABEÇALHO
            ======================================================= */}

        <div
          className="
            shrink-0
            border-b
            border-slate-200
            bg-white
            px-5
            py-4
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                Fechar conta
              </p>

              <h2 className="mt-0.5 text-[22px] font-black tracking-tight text-slate-950">
                Pagamento
              </h2>

              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {descricaoMesa}

                {descricaoConta
                  ? ` · ${descricaoConta}`
                  : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={onFechar}
              disabled={
                aCarregar ||
                aEfetuarPagamento
              }
              aria-label="Fechar"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                bg-white
                text-slate-400
                transition
                hover:border-slate-300
                hover:bg-slate-50
                hover:text-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-40
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
                <path
                  strokeLinecap="round"
                  d="M6 6l12 12M18 6 6 18"
                />
              </svg>
            </button>
          </div>

          {/* =====================================================
              TOTAL
              ===================================================== */}

          <div
            className="
              mt-4
              flex
              items-center
              justify-between
              gap-4
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3
            "
          >
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Total a pagar
              </p>

              <p className="mt-1 text-[11px] font-semibold text-emerald-700/70">
                {numeroLinhas}{" "}
                {numeroLinhas === 1
                  ? "linha"
                  : "linhas"}{" "}
                na conta
              </p>
            </div>

            <strong
              className="
                whitespace-nowrap
                text-[28px]
                font-black
                tracking-tight
                text-emerald-950
              "
            >
              {formatarValor(
                total,
              )}
            </strong>
          </div>

          {/* =====================================================
              CLIENTE
              ===================================================== */}

          <div className="mt-3">
            <ClienteFaturaCard
              clienteSelecionado={
                clienteSelecionado
              }
              idClienteIndiferenciado={
                idClienteIndiferenciado
              }
              desativado={
                aEfetuarPagamento
              }
              onSelecionarCliente={
                onSelecionarCliente
              }
            />
          </div>

          {/* =====================================================
              PESQUISA
              ===================================================== */}

          <div className="relative mt-3">
            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-0
                flex
                items-center
                pl-3.5
                text-slate-400
              "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>

            <input
              type="search"
              value={pesquisa}
              disabled={
                aEfetuarPagamento
              }
              onChange={(event) => {
                onPesquisaChange(
                  event.target.value,
                );
              }}
              placeholder="Pesquisar forma de pagamento..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10
                pr-4
                text-xs
                font-semibold
                text-slate-800
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-emerald-500
                focus:bg-white
                focus:ring-4
                focus:ring-emerald-100
                disabled:opacity-50
              "
            />
          </div>
        </div>

        {/* =======================================================
            CONTEÚDO
            ======================================================= */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-4
            py-4
          "
        >
          {aEfetuarPagamento && (
            <div
              className="
                mb-4
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-blue-200
                bg-blue-50
                px-3
                py-2.5
                text-xs
                font-semibold
                text-blue-800
              "
            >
              <span
                className="
                  h-4
                  w-4
                  shrink-0
                  animate-spin
                  rounded-full
                  border-2
                  border-blue-200
                  border-t-blue-600
                "
              />

              A processar pagamento...
            </div>
          )}

          {mensagemErro && (
            <div
              className="
                mb-4
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-3
                py-2.5
                text-xs
                font-semibold
                leading-5
                text-red-700
              "
            >
              {mensagemErro}
            </div>
          )}

          {aCarregar ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="text-center">
                <div
                  className="
                    mx-auto
                    h-9
                    w-9
                    animate-spin
                    rounded-full
                    border-4
                    border-emerald-200
                    border-t-emerald-600
                  "
                />

                <p className="mt-3 text-xs font-bold text-slate-500">
                  A carregar formas de pagamento...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* =================================================
                  CABEÇALHO DA LISTA
                  ================================================= */}

              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    Formas de pagamento
                  </p>

                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    Escolha como pretende pagar.
                  </p>
                </div>

                <span
                  className="
                    rounded-full
                    border
                    border-slate-200
                    bg-white
                    px-2
                    py-0.5
                    text-[9px]
                    font-black
                    text-slate-400
                  "
                >
                  {
                    pagamentos.length
                  }
                </span>
              </div>

              {/* =================================================
                  PAGAMENTOS
                  ================================================= */}

              {pagamentos.length >
              0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {pagamentos.map(
                    (
                      pagamento,
                    ) => (
                      <PagamentoMetodoCard
                        key={
                          pagamento.idInterno
                        }
                        pagamento={
                          pagamento
                        }
                        emProcessamento={
                          idPagamentoEmProcessamento ===
                          pagamento.idInterno
                        }
                        desativado={
                          aEfetuarPagamento
                        }
                        onSelecionar={
                          onSelecionarPagamento
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <div
                  className="
                    rounded-2xl
                    border
                    border-dashed
                    border-slate-300
                    bg-white
                    p-8
                    text-center
                  "
                >
                  <p className="text-sm font-black text-slate-800">
                    Nenhuma forma de pagamento
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Não foram encontrados resultados para a pesquisa.
                  </p>
                </div>
              )}

              {/* =================================================
                  INDISPONÍVEIS
                  ================================================= */}

              {pagamentosIndisponiveis
                .length > 0 && (
                <details className="mt-5">
                  <summary
                    className="
                      cursor-pointer
                      select-none
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-slate-400
                    "
                  >
                    Outras configurações (
                    {
                      pagamentosIndisponiveis.length
                    }
                    )
                  </summary>

                  <div className="mt-2 space-y-1.5">
                    {pagamentosIndisponiveis.map(
                      (
                        pagamento,
                      ) => (
                        <div
                          key={
                            pagamento.idInterno
                          }
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2
                          "
                        >
                          <p
                            className="
                              min-w-0
                              truncate
                              text-xs
                              font-bold
                              text-slate-500
                            "
                          >
                            {
                              pagamento.descricao
                            }
                          </p>

                          <span
                            className="
                              shrink-0
                              text-[9px]
                              font-bold
                              text-slate-400
                            "
                          >
                            {pagamento.multiPagamento
                              ? "Multi-pagamento"
                              : "Sem documento"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </details>
              )}
            </>
          )}
        </div>

        {/* =======================================================
            RODAPÉ
            ======================================================= */}

        <div
          className="
            shrink-0
            border-t
            border-slate-200
            bg-white
            px-4
            py-3
          "
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold text-slate-400">
              {totalConfiguracoes > 0
                ? `${totalConfiguracoes} formas configuradas`
                : "Formas de pagamento do posto"}
            </p>

            <button
              type="button"
              onClick={
                onAtualizar
              }
              disabled={
                aCarregar ||
                aEfetuarPagamento
              }
              className="
                h-9
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-[10px]
                font-black
                text-slate-600
                transition
                hover:border-emerald-300
                hover:bg-emerald-50
                hover:text-emerald-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Atualizar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}