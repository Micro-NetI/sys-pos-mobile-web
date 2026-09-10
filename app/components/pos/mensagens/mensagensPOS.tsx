

import type {
  ReactNode,
} from "react";

import {
  toast,
} from "@heroui/react";

interface MensagemPOSOpcoes {
  titulo: string;
  descricao?: ReactNode;
  duracao?: number;
}

interface MensagemPagamentoSucesso {
  documento: string;
  valor: number;
  pagamento: string;
  cliente: string;
}

interface ConfirmarPagamentoOpcoes {
  valor: number;
  pagamento: string;
  cliente: string;
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

let confirmacaoPagamentoAberta = false;
let confirmacaoPagamentoId: string | null = null;

let confirmacaoImpressaoAberta = false;
let confirmacaoImpressaoId: string | null = null;

export const mensagensPOS = {
  /*
    ==============================================================
    SUCESSO GENÉRICO
    ==============================================================
  */

  sucesso({
    titulo,
    descricao,
    duracao = 4000,
  }: MensagemPOSOpcoes) {
    return toast.success(
      titulo,
      {
        description:
          descricao,

        timeout:
          duracao,
      },
    );
  },

  /*
    ==============================================================
    ERRO GENÉRICO
    ==============================================================
  */

  erro({
    titulo,
    descricao,
    duracao = 6500,
  }: MensagemPOSOpcoes) {
    return toast.danger(
      titulo,
      {
        description:
          descricao,

        timeout:
          duracao,
      },
    );
  },

  /*
    ==============================================================
    AVISO
    ==============================================================
  */

  aviso({
    titulo,
    descricao,
    duracao = 5000,
  }: MensagemPOSOpcoes) {
    return toast.warning(
      titulo,
      {
        description:
          descricao,

        timeout:
          duracao,
      },
    );
  },

  /*
    ==============================================================
    INFORMAÇÃO
    ==============================================================
  */

  info({
    titulo,
    descricao,
    duracao = 4000,
  }: MensagemPOSOpcoes) {
    return toast.info(
      titulo,
      {
        description:
          descricao,

        timeout:
          duracao,
      },
    );
  },

  /*
    ==============================================================
    CONFIRMAR PAGAMENTO
    ==============================================================

    Substitui:

      window.confirm(...)

    O Toast fica aberto até o operador:

      - clicar em Pagar;
      - ou fechar a mensagem.

    Resultado:

      true  -> efetua pagamento
      false -> cancela
  */

confirmarPagamento({
  valor,
  pagamento,
  cliente,
}: ConfirmarPagamentoOpcoes): Promise<boolean> {
  /*
    A confirmação de pagamento é persistente e só deve existir
    uma de cada vez.

    Nesta versão não usamos actionProps/onPress.
    O botão "Pagar" e o botão "Cancelar" são botões React normais
    dentro do conteúdo do Toast, seguindo o padrão já utilizado
    noutro projeto.

    O Toast é fechado explicitamente através de toast.close(id).
  */
  if (confirmacaoPagamentoAberta) {
    console.warn(
      "Confirmação de pagamento ignorada: já existe uma confirmação aberta.",
      {
        valor,
        pagamento,
        cliente,
      },
    );

    return Promise.resolve(false);
  }

  confirmacaoPagamentoAberta = true;

  return new Promise<boolean>(
    (resolve) => {
      let resolvido = false;
      let idToast = "";

      const libertarConfirmacao = () => {
        confirmacaoPagamentoAberta = false;
        confirmacaoPagamentoId = null;
      };

      const concluir = (
        confirmado: boolean,
      ) => {
        if (resolvido) {
          return;
        }

        resolvido = true;
        resolve(confirmado);
      };

      const fecharToast = () => {
        if (idToast) {
          toast.close(idToast);
        }
      };

      try {
        idToast =
          toast.warning(
            "Confirmar pagamento",
            {
              description: (
                <div className="mt-1 space-y-3">
                  <p
                    className="
                      text-sm
                      leading-5
                      text-slate-700
                    "
                  >
                    Confirma o pagamento de{" "}
                    <strong
                      className="
                        font-black
                        text-slate-950
                      "
                    >
                      {formatarValor(
                        valor,
                      )}
                    </strong>{" "}
                    em{" "}
                    <strong
                      className="
                        font-black
                        text-slate-950
                      "
                    >
                      {pagamento}
                    </strong>
                    ?
                  </p>

                  <div
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-3
                      py-2
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-black
                        uppercase
                        tracking-[0.14em]
                        text-slate-400
                      "
                    >
                      Cliente
                    </p>

                    <p
                      className="
                        mt-1
                        truncate
                        text-sm
                        font-bold
                        text-slate-900
                      "
                      title={
                        cliente
                      }
                    >
                      {cliente}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        /*
                          Cancelamos primeiro a Promise e só depois
                          fechamos o Toast. Assim, o onClose não consegue
                          alterar o resultado.
                        */
                        concluir(
                          false,
                        );

                        fecharToast();
                      }}
                      className="
                        h-9
                        rounded-lg
                        border
                        border-slate-200
                        bg-white
                        px-3
                        text-xs
                        font-bold
                        text-slate-600
                        transition
                        hover:bg-slate-100
                      "
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        /*
                          Confirmamos primeiro a Promise e só depois
                          fechamos o Toast. Se o onClose for disparado
                          pelo fecho programático, resolvido já está true.
                        */
                        concluir(
                          true,
                        );

                        fecharToast();
                      }}
                      className="
                        h-9
                        rounded-lg
                        bg-emerald-600
                        px-4
                        text-xs
                        font-black
                        text-white
                        shadow-sm
                        transition
                        hover:bg-emerald-700
                        active:scale-[0.98]
                      "
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ),

              /*
                Persistente:
                não fecha automaticamente por timeout.
              */
              timeout:
                0,

              /*
                Se o utilizador fechar pelo X do próprio Toast,
                consideramos que cancelou o pagamento.

                Quando o Toast é fechado pelos botões acima,
                concluir(...) já foi executado e esta chamada
                não altera o resultado.
              */
              onClose: () => {
                concluir(
                  false,
                );

                libertarConfirmacao();
              },
            },
          );

        confirmacaoPagamentoId =
          idToast;

        console.log(
          "CONFIRMAÇÃO PAGAMENTO: ABERTA",
          {
            idToast,
            valor,
            pagamento,
            cliente,
          },
        );
      } catch (error) {
        libertarConfirmacao();

        console.error(
          "Não foi possível abrir a confirmação de pagamento:",
          error,
        );

        concluir(
          false,
        );
      }
    },
  );
},


  /*
    ==============================================================
    CONFIRMAR IMPRESSÃO DO TALÃO
    ==============================================================

    Resultado:

      true  -> Sim, imprimir depois de a venda estar gravada
      false -> Não imprimir

    A impressão continua fora do EfetuarPagamento.
    Este Toast decide apenas se deve ser feita a chamada posterior
    a solicitarImpressaoVenda(...).
  */

  confirmarImpressao(): Promise<boolean> {
    if (confirmacaoImpressaoAberta) {
      console.warn(
        "Confirmação de impressão ignorada: já existe uma confirmação aberta.",
      );

      return Promise.resolve(false);
    }

    confirmacaoImpressaoAberta = true;

    return new Promise<boolean>(
      (resolve) => {
        let resolvido = false;
        let idToast = "";

        const libertarConfirmacao = () => {
          confirmacaoImpressaoAberta = false;
          confirmacaoImpressaoId = null;
        };

        const concluir = (
          imprimir: boolean,
        ) => {
          if (resolvido) {
            return;
          }

          resolvido = true;
          resolve(imprimir);
        };

        const fecharToast = () => {
          if (idToast) {
            toast.close(idToast);
          }
        };

        try {
          idToast =
            toast.warning(
              "Imprimir talão",
              {
                description: (
                  <div className="mt-1 space-y-3">
                    <p
                      className="
                        text-sm
                        leading-5
                        text-slate-700
                      "
                    >
                      Deseja imprimir o talão?
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          concluir(
                            false,
                          );

                          libertarConfirmacao();

                          fecharToast();
                        }}
                        className="
                          h-9
                          rounded-lg
                          border
                          border-slate-200
                          bg-white
                          px-4
                          text-xs
                          font-bold
                          text-slate-600
                          transition
                          hover:bg-slate-100
                          active:scale-[0.98]
                        "
                      >
                        Não
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          concluir(
                            true,
                          );

                          libertarConfirmacao();

                          fecharToast();
                        }}
                        className="
                          h-9
                          rounded-lg
                          bg-emerald-600
                          px-4
                          text-xs
                          font-black
                          text-white
                          shadow-sm
                          transition
                          hover:bg-emerald-700
                          active:scale-[0.98]
                        "
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                ),

                /*
                  Persistente:
                  não fecha automaticamente por timeout.
                */
                timeout:
                  0,

                /*
                  Fechar pelo X equivale a responder "Não".
                */
                onClose: () => {
                  concluir(
                    false,
                  );

                  libertarConfirmacao();
                },
              },
            );

          confirmacaoImpressaoId =
            idToast;

          console.log(
            "CONFIRMAÇÃO IMPRESSÃO: ABERTA",
            {
              idToast,
            },
          );
        } catch (error) {
          libertarConfirmacao();

          console.error(
            "Não foi possível abrir a confirmação de impressão:",
            error,
          );

          concluir(
            false,
          );
        }
      },
    );
  },

  /*
    ==============================================================
    PAGAMENTO EFETUADO
    ==============================================================
  */

  pagamentoSucesso({
    documento,
    valor,
    pagamento,
    cliente,
  }: MensagemPagamentoSucesso) {
    return toast.success(
      "Pagamento efetuado",
      {
        description: (
          <div className="mt-1 space-y-2">
            <p
              className="
                text-sm
                text-slate-700
              "
            >
              O pagamento foi concluído com sucesso.
            </p>

            <div
              className="
                grid
                grid-cols-[auto_minmax(0,1fr)]
                gap-x-4
                gap-y-1
                text-sm
              "
            >
              <span
                className="
                  text-slate-500
                "
              >
                Documento
              </span>

              <span
                className="
                  font-bold
                  text-slate-900
                "
              >
                {documento}
              </span>

              <span
                className="
                  text-slate-500
                "
              >
                Valor
              </span>

              <span
                className="
                  font-bold
                  text-slate-900
                "
              >
                {formatarValor(
                  valor,
                )}
              </span>

              <span
                className="
                  text-slate-500
                "
              >
                Pagamento
              </span>

              <span
                className="
                  font-bold
                  text-slate-900
                "
              >
                {pagamento}
              </span>

              <span
                className="
                  text-slate-500
                "
              >
                Cliente
              </span>

              <span
                title={
                  cliente
                }
                className="
                  min-w-0
                  truncate
                  font-bold
                  text-slate-900
                "
              >
                {cliente}
              </span>
            </div>
          </div>
        ),

        timeout:
          5000,
      },
    );
  },

  /*
    ==============================================================
    ERRO DE PAGAMENTO
    ==============================================================
  */

  pagamentoErro(
    mensagem: string,
  ) {
    return toast.danger(
      "Não foi possível efetuar o pagamento",
      {
        description:
          mensagem,

        timeout:
          7000,
      },
    );
  },

  /*
    ==============================================================
    CONTA GRAVADA
    ==============================================================
  */

  contaGravada() {
    return toast.success(
      "Conta gravada",
      {
        description:
          "As alterações foram gravadas com sucesso.",

        timeout:
          3500,
      },
    );
  },

  /*
    ==============================================================
    PEDIDO COZINHA
    ==============================================================
  */

  pedidoCozinhaEnviado() {
    return toast.success(
      "Pedido enviado",
      {
        description:
          "Os produtos foram enviados para a cozinha.",

        timeout:
          3500,
      },
    );
  },
};