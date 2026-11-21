# Agentes de IA del proyecto Mozam

Descripción de los agentes de IA que intervienen en la tienda web **Mozam**: el que ayudó a construirla y el que atiende a los clientes dentro de ella.

## 1. Resumen

| Campo | Agente de desarrollo | Agente de la tienda (chatbot) |
|---|---|---|
| Modelo | Claude, de Anthropic (Claude Sonnet 5.5), desde la app de Claude | gemma3 (`gemma3:4b`) con Ollama, en la compu de quien corre el proyecto |
| Rol | Desarrollador asistente: diseña, programa, prueba y documenta el frontend y el backend | Asistente virtual: responde dudas sobre el catálogo, precios, colores y envíos |
| Dirección | Arely Zambrana (responsable del proyecto) | Instrucciones fijas del backend (`backend/src/routes/chat.js`) |
| Cliente | Mozam, tienda de ropa de Cochabamba (@mozam_cb) | Clientes de la tienda |

Tecnología del proyecto: Angular 19 (`frontend/`), Node.js + Express 5 (`backend/`), MySQL (base de datos), Ollama + gemma3 (chatbot). Frontend y backend son dos aplicaciones separadas, cada una con su `package.json`, que se comunican solo por HTTP.

## 2. Agente de desarrollo (Claude)

**Lo que hace**

- Lee los materiales que entrega Arely (catálogos en PDF, logo, datos de contacto) y extrae productos, precios, tallas y materiales.
- Propone la arquitectura y escribe el código completo del frontend (Angular) y del backend (Express + MySQL).
- Diseña el esquema de la base de datos y la API REST.
- Integra el chatbot con Ollama y gemma3.
- Diseña la interfaz a partir de la identidad visual de la marca.
- Compila y prueba la aplicación en un navegador automatizado y contra una base MySQL, y corrige lo que encuentra.
- Documenta el proyecto (este archivo y `README.md`).

**Lo que no hace**

- No inventa productos, precios ni políticas de la tienda: todo sale del catálogo oficial de Mozam.
- No incluye pagos en línea. Los pedidos se cierran por WhatsApp.
- No reemplaza la revisión de Arely: ella valida los datos del negocio antes de publicar.

## 3. Agente de la tienda: chatbot con Ollama y gemma3

### Cómo funciona

1. El cliente escribe en el chat del sitio (`layout/chatbot.component.ts`).
2. El frontend manda la conversación (máximo 8 mensajes) a `POST /api/chat`.
3. El backend arma las instrucciones del modelo leyendo **MySQL** en ese momento: (a) la tabla `conocimiento` con lo que debe saber sobre Mozam y la tienda web, (b) un resumen del catálogo calculado al momento y (c) la lista completa de productos con precio, colores y material. Las reglas de comportamiento son lo único fijo.
4. El backend llama a Ollama (`/api/chat`, `stream: true`, `temperature: 0.3`, `num_ctx: 6144`) y reenvía la respuesta al navegador a medida que se genera.
5. La pregunta y la respuesta quedan guardadas en la tabla `chat_mensajes`.

### Qué sabe el chatbot

- **Sobre Mozam:** qué es la tienda, qué vende, estilo, redes sociales y contacto.
- **Sobre la aplicación:** qué es, sus páginas, favoritos, cómo comprar paso a paso, envíos, devoluciones, tallas, disponibilidad y cómo se desarrolló el proyecto.
- **Sobre el catálogo:** todos los productos con precio, colores, material y avisos, más un resumen (cantidad por categoría, rango de precios, destacados).
- **No está escrito en el código:** el conocimiento vive en la tabla `conocimiento` y se edita desde el panel de administración (crear, editar, apagar, eliminar). Los productos y precios salen siempre de la tabla `productos`. Cualquier cambio se refleja en la siguiente pregunta, sin reentrenar ni reiniciar.
- **Lo que no sabe:** el stock real, los pedidos de los clientes ni el contenido de las fotos.

### Instrucciones del modelo (resumen)

- Responder en español, en 4 oraciones o menos, en texto plano.
- Usar solo la información entregada (conocimiento, resumen y catálogo). No inventar productos, precios, colores, stock ni políticas.
- Si piden algo que no existe, decirlo y sugerir algo parecido del catálogo.
- Si no tiene el dato, decirlo con honestidad y sugerir escribir por WhatsApp.
- No hablar de temas ajenos a la tienda.

### Decisiones de diseño

- **El conocimiento va en el contexto en vez de entrenar o afinar el modelo:** el chatbot siempre refleja lo que hay en MySQL (productos, precios y temas), sin reentrenar y sin tocar el código.
- **Temperatura baja (0.3):** respuestas más estables y menos inventadas.
- **Streaming:** un modelo de 4B parámetros en una compu normal tarda; ver el texto aparecer evita que parezca colgado.
- **Estado visible:** al abrir el chat se comprueba si Ollama está prendido y si el modelo está descargado, y se avisa con un mensaje claro.
- **Límite de uso:** 20 mensajes por minuto por dirección, para no saturar el modelo local.

### Limitaciones del chatbot

- gemma3:4b es un modelo pequeño: puede equivocarse o ignorar parte de las instrucciones. Por eso el chat avisa que las respuestas pueden tener errores.
- No ve fotos de los productos ni el stock real.
- La primera respuesta tarda más porque Ollama carga el modelo en memoria.
- Funciona solo si Ollama está corriendo en la misma compu que el backend.

## 4. Stack

- **Frontend:** Angular 19 con componentes standalone, **signals**, rutas con carga diferida (`loadComponent`), `withComponentInputBinding()`, formularios reactivos, `HttpClient` con interceptor para la clave del panel y SCSS con variables CSS (tema oscuro con el rosa del logo).
- **Backend:** Node.js, Express 5 y `mysql2` (consultas parametrizadas, transacciones en los pedidos). No contiene nada del frontend: solo expone la API.
- **Base de datos:** MySQL, tablas `productos`, `pedidos`, `pedido_items`, `conocimiento` y `chat_mensajes`, creadas automáticamente al arrancar.
- **IA:** Ollama con `gemma3:4b`.
- El frontend no guarda datos del catálogo: si el backend no responde, muestra un aviso claro. En desarrollo, `frontend/proxy.conf.json` redirige `/api` al backend.

## 5. Estructura

```
backend/                       Aplicación 1: API, base de datos y chatbot (puerto 3000)
├─ data/                       products.json y conocimiento.json (datos iniciales)
└─ src/
   ├─ server.js                Express, rutas y arranque
   ├─ config.js                Variables de entorno (.env)
   ├─ db.js                    Conexión MySQL, tablas y carga inicial
   ├─ seed.js                  Recarga los datos iniciales (npm run seed)
   ├─ ollama.js                Cliente de Ollama con streaming y errores claros
   ├─ middleware/adminKey.js   Protege las rutas del panel con x-admin-key
   └─ routes/
      ├─ productos.js          CRUD con validación
      ├─ pedidos.js            Crear (total calculado en el servidor), listar, estado
      ├─ conocimiento.js       CRUD de lo que sabe el chatbot
      └─ chat.js               Instrucciones dinámicas, streaming y guardado de mensajes
frontend/                      Aplicación 2: la tienda en Angular (puerto 4200)
├─ proxy.conf.json             Redirige /api al backend en desarrollo
├─ public/images/              Logo y fotos de los productos
└─ src/app/
   ├─ models/product.model.ts
   ├─ services/
   │  ├─ product.service.ts       Catálogo por HTTP + CRUD
   │  ├─ cart.service.ts          Carrito con signals y localStorage
   │  ├─ favorites.service.ts     Favoritos con signals y localStorage
   │  ├─ order.service.ts         Pedidos y mensajes del chat (panel)
   │  ├─ knowledge.service.ts     Conocimiento del chatbot (panel)
   │  ├─ admin-auth.service.ts    Clave del panel e interceptor HTTP
   │  └─ whatsapp.service.ts      Mensajes y enlaces de wa.me
   ├─ layout/                     Header, footer y chatbot
   ├─ shared/product-card.component.ts
   └─ pages/
      ├─ home/ catalog/ product/  Inicio, catálogo con filtros, detalle
      ├─ cart/                    Carrito, formulario y pedido por WhatsApp
      ├─ favorites/               Productos guardados
      ├─ admin/                   Panel: productos, pedidos, chat y conocimiento
      └─ info/                    Envíos, políticas y contacto
```

## 6. Convenciones que sigue el agente

- Componentes standalone, `inject()` en lugar de constructor, plantillas con `@if` / `@for`.
- Estado derivado con `computed()`; nada de suscripciones manuales en las vistas.
- Nombres de dominio en español (`producto`, `carrito`, `colores`) y de infraestructura en inglés cuando son términos del framework.
- Precios en bolivianos, siempre con el sufijo "Bs".
- En el backend: consultas parametrizadas (nunca se arma SQL con texto del usuario), validación de cada campo y precios de los pedidos tomados de MySQL, no del navegador.
- Accesibilidad básica: enlace de salto al contenido, `aria-label` en controles, foco visible, texto alternativo en imágenes y respeto a `prefers-reduced-motion`.
- Las credenciales van en `backend/.env`, que no se sube a GitHub.

## 7. Flujo de trabajo entre Arely y el agente

1. **Arely:** define el proyecto (la tienda web de Mozam), entrega los 4 catálogos en PDF, el logo y los datos de contacto.
2. **Agente:** extrae las fotos de los PDFs y transcribe los 63 productos a `products.json`.
3. **Agente:** diseña y programa el frontend (7 pantallas) como aplicación independiente en `frontend/`.
4. **Agente:** crea el backend en `backend/` con MySQL, el panel de administración con clave, el guardado de pedidos y el chatbot con Ollama y gemma3, cuyo conocimiento se administra desde el panel.
5. **Agente:** prueba el sistema de punta a punta (ver sección 8).
6. **Arely:** revisa los datos del catálogo, prueba la aplicación con su MySQL y su Ollama, y sube el código a GitHub.

## 8. Verificación realizada

- `ng build` de producción sin errores.
- **API contra una base MySQL (MariaDB 10.11 compatible):** el catálogo (63 productos) y el conocimiento del chatbot (11 temas) se cargan solos la primera vez; crear, editar y eliminar productos; rechazo de datos inválidos y de rutas de imagen peligrosas; rutas del panel responden 401 sin clave; el pedido valida producto y color, calcula el total con los precios de la base y guarda sus líneas en una transacción; el historial del pedido se conserva aunque se borre el producto; los mensajes del chat se guardan.
- **Chatbot:** el flujo completo (instrucciones con el conocimiento, el resumen y el catálogo leídos de MySQL; un tema nuevo aparece en las instrucciones y uno apagado desaparece; streaming hasta el navegador, guardado, y mensajes de error claros si Ollama está apagado o falta el modelo) se probó con un servidor Ollama simulado. La conexión con gemma3 real la valida Arely en su compu.
- **Navegador automatizado:** login del panel con clave correcta e incorrecta, crear un producto y verlo tras recargar, enviar un pedido desde el carrito y verlo en el panel, cambiar su estado, abrir el chat, conversar y ver los mensajes guardados; el chat también se probó en pantalla de celular.
- **Separación:** las pruebas se hicieron con el frontend (4200) y el backend (3000) como procesos distintos, hablando solo por HTTP. Con el backend apagado, la tienda, el panel y el chat avisan con un mensaje claro.

## 9. Decisiones de diseño

- **Paleta:** fondo negro y rosa `#ff44a8` tomados del logo; rosa suave del catálogo como acento secundario.
- **Precio abajo a la derecha de cada foto**, igual que en el catálogo impreso, para que los clientes reconozcan el formato.
- **Pedido por WhatsApp**, además de guardarse en MySQL: es lo que Mozam usa hoy. El pedido se registra, pero la conversación y el pago siguen por WhatsApp. Si el servidor falla, el mensaje de WhatsApp igual se envía.
- **El total lo calcula el servidor:** el navegador manda solo producto, color y cantidad; así nadie puede alterar un precio.
- **Una sola talla:** el catálogo vende talla estándar S/M (un vestido es XS/S), así que no hay selector de talla.
- **Panel con clave simple (`ADMIN_KEY`):** protege escritura y lectura de pedidos sin armar un sistema de usuarios completo.

## 10. Limitaciones y pendientes

- **Autenticación básica:** hay una sola clave compartida, sin usuarios ni roles. Para producción conviene un login real con sesiones o JWT y HTTPS.
- **Chatbot local:** depende de que Ollama corra en la misma compu que el backend. Publicarlo en internet requeriría un servidor con GPU o un servicio de modelos.
- **Fotos nuevas:** el panel reutiliza imágenes existentes; subir fotos nuevas todavía es manual (carpeta `public/images/products/`).
- **Colores:** cuando el catálogo no rotulaba los colores, se leyeron de las fotos. Conviene que la dueña los confirme.
- **Nombres:** se corrigieron erratas del catálogo y se diferenciaron productos con el mismo nombre. El color se escribe "guindo", como en el catálogo.
- **Vestido halter:** en el catálogo figura como "Vestido encaje rosas", probablemente un error de copia; en la web se llama "Vestido halter".
- **Disponibilidad:** el vestido encaje tiene el color guindo marcado como agotado en el catálogo.
- **Sin inventario ni pagos:** no hay control de stock ni pasarela de pago.
- **Pruebas unitarias:** no se escribieron; la verificación fue funcional, de punta a punta.

## 11. Instrucciones para seguir trabajando con el agente

- No inventar productos, precios, tallas ni políticas; pedirlos a la dueña.
- El catálogo y el conocimiento del chatbot viven en MySQL. Los JSON de `backend/data/` son solo la carga inicial.
- Entregar los archivos completos cuando se modifique código, no fragmentos.
- Correr `npm run build` (frontend) y probar la API antes de dar un cambio por terminado.
- Siguientes pasos sugeridos: login real, subida de fotos desde el panel, control de stock, notificación de pedidos nuevos y pruebas unitarias.
