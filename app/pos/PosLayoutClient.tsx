"use client";

import {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import {
} from "next/navigation";

import {
  POSContextoProvider,
  usePOSContexto,
} from "./POSContextoContext";

import type {
  ContextoPostoResposta,
} from "@/types/contexto";

interface PosLayoutClientProps {
  children: ReactNode;
}

interface DadosComIDPosto {
  idPosto?: unknown;

  dados?: {
    idPosto?: unknown;
  };

  posto?: {
    idPosto?: unknown;
  };
}

function converterIDPosto(
  valor: unknown,
): number {
  const numero =
    typeof valor === "number"
      ? valor
      : typeof valor ===
          "string"
        ? Number(
            valor.trim(),
          )
        : 0;

  if (
    !Number.isInteger(
      numero,
    ) ||
    numero <= 0
  ) {
    return 0;
  }

  return numero;
}

function obterIDPostoDeJSON(
  valorGuardado:
    string | null,
): number {
  if (!valorGuardado) {
    return 0;
  }

  try {
    const dados =
      JSON.parse(
        valorGuardado,
      ) as DadosComIDPosto;

    return (
      converterIDPosto(
        dados.idPosto,
      ) ||
      converterIDPosto(
        dados.dados
          ?.idPosto,
      ) ||
      converterIDPosto(
        dados.posto
          ?.idPosto,
      )
    );
  } catch {
    return 0;
  }
}

function obterIDPostoGuardado(): number {
  const idPostoDireto =
    converterIDPosto(
      sessionStorage.getItem(
        "posMobileIdPosto",
      ),
    );

  if (
    idPostoDireto > 0
  ) {
    return idPostoDireto;
  }

  const chavesJSON = [
    "posMobileMesaEmAbertura",
    "posMobileContaSelecionada",
    "posMobileSessao",
    "posMobileLogin",
  ];

  for (
    const chave of
    chavesJSON
  ) {
    const idPosto =
      obterIDPostoDeJSON(
        sessionStorage.getItem(
          chave,
        ),
      );

    if (
      idPosto > 0
    ) {
      sessionStorage.setItem(
        "posMobileIdPosto",
        String(
          idPosto,
        ),
      );

      return idPosto;
    }
  }

  return 0;
}

function MensagemErroContexto({
  mensagem,
  onTentarNovamente,
}: {
  mensagem: string;
  onTentarNovamente: () => void;
}) {
  return (
    <div className="px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
        <div>
          <p className="text-sm font-black text-red-900">
            Contexto
            indisponível
          </p>

          <p className="mt-1 text-sm font-semibold text-red-800">
            {mensagem}
          </p>
        </div>

        <button
          type="button"
          onClick={
            onTentarNovamente
          }
          className="h-10 shrink-0 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-100"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

// function NavegacaoPOS() {
//   const router =
//     useRouter();

//   const pathname =
//     usePathname();

//   const emCozinha =
//     pathname.startsWith(
//       "/pos/cozinha",
//     );

//   /*
//    * Consideramos "Mesas" ativo
//    * em todas as páginas POS
//    * exceto no monitor de
//    * cozinha.
//    */
//   const emMesas =
//     !emCozinha;

//   return (
//     <div className="border-b border-slate-200 bg-white">
//       <div className="mx-auto flex max-w-[1800px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6">
//         <button
//           type="button"
//           onClick={() => {
//             router.push(
//               "/pos",
//             );
//           }}
//           className={[
//             "h-10 shrink-0 rounded-xl border px-4 text-sm font-black transition",
//             emMesas
//               ? "border-violet-600 bg-violet-600 text-white shadow-sm"
//               : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
//           ].join(
//             " ",
//           )}
//         >
//           Mesas
//         </button>

//         <button
//           type="button"
//           onClick={() => {
//             router.push(
//               "/pos/cozinha",
//             );
//           }}
//           className={[
//             "h-10 shrink-0 rounded-xl border px-4 text-sm font-black transition",
//             emCozinha
//               ? "border-violet-600 bg-violet-600 text-white shadow-sm"
//               : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
//           ].join(
//             " ",
//           )}
//         >
//           Pedidos cozinha
//         </button>
//       </div>
//     </div>
//   );
// }

function PosLayoutConteudo({
  children,
}: PosLayoutClientProps) {
  const {
    definirContextoPosto,
  } =
    usePOSContexto();

  const [
    mensagemErro,
    setMensagemErro,
  ] = useState("");

  const [
    tentativa,
    setTentativa,
  ] = useState(0);

  useEffect(() => {
    const abortController =
      new AbortController();

    let componenteAtivo =
      true;

    async function carregarContextoPosto() {
      setMensagemErro(
        "",
      );

      const idPosto =
        obterIDPostoGuardado();

      if (
        idPosto <= 0
      ) {
        definirContextoPosto(
          null,
        );

        setMensagemErro(
          "Não foi possível identificar o posto. Termine a sessão e efetue novamente o login.",
        );

        return;
      }

      try {
        const response =
          await fetch(
            `/api/pos-mobile/contexto?idPosto=${encodeURIComponent(
              String(
                idPosto,
              ),
            )}`,
            {
              method:
                "GET",

              headers: {
                Accept:
                  "application/json",
              },

              cache:
                "no-store",

              signal:
                abortController.signal,
            },
          );

        const resultado =
          (await response.json()) as
            ContextoPostoResposta;

        if (
          !response.ok ||
          !resultado.sucesso ||
          !resultado.dados
        ) {
          throw new Error(
            resultado.mensagem ||
              "Não foi possível carregar o contexto do posto.",
          );
        }

        if (
          !componenteAtivo
        ) {
          return;
        }

        definirContextoPosto(
          resultado.dados,
        );

        sessionStorage.setItem(
          "posMobileIdPosto",
          String(
            resultado.dados
              .posto
              .idPosto,
          ),
        );
      } catch (error) {
        if (
          !componenteAtivo ||
          abortController
            .signal
            .aborted
        ) {
          return;
        }

        definirContextoPosto(
          null,
        );

        setMensagemErro(
          error instanceof
            Error
            ? error.message
            : "Ocorreu um erro inesperado ao carregar o contexto do posto.",
        );
      }
    }

    void carregarContextoPosto();

    return () => {
      componenteAtivo =
        false;

      abortController.abort();
    };
  }, [
    definirContextoPosto,
    tentativa,
  ]);

  function tentarNovamente() {
    setTentativa(
      (
        valorAtual,
      ) =>
        valorAtual + 1,
    );
  }

  return (
    <div className="min-h-screen">
      {/* <NavegacaoPOS /> */}

      {mensagemErro && (
        <MensagemErroContexto
          mensagem={
            mensagemErro
          }
          onTentarNovamente={
            tentarNovamente
          }
        />
      )}

      {children}
    </div>
  );
}

export default function PosLayoutClient({
  children,
}: PosLayoutClientProps) {
  return (
    <POSContextoProvider>
      <PosLayoutConteudo>
        {children}
      </PosLayoutConteudo>
    </POSContextoProvider>
  );
}