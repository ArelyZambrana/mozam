import { Router } from 'express';
import { pool, sembrarConocimiento } from '../db.js';
import { exigirAdmin } from '../middleware/adminKey.js';

/** Lo que sabe el chatbot sobre Mozam y la tienda web. Todo el CRUD es del panel (requiere clave). */
export const conocimiento = Router();
conocimiento.use(exigirAdmin);

const aDato = (f) => ({ id: f.id, tema: f.tema, contenido: f.contenido, activo: !!f.activo });

function validar(cuerpo) {
  const b = cuerpo ?? {};
  const tema = typeof b.tema === 'string' ? b.tema.trim() : '';
  const contenido = typeof b.contenido === 'string' ? b.contenido.trim() : '';
  if (tema.length < 3 || tema.length > 80) return { error: 'El tema debe tener entre 3 y 80 letras.' };
  if (contenido.length < 5 || contenido.length > 700) return { error: 'El contenido debe tener entre 5 y 700 letras.' };
  return { datos: { tema, contenido, activo: b.activo === false ? 0 : 1 } };
}

conocimiento.get('/', async (_req, res) => {
  const [filas] = await pool.query('SELECT * FROM conocimiento ORDER BY orden, id');
  res.json(filas.map(aDato));
});

// Debe ir antes de '/:id'
conocimiento.post('/restaurar', async (_req, res) => {
  const n = await sembrarConocimiento(true);
  res.json({ ok: true, temas: n });
});

conocimiento.post('/', async (req, res) => {
  const { datos, error } = validar(req.body);
  if (error) return res.status(400).json({ error: 'datos_invalidos', mensaje: error });
  const [[{ siguiente }]] = await pool.query('SELECT COALESCE(MAX(orden), -1) + 1 AS siguiente FROM conocimiento');
  const [r] = await pool.query('INSERT INTO conocimiento (tema, contenido, activo, orden) VALUES (?,?,?,?)', [
    datos.tema,
    datos.contenido,
    datos.activo,
    siguiente,
  ]);
  const [filas] = await pool.query('SELECT * FROM conocimiento WHERE id = ?', [r.insertId]);
  res.status(201).json(aDato(filas[0]));
});

conocimiento.put('/:id', async (req, res) => {
  const { datos, error } = validar(req.body);
  if (error) return res.status(400).json({ error: 'datos_invalidos', mensaje: error });
  const [r] = await pool.query('UPDATE conocimiento SET tema = ?, contenido = ?, activo = ? WHERE id = ?', [
    datos.tema,
    datos.contenido,
    datos.activo,
    req.params.id,
  ]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'no_encontrado', mensaje: 'Tema no encontrado.' });
  const [filas] = await pool.query('SELECT * FROM conocimiento WHERE id = ?', [req.params.id]);
  res.json(aDato(filas[0]));
});

conocimiento.delete('/:id', async (req, res) => {
  const [r] = await pool.query('DELETE FROM conocimiento WHERE id = ?', [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'no_encontrado', mensaje: 'Tema no encontrado.' });
  res.status(204).end();
});
