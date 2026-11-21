import { Router } from 'express';
import { CATEGORIAS, aProducto, pool, sembrar } from '../db.js';
import { exigirAdmin } from '../middleware/adminKey.js';

export const productos = Router();

const slug = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'producto';

/** Valida y limpia el cuerpo de un producto. Devuelve { datos } o { error }. */
function validar(cuerpo) {
  const b = cuerpo ?? {};
  const texto = (v) => (typeof v === 'string' ? v.trim() : '');
  const nombre = texto(b.nombre);
  if (nombre.length < 3 || nombre.length > 150) return { error: 'El nombre debe tener entre 3 y 150 letras.' };
  if (!CATEGORIAS.includes(b.categoria)) return { error: 'Categoría no válida.' };
  const precio = Number(b.precio);
  if (!Number.isInteger(precio) || precio < 1 || precio > 100000) return { error: 'El precio debe ser un entero mayor a 0.' };
  const talla = texto(b.talla);
  if (!talla || talla.length > 40) return { error: 'Indica la talla (máximo 40 letras).' };
  const material = texto(b.material);
  if (material.length > 80) return { error: 'El material es demasiado largo.' };
  if (!Array.isArray(b.colores)) return { error: 'Los colores deben ser una lista.' };
  const colores = b.colores.map(texto).filter(Boolean);
  if (colores.length < 1 || colores.length > 20 || colores.some((c) => c.length > 60)) {
    return { error: 'Indica entre 1 y 20 colores.' };
  }
  const imagen = texto(b.imagen);
  if (!/^images\/[\w\-./]+$/.test(imagen) || imagen.includes('..') || imagen.length > 255) {
    return { error: 'La imagen debe ser una ruta dentro de images/.' };
  }
  const nota = texto(b.nota);
  if (nota.length > 255) return { error: 'La nota es demasiado larga.' };
  return {
    datos: { nombre, categoria: b.categoria, precio, talla, material: material || null, colores, imagen, destacado: b.destacado ? 1 : 0, nota: nota || null },
  };
}

productos.get('/', async (req, res) => {
  const { categoria } = req.query;
  const [filas] = CATEGORIAS.includes(categoria)
    ? await pool.query('SELECT * FROM productos WHERE categoria = ? ORDER BY orden, creado_en', [categoria])
    : await pool.query('SELECT * FROM productos ORDER BY orden, creado_en');
  res.json(filas.map(aProducto));
});

// Debe ir antes de '/:id'
productos.post('/restaurar', exigirAdmin, async (_req, res) => {
  const n = await sembrar(true);
  res.json({ ok: true, productos: n });
});

productos.get('/:id', async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!filas.length) return res.status(404).json({ error: 'no_encontrado', mensaje: 'Producto no encontrado.' });
  res.json(aProducto(filas[0]));
});

productos.post('/', exigirAdmin, async (req, res) => {
  const { datos, error } = validar(req.body);
  if (error) return res.status(400).json({ error: 'datos_invalidos', mensaje: error });

  const base = slug(datos.nombre);
  const [usados] = await pool.query('SELECT id FROM productos WHERE id = ? OR id LIKE ?', [base, `${base}-%`]);
  const ocupados = new Set(usados.map((u) => u.id));
  let id = base;
  for (let n = 2; ocupados.has(id); n++) id = `${base}-${n}`;

  // El producto nuevo aparece primero: toma un orden menor al mínimo actual
  const [[{ minimo }]] = await pool.query('SELECT COALESCE(MIN(orden), 0) AS minimo FROM productos');
  await pool.query(
    'INSERT INTO productos (id, nombre, categoria, precio, talla, material, colores, imagen, destacado, nota, orden) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id, datos.nombre, datos.categoria, datos.precio, datos.talla, datos.material, JSON.stringify(datos.colores), datos.imagen, datos.destacado, datos.nota, minimo - 1],
  );
  const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
  res.status(201).json(aProducto(filas[0]));
});

productos.put('/:id', exigirAdmin, async (req, res) => {
  const { datos, error } = validar(req.body);
  if (error) return res.status(400).json({ error: 'datos_invalidos', mensaje: error });
  const [r] = await pool.query(
    'UPDATE productos SET nombre=?, categoria=?, precio=?, talla=?, material=?, colores=?, imagen=?, destacado=?, nota=? WHERE id=?',
    [datos.nombre, datos.categoria, datos.precio, datos.talla, datos.material, JSON.stringify(datos.colores), datos.imagen, datos.destacado, datos.nota, req.params.id],
  );
  if (r.affectedRows === 0) return res.status(404).json({ error: 'no_encontrado', mensaje: 'Producto no encontrado.' });
  const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  res.json(aProducto(filas[0]));
});

productos.delete('/:id', exigirAdmin, async (req, res) => {
  const [r] = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'no_encontrado', mensaje: 'Producto no encontrado.' });
  res.status(204).end();
});
