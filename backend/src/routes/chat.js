import { Router } from 'express';
import { config } from '../config.js';
import { pool } from '../db.js';
import { exigirAdmin } from '../middleware/adminKey.js';
import { OllamaError, chatEnStreaming, estadoOllama } from '../ollama.js';

export const chat = Router();

const MAX_HISTORIAL = 8;
const MAX_LARGO = 500;

/** Límite simple por IP: 20 mensajes por minuto (el modelo corre en tu compu, no hay que saturarlo). */
const visitas = new Map();
function demasiadosMensajes(ip) {
  const ahora = Date.now();
  const recientes = (visitas.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  recientes.push(ahora);
  visitas.set(ip, recientes);
  return recientes.length > 20;
}

const MAX_CONOCIMIENTO = 6000; // caracteres, para que el prompt entre en la ventana del modelo

/** Arma las instrucciones del modelo con lo que hay en MySQL en este momento (nada va fijo salvo las reglas de conducta). */
async function instrucciones() {
  const [productos] = await pool.query(
    'SELECT nombre, categoria, precio, talla, material, colores, nota, destacado FROM productos ORDER BY orden, creado_en',
  );
  const [temas] = await pool.query('SELECT tema, contenido FROM conocimiento WHERE activo = 1 ORDER BY orden, id');

  let conocimiento = '';
  for (const t of temas) {
    const linea = `- ${t.tema}: ${t.contenido}\n`;
    if (conocimiento.length + linea.length > MAX_CONOCIMIENTO) break;
    conocimiento += linea;
  }

  const porCategoria = {};
  for (const p of productos) porCategoria[p.categoria] = (porCategoria[p.categoria] ?? 0) + 1;
  const precios = productos.map((p) => Number(p.precio));
  const resumen = [
    `- Total: ${productos.length} productos (${Object.entries(porCategoria).map(([c, n]) => `${n} ${c}`).join(', ')}).`,
    precios.length ? `- Precios desde ${Math.min(...precios)} Bs hasta ${Math.max(...precios)} Bs.` : '',
    `- Destacados: ${productos.filter((p) => p.destacado).map((p) => p.nombre).join(', ') || 'ninguno'}.`,
  ]
    .filter(Boolean)
    .join('\n');

  const catalogo = productos
    .map((p) => {
      const partes = [p.nombre, p.categoria, `${p.precio} Bs`, `colores: ${JSON.parse(p.colores).join(', ')}`];
      if (p.material) partes.push(`material: ${p.material}`);
      if (p.talla !== 'Estándar S/M') partes.push(`talla: ${p.talla}`);
      if (p.nota) partes.push(`aviso: ${p.nota}`);
      return `- ${partes.join(' | ')}`;
    })
    .join('\n');

  return `Eres el asistente virtual de Mozam y de su tienda web. Ayudas a los clientes a conocer la tienda, el catálogo y cómo comprar.

REGLAS
- Responde siempre en español, con tono amable y cercano, en 4 oraciones o menos.
- Usa SOLO la información de este mensaje (conocimiento, resumen y catálogo). No inventes productos, precios, colores, stock ni políticas.
- Si te preguntan algo que no está en la información, di con honestidad que no tienes ese dato y sugiere escribir por WhatsApp.
- Si piden algo que no está en el catálogo, dilo y sugiere algo parecido que sí exista.
- Escribe en texto plano: sin asteriscos, sin negritas y sin viñetas con símbolos. Si das varias opciones, sepáralas con saltos de línea.
- Los precios están en bolivianos (Bs).
- Si hablan de otro tema que no tenga que ver con Mozam o su tienda web, responde que solo puedes ayudar con eso.

CONOCIMIENTO SOBRE MOZAM Y ESTA TIENDA WEB
${conocimiento || '(sin información cargada)'}
RESUMEN DEL CATÁLOGO (calculado ahora)
${resumen}

CATÁLOGO (nombre | categoría | precio | detalles)
${catalogo}`;
}

chat.get('/estado', async (_req, res) => {
  res.json({ ...(await estadoOllama()), modelo_nombre: config.ollama.model });
});

/** Últimos mensajes guardados en MySQL (para el panel de administración) */
chat.get('/mensajes', exigirAdmin, async (_req, res) => {
  const [filas] = await pool.query('SELECT id, sesion, rol, contenido, creado_en FROM chat_mensajes ORDER BY id DESC LIMIT 100');
  res.json(filas);
});

chat.post('/', async (req, res) => {
  if (demasiadosMensajes(req.ip)) {
    return res.status(429).json({ error: 'demasiados_mensajes', mensaje: 'Estás escribiendo muy rápido. Espera un momento.' });
  }

  const sesion = String(req.body?.sesion ?? '').slice(0, 60) || 'anonima';
  const recibidos = Array.isArray(req.body?.mensajes) ? req.body.mensajes : [];
  const historial = recibidos
    .filter((m) => (m?.rol === 'user' || m?.rol === 'assistant') && typeof m.contenido === 'string' && m.contenido.trim())
    .map((m) => ({ role: m.rol, content: m.contenido.trim().slice(0, MAX_LARGO) }))
    .slice(-MAX_HISTORIAL);

  const ultimo = historial.at(-1);
  if (!ultimo || ultimo.role !== 'user') {
    return res.status(400).json({ error: 'datos_invalidos', mensaje: 'Escribe un mensaje.' });
  }

  const cancelar = new AbortController();
  res.on('close', () => cancelar.abort());

  let trozos;
  try {
    trozos = await chatEnStreaming([{ role: 'system', content: await instrucciones() }, ...historial], cancelar.signal);
  } catch (e) {
    if (e instanceof OllamaError) return res.status(503).json({ error: e.codigo, mensaje: e.message });
    if (e.name === 'AbortError') return;
    throw e;
  }

  // Guardamos la pregunta en MySQL (si falla el guardado, el chat sigue funcionando)
  pool.query('INSERT INTO chat_mensajes (sesion, rol, contenido) VALUES (?,?,?)', [sesion, 'user', ultimo.content]).catch(() => {});

  res.status(200).set({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
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

  if (respuesta.trim()) {
    pool.query('INSERT INTO chat_mensajes (sesion, rol, contenido) VALUES (?,?,?)', [sesion, 'assistant', respuesta.trim()]).catch(() => {});
  }
});
