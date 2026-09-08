//app\components\pos\pagamentos\PagamentoConfirmacaoModal.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  POSMobilePagamentoDescontoOpcao,
  POSMobilePagamentoMotivoDesconto,
  POSMobilePrepararPagamentoDados,
} from "@/types/pos-mobile-pagamentos";


/* ============================================================================
 * TIPOS LOCAIS
 * ========================================================================== */

export interface PagamentoConfirmacaoCliente {
  idEntidade: number;

  /**
   * Nome apresentado no cartão do cliente.
   *
   * Exemplo:
   *   Consumidor Final
   *   João Silva
   */
  nome: string;

  /**
   * Opcional.
   * Pode ser apresentado quando o cliente selecionado tiver NIF.
   */
  nif?: string | null;
}


export interface PagamentoConfirmacaoValores {
  idTipoServico: number;
  idTipoRefeicao: number;
  idMercado: number;

  /**
   * IMPORTANTE:
   *
   * - Desconto automático:
   *     enviar 0.
   *     A APIFNT volta a resolver o desconto através do método de pagamento.
   *
   * - Desconto escolhido pelo operador:
   *     enviar o ID selecionado.
   */
  idTipoDesconto: number;

  idMotivoDesconto: number;
  justificacaoDesconto: string;

  referencia: string;
  valorEntregue: number;
}


interface Props {
  open: boolean;

  dados: POSMobilePrepararPagamentoDados | null;

  cliente: PagamentoConfirmacaoCliente | null;

  busy?: boolean;

  onClose: () => void;

  onConfirm: (
    valores: PagamentoConfirmacaoValores,
  ) => void | Promise<void>;
}


/* ============================================================================
 * HELPERS
 * ========================================================================== */

function formatarMoeda(
  valor: number,
): string {
  return new Intl.NumberFormat(
    "pt-PT",
    {
      style: "currency",
      currency: "EUR",
    },
  ).format(
    Number.isFinite(valor)
      ? valor
      : 0,
  );
}


function numeroPositivo(
  valor: number,
): boolean {
  return (
    Number.isFinite(valor) &&
    valor > 0
  );
}


function encontrarDesconto(
  dados: POSMobilePrepararPagamentoDados,
  idDesconto: number,
): POSMobilePagamentoDescontoOpcao | null {
  if (idDesconto <= 0) {
    return null;
  }

  return (
    dados.desconto.opcoes.find(
      (item) =>
        item.id === idDesconto,
    ) ?? null
  );
}


function encontrarMotivo(
  motivos: POSMobilePagamentoMotivoDesconto[],
  idMotivo: number,
): POSMobilePagamentoMotivoDesconto | null {
  if (idMotivo <= 0) {
    return null;
  }

  return (
    motivos.find(
      (item) =>
        item.id === idMotivo,
    ) ?? null
  );
}


/* ============================================================================
 * COMPONENTE
 * ========================================================================== */

export default function PagamentoConfirmacaoModal({
  open,
  dados,
  cliente,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const dialogRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    idTipoServico,
    setIdTipoServico,
  ] = useState(0);

  const [
    idTipoRefeicao,
    setIdTipoRefeicao,
  ] = useState(0);

  const [
    idMercado,
    setIdMercado,
  ] = useState(0);

  const [
    idTipoDesconto,
    setIdTipoDesconto,
  ] = useState(0);

  const [
    idMotivoDesconto,
    setIdMotivoDesconto,
  ] = useState(0);

  const [
    justificacaoDesconto,
    setJustificacaoDesconto,
  ] = useState("");

  const [
    referencia,
    setReferencia,
  ] = useState("");

  const [
    valorEntregueTexto,
    setValorEntregueTexto,
  ] = useState("");

  const [
    erroLocal,
    setErroLocal,
  ] = useState("");


  /* ==========================================================================
   * INICIALIZAÇÃO
   * ======================================================================== */

  useEffect(() => {
    if (
      !open ||
      !dados
    ) {
      return;
    }

    setIdTipoServico(
      dados.predefinidos.idTipoServico ??
        0,
    );

    setIdTipoRefeicao(
      dados.predefinidos.idTipoRefeicao ??
        0,
    );

    setIdMercado(
      dados.predefinidos.idMercado ??
        0,
    );

    /*
     * Num desconto automático NÃO utilizamos o ID devolvido
     * como autoridade no pedido final.
     *
     * A APIFNT volta a resolver o desconto pelo botão de pagamento.
     */
    if (
      dados.desconto.automatico
    ) {
      setIdTipoDesconto(0);
    } else {
      setIdTipoDesconto(
        dados.predefinidos
          .idTipoDesconto ?? 0,
      );
    }

    setIdMotivoDesconto(0);

    setJustificacaoDesconto("");

    setReferencia("");

    setValorEntregueTexto("");

    setErroLocal("");
  }, [
    open,
    dados,
  ]);


  /* ==========================================================================
   * ESC PARA FECHAR
   * ======================================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        !busy
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    busy,
    onClose,
  ]);


  /* ==========================================================================
   * FOCO INICIAL
   * ======================================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          dialogRef.current?.focus();
        },
        0,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [open]);


  /* ==========================================================================
   * DESCONTO ATUAL
   * ======================================================================== */

  const descontoSelecionado =
    useMemo(() => {
      if (!dados) {
        return null;
      }

      if (
        dados.desconto.automatico
      ) {
        return {
          id:
            dados.desconto
              .idDesconto,

          descricao:
            dados.desconto
              .descricao,

          percentagem:
            dados.desconto
              .percentagem,

          pedeMotivo:
            dados.desconto
              .pedeMotivo,

          obrigaJustificacao:
            dados.desconto
              .obrigaJustificacao,

          idTipoServicoAssociado:
            dados.desconto
              .idTipoServicoAssociado,

          motivos:
            dados.desconto
              .motivos,
        } satisfies POSMobilePagamentoDescontoOpcao;
      }

      return encontrarDesconto(
        dados,
        idTipoDesconto,
      );
    }, [
      dados,
      idTipoDesconto,
    ]);


  const motivosDisponiveis =
    descontoSelecionado?.motivos ??
    [];


  const motivoSelecionado =
    useMemo(
      () =>
        encontrarMotivo(
          motivosDisponiveis,
          idMotivoDesconto,
        ),
      [
        motivosDisponiveis,
        idMotivoDesconto,
      ],
    );


  const descontoPedeMotivo =
    Boolean(
      descontoSelecionado
        ?.pedeMotivo,
    );


  const descontoObrigaJustificacao =
    Boolean(
      descontoSelecionado
        ?.obrigaJustificacao,
    ) ||
    Boolean(
      motivoSelecionado
        ?.obrigaJustificacao,
    );


  /* ==========================================================================
   * VALOR ENTREGUE / TROCO
   * ======================================================================== */

  const valorEntregue =
    useMemo(() => {
      const texto =
        valorEntregueTexto
          .trim()
          .replace(",", ".");

      if (texto === "") {
        return 0;
      }

      const valor =
        Number(texto);

      return Number.isFinite(valor)
        ? valor
        : 0;
    }, [
      valorEntregueTexto,
    ]);


  const trocoEstimado =
    useMemo(() => {
      if (!dados) {
        return 0;
      }

      if (
        !dados.requisitos
          .pedeValorEntregue
      ) {
        return 0;
      }

      if (
        valorEntregue <=
        dados.valor
      ) {
        return 0;
      }

      return (
        valorEntregue -
        dados.valor
      );
    }, [
      dados,
      valorEntregue,
    ]);


  /* ==========================================================================
   * ESTIMATIVA DO TOTAL APÓS DESCONTO
   * ========================================================================
   *
   * É apenas informativa.
   *
   * O total final continua a ser calculado e validado pela APIFNT.
   * ======================================================================== */

  const valorAposDescontoEstimado =
    useMemo(() => {
      if (
        !dados ||
        !descontoSelecionado
      ) {
        return dados?.valor ?? 0;
      }

      const percentagem =
        descontoSelecionado
          .percentagem;

      if (
        !Number.isFinite(
          percentagem,
        ) ||
        percentagem <= 0
      ) {
        return dados.valor;
      }

      const percentualAplicado =
        Math.min(
          Math.max(
            percentagem,
            0,
          ),
          100,
        );

      return Math.max(
        0,
        dados.valor *
          (
            1 -
            percentualAplicado /
              100
          ),
      );
    }, [
      dados,
      descontoSelecionado,
    ]);


  /* ==========================================================================
   * ALTERAR DESCONTO
   * ======================================================================== */

  const handleAlterarDesconto = (
    novoID: number,
  ) => {
    setIdTipoDesconto(
      novoID,
    );

    setIdMotivoDesconto(0);

    setJustificacaoDesconto("");

    setErroLocal("");

    if (!dados) {
      return;
    }

    const novoDesconto =
      encontrarDesconto(
        dados,
        novoID,
      );

    /*
     * Alguns descontos podem determinar automaticamente
     * o Tipo de Serviço.
     */
    if (
      novoDesconto &&
      novoDesconto
        .idTipoServicoAssociado >
        0
    ) {
      setIdTipoServico(
        novoDesconto
          .idTipoServicoAssociado,
      );
    } else {
      setIdTipoServico(
        dados.predefinidos
          .idTipoServico ?? 0,
      );
    }
  };


  /* ==========================================================================
   * VALIDAR E CONFIRMAR
   * ======================================================================== */

  const handleConfirmar =
    async () => {
      if (
        !dados ||
        !cliente
      ) {
        return;
      }

      setErroLocal("");

      if (
        dados.requisitos
          .pedeTipoServico &&
        !numeroPositivo(
          idTipoServico,
        )
      ) {
        setErroLocal(
          "Selecione o Tipo de Serviço.",
        );

        return;
      }

      if (
        dados.requisitos
          .pedeTipoRefeicao &&
        !numeroPositivo(
          idTipoRefeicao,
        )
      ) {
        setErroLocal(
          "Selecione o Tipo de Refeição.",
        );

        return;
      }

      if (
        dados.requisitos
          .pedeMercado &&
        !numeroPositivo(
          idMercado,
        )
      ) {
        setErroLocal(
          "Selecione o Mercado.",
        );

        return;
      }

      if (
        dados.desconto
          .pedeSelecao &&
        !numeroPositivo(
          idTipoDesconto,
        )
      ) {
        setErroLocal(
          "Selecione o Desconto.",
        );

        return;
      }

      if (
        descontoPedeMotivo &&
        !numeroPositivo(
          idMotivoDesconto,
        )
      ) {
        setErroLocal(
          "Selecione o Motivo do Desconto.",
        );

        return;
      }

      if (
        descontoObrigaJustificacao &&
        justificacaoDesconto
          .trim() === ""
      ) {
        setErroLocal(
          "Preencha a Justificação do Desconto.",
        );

        return;
      }

      if (
        dados.requisitos
          .pedeReferencia &&
        referencia.trim() === ""
      ) {
        setErroLocal(
          "Indique a Referência.",
        );

        return;
      }

      if (
        dados.requisitos
          .pedeValorEntregue
      ) {
        if (
          valorEntregueTexto
            .trim() === ""
        ) {
          setErroLocal(
            "Indique o valor entregue.",
          );

          return;
        }

        if (
          !Number.isFinite(
            valorEntregue,
          ) ||
          valorEntregue <
            dados.valor
        ) {
          setErroLocal(
            "O valor entregue é inferior ao valor a pagar.",
          );

          return;
        }
      }

      /*
       * Desconto automático:
       *
       * enviamos 0 e deixamos a APIFNT voltar a resolver o desconto
       * associado ao método de pagamento.
       */
      const descontoParaPedido =
        dados.desconto.automatico
          ? 0
          : idTipoDesconto;

      await onConfirm({
        idTipoServico,
        idTipoRefeicao,
        idMercado,

        idTipoDesconto:
          descontoParaPedido,

        idMotivoDesconto,
        justificacaoDesconto:
          justificacaoDesconto.trim(),

        referencia:
          referencia.trim(),

        valorEntregue:
          dados.requisitos
            .pedeValorEntregue
            ? valorEntregue
            : 0,
      });
    };


  /* ==========================================================================
   * NÃO RENDERIZAR
   * ======================================================================== */

  if (
    !open ||
    !dados
  ) {
    return null;
  }


  const pagamento =
    dados.pagamento;


  const mostrarBlocoDesconto =
    dados.desconto.temDesconto;


  return (
    <div
      className="
        fixed inset-0 z-[120]
        flex items-center justify-center
        bg-black/45
        px-4 py-6
        backdrop-blur-[1px]
      "
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pagamento-confirmacao-title"
        tabIndex={-1}
        className="
          flex
          max-h-[calc(100vh-3rem)]
          w-full max-w-[520px]
          flex-col
          overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white
          shadow-2xl
          outline-none
        "
      >
        {/* ================================================================
            CABEÇALHO
            ================================================================ */}

        <div
          className="
            flex items-start justify-between
            border-b border-slate-200
            px-5 py-4
          "
        >
          <div className="min-w-0">
            <h2
              id="pagamento-confirmacao-title"
              className="
                text-[17px] font-semibold
                text-slate-900
              "
            >
              Confirmar pagamento
            </h2>

            <p
              className="
                mt-0.5
                text-sm text-slate-500
              "
            >
              Confirme os dados antes de
              finalizar.
            </p>
          </div>

          <button
            type="button"
            aria-label="Fechar"
            disabled={busy}
            onClick={onClose}
            className="
              ml-4
              inline-flex h-9 w-9
              shrink-0 items-center justify-center
              rounded-lg
              text-xl leading-none
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            ×
          </button>
        </div>


        {/* ================================================================
            CONTEÚDO
            ================================================================ */}

        <div
          className="
            overflow-y-auto
            px-5 py-4
          "
        >
          {/* ==============================================================
              MÉTODO + TOTAL
              ============================================================== */}

          <div
            className="
              flex items-center justify-between
              gap-4
              rounded-xl
              border border-slate-200
              bg-slate-50
              px-4 py-3
            "
          >
            <div className="min-w-0">
              <div
                className="
                  text-xs font-medium
                  uppercase tracking-wide
                  text-slate-500
                "
              >
                Método de pagamento
              </div>

              <div
                className="
                  mt-1 truncate
                  text-base font-semibold
                  text-slate-900
                "
              >
                {pagamento.descricao}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div
                className="
                  text-xs
                  text-slate-500
                "
              >
                Total
              </div>

              <div
                className="
                  mt-1
                  text-xl font-bold
                  tabular-nums
                  text-slate-900
                "
              >
                {formatarMoeda(
                  dados.valor,
                )}
              </div>
            </div>
          </div>


          {/* ==============================================================
              CLIENTE
              ============================================================== */}

          <div className="mt-4">
            <div
              className="
                mb-1.5
                text-xs font-semibold
                uppercase tracking-wide
                text-slate-500
              "
            >
              Cliente
            </div>

            <div
              className="
                rounded-xl
                border border-slate-200
                px-4 py-3
              "
            >
              <div
                className="
                  font-medium
                  text-slate-900
                "
              >
                {cliente?.nome ||
                  "Cliente"}
              </div>

              {cliente?.nif ? (
                <div
                  className="
                    mt-0.5
                    text-sm
                    text-slate-500
                  "
                >
                  NIF {cliente.nif}
                </div>
              ) : null}
            </div>
          </div>


          {/* ==============================================================
              DESCONTO
              ============================================================== */}

          {mostrarBlocoDesconto ? (
            <div
              className="
                mt-4
                rounded-xl
                border border-slate-200
                p-4
              "
            >
              <div
                className="
                  flex items-start
                  justify-between gap-3
                "
              >
                <div>
                  <div
                    className="
                      text-xs font-semibold
                      uppercase tracking-wide
                      text-slate-500
                    "
                  >
                    Desconto
                  </div>

                  {dados.desconto
                    .automatico ? (
                    <div
                      className="
                        mt-1
                        text-sm font-semibold
                        text-slate-900
                      "
                    >
                      Desconto automático
                    </div>
                  ) : null}
                </div>

                {descontoSelecionado ? (
                  <div
                    className="
                      rounded-full
                      bg-slate-100
                      px-2.5 py-1
                      text-xs font-semibold
                      text-slate-700
                    "
                  >
                    {descontoSelecionado
                      .percentagem}
                    %
                  </div>
                ) : null}
              </div>


              {/* Seleção do desconto */}

              {dados.desconto
                .pedeSelecao ? (
                <div className="mt-3">
                  <label
                    className="
                      mb-1.5 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Desconto *
                  </label>

                  <select
                    value={
                      idTipoDesconto
                    }
                    disabled={busy}
                    onChange={(
                      event,
                    ) => {
                      handleAlterarDesconto(
                        Number(
                          event.target
                            .value,
                        ),
                      );
                    }}
                    className="
                      h-11 w-full
                      rounded-lg
                      border border-slate-300
                      bg-white px-3
                      text-sm text-slate-900
                      outline-none
                      transition
                      focus:border-slate-500
                      disabled:cursor-not-allowed
                      disabled:bg-slate-100
                    "
                  >
                    <option value={0}>
                      Selecionar desconto...
                    </option>

                    {dados.desconto.opcoes.map(
                      (desconto) => (
                        <option
                          key={
                            desconto.id
                          }
                          value={
                            desconto.id
                          }
                        >
                          {
                            desconto.descricao
                          }
                          {` (${desconto.percentagem}%)`}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              ) : null}


              {/* Desconto automático */}

              {dados.desconto
                .automatico &&
              descontoSelecionado ? (
                <div
                  className="
                    mt-3
                    flex items-center
                    justify-between gap-3
                    rounded-lg
                    bg-slate-50
                    px-3 py-2.5
                  "
                >
                  <span
                    className="
                      text-sm font-medium
                      text-slate-800
                    "
                  >
                    {
                      descontoSelecionado
                        .descricao
                    }
                  </span>

                  <span
                    className="
                      text-sm font-semibold
                      tabular-nums
                      text-slate-900
                    "
                  >
                    {
                      descontoSelecionado
                        .percentagem
                    }
                    %
                  </span>
                </div>
              ) : null}


              {/* Motivo */}

              {descontoPedeMotivo ? (
                <div className="mt-3">
                  <label
                    className="
                      mb-1.5 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Motivo do desconto *
                  </label>

                  <select
                    value={
                      idMotivoDesconto
                    }
                    disabled={busy}
                    onChange={(
                      event,
                    ) => {
                      setIdMotivoDesconto(
                        Number(
                          event.target
                            .value,
                        ),
                      );

                      setJustificacaoDesconto(
                        "",
                      );

                      setErroLocal("");
                    }}
                    className="
                      h-11 w-full
                      rounded-lg
                      border border-slate-300
                      bg-white px-3
                      text-sm text-slate-900
                      outline-none
                      transition
                      focus:border-slate-500
                      disabled:cursor-not-allowed
                      disabled:bg-slate-100
                    "
                  >
                    <option value={0}>
                      Selecionar motivo...
                    </option>

                    {motivosDisponiveis.map(
                      (motivo) => (
                        <option
                          key={
                            motivo.id
                          }
                          value={
                            motivo.id
                          }
                        >
                          {
                            motivo.descricao
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>
              ) : null}


              {/* Justificação */}

              {descontoObrigaJustificacao ? (
                <div className="mt-3">
                  <label
                    className="
                      mb-1.5 block
                      text-sm font-medium
                      text-slate-700
                    "
                  >
                    Justificação *
                  </label>

                  <textarea
                    value={
                      justificacaoDesconto
                    }
                    disabled={busy}
                    rows={3}
                    onChange={(
                      event,
                    ) => {
                      setJustificacaoDesconto(
                        event.target.value,
                      );

                      setErroLocal("");
                    }}
                    placeholder="Indique a justificação do desconto..."
                    className="
                      w-full resize-none
                      rounded-lg
                      border border-slate-300
                      bg-white px-3 py-2.5
                      text-sm text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-slate-500
                      disabled:cursor-not-allowed
                      disabled:bg-slate-100
                    "
                  />
                </div>
              ) : null}


              {descontoSelecionado ? (
                <div
                  className="
                    mt-3
                    flex items-center
                    justify-between
                    border-t border-slate-200
                    pt-3
                  "
                >
                  <span
                    className="
                      text-sm
                      text-slate-500
                    "
                  >
                    Estimativa após desconto
                  </span>

                  <span
                    className="
                      text-base font-bold
                      tabular-nums
                      text-slate-900
                    "
                  >
                    {formatarMoeda(
                      valorAposDescontoEstimado,
                    )}
                  </span>
                </div>
              ) : null}

              {descontoSelecionado ? (
                <p
                  className="
                    mt-1.5
                    text-[11px]
                    leading-4
                    text-slate-400
                  "
                >
                  O total final é
                  recalculado e validado
                  pela APIFNT.
                </p>
              ) : null}
            </div>
          ) : null}


          {/* ==============================================================
              TIPO DE SERVIÇO
              ============================================================== */}

          {dados.requisitos
            .pedeTipoServico ? (
            <div className="mt-4">
              <label
                className="
                  mb-1.5 block
                  text-sm font-medium
                  text-slate-700
                "
              >
                Tipo de Serviço *
              </label>

              <select
                value={
                  idTipoServico
                }
                disabled={busy}
                onChange={(
                  event,
                ) => {
                  setIdTipoServico(
                    Number(
                      event.target.value,
                    ),
                  );

                  setErroLocal("");
                }}
                className="
                  h-11 w-full
                  rounded-lg
                  border border-slate-300
                  bg-white px-3
                  text-sm text-slate-900
                  outline-none
                  transition
                  focus:border-slate-500
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                "
              >
                <option value={0}>
                  Selecionar Tipo de Serviço...
                </option>

                {dados.tiposServico.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.descricao}
                    </option>
                  ),
                )}
              </select>
            </div>
          ) : null}


          {/* ==============================================================
              TIPO DE REFEIÇÃO
              ============================================================== */}

          {dados.requisitos
            .pedeTipoRefeicao ? (
            <div className="mt-4">
              <label
                className="
                  mb-1.5 block
                  text-sm font-medium
                  text-slate-700
                "
              >
                Tipo de Refeição *
              </label>

              <select
                value={
                  idTipoRefeicao
                }
                disabled={busy}
                onChange={(
                  event,
                ) => {
                  setIdTipoRefeicao(
                    Number(
                      event.target.value,
                    ),
                  );

                  setErroLocal("");
                }}
                className="
                  h-11 w-full
                  rounded-lg
                  border border-slate-300
                  bg-white px-3
                  text-sm text-slate-900
                  outline-none
                  transition
                  focus:border-slate-500
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                "
              >
                <option value={0}>
                  Selecionar Tipo de Refeição...
                </option>

                {dados.tiposRefeicao.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.descricao}
                    </option>
                  ),
                )}
              </select>
            </div>
          ) : null}


          {/* ==============================================================
              MERCADO
              ============================================================== */}

          {dados.requisitos
            .pedeMercado ? (
            <div className="mt-4">
              <label
                className="
                  mb-1.5 block
                  text-sm font-medium
                  text-slate-700
                "
              >
                Mercado *
              </label>

              <select
                value={idMercado}
                disabled={busy}
                onChange={(
                  event,
                ) => {
                  setIdMercado(
                    Number(
                      event.target.value,
                    ),
                  );

                  setErroLocal("");
                }}
                className="
                  h-11 w-full
                  rounded-lg
                  border border-slate-300
                  bg-white px-3
                  text-sm text-slate-900
                  outline-none
                  transition
                  focus:border-slate-500
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                "
              >
                <option value={0}>
                  Selecionar Mercado...
                </option>

                {dados.mercados.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.descricao}
                    </option>
                  ),
                )}
              </select>
            </div>
          ) : null}


          {/* ==============================================================
              REFERÊNCIA
              ============================================================== */}

          {dados.requisitos
            .pedeReferencia ? (
            <div className="mt-4">
              <label
                className="
                  mb-1.5 block
                  text-sm font-medium
                  text-slate-700
                "
              >
                Referência *
              </label>

              <input
                type="text"
                value={referencia}
                disabled={busy}
                onChange={(
                  event,
                ) => {
                  setReferencia(
                    event.target.value,
                  );

                  setErroLocal("");
                }}
                placeholder="Indique a referência..."
                className="
                  h-11 w-full
                  rounded-lg
                  border border-slate-300
                  bg-white px-3
                  text-sm text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-slate-500
                  disabled:cursor-not-allowed
                  disabled:bg-slate-100
                "
              />
            </div>
          ) : null}


          {/* ==============================================================
              VALOR ENTREGUE / TROCO
              ============================================================== */}

          {dados.requisitos
            .pedeValorEntregue ? (
            <div
              className="
                mt-4
                rounded-xl
                border border-slate-200
                p-4
              "
            >
              <label
                className="
                  mb-1.5 block
                  text-sm font-medium
                  text-slate-700
                "
              >
                Valor entregue *
              </label>

              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    valorEntregueTexto
                  }
                  disabled={busy}
                  onChange={(
                    event,
                  ) => {
                    const valor =
                      event.target.value;

                    /*
                     * Permitimos apenas dígitos,
                     * ponto e vírgula.
                     */
                    if (
                      /^[0-9]*([.,][0-9]{0,2})?$/.test(
                        valor,
                      ) ||
                      valor === ""
                    ) {
                      setValorEntregueTexto(
                        valor,
                      );

                      setErroLocal("");
                    }
                  }}
                  placeholder="0,00"
                  className="
                    h-12 w-full
                    rounded-lg
                    border border-slate-300
                    bg-white
                    px-3 pr-10
                    text-right
                    text-lg font-semibold
                    tabular-nums
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-300
                    focus:border-slate-500
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                  "
                />

                <span
                  className="
                    pointer-events-none
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-sm font-medium
                    text-slate-400
                  "
                >
                  €
                </span>
              </div>

              <div
                className="
                  mt-3
                  flex items-center
                  justify-between
                "
              >
                <span
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Troco
                </span>

                <span
                  className="
                    text-base font-bold
                    tabular-nums
                    text-slate-900
                  "
                >
                  {formatarMoeda(
                    trocoEstimado,
                  )}
                </span>
              </div>
            </div>
          ) : null}


          {/* ==============================================================
              VALIDAÇÃO FISCAL
              ============================================================== */}

          {/* {dados.requisitos
            .validaDadosFiscais ? (
            <div
              className="
                mt-4
                rounded-xl
                border border-amber-200
                bg-amber-50
                px-4 py-3
              "
            >
              <div
                className="
                  text-sm font-semibold
                  text-amber-900
                "
              >
                Validação fiscal
              </div>

              <p
                className="
                  mt-1
                  text-sm leading-5
                  text-amber-800
                "
              >
                Este documento exige
                validação dos dados
                fiscais. A APIFNT fará
                a validação final antes
                da gravação.
              </p>
            </div>
          ) : null} */}


          {/* ==============================================================
              ERRO LOCAL
              ============================================================== */}

          {erroLocal ? (
            <div
              role="alert"
              className="
                mt-4
                rounded-lg
                border border-red-200
                bg-red-50
                px-3 py-2.5
                text-sm font-medium
                text-red-700
              "
            >
              {erroLocal}
            </div>
          ) : null}
        </div>


        {/* ================================================================
            AÇÕES
            ================================================================ */}

        <div
          className="
            flex items-center justify-end
            gap-2
            border-t border-slate-200
            bg-white
            px-5 py-4
          "
        >
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="
              h-10
              rounded-lg
              border border-slate-300
              bg-white
              px-4
              text-sm font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={
              busy ||
              !cliente
            }
            onClick={
              handleConfirmar
            }
            className="
              h-10
              min-w-[150px]
              rounded-lg
              bg-slate-900
              px-4
              text-sm font-semibold
              text-white
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {busy
              ? "A processar..."
              : `Pagar ${formatarMoeda(
                  dados.valor,
                )}`}
          </button>
        </div>
      </div>
    </div>
  );
}