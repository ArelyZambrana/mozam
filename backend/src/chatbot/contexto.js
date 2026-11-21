import * as productos from '../models/productos.js';
import * as conocimiento from '../models/conocimiento.js';

const MAX_CONOCIMIENTO = 6000;

export async function construirContexto() {
  const [lista, temas] = await Promise.all([productos.listar(), conocimiento.listarActivos()]);

  let saber = '';
  for (const t of temas) {
    const linea = `- ${t.tema}: ${t.contenido}\n`;
    if (saber.length + linea.length > MAX_CONOCIMIENTO) break;
    saber += linea;
  }

  const porCategoria = {};
  for (const p of lista) porCategoria[p.categoria] = (porCategoria[p.categoria] ?? 0) + 1;
  const precios = lista.map((p) => p.precio);
  const resumen = [
    `- Total: ${lista.length} productos (${Object.entries(porCategoria).map(([c, n]) => `${n} ${c}`).join(', ')}).`,
    precios.length ? `- Precios desde ${Math.min(...precios)} Bs hasta ${Math.max(...precios)} Bs.` : '',
    `- Destacados: ${lista.filter((p) => p.destacado).map((p) => p.nombre).join(', ') || 'ninguno'}.`,
  ]
    .filter(Boolean)
    .join('\n');

  const catalogo = lista
    .map((p) => {
      const partes = [p.nombre, p.categoria, `${p.precio} Bs`, `colores: ${p.colores.join(', ')}`];
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
${saber || '(sin información cargada)'}
RESUMEN DEL CATÁLOGO (calculado ahora)
${resumen}

CATÁLOGO (nombre | categoría | precio | detalles)
${catalogo}`;
}
