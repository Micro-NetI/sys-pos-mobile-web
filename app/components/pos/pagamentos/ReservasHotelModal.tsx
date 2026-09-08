"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  POSMobileHotelReserva,
  POSMobileHotelReservasResposta,
} from "@/types/pos-mobile-hotel";

interface ReservasHotelModalProps {
  open: boolean;
  accessToken: string;
  busy?: boolean;
  mensagemErro?: string;
  onClose: () => void;
  onSelecionar: (
    reserva: POSMobileHotelReserva,
  ) => void | Promise<void>;
}

function formatarData(
  valor: string | null,
): string {
  if (!valor) {
    return "—";
  }

  const partes =
    valor.split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export default function ReservasHotelModal({
  open,
  accessToken,
  busy = false,
  mensagemErro = "",
  onClose,
  onSelecionar,
}: ReservasHotelModalProps) {
  const [
    reservas,
    setReservas,
  ] =
    useState<POSMobileHotelReserva[]>(
      [],
    );

  const [
    selecionada,
    setSelecionada,
  ] =
    useState<POSMobileHotelReserva | null>(
      null,
    );

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    erroCarregamento,
    setErroCarregamento,
  ] = useState("");

  useEffect(() => {
    if (!open) {
      setReservas([]);
      setSelecionada(null);
      setPesquisa("");
      setErroCarregamento("");
      return;
    }

    let cancelado = false;

    async function carregarReservas() {
      setLoading(true);
      setErroCarregamento("");
      setSelecionada(null);

      try {
        const response =
          await fetch(
            "/api/pos-mobile/reservas-hotel",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Accept:
                  "application/json",
              },
              body:
                JSON.stringify({
                  accessToken,
                }),
            },
          );

        const resultado =
          (await response.json()) as
            POSMobileHotelReservasResposta;

        if (cancelado) {
          return;
        }

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível carregar as reservas do hotel.",
          );
        }

        setReservas(
          Array.isArray(
            resultado.dados.reservas,
          )
            ? resultado.dados.reservas
            : [],
        );
      } catch (error) {
        if (cancelado) {
          return;
        }

        setReservas([]);

        setErroCarregamento(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as reservas do hotel.",
        );
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    void carregarReservas();

    return () => {
      cancelado = true;
    };
  }, [
    open,
    accessToken,
  ]);

  const reservasFiltradas =
    useMemo(() => {
      const termo =
        pesquisa
          .trim()
          .toLocaleLowerCase(
            "pt-PT",
          );

      if (!termo) {
        return reservas;
      }

      return reservas.filter(
        (reserva) =>
          [
            String(
              reserva.idReserva,
            ),
            reserva.quarto,
            reserva.cliente,
          ].some((valor) =>
            valor
              .toLocaleLowerCase(
                "pt-PT",
              )
              .includes(
                termo,
              ),
          ),
      );
    }, [
      reservas,
      pesquisa,
    ]);

  if (!open) {
    return null;
  }

  const erroVisivel =
    mensagemErro.trim() ||
    erroCarregamento.trim();

  return (
    <div
      className="
        fixed
        inset-0
        z-[120]
        flex
        items-center
        justify-center
        bg-slate-950/60
        p-3
        backdrop-blur-sm
        sm:p-6
      "
    >
      <button
        type="button"
        aria-label="Fechar seleção de reserva"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        className="
          relative
          z-10
          flex
          max-h-[92vh]
          w-full
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              Débito ao quarto
            </p>

            <h2 className="truncate text-xl font-black text-slate-950">
              Reservas / Check-in
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              Selecione o hóspede e o quarto a associar à conta.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <input
            type="search"
            value={pesquisa}
            disabled={
              loading ||
              busy
            }
            onChange={(event) =>
              setPesquisa(
                event.target.value,
              )
            }
            placeholder="Pesquisar reserva, quarto ou cliente..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>

        {erroVisivel && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
            {erroVisivel}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center text-sm font-bold text-slate-500">
              A carregar reservas...
            </div>
          ) : reservasFiltradas.length ===
            0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center text-center">
              <p className="text-sm font-black text-slate-700">
                Nenhuma reserva encontrada
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Altere a pesquisa ou volte a abrir a lista para atualizar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {reservasFiltradas.map(
                (reserva) => {
                  const ativa =
                    selecionada?.idReserva ===
                      reserva.idReserva &&
                    selecionada?.quarto ===
                      reserva.quarto;

                  return (
                    <button
                      key={`${reserva.idReserva}-${reserva.quarto}`}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setSelecionada(
                          reserva,
                        )
                      }
                      onDoubleClick={() =>
                        void onSelecionar(
                          reserva,
                        )
                      }
                      className={`
                        grid
                        w-full
                        grid-cols-[72px_minmax(0,1fr)]
                        gap-3
                        rounded-2xl
                        border
                        p-3
                        text-left
                        transition
                        sm:grid-cols-[90px_100px_minmax(0,1fr)_110px_110px]
                        ${
                          ativa
                            ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                        }
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      `}
                    >
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                          Reserva
                        </p>

                        <p className="text-sm font-black text-slate-800">
                          {reserva.idReserva}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                          Quarto
                        </p>

                        <p className="text-base font-black text-blue-700">
                          {reserva.quarto}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                          Cliente
                        </p>

                        <p
                          title={
                            reserva.cliente
                          }
                          className="truncate text-sm font-black text-slate-900"
                        >
                          {reserva.cliente}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                          Entrada
                        </p>

                        <p className="text-xs font-bold text-slate-600">
                          {formatarData(
                            reserva.dataChegada,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                          Saída
                        </p>

                        <p className="text-xs font-bold text-slate-600">
                          {formatarData(
                            reserva.dataSaida,
                          )}
                        </p>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-bold text-slate-400">
            {reservasFiltradas.length} reserva
            {reservasFiltradas.length === 1
              ? ""
              : "s"}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={
                !selecionada ||
                busy
              }
              onClick={() => {
                if (
                  selecionada
                ) {
                  void onSelecionar(
                    selecionada,
                  );
                }
              }}
              className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy
                ? "A associar..."
                : "Selecionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}