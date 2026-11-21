import { pool } from '../config/database.js';

export async function salud(_req, res) {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, base_de_datos: 'conectada' });
  } catch {
    res.status(503).json({ ok: false, base_de_datos: 'sin conexión' });
  }
}

export function verificarAdmin(_req, res) {
  res.json({ ok: true });
}
