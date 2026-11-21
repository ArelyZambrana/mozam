# Mozam | Tienda en línea

Tienda web de **Mozam**, ropa de Cochabamba (faldas, vestidos, tops y complementos).

El proyecto son **dos aplicaciones separadas** que se comunican solo por HTTP:

| Carpeta | Qué es | Tecnología | Puerto |
|---|---|---|---|
| `frontend/` | La tienda (lo que ve el cliente) | Angular 19 | 4200 |
| `backend/` | API, base de datos y chatbot | Node.js + Express 5, MySQL, Ollama (gemma3) | 3000 |

El frontend nunca habla con MySQL ni con Ollama: todo pasa por la API del backend (`/api/...`).

Funciones: catálogo con filtros, detalle de producto, favoritos, carrito, pedido por WhatsApp (queda guardado en MySQL), panel de administración (productos, pedidos, chat y conocimiento del chatbot) y un asistente virtual con IA.

## Requisitos

| Programa | Para qué | Cómo revisar |
|---|---|---|
| Node.js 18.19+, 20.11+ o 22+ | Frontend y backend | `node -v` |
| MySQL 8 (o MariaDB) | Base de datos | que el servicio esté corriendo |
| Ollama | Chatbot | `ollama list` debe mostrar `gemma3:4b` |

Descargar el modelo del chatbot (una sola vez, pesa unos 3 GB):

```bash
ollama pull gemma3:4b
```

## Cómo correrlo

Se necesitan **dos terminales**, una para cada aplicación.

### 1. Backend (terminal 1)

```bash
cd backend
npm install
copy .env.example .env      # en Mac/Linux: cp .env.example .env
```

Abre `backend/.env` y completa `DB_USER` y `DB_PASSWORD` con los datos de tu MySQL. Ahí también cambias `ADMIN_KEY`, la clave del panel de administración.

```bash
npm start
```

Debe decir `API de Mozam lista en http://localhost:3000/api`. La base de datos `mozam` y sus tablas se crean solas, y la primera vez se cargan los 63 productos y el conocimiento del chatbot.

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm start
```

Abre http://localhost:4200

El servidor de desarrollo de Angular redirige las llamadas `/api` al backend (archivo `frontend/proxy.conf.json`).

> Para el chatbot, Ollama tiene que estar abierto (la app de Ollama en la bandeja, o `ollama serve`).

## Panel de administración

Entra a `/admin` e ingresa la `ADMIN_KEY` de `backend/.env`.

- **Productos:** crear, editar y eliminar (tabla `productos`).
- **Pedidos:** los que llegan desde el carrito (tablas `pedidos` y `pedido_items`), con estado `nuevo`, `confirmado`, `entregado` o `cancelado`.
- **Chat:** conversaciones guardadas del chatbot (tabla `chat_mensajes`).
- **Conocimiento del chatbot:** los temas que el chatbot sabe sobre Mozam y la tienda (tabla `conocimiento`): crear, editar, apagar y eliminar.

## Chatbot

El botón "Pregúntale a Mozam" abre un chat que responde en streaming. En cada pregunta, el backend arma las instrucciones del modelo con lo que hay **en MySQL en ese momento**:

1. **Conocimiento** (tabla `conocimiento`): qué es Mozam, qué es la app y sus páginas, cómo comprar, envíos, devoluciones, tallas, contacto y cómo se hizo el proyecto. Se edita desde el panel.
2. **Resumen del catálogo**, calculado al momento: cuántos productos hay por categoría, rango de precios y destacados.
3. **Catálogo completo** (tabla `productos`): nombre, categoría, precio, colores, material y avisos.

Luego se lo manda a gemma3 vía Ollama. Nada de esto está escrito fijo en el código: si cambias un precio, agregas un producto o editas un tema en el panel, el chatbot lo sabe en la siguiente pregunta. Lo único fijo son las reglas de comportamiento (responder en español, no inventar, derivar a WhatsApp si no sabe).

Es un modelo pequeño: puede equivocarse. Por eso el chat avisa que las respuestas pueden tener errores.

## API (backend)

| Método y ruta | Acceso | Qué hace |
|---|---|---|
| `GET /api/salud` | público | Estado del servidor y de MySQL |
| `GET /api/productos` | público | Lista de productos (`?categoria=faldas`) |
| `GET /api/productos/:id` | público | Un producto |
| `POST /api/productos` | admin | Crea un producto |
| `PUT /api/productos/:id` | admin | Edita un producto |
| `DELETE /api/productos/:id` | admin | Elimina un producto |
| `POST /api/productos/restaurar` | admin | Vuelve al catálogo original |
| `POST /api/pedidos` | público | Registra un pedido (el total se calcula con los precios de MySQL) |
| `GET /api/pedidos` | admin | Lista de pedidos |
| `PATCH /api/pedidos/:id` | admin | Cambia el estado |
| `DELETE /api/pedidos/:id` | admin | Elimina un pedido |
| `GET /api/conocimiento` | admin | Temas que conoce el chatbot |
| `POST /api/conocimiento` | admin | Crea un tema |
| `PUT /api/conocimiento/:id` | admin | Edita un tema |
| `DELETE /api/conocimiento/:id` | admin | Elimina un tema |
| `POST /api/conocimiento/restaurar` | admin | Vuelve al conocimiento original |
| `GET /api/chat/estado` | público | ¿Ollama está prendido y tiene el modelo? |
| `POST /api/chat` | público | Pregunta al chatbot (respuesta en streaming) |
| `GET /api/chat/mensajes` | admin | Últimos mensajes guardados |

"Admin" significa enviar el header `x-admin-key` con la clave de `ADMIN_KEY`.

## Base de datos

Se crea automáticamente (`backend/src/db.js`):

- `productos`: id, nombre, categoría, precio, talla, material, colores, imagen, destacado, nota
- `pedidos`: cliente, entrega, ciudad, notas, total, estado, fecha
- `pedido_items`: producto, color, cantidad y precio de cada línea (guarda el nombre y precio del momento, así el historial no cambia si luego se edita el producto)
- `conocimiento`: tema, contenido y si está activo (lo que sabe el chatbot)
- `chat_mensajes`: sesión, quién escribió y el texto

Los datos iniciales están en `backend/data/` (`products.json` y `conocimiento.json`). Para volver a cargarlos desde cero: `cd backend && npm run seed`.

## Si algo falla

| Síntoma | Qué revisar |
|---|---|
| `No se pudo conectar a MySQL` al prender el backend | MySQL apagado, o `DB_USER` / `DB_PASSWORD` mal en `backend/.env` |
| La tienda dice "No se pudo cargar el catálogo" | El backend (terminal 1) no está corriendo |
| El chat dice "Ollama no responde" | Abre la app de Ollama o corre `ollama serve` |
| El chat dice "Falta el modelo" | Corre `ollama pull gemma3:4b` |
| La primera respuesta del chat tarda | Ollama está cargando el modelo en memoria; las siguientes son más rápidas |

## Estructura

```
backend/
├─ .env.example            Configuración (copiar a .env, que no se sube a GitHub)
├─ data/                   products.json y conocimiento.json (datos iniciales)
└─ src/
   ├─ server.js            Arranque de Express
   ├─ config.js            Variables de entorno
   ├─ db.js                Conexión MySQL, tablas y carga inicial
   ├─ seed.js              Recarga los datos iniciales (npm run seed)
   ├─ ollama.js            Conexión con Ollama (streaming)
   ├─ middleware/adminKey.js
   └─ routes/              productos, pedidos, conocimiento y chat
frontend/
├─ proxy.conf.json         Redirige /api al backend en desarrollo
├─ public/images/          Logo y fotos de los productos
└─ src/app/
   ├─ services/            product, cart, favorites, order, knowledge, admin-auth, whatsapp
   ├─ layout/              header, footer y chatbot
   ├─ shared/              tarjeta de producto
   └─ pages/               home, catalog, product, cart, favorites, admin, info
```

Más detalle sobre los agentes de IA del proyecto en [AGENTS.md](AGENTS.md).
