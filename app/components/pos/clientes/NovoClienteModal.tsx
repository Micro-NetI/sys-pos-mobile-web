//app\components\pos\clientes\NovoClienteModal.tsx
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  POSMobileCriarClientePedido,
  POSMobileCriarClienteResposta,
  POSMobilePaisOpcao,
  POSMobilePrepararFichaClienteResposta,
  POSMobileTipoClienteFicha,
} from "@/types/pos-mobile-clientes-ficha";

import type {
  POSMobileClienteResumo,
} from "@/types/pos-mobile-clientes";

interface NovoClienteModalProps {
  aberto: boolean;

  accessToken: string;

  /*
    Chamado quando o operador cancela/fecha
    a criação da ficha.
  */
  onFechar: () => void;

  /*
    Chamado apenas depois de a API criar
    efetivamente o cliente e devolver o
    respetivo resumo persistido.

    No passo seguinte o componente pai poderá:
      - fechar este modal;
      - fechar a pesquisa;
      - selecionar imediatamente o cliente criado;
      - regressar ao pagamento.
  */
  onClienteCriado: (
    cliente: POSMobileClienteResumo,
  ) => void;
}

interface EstadoFormulario {
  tipoCliente:
    POSMobileTipoClienteFicha;

  /*
    INDIVIDUAL
  */
  nome: string;
  apelido: string;

  /*
    EMPRESA
  */
  designacao: string;
  abreviatura: string;

  /*
    COMUNS
  */
  idPais: number;

  nif: string;
  semNif: boolean;

  email: string;
  telemovel: string;

  morada: string;
  codigoPostal: string;
  localidade: string;
}

const ESTADO_INICIAL:
  EstadoFormulario = {
    tipoCliente:
      "INDIVIDUAL",

    nome: "",
    apelido: "",

    designacao: "",
    abreviatura: "",

    idPais: 0,

    nif: "",
    semNif: false,

    email: "",
    telemovel: "",

    morada: "",
    codigoPostal: "",
    localidade: "",
  };

function mensagemTipoCliente(
  tipoCliente:
    POSMobileTipoClienteFicha,
): string {
  return tipoCliente ===
    "EMPRESA"
    ? "Empresa"
    : "Particular";
}

export default function NovoClienteModal({
  aberto,
  accessToken,
  onFechar,
  onClienteCriado,
}: NovoClienteModalProps) {
  const [
    formulario,
    setFormulario,
  ] =
    useState<EstadoFormulario>(
      ESTADO_INICIAL,
    );

  const [
    paises,
    setPaises,
  ] =
    useState<
      POSMobilePaisOpcao[]
    >([]);

  const [
    aPreparar,
    setAPreparar,
  ] = useState(false);

  const [
    aCriar,
    setACriar,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    mostrarMorada,
    setMostrarMorada,
  ] = useState(false);

  /*
    ==============================================================
    ESTADO DERIVADO
    ==============================================================
  */

  const tipoEmpresa =
    formulario.tipoCliente ===
    "EMPRESA";

  const labelNIF =
    tipoEmpresa
      ? "NIPC"
      : "NIF";

  const labelSemNIF =
    tipoEmpresa
      ? "Sem NIPC"
      : "Sem NIF";

  const podeCriar =
    useMemo(() => {
      if (aPreparar || aCriar) {
        return false;
      }

      if (
        formulario.idPais <= 0
      ) {
        return false;
      }

      if (
        formulario.tipoCliente ===
          "INDIVIDUAL" &&
        formulario.nome.trim() ===
          ""
      ) {
        return false;
      }

      if (
        formulario.tipoCliente ===
          "EMPRESA" &&
        formulario.designacao.trim() ===
          ""
      ) {
        return false;
      }

      if (
        !formulario.semNif &&
        formulario.nif.trim() ===
          ""
      ) {
        return false;
      }

      return true;
    }, [
      aPreparar,
      aCriar,
      formulario,
    ]);

  /*
    ==============================================================
    ABRIR / PREPARAR FICHA
    ==============================================================
  */

  useEffect(() => {
    if (!aberto) {
      return;
    }

    /*
      Cada abertura começa com uma ficha limpa.

      A única configuração que será aplicada a seguir
      é a devolvida por PrepararFichaCliente.
    */
    setFormulario(
      ESTADO_INICIAL,
    );

    setPaises([]);
    setErro("");
    setMostrarMorada(
      false,
    );

    void prepararFicha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    aberto,
    accessToken,
  ]);

  /*
    ==============================================================
    LIMPAR AO FECHAR
    ==============================================================
  */

  useEffect(() => {
    if (aberto) {
      return;
    }

    setFormulario(
      ESTADO_INICIAL,
    );

    setPaises([]);
    setErro("");
    setMostrarMorada(
      false,
    );
    setAPreparar(false);
    setACriar(false);
  }, [aberto]);

  /*
    ==============================================================
    PREPARAR FICHA

    O país predefinido e a lista de países
    vêm sempre da API.

    Não existe Portugal=1 no React.
    ==============================================================
  */

  async function prepararFicha(): Promise<void> {
    const token =
      accessToken.trim();

    if (token === "") {
      setErro(
        "A sessão não possui um token válido.",
      );

      return;
    }

    setAPreparar(true);
    setErro("");

    try {
      const resposta =
        await fetch(
          "/api/pos-mobile/clientes/preparar-ficha",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache: "no-store",

            body:
              JSON.stringify({
                accessToken:
                  token,
              }),
          },
        );

      const resultado =
        (await resposta.json()) as
          POSMobilePrepararFichaClienteResposta;

      if (
        !resposta.ok ||
        !resultado.sucesso
      ) {
        setPaises([]);

        setErro(
          resultado.mensagem ||
            "Não foi possível preparar a ficha de cliente.",
        );

        return;
      }

      const dados =
        resultado.dados;

      if (!dados) {
        setPaises([]);

        setErro(
          "A API não devolveu os dados necessários para criar a ficha.",
        );

        return;
      }

      const listaPaises =
        Array.isArray(
          dados.paises,
        )
          ? dados.paises
          : [];

      setPaises(
        listaPaises,
      );

      const paisPredefinidoExiste =
        listaPaises.some(
          (pais) =>
            pais.id ===
            dados.idPaisPredefinido,
        );

      setFormulario(
        (anterior) => ({
          ...anterior,

          idPais:
            paisPredefinidoExiste
              ? dados.idPaisPredefinido
              : 0,
        }),
      );
    } catch (error) {
      console.error(
        "[POSMobile][NovoCliente] Erro ao preparar ficha:",
        error,
      );

      setPaises([]);

      setErro(
        "Não foi possível comunicar com o serviço de clientes.",
      );
    } finally {
      setAPreparar(false);
    }
  }

  /*
    ==============================================================
    ALTERAR TIPO

    Mantemos os campos comuns:
      - país;
      - NIF/NIPC;
      - email;
      - telemóvel;
      - morada;
      - código postal;
      - localidade.

    Os campos específicos continuam em memória
    para evitar perda acidental se o operador
    tocar no tipo errado e regressar.

    Na criação, os campos do tipo não selecionado
    são enviados vazios.
    ==============================================================
  */

  function alterarTipoCliente(
    tipoCliente:
      POSMobileTipoClienteFicha,
  ) {
    if (
      formulario.tipoCliente ===
      tipoCliente
    ) {
      return;
    }

    setErro("");

    setFormulario(
      (anterior) => ({
        ...anterior,
        tipoCliente,
      }),
    );
  }

  /*
    ==============================================================
    SEM NIF / SEM NIPC
    ==============================================================
  */

  function alterarSemNIF(
    valor: boolean,
  ) {
    setErro("");

    setFormulario(
      (anterior) => ({
        ...anterior,

        semNif:
          valor,

        /*
          Quando o operador escolhe Sem NIF/NIPC,
          limpamos imediatamente o campo.

          Evita mostrar/enviar um número fiscal
          que deixou de fazer parte da ficha.
        */
        nif:
          valor
            ? ""
            : anterior.nif,
      }),
    );
  }

  /*
    ==============================================================
    CRIAR CLIENTE
    ==============================================================
  */

  async function criarCliente(): Promise<void> {
    if (!podeCriar) {
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

    /*
      Validação de UX.

      O servidor continua a ser a autoridade final.
      Não existe validação fiscal no frontend.
    */
    if (
      formulario.tipoCliente ===
        "INDIVIDUAL" &&
      formulario.nome.trim() ===
        ""
    ) {
      setErro(
        "Indique o nome do cliente.",
      );

      return;
    }

    if (
      formulario.tipoCliente ===
        "EMPRESA" &&
      formulario.designacao.trim() ===
        ""
    ) {
      setErro(
        "Indique a designação da empresa.",
      );

      return;
    }

    if (
      formulario.idPais <= 0
    ) {
      setErro(
        "Selecione o país.",
      );

      return;
    }

    if (
      !formulario.semNif &&
      formulario.nif.trim() ===
        ""
    ) {
      setErro(
        `Indique o ${labelNIF} ou selecione ${labelSemNIF}.`,
      );

      return;
    }

    const pedido:
      POSMobileCriarClientePedido =
      {
        accessToken:
          token,

        tipoCliente:
          formulario.tipoCliente,

        /*
          INDIVIDUAL

          Se o tipo atual é Empresa, estes
          valores são enviados vazios.
        */
        nome:
          formulario.tipoCliente ===
            "INDIVIDUAL"
            ? formulario.nome.trim()
            : "",

        apelido:
          formulario.tipoCliente ===
            "INDIVIDUAL"
            ? formulario.apelido.trim()
            : "",

        /*
          EMPRESA

          Se o tipo atual é Particular, estes
          valores são enviados vazios.
        */
        designacao:
          formulario.tipoCliente ===
            "EMPRESA"
            ? formulario.designacao.trim()
            : "",

        abreviatura:
          formulario.tipoCliente ===
            "EMPRESA"
            ? formulario.abreviatura.trim()
            : "",

        idPais:
          formulario.idPais,

        nif:
          formulario.semNif
            ? ""
            : formulario.nif.trim(),

        semNif:
          formulario.semNif,

        email:
          formulario.email.trim(),

        telemovel:
          formulario.telemovel.trim(),

        morada:
          formulario.morada.trim(),

        codigoPostal:
          formulario.codigoPostal.trim(),

        localidade:
          formulario.localidade.trim(),
      };

    setACriar(true);
    setErro("");

    try {
      const resposta =
        await fetch(
          "/api/pos-mobile/clientes/criar",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache: "no-store",

            body:
              JSON.stringify(
                pedido,
              ),
          },
        );

      const resultado =
        (await resposta.json()) as
          POSMobileCriarClienteResposta;

      if (
        !resposta.ok ||
        !resultado.sucesso
      ) {
        /*
          O backend já devolve mensagens funcionais para:
            - NIF_DUPLICADO;
            - NIF_VALIDACAO_FALHOU;
            - CLIENTE_NOME_DUPLICADO;
            - campos obrigatórios;
            - sessão;
            - etc.

          Não duplicamos essas regras no frontend.
        */
        setErro(
          resultado.mensagem ||
            "Não foi possível criar o cliente.",
        );

        return;
      }

      const cliente =
        resultado.dados
          ?.cliente ??
        null;

      if (
        !cliente ||
        !Number.isInteger(
          cliente.idCliente,
        ) ||
        cliente.idCliente <= 0
      ) {
        setErro(
          "O cliente foi criado, mas a resposta não contém uma ficha válida.",
        );

        return;
      }

      onClienteCriado(
        cliente,
      );
    } catch (error) {
      console.error(
        "[POSMobile][NovoCliente] Erro ao criar cliente:",
        error,
      );

      setErro(
        "Não foi possível comunicar com o serviço de clientes.",
      );
    } finally {
      setACriar(false);
    }
  }

  /*
    ==============================================================
    RENDER
    ==============================================================
  */

  if (!aberto) {
    return null;
  }

  const bloqueado =
    aPreparar ||
    aCriar;

  return (
    <div
      className="
        fixed
        inset-0
        z-[120]
        flex
        items-stretch
        justify-center
        bg-black/55
        p-0

        sm:items-center
        sm:p-4
      "
      onMouseDown={(event) => {
        /*
          Em mobile o conteúdo ocupa o ecrã inteiro.

          No desktop permitimos fechar ao tocar
          no backdrop, desde que não exista uma
          gravação em curso.
        */
        if (
          !bloqueado &&
          event.target ===
            event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div
        className="
          flex
          h-dvh
          w-full
          flex-col
          overflow-hidden
          bg-white
          shadow-2xl

          sm:h-[580px]
          sm:max-h-[calc(100dvh-32px)]
          sm:max-w-xl
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
          <div
            className="
              min-w-0
            "
          >
            <h2
              className="
                truncate
                text-base
                font-semibold
                text-slate-900
                sm:text-lg
              "
            >
              Novo cliente
            </h2>

            <p
              className="
                mt-0.5
                truncate
                text-xs
                text-slate-500
              "
            >
              {mensagemTipoCliente(
                formulario.tipoCliente,
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={
              bloqueado
            }
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

              disabled:cursor-not-allowed
              disabled:opacity-40
            "
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* ======================================================
            CONTEÚDO SCROLLÁVEL
            ====================================================== */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            bg-white
            px-4
            py-4
            sm:px-5
            sm:py-5
          "
        >
          {/* ====================================================
              PREPARAÇÃO
              ==================================================== */}

          {aPreparar ? (
            <div
              className="
                flex
                min-h-72
                items-center
                justify-center
              "
            >
              <div
                className="
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    h-7
                    w-7
                    animate-spin
                    rounded-full
                    border-2
                    border-slate-300
                    border-t-blue-600
                  "
                />

                <div
                  className="
                    mt-3
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  A preparar ficha...
                </div>
              </div>
            </div>
          ) : (
            <div
              className="
                mx-auto
                w-full
                max-w-xl
                space-y-4
              "
            >
              {/* ================================================
                  TIPO DE CLIENTE

                  Mantemos Particular / Empresa como controlo segmentado,
                  mas sem criar um cartão próprio à volta.

                  O objetivo é reduzir peso visual e acelerar a criação
                  da ficha durante o pagamento.
                  ================================================ */}

              <div>
                <div
                  className="
                    grid
                    grid-cols-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-1
                  "
                >
                  <button
                    type="button"
                    disabled={
                      bloqueado
                    }
                    onClick={() => {
                      alterarTipoCliente(
                        "INDIVIDUAL",
                      );
                    }}
                    className={`
                      min-h-11
                      rounded-lg
                      px-3
                      py-2
                      text-sm
                      font-bold
                      transition
                      active:scale-[0.99]

                      ${
                        formulario.tipoCliente ===
                        "INDIVIDUAL"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    `}
                    aria-pressed={
                      formulario.tipoCliente ===
                      "INDIVIDUAL"
                    }
                  >
                    Particular
                  </button>

                  <button
                    type="button"
                    disabled={
                      bloqueado
                    }
                    onClick={() => {
                      alterarTipoCliente(
                        "EMPRESA",
                      );
                    }}
                    className={`
                      min-h-11
                      rounded-lg
                      px-3
                      py-2
                      text-sm
                      font-bold
                      transition
                      active:scale-[0.99]

                      ${
                        formulario.tipoCliente ===
                        "EMPRESA"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }

                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    `}
                    aria-pressed={
                      formulario.tipoCliente ===
                      "EMPRESA"
                    }
                  >
                    Empresa
                  </button>
                </div>
              </div>

              {/* ================================================
                  IDENTIFICAÇÃO
                  ================================================ */}

              <div>
                {formulario.tipoCliente ===
                "INDIVIDUAL" ? (
                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-3
                      sm:grid-cols-2
                    "
                  >
                    <label
                      className="
                        block
                      "
                    >
                      <span
                        className="
                          mb-1.5
                          block
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                      >
                        Nome
                        <span
                          className="
                            ml-1
                            text-red-500
                          "
                        >
                          *
                        </span>
                      </span>

                      <input
                        autoFocus
                        type="text"
                        autoComplete="given-name"
                        disabled={
                          bloqueado
                        }
                        value={
                          formulario.nome
                        }
                        onChange={(
                          event,
                        ) => {
                          setErro("");

                          setFormulario(
                            (
                              anterior,
                            ) => ({
                              ...anterior,

                              nome:
                                event
                                  .target
                                  .value,
                            }),
                          );
                        }}
                        className="
                          h-11
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          px-3.5
                          text-base
                          text-slate-900
                          outline-none
                          transition

                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100

                          disabled:bg-slate-100
                          disabled:text-slate-500

                          sm:text-sm
                        "
                      />
                    </label>

                    <label
                      className="
                        block
                      "
                    >
                      <span
                        className="
                          mb-1.5
                          block
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                      >
                        Apelido
                      </span>

                      <input
                        type="text"
                        autoComplete="family-name"
                        disabled={
                          bloqueado
                        }
                        value={
                          formulario.apelido
                        }
                        onChange={(
                          event,
                        ) => {
                          setErro("");

                          setFormulario(
                            (
                              anterior,
                            ) => ({
                              ...anterior,

                              apelido:
                                event
                                  .target
                                  .value,
                            }),
                          );
                        }}
                        className="
                          h-11
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          px-3.5
                          text-base
                          text-slate-900
                          outline-none
                          transition

                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100

                          disabled:bg-slate-100
                          disabled:text-slate-500

                          sm:text-sm
                        "
                      />
                    </label>
                  </div>
                ) : (
                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-3
                      sm:grid-cols-2
                    "
                  >
                    <label
                      className="
                        block
                      "
                    >
                      <span
                        className="
                          mb-1.5
                          block
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                      >
                        Designação 
                        <span
                          className="
                            ml-1
                            text-red-500
                          "
                        >
                          *
                        </span>
                      </span>

                      <input
                        autoFocus
                        type="text"
                        autoComplete="organization"
                        disabled={
                          bloqueado
                        }
                        value={
                          formulario.designacao
                        }
                        onChange={(
                          event,
                        ) => {
                          setErro("");

                          setFormulario(
                            (
                              anterior,
                            ) => ({
                              ...anterior,

                              designacao:
                                event
                                  .target
                                  .value,
                            }),
                          );
                        }}
                        className="
                          h-11
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          px-3.5
                          text-base
                          text-slate-900
                          outline-none
                          transition

                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100

                          disabled:bg-slate-100
                          disabled:text-slate-500

                          sm:text-sm
                        "
                      />
                    </label>

                    <label
                      className="
                        block
                      "
                    >
                      <span
                        className="
                          mb-1.5
                          block
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                      >
                        Abreviatura
                      </span>

                      <input
                        type="text"
                        disabled={
                          bloqueado
                        }
                        value={
                          formulario.abreviatura
                        }
                        onChange={(
                          event,
                        ) => {
                          setErro("");

                          setFormulario(
                            (
                              anterior,
                            ) => ({
                              ...anterior,

                              abreviatura:
                                event
                                  .target
                                  .value,
                            }),
                          );
                        }}
                        className="
                          h-11
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          px-3.5
                          text-base
                          text-slate-900
                          outline-none
                          transition

                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100

                          disabled:bg-slate-100
                          disabled:text-slate-500

                          sm:text-sm
                        "
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* ================================================
                  DADOS FISCAIS
                  ================================================ */}

              <div>
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]
                  "
                >
                  <label
                    className="
                      block
                    "
                  >
                    <span
                      className="
                        mb-1.5
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      País
                      <span
                        className="
                          ml-1
                          text-red-500
                        "
                      >
                        *
                      </span>
                    </span>

                    {/*
                      <select> nativo é intencional.

                      Em telemóvel abre o seletor do próprio
                      sistema operativo e é mais confortável
                      para uma lista longa de países.
                    */}
                    <select
                      disabled={
                        bloqueado ||
                        paises.length ===
                          0
                      }
                      value={
                        formulario.idPais >
                        0
                          ? String(
                              formulario.idPais,
                            )
                          : ""
                      }
                      onChange={(
                        event,
                      ) => {
                        const valor =
                          Number(
                            event
                              .target
                              .value,
                          );

                        setErro("");

                        setFormulario(
                          (
                            anterior,
                          ) => ({
                            ...anterior,

                            idPais:
                              Number.isInteger(
                                valor,
                              )
                                ? valor
                                : 0,
                          }),
                        );
                      }}
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-3.5
                        text-base
                        text-slate-900
                        outline-none
                        transition

                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100

                        disabled:bg-slate-100
                        disabled:text-slate-500

                        sm:text-sm
                      "
                    >
                      <option
                        value=""
                      >
                        Selecione...
                      </option>

                      {paises.map(
                        (
                          pais,
                        ) => (
                          <option
                            key={
                              pais.id
                            }
                            value={
                              pais.id
                            }
                          >
                            {
                              pais.descricao
                            }
                            {pais.codigo
                              ? ` (${pais.codigo})`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <div>
                    <span
                      className="
                        mb-1.5
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      {labelNIF}

                      {!formulario.semNif && (
                        <span
                          className="
                            ml-1
                            text-red-500
                          "
                        >
                          *
                        </span>
                      )}
                    </span>

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        disabled={
                          bloqueado ||
                          formulario.semNif
                        }
                        value={
                          formulario.nif
                        }
                        onChange={(
                          event,
                        ) => {
                          setErro("");

                          setFormulario(
                            (
                              anterior,
                            ) => ({
                              ...anterior,

                              nif:
                                event
                                  .target
                                  .value,
                            }),
                          );
                        }}
                        className="
                          h-11
                          min-w-0
                          flex-1
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          px-3.5
                          text-base
                          text-slate-900
                          outline-none
                          transition

                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100

                          disabled:bg-slate-100
                          disabled:text-slate-400

                          sm:text-sm
                        "
                      />

                      <label
                        className="
                          flex
                          h-11
                          shrink-0
                          cursor-pointer
                          items-center
                          gap-2
                          rounded-lg
                          border
                          border-slate-200
                          bg-slate-50
                          px-2.5
                        "
                      >
                        <input
                          type="checkbox"
                          disabled={
                            bloqueado
                          }
                          checked={
                            formulario.semNif
                          }
                          onChange={(
                            event,
                          ) => {
                            alterarSemNIF(
                              event
                                .target
                                .checked,
                            );
                          }}
                          className="
                            h-4
                            w-4
                            shrink-0
                            rounded
                            border-slate-300
                          "
                        />

                        <span
                          className="
                            whitespace-nowrap
                            text-xs
                            font-semibold
                            text-slate-700
                          "
                        >
                          {labelSemNIF}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================
                  CONTACTOS
                  ================================================ */}

              <div>
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    sm:grid-cols-2
                  "
                >
                  <label
                    className="
                      block
                    "
                  >
                    <span
                      className="
                        mb-1.5
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      E-mail
                    </span>

                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      disabled={
                        bloqueado
                      }
                      value={
                        formulario.email
                      }
                      onChange={(
                        event,
                      ) => {
                        setErro("");

                        setFormulario(
                          (
                            anterior,
                          ) => ({
                            ...anterior,

                            email:
                              event
                                .target
                                .value,
                          }),
                        );
                      }}
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-3.5
                        text-base
                        text-slate-900
                        outline-none
                        transition

                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100

                        disabled:bg-slate-100
                        disabled:text-slate-500

                        sm:text-sm
                      "
                    />
                  </label>

                  <label
                    className="
                      block
                    "
                  >
                    <span
                      className="
                        mb-1.5
                        block
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Telemóvel
                    </span>

                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      disabled={
                        bloqueado
                      }
                      value={
                        formulario.telemovel
                      }
                      onChange={(
                        event,
                      ) => {
                        setErro("");

                        setFormulario(
                          (
                            anterior,
                          ) => ({
                            ...anterior,

                            telemovel:
                              event
                                .target
                                .value,
                          }),
                        );
                      }}
                      className="
                        h-11
                        w-full
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-3.5
                        text-base
                        text-slate-900
                        outline-none
                        transition

                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100

                        disabled:bg-slate-100
                        disabled:text-slate-500

                        sm:text-sm
                      "
                    />
                  </label>
                </div>
              </div>

              {/* ================================================
                  MORADA / LOCALIZAÇÃO

                  Continua opcional, mas passa a funcionar como uma ação
                  discreta do formulário.

                  No desktop o modal mantém sempre a mesma altura.
                  Quando a morada é aberta, apenas a zona central passa
                  a fazer scroll se necessário.
                  ================================================ */}

              <section
                className="
                  border-t
                  border-slate-100
                  pt-1
                "
              >
                <button
                  type="button"
                  disabled={
                    bloqueado
                  }
                  onClick={() => {
                    setMostrarMorada(
                      (
                        anterior,
                      ) =>
                        !anterior,
                    );
                  }}
                  className="
                    flex
                    min-h-10
                    w-full
                    items-center
                    justify-between
                    gap-3
                    py-2
                    text-left
                    transition

                    hover:text-blue-700

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  aria-expanded={
                    mostrarMorada
                  }
                >
                  <span
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className="
                        flex
                        h-6
                        w-6
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-50
                        text-base
                        font-bold
                        text-blue-600
                      "
                      aria-hidden="true"
                    >
                      {mostrarMorada
                        ? "−"
                        : "+"}
                    </span>

                    <span
                      className="
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      {mostrarMorada
                        ? "Ocultar morada"
                        : "Adicionar morada"}
                    </span>
                  </span>

                  {!mostrarMorada && (
                    <span
                      className="
                        shrink-0
                        text-xs
                        font-medium
                        text-slate-400
                      "
                    >
                      Opcional
                    </span>
                  )}
                </button>

                {mostrarMorada && (
                  <div
                    className="
                      mt-2
                      grid
                      grid-cols-1
                      gap-3
                    "
                  >
                    <label
                      className="
                        block
                      "
                    >
                      <span
                        className="
                          mb-1.5
                          block
                          text-sm
                          font-semibold
                          text-slate-700
                        "
                      >
                        Morada
                      </span>

                      <input
                        type="text"
                        autoComplete="street-address"
                        disabled={
                          bloqueado
                        }
                        value={
                          formulario.morada
                        }
                        onChange={(
                          event,
                        ) => {
                          setErro("");

                          setFormulario(
                            (
                              anterior,
                            ) => ({
                              ...anterior,

                              morada:
                                event
                                  .target
                                  .value,
                            }),
                          );
                        }}
                        className="
                          h-11
                          w-full
                          rounded-xl
                          border
                          border-slate-300
                          bg-white
                          px-3.5
                          text-base
                          text-slate-900
                          outline-none
                          transition

                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-100

                          disabled:bg-slate-100
                          disabled:text-slate-500

                          sm:text-sm
                        "
                      />
                    </label>

                    <div
                      className="
                        grid
                        grid-cols-1
                        gap-3
                        sm:grid-cols-2
                      "
                    >
                      <label
                        className="
                          block
                        "
                      >
                        <span
                          className="
                            mb-1.5
                            block
                            text-sm
                            font-semibold
                            text-slate-700
                          "
                        >
                          Código Postal
                        </span>

                        <input
                          type="text"
                          inputMode="text"
                          autoComplete="postal-code"
                          disabled={
                            bloqueado
                          }
                          value={
                            formulario.codigoPostal
                          }
                          onChange={(
                            event,
                          ) => {
                            setErro("");

                            setFormulario(
                              (
                                anterior,
                              ) => ({
                                ...anterior,

                                codigoPostal:
                                  event
                                    .target
                                    .value,
                              }),
                            );
                          }}
                          className="
                            h-11
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3.5
                            text-base
                            text-slate-900
                            outline-none
                            transition

                            focus:border-blue-500
                            focus:ring-2
                            focus:ring-blue-100

                            disabled:bg-slate-100
                            disabled:text-slate-500

                            sm:text-sm
                          "
                        />
                      </label>

                      <label
                        className="
                          block
                        "
                      >
                        <span
                          className="
                            mb-1.5
                            block
                            text-sm
                            font-semibold
                            text-slate-700
                          "
                        >
                          Localidade
                        </span>

                        <input
                          type="text"
                          autoComplete="address-level2"
                          disabled={
                            bloqueado
                          }
                          value={
                            formulario.localidade
                          }
                          onChange={(
                            event,
                          ) => {
                            setErro("");

                            setFormulario(
                              (
                                anterior,
                              ) => ({
                                ...anterior,

                                localidade:
                                  event
                                    .target
                                    .value,
                              }),
                            );
                          }}
                          className="
                            h-11
                            w-full
                            rounded-xl
                            border
                            border-slate-300
                            bg-white
                            px-3.5
                            text-base
                            text-slate-900
                            outline-none
                            transition

                            focus:border-blue-500
                            focus:ring-2
                            focus:ring-blue-100

                            disabled:bg-slate-100
                            disabled:text-slate-500

                            sm:text-sm
                          "
                        />
                      </label>
                    </div>
                  </div>
                )}
              </section>

              {/* ================================================
                  ERRO

                  Fica dentro da área scrollável para permitir
                  mensagens extensas devolvidas pelo backend.
                  ================================================ */}

              {erro !== "" && (
                <div
                  className="
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

              {/*
                Espaço inferior para que o último conteúdo
                não fique encostado ao rodapé fixo.
              */}
              <div
                className="
                  h-1
                "
              />
            </div>
          )}
        </div>

        {/* ======================================================
            RODAPÉ

            Sempre visível.

            Em telefone os dois botões ocupam toda a largura
            e têm 48px de altura.

            safe-area inferior incluída para iPhone/PWA.
            ====================================================== */}

        <div
          className="
            shrink-0
            border-t
            border-slate-200
            bg-white
            px-3
            pt-2.5
            sm:px-5
          "
          style={{
            paddingBottom:
              "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="
              grid
              grid-cols-2
              gap-2
            "
          >
            <button
              type="button"
              disabled={
                bloqueado
              }
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

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                !podeCriar
              }
              onClick={() => {
                void criarCliente();
              }}
              className="
                h-12
                rounded-xl
                bg-blue-600
                px-4
                text-sm
                font-semibold
                text-white
                transition

                active:bg-blue-800
                hover:bg-blue-700

                disabled:cursor-not-allowed
                disabled:bg-slate-400
              "
            >
              {aCriar
                ? "A criar..."
                : "Criar cliente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}