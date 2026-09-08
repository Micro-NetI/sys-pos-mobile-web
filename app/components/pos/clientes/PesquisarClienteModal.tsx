//app\components\pos\clientes\PesquisarClienteModal.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  POSMobileClienteResumo,
  POSMobilePesquisarClientesResposta,
} from "@/types/pos-mobile-clientes";

import NovoClienteModal from "./NovoClienteModal";

interface PesquisarClienteModalProps {
  aberto: boolean;

  accessToken: string;

  /*
    ID interno da tab_cliente.

    Corresponde a:
      tab_cliente.vnume

    Este valor vem do contexto da API e nunca
    deve ser assumido como 1 no frontend.
  */
  idClienteIndiferenciado: number;

  clienteSelecionado?:
    | POSMobileClienteResumo
    | null;

  onSelecionar: (
    cliente: POSMobileClienteResumo,
  ) => void;

  onFechar: () => void;
}

/*
  Resposta do endpoint específico de obtenção
  de cliente por ID interno.

  O backend deve procurar diretamente por:

    tab_cliente.vnume = idCliente
*/
interface POSMobileObterClienteDados {
  cliente:
    | POSMobileClienteResumo
    | null;
}

interface POSMobileObterClienteResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobileObterClienteDados
    | null;
}

function nomeClienteApresentacao(
  cliente:
    | POSMobileClienteResumo
    | null,
  idClienteIndiferenciado: number,
): string {
  if (!cliente) {
    return "";
  }

  if (
    idClienteIndiferenciado > 0 &&
    cliente.idCliente ===
      idClienteIndiferenciado
  ) {
    return "Consumidor Final";
  }

  return (
    cliente.nome?.trim() ||
    `Cliente ${cliente.idCliente}`
  );
}

export default function PesquisarClienteModal({
  aberto,
  accessToken,
  idClienteIndiferenciado,
  clienteSelecionado,
  onSelecionar,
  onFechar,
}: PesquisarClienteModalProps) {
  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    clientes,
    setClientes,
  ] =
    useState<
      POSMobileClienteResumo[]
    >([]);

  const [
    clienteAtual,
    setClienteAtual,
  ] =
    useState<
      POSMobileClienteResumo | null
    >(
      clienteSelecionado ??
        null,
    );

  const [
    aPesquisar,
    setAPesquisar,
  ] = useState(false);

  const [
    aObterConsumidorFinal,
    setAObterConsumidorFinal,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    pesquisaExecutada,
    setPesquisaExecutada,
  ] = useState(false);


  /*
    ==============================================================
    NOVO CLIENTE
    ==============================================================

    O modal de criação é controlado aqui dentro.

    Vantagem:
      - a page da mesa não precisa de conhecer o estado
        interno do fluxo de criação;
      - o botão "+ Novo cliente" abre diretamente
        NovoClienteModal;
      - depois da criação utilizamos o mesmo
        onSelecionar já existente.
  */
  const [
    mostrarNovoCliente,
    setMostrarNovoCliente,
  ] = useState(false);

  /*
    Número sequencial da pesquisa atual.

    Evita que uma resposta antiga, mais lenta,
    substitua os resultados de uma pesquisa
    mais recente.

    É especialmente importante no Mobile,
    onde a latência de rede pode variar mais.
  */
  const pesquisaAtualRef =
    useRef(0);

  /*
    ==============================================================
    SINCRONIZAR CLIENTE SELECIONADO
    ==============================================================
  */

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setClienteAtual(
      clienteSelecionado ??
        null,
    );
  }, [
    aberto,
    clienteSelecionado,
  ]);

  /*
    ==============================================================
    LIMPAR ESTADO AO FECHAR
    ==============================================================
  */

  useEffect(() => {
    if (aberto) {
      return;
    }

    /*
      Invalida qualquer resposta de pesquisa
      que ainda esteja em trânsito.
    */
    pesquisaAtualRef.current +=
      1;

    setPesquisa("");
    setClientes([]);
    setErro("");
    setPesquisaExecutada(
      false,
    );
    setAPesquisar(false);
    setAObterConsumidorFinal(
      false,
    );

    setMostrarNovoCliente(
      false,
    );
  }, [aberto]);

  /*
    ==============================================================
    PESQUISA AUTOMÁTICA
    ==============================================================
  */

  useEffect(() => {
    if (!aberto) {
      return;
    }

    const valor =
      pesquisa.trim();

    if (valor === "") {
      /*
        Invalida pesquisas anteriores.

        Se a resposta antiga chegar depois de o
        operador limpar o campo, não voltará a
        preencher a lista.
      */
      pesquisaAtualRef.current +=
        1;

      setClientes([]);
      setErro("");
      setPesquisaExecutada(
        false,
      );
      setAPesquisar(false);

      return;
    }

    /*
      Para pesquisa por nome exigimos pelo
      menos dois caracteres.

      Um valor numérico pode corresponder:
        - ao ID interno;
        - ao NIF/NIPC.

      O backend continua a decidir a pesquisa.
    */
    if (
      valor.length < 2 &&
      !/^\d+$/.test(valor)
    ) {
      pesquisaAtualRef.current +=
        1;

      setClientes([]);
      setErro("");
      setPesquisaExecutada(
        false,
      );
      setAPesquisar(false);

      return;
    }

    const temporizador =
      window.setTimeout(
        () => {
          void pesquisarClientes(
            valor,
          );
        },
        300,
      );

    return () => {
      window.clearTimeout(
        temporizador,
      );
    };
  }, [
    pesquisa,
    aberto,
  ]);

  /*
    ==============================================================
    PESQUISAR CLIENTES
    ==============================================================
  */

  async function pesquisarClientes(
    valorPesquisa: string,
  ): Promise<void> {
    const token =
      accessToken.trim();

    const numeroPesquisa =
      pesquisaAtualRef.current +
      1;

    pesquisaAtualRef.current =
      numeroPesquisa;

    if (token === "") {
      setClientes([]);

      setErro(
        "A sessão não possui um token válido.",
      );

      setPesquisaExecutada(
        true,
      );

      return;
    }

    setAPesquisar(true);
    setErro("");

    try {
      const resposta =
        await fetch(
          "/api/pos-mobile/clientes/pesquisar",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache: "no-store",

            body: JSON.stringify({
              accessToken:
                token,

              pesquisa:
                valorPesquisa,

              limite:
                50,
            }),
          },
        );

      const resultado =
        (await resposta.json()) as
          POSMobilePesquisarClientesResposta;

      /*
        Existe já uma pesquisa mais recente.

        Ignoramos esta resposta.
      */
      if (
        numeroPesquisa !==
        pesquisaAtualRef.current
      ) {
        return;
      }

      if (
        !resposta.ok ||
        !resultado.sucesso
      ) {
        setClientes([]);

        setErro(
          resultado.mensagem ||
            "Não foi possível pesquisar clientes.",
        );

        setPesquisaExecutada(
          true,
        );

        return;
      }

      setClientes(
        resultado.dados
          ?.clientes ?? [],
      );

      setPesquisaExecutada(
        true,
      );
    } catch (error) {
      if (
        numeroPesquisa !==
        pesquisaAtualRef.current
      ) {
        return;
      }

      console.error(
        "Erro ao pesquisar clientes:",
        error,
      );

      setClientes([]);

      setErro(
        "Não foi possível comunicar com o serviço de clientes.",
      );

      setPesquisaExecutada(
        true,
      );
    } finally {
      if (
        numeroPesquisa ===
        pesquisaAtualRef.current
      ) {
        setAPesquisar(false);
      }
    }
  }

  /*
    ==============================================================
    CONFIRMAR CLIENTE SELECIONADO
    ==============================================================
  */

  function confirmarSelecao() {
    if (!clienteAtual) {
      return;
    }

    onSelecionar(
      clienteAtual,
    );
  }

  /*
    ==============================================================
    CONSUMIDOR FINAL
    ==============================================================

    ATENÇÃO:

      idClienteIndiferenciado corresponde ao ID interno:

        tab_cliente.vnume

      NÃO corresponde ao NIF.

      O NIF está em:

        tab_cliente.vcont

      Portanto não usamos a pesquisa genérica para resolver
      o Consumidor Final.

      Fazemos uma obtenção direta pelo ID interno.
  */

  async function selecionarConsumidorFinal(): Promise<void> {
    if (
      !Number.isInteger(
        idClienteIndiferenciado,
      ) ||
      idClienteIndiferenciado <= 0
    ) {
      setErro(
        "Não existe cliente indiferenciado configurado.",
      );

      return;
    }

    const token =
      accessToken.trim();

    if (token === "") {
      setErro(
        "A sessão não possui um token válido.",
      );

      return;
    }

    setAObterConsumidorFinal(
      true,
    );
    setErro("");

    try {
      const resposta =
        await fetch(
          "/api/pos-mobile/clientes/obter",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache: "no-store",

            body: JSON.stringify({
              accessToken:
                token,

              /*
                ID interno da tab_cliente:

                  tab_cliente.vnume
              */
              idCliente:
                idClienteIndiferenciado,
            }),
          },
        );

      const resultado =
        (await resposta.json()) as
          POSMobileObterClienteResposta;

      if (
        !resposta.ok ||
        !resultado.sucesso
      ) {
        setErro(
          resultado.mensagem ||
            "Não foi possível obter o Consumidor Final.",
        );

        return;
      }

      const cliente =
        resultado.dados
          ?.cliente ??
        null;

      if (!cliente) {
        setErro(
          "O cliente indiferenciado configurado não foi encontrado.",
        );

        return;
      }

      /*
        Segurança adicional:

        o endpoint pediu exatamente o cliente configurado,
        logo a resposta deve obrigatoriamente devolver o
        mesmo ID interno.
      */
      if (
        cliente.idCliente !==
        idClienteIndiferenciado
      ) {
        console.error(
          "Cliente indiferenciado inesperado:",
          {
            esperado:
              idClienteIndiferenciado,

            recebido:
              cliente.idCliente,

            cliente,
          },
        );

        setErro(
          "O cliente devolvido não corresponde ao cliente indiferenciado configurado.",
        );

        return;
      }

      setClienteAtual(
        cliente,
      );

      /*
        Consumidor Final é uma seleção imediata.

        Não obrigamos o operador a clicar novamente
        no botão Selecionar.
      */
      onSelecionar(
        cliente,
      );
    } catch (error) {
      console.error(
        "Erro ao obter cliente indiferenciado:",
        error,
      );

      setErro(
        "Não foi possível obter o Consumidor Final.",
      );
    } finally {
      setAObterConsumidorFinal(
        false,
      );
    }
  }

  /*
    ==============================================================
    TEXTO DE AJUDA
    ==============================================================
  */

  const textoAjuda =
    useMemo(() => {
      const valor =
        pesquisa.trim();

      if (valor === "") {
        return "Pesquise por nome, NIF/NIPC ou ID.";
      }

      if (
        valor.length < 2 &&
        !/^\d+$/.test(valor)
      ) {
        return "Introduza pelo menos 2 caracteres.";
      }

      return "";
    }, [pesquisa]);

  const totalResultados =
    clientes.length;

  /*
    ==============================================================
    RENDER
    ==============================================================
  */

  if (!aberto) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-stretch
        justify-center
        bg-black/50
        p-0
        sm:items-center
        sm:p-4
      "
      onMouseDown={(event) => {
        /*
          No Mobile o modal ocupa o ecrã completo,
          portanto o backdrop não é uma ação relevante.

          No desktop mantemos o comportamento já existente.
        */
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      {/* ========================================================
          MODAL

          MOBILE-FIRST:
            - ocupa todo o ecrã no telefone;
            - sem cantos arredondados no telefone;
            - no tablet/desktop volta ao formato de modal;
            - apenas a área de resultados cresce e faz scroll.
          ======================================================== */}

      <div
        className="
          flex
          h-dvh
          w-full
          flex-col
          overflow-hidden
          bg-white
          shadow-2xl

          sm:h-[min(720px,calc(100dvh-32px))]
          sm:max-w-5xl
          sm:rounded-2xl
        "
      >
        {/* ======================================================
            CABEÇALHO
            ====================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-3
            border-b
            border-slate-200
            px-4
            py-3
            sm:px-5
          "
        >
          <div className="min-w-0">
            <h2
              className="
                truncate
                text-base
                font-semibold
                text-slate-900
                sm:text-lg
              "
            >
              Selecionar cliente
            </h2>

            <p
              className="
                mt-0.5
                truncate
                text-xs
                text-slate-500
              "
            >
              Pesquise ou crie uma nova ficha.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onFechar
            }
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-2xl
              leading-none
              text-slate-500
              transition
              active:bg-slate-200
              hover:bg-slate-100
              hover:text-slate-900
            "
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* ======================================================
            PESQUISA + AÇÕES
            ====================================================== */}

        <div
          className="
            shrink-0
            border-b
            border-slate-200
            bg-slate-50
            p-3
            sm:p-4
          "
        >
          {/*
            No Mobile a pesquisa ocupa sempre uma linha inteira.

            As duas ações ficam logo abaixo em duas colunas,
            mantendo alvos de toque grandes.

            A partir de lg ficam todas na mesma linha.
          */}
          <div
            className="
              grid
              grid-cols-2
              gap-2
              lg:grid-cols-[minmax(0,1fr)_auto_auto]
            "
          >
            <div
              className="
                relative
                col-span-2
                lg:col-span-1
              "
            >
              <input
                autoFocus
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={
                  pesquisa
                }
                onChange={(
                  event,
                ) => {
                  setPesquisa(
                    event.target
                      .value,
                  );

                  setErro("");
                }}
                placeholder="Nome, NIF/NIPC ou ID..."
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  pr-11
                  text-base
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  sm:text-sm
                "
              />

              {aPesquisar && (
                <div
                  className="
                    absolute
                    right-3.5
                    top-1/2
                    -translate-y-1/2
                  "
                  aria-label="A pesquisar"
                >
                  <div
                    className="
                      h-5
                      w-5
                      animate-spin
                      rounded-full
                      border-2
                      border-slate-300
                      border-t-blue-600
                    "
                  />
                </div>
              )}
            </div>

            {/* ==================================================
                CONSUMIDOR FINAL

                O ID vem do ContextoPosto.
                ================================================== */}

            <button
              type="button"
              disabled={
                aObterConsumidorFinal ||
                !Number.isInteger(
                  idClienteIndiferenciado,
                ) ||
                idClienteIndiferenciado <=
                  0
              }
              onClick={() => {
                void selecionarConsumidorFinal();
              }}
              className="
                h-12
                min-w-0
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                px-3
                text-sm
                font-bold
                text-emerald-700
                transition
                active:scale-[0.99]
                active:bg-emerald-200
                hover:border-emerald-300
                hover:bg-emerald-100
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:px-4
              "
            >
              {aObterConsumidorFinal
                ? "A obter..."
                : "Consumidor Final"}
            </button>

            {/* ==================================================
                NOVO CLIENTE

                Abre o NovoClienteModal.

                O próprio NovoClienteModal:
                  - prepara a ficha;
                  - carrega países;
                  - adapta Particular / Empresa;
                  - cria o cliente;
                  - devolve o cliente persistido.
                ================================================== */}

            <button
              type="button"
              onClick={() => {
                setMostrarNovoCliente(
                  true,
                );
              }}
              className="
                h-12
                min-w-0
                rounded-xl
                border
                border-blue-200
                bg-blue-50
                px-3
                text-sm
                font-bold
                text-blue-700
                transition
                active:scale-[0.99]
                active:bg-blue-200
                hover:border-blue-300
                hover:bg-blue-100
                sm:px-4
              "
            >
              + Novo cliente
            </button>
          </div>

          <div
            className="
              mt-2
              flex
              min-h-5
              items-center
              justify-between
              gap-2
            "
          >
            {textoAjuda !== "" ? (
              <p
                className="
                  truncate
                  text-xs
                  text-slate-500
                "
              >
                {textoAjuda}
              </p>
            ) : (
              <span />
            )}

            {pesquisaExecutada &&
              erro === "" && (
                <span
                  className="
                    shrink-0
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  {totalResultados}{" "}
                  {totalResultados === 1
                    ? "resultado"
                    : "resultados"}
                </span>
              )}
          </div>

          {erro !== "" && (
            <div
              className="
                mt-2
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-3
                py-2.5
                text-sm
                font-semibold
                text-red-700
              "
              role="alert"
            >
              {erro}
            </div>
          )}
        </div>

        {/* ======================================================
            RESULTADOS

            MOBILE:
              lista compacta, touch-friendly.

            TABLET/DESKTOP (md+):
              tabela para leitura/comparação rápida.

            É a única zona que cresce e faz scroll.
            ====================================================== */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            bg-white
          "
        >
          {!pesquisaExecutada &&
            clientes.length ===
              0 && (
              <div
                className="
                  flex
                  h-full
                  min-h-48
                  items-center
                  justify-center
                  px-6
                  text-center
                "
              >
                <div>
                  <div
                    className="
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Pesquisar cliente
                  </div>

                  <div
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    Comece a escrever o nome,
                    NIF/NIPC ou ID.
                  </div>
                </div>
              </div>
            )}

          {pesquisaExecutada &&
            !aPesquisar &&
            clientes.length ===
              0 &&
            erro === "" && (
              <div
                className="
                  flex
                  h-full
                  min-h-48
                  items-center
                  justify-center
                  px-6
                  text-center
                "
              >
                <div>
                  <div
                    className="
                      text-sm
                      font-semibold
                      text-slate-700
                    "
                  >
                    Nenhum cliente encontrado
                  </div>

                  <div
                    className="
                      mt-1
                      text-xs
                      text-slate-500
                    "
                  >
                    Altere a pesquisa ou utilize
                    “Novo cliente”.
                  </div>
                </div>
              </div>
            )}

          {clientes.length >
            0 && (
            <>
              {/* ================================================
                  MOBILE

                  Não forçamos uma tabela horizontal num telefone.

                  Cada cliente é uma linha compacta com
                  alvo de toque >= 56px.
                  ================================================ */}

              <div
                className="
                  divide-y
                  divide-slate-200
                  md:hidden
                "
              >
                {clientes.map(
                  (
                    cliente,
                  ) => {
                    const selecionado =
                      clienteAtual
                        ?.idCliente ===
                      cliente.idCliente;

                    const nome =
                      nomeClienteApresentacao(
                        cliente,
                        idClienteIndiferenciado,
                      );

                    return (
                      <button
                        type="button"
                        key={
                          cliente.idCliente
                        }
                        onClick={() => {
                          setClienteAtual(
                            cliente,
                          );
                        }}
                        className={`
                          flex
                          min-h-16
                          w-full
                          items-center
                          gap-3
                          px-4
                          py-3
                          text-left
                          transition
                          active:bg-blue-100

                          ${
                            selecionado
                              ? "bg-blue-50"
                              : "bg-white"
                          }
                        `}
                        aria-pressed={
                          selecionado
                        }
                      >
                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <div
                            className="
                              truncate
                              text-sm
                              font-semibold
                              text-slate-900
                            "
                          >
                            {nome}
                          </div>

                          <div
                            className="
                              mt-1
                              flex
                              min-w-0
                              flex-wrap
                              gap-x-2
                              gap-y-0.5
                              text-xs
                              text-slate-500
                            "
                          >
                            <span
                              className="
                                font-medium
                                text-slate-600
                              "
                            >
                              ID{" "}
                              {
                                cliente.idCliente
                              }
                            </span>

                            {cliente.nif && (
                              <span>
                                NIF/NIPC{" "}
                                {
                                  cliente.nif
                                }
                              </span>
                            )}

                            {cliente.localidade && (
                              <span
                                className="
                                  truncate
                                "
                              >
                                {
                                  cliente.localidade
                                }
                              </span>
                            )}

                            {cliente.pais && (
                              <span>
                                {
                                  cliente.pais
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <div
                          className={`
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            border
                            text-xs
                            font-bold
                            transition

                            ${
                              selecionado
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }
                          `}
                          aria-hidden="true"
                        >
                          ✓
                        </div>
                      </button>
                    );
                  },
                )}
              </div>

              {/* ================================================
                  TABLET / DESKTOP

                  Tabela semântica:
                    Cliente
                    NIF/NIPC
                    Localidade
                    País

                  O ID interno aparece por baixo do nome
                  para não gastar uma coluna adicional.
                  ================================================ */}

              <div
                className="
                  hidden
                  md:block
                "
              >
                <table
                  className="
                    w-full
                    table-fixed
                    border-collapse
                  "
                >
                  <thead
                    className="
                      sticky
                      top-0
                      z-10
                      bg-slate-100
                      shadow-[0_1px_0_0_rgb(226_232_240)]
                    "
                  >
                    <tr
                      className="
                        text-left
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                    >
                      <th
                        className="
                          w-[46%]
                          px-4
                          py-3
                        "
                      >
                        Cliente
                      </th>

                      <th
                        className="
                          w-[20%]
                          px-4
                          py-3
                        "
                      >
                        NIF/NIPC
                      </th>

                      <th
                        className="
                          w-[24%]
                          px-4
                          py-3
                        "
                      >
                        Localidade
                      </th>

                      <th
                        className="
                          w-[10%]
                          px-4
                          py-3
                          text-center
                        "
                      >
                        País
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    className="
                      divide-y
                      divide-slate-200
                    "
                  >
                    {clientes.map(
                      (
                        cliente,
                      ) => {
                        const selecionado =
                          clienteAtual
                            ?.idCliente ===
                          cliente.idCliente;

                        const nome =
                          nomeClienteApresentacao(
                            cliente,
                            idClienteIndiferenciado,
                          );

                        return (
                          <tr
                            key={
                              cliente.idCliente
                            }
                            tabIndex={0}
                            aria-selected={
                              selecionado
                            }
                            onClick={() => {
                              setClienteAtual(
                                cliente,
                              );
                            }}
                            onDoubleClick={() => {
                              onSelecionar(
                                cliente,
                              );
                            }}
                            onKeyDown={(
                              event,
                            ) => {
                              if (
                                event.key ===
                                  "Enter" ||
                                event.key ===
                                  " "
                              ) {
                                event.preventDefault();

                                setClienteAtual(
                                  cliente,
                                );
                              }
                            }}
                            className={`
                              min-h-14
                              cursor-pointer
                              outline-none
                              transition
                              focus-visible:ring-2
                              focus-visible:ring-inset
                              focus-visible:ring-blue-500

                              ${
                                selecionado
                                  ? "bg-blue-50"
                                  : "bg-white hover:bg-slate-50"
                              }
                            `}
                          >
                            <td
                              className="
                                px-4
                                py-3
                                align-middle
                              "
                            >
                              <div
                                className="
                                  flex
                                  min-w-0
                                  items-center
                                  gap-3
                                "
                              >
                                <div
                                  className={`
                                    flex
                                    h-7
                                    w-7
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    text-xs
                                    font-bold

                                    ${
                                      selecionado
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-300 bg-white text-transparent"
                                    }
                                  `}
                                  aria-hidden="true"
                                >
                                  ✓
                                </div>

                                <div
                                  className="
                                    min-w-0
                                  "
                                >
                                  <div
                                    className="
                                      truncate
                                      text-sm
                                      font-semibold
                                      text-slate-900
                                    "
                                    title={
                                      nome
                                    }
                                  >
                                    {nome}
                                  </div>

                                  <div
                                    className="
                                      mt-0.5
                                      text-xs
                                      text-slate-500
                                    "
                                  >
                                    ID{" "}
                                    {
                                      cliente.idCliente
                                    }
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td
                              className="
                                truncate
                                px-4
                                py-3
                                text-sm
                                text-slate-700
                              "
                              title={
                                cliente.nif ??
                                ""
                              }
                            >
                              {cliente.nif ||
                                "—"}
                            </td>

                            <td
                              className="
                                truncate
                                px-4
                                py-3
                                text-sm
                                text-slate-700
                              "
                              title={
                                cliente.localidade ??
                                ""
                              }
                            >
                              {cliente.localidade ||
                                "—"}
                            </td>

                            <td
                              className="
                                px-4
                                py-3
                                text-center
                                text-sm
                                font-medium
                                text-slate-600
                              "
                            >
                              {cliente.pais ||
                                "—"}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* ======================================================
            RODAPÉ

            No Mobile:
              - compacto;
              - botões largos;
              - fácil utilização com polegar;
              - respeita safe-area inferior.

            No desktop:
              resumo e botões ficam na mesma linha.
            ====================================================== */}

        <div
          className="
            shrink-0
            border-t
            border-slate-200
            bg-white
            px-3
            pt-3
            sm:px-4
          "
          style={{
            paddingBottom:
              "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div
              className="
                min-w-0
                flex-1
              "
            >
              {clienteAtual ? (
                <>
                  <div
                    className="
                      truncate
                      text-sm
                      font-semibold
                      text-slate-900
                    "
                  >
                    {nomeClienteApresentacao(
                      clienteAtual,
                      idClienteIndiferenciado,
                    )}
                  </div>

                  <div
                    className="
                      mt-0.5
                      truncate
                      text-xs
                      text-slate-500
                    "
                  >
                    ID{" "}
                    {
                      clienteAtual.idCliente
                    }

                    {clienteAtual.nif
                      ? ` · NIF/NIPC ${clienteAtual.nif}`
                      : ""}
                  </div>
                </>
              ) : (
                <div
                  className="
                    text-sm
                    text-slate-500
                  "
                >
                  Nenhum cliente selecionado
                </div>
              )}
            </div>

            <div
              className="
                grid
                shrink-0
                grid-cols-2
                gap-2
                sm:flex
              "
            >
              <button
                type="button"
                onClick={
                  onFechar
                }
                className="
                  h-12
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  active:bg-slate-200
                  hover:bg-slate-100
                  sm:h-11
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  !clienteAtual ||
                  aObterConsumidorFinal
                }
                onClick={
                  confirmarSelecao
                }
                className="
                  h-12
                  rounded-xl
                  bg-blue-600
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  active:bg-blue-800
                  hover:bg-blue-700
                  disabled:cursor-not-allowed
                  disabled:bg-slate-400
                  sm:h-11
                "
              >
                Selecionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          NOVO CLIENTE

          z-index do NovoClienteModal é superior ao modal
          de pesquisa, por isso abre corretamente por cima.

          Depois da criação:
            1. fecha o NovoClienteModal;
            2. guarda o cliente criado localmente;
            3. chama o mesmo onSelecionar utilizado na pesquisa.

          A page da mesa mantém assim um único fluxo
          para receber o cliente escolhido/criado.
          ======================================================== */}

      <NovoClienteModal
        aberto={
          mostrarNovoCliente
        }
        accessToken={
          accessToken
        }
        onFechar={() => {
          setMostrarNovoCliente(
            false,
          );
        }}
        onClienteCriado={(
          cliente,
        ) => {
          setMostrarNovoCliente(
            false,
          );

          setClienteAtual(
            cliente,
          );

          onSelecionar(
            cliente,
          );
        }}
      />
    </div>
  );
}



// "use client";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import type {
//   POSMobileClienteResumo,
//   POSMobilePesquisarClientesResposta,
// } from "@/types/pos-mobile-clientes";

// interface PesquisarClienteModalProps {
//   aberto: boolean;

//   accessToken: string;

//   /*
//     ID interno da tab_cliente.

//     Corresponde a:
//       tab_cliente.vnume

//     Este valor vem do contexto da API e nunca
//     deve ser assumido como 1 no frontend.
//   */
//   idClienteIndiferenciado: number;

//   clienteSelecionado?:
//     | POSMobileClienteResumo
//     | null;

//   onSelecionar: (
//     cliente: POSMobileClienteResumo,
//   ) => void;

//   onFechar: () => void;
// }

// /*
//   Resposta do endpoint específico de obtenção
//   de cliente por ID interno.

//   O backend deve procurar diretamente por:

//     tab_cliente.vnume = idCliente
// */
// interface POSMobileObterClienteDados {
//   cliente:
//     | POSMobileClienteResumo
//     | null;
// }

// interface POSMobileObterClienteResposta {
//   sucesso: boolean;
//   codigo: string;
//   mensagem: string;
//   versaoContrato: string;

//   dados:
//     | POSMobileObterClienteDados
//     | null;
// }

// function nomeClienteApresentacao(
//   cliente:
//     | POSMobileClienteResumo
//     | null,
//   idClienteIndiferenciado: number,
// ): string {
//   if (!cliente) {
//     return "";
//   }

//   if (
//     idClienteIndiferenciado > 0 &&
//     cliente.idCliente ===
//       idClienteIndiferenciado
//   ) {
//     return "Consumidor Final";
//   }

//   return (
//     cliente.nome?.trim() ||
//     `Cliente ${cliente.idCliente}`
//   );
// }

// export default function PesquisarClienteModal({
//   aberto,
//   accessToken,
//   idClienteIndiferenciado,
//   clienteSelecionado,
//   onSelecionar,
//   onFechar,
// }: PesquisarClienteModalProps) {
//   const [
//     pesquisa,
//     setPesquisa,
//   ] = useState("");

//   const [
//     clientes,
//     setClientes,
//   ] =
//     useState<
//       POSMobileClienteResumo[]
//     >([]);

//   const [
//     clienteAtual,
//     setClienteAtual,
//   ] =
//     useState<
//       POSMobileClienteResumo | null
//     >(
//       clienteSelecionado ??
//         null,
//     );

//   const [
//     aPesquisar,
//     setAPesquisar,
//   ] = useState(false);

//   const [
//     erro,
//     setErro,
//   ] = useState("");

//   const [
//     pesquisaExecutada,
//     setPesquisaExecutada,
//   ] = useState(false);

//   /*
//     ==============================================================
//     SINCRONIZAR CLIENTE SELECIONADO
//     ==============================================================
//   */

//   useEffect(() => {
//     if (!aberto) {
//       return;
//     }

//     setClienteAtual(
//       clienteSelecionado ??
//         null,
//     );
//   }, [
//     aberto,
//     clienteSelecionado,
//   ]);

//   /*
//     ==============================================================
//     LIMPAR ESTADO AO FECHAR
//     ==============================================================
//   */

//   useEffect(() => {
//     if (aberto) {
//       return;
//     }

//     setPesquisa("");
//     setClientes([]);
//     setErro("");
//     setPesquisaExecutada(
//       false,
//     );
//     setAPesquisar(false);
//   }, [aberto]);

//   /*
//     ==============================================================
//     PESQUISA AUTOMÁTICA
//     ==============================================================
//   */

//   useEffect(() => {
//     if (!aberto) {
//       return;
//     }

//     const valor =
//       pesquisa.trim();

//     if (valor === "") {
//       setClientes([]);
//       setErro("");
//       setPesquisaExecutada(
//         false,
//       );

//       return;
//     }

//     /*
//       Para pesquisa por nome exigimos pelo
//       menos dois caracteres.

//       O backend continua a decidir como tratar
//       valores numéricos, NIF, etc.
//     */
//     if (
//       valor.length < 2 &&
//       !/^\d+$/.test(valor)
//     ) {
//       setClientes([]);
//       setErro("");
//       setPesquisaExecutada(
//         false,
//       );

//       return;
//     }

//     const temporizador =
//       window.setTimeout(
//         () => {
//           void pesquisarClientes(
//             valor,
//           );
//         },
//         300,
//       );

//     return () => {
//       window.clearTimeout(
//         temporizador,
//       );
//     };
//   }, [
//     pesquisa,
//     aberto,
//   ]);

//   /*
//     ==============================================================
//     PESQUISAR CLIENTES
//     ==============================================================
//   */

//   async function pesquisarClientes(
//     valorPesquisa: string,
//   ): Promise<void> {
//     const token =
//       accessToken.trim();

//     if (token === "") {
//       setClientes([]);

//       setErro(
//         "A sessão não possui um token válido.",
//       );

//       setPesquisaExecutada(
//         true,
//       );

//       return;
//     }

//     setAPesquisar(true);
//     setErro("");

//     try {
//       const resposta =
//         await fetch(
//           "/api/pos-mobile/clientes/pesquisar",
//           {
//             method: "POST",

//             headers: {
//               "Content-Type":
//                 "application/json",

//               Accept:
//                 "application/json",
//             },

//             cache: "no-store",

//             body: JSON.stringify({
//               accessToken:
//                 token,

//               pesquisa:
//                 valorPesquisa,

//               limite:
//                 50,
//             }),
//           },
//         );

//       const resultado =
//         (await resposta.json()) as
//           POSMobilePesquisarClientesResposta;

//       if (
//         !resposta.ok ||
//         !resultado.sucesso
//       ) {
//         setClientes([]);

//         setErro(
//           resultado.mensagem ||
//             "Não foi possível pesquisar clientes.",
//         );

//         setPesquisaExecutada(
//           true,
//         );

//         return;
//       }

//       setClientes(
//         resultado.dados
//           ?.clientes ?? [],
//       );

//       setPesquisaExecutada(
//         true,
//       );
//     } catch (error) {
//       console.error(
//         "Erro ao pesquisar clientes:",
//         error,
//       );

//       setClientes([]);

//       setErro(
//         "Não foi possível comunicar com o serviço de clientes.",
//       );

//       setPesquisaExecutada(
//         true,
//       );
//     } finally {
//       setAPesquisar(false);
//     }
//   }

//   /*
//     ==============================================================
//     CONFIRMAR CLIENTE SELECIONADO
//     ==============================================================
//   */

//   function confirmarSelecao() {
//     if (!clienteAtual) {
//       return;
//     }

//     onSelecionar(
//       clienteAtual,
//     );
//   }

//   /*
//     ==============================================================
//     CONSUMIDOR FINAL
//     ==============================================================
 
//     ATENÇÃO:

//       idClienteIndiferenciado corresponde ao ID interno:

//         tab_cliente.vnume

//       NÃO corresponde ao NIF.

//       O NIF está em:

//         tab_cliente.vcont

//       Portanto não usamos a pesquisa genérica para resolver
//       o Consumidor Final.

//       Fazemos uma obtenção direta pelo ID interno.
//   */

//   async function selecionarConsumidorFinal(): Promise<void> {
//     if (
//       !Number.isInteger(
//         idClienteIndiferenciado,
//       ) ||
//       idClienteIndiferenciado <= 0
//     ) {
//       setErro(
//         "Não existe cliente indiferenciado configurado.",
//       );

//       return;
//     }

//     const token =
//       accessToken.trim();

//     if (token === "") {
//       setErro(
//         "A sessão não possui um token válido.",
//       );

//       return;
//     }

//     setAPesquisar(true);
//     setErro("");

//     try {
//       const resposta =
//         await fetch(
//           "/api/pos-mobile/clientes/obter",
//           {
//             method: "POST",

//             headers: {
//               "Content-Type":
//                 "application/json",

//               Accept:
//                 "application/json",
//             },

//             cache: "no-store",

//             body: JSON.stringify({
//               accessToken:
//                 token,

//               /*
//                 ID interno da tab_cliente:

//                   tab_cliente.vnume
//               */
//               idCliente:
//                 idClienteIndiferenciado,
//             }),
//           },
//         );

//       const resultado =
//         (await resposta.json()) as
//           POSMobileObterClienteResposta;

//       if (
//         !resposta.ok ||
//         !resultado.sucesso
//       ) {
//         setErro(
//           resultado.mensagem ||
//             "Não foi possível obter o Consumidor Final.",
//         );

//         return;
//       }

//       const cliente =
//         resultado.dados
//           ?.cliente ??
//         null;

//       if (!cliente) {
//         setErro(
//           "O cliente indiferenciado configurado não foi encontrado.",
//         );

//         return;
//       }

//       /*
//         Segurança adicional:

//         o endpoint pediu exatamente o cliente configurado,
//         logo a resposta deve obrigatoriamente devolver o
//         mesmo ID interno.
//       */
//       if (
//         cliente.idCliente !==
//         idClienteIndiferenciado
//       ) {
//         console.error(
//           "Cliente indiferenciado inesperado:",
//           {
//             esperado:
//               idClienteIndiferenciado,

//             recebido:
//               cliente.idCliente,

//             cliente,
//           },
//         );

//         setErro(
//           "O cliente devolvido não corresponde ao cliente indiferenciado configurado.",
//         );

//         return;
//       }

//       setClienteAtual(
//         cliente,
//       );

//       /*
//         Consumidor Final é uma seleção imediata.

//         Não obrigamos o operador a clicar novamente
//         no botão Selecionar.
//       */
//       onSelecionar(
//         cliente,
//       );
//     } catch (error) {
//       console.error(
//         "Erro ao obter cliente indiferenciado:",
//         error,
//       );

//       setErro(
//         "Não foi possível obter o Consumidor Final.",
//       );
//     } finally {
//       setAPesquisar(false);
//     }
//   }

//   /*
//     ==============================================================
//     TEXTO DE AJUDA
//     ==============================================================
//   */

//   const textoAjuda =
//     useMemo(() => {
//       const valor =
//         pesquisa.trim();

//       if (valor === "") {
//         return "Pesquise por nome ou NIF.";
//       }

//       if (
//         valor.length < 2 &&
//         !/^\d+$/.test(valor)
//       ) {
//         return "Introduza pelo menos 2 caracteres.";
//       }

//       return "";
//     }, [pesquisa]);

//   /*
//     ==============================================================
//     RENDER
//     ==============================================================
//   */

//   if (!aberto) {
//     return null;
//   }

//   return (
//     <div
//       className="
//         fixed
//         inset-0
//         z-[100]
//         flex
//         items-center
//         justify-center
//         bg-black/50
//         p-3
//         sm:p-5
//       "
//       onMouseDown={(event) => {
//         if (
//           event.target ===
//           event.currentTarget
//         ) {
//           onFechar();
//         }
//       }}
//     >
//       {/* ========================================================
//           MODAL

//           Altura fixa no desktop.

//           Apenas a zona dos resultados faz scroll.
//           ======================================================== */}

//       <div
//         className="
//           flex
//           h-[680px]
//           max-h-[calc(100dvh-24px)]
//           w-full
//           max-w-4xl
//           flex-col
//           overflow-hidden
//           rounded-2xl
//           bg-white
//           shadow-2xl
//         "
//       >
//         {/* ======================================================
//             CABEÇALHO
//             ====================================================== */}

//         <div
//           className="
//             flex
//             shrink-0
//             items-center
//             justify-between
//             border-b
//             border-slate-200
//             px-4
//             py-3
//             sm:px-5
//           "
//         >
//           <div>
//             <h2
//               className="
//                 text-lg
//                 font-semibold
//                 text-slate-900
//               "
//             >
//               Selecionar cliente
//             </h2>

//             <p
//               className="
//                 mt-0.5
//                 text-xs
//                 text-slate-500
//               "
//             >
//               Pesquise por nome ou NIF.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={
//               onFechar
//             }
//             className="
//               flex
//               h-9
//               w-9
//               items-center
//               justify-center
//               rounded-lg
//               text-xl
//               text-slate-500
//               transition
//               hover:bg-slate-100
//               hover:text-slate-900
//             "
//             aria-label="Fechar"
//           >
//             ×
//           </button>
//         </div>

//         {/* ======================================================
//             PESQUISA
//             ====================================================== */}

//         <div
//           className="
//             shrink-0
//             border-b
//             border-slate-200
//             bg-slate-50
//             p-4
//             sm:p-5
//           "
//         >
//           <div
//             className="
//               flex
//               flex-col
//               gap-3
//               sm:flex-row
//             "
//           >
//             <div
//               className="
//                 relative
//                 flex-1
//               "
//             >
//               <input
//                 autoFocus
//                 type="text"
//                 value={
//                   pesquisa
//                 }
//                 disabled={
//                   aPesquisar
//                 }
//                 onChange={(
//                   event,
//                 ) => {
//                   setPesquisa(
//                     event.target
//                       .value,
//                   );

//                   setErro("");
//                 }}
//                 placeholder="Nome ou NIF..."
//                 className="
//                   h-11
//                   w-full
//                   rounded-xl
//                   border
//                   border-slate-300
//                   bg-white
//                   px-4
//                   pr-10
//                   text-sm
//                   text-slate-900
//                   outline-none
//                   transition
//                   placeholder:text-slate-400
//                   focus:border-blue-500
//                   focus:ring-2
//                   focus:ring-blue-100
//                   disabled:bg-slate-100
//                   disabled:text-slate-500
//                 "
//               />

//               {aPesquisar && (
//                 <div
//                   className="
//                     absolute
//                     right-3
//                     top-1/2
//                     -translate-y-1/2
//                   "
//                 >
//                   <div
//                     className="
//                       h-4
//                       w-4
//                       animate-spin
//                       rounded-full
//                       border-2
//                       border-slate-300
//                       border-t-blue-600
//                     "
//                   />
//                 </div>
//               )}
//             </div>

//             {/* ==================================================
//                 CONSUMIDOR FINAL

//                 O ID vem do ContextoPosto.
//                 ================================================== */}

//             <button
//               type="button"
//               disabled={
//                 aPesquisar ||
//                 !Number.isInteger(
//                   idClienteIndiferenciado,
//                 ) ||
//                 idClienteIndiferenciado <=
//                   0
//               }
//               onClick={() => {
//                 void selecionarConsumidorFinal();
//               }}
//               className="
//                 h-11
//                 shrink-0
//                 whitespace-nowrap
//                 rounded-xl
//                 border
//                 border-emerald-200
//                 bg-emerald-50
//                 px-4
//                 text-sm
//                 font-bold
//                 text-emerald-700
//                 transition
//                 hover:border-emerald-300
//                 hover:bg-emerald-100
//                 disabled:cursor-not-allowed
//                 disabled:opacity-50
//               "
//             >
//               Consumidor Final
//             </button>
//           </div>

//           {textoAjuda !== "" && (
//             <p
//               className="
//                 mt-2
//                 text-xs
//                 text-slate-500
//               "
//             >
//               {textoAjuda}
//             </p>
//           )}

//           {erro !== "" && (
//             <div
//               className="
//                 mt-3
//                 rounded-lg
//                 border
//                 border-red-200
//                 bg-red-50
//                 px-3
//                 py-2
//                 text-sm
//                 font-semibold
//                 text-red-700
//               "
//             >
//               {erro}
//             </div>
//           )}
//         </div>

//         {/* ======================================================
//             RESULTADOS

//             Esta é a única zona que cresce internamente
//             e apresenta scrollbar.
//             ====================================================== */}

//         <div
//           className="
//             min-h-0
//             flex-1
//             overflow-y-auto
//             overscroll-contain
//             p-3
//             sm:p-4
//           "
//         >
//           {!pesquisaExecutada &&
//             clientes.length ===
//               0 && (
//               <div
//                 className="
//                   flex
//                   h-full
//                   min-h-48
//                   items-center
//                   justify-center
//                   text-center
//                 "
//               >
//                 <div>
//                   <div
//                     className="
//                       text-sm
//                       font-medium
//                       text-slate-700
//                     "
//                   >
//                     Pesquisar cliente
//                   </div>

//                   <div
//                     className="
//                       mt-1
//                       text-xs
//                       text-slate-500
//                     "
//                   >
//                     Comece a escrever o nome ou NIF.
//                   </div>
//                 </div>
//               </div>
//             )}

//           {pesquisaExecutada &&
//             !aPesquisar &&
//             clientes.length ===
//               0 &&
//             erro === "" && (
//               <div
//                 className="
//                   flex
//                   h-full
//                   min-h-48
//                   items-center
//                   justify-center
//                   text-center
//                 "
//               >
//                 <div>
//                   <div
//                     className="
//                       text-sm
//                       font-medium
//                       text-slate-700
//                     "
//                   >
//                     Nenhum cliente encontrado
//                   </div>

//                   <div
//                     className="
//                       mt-1
//                       text-xs
//                       text-slate-500
//                     "
//                   >
//                     Tente pesquisar por outro nome ou NIF.
//                   </div>
//                 </div>
//               </div>
//             )}

//           {clientes.length >
//             0 && (
//             <div className="space-y-2">
//               {clientes.map(
//                 (
//                   cliente,
//                 ) => {
//                   const selecionado =
//                     clienteAtual
//                       ?.idCliente ===
//                     cliente.idCliente;

//                   const nome =
//                     nomeClienteApresentacao(
//                       cliente,
//                       idClienteIndiferenciado,
//                     );

//                   return (
//                     <button
//                       type="button"
//                       key={
//                         cliente.idCliente
//                       }
//                       onClick={() => {
//                         setClienteAtual(
//                           cliente,
//                         );
//                       }}
//                       onDoubleClick={() => {
//                         onSelecionar(
//                           cliente,
//                         );
//                       }}
//                       className={`
//                         w-full
//                         rounded-xl
//                         border
//                         p-3
//                         text-left
//                         transition

//                         ${
//                           selecionado
//                             ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-100"
//                             : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
//                         }
//                       `}
//                     >
//                       <div
//                         className="
//                           flex
//                           items-start
//                           justify-between
//                           gap-3
//                         "
//                       >
//                         <div
//                           className="
//                             min-w-0
//                             flex-1
//                           "
//                         >
//                           <div
//                             className="
//                               truncate
//                               text-sm
//                               font-semibold
//                               text-slate-900
//                             "
//                           >
//                             {nome}
//                           </div>

//                           <div
//                             className="
//                               mt-1
//                               flex
//                               flex-wrap
//                               gap-x-4
//                               gap-y-1
//                               text-xs
//                               text-slate-500
//                             "
//                           >
//                             {/* ID interno: tab_cliente.vnume */}

//                             <span>
//                               ID{" "}
//                               {
//                                 cliente.idCliente
//                               }
//                             </span>

//                             {/* NIF: tab_cliente.vcont */}

//                             {cliente.nif && (
//                               <span>
//                                 NIF{" "}
//                                 {
//                                   cliente.nif
//                                 }
//                               </span>
//                             )}

//                             {cliente.localidade && (
//                               <span>
//                                 {
//                                   cliente.localidade
//                                 }
//                               </span>
//                             )}

//                             {cliente.pais && (
//                               <span>
//                                 {
//                                   cliente.pais
//                                 }
//                               </span>
//                             )}
//                           </div>
//                         </div>

//                         {selecionado && (
//                           <div
//                             className="
//                               flex
//                               h-6
//                               w-6
//                               shrink-0
//                               items-center
//                               justify-center
//                               rounded-full
//                               bg-blue-600
//                               text-xs
//                               font-bold
//                               text-white
//                             "
//                           >
//                             ✓
//                           </div>
//                         )}
//                       </div>
//                     </button>
//                   );
//                 },
//               )}
//             </div>
//           )}
//         </div>

//         {/* ======================================================
//             RODAPÉ
//             ====================================================== */}

//         <div
//           className="
//             shrink-0
//             border-t
//             border-slate-200
//             bg-white
//             p-4
//           "
//         >
//           {clienteAtual && (
//             <div
//               className="
//                 mb-3
//                 rounded-xl
//                 border
//                 border-slate-200
//                 bg-slate-50
//                 px-3
//                 py-2
//               "
//             >
//               <div
//                 className="
//                   text-xs
//                   font-medium
//                   text-slate-500
//                 "
//               >
//                 Cliente selecionado
//               </div>

//               <div
//                 className="
//                   mt-0.5
//                   truncate
//                   text-sm
//                   font-semibold
//                   text-slate-900
//                 "
//               >
//                 {nomeClienteApresentacao(
//                   clienteAtual,
//                   idClienteIndiferenciado,
//                 )}
//               </div>

//               <div
//                 className="
//                   mt-0.5
//                   text-xs
//                   text-slate-500
//                 "
//               >
//                 ID{" "}
//                 {
//                   clienteAtual.idCliente
//                 }

//                 {clienteAtual.nif
//                   ? ` · NIF ${clienteAtual.nif}`
//                   : ""}
//               </div>
//             </div>
//           )}

//           <div
//             className="
//               flex
//               justify-end
//               gap-2
//             "
//           >
//             <button
//               type="button"
//               onClick={
//                 onFechar
//               }
//               disabled={
//                 aPesquisar
//               }
//               className="
//                 h-10
//                 rounded-xl
//                 border
//                 border-slate-300
//                 bg-white
//                 px-4
//                 text-sm
//                 font-medium
//                 text-slate-700
//                 transition
//                 hover:bg-slate-100
//                 disabled:cursor-not-allowed
//                 disabled:opacity-50
//               "
//             >
//               Cancelar
//             </button>

//             <button
//               type="button"
//               disabled={
//                 !clienteAtual ||
//                 aPesquisar
//               }
//               onClick={
//                 confirmarSelecao
//               }
//               className="
//                 h-10
//                 rounded-xl
//                 bg-blue-600
//                 px-5
//                 text-sm
//                 font-semibold
//                 text-white
//                 transition
//                 hover:bg-blue-700
//                 disabled:cursor-not-allowed
//                 disabled:bg-slate-400
//               "
//             >
//               Selecionar
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }