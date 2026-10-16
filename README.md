# Mozam | Tienda en línea (front end)

Sitio web de **Mozam**, tienda de ropa de Cochabamba, hecho con Angular 19.

Catálogo de faldas, vestidos, tops y complementos con filtros, favoritos, carrito, pedido por WhatsApp y un panel para administrar productos.

## Requisitos

- Node.js 18.19+, 20.11+ o 22 (revisa con `node -v`)
- npm

## Cómo correrlo

```bash
npm install
npm start
```

Abre http://localhost:4200

Para generar la versión de producción:

```bash
npm run build
```

Los archivos quedan en `dist/mozam/browser`.

## Cómo cambiar el contenido

| Qué | Dónde |
|---|---|
| Productos, precios, colores | `public/data/products.json`, o desde el panel `/admin` (se guarda solo en el navegador) |
| Fotos de productos | `public/images/products/` |
| Número de WhatsApp | `src/app/services/whatsapp.service.ts` (`WHATSAPP_NUMERO`, con código 591) |
| Colores y tipografías | `src/styles.scss` (variables en `:root`) |

Formato de un producto en el JSON:

```json
{
  "id": "falda-eco-cuero",
  "nombre": "Falda eco cuero",
  "categoria": "faldas",
  "precio": 120,
  "talla": "Estándar S/M",
  "material": "Eco cuero",
  "colores": ["Negro"],
  "imagen": "images/products/falda-eco-cuero.jpg"
}
```

## Páginas

- `/` Inicio
- `/catalogo` Catálogo con búsqueda, material, precio máximo y orden (`?categoria=faldas|vestidos|tops|complementos`)
- `/producto/:id` Detalle del producto
- `/favoritos` Productos guardados
- `/carrito` Carrito y pedido por WhatsApp
- `/admin` Panel de productos (crear, editar y eliminar; sin login)
- `/info` Envíos, políticas y contacto

Más detalle sobre el agente de IA que ayudó a construirlo en [AGENTS.md](AGENTS.md).
