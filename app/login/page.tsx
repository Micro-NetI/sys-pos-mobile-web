"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type {
  POSMobilePostoDisponivel,
  POSMobilePostosDisponiveisResposta,
} from "@/types/postos";

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

interface LoginResponse {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: {
    idPosto: number;
    utilizador: {
      idUtilizador: number;
      idRecursoHumano: number;
      login: string;
    };
    sessao: {
      accessToken: string;
      expiraEm: string;
    };
  } | null;
}

export default function LoginPage() {
  const router = useRouter();

  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [postos, setPostos] =
    useState<POSMobilePostoDisponivel[]>([]);

  const [idPosto, setIdPosto] =
    useState(0);

  const [
    aCarregarPostos,
    setACarregarPostos,
  ] = useState(true);

  const [
    mensagemErroPostos,
    setMensagemErroPostos,
  ] = useState("");

  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] =
    useState(false);
  const [aCarregar, setACarregar] =
    useState(false);
  const [mensagemErro, setMensagemErro] =
    useState("");

  useEffect(() => {
    const token =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    if (token) {
      router.replace("/pos");
      return;
    }

    let componenteAtivo = true;

    async function carregarPostos() {
      setACarregarPostos(true);
      setMensagemErroPostos("");

      try {
        const response =
          await fetch(
            "/api/pos-mobile/postos",
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              cache: "no-store",
            },
          );

        const resultado =
          (await response.json()) as
            POSMobilePostosDisponiveisResposta;

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível carregar os postos disponíveis.",
          );
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
              (primeiro, segundo) =>
                primeiro.nomeExibicao.localeCompare(
                  segundo.nomeExibicao,
                  "pt-PT",
                ),
            );

        if (
          postosValidos.length === 0
        ) {
          throw new Error(
            "Não existem postos disponíveis para iniciar a sessão.",
          );
        }

        if (!componenteAtivo) {
          return;
        }

        setPostos(
          postosValidos,
        );

        const idPostoGuardado =
          Number(
            localStorage.getItem(
              "posMobilePostoPreferido",
            ),
          );

        const postoGuardadoValido =
          postosValidos.some(
            (posto) =>
              posto.idPosto ===
              idPostoGuardado,
          );

        setIdPosto(
          postoGuardadoValido
            ? idPostoGuardado
            : postosValidos[0]
                .idPosto,
        );
      } catch (error) {
        if (!componenteAtivo) {
          return;
        }

        setPostos([]);
        setIdPosto(0);

        setMensagemErroPostos(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os postos disponíveis.",
        );
      } finally {
        if (componenteAtivo) {
          setACarregarPostos(
            false,
          );
        }
      }
    }

    void carregarPostos();

    return () => {
      componenteAtivo = false;
    };
  }, [router]);

  function limparErro() {
    if (mensagemErro) {
      setMensagemErro("");
    }
  }

  function adicionarDigito(
    digito: string,
  ) {
    if (aCarregar) {
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
    if (aCarregar) {
      return;
    }

    limparErro();

    setPassword(
      (valorAtual) =>
        valorAtual.slice(0, -1),
    );

    inputRef.current?.focus();
  }

  function limparPin() {
    if (aCarregar) {
      return;
    }

    limparErro();
    setPassword("");
    inputRef.current?.focus();
  }

  async function efetuarLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensagemErro("");

    if (
      !Number.isInteger(idPosto) ||
      idPosto <= 0
    ) {
      setMensagemErro(
        "Selecione um posto válido.",
      );

      return;
    }

    if (!password) {
      setMensagemErro(
        "Introduza o PIN do operador.",
      );

      inputRef.current?.focus();
      return;
    }

    setACarregar(true);

    try {
      const response = await fetch(
        "/api/pos-mobile/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            idPosto,
            login: "",
            password,
          }),
        },
      );

      const resultado =
        (await response.json()) as LoginResponse;

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        setMensagemErro(
          resultado.mensagem ||
            "Não foi possível efetuar o login.",
        );

        setPassword("");
        inputRef.current?.focus();
        return;
      }

      sessionStorage.setItem(
        "posMobileAccessToken",
        resultado.dados.sessao.accessToken,
      );

      sessionStorage.setItem(
        "posMobileExpiraEm",
        resultado.dados.sessao.expiraEm,
      );

      sessionStorage.setItem(
        "posMobileIdPosto",
        String(resultado.dados.idPosto),
      );

      localStorage.setItem(
        "posMobilePostoPreferido",
        String(resultado.dados.idPosto),
      );

      sessionStorage.setItem(
        "posMobileUtilizador",
        JSON.stringify(
          resultado.dados.utilizador,
        ),
      );

      router.replace("/pos");
    } catch (error) {
      console.error(
        "Erro ao efetuar login:",
        error,
      );

      setMensagemErro(
        "Não foi possível comunicar com o servidor.",
      );

      setPassword("");
      inputRef.current?.focus();
    } finally {
      setACarregar(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 p-1 text-slate-100">
      <div className="mx-auto flex h-[calc(100dvh-0.5rem)] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
        <section className="relative hidden w-[42%] overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-800 p-10 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-black text-blue-700 shadow-sm">
                S
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/70">
                  MICRO-NET
                </p>

                <h1 className="text-lg font-bold">
                  SysPOS Mobile
                </h1>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100">
              Ponto de venda
            </p>

            <h2 className="text-4xl font-black leading-tight xl:text-5xl">
              Operação rápida,
              <br />
              simples e segura.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-blue-100 xl:text-lg">
              Consulte salas, mesas e pedidos
              através de uma interface otimizada
              para terminais e tablets.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 text-sm text-blue-100">
            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
              Sessão segura
            </span>

            <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
              Posto selecionável
            </span>
          </div>
        </section>

        <section className="flex w-full items-center justify-center overflow-y-auto bg-slate-50 p-4 text-slate-900 sm:p-6 lg:w-[58%] lg:p-8 xl:p-10">
          <div className="w-full max-w-lg py-4">
            <div className="mb-6 lg:hidden">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-600/30">
                  S
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    MICRO-NET
                  </p>

                  <p className="font-bold text-slate-900">
                    SysPOS Mobile
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
                Acesso ao sistema
              </p>

              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Iniciar sessão
              </h1>

              <p className="mt-3 text-base leading-7 text-slate-500">
                Selecione o posto e introduza o PIN do operador.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={efetuarLogin}
            >
              <div>
                <label
                  htmlFor="idPosto"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Posto
                </label>

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
                        d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"
                      />
                    </svg>
                  </span>

                  <select
                    id="idPosto"
                    name="idPosto"
                    value={idPosto}
                    disabled={
                      aCarregar ||
                      aCarregarPostos ||
                      postos.length === 0
                    }
                    onChange={(event) => {
                      const novoIdPosto =
                        Number(
                          event.target.value,
                        );

                      setIdPosto(
                        novoIdPosto,
                      );

                      if (
                        Number.isInteger(
                          novoIdPosto,
                        ) &&
                        novoIdPosto > 0
                      ) {
                        localStorage.setItem(
                          "posMobilePostoPreferido",
                          String(
                            novoIdPosto,
                          ),
                        );
                      }

                      limparErro();
                      inputRef.current?.focus();
                    }}
                    className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {aCarregarPostos ? (
                      <option value={0}>
                        A carregar postos...
                      </option>
                    ) : postos.length === 0 ? (
                      <option value={0}>
                        Nenhum posto disponível
                      </option>
                    ) : (
                      postos.map(
                        (posto) => (
                          <option
                            key={
                              posto.idPosto
                            }
                            value={
                              posto.idPosto
                            }
                          >
                            {
                              posto.nomeExibicao
                            }
                            {" · "}
                            {
                              posto.numeroSalas
                            }{" "}
                            {posto.numeroSalas ===
                            1
                              ? "sala"
                              : "salas"}
                          </option>
                        ),
                      )
                    )}
                  </select>

                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
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
                        d="m6 9 6 6 6-6"
                      />
                    </svg>
                  </span>
                </div>

                {mensagemErroPostos && (
                  <div
                    role="alert"
                    className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
                  >
                    {
                      mensagemErroPostos
                    }
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  PIN do operador
                </label>

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
                    type={
                      mostrarPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="off"
                    inputMode="none"
                    autoFocus
                    value={password}
                    disabled={
                      aCarregar ||
                      aCarregarPostos ||
                      idPosto <= 0
                    }
                    onChange={(event) => {
                      const valorNumerico =
                        event.target.value.replace(
                          /\D/g,
                          "",
                        );

                      setPassword(
                        valorNumerico,
                      );

                      limparErro();
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Escape"
                      ) {
                        event.preventDefault();
                        limparPin();
                      }
                    }}
                    placeholder="Introduza o PIN"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-14 text-center text-2xl font-black tracking-[0.3em] text-slate-900 outline-none transition placeholder:text-base placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    disabled={
                      aCarregar ||
                      aCarregarPostos ||
                      idPosto <= 0
                    }
                    onClick={() =>
                      setMostrarPassword(
                        (valorAtual) =>
                          !valorAtual,
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

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {TECLAS_NUMERICAS.map(
                  (digito) => (
                    <button
                      key={digito}
                      type="button"
                      disabled={
                        aCarregar ||
                        aCarregarPostos ||
                        idPosto <= 0
                      }
                      onClick={() =>
                        adicionarDigito(
                          digito,
                        )
                      }
                      className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:h-16"
                    >
                      {digito}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={
                    aCarregar ||
                    aCarregarPostos ||
                    idPosto <= 0 ||
                    password.length === 0
                  }
                  onClick={limparPin}
                  className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300 sm:h-16"
                >
                  Limpar
                </button>

                <button
                  type="button"
                  disabled={
                    aCarregar ||
                    aCarregarPostos ||
                    idPosto <= 0
                  }
                  onClick={() =>
                    adicionarDigito("0")
                  }
                  className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:h-16"
                >
                  0
                </button>

                <button
                  type="button"
                  disabled={
                    aCarregar ||
                    aCarregarPostos ||
                    idPosto <= 0 ||
                    password.length === 0
                  }
                  onClick={
                    apagarUltimoDigito
                  }
                  aria-label="Apagar último dígito"
                  className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300 sm:h-16"
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

              {mensagemErro && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
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

              <button
                type="submit"
                disabled={
                  aCarregar ||
                  aCarregarPostos ||
                  idPosto <= 0 ||
                  password.length === 0
                }
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-200 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-blue-400 disabled:hover:translate-y-0"
              >
                {aCarregar ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    <span>
                      A iniciar sessão...
                    </span>
                  </>
                ) : (
                  <>
                    <span>Entrar no POS</span>

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
            </form>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-xs font-medium text-slate-400">
              <span>SysPOS Mobile</span>

              <span className="text-right">
                Ligação segura à APIFNT
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}