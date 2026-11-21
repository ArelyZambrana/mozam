import { pool } from '../config/database.js';
import { slug } from '../utils/texto.js';

export const CATEGORIAS = ['faldas', 'vestidos', 'tops', 'complementos'];

export function aProducto(fila) {
  const producto = {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    precio: Number(fila.precio),
    talla: fila.talla,
    colores: JSON.parse(fila.colores),
    imagen: fila.imagen,
  };
  if (fila.material) producto.material = fila.material;
  if (fila.destacado) producto.destacado = true;
  if (fila.nota) producto.nota = fila.nota;
  return producto;
}

export async function listar(categoria) {
  const [filas] = CATEGORIAS.includes(categoria)
    ? await pool.query('SELECT * FROM productos WHERE categoria = ? ORDER BY orden, creado_en', [categoria])
    : await pool.query('SELECT * FROM productos ORDER BY orden, creado_en');
  return filas.map(aProducto);
}

export async function obtener(id) {
  const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
  return filas.length ? aProducto(filas[0]) : null;
}

export async function obtenerVarios(ids) {
  const [filas] = await pool.query('SELECT id, nombre, precio, colores FROM productos WHERE id IN (?)', [ids]);
  return filas;
}

export async function crear(datos) {
  const base = slug(datos.nombre);
  const [usados] = await pool.query('SELECT id FROM productos WHERE id = ? OR id LIKE ?', [base, `${base}-%`]);
  const ocupados = new Set(usados.map((u) => u.id));
  let id = base;
  for (let n = 2; ocupados.has(id); n++) id = `${base}-${n}`;

  const [[{ minimo }]] = await pool.query('SELECT COALESCE(MIN(orden), 0) AS minimo FROM productos');
  await pool.query(
    'INSERT INTO productos (id, nombre, categoria, precio, talla, material, colores, imagen, destacado, nota, orden) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id, datos.nombre, datos.categoria, datos.precio, datos.talla, datos.material, JSON.stringify(datos.colores), datos.imagen, datos.destacado, datos.nota, minimo - 1],
  );
  return obtener(id);
}

export async function actualizar(id, datos) {
  const [resultado] = await pool.query(
    'UPDATE productos SET nombre=?, categoria=?, precio=?, talla=?, material=?, colores=?, imagen=?, destacado=?, nota=? WHERE id=?',
    [datos.nombre, datos.categoria, datos.precio, datos.talla, datos.material, JSON.stringify(datos.colores), datos.imagen, datos.destacado, datos.nota, id],
  );
  return resultado.affectedRows ? obtener(id) : null;
}

export async function eliminar(id) {
  const [resultado] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
