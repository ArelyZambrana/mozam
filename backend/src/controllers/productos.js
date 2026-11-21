import * as modelo from '../models/productos.js';
import { datosInvalidos, noEncontrado } from '../utils/http-error.js';
import { limpiar } from '../utils/texto.js';

function validar(cuerpo) {
  const b = cuerpo ?? {};
  const nombre = limpiar(b.nombre);
  if (nombre.length < 3 || nombre.length > 150) throw datosInvalidos('El nombre debe tener entre 3 y 150 letras.');
  if (!modelo.CATEGORIAS.includes(b.categoria)) throw datosInvalidos('Categoría no válida.');
  const precio = Number(b.precio);
  if (!Number.isInteger(precio) || precio < 1 || precio > 100000) throw datosInvalidos('El precio debe ser un entero mayor a 0.');
  const talla = limpiar(b.talla);
  if (!talla || talla.length > 40) throw datosInvalidos('Indica la talla (máximo 40 letras).');
  const material = limpiar(b.material);
  if (material.length > 80) throw datosInvalidos('El material es demasiado largo.');
  if (!Array.isArray(b.colores)) throw datosInvalidos('Los colores deben ser una lista.');
  const colores = b.colores.map(limpiar).filter(Boolean);
  if (colores.length < 1 || colores.length > 20 || colores.some((c) => c.length > 60)) {
    throw datosInvalidos('Indica entre 1 y 20 colores.');
  }
  const imagen = limpiar(b.imagen);
  if (!/^images\/[\w\-./]+$/.test(imagen) || imagen.includes('..') || imagen.length > 255) {
    throw datosInvalidos('La imagen debe ser una ruta dentro de images/.');
  }
  const nota = limpiar(b.nota);
  if (nota.length > 255) throw datosInvalidos('La nota es demasiado larga.');
  return {
    nombre,
    categoria: b.categoria,
    precio,
    talla,
    material: material || null,
    colores,
    imagen,
    destacado: b.destacado ? 1 : 0,
    nota: nota || null,
  };
}

export async function listar(req, res) {
  res.json(await modelo.listar(req.query.categoria));
}

export async function obtener(req, res) {
  const producto = await modelo.obtener(req.params.id);
  if (!producto) throw noEncontrado('Producto no encontrado.');
  res.json(producto);
}

export async function crear(req, res) {
  res.status(201).json(await modelo.crear(validar(req.body)));
}

export async function actualizar(req, res) {
  const producto = await modelo.actualizar(req.params.id, validar(req.body));
  if (!producto) throw noEncontrado('Producto no encontrado.');
  res.json(producto);
}

export async function eliminar(req, res) {
  if (!(await modelo.eliminar(req.params.id))) throw noEncontrado('Producto no encontrado.');
  res.status(204).end();
}
