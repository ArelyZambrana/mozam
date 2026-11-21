import * as modelo from '../models/conocimiento.js';
import { datosInvalidos, noEncontrado } from '../utils/http-error.js';
import { limpiar } from '../utils/texto.js';

function validar(cuerpo) {
  const b = cuerpo ?? {};
  const tema = limpiar(b.tema);
  const contenido = limpiar(b.contenido);
  if (tema.length < 3 || tema.length > 80) throw datosInvalidos('El tema debe tener entre 3 y 80 letras.');
  if (contenido.length < 5 || contenido.length > 700) throw datosInvalidos('El contenido debe tener entre 5 y 700 letras.');
  return { tema, contenido, activo: b.activo === false ? 0 : 1 };
}

export async function listar(_req, res) {
  res.json(await modelo.listar());
}

export async function crear(req, res) {
  res.status(201).json(await modelo.crear(validar(req.body)));
}

export async function actualizar(req, res) {
  const dato = await modelo.actualizar(req.params.id, validar(req.body));
  if (!dato) throw noEncontrado('Tema no encontrado.');
  res.json(dato);
}

export async function eliminar(req, res) {
  if (!(await modelo.eliminar(req.params.id))) throw noEncontrado('Tema no encontrado.');
  res.status(204).end();
}
