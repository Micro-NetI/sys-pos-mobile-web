"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";
import Image from "next/image";

import type {
  POSMobilePostoDisponivel,
} from "@/types/postos";

import type {
  LoginResponse,
  POSMobileUtilizadorLogin,
  PrepararLoginResponse,
} from "@/types/autenticacao";


const TECLAS_NUMERICAS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;


type FaseLogin =
  | "PIN"
  | "POSTO";


export default function LoginPage() {
  const router =
    useRouter();


  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  const [
    fase,
    setFase,
  ] =
    useState<FaseLogin>(
      "PIN",
    );


  const [
    postos,
    setPostos,
  ] =
    useState<
      POSMobilePostoDisponivel[]
    >(
      [],
    );


  const [
    idPosto,
    setIdPosto,
  ] =
    useState(
      0,
    );


  const [
    utilizadorPreparado,
    setUtilizadorPreparado,
  ] =
    useState<
      POSMobileUtilizadorLogin | null
    >(
      null,
    );


  const [
    password,
    setPassword,
  ] =
    useState(
      "",
    );


  const [
    mostrarPassword,
    setMostrarPassword,
  ] =
    useState(
      false,
    );


  const [
    aCarregar,
    setACarregar,
  ] =
    useState(
      false,
    );


  const [
    mensagemErro,
    setMensagemErro,
  ] =
    useState(
      "",
    );


  useEffect(() => {
    const token =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (token) {
      router.replace(
        "/pos",
      );

      return;
    }

    /*
      Não carregamos postos nesta fase.

      Os postos só serão pedidos depois
      de o PIN ser validado pela APIFNT.
    */
    inputRef.current?.focus();
  }, [
    router,
  ]);


  function limparErro() {
    if (mensagemErro) {
      setMensagemErro(
        "",
      );
    }
  }


  function adicionarDigito(
    digito: string,
  ) {
    if (
      aCarregar ||
      fase !== "PIN"
    ) {
      return;
    }

    limparErro();

    setPassword(
      (valorAtual) =>
        `${valorAtual}${digito}`,
    );

    inputRef.current?.focus();
  }


  function apagarUltimoDigito() {
    if (
      aCarregar ||
      fase !== "PIN"
    ) {
      return;
    }

    limparErro();

    setPassword(
      (valorAtual) =>
        valorAtual.slice(
          0,
          -1,
        ),
    );

    inputRef.current?.focus();
  }


  function limparPin() {
    if (
      aCarregar ||
      fase !== "PIN"
    ) {
      return;
    }

    limparErro();

    setPassword(
      "",
    );

    inputRef.current?.focus();
  }


  function voltarAoPin() {
    if (aCarregar) {
      return;
    }

    setFase(
      "PIN",
    );

    setPostos(
      [],
    );

    setIdPosto(
      0,
    );

    setUtilizadorPreparado(
      null,
    );

    setPassword(
      "",
    );

    setMostrarPassword(
      false,
    );

    setMensagemErro(
      "",
    );

    window.setTimeout(
      () => {
        inputRef.current?.focus();
      },
      0,
    );
  }


  async function prepararLogin() {
    setMensagemErro(
      "",
    );

    if (
      password.trim() === ""
    ) {
      setMensagemErro(
        "Introduza o PIN do operador.",
      );

      inputRef.current?.focus();

      return;
    }


    setACarregar(
      true,
    );


    try {
      /*
        Primeira fase.

        Apenas enviamos:
          - login;
          - PIN.

        Não existe posto selecionado.
      */
      const response =
        await fetch(
          "/api/pos-mobile/preparar-login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache:
              "no-store",

            body:
              JSON.stringify(
                {
                  login:
                    "",

                  password,
                },
              ),
          },
        );


      const resultado =
        (await response.json()) as
          PrepararLoginResponse;


      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        /*
          Caso específico pedido:

          credenciais válidas mas utilizador
          sem postos atribuídos/disponíveis.
        */
        if (
          resultado.codigo ===
          "POSTOS_UTILIZADOR_NAO_ENCONTRADOS"
        ) {
          setMensagemErro(
            "Não tem postos de trabalho atribuídos. Contacte o administrador.",
          );
        } else {
          setMensagemErro(
            resultado.mensagem ||
              "Não foi possível autenticar o operador.",
          );
        }


        setPassword(
          "",
        );

        inputRef.current?.focus();

        return;
      }


      const postosValidos =
        resultado.dados.postos
          .filter(
            (posto) =>
              Number.isInteger(
                posto.idPosto,
              ) &&
              posto.idPosto > 0,
          )
          .sort(
            (
              primeiro,
              segundo,
            ) =>
              primeiro.nomeExibicao.localeCompare(
                segundo.nomeExibicao,
                "pt-PT",
              ),
          );


      /*
        Salvaguarda adicional.

        Normalmente este caso já terá sido
        tratado pela APIFNT através de:

        POSTOS_UTILIZADOR_NAO_ENCONTRADOS
      */
      if (
        postosValidos.length ===
        0
      ) {
        setMensagemErro(
          "Não tem postos de trabalho atribuídos. Contacte o administrador.",
        );

        setPassword(
          "",
        );

        inputRef.current?.focus();

        return;
      }


      setUtilizadorPreparado(
        resultado.dados.utilizador,
      );


      setPostos(
        postosValidos,
      );


      /*
        O posto preferido só pode ser utilizado
        se pertencer à lista autorizada que acabou
        de vir da APIFNT.
      */
      const idPostoPreferido =
        Number(
          localStorage.getItem(
            "posMobilePostoPreferido",
          ),
        );


      const postoPreferidoPermitido =
        Number.isInteger(
          idPostoPreferido,
        ) &&
        idPostoPreferido > 0 &&
        postosValidos.some(
          (posto) =>
            posto.idPosto ===
            idPostoPreferido,
        );


      setIdPosto(
        postoPreferidoPermitido
          ? idPostoPreferido
          : postosValidos[0]
              .idPosto,
      );


      /*
        O PIN permanece apenas em memória
        no estado React.

        Não é guardado em:
          - sessionStorage;
          - localStorage;
          - cookies.
      */
      setMostrarPassword(
        false,
      );


      setFase(
        "POSTO",
      );

    } catch (error) {
      console.error(
        "Erro ao preparar login:",
        error,
      );


      setMensagemErro(
        "Não foi possível comunicar com o servidor.",
      );

    } finally {
      setACarregar(
        false,
      );
    }
  }


  async function iniciarSessaoPosto() {
    setMensagemErro(
      "",
    );


    if (
      !Number.isInteger(
        idPosto,
      ) ||
      idPosto <= 0
    ) {
      setMensagemErro(
        "Selecione um posto válido.",
      );

      return;
    }


    /*
      Confirmação apenas de interface.

      A verdadeira autorização é novamente
      feita pela APIFNT no LoginOperador.
    */
    const postoPermitido =
      postos.some(
        (posto) =>
          posto.idPosto ===
          idPosto,
      );


    if (!postoPermitido) {
      setMensagemErro(
        "O posto selecionado não está autorizado para este operador.",
      );

      return;
    }


    /*
      O PIN deverá continuar disponível apenas
      em memória entre as duas fases.

      Se por algum motivo desapareceu,
      voltamos à autenticação.
    */
    if (
      password.trim() === ""
    ) {
      setMensagemErro(
        "O PIN do operador deixou de estar disponível. Introduza-o novamente.",
      );

      setFase(
        "PIN",
      );

      setPostos(
        [],
      );

      setIdPosto(
        0,
      );

      setUtilizadorPreparado(
        null,
      );


      window.setTimeout(
        () => {
          inputRef.current?.focus();
        },
        0,
      );

      return;
    }


    setACarregar(
      true,
    );


    try {
      /*
        Segunda fase.

        A APIFNT volta a validar:
          - login;
          - PIN;
          - ID_Utilizador;
          - ID_Posto;
          - Tab_PostoUtil.

        Só depois cria POSMobileSessao.
      */
      const response =
        await fetch(
          "/api/pos-mobile/login",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache:
              "no-store",

            body:
              JSON.stringify(
                {
                  idPosto,

                  login:
                    utilizadorPreparado
                      ?.login ??
                    "",

                  password,
                },
              ),
          },
        );


      const resultado =
        (await response.json()) as
          LoginResponse;


      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        if (
          resultado.codigo ===
          "POSTO_NAO_AUTORIZADO"
        ) {
          setMensagemErro(
            "Já não tem autorização para utilizar o posto selecionado.",
          );
        } else if (
          resultado.codigo ===
          "CREDENCIAIS_INVALIDAS"
        ) {
          /*
            Entre a preparação e a criação da sessão,
            as credenciais deixaram de validar.

            Recomeçamos o processo.
          */
          setMensagemErro(
            resultado.mensagem ||
              "O PIN do operador deixou de ser válido.",
          );

          setFase(
            "PIN",
          );

          setPostos(
            [],
          );

          setIdPosto(
            0,
          );

          setUtilizadorPreparado(
            null,
          );

          setPassword(
            "",
          );

          window.setTimeout(
            () => {
              inputRef.current?.focus();
            },
            0,
          );
        } else {
          setMensagemErro(
            resultado.mensagem ||
              "Não foi possível iniciar a sessão.",
          );
        }

        return;
      }


      /*
        Sessão POS definitiva.
      */
      sessionStorage.setItem(
        "posMobileAccessToken",
        resultado.dados
          .sessao
          .accessToken,
      );


      sessionStorage.setItem(
        "posMobileExpiraEm",
        resultado.dados
          .sessao
          .expiraEm,
      );


      sessionStorage.setItem(
        "posMobileIdPosto",
        String(
          resultado.dados
            .idPosto,
        ),
      );


      sessionStorage.setItem(
        "posMobileUtilizador",
        JSON.stringify(
          resultado.dados
            .utilizador,
        ),
      );


      /*
        Guardamos apenas a lista de postos
        que a APIFNT autorizou para este operador.

        Esta lista serve para a UI do seletor
        de postos dentro do POS.

        Não constitui uma autorização de segurança.
      */
      sessionStorage.setItem(
        "posMobilePostosAutorizados",
        JSON.stringify(
          postos,
        ),
      );


      /*
        Preferência visual.

        Só é atualizada após o login definitivo
        ter sido criado com sucesso.
      */
      localStorage.setItem(
        "posMobilePostoPreferido",
        String(
          resultado.dados
            .idPosto,
        ),
      );


      /*
        O PIN já não é necessário.
      */
      setPassword(
        "",
      );


      router.replace(
        "/pos",
      );

    } catch (error) {
      console.error(
        "Erro ao efetuar login:",
        error,
      );


      setMensagemErro(
        "Não foi possível comunicar com o servidor.",
      );

    } finally {
      setACarregar(
        false,
      );
    }
  }


  async function efetuarLogin(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    if (
      fase ===
      "PIN"
    ) {
      await prepararLogin();

      return;
    }


    await iniciarSessaoPosto();
  }


  return (
    <main className="min-h-screen bg-slate-950 text-slate-900">
      <div className="mx-auto flex min-h-[100dvh] w-full overflow-hidden bg-slate-50 lg:min-h-[100dvh]">

        {/* =====================================================
            IDENTIDADE / PAINEL ESQUERDO
            ===================================================== */}

        <section className="relative hidden w-[44%] overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex rounded-[1.5rem] border border-white/15 bg-white p-4 shadow-2xl shadow-black/20">
              <Image
                src="/imagens/app.png"
                alt="SysPOS Web"
                width={520}
                height={130}
                priority
                className="h-auto w-[285px] xl:w-[325px]"
              />
            </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.34em] text-cyan-200">
              Ponto de venda web
            </p>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl 2xl:text-6xl">
              Operação rápida,
              <br />
              simples e segura.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-blue-100 xl:text-lg">
              Aceda às mesas, contas, produtos e pagamentos através de uma interface pensada para terminais, tablets e utilização diária em POS.
            </p>

            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur xl:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
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
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </span>

                  <div>
                    <p className="text-sm font-black">Sessão segura</p>
                    <p className="mt-0.5 text-xs text-blue-100/90">Operador autenticado</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur xl:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
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
                        d="M3.75 21h16.5M4.5 3h15v18h-15V3Zm4.5 4.5h.008v.008H9V7.5Zm3 0h.008v.008H12V7.5Zm3 0h.008v.008H15V7.5ZM9 12h6"
                      />
                    </svg>
                  </span>

                  <div>
                    <p className="text-sm font-black">Postos autorizados</p>
                    <p className="mt-0.5 text-xs text-blue-100/90">Apenas os permitidos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-blue-200">
            <span>MICRO-NET</span>
            <span>Ligação segura à APIFNT</span>
          </div>
        </section>


        {/* =====================================================
            LOGIN
            ===================================================== */}

        <section className="flex w-full items-start justify-center overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:w-[56%] lg:items-center lg:px-12 lg:py-10 xl:px-20">
          <div className="w-full max-w-[520px] pt-[4dvh] sm:max-w-[560px] sm:pt-[5dvh] lg:max-w-[600px] lg:pt-0">

            {/* LOGÓTIPO MOBILE / TABLET */}
            <div className="mb-6 flex h-14 items-center lg:hidden">
              <Image
                src="/imagens/app.png"
                alt="SysPOS Web"
                width={260}
                height={65}
                priority
                className="h-auto w-[210px] sm:w-[235px]"
              />
            </div>


            {/* CABEÇALHO */}
            <div className="mb-5 lg:mb-6">
              <h2 className="text-[26px] font-black tracking-tight text-slate-950 sm:text-3xl lg:text-[32px]">
                {fase === "PIN"
                  ? "PIN do operador"
                  : "Selecionar posto"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {fase === "PIN"
                  ? "Introduza o PIN para continuar."
                  : "Escolha o posto onde pretende trabalhar."}
              </p>
            </div>


            <form
              className="space-y-4 lg:space-y-5"
              onSubmit={efetuarLogin}
            >

              {/* =================================================
                  FASE 1 - PIN
                  ================================================= */}

              {fase === "PIN" && (
                <>
                  <div>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
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
                            d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0 1 19.5 12.75v6A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75v-6a2.25 2.25 0 0 1 2.25-2.25Z"
                          />
                        </svg>
                      </span>

                      <input
                        ref={inputRef}
                        id="password"
                        name="password"
                        type={mostrarPassword ? "text" : "password"}
                        autoComplete="off"
                        inputMode="none"
                        autoFocus
                        value={password}
                        disabled={aCarregar}
                        onChange={(event) => {
                          const valorNumerico =
                            event.target.value.replace(
                              /\D/g,
                              "",
                            );

                          setPassword(valorNumerico);
                          limparErro();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            limparPin();
                          }
                        }}
                        placeholder="Introduza o PIN"
                        className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-14 text-center text-2xl font-black tracking-[0.34em] text-slate-950 shadow-sm outline-none transition placeholder:text-base placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 lg:h-[68px] lg:text-[28px]"
                      />

                      <button
                        type="button"
                        disabled={aCarregar}
                        onClick={() =>
                          setMostrarPassword(
                            (valorAtual) => !valorAtual,
                          )
                        }
                        aria-label={
                          mostrarPassword
                            ? "Ocultar PIN"
                            : "Mostrar PIN"
                        }
                        className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-2xl text-slate-400 transition hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-blue-100 disabled:cursor-not-allowed"
                      >
                        {mostrarPassword ? (
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
                              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.5a10.523 10.523 0 0 1-4.293 5.772M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242-4.242-4.242"
                            />
                          </svg>
                        ) : (
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
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .638C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>


                  {/* TECLADO */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:gap-3.5">
                    {TECLAS_NUMERICAS.map((digito) => (
                      <button
                        key={digito}
                        type="button"
                        disabled={aCarregar}
                        onClick={() => adicionarDigito(digito)}
                        className="flex h-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:h-14 lg:h-[62px] lg:text-[26px]"
                      >
                        {digito}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={
                        aCarregar ||
                        password.length === 0
                      }
                      onClick={limparPin}
                      className="flex h-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300 sm:h-14 lg:h-[62px] lg:text-base"
                    >
                      Limpar
                    </button>

                    <button
                      type="button"
                      disabled={aCarregar}
                      onClick={() => adicionarDigito("0")}
                      className="flex h-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:h-14 lg:h-[62px] lg:text-[26px]"
                    >
                      0
                    </button>

                    <button
                      type="button"
                      disabled={
                        aCarregar ||
                        password.length === 0
                      }
                      onClick={apagarUltimoDigito}
                      aria-label="Apagar último dígito"
                      className="flex h-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300 sm:h-14 lg:h-[62px]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 4H8l-5 8 5 8h13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m18 9-6 6m0-6 6 6"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}


              {/* =================================================
                  FASE 2 - POSTO
                  ================================================= */}

              {fase === "POSTO" && (
                <>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-6 w-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.5-1.632Z"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                          Operador autenticado
                        </p>
                        <p className="mt-0.5 truncate text-base font-black text-slate-950">
                          {utilizadorPreparado?.login || "Operador"}
                        </p>
                      </div>

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-5 w-5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>


                  <div>
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <label className="text-sm font-black text-slate-700">
                        Posto de trabalho
                      </label>

                      <span className="text-xs font-bold text-slate-400">
                        {postos.length === 1
                          ? "1 disponível"
                          : `${postos.length} disponíveis`}
                      </span>
                    </div>

                    <div
                      role="radiogroup"
                      aria-label="Posto de trabalho"
                      className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1 lg:max-h-[420px]"
                    >
                      {postos.map((posto) => {
                        const selecionado =
                          posto.idPosto === idPosto;

                        return (
                          <button
                            key={posto.idPosto}
                            type="button"
                            role="radio"
                            aria-checked={selecionado}
                            disabled={aCarregar}
                            onClick={() => {
                              setIdPosto(posto.idPosto);
                              limparErro();
                            }}
                            className={[
                              "group flex w-full items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition",
                              selecionado
                                ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40",
                              aCarregar
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
                                selecionado
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700",
                              ].join(" ")}
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
                                  d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"
                                />
                              </svg>
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-slate-950 sm:text-base">
                                {posto.nomeExibicao}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {posto.codigo
                                  ? `${posto.codigo} · `
                                  : ""}
                                {posto.numeroSalas}{" "}
                                {posto.numeroSalas === 1
                                  ? "sala"
                                  : "salas"}
                              </p>
                            </div>

                            <span
                              className={[
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                                selecionado
                                  ? "border-blue-600 bg-blue-600"
                                  : "border-slate-300 bg-white",
                              ].join(" ")}
                            >
                              {selecionado && (
                                <span className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}


              {/* =================================================
                  ERRO
                  ================================================= */}

              {mensagemErro && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mt-0.5 h-5 w-5 shrink-0"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.38c.865-1.5 3.03-1.5 3.896 0l7.355 12.746ZM12 16.5h.008v.008H12V16.5Z"
                    />
                  </svg>

                  <span>{mensagemErro}</span>
                </div>
              )}


              {/* =================================================
                  AÇÕES
                  ================================================= */}

              <button
                type="submit"
                disabled={
                  aCarregar ||
                  (
                    fase === "PIN"
                      ? password.length === 0
                      : (
                          !Number.isInteger(idPosto) ||
                          idPosto <= 0 ||
                          postos.length === 0
                        )
                  )
                }
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 text-base font-black text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-200 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-blue-400 disabled:hover:translate-y-0 lg:h-16 lg:text-lg"
              >
                {aCarregar ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span>
                      {fase === "PIN"
                        ? "A validar operador..."
                        : "A iniciar sessão..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {fase === "PIN"
                        ? "Continuar"
                        : "Entrar no POS"}
                    </span>

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
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </>
                )}
              </button>

              {fase === "POSTO" && (
                <button
                  type="button"
                  disabled={aCarregar}
                  onClick={voltarAoPin}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
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
                      d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                    />
                  </svg>

                  Utilizar outro operador
                </button>
              )}
            </form>


            {/* RODAPÉ */}
            <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-[11px] font-semibold text-slate-400 sm:text-xs lg:mt-7">
              <span>SysPOS Web</span>
              <span className="text-right">Ligação segura à APIFNT</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
