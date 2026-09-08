//types\autenticacao.ts
export interface ApiResponse<T> {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: T | null;
}

export interface DataSnapResponse<T> {
  result: Array<ApiResponse<T>>;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginDados {
  idPosto: number;
  utilizador: {
    idUtilizador: number;
    idRecursoHumano: number;
    login: string;
  };
  sessao: {
    accessToken: string;
    expiraEm: string;
  };
}