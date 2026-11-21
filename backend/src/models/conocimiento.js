import { pool } from '../config/database.js';

export const aDato = (fila) => ({ id: fila.id, tema: fila.tema, contenido: fila.contenido, activo: !!fila.activo });

export async function listar() {
  const [filas] = await pool.query('SELECT * FROM conocimiento ORDER BY orden, id');
  return filas.map(aDato);
}

export async function listarActivos() {
  const [filas] = await pool.query('SELECT tema, contenido FROM conocimiento WHERE activo = 1 ORDER BY orden, id');
  return filas;
}

async function obtener(id) {
  const [filas] = await pool.query('SELECT * FROM conocimiento WHERE id = ?', [id]);
  return filas.length ? aDato(filas[0]) : null;
}

export async function crear({ tema, contenido, activo }) {
  const [[{ siguiente }]] = await pool.query('SELECT COALESCE(MAX(orden), -1) + 1 AS siguiente FROM conocimiento');
  const [resultado] = await pool.query('INSERT INTO conocimiento (tema, contenido, activo, orden) VALUES (?,?,?,?)', [
    tema,
    contenido,
    activo,
    siguiente,
  ]);
  return obtener(resultado.insertId);
}

export async function actualizar(id, { tema, contenido, activo }) {
  const [resultado] = await pool.query('UPDATE conocimiento SET tema = ?, contenido = ?, activo = ? WHERE id = ?', [
    tema,
    contenido,
    activo,
    id,
  ]);
  return resultado.affectedRows ? obtener(id) : null;
}

export async function eliminar(id) {
  const [resultado] = await pool.query('DELETE FROM conocimiento WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
