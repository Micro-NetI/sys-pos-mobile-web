function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `A variável de ambiente ${name} não está configurada.`,
    );
  }

  return value;
}

function getRequiredIntegerEnv(name: string): number {
  const rawValue = getRequiredEnv(name);
  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `A variável ${name} deve conter um número inteiro superior a zero.`,
    );
  }

  return value;
}

export const env = {
  apiUrl: getRequiredEnv(
    "POS_MOBILE_API_URL",
  ).replace(/\/+$/, ""),

  apiUsername: getRequiredEnv(
    "POS_MOBILE_API_USERNAME",
  ),

  apiPassword: getRequiredEnv(
    "POS_MOBILE_API_PASSWORD",
  ),

  postoId: getRequiredIntegerEnv(
    "POS_MOBILE_POSTO_ID",
  ),

  postoNome: getRequiredEnv(
    "POS_MOBILE_POSTO_NOME",
  ),

  dispositivoId: getRequiredEnv(
    "POS_MOBILE_DISPOSITIVO_ID",
  ),

  dispositivoNome: getRequiredEnv(
    "POS_MOBILE_DISPOSITIVO_NOME",
  ),
};