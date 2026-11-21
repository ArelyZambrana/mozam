import { pool } from '../config/database.js';

export const ENTREGAS = ['delivery', 'correo', 'envio'];
export const ESTADOS = ['nuevo', 'confirmado', 'entregado', 'cancelado'];

export async function crear({ cliente, entrega, ciudad, notas, total, lineas }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [resultado] = await conexion.query(
      'INSERT INTO pedidos (cliente, entrega, ciudad, notas, total) VALUES (?,?,?,?,?)',
      [cliente, entrega, ciudad, notas || null, total],
    );
    await conexion.query(
      'INSERT INTO pedido_items (pedido_id, producto_id, nombre, color, cantidad, precio_unitario) VALUES ?',
      [lineas.map((l) => [resultado.insertId, ...l])],
    );
    await conexion.commit();
    return resultado.insertId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function listar() {
  const [lista] = await pool.query('SELECT * FROM pedidos ORDER BY id DESC LIMIT 200');
  if (!lista.length) return [];
  const [items] = await pool.query('SELECT * FROM pedido_items WHERE pedido_id IN (?)', [lista.map((p) => p.id)]);
  return lista.map((p) => ({
    id: p.id,
    cliente: p.cliente,
    entrega: p.entrega,
    ciudad: p.ciudad,
    notas: p.notas ?? '',
    total: Number(p.total),
    estado: p.estado,
    creado_en: p.creado_en,
    items: items
      .filter((i) => i.pedido_id === p.id)
      .map((i) => ({
        producto_id: i.producto_id,
        nombre: i.nombre,
        color: i.color,
        cantidad: i.cantidad,
        precio_unitario: Number(i.precio_unitario),
      })),
  }));
}

export async function cambiarEstado(id, estado) {
  const [resultado] = await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
  return resultado.affectedRows > 0;
}

export async function eliminar(id) {
  const [resultado] = await pool.query('DELETE FROM pedidos WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
