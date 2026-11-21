export class HttpError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

export const datosInvalidos = (mensaje) => new HttpError(400, 'datos_invalidos', mensaje);
export const noEncontrado = (mensaje) => new HttpError(404, 'no_encontrado', mensaje);
