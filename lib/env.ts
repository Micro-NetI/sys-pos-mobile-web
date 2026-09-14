function getRequiredEnv(
  name: string,
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `A variável de ambiente ${name} não está configurada.`,
    );
  }

  return value;
}


function getOptionalEnv(
  name: string,
): string {
  return (
    process.env[name]?.trim() ??
    ""
  );
}


function getOptionalPositiveIntegerEnv(
  name: string,
): number {
  const rawValue =
    process.env[name]?.trim();

  /*
    A variável deixou de ser obrigatória.

    Quando não existe, devolvemos 0 para
    manter compatibilidade com código antigo
    que espera um number.
  */
  if (!rawValue) {
    return 0;
  }

  const value =
    Number(rawValue);

  /*
    Se a variável estiver configurada,
    continuamos a exigir que seja válida.
  */
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(
      `A variável ${name} deve conter um número inteiro superior a zero.`,
    );
  }

  return value;
}


export const env = {
  /*
    Comunicação técnica Next.js -> APIFNT.
  */
  apiUrl: getRequiredEnv(
    "POS_MOBILE_API_URL",
  ).replace(/\/+$/, ""),

  apiUsername: getRequiredEnv(
    "POS_MOBILE_API_USERNAME",
  ),

  apiPassword: getRequiredEnv(
    "POS_MOBILE_API_PASSWORD",
  ),


  /*
    Compatibilidade com código anterior.

    O posto já NÃO é obrigatório nem é utilizado
    para decidir o posto do operador no login.

    O posto efetivo passa a resultar de:

      PrepararLoginOperador
        -> postos autorizados
        -> seleção do operador
        -> LoginOperador

    Estes dois valores podem ser removidos mais
    tarde quando confirmarmos que não existem
    outras referências no projeto.
  */
  postoId:
    getOptionalPositiveIntegerEnv(
      "POS_MOBILE_POSTO_ID",
    ),

  postoNome:
    getOptionalEnv(
      "POS_MOBILE_POSTO_NOME",
    ),


  /*
    Identificação técnica do dispositivo.
  */
  dispositivoId: getRequiredEnv(
    "POS_MOBILE_DISPOSITIVO_ID",
  ),

  dispositivoNome: getRequiredEnv(
    "POS_MOBILE_DISPOSITIVO_NOME",
  ),
};