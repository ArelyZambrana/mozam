import { HttpError } from '../utils/http-error.js';

const visitas = new Map();

export function limitarMensajes(req, _res, next) {
  const ahora = Date.now();
  const recientes = (visitas.get(req.ip) ?? []).filter((t) => ahora - t < 60_000);
  recientes.push(ahora);
  visitas.set(req.ip, recientes);
  if (recientes.length > 20) {
    return next(new HttpError(429, 'demasiados_mensajes', 'Estás escribiendo muy rápido. Espera un momento.'));
  }
  next();
}
