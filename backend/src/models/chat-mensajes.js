import { pool } from '../config/database.js';

export async function guardar(sesion, rol, contenido) {
  await pool.query('INSERT INTO chat_mensajes (sesion, rol, contenido) VALUES (?,?,?)', [sesion, rol, contenido]);
}

export async function ultimos() {
  const [filas] = await pool.query(
    'SELECT id, sesion, rol, contenido, creado_en FROM chat_mensajes ORDER BY id DESC LIMIT 100',
  );
  return filas;
}
