import { Router } from 'express';
import { ENTREGAS, ESTADOS, pool } from '../db.js';
import { exigirAdmin } from '../middleware/adminKey.js';

export const pedidos = Router();

/**
 * Crea un pedido. Los precios y el total se calculan aquí con los precios de la base de datos,
 * no con lo que mande el navegador.
 */
pedidos.post('/', async (req, res) => {
  const b = req.body ?? {};
  const texto = (v) => (typeof v === 'string' ? v.trim() : '');
  const cliente = texto(b.cliente);
  const ciudad = texto(b.ciudad);
  const notas = texto(b.notas);
  if (cliente.length < 2 || cliente.length > 100) return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Escribe tu nombre.' });
  if (ciudad.length < 2 || ciudad.length > 100) return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Indica tu ciudad o zona.' });
  if (!ENTREGAS.includes(b.entrega)) return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Tipo de entrega no válido.' });
  if (notas.length > 500) return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Las notas son demasiado largas.' });
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 50) {
    return res.status(400).json({ error: 'datos_invalidos', mensaje: 'El pedido no tiene productos.' });
  }

  const ids = [...new Set(b.items.map((i) => String(i?.producto_id)))];
  const [filas] = await pool.query('SELECT id, nombre, precio, colores FROM productos WHERE id IN (?)', [ids]);
  const catalogo = new Map(filas.map((f) => [f.id, f]));

  const lineas = [];
  for (const item of b.items) {
    const prod = catalogo.get(String(item?.producto_id));
    const cantidad = Number(item?.cantidad);
    const color = texto(item?.color);
    if (!prod) return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Un producto del pedido ya no existe.' });
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50) {
      return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Cantidad no válida.' });
    }
    if (!JSON.parse(prod.colores).includes(color)) {
      return res.status(400).json({ error: 'datos_invalidos', mensaje: `El color «${color}» no existe para ${prod.nombre}.` });
    }
    lineas.push([prod.id, prod.nombre, color, cantidad, Number(prod.precio)]);
  }
  const total = lineas.reduce((s, l) => s + l[3] * l[4], 0);

  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [r] = await conexion.query(
      'INSERT INTO pedidos (cliente, entrega, ciudad, notas, total) VALUES (?,?,?,?,?)',
      [cliente, b.entrega, ciudad, notas || null, total],
    );
    await conexion.query(
      'INSERT INTO pedido_items (pedido_id, producto_id, nombre, color, cantidad, precio_unitario) VALUES ?',
      [lineas.map((l) => [r.insertId, ...l])],
    );
    await conexion.commit();
    res.status(201).json({ id: r.insertId, total });
  } catch (e) {
    await conexion.rollback();
    throw e;
  } finally {
    conexion.release();
  }
});

pedidos.get('/', exigirAdmin, async (_req, res) => {
  const [lista] = await pool.query('SELECT * FROM pedidos ORDER BY id DESC LIMIT 200');
  if (!lista.length) return res.json([]);
  const [items] = await pool.query('SELECT * FROM pedido_items WHERE pedido_id IN (?)', [lista.map((p) => p.id)]);
  res.json(
    lista.map((p) => ({
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
        .map((i) => ({ producto_id: i.producto_id, nombre: i.nombre, color: i.color, cantidad: i.cantidad, precio_unitario: Number(i.precio_unitario) })),
    })),
  );
});

pedidos.patch('/:id', exigirAdmin, async (req, res) => {
  const estado = req.body?.estado;
  if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Estado no válido.' });
  const [r] = await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'no_encontrado', mensaje: 'Pedido no encontrado.' });
  res.json({ id: Number(req.params.id), estado });
});

pedidos.delete('/:id', exigirAdmin, async (req, res) => {
  const [r] = await pool.query('DELETE FROM pedidos WHERE id = ?', [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'no_encontrado', mensaje: 'Pedido no encontrado.' });
  res.status(204).end();
});
