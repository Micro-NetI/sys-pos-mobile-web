import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { callPosMobileApi } from "@/lib/pos-mobile-api";
import type {
  LoginDados,
  LoginRequest,
} from "@/types/autenticacao";

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as Partial<LoginRequest>;

    const login = body.login?.trim() ?? "";
    const password = body.password?.trim() ?? "";

    if (!password) {
      return NextResponse.json(
        {
          sucesso: false,
          codigo: "PASSWORD_OBRIGATORIA",
          mensagem: "A palavra-passe deve ser indicada.",
          versaoContrato: "1.0",
          dados: null,
        },
        { status: 400 },
      );
    }

    const result =
      await callPosMobileApi<LoginDados>(
        "LoginOperador",
        {
          idPosto: env.postoId,
          login,
          password,
          dispositivo: {
            identificador: env.dispositivoId,
            nome: env.dispositivoNome,
          },
        },
      );

    return NextResponse.json(
      result,
      {
        status: result.sucesso ? 200 : 401,
      },
    );
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Ocorreu um erro inesperado.";

    return NextResponse.json(
      {
        sucesso: false,
        codigo: "ERRO_INTERNO",
        mensagem,
        versaoContrato: "1.0",
        dados: null,
      },
      { status: 500 },
    );
  }
}