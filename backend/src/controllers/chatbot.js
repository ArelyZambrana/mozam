import { construirContexto } from '../chatbot/contexto.js';
import { OllamaError, chatEnStreaming, estadoOllama } from '../chatbot/ollama.js';
import { config } from '../config/env.js';
import * as mensajes from '../models/chat-mensajes.js';
import { HttpError, datosInvalidos } from '../utils/http-error.js';

const MAX_HISTORIAL = 8;
const MAX_LARGO = 500;

export async function estado(_req, res) {
  res.json({ ...(await estadoOllama()), modelo_nombre: config.ollama.model });
}

export async function historial(_req, res) {
  res.json(await mensajes.ultimos());
}

export async function conversar(req, res) {
  const sesion = String(req.body?.sesion ?? '').slice(0, 60) || 'anonima';
  const recibidos = Array.isArray(req.body?.mensajes) ? req.body.mensajes : [];
  const conversacion = recibidos
    .filter((m) => (m?.rol === 'user' || m?.rol === 'assistant') && typeof m.contenido === 'string' && m.contenido.trim())
    .map((m) => ({ role: m.rol, content: m.contenido.trim().slice(0, MAX_LARGO) }))
    .slice(-MAX_HISTORIAL);

  const ultimo = conversacion.at(-1);
  if (!ultimo || ultimo.role !== 'user') throw datosInvalidos('Escribe un mensaje.');

  const cancelar = new AbortController();
  res.on('close', () => cancelar.abort());

  let trozos;
  try {
    trozos = await chatEnStreaming(
      [{ role: 'system', content: await construirContexto() }, ...conversacion],
      cancelar.signal,
    );
  } catch (e) {
    if (e instanceof OllamaError) throw new HttpError(503, e.codigo, e.message);
    if (e.name === 'AbortError') return;
    throw e;
  }

  mensajes.guardar(sesion, 'user', ultimo.content).catch(() => {});

  res.status(200).set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  let respuesta = '';
  try {
    for await (const trozo of trozos) {
      respuesta += trozo;
      res.write(trozo);
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      const aviso = e instanceof OllamaError ? e.message : 'Se cortó la respuesta.';
      res.write(`\n\n[${aviso}]`);
    }
  }
  res.end();

  if (respuesta.trim()) mensajes.guardar(sesion, 'assistant', respuesta.trim()).catch(() => {});
}
