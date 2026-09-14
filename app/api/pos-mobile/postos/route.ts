// app/api/pos-mobile/postos/route.ts

import {
  NextResponse,
} from "next/server";


export const dynamic =
  "force-dynamic";


export async function GET() {
  /*
    Esta rota deixou de disponibilizar
    publicamente todos os postos.

    O fluxo correto é agora:

      1. utilizador introduz o PIN;
      2. POST /api/pos-mobile/preparar-login;
      3. APIFNT valida o operador;
      4. APIFNT devolve apenas os postos
         autorizados para esse utilizador;
      5. o utilizador seleciona um desses postos;
      6. POST /api/pos-mobile/login;
      7. a APIFNT volta a validar a autorização
         antes de criar a sessão.

    Mantemos temporariamente esta rota para
    compatibilidade com versões antigas do
    frontend, mas sem expor a lista de postos.
  */

  return NextResponse.json(
    {
      sucesso: false,
      codigo:
        "AUTENTICACAO_OBRIGATORIA",

      mensagem:
        "Os postos apenas podem ser obtidos após a autenticação do operador.",

      versaoContrato:
        "1.0",

      dados:
        null,
    },
    {
      status:
        401,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    },
  );
}