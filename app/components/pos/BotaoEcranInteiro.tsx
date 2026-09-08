"use client";

import {
  useEffect,
  useState,
} from "react";

interface BotaoEcranInteiroProps {
  className?: string;
}

export default function BotaoEcranInteiro({
  className = "",
}: BotaoEcranInteiroProps) {
  const [
    ecranInteiro,
    setEcranInteiro,
  ] = useState(false);

  const [
    suportado,
    setSuportado,
  ] = useState(false);

  useEffect(() => {
    setSuportado(
      typeof document !==
        "undefined" &&
        typeof document
          .documentElement
          .requestFullscreen ===
          "function",
    );

    function atualizarEstado() {
      setEcranInteiro(
        document.fullscreenElement !==
          null,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      atualizarEstado,
    );

    atualizarEstado();

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        atualizarEstado,
      );
    };
  }, []);

  async function alternarEcranInteiro() {
    if (!suportado) {
      return;
    }

    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();
        return;
      }

      await document
        .documentElement
        .requestFullscreen();
    } catch (error) {
      console.error(
        "Não foi possível alterar o modo de ecrã inteiro:",
        error,
      );
    }
  }

  if (!suportado) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() =>
        void alternarEcranInteiro()
      }
      title={
        ecranInteiro
          ? "Sair do ecrã inteiro"
          : "Abrir em ecrã inteiro"
      }
      aria-label={
        ecranInteiro
          ? "Sair do ecrã inteiro"
          : "Abrir em ecrã inteiro"
      }
      className={[
        "flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95",
        className,
      ].join(" ")}
    >
      {ecranInteiro ? (
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
            d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"
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
            d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"
          />
        </svg>
      )}
    </button>
  );
}