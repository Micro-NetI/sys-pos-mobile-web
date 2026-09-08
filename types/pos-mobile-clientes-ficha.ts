//types\pos-mobile-clientes-ficha.ts
import type {
  POSMobileClienteResumo,
} from "@/types/pos-mobile-clientes";

/*
  ============================================================================
  FICHA RÁPIDA DE CLIENTE - POS MOBILE
  ============================================================================

  Estes tipos são específicos do fluxo de criação rápida de cliente.

  Mantemos separado do ficheiro de pesquisa para não alterar,
  neste passo, contratos que já estão em produção.
*/

export type POSMobileTipoClienteFicha =
  | "INDIVIDUAL"
  | "EMPRESA";

/*
  País devolvido pelo endpoint PrepararFichaCliente.
*/
export interface POSMobilePaisOpcao {
  id: number;
  codigo: string;
  descricao: string;
}

/*
  ============================================================================
  PREPARAR FICHA
  ============================================================================
*/

export interface POSMobilePrepararFichaClientePedido {
  accessToken: string;
}

export interface POSMobilePrepararFichaClienteDados {
  idPaisPredefinido: number;
  paises: POSMobilePaisOpcao[];
}

export interface POSMobilePrepararFichaClienteResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobilePrepararFichaClienteDados
    | null;
}

/*
  ============================================================================
  CRIAR CLIENTE
  ============================================================================
*/

export interface POSMobileCriarClientePedido {
  accessToken: string;

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

export interface POSMobileCriarClienteDados {
  cliente:
    POSMobileClienteResumo | null;
}

export interface POSMobileCriarClienteResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;

  dados:
    | POSMobileCriarClienteDados
    | null;
}