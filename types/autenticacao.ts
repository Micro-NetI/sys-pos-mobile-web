// types/autenticacao.ts

import type {
  POSMobilePostoDisponivel,
} from "@/types/postos";


/* ============================================================
   RESPOSTA BASE DA API
   ============================================================ */

export interface ApiResponse<T> {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: T | null;
}


/*
  Envelope devolvido diretamente pelo DataSnap.

  O helper pos-mobile-api.ts pode depois retirar
  o primeiro elemento de "result".
*/
export interface DataSnapResponse<T> {
  result: Array<ApiResponse<T>>;
}


/* ============================================================
   UTILIZADOR
   ============================================================ */

export interface POSMobileUtilizadorLogin {
  idUtilizador: number;
  idRecursoHumano: number;
  login: string;
}


/* ============================================================
   FASE 1
   PREPARAR LOGIN / VALIDAR PIN
   ============================================================ */

export interface PrepararLoginRequest {
  login: string;
  password: string;
}


export interface PrepararLoginDados {
  utilizador:
    POSMobileUtilizadorLogin;

  totalPostos: number;

  postos:
    POSMobilePostoDisponivel[];
}


export type PrepararLoginResponse =
  ApiResponse<PrepararLoginDados>;


/* ============================================================
   FASE 2
   LOGIN DEFINITIVO NO POSTO
   ============================================================ */

export interface LoginDispositivoRequest {
  identificador?: string | null;
  nome?: string | null;
}


export interface LoginRequest {
  idPosto: number;

  login: string;
  password: string;

  dispositivo?:
    LoginDispositivoRequest | null;
}


export interface POSMobileSessaoLogin {
  accessToken: string;
  expiraEm: string;
}


export interface LoginDados {
  idPosto: number;

  utilizador:
    POSMobileUtilizadorLogin;

  sessao:
    POSMobileSessaoLogin;
}


export type LoginResponse =
  ApiResponse<LoginDados>;