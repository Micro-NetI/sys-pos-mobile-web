//types\contas.ts
import type {
  POSMobileComentarioSelecionado,
} from "./comentarios";

export type POSMobileTipoLinhaConta =
  | "PRODUTO"
  | "PROGRAMA"
  | "LINHA_PROGRAMA"
  | "DESCONHECIDO";

export interface POSMobileResumoConta {
  idMovimentoMesa: number | null;
  idInterno: number | null;
  idConta: number;
  numeroPessoas: number;
  valorTotal: number;
  numeroProdutos: number;
  nomeEntidade: string | null;
  quarto: string | null;
  descricaoConta: string | null;
}

export interface POSMobileProdutoConta {
  idMovimentoMesa: number | null;
  idInternoConta: number | null;

  idLinha: number | null;
  idLinhaPai: number | null;

  idProduto: number | null;
  idProdutoPrograma: number | null;
  idTipoPrograma: number | null;

  tipoLinha: POSMobileTipoLinhaConta;

  descricao: string | null;

  quantidade: number;
  precoUnitario: number;
  valorTotal: number;

  jaImpresso: boolean;
  anulado: boolean;

  idGrupoPreparacao: number | null;

  observacao: string | null;

  comentarios:
    POSMobileComentarioSelecionado[];
}

export interface POSMobileContaMesa {
  idPosto: number | null;
  idSala: number | null;
  idPagina: number | null;
  idMesa: number | null;

  idMovimentoMesa: number | null;
  idInterno: number | null;

  idConta: number;
  numeroPessoas: number;
  valorTotal: number;

  descricaoSala: string | null;
  descricaoMesa: string | null;
  descricaoConta: string | null;

  nomeEntidade: string | null;
  quarto: string | null;

  aberta: boolean;

  produtos:
    POSMobileProdutoConta[];
}

export interface POSMobileContasMesa {
  idMovimentoMesa: number | null;
  idPosto: number | null;
  idSala: number | null;
  idPagina: number | null;
  idMesa: number | null;

  numeroContas: number;

  contas:
    POSMobileResumoConta[];
}

export interface POSMobileContaMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileContaMesa | null;
}

export interface POSMobileContasMesaResposta {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: POSMobileContasMesa | null;
}