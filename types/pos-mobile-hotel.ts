export interface POSMobileHotelReserva {
  tipoRegisto: string;
  idReserva: number;

  /**
   * O quarto é string propositadamente.
   * "003" deve permanecer "003".
   */
  quarto: string;

  cliente: string;
  dataChegada: string | null;
  dataSaida: string | null;
}

export interface POSMobileHotelReservasDados {
  idPosto: number;
  idCentroExploracao: number;
  total: number;
  reservas: POSMobileHotelReserva[];
}

export interface POSMobileAssociarReservaHotelDados {
  idPosto: number;
  idCentroExploracao: number;
  idMovimentoMesa: number;
  idInternoConta: number;
  reserva: POSMobileHotelReserva;
}

export interface POSMobileApiResposta<T> {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  versaoContrato: string;
  dados: T | null;
}

export type POSMobileHotelReservasResposta =
  POSMobileApiResposta<POSMobileHotelReservasDados>;

export type POSMobileAssociarReservaHotelResposta =
  POSMobileApiResposta<POSMobileAssociarReservaHotelDados>;

export interface POSMobileAssociarReservaHotelPedido {
  accessToken: string;
  idMovimentoMesa: number;
  idInternoConta: number;
  idReserva: number;
  quarto: string;
}
