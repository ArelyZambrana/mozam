import * as modelo from '../models/pedidos.js';
import * as productos from '../models/productos.js';
import { datosInvalidos, noEncontrado } from '../utils/http-error.js';
import { limpiar } from '../utils/texto.js';

export async function crear(req, res) {
  const b = req.body ?? {};
  const cliente = limpiar(b.cliente);
  const ciudad = limpiar(b.ciudad);
  const notas = limpiar(b.notas);
  if (cliente.length < 2 || cliente.length > 100) throw datosInvalidos('Escribe tu nombre.');
  if (ciudad.length < 2 || ciudad.length > 100) throw datosInvalidos('Indica tu ciudad o zona.');
  if (!modelo.ENTREGAS.includes(b.entrega)) throw datosInvalidos('Tipo de entrega no válido.');
  if (notas.length > 500) throw datosInvalidos('Las notas son demasiado largas.');
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 50) {
    throw datosInvalidos('El pedido no tiene productos.');
  }

  const ids = [...new Set(b.items.map((i) => String(i?.producto_id)))];
  const catalogo = new Map((await productos.obtenerVarios(ids)).map((f) => [f.id, f]));

  const lineas = [];
  for (const item of b.items) {
    const producto = catalogo.get(String(item?.producto_id));
    const cantidad = Number(item?.cantidad);
    const color = limpiar(item?.color);
    if (!producto) throw datosInvalidos('Un producto del pedido ya no existe.');
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50) throw datosInvalidos('Cantidad no válida.');
    if (!JSON.parse(producto.colores).includes(color)) {
      throw datosInvalidos(`El color «${color}» no existe para ${producto.nombre}.`);
    }
    lineas.push([producto.id, producto.nombre, color, cantidad, Number(producto.precio)]);
  }
  const total = lineas.reduce((suma, l) => suma + l[3] * l[4], 0);

  const id = await modelo.crear({ cliente, entrega: b.entrega, ciudad, notas, total, lineas });
  res.status(201).json({ id, total });
}

export async function listar(_req, res) {
  res.json(await modelo.listar());
}

export async function cambiarEstado(req, res) {
  const estado = req.body?.estado;
  if (!modelo.ESTADOS.includes(estado)) throw datosInvalidos('Estado no válido.');
  if (!(await modelo.cambiarEstado(req.params.id, estado))) throw noEncontrado('Pedido no encontrado.');
  res.json({ id: Number(req.params.id), estado });
}

export async function eliminar(req, res) {
  if (!(await modelo.eliminar(req.params.id))) throw noEncontrado('Pedido no encontrado.');
  res.status(204).end();
}
