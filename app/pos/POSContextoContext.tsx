"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  ContextoPostoDados,
} from "@/types/contexto";

export interface POSSalaContexto {
  idSala: number;
  descricaoSala: string;
}

interface POSContextoContextValue {
  contextoPosto:
    | ContextoPostoDados
    | null;

  salaAtual:
    | POSSalaContexto
    | null;

  definirContextoPosto: (
    contexto:
      | ContextoPostoDados
      | null,
  ) => void;

  definirSalaAtual: (
    sala:
      | POSSalaContexto
      | null,
  ) => void;
}

const POSContextoContext =
  createContext<
    POSContextoContextValue
    | undefined
  >(undefined);

interface POSContextoProviderProps {
  children: ReactNode;
}

export function POSContextoProvider({
  children,
}: POSContextoProviderProps) {
  const [
    contextoPosto,
    setContextoPosto,
  ] =
    useState<ContextoPostoDados | null>(
      null,
    );

  const [
    salaAtual,
    setSalaAtual,
  ] =
    useState<POSSalaContexto | null>(
      null,
    );

  const definirContextoPosto =
    useCallback(
      (
        contexto:
          | ContextoPostoDados
          | null,
      ) => {
        setContextoPosto(
          contexto,
        );
      },
      [],
    );

  const definirSalaAtual =
    useCallback(
      (
        sala:
          | POSSalaContexto
          | null,
      ) => {
        setSalaAtual(
          sala,
        );
      },
      [],
    );

  const valor =
    useMemo<
      POSContextoContextValue
    >(
      () => ({
        contextoPosto,
        salaAtual,
        definirContextoPosto,
        definirSalaAtual,
      }),
      [
        contextoPosto,
        salaAtual,
        definirContextoPosto,
        definirSalaAtual,
      ],
    );

  return (
    <POSContextoContext.Provider
      value={valor}
    >
      {children}
    </POSContextoContext.Provider>
  );
}

export function usePOSContexto():
  POSContextoContextValue {
  const contexto =
    useContext(
      POSContextoContext,
    );

  if (!contexto) {
    throw new Error(
      "usePOSContexto deve ser utilizado dentro de POSContextoProvider.",
    );
  }

  return contexto;
}