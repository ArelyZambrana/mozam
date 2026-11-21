import { timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Protege las rutas del panel: exige el header x-admin-key con la clave de ADMIN_KEY. */
export function exigirAdmin(req, res, next) {
  const clave = req.get('x-admin-key');
  if (!clave || !iguales(clave, config.adminKey)) {
    return res.status(401).json({ error: 'clave_invalida', mensaje: 'Clave de administración incorrecta.' });
  }
  next();
}
