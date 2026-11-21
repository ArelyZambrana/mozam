import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function exigirAdmin(req, _res, next) {
  const clave = req.get('x-admin-key');
  if (!clave || !iguales(clave, config.adminKey)) {
    return next(new HttpError(401, 'clave_invalida', 'Clave de administración incorrecta.'));
  }
  next();
}
