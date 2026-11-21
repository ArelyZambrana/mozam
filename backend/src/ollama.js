import { config } from './config.js';

/** Error con un mensaje listo para mostrarle al cliente. */
export class OllamaError extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

/** ¿Está Ollama prendido y tiene el modelo descargado? */
export async function estadoOllama() {
  try {
    const r = await fetch(`${config.ollama.url}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!r.ok) return { disponible: false, modelo: false };
    const { models = [] } = await r.json();
    const base = config.ollama.model.split(':')[0];
    const tieneModelo = models.some((m) => m.name === config.ollama.model || m.name.split(':')[0] === base);
    return { disponible: true, modelo: tieneModelo };
  } catch {
    return { disponible: false, modelo: false };
  }
}

/**
 * Pide una respuesta a Ollama en modo streaming.
 * Devuelve un generador asíncrono que va entregando los trozos de texto.
 * Si Ollama no responde o falta el modelo, lanza OllamaError ANTES de entregar el primer trozo.
 */
export async function chatEnStreaming(mensajes, señal) {
  let respuesta;
  try {
    respuesta = await fetch(`${config.ollama.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: señal,
      body: JSON.stringify({
        model: config.ollama.model,
        messages: mensajes,
        stream: true,
        keep_alive: '10m',
        options: { temperature: 0.3, num_ctx: 6144 },
      }),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new OllamaError('ollama_apagado', 'No se pudo conectar con Ollama. Revisa que esté abierto (ollama serve).');
  }

  if (respuesta.status === 404) {
    throw new OllamaError('modelo_faltante', `Falta descargar el modelo. Corre en una terminal: ollama pull ${config.ollama.model}`);
  }
  if (!respuesta.ok || !respuesta.body) {
    throw new OllamaError('ollama_error', `Ollama respondió con un error (${respuesta.status}).`);
  }

  async function* trozos() {
    const lector = respuesta.body.getReader();
    const decodificador = new TextDecoder();
    let resto = '';
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      resto += decodificador.decode(value, { stream: true });
      const lineas = resto.split('\n');
      resto = lineas.pop() ?? '';
      for (const linea of lineas) {
        if (!linea.trim()) continue;
        const dato = JSON.parse(linea);
        if (dato.error) throw new OllamaError('ollama_error', dato.error);
        if (dato.message?.content) yield dato.message.content;
        if (dato.done) return;
      }
    }
  }
  return trozos();
}
