//app\pos\page.tsx
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import DadosPostoPopover from "@/app/components/pos/DadosPostoPopover";
import MesaCard from "@/app/components/pos/MesaCard_profissional";

import type {
  POSMobileConfiguracao,
  POSMobileConfiguracaoResponse,
  POSMobileMesa,
  POSMobilePagina,
  POSMobileSala,
  POSMobileUtilizadorSessao,
} from "@/types/configuracao";

import type {
  ContextoPostoDados,
} from "@/types/contexto";

import type {
  POSMobileEstadoMesa,
  POSMobileEstadoMesasResposta,
  POSMobileEstadoVisualMesa as EstadoVisualMesa,
} from "@/types/estado-mesas";

import type {
  POSMobileContasMesaResposta,
  POSMobileResumoConta,
} from "@/types/contas";

import type {
  POSMobilePostoDisponivel,
  POSMobilePostosDisponiveisResposta,
} from "@/types/postos";

interface POSMobileContextoResponse {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: ContextoPostoDados | null;
}

interface POSMobileEstadoMesaComAcesso
  extends POSMobileEstadoMesa {
  idPostoMovimento?: number | null;
  podeEntrar?: boolean;
  podeAbrir?: boolean;
  codigoAcesso?: string | null;
  mensagemAcesso?: string | null;
}

interface POSMobileValidarAcessoMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileEstadoMesaComAcesso | null;
}


interface POSMobileUsoMesaDados {
  idPosto: number;
  idSala: number;
  idPagina: number;
  idMesa: number;
  emUso: boolean;
}

interface POSMobileUsoMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileUsoMesaDados | null;
}

interface MesaComEstado extends POSMobileMesa {
  estado: POSMobileEstadoMesaComAcesso;
  estadoVisual: EstadoVisualMesa;
}

function criarEstadoLivre(
  mesa: POSMobileMesa,
): POSMobileEstadoMesaComAcesso {
  return {
    idPosto: null,
    idSala: mesa.idSala,
    idPagina: mesa.idPagina,
    idMesa: mesa.idMesa,
    numeroMesa: mesa.numeroMesa,
    descricaoMesa:
      mesa.descricao ||
      `Mesa ${mesa.numeroMesa}`,
    descricaoSala: null,
    estado: "LIVRE",
    ocupada: false,
    emUso: false,
    reservada: false,
    bloqueada: false,
    idMovimentoMesa: null,
    numeroContas: 0,
    numeroPessoas: 0,
    valorAtual: 0,
    utilizador: null,
    postoEmUso: null,
    dataAbertura: null,
    horaAbertura: null,
    idPostoMovimento: null,
    podeEntrar: true,
    podeAbrir: true,
    codigoAcesso: "MESA_LIVRE",
    mensagemAcesso: "A mesa está disponível.",
  };
}

function obterEstadoVisual(
  estado: POSMobileEstadoMesa,
): EstadoVisualMesa {
  if (estado.bloqueada) {
    return "BLOQUEADA";
  }

  if (estado.emUso) {
    return "EM_USO";
  }

  if (estado.reservada) {
    return "RESERVADA";
  }

  if (estado.ocupada) {
    return "OCUPADA";
  }

  return "LIVRE";
}

function obterTextoEstado(
  estado: EstadoVisualMesa,
): string {
  switch (estado) {
    case "OCUPADA":
      return "Ocupada";

    case "EM_USO":
      return "Em uso";

    case "RESERVADA":
      return "Reservada";

    case "BLOQUEADA":
      return "Bloqueada";

    default:
      return "Livre";
  }
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(valor);
}

function PosPageConteudo() {
  const router = useRouter();

  const salasContainerRef =
    useRef<HTMLDivElement | null>(null);

  const [
    podeDeslocarSalasEsquerda,
    setPodeDeslocarSalasEsquerda,
  ] = useState(false);

  const [
    podeDeslocarSalasDireita,
    setPodeDeslocarSalasDireita,
  ] = useState(false);

  /*
    Mantém a sala/página atuais entre atualizações da configuração.
    Usamos refs para que carregarConfiguracao continue estável e não
    passe a depender dos estados de seleção.
  */
  const idSalaSelecionadaRef =
    useRef<number | null>(null);

  const idPaginaSelecionadaRef =
    useRef<number | null>(null);

  const [configuracao, setConfiguracao] =
    useState<POSMobileConfiguracao | null>(null);

  const [contexto, setContexto] =
    useState<ContextoPostoDados | null>(null);

  const [utilizador, setUtilizador] =
    useState<POSMobileUtilizadorSessao | null>(
      null,
    );

  const [
    postosDisponiveis,
    setPostosDisponiveis,
  ] =
    useState<POSMobilePostoDisponivel[]>(
      [],
    );

  const [
    idPostoAtual,
    setIdPostoAtual,
  ] = useState(0);

  const [
    aTrocarPosto,
    setATrocarPosto,
  ] = useState(false);

  const [estadosMesas, setEstadosMesas] =
    useState<POSMobileEstadoMesa[]>([]);

  const [
    idSalaSelecionada,
    setIdSalaSelecionada,
  ] = useState<number | null>(null);

  const [
    idPaginaSelecionada,
    setIdPaginaSelecionada,
  ] = useState<number | null>(null);

  const [mesaSelecionada, setMesaSelecionada] =
    useState<MesaComEstado | null>(null);

  const [
    contasMesaSelecionada,
    setContasMesaSelecionada,
  ] = useState<POSMobileResumoConta[]>([]);

  const [
    mostrarSelecaoConta,
    setMostrarSelecaoConta,
  ] = useState(false);

  const [
    aCarregarContas,
    setACarregarContas,
  ] = useState(false);

  const [
    mensagemErroConta,
    setMensagemErroConta,
  ] = useState("");

  const [
    aValidarAcessoMesa,
    setAValidarAcessoMesa,
  ] = useState(false);


  const [
    aEntrarMesa,
    setAEntrarMesa,
  ] = useState(false);

  const [
    mensagemAcessoMesa,
    setMensagemAcessoMesa,
  ] = useState("");

  const [
    mostrarNumeroPessoas,
    setMostrarNumeroPessoas,
  ] = useState(false);

  const [
    numeroPessoas,
    setNumeroPessoas,
  ] = useState(1);

  const [
    mensagemErroNumeroPessoas,
    setMensagemErroNumeroPessoas,
  ] = useState("");

  const [aCarregar, setACarregar] =
    useState(true);

  const [mensagemErro, setMensagemErro] =
    useState("");

  const carregarConfiguracao =
    useCallback(async () => {
      setACarregar(true);
      setMensagemErro("");

      try {
        const token = sessionStorage.getItem(
          "posMobileAccessToken",
        );

        if (!token) {
          router.replace("/login");
          return;
        }

        const utilizadorGuardado =
          sessionStorage.getItem(
            "posMobileUtilizador",
          );

        if (utilizadorGuardado) {
          try {
            setUtilizador(
              JSON.parse(
                utilizadorGuardado,
              ) as POSMobileUtilizadorSessao,
            );
          } catch {
            sessionStorage.removeItem(
              "posMobileUtilizador",
            );
          }
        }

        const idPostoTexto =
          sessionStorage.getItem(
            "posMobileIdPosto",
          );

        const idPosto =
          Number(idPostoTexto);

        if (
          !Number.isInteger(idPosto) ||
          idPosto <= 0
        ) {
          throw new Error(
            "Não foi possível identificar o posto da sessão.",
          );
        }

        setIdPostoAtual(
          idPosto,
        );

        console.log(
          "========== CARREGAMENTO DO POSTO ==========",
        );

        console.log(
          "ID do posto guardado na sessão:",
          idPosto,
        );

        const [
          responseContexto,
          responseConfiguracao,
          responseEstadoMesas,
        ] = await Promise.all([
          fetch(
            `/api/pos-mobile/contexto?idPosto=${idPosto}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            },
          ),

          fetch(
            `/api/pos-mobile/configuracao?idPosto=${idPosto}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            },
          ),

          fetch(
            `/api/pos-mobile/estado-mesas?idPosto=${idPosto}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            },
          ),
        ]);

        const [
          resultadoContexto,
          resultadoConfiguracao,
          resultadoEstadoMesas,
        ] = (await Promise.all([
          responseContexto.json(),
          responseConfiguracao.json(),
          responseEstadoMesas.json(),
        ])) as [
            POSMobileContextoResponse,
            POSMobileConfiguracaoResponse,
            POSMobileEstadoMesasResposta,
          ];

        console.log(
          "Resposta do contexto recebida pela página:",
          resultadoContexto,
        );

        console.log(
          "Resposta da configuração recebida pela página:",
          resultadoConfiguracao,
        );

        console.log(
          "Resposta do estado das mesas recebida pela página:",
          resultadoEstadoMesas,
        );

        if (
          !responseContexto.ok ||
          !resultadoContexto.sucesso ||
          !resultadoContexto.dados
        ) {
          throw new Error(
            resultadoContexto.mensagem ||
            "Não foi possível carregar o contexto do posto.",
          );
        }

        if (
          !responseConfiguracao.ok ||
          !resultadoConfiguracao.sucesso ||
          !resultadoConfiguracao.dados
        ) {
          throw new Error(
            resultadoConfiguracao.mensagem ||
            "Não foi possível carregar as salas e mesas.",
          );
        }

        if (
          !responseEstadoMesas.ok ||
          !resultadoEstadoMesas.sucesso ||
          !resultadoEstadoMesas.dados
        ) {
          throw new Error(
            resultadoEstadoMesas.mensagem ||
            "Não foi possível carregar o estado atual das mesas.",
          );
        }

        /*
          As três respostas já foram validadas acima.

          Guardar os respetivos dados em constantes locais
          impede o TypeScript de voltar a considerá-los
          como possivelmente null.
        */
        const dadosContexto =
          resultadoContexto.dados;

        const dadosConfiguracao =
          resultadoConfiguracao.dados;

        const dadosEstadoMesas =
          resultadoEstadoMesas.dados;

        console.log(
          "Contexto validado:",
          dadosContexto,
        );

        console.log(
          "Centro de exploração:",
          dadosContexto.operacao
            .idCentroExploracao,
        );

        console.log(
          "Classe de preços do posto:",
          dadosContexto.operacao
            .idClassePrecos,
        );

        console.log(
          "Caixa:",
          dadosContexto.operacao
            .idCaixa,
        );

        console.log(
          "Profit center:",
          dadosContexto.operacao
            .idProfitCenter,
        );

        setContexto(
          dadosContexto,
        );

        const salasOrdenadas = [
          ...dadosConfiguracao.salas,
        ].sort(
          (primeira, segunda) =>
            primeira.ordem -
            segunda.ordem,
        );

        const dadosNormalizados:
          POSMobileConfiguracao = {
            ...dadosConfiguracao,
            salas: salasOrdenadas,
          };

        setConfiguracao(
          dadosNormalizados,
        );

        setEstadosMesas(
          dadosEstadoMesas.mesas,
        );

        const primeiraSala =
          salasOrdenadas[0] ?? null;

        const salaAnterior =
          idSalaSelecionadaRef.current;

        const salaSelecionadaAposAtualizar =
          salasOrdenadas.find(
            (sala) =>
              sala.idSala === salaAnterior,
          ) ?? primeiraSala;

        setIdSalaSelecionada(
          salaSelecionadaAposAtualizar?.idSala ??
          null,
        );

        const paginasOrdenadas =
          salaSelecionadaAposAtualizar
            ? [
                ...salaSelecionadaAposAtualizar.paginas,
              ].sort(
                (primeira, segunda) =>
                  primeira.ordem -
                  segunda.ordem,
              )
            : [];

        const paginaAnterior =
          idPaginaSelecionadaRef.current;

        const paginaSelecionadaAposAtualizar =
          paginasOrdenadas.find(
            (pagina) =>
              pagina.idPagina ===
              paginaAnterior,
          ) ?? paginasOrdenadas[0] ?? null;

        setIdPaginaSelecionada(
          paginaSelecionadaAposAtualizar
            ?.idPagina ?? null,
        );

        setMesaSelecionada(null);
        setContasMesaSelecionada([]);
        setMostrarSelecaoConta(false);
        setMensagemErroConta("");
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Ocorreu um erro inesperado.";

        setMensagemErro(mensagem);
      } finally {
        setACarregar(false);
      }
    }, [router]);

  useEffect(() => {
    void carregarConfiguracao();
  }, [carregarConfiguracao]);

  useEffect(() => {
    idSalaSelecionadaRef.current =
      idSalaSelecionada;
  }, [idSalaSelecionada]);

  useEffect(() => {
    idPaginaSelecionadaRef.current =
      idPaginaSelecionada;
  }, [idPaginaSelecionada]);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarPostosDisponiveis() {
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

        const postos =
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

        if (componenteAtivo) {
          setPostosDisponiveis(
            postos,
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar postos para seleção:",
          error,
        );

        if (componenteAtivo) {
          setPostosDisponiveis(
            [],
          );
        }
      }
    }

    void carregarPostosDisponiveis();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const salaSelecionada =
    useMemo<POSMobileSala | null>(() => {
      if (
        !configuracao ||
        idSalaSelecionada === null
      ) {
        return null;
      }

      return (
        configuracao.salas.find(
          (sala) =>
            sala.idSala === idSalaSelecionada,
        ) ?? null
      );
    }, [
      configuracao,
      idSalaSelecionada,
    ]);

  const paginasSalaSelecionada =
    useMemo<POSMobilePagina[]>(() => {
      if (!salaSelecionada) {
        return [];
      }

      return [
        ...salaSelecionada.paginas,
      ].sort(
        (primeira, segunda) =>
          primeira.ordem - segunda.ordem,
      );
    }, [salaSelecionada]);

  const paginaSelecionada =
    useMemo<POSMobilePagina | null>(() => {
      if (
        idPaginaSelecionada === null
      ) {
        return null;
      }

      return (
        paginasSalaSelecionada.find(
          (pagina) =>
            pagina.idPagina ===
            idPaginaSelecionada,
        ) ?? null
      );
    }, [
      paginasSalaSelecionada,
      idPaginaSelecionada,
    ]);

  const mesasDaPagina =
    useMemo<MesaComEstado[]>(() => {
      if (!paginaSelecionada) {
        return [];
      }

      return paginaSelecionada.mesas
        .map((mesa) => {
          const estado =
            estadosMesas.find(
              (item) =>
                item.idSala === mesa.idSala &&
                item.idPagina ===
                mesa.idPagina &&
                item.idMesa === mesa.idMesa,
            ) ?? criarEstadoLivre(mesa);

          return {
            ...mesa,
            estado,
            estadoVisual:
              obterEstadoVisual(estado),
          };
        })
        .sort((primeira, segunda) => {
          const posicaoPrimeira =
            primeira.posicao > 0
              ? primeira.posicao
              : Number.MAX_SAFE_INTEGER;

          const posicaoSegunda =
            segunda.posicao > 0
              ? segunda.posicao
              : Number.MAX_SAFE_INTEGER;

          if (
            posicaoPrimeira !==
            posicaoSegunda
          ) {
            return (
              posicaoPrimeira -
              posicaoSegunda
            );
          }

          if (
            primeira.ordem !==
            segunda.ordem
          ) {
            return (
              primeira.ordem -
              segunda.ordem
            );
          }

          return (
            primeira.numeroMesa -
            segunda.numeroMesa
          );
        });
    }, [
      paginaSelecionada,
      estadosMesas,
    ]);

  const resumoSala = useMemo(() => {
    if (!salaSelecionada) {
      return {
        total: 0,
        livres: 0,
        ocupadas: 0,
        emUso: 0,
        reservadas: 0,
      };
    }

    const mesas =
      salaSelecionada.paginas.flatMap(
        (pagina) => pagina.mesas,
      );

    const estados = mesas.map((mesa) => {
      const estado =
        estadosMesas.find(
          (item) =>
            item.idSala === mesa.idSala &&
            item.idPagina === mesa.idPagina &&
            item.idMesa === mesa.idMesa,
        ) ?? criarEstadoLivre(mesa);

      return obterEstadoVisual(estado);
    });

    return {
      total: mesas.length,

      livres: estados.filter(
        (estado) => estado === "LIVRE",
      ).length,

      ocupadas: estados.filter(
        (estado) => estado === "OCUPADA",
      ).length,

      emUso: estados.filter(
        (estado) => estado === "EM_USO",
      ).length,

      reservadas: estados.filter(
        (estado) =>
          estado === "RESERVADA",
      ).length,
    };
  }, [
    salaSelecionada,
    estadosMesas,
  ]);

  function selecionarSala(
    sala: POSMobileSala,
  ) {
    const paginasOrdenadas = [
      ...sala.paginas,
    ].sort(
      (primeira, segunda) =>
        primeira.ordem - segunda.ordem,
    );

    setIdSalaSelecionada(sala.idSala);

    setIdPaginaSelecionada(
      paginasOrdenadas[0]?.idPagina ??
      null,
    );

    setMesaSelecionada(null);
    setContasMesaSelecionada([]);
    setMostrarSelecaoConta(false);
    setMensagemErroConta("");
    setMensagemAcessoMesa("");
  }

  function selecionarPagina(
    pagina: POSMobilePagina,
  ) {
    setIdPaginaSelecionada(
      pagina.idPagina,
    );

    setMesaSelecionada(null);
    setContasMesaSelecionada([]);
    setMostrarSelecaoConta(false);
    setMensagemErroConta("");
    setMensagemAcessoMesa("");
  }

  const atualizarNavegacaoSalas =
    useCallback(() => {
      const container =
        salasContainerRef.current;

      if (!container) {
        setPodeDeslocarSalasEsquerda(false);
        setPodeDeslocarSalasDireita(false);
        return;
      }

      const tolerancia = 2;
      const temOverflow =
        container.scrollWidth >
        container.clientWidth + tolerancia;

      setPodeDeslocarSalasEsquerda(
        temOverflow &&
          container.scrollLeft > tolerancia,
      );

      setPodeDeslocarSalasDireita(
        temOverflow &&
          container.scrollLeft +
            container.clientWidth <
            container.scrollWidth - tolerancia,
      );
    }, []);

  useEffect(() => {
    const container =
      salasContainerRef.current;

    if (!container) {
      return;
    }

    const frame =
      window.requestAnimationFrame(() => {
        atualizarNavegacaoSalas();
      });

    const tratarResize = () => {
      atualizarNavegacaoSalas();
    };

    window.addEventListener(
      "resize",
      tratarResize,
    );

    const resizeObserver =
      typeof ResizeObserver !==
      "undefined"
        ? new ResizeObserver(() => {
            atualizarNavegacaoSalas();
          })
        : null;

    resizeObserver?.observe(container);

    return () => {
      window.cancelAnimationFrame(frame);

      window.removeEventListener(
        "resize",
        tratarResize,
      );

      resizeObserver?.disconnect();
    };
  }, [
    configuracao,
    atualizarNavegacaoSalas,
  ]);

  function deslocarSalas(
    direcao: "ESQUERDA" | "DIREITA",
  ) {
    const container =
      salasContainerRef.current;

    if (!container) {
      return;
    }

    const distancia =
      Math.max(
        container.clientWidth * 0.7,
        220,
      );

    container.scrollBy({
      left:
        direcao === "DIREITA"
          ? distancia
          : -distancia,
      behavior: "smooth",
    });
  }

  function atualizarEstadoMesaLocal(
    estadoAtualizado: POSMobileEstadoMesaComAcesso,
  ) {
    setEstadosMesas((estadosAtuais) => {
      const indice = estadosAtuais.findIndex(
        (estado) =>
          estado.idSala === estadoAtualizado.idSala &&
          estado.idPagina === estadoAtualizado.idPagina &&
          estado.idMesa === estadoAtualizado.idMesa,
      );

      if (indice < 0) {
        return [
          ...estadosAtuais,
          estadoAtualizado,
        ];
      }

      return estadosAtuais.map(
        (estado, indiceEstado) =>
          indiceEstado === indice
            ? estadoAtualizado
            : estado,
      );
    });
  }

  async function validarAcessoMesa(
    mesa: MesaComEstado,
  ): Promise<MesaComEstado | null> {
    const idPosto = Number(
      sessionStorage.getItem(
        "posMobileIdPosto",
      ),
    );

    if (
      !Number.isInteger(idPosto) ||
      idPosto <= 0
    ) {
      setMensagemAcessoMesa(
        "Não foi possível identificar o posto da sessão.",
      );

      return null;
    }

    setAValidarAcessoMesa(true);
    setMensagemAcessoMesa("");
    setMensagemErroConta("");

    try {
      const parametros =
        new URLSearchParams({
          idPosto: String(idPosto),
          idSala: String(mesa.idSala),
          idPagina: String(
            mesa.idPagina,
          ),
          idMesa: String(mesa.idMesa),
        });

      const response =
        await fetch(
          `/api/pos-mobile/validar-acesso-mesa?${parametros.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

      const resultado =
        (await response.json()) as POSMobileValidarAcessoMesaResposta;

      if (!resultado.dados) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível validar o acesso à mesa.",
        );
      }

      const estadoAtualizado =
        resultado.dados;

      atualizarEstadoMesaLocal(
        estadoAtualizado,
      );

      const mesaAtualizada: MesaComEstado =
      {
        ...mesa,
        estado: estadoAtualizado,
        estadoVisual:
          obterEstadoVisual(
            estadoAtualizado,
          ),
      };

      setMesaSelecionada(
        mesaAtualizada,
      );

      if (
        !response.ok ||
        !resultado.sucesso ||
        estadoAtualizado.podeEntrar ===
        false
      ) {
        setMensagemAcessoMesa(
          resultado.mensagem ||
          estadoAtualizado.mensagemAcesso ||
          "Esta mesa não pode ser utilizada neste posto.",
        );

        return null;
      }

      return mesaAtualizada;
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao validar o acesso à mesa.";

      setMensagemAcessoMesa(
        mensagem,
      );

      return null;
    } finally {
      setAValidarAcessoMesa(false);
    }
  }

  async function entrarMesa(
    mesa: MesaComEstado,
  ): Promise<boolean> {
    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    const idPosto = Number(
      sessionStorage.getItem(
        "posMobileIdPosto",
      ),
    );

    if (!accessToken) {
      router.replace("/login");
      return false;
    }

    if (
      !Number.isInteger(idPosto) ||
      idPosto <= 0
    ) {
      setMensagemAcessoMesa(
        "Não foi possível identificar o posto da sessão.",
      );
      return false;
    }

    setAEntrarMesa(true);
    setMensagemAcessoMesa("");
    setMensagemErroConta("");

    try {
      const response =
        await fetch(
          "/api/pos-mobile/entrar-mesa",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
              idPosto,
              idSala: mesa.idSala,
              idPagina:
                mesa.idPagina,
              idMesa: mesa.idMesa,
            }),
          },
        );

      const resultado =
        (await response.json()) as POSMobileUsoMesaResposta;

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados ||
        !resultado.dados.emUso
      ) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível colocar a mesa em uso.",
        );
      }

      atualizarEstadoMesaLocal({
        ...mesa.estado,
        emUso: true,
        postoEmUso:
          String(idPosto),
      });

      return true;
    } catch (error) {
      setMensagemAcessoMesa(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao entrar na mesa.",
      );

      return false;
    } finally {
      setAEntrarMesa(false);
    }
  }


  async function selecionarMesaComValidacao(
    mesa: MesaComEstado,
  ) {
    setMesaSelecionada(mesa);
    setMensagemAcessoMesa("");
    setMensagemErroConta("");
    setMostrarSelecaoConta(false);
    setMostrarNumeroPessoas(false);

    const mesaAtualizada =
      await validarAcessoMesa(
        mesa,
      );

    if (!mesaAtualizada) {
      return;
    }

    /*
      No POS Mobile o toque na mesa inicia logo
      a ação correspondente ao estado atual.

      Mesa ocupada:
        - carrega as contas;
        - se existir apenas uma, abre diretamente;
        - se existirem várias, mostra a seleção de conta.

      Mesa livre:
        - abre diretamente o pedido do número de pessoas.
    */
    if (
      mesaAtualizada.estado.ocupada
    ) {
      await carregarContasMesaSelecionada(
        mesaAtualizada,
      );

      return;
    }

    prepararAberturaMesa(
      mesaAtualizada,
    );
  }

  async function navegarParaEditorConta(
    conta: POSMobileResumoConta,
    mesaAlvo: MesaComEstado | null =
      mesaSelecionada,
  ) {
    if (!mesaAlvo) {
      return;
    }

    const idMovimentoMesa =
      conta.idMovimentoMesa ??
      mesaAlvo.estado.idMovimentoMesa;

    const idInterno =
      conta.idInterno;

    if (
      !idMovimentoMesa ||
      idMovimentoMesa <= 0 ||
      !idInterno ||
      idInterno <= 0
    ) {
      setMensagemErroConta(
        "A conta selecionada não possui uma identificação válida.",
      );

      return;
    }

    const idPosto =
      mesaAlvo.estado.idPosto ??
      Number(
        sessionStorage.getItem(
          "posMobileIdPosto",
        ),
      );

    const entrou =
      await entrarMesa(
        mesaAlvo,
      );

    if (!entrou) {
      return;
    }

    const dadosConta = {
      modo: "conta",
      idPosto,
      idSala: mesaAlvo.idSala,
      idPagina: mesaAlvo.idPagina,
      idMesa: mesaAlvo.idMesa,
      numeroMesa:
        mesaAlvo.numeroMesa,
      descricaoMesa:
        mesaAlvo.descricao ||
        `Mesa ${mesaAlvo.numeroMesa}`,
      descricaoSala:
        salaSelecionada?.descricao ??
        mesaAlvo.estado.descricaoSala ??
        "",
      numeroPessoas:
        conta.numeroPessoas,
      numeroLugares:
        mesaAlvo.numeroLugares,
      idMovimentoMesa,
      idInterno,
      idConta: conta.idConta,
    };

    sessionStorage.setItem(
      "posMobileContaSelecionada",
      JSON.stringify(dadosConta),
    );

    const parametros =
      new URLSearchParams({
        modo: "conta",
        idPosto: String(
          dadosConta.idPosto,
        ),
        idSala: String(
          dadosConta.idSala,
        ),
        idPagina: String(
          dadosConta.idPagina,
        ),
        numeroMesa: String(
          dadosConta.numeroMesa,
        ),
        descricaoMesa:
          dadosConta.descricaoMesa,
        descricaoSala:
          dadosConta.descricaoSala,
        numeroPessoas: String(
          dadosConta.numeroPessoas,
        ),
        numeroLugares: String(
          dadosConta.numeroLugares,
        ),
        idMovimentoMesa: String(
          dadosConta.idMovimentoMesa,
        ),
        idInterno: String(
          dadosConta.idInterno,
        ),
        idConta: String(
          dadosConta.idConta,
        ),
      });

    setMostrarSelecaoConta(false);
    setMensagemErroConta("");

    router.push(
      `/pos/mesa/${mesaAlvo.idMesa}?${parametros.toString()}`,
    );
  }

  async function carregarContasMesaSelecionada(
    mesaAlvo: MesaComEstado | null =
      mesaSelecionada,
  ) {
    if (!mesaAlvo) {
      return;
    }

    const idMovimentoMesa =
      mesaAlvo.estado.idMovimentoMesa;

    if (
      !idMovimentoMesa ||
      idMovimentoMesa <= 0
    ) {
      setMensagemErroConta(
        "Não foi possível identificar o movimento da mesa.",
      );

      return;
    }

    setACarregarContas(true);
    setMensagemErroConta("");

    try {
      const response =
        await fetch(
          `/api/pos-mobile/contas-mesa?idMovimentoMesa=${idMovimentoMesa}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

      const resultado =
        (await response.json()) as POSMobileContasMesaResposta;

      if (
        !response.ok ||
        !resultado.sucesso ||
        !resultado.dados
      ) {
        throw new Error(
          resultado.mensagem ||
          "Não foi possível carregar as contas abertas da mesa.",
        );
      }

      const contasValidas =
        resultado.dados.contas.filter(
          (conta) =>
            conta.idInterno !== null &&
            conta.idInterno > 0,
        );

      if (contasValidas.length === 0) {
        throw new Error(
          "A mesa está ocupada, mas não possui contas abertas disponíveis.",
        );
      }

      setContasMesaSelecionada(
        contasValidas,
      );

      if (contasValidas.length === 1) {
        await navegarParaEditorConta(
          contasValidas[0],
          mesaAlvo,
        );

        return;
      }

      setMostrarSelecaoConta(true);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao carregar as contas da mesa.";

      setMensagemErroConta(mensagem);
    } finally {
      setACarregarContas(false);
    }
  }

  function prepararAberturaMesa(
    mesaAlvo: MesaComEstado | null =
      mesaSelecionada,
  ) {
    if (!mesaAlvo) {
      return;
    }

    const valorInicial =
      mesaAlvo.numeroLugares > 0
        ? Math.min(
          mesaAlvo.numeroLugares,
          2,
        )
        : 1;

    setNumeroPessoas(
      Math.max(
        1,
        valorInicial,
      ),
    );

    setMensagemErroNumeroPessoas("");
    setMostrarNumeroPessoas(true);
  }

  async function confirmarAberturaMesa() {
    if (!mesaSelecionada) {
      return;
    }

    if (
      !Number.isInteger(numeroPessoas) ||
      numeroPessoas <= 0
    ) {
      setMensagemErroNumeroPessoas(
        "O número de pessoas deve ser superior a zero.",
      );

      return;
    }

    if (
      mesaSelecionada.numeroLugares > 0 &&
      numeroPessoas >
      mesaSelecionada.numeroLugares
    ) {
      setMensagemErroNumeroPessoas(
        `A mesa tem ${mesaSelecionada.numeroLugares} lugares configurados.`,
      );

      return;
    }

    const mesaAtualizada =
      await validarAcessoMesa(
        mesaSelecionada,
      );

    if (!mesaAtualizada) {
      setMensagemErroNumeroPessoas(
        "A mesa deixou de estar disponível.",
      );

      setMostrarNumeroPessoas(false);
      return;
    }

    if (
      mesaAtualizada.estado.podeAbrir ===
      false ||
      mesaAtualizada.estado.ocupada
    ) {
      setMensagemErroNumeroPessoas(
        mesaAtualizada.estado
          .mensagemAcesso ||
        "A mesa já foi aberta noutro local.",
      );

      setMostrarNumeroPessoas(false);
      return;
    }

    const idPostoTexto =
      sessionStorage.getItem(
        "posMobileIdPosto",
      );

    const idPosto =
      Number(idPostoTexto);

    if (
      !Number.isInteger(idPosto) ||
      idPosto <= 0
    ) {
      setMensagemErroNumeroPessoas(
        "Não foi possível identificar o posto da sessão.",
      );

      return;
    }

    const entrou =
      await entrarMesa(
        mesaAtualizada,
      );

    if (!entrou) {
      setMensagemErroNumeroPessoas(
        "Não foi possível reservar a utilização da mesa.",
      );
      return;
    }

    const dadosMesa = {
      idPosto,
      idSala: mesaAtualizada.idSala,
      idPagina:
        mesaAtualizada.idPagina,
      idMesa: mesaAtualizada.idMesa,
      numeroMesa:
        mesaAtualizada.numeroMesa,
      descricaoMesa:
        mesaAtualizada.descricao ||
        `Mesa ${mesaAtualizada.numeroMesa}`,
      descricaoSala:
        salaSelecionada?.descricao ??
        "",
      numeroPessoas,
      numeroLugares:
        mesaAtualizada.numeroLugares,
    };

    sessionStorage.setItem(
      "posMobileMesaEmAbertura",
      JSON.stringify(dadosMesa),
    );

    const parametros =
      new URLSearchParams({
        idPosto: String(
          dadosMesa.idPosto,
        ),
        idSala: String(
          dadosMesa.idSala,
        ),
        idPagina: String(
          dadosMesa.idPagina,
        ),
        numeroMesa: String(
          dadosMesa.numeroMesa,
        ),
        descricaoMesa:
          dadosMesa.descricaoMesa,
        descricaoSala:
          dadosMesa.descricaoSala,
        numeroPessoas: String(
          dadosMesa.numeroPessoas,
        ),
        numeroLugares: String(
          dadosMesa.numeroLugares,
        ),
      });

    setMostrarNumeroPessoas(false);

    router.push(
      `/pos/mesa/${mesaAtualizada.idMesa}?${parametros.toString()}`,
    );
  }

  async function trocarPosto(
    novoIdPosto: number,
  ) {
    if (
      aTrocarPosto ||
      !Number.isInteger(
        novoIdPosto,
      ) ||
      novoIdPosto <= 0 ||
      novoIdPosto ===
        idPostoAtual
    ) {
      return;
    }

    const postoSelecionado =
      postosDisponiveis.find(
        (posto) =>
          posto.idPosto ===
          novoIdPosto,
      );

    const nomePosto =
      postoSelecionado
        ?.nomeExibicao ||
      `Posto ${novoIdPosto}`;

    const confirmou =
      window.confirm(
        `Pretende mudar para "${nomePosto}"? Será necessário introduzir novamente o PIN do operador.`,
      );

    if (!confirmou) {
      return;
    }

    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    setATrocarPosto(true);

    try {
      if (accessToken) {
        await fetch(
          "/api/pos-mobile/logout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              accessToken,
            }),
          },
        );
      }
    } catch (error) {
      /*
        A falha no logout remoto não deve impedir
        a limpeza da sessão local de teste.
      */
      console.error(
        "Erro ao terminar a sessão antes de trocar de posto:",
        error,
      );
    } finally {
      localStorage.setItem(
        "posMobilePostoPreferido",
        String(
          novoIdPosto,
        ),
      );

      sessionStorage.clear();

      window.location.replace(
        "/login",
      );
    }
  }

  async function terminarSessao() {
    const accessToken =
      sessionStorage.getItem(
        "posMobileAccessToken",
      );

    try {
      if (accessToken) {
        await fetch(
          "/api/pos-mobile/logout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              accessToken,
            }),
          },
        );
      }
    } catch (error) {
      console.error(
        "Erro ao terminar a sessão:",
        error,
      );
    } finally {
      sessionStorage.clear();
      router.replace("/login");
    }
  }

  if (aCarregar) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-4 font-semibold text-slate-600">
            A carregar contexto, salas, mesas e contas...
          </p>
        </div>
      </main>
    );
  }

  if (mensagemErro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black">
            Não foi possível carregar
          </h1>

          <p className="mt-3 text-slate-500">
            {mensagemErro}
          </p>

          <button
            type="button"
            onClick={() =>
              void carregarConfiguracao()
            }
            className="mt-6 h-12 rounded-xl bg-blue-600 px-6 font-bold text-white transition hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-x-hidden overflow-y-scroll bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between gap-2 px-2 sm:gap-4 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-600/20 sm:h-11 sm:w-11">
              S
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                MICRO-NET
              </p>

              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-base font-black sm:text-lg">
                  SysPOS Mobile
                </h1>

              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-sm sm:flex">
              <div className="hidden xl:block">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Posto ativo
                </p>

              </div>

              <div className="relative">
                <select
                  value={
                    idPostoAtual
                  }
                  disabled={
                    aCarregar ||
                    aTrocarPosto ||
                    postosDisponiveis.length <=
                      1
                  }
                  onChange={(event) => {
                    const novoIdPosto =
                      Number(
                        event.target.value,
                      );

                    void trocarPosto(
                      novoIdPosto,
                    );
                  }}
                  title="Selecionar outro posto"
                  aria-label="Selecionar outro posto"
                  className="h-9 max-w-64 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-xs font-black text-slate-700 outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {postosDisponiveis.length >
                  0 ? (
                    postosDisponiveis.map(
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
                        </option>
                      ),
                    )
                  ) : (
                    <option
                      value={
                        idPostoAtual
                      }
                    >
                      Posto{" "}
                      {idPostoAtual ||
                        ""}
                    </option>
                  )}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
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
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* ============================================================
                SELETOR DE POSTO — MOBILE

                No desktop o seletor completo é mostrado acima com sm:flex.
                Em ecrãs pequenos usamos um controlo compacto. O <select>
                transparente ocupa todo o botão, por isso o browser abre a
                seleção nativa ao toque e reutiliza exatamente trocarPosto().
                ============================================================ */}
            <div
              className={[
                "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm sm:hidden",
                postosDisponiveis.length > 1
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-slate-50 text-slate-400",
              ].join(" ")}
              title={
                postosDisponiveis.find(
                  (posto) =>
                    posto.idPosto ===
                    idPostoAtual,
                )?.nomeExibicao ||
                `Posto ${idPostoAtual || ""}`
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="12"
                  rx="2"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 20h8M12 16v4"
                />
              </svg>

              <span
                className="pointer-events-none absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[8px] font-black text-white ring-2 ring-white"
                aria-hidden="true"
              >
                ↕
              </span>

              <select
                value={idPostoAtual}
                disabled={
                  aCarregar ||
                  aTrocarPosto ||
                  postosDisponiveis.length <= 1
                }
                onChange={(event) => {
                  const novoIdPosto =
                    Number(
                      event.target.value,
                    );

                  void trocarPosto(
                    novoIdPosto,
                  );
                }}
                aria-label="Selecionar outro posto"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              >
                {postosDisponiveis.length >
                0 ? (
                  postosDisponiveis.map(
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
                      </option>
                    ),
                  )
                ) : (
                  <option
                    value={idPostoAtual}
                  >
                    Posto{" "}
                    {idPostoAtual || ""}
                  </option>
                )}
              </select>
            </div>

            <DadosPostoPopover
              contexto={contexto}
            />

            <div className="hidden text-right md:block">
              <p className="text-sm font-bold">
                {utilizador?.login ??
                  "Operador"}
              </p>

              <p className="text-[10px] font-semibold text-emerald-600">
                Sessão ativa
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/pos/cozinha",
                )
              }
              disabled={
                aTrocarPosto
              }
              className="hidden h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-black text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex"
              title="Abrir pedidos de cozinha"
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
                  d="M4 5h16M4 12h16M4 19h10"
                />

                <circle
                  cx="18"
                  cy="19"
                  r="2"
                />
              </svg>

              <span className="hidden lg:inline">
                Pedidos cozinha
              </span>

              <span className="lg:hidden">
                Pedidos
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                void carregarConfiguracao()
              }
              disabled={
                aTrocarPosto
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Atualizar"
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
                  d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() =>
                void terminarSessao()
              }
              disabled={
                aTrocarPosto
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {aTrocarPosto
                ? "A trocar..."
                : "Sair"}
            </button>
          </div>
        </div>

        <div className="relative h-14 border-t border-slate-100 bg-white">
          {podeDeslocarSalasEsquerda && (
            <button
              type="button"
              onClick={() =>
                deslocarSalas("ESQUERDA")
              }
              aria-label="Mostrar salas anteriores"
              className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md backdrop-blur transition hover:border-blue-300 hover:text-blue-600 lg:hidden"
            >
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
                  d="m15 18-6-6 6-6"
                />
              </svg>
            </button>
          )}

          <div
            ref={salasContainerRef}
            onScroll={atualizarNavegacaoSalas}
            className={[
              "flex h-full snap-x snap-mandatory items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none] lg:px-10 [&::-webkit-scrollbar]:hidden",
              podeDeslocarSalasEsquerda ||
              podeDeslocarSalasDireita
                ? "px-12"
                : "px-2 sm:px-6",
            ].join(" ")}
          >
            {configuracao?.salas.map(
              (sala) => {
                const selecionada =
                  sala.idSala ===
                  idSalaSelecionada;

                const total =
                  sala.paginas.reduce(
                    (
                      acumulado,
                      pagina,
                    ) =>
                      acumulado +
                      pagina.mesas.length,
                    0,
                  );

                return (
                  <button
                    key={sala.idSala}
                    type="button"
                    onClick={() =>
                      selecionarSala(sala)
                    }
                    className={[
                      "flex min-w-[130px] shrink-0 items-center justify-between",
                      "rounded-xl border px-4 py-2 text-sm font-bold transition",
                      selecionada
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50",
                    ].join(" ")}
                  >
                    <span>
                      {sala.descricao}
                    </span>

                    <span
                      className={[
                        "ml-3 rounded-full px-2.5 py-1 text-[10px] font-bold",
                        selecionada
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-500 ring-1 ring-slate-200",
                      ].join(" ")}
                    >
                      {total} {total === 1 ? "mesa" : "mesas"}
                    </span>
                  </button>
                );
              },
            )}
          </div>

          {podeDeslocarSalasDireita && (
            <button
              type="button"
              onClick={() =>
                deslocarSalas("DIREITA")
              }
              aria-label="Mostrar salas seguintes"
              className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md backdrop-blur transition hover:border-blue-300 hover:text-blue-600 lg:hidden"
            >
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
                  d="m9 18 6-6-6-6"
                />
              </svg>
            </button>
          )}
        </div>
      </header>

      <section className="w-full px-2 py-2 pb-8 sm:px-6 sm:py-4 lg:px-8 xl:px-10">
        <div className="mb-3 flex flex-col gap-2 lg:mb-4 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:px-4 lg:py-3 lg:shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {/*
              No mobile a sala já está identificada na barra azul superior.
              Evitamos repetir o nome e o total para libertar espaço para as mesas.
              Em desktop mantemos o contexto completo.
            */}
            <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
              <h2 className="truncate text-xl font-black tracking-tight text-slate-950">
                {salaSelecionada?.descricao ?? "Sala"}
              </h2>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
                {resumoSala.total}{" "}
                {resumoSala.total === 1
                  ? "mesa"
                  : "mesas"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                {resumoSala.livres} livres
              </span>

              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
                {resumoSala.ocupadas} ocupadas
              </span>

              {resumoSala.emUso > 0 && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                  {resumoSala.emUso} em uso
                </span>
              )}

              {resumoSala.reservadas > 0 && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                  {resumoSala.reservadas} reservadas
                </span>
              )}
            </div>
          </div>

          {paginasSalaSelecionada.length > 1 && (
            <div className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
              {paginasSalaSelecionada.map(
                (pagina) => (
                  <button
                    key={`${pagina.idSala}-${pagina.idPagina}`}
                    type="button"
                    onClick={() =>
                      selecionarPagina(
                        pagina,
                      )
                    }
                    title={`Página ${pagina.idPagina}`}
                    className={[
                      "min-w-10 shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold transition sm:min-w-max",
                      pagina.idPagina ===
                        idPaginaSelecionada
                        ? "bg-slate-900 text-white shadow"
                        : "text-slate-500 hover:bg-white hover:text-slate-900",
                    ].join(" ")}
                  >
                    <span className="sm:hidden">
                      {pagina.idPagina}
                    </span>

                    <span className="hidden sm:inline">
                      Página {pagina.idPagina}
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {mesasDaPagina.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6 2xl:grid-cols-7">
            {mesasDaPagina.map((mesa) => {
              const selecionada =
                mesaSelecionada?.idSala ===
                mesa.idSala &&
                mesaSelecionada?.idPagina ===
                mesa.idPagina &&
                mesaSelecionada?.idMesa ===
                mesa.idMesa;

              return (
                <MesaCard
                  key={`${mesa.idSala}-${mesa.idPagina}-${mesa.idMesa}`}
                  mesa={mesa}
                  selecionada={
                    selecionada
                  }
                  desativada={
                    aValidarAcessoMesa
                  }
                  onSelecionar={(
                    mesaAlvo,
                  ) => {
                    void selecionarMesaComValidacao(
                      mesaAlvo,
                    );
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h3 className="text-xl font-black">
              Nenhuma mesa encontrada
            </h3>

            <p className="mt-2 text-slate-500">
              Não existem mesas configuradas
              nesta página.
            </p>
          </div>
        )}
      </section>

      {mensagemAcessoMesa &&
        !mostrarSelecaoConta &&
        !mostrarNumeroPessoas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                    Acesso à mesa
                  </p>

                  <h2 className="mt-2 truncate text-2xl font-black text-slate-950">
                    {mesaSelecionada?.descricao ||
                      (mesaSelecionada
                        ? `Mesa ${mesaSelecionada.numeroMesa}`
                        : "Mesa")}
                  </h2>

                  {mesaSelecionada && (
                    <p className="mt-1 text-sm text-slate-500">
                      {salaSelecionada?.descricao}
                      {" · "}
                      N.º{" "}
                      {mesaSelecionada.numeroMesa}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMensagemAcessoMesa(
                      "",
                    )
                  }
                  aria-label="Fechar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold leading-6 text-amber-800">
                {mensagemAcessoMesa}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setMensagemAcessoMesa(
                      "",
                    )
                  }
                  className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

      {mostrarSelecaoConta &&
        mesaSelecionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Selecionar conta
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {mesaSelecionada.descricao ||
                      `Mesa ${mesaSelecionada.numeroMesa}`}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {salaSelecionada?.descricao}
                    {" · "}
                    {contasMesaSelecionada.length}{" "}
                    {contasMesaSelecionada.length === 1
                      ? "conta aberta"
                      : "contas abertas"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarSelecaoConta(false);
                    setMensagemErroConta("");
                  }}
                  aria-label="Fechar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-6 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                {contasMesaSelecionada.map(
                  (conta) => (
                    <button
                      key={`${conta.idMovimentoMesa}-${conta.idInterno}`}
                      type="button"
                      onClick={() =>
                        void navegarParaEditorConta(
                          conta,
                        )
                      }
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-slate-950">
                          {conta.descricaoConta ||
                            `Conta ${conta.idConta}`}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {conta.numeroPessoas}{" "}
                          {conta.numeroPessoas === 1
                            ? "pessoa"
                            : "pessoas"}
                          {" · "}
                          {conta.numeroProdutos}{" "}
                          {conta.numeroProdutos === 1
                            ? "produto"
                            : "produtos"}
                        </p>

                        {(conta.nomeEntidade ||
                          conta.quarto) && (
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {[
                                conta.nomeEntidade,
                                conta.quarto
                                  ? `Quarto ${conta.quarto}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                      </div>

                      <div className="shrink-0 text-right">
                        <strong className="text-lg font-black text-slate-950">
                          {formatarValor(
                            conta.valorTotal,
                          )}
                        </strong>

                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          Abrir
                        </p>
                      </div>
                    </button>
                  ),
                )}
              </div>

              {mensagemErroConta && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {mensagemErroConta}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarSelecaoConta(false);
                    setMensagemErroConta("");
                  }}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {mostrarNumeroPessoas &&
        mesaSelecionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Abrir mesa
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {mesaSelecionada.descricao ||
                      `Mesa ${mesaSelecionada.numeroMesa}`}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {salaSelecionada?.descricao}
                    {" · "}
                    N.º{" "}
                    {mesaSelecionada.numeroMesa}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarNumeroPessoas(
                      false,
                    );
                    setMensagemErroNumeroPessoas(
                      "",
                    );
                  }}
                  aria-label="Fechar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-slate-500">
                    Lugares configurados
                  </span>

                  <strong className="text-slate-900">
                    {mesaSelecionada.numeroLugares >
                      0
                      ? mesaSelecionada.numeroLugares
                      : "Não definido"}
                  </strong>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="numeroPessoas"
                  className="mb-3 block text-sm font-bold text-slate-700"
                >
                  Número de pessoas
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNumeroPessoas(
                        (valorAtual) =>
                          Math.max(
                            1,
                            valorAtual - 1,
                          ),
                      );
                      setMensagemErroNumeroPessoas(
                        "",
                      );
                    }}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    −
                  </button>

                  <input
                    id="numeroPessoas"
                    type="number"
                    min={1}
                    max={
                      mesaSelecionada.numeroLugares >
                        0
                        ? mesaSelecionada.numeroLugares
                        : undefined
                    }
                    value={numeroPessoas}
                    onChange={(event) => {
                      setNumeroPessoas(
                        Number(
                          event.target.value,
                        ),
                      );
                      setMensagemErroNumeroPessoas(
                        "",
                      );
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        void confirmarAberturaMesa();
                      }
                    }}
                    autoFocus
                    className="h-14 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white text-center text-2xl font-black text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setNumeroPessoas(
                        (valorAtual) => {
                          const novoValor =
                            valorAtual + 1;

                          if (
                            mesaSelecionada.numeroLugares >
                            0 &&
                            novoValor >
                            mesaSelecionada.numeroLugares
                          ) {
                            return valorAtual;
                          }

                          return novoValor;
                        },
                      );
                      setMensagemErroNumeroPessoas(
                        "",
                      );
                    }}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    +
                  </button>
                </div>

                {mensagemErroNumeroPessoas && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {
                      mensagemErroNumeroPessoas
                    }
                  </div>
                )}
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarNumeroPessoas(
                      false,
                    );
                    setMensagemErroNumeroPessoas(
                      "",
                    );
                  }}
                  className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void confirmarAberturaMesa()
                  }
                  className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Continuar para produtos
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

function PosPageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

        <p className="mt-4 font-semibold text-slate-600">
          A carregar POS...
        </p>
      </div>
    </main>
  );
}

export default function PosPage() {
  return (
    <Suspense
      fallback={<PosPageLoading />}
    >
      <PosPageConteudo />
    </Suspense>
  );
}

