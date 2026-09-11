



"use client";

import {
  useEffect,
} from "react";

/*
  ============================================================================
  TYPES

  Para já ficam nesta componente para acelerar o teste.

  Quando o contrato do JSON estabilizar, passamos estes types para:
    types/pos-mobile-impressao-tpa.ts
  ============================================================================
*/

export interface ReciboTPADocumento {
  idTipoDocumento?: number;
  tipoDocumento?: string;
  abreviaturaDocumento?: string;
  serie?: string;
  numero?: number;
  documento?: string;
  atcud?: string;
  data?: string;
  hora?: string;
  anulado?: boolean;
  via?: string;
}

export interface ReciboTPAEmpresa {
  nome?: string;
  nif?: string;
  morada?: string;
  codigoPostal?: string;
  localidade?: string;
  certificado?: string;
}

export interface ReciboTPACliente {
  nome?: string;
  apelido?: string;
  nif?: string;
  morada?: string;
  codigoPostal?: string;
  localidade?: string;
}

export interface ReciboTPAPos {
  posto?: string;
  sala?: string;
  mesa?: string;
  conta?: string;
  numeroPessoas?: number;
  utilizador?: string;
}

export interface ReciboTPAItem {
  indice?: number;

  tipo:
    | "PRODUTO"
    | "MENU"
    | "MENU_ITEM"
    | string;

  tipoLinha?: number;

  idLinha?: number;
  idLinhaPai?: number;
  idProduto?: number;

  descricao?: string;

  quantidade?: number;
  valorUnitario?: number;

  /*
    Valor interno da linha.
  */
  valor?: number;

  /*
    Valor que deve ser apresentado
    no talão segundo as regras do Motor.
  */
  valorApresentar?: number;

  mostrarValor?: boolean;

  percentagemIVA?: number;
  mostrarIVA?: boolean;

  calculaValorLinhasTotal?: boolean;
  menuMisto?: boolean;
}

export interface ReciboTPAPagamento {
  descricao?: string;
  valor?: number;
}

export interface ReciboTPAIva {
  percentagem?: number;
  incidencia?: number;
  iva?: number;
  valorComIVA?: number;
  descricao?: string;
}

export interface ReciboTPATotais {
  incidencia?: number;
  iva?: number;
  totalResumoIVA?: number;
  totalDocumento?: number;
  desconto?: number;
}

export interface ReciboTPAQRCode {
  disponivel?: boolean;
  mimeType?: string;
  base64?: string;
  tamanhoBytes?: number;
}

export interface ReciboTPADados {
  version?: number;
  tipo?: string;

  idVndCabDocumento?: number;

  documento?: ReciboTPADocumento;
  empresa?: ReciboTPAEmpresa;
  cliente?: ReciboTPACliente;
  pos?: ReciboTPAPos;

  itens?: ReciboTPAItem[];
  pagamentos?: ReciboTPAPagamento[];
  ivas?: ReciboTPAIva[];

  totais?: ReciboTPATotais;

  qrCode?: ReciboTPAQRCode;
}

interface ReciboTPAPreviewModalProps {
  aberto: boolean;
  dados: ReciboTPADados | null;
  onFechar: () => void;
}

/*
  ============================================================================
  HELPERS
  ============================================================================
*/

function texto(
  valor: string | null | undefined,
): string {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function numero(
  valor: number | null | undefined,
): number {
  return typeof valor === "number" &&
    Number.isFinite(valor)
    ? valor
    : 0;
}

function formatarValor(
  valor: number | null | undefined,
): string {
  return numero(valor).toLocaleString(
    "pt-PT",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function formatarQuantidade(
  valor: number | null | undefined,
): string {
  const n = numero(valor);

  if (Number.isInteger(n)) {
    return String(n);
  }

  return n.toLocaleString(
    "pt-PT",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    },
  );
}

function descricaoCliente(
  cliente: ReciboTPACliente | undefined,
): string {
  if (!cliente) {
    return "";
  }

  return [
    texto(cliente.nome),
    texto(cliente.apelido),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/*
  ============================================================================
  SEPARADOR VISUAL DO PAPEL
  ============================================================================
*/

function Separador() {
  return (
    <div
      aria-hidden="true"
      className="
        my-2
        border-t
        border-dashed
        border-black
      "
    />
  );
}

/*
  ============================================================================
  COMPONENTE
  ============================================================================
*/

export default function ReciboTPAPreviewModal({
  aberto,
  dados,
  onFechar,
}: ReciboTPAPreviewModalProps) {
  /*
    Fechar com ESC.
  */
  useEffect(() => {
    if (!aberto) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onFechar();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    aberto,
    onFechar,
  ]);

  if (
    !aberto ||
    !dados
  ) {
    return null;
  }

  const documento =
    dados.documento;

  const empresa =
    dados.empresa;

  const cliente =
    dados.cliente;

  const pos =
    dados.pos;

  const itens =
    Array.isArray(
      dados.itens,
    )
      ? dados.itens
      : [];

  const pagamentos =
    Array.isArray(
      dados.pagamentos,
    )
      ? dados.pagamentos
      : [];

  const ivas =
    Array.isArray(
      dados.ivas,
    )
      ? dados.ivas
      : [];

  const totais =
    dados.totais;

  const qrCode =
    dados.qrCode;

  const nomeCliente =
    descricaoCliente(
      cliente,
    );

  const nifCliente =
    texto(
      cliente?.nif,
    ) ||
    "Consumidor final";

  const temDadosPOS =
    texto(pos?.posto) !== "" ||
    texto(pos?.sala) !== "" ||
    texto(pos?.mesa) !== "" ||
    texto(pos?.conta) !== "" ||
    numero(pos?.numeroPessoas) > 0 ||
    texto(pos?.utilizador) !== "";

  const qrSrc =
    qrCode?.disponivel &&
    texto(qrCode.base64) !== ""
      ? `data:${
          texto(
            qrCode.mimeType,
          ) || "image/bmp"
        };base64,${qrCode.base64}`
      : "";

  return (
    <div
      className="
        fixed
        inset-0
        z-[150]
        flex
        items-start
        justify-center
        overflow-y-auto
        bg-slate-950/75
        p-4
        backdrop-blur-sm
        sm:items-center
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-preview-tpa"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar();
        }
      }}
    >
      <div
        className="
          my-4
          flex
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-white/20
          bg-slate-100
          shadow-2xl
        "
      >
        {/*
          ================================================================
          HEADER DO MODAL
          ================================================================
        */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            border-b
            border-slate-200
            bg-white
            px-5
            py-4
          "
        >
          <div>
            <p
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.18em]
                text-blue-600
              "
            >
              Teste impressão TPA
            </p>

            <h2
              id="titulo-preview-tpa"
              className="
                mt-1
                text-xl
                font-black
                text-slate-950
              "
            >
              Pré-visualização 58 mm
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Documento{" "}
              {dados.idVndCabDocumento ??
                "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onFechar
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-xl
              font-bold
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
            "
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/*
          ================================================================
          ÁREA DO PAPEL
          ================================================================
        */}

        <div
          className="
            flex
            justify-center
            overflow-x-auto
            p-4
            sm:p-7
          "
        >
          {/*
            340 px é apenas uma aproximação visual
            de um talão térmico de 58 mm.

            O Android irá trabalhar depois com
            a largura real em dots da impressora.
          */}

          <div
            className="
              w-[340px]
              min-w-[340px]
              bg-white
              px-4
              pb-8
              pt-5
              font-mono
              text-[12px]
              leading-[1.35]
              text-black
              shadow-lg
            "
          >
            {/*
              ============================================================
              EMPRESA
              ============================================================
            */}

            {texto(
              empresa?.nome,
            ) !== "" && (
              <div
                className="
                  text-center
                  text-[14px]
                  font-bold
                "
              >
                {empresa?.nome}
              </div>
            )}

            {texto(
              empresa?.nif,
            ) !== "" && (
              <div className="text-center">
                NIF:{" "}
                {empresa?.nif}
              </div>
            )}

            {texto(
              empresa?.morada,
            ) !== "" && (
              <div className="mt-1 text-center">
                {empresa?.morada}
              </div>
            )}

            {(
              texto(
                empresa?.codigoPostal,
              ) !== "" ||
              texto(
                empresa?.localidade,
              ) !== ""
            ) && (
              <div className="text-center">
                {[
                  texto(
                    empresa?.codigoPostal,
                  ),
                  texto(
                    empresa?.localidade,
                  ),
                ]
                  .filter(Boolean)
                  .join(" ")}
              </div>
            )}

            <Separador />

            {/*
              ============================================================
              DOCUMENTO
              ============================================================
            */}

            <div className="font-bold">
              {texto(
                documento?.tipoDocumento,
              ) ||
                texto(
                  documento?.abreviaturaDocumento,
                ) ||
                "DOCUMENTO"}
            </div>

            {texto(
              documento?.documento,
            ) !== "" && (
              <div className="font-bold">
                {documento?.documento}
              </div>
            )}

            {texto(
              documento?.atcud,
            ) !== "" && (
              <div className="mt-1 break-all">
                ATCUD:{" "}
                {documento?.atcud}
              </div>
            )}

            {(
              texto(
                documento?.data,
              ) !== "" ||
              texto(
                documento?.hora,
              ) !== ""
            ) && (
              <div>
                {[
                  texto(
                    documento?.data,
                  ),
                  texto(
                    documento?.hora,
                  ),
                ]
                  .filter(Boolean)
                  .join(" ")}
              </div>
            )}

            {texto(
              documento?.via,
            ) !== "" && (
              <div>
                Via:{" "}
                {documento?.via}
              </div>
            )}

            {documento?.anulado && (
              <div
                className="
                  my-2
                  text-center
                  text-base
                  font-black
                "
              >
                *** ANULADO ***
              </div>
            )}

            {/*
              ============================================================
              POS
              ============================================================
            */}

            {temDadosPOS && (
              <>
                <Separador />

                <div>
                  {texto(
                    pos?.posto,
                  ) !== "" && (
                    <>
                      Posto:{" "}
                      {pos?.posto}
                    </>
                  )}
                </div>

                {(
                  texto(
                    pos?.sala,
                  ) !== "" ||
                  texto(
                    pos?.mesa,
                  ) !== ""
                ) && (
                  <div>
                    {texto(
                      pos?.sala,
                    ) !== "" && (
                      <>
                        Sala:{" "}
                        {pos?.sala}
                      </>
                    )}

                    {texto(
                      pos?.mesa,
                    ) !== "" && (
                      <>
                        {" "}
                        Mesa:{" "}
                        {pos?.mesa}
                      </>
                    )}
                  </div>
                )}

                {texto(
                  pos?.conta,
                ) !== "" && (
                  <div>
                    Conta:{" "}
                    {pos?.conta}
                  </div>
                )}

                {numero(
                  pos?.numeroPessoas,
                ) > 0 && (
                  <div>
                    Pax:{" "}
                    {pos?.numeroPessoas}
                  </div>
                )}

                {texto(
                  pos?.utilizador,
                ) !== "" && (
                  <div>
                    User:{" "}
                    {pos?.utilizador}
                  </div>
                )}
              </>
            )}

            {/*
              ============================================================
              CLIENTE
              ============================================================
            */}

            <Separador />

            <div className="font-bold">
              CLIENTE
            </div>

            <div>
              {nomeCliente ||
                "Consumidor Final"}
            </div>

            {texto(
              cliente?.morada,
            ) !== "" && (
              <div>
                {cliente?.morada}
              </div>
            )}

            {(
              texto(
                cliente?.codigoPostal,
              ) !== "" ||
              texto(
                cliente?.localidade,
              ) !== ""
            ) && (
              <div>
                {[
                  texto(
                    cliente?.codigoPostal,
                  ),
                  texto(
                    cliente?.localidade,
                  ),
                ]
                  .filter(Boolean)
                  .join(" ")}
              </div>
            )}

            <div>
              NIF:{" "}
              {nifCliente}
            </div>

            {/*
              ============================================================
              PRODUTOS
              ============================================================
            */}

            <Separador />

            <div
              className="
                grid
                grid-cols-[34px_minmax(0,1fr)_42px_62px]
                gap-x-1
                border-b
                border-black
                pb-1
                font-bold
              "
            >
              <div>
                QT
              </div>

              <div>
                Descrição
              </div>

              <div className="text-right">
                IVA
              </div>

              <div className="text-right">
                Valor
              </div>
            </div>

            <div className="mt-1">
              {itens.length ===
                0 && (
                <div className="py-3 text-center">
                  Sem produtos
                </div>
              )}

              {itens.map(
                (
                  item,
                  index,
                ) => {
                  const ehMenu =
                    item.tipo ===
                    "MENU";

                  const ehFilhoMenu =
                    item.tipo ===
                    "MENU_ITEM";

                  const mostrarIVA =
                    item.mostrarIVA !==
                    false;

                  const mostrarValor =
                    item.mostrarValor !==
                    false;

                  return (
                    <div
                      key={
                        item.idLinha ??
                        `${item.tipo}-${index}`
                      }
                      className={
                        ehMenu
                          ? "mt-2 border-t border-dotted border-black pt-1 font-bold"
                          : ehFilhoMenu
                            ? "pl-3"
                            : "mt-1"
                      }
                    >
                      <div
                        className="
                          grid
                          grid-cols-[34px_minmax(0,1fr)_42px_62px]
                          gap-x-1
                        "
                      >
                        <div>
                          {formatarQuantidade(
                            item.quantidade,
                          )}
                        </div>

                        <div
                          className={
                            ehFilhoMenu
                              ? "break-words before:content-['↳_']"
                              : "break-words"
                          }
                        >
                          {texto(
                            item.descricao,
                          ) ||
                            "(sem descrição)"}
                        </div>

                        <div className="text-right">
                          {mostrarIVA &&
                          typeof item.percentagemIVA ===
                            "number"
                            ? `${formatarQuantidade(
                                item.percentagemIVA,
                              )}%`
                            : ""}
                        </div>

                        <div className="text-right">
                          {mostrarValor
                            ? formatarValor(
                                item.valorApresentar ??
                                  item.valor,
                              )
                            : ""}
                        </div>
                      </div>

                      {/*
                        Informação de diagnóstico útil
                        durante esta fase.

                        Só aparece nos menus.
                      */}

                      {ehMenu &&
                        (
                          item.calculaValorLinhasTotal ||
                          item.menuMisto
                        ) && (
                          <div
                            className="
                              mt-0.5
                              text-[9px]
                              font-normal
                              text-slate-500
                            "
                          >
                            {item.menuMisto
                              ? "menu misto"
                              : "menu valorizado pelas linhas"}
                          </div>
                        )}
                    </div>
                  );
                },
              )}
            </div>

            {/*
              ============================================================
              PAGAMENTOS
              ============================================================
            */}

            {pagamentos.length >
              0 && (
              <>
                <Separador />

                <div className="font-bold">
                  PAGAMENTO
                </div>

                <div className="mt-1 space-y-1">
                  {pagamentos.map(
                    (
                      pagamento,
                      index,
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                      >
                        <span className="min-w-0 break-words">
                          {texto(
                            pagamento.descricao,
                          ) ||
                            "Pagamento"}
                        </span>

                        <span className="shrink-0 text-right">
                          {formatarValor(
                            pagamento.valor,
                          )}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}

            {/*
              ============================================================
              RESUMO IVA
              ============================================================
            */}

            {ivas.length >
              0 && (
              <>
                <Separador />

                <div className="font-bold">
                  RESUMO IVA
                </div>

                <div
                  className="
                    mt-1
                    grid
                    grid-cols-[52px_1fr_1fr]
                    gap-x-2
                    border-b
                    border-black
                    pb-1
                    font-bold
                  "
                >
                  <div>
                    %
                  </div>

                  <div className="text-right">
                    IVA
                  </div>

                  <div className="text-right">
                    Incid.
                  </div>
                </div>

                {ivas.map(
                  (
                    iva,
                    index,
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="
                        grid
                        grid-cols-[52px_1fr_1fr]
                        gap-x-2
                        py-0.5
                      "
                    >
                      <div>
                        {formatarQuantidade(
                          iva.percentagem,
                        )}
                        %
                      </div>

                      <div className="text-right">
                        {formatarValor(
                          iva.iva,
                        )}
                      </div>

                      <div className="text-right">
                        {formatarValor(
                          iva.incidencia,
                        )}
                      </div>

                      {texto(
                        iva.descricao,
                      ) !== "" && (
                        <div
                          className="
                            col-span-3
                            text-[10px]
                          "
                        >
                          {iva.descricao}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </>
            )}

            {/*
              ============================================================
              TOTAL
              ============================================================
            */}

            <Separador />

            {numero(
              totais?.desconto,
            ) !== 0 && (
              <div
                className="
                  flex
                  justify-between
                  gap-3
                "
              >
                <span>
                  Desconto
                </span>

                <span>
                  {formatarValor(
                    totais?.desconto,
                  )}
                </span>
              </div>
            )}

            <div
              className="
                mt-1
                flex
                items-end
                justify-between
                gap-3
                text-[17px]
                font-black
              "
            >
              <span>
                TOTAL
              </span>

              <span>
                {formatarValor(
                  totais?.totalDocumento ??
                    totais?.totalResumoIVA,
                )}
              </span>
            </div>

            {/*
              ============================================================
              CERTIFICAÇÃO
              ============================================================
            */}

            {texto(
              empresa?.certificado,
            ) !== "" && (
              <>
                <Separador />

                <div
                  className="
                    text-center
                    text-[10px]
                  "
                >
                  {empresa?.certificado}
                </div>
              </>
            )}

            {/*
              ============================================================
              QR CODE
              ============================================================
            */}

            <Separador />

            {qrSrc !== "" ? (
              <div className="flex flex-col items-center">
                <img
                  src={
                    qrSrc
                  }
                  alt="QR Code fiscal"
                  className="
                    h-[220px]
                    w-[220px]
                    object-contain
                    [image-rendering:pixelated]
                  "
                />

                <div
                  className="
                    mt-1
                    text-center
                    text-[9px]
                    text-slate-500
                  "
                >
                  QR fiscal
                  {qrCode?.tamanhoBytes
                    ? ` · ${qrCode.tamanhoBytes} bytes`
                    : ""}
                </div>
              </div>
            ) : (
              <div
                className="
                  py-4
                  text-center
                  text-[10px]
                  text-slate-500
                "
              >
                QR Code não disponível
              </div>
            )}

            <div
              className="
                mt-5
                text-center
                text-[9px]
                text-slate-400
              "
            >
              Pré-visualização TPA · 58 mm
            </div>
          </div>
        </div>

        {/*
          ================================================================
          FOOTER DO MODAL
          ================================================================
        */}

        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
            border-t
            border-slate-200
            bg-white
            px-5
            py-4
          "
        >
          <div
            className="
              text-xs
              text-slate-500
            "
          >
            Layout de teste para futura
            impressão Android.
          </div>

          <button
            type="button"
            onClick={
              onFechar
            }
            className="
              h-11
              rounded-xl
              bg-slate-900
              px-5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-slate-700
            "
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}