# Agente de IA del proyecto Mozam

Descripción del agente de IA usado en el desarrollo del front end de la tienda web **Mozam**.

## 1. Resumen

| Campo | Detalle |
|---|---|
| Agente | Claude, de Anthropic (modelo Claude Sonnet 5.5), usado desde la app de Claude |
| Rol | Desarrollador front end asistente: diseña, programa, prueba y documenta bajo la dirección de Arely |
| Responsable del proyecto | Arely Zambrana |
| Cliente | Mozam, tienda de ropa de Cochabamba (@mozam_cb) |
| Tecnología | Angular 19 (componentes standalone, signals, rutas con carga diferida), SCSS |

## 2. Rol y alcance del agente

**Lo que hace el agente**

- Lee los materiales que entrega Arely (catálogos en PDF, logo, datos de contacto) y extrae productos, precios, tallas y materiales.
- Propone la arquitectura y escribe el código Angular completo.
- Diseña la interfaz a partir de la identidad visual de la marca.
- Compila y prueba la aplicación en un navegador automatizado, y corrige los errores que encuentra.
- Documenta el proyecto (este archivo y `README.md`).

**Lo que no hace**

- No inventa productos, precios ni políticas de la tienda: todo sale del catálogo oficial de Mozam.
- No incluye backend, pagos en línea ni inicio de sesión. Esa parte queda fuera del alcance de esta etapa.
- No reemplaza la revisión de Arely: ella valida los datos del negocio antes de publicar.

## 3. Contexto del proyecto

Mozam es una tienda de ropa real que hoy vende por redes sociales y no tiene sitio web. Su catálogo existe solo en PDF
(faldas, vestidos, complementos y tops/blusas). El front end se plantea como primer paso para una tienda en línea
con pedidos por WhatsApp, que es como el negocio ya atiende a sus clientes.

**Objetivo:** desarrollar el front end de la tienda con agentes de IA y Angular.

## 4. Stack

- Angular 19 con componentes standalone (sin NgModules)
- Estado con **signals** (`signal`, `computed`, `effect`, `input`)
- Rutas con **carga diferida** (`loadComponent`) y `withComponentInputBinding()`
- `HttpClient` para cargar el catálogo desde `public/data/products.json`
- Formularios reactivos (`ReactiveFormsModule`) en el carrito y en el panel de productos
- SCSS con variables CSS (tema oscuro con el rosa del logo)
- Sin backend: los datos base son un JSON estático; el carrito, los favoritos y los cambios del panel de productos se guardan en `localStorage`

## 5. Estructura

```
src/app/
├─ models/product.model.ts        Tipos Producto, CartItem y categorías
├─ services/
│  ├─ product.service.ts          Carga el JSON, expone signals y permite crear, editar y eliminar productos (CRUD)
│  ├─ favorites.service.ts        Lista de favoritos con signals y persistencia en localStorage
│  ├─ cart.service.ts             Carrito con signals y persistencia en localStorage
│  └─ whatsapp.service.ts         Arma los mensajes y enlaces de wa.me
├─ layout/                        Header y footer
├─ shared/product-card.component.ts
└─ pages/
   ├─ home/      Inicio: hero, categorías, destacados, cómo comprar
   ├─ catalog/   Catálogo con búsqueda, material, precio máximo y orden
   ├─ product/   Detalle: color, cantidad, agregar al carrito, consulta por WhatsApp
   ├─ cart/      Carrito y formulario de pedido, envío por WhatsApp
   ├─ favorites/ Productos guardados con el corazón
   ├─ admin/     Panel de productos: resumen, tabla con búsqueda, crear, editar y eliminar
   └─ info/      Envíos, políticas y contacto
public/
├─ data/products.json             63 productos (fuente única de datos)
└─ images/                        Logo y fotos de producto extraídas de los PDFs
```

## 6. Convenciones que sigue el agente

- Componentes standalone, `inject()` en lugar de constructor, plantillas con `@if` / `@for`.
- Estado derivado con `computed()`; nada de suscripciones manuales en las vistas.
- Nombres de dominio en español (`producto`, `carrito`, `colores`) y de infraestructura en inglés cuando son términos del framework.
- Precios en bolivianos, siempre con el sufijo "Bs".
- Accesibilidad básica: enlace de salto al contenido, `aria-label` en controles, foco visible, texto alternativo en imágenes y respeto a `prefers-reduced-motion`.
- Los datos del negocio solo se cambian en `public/data/products.json` y en `whatsapp.service.ts` (número de contacto).

## 7. Flujo de trabajo entre Arely y el agente

1. **Arely:** define el proyecto (la tienda web de Mozam), entrega los 4 catálogos en PDF, el logo y los datos de contacto.
2. **Agente:** extrae las fotos de los PDFs, limpia los fondos y transcribe los 63 productos a `products.json`.
3. **Agente:** diseña y programa las 7 pantallas y los 4 servicios.
4. **Agente:** compila el proyecto y lo prueba en un navegador automatizado (filtros, selección de color, carrito, validación del formulario y mensaje de WhatsApp).
5. **Arely:** revisa los datos del catálogo y prueba la aplicación.

## 8. Decisiones de diseño

- **Paleta:** fondo negro y rosa `#ff44a8` tomados del logo; rosa suave del catálogo como acento secundario.
- **Precio abajo a la derecha de cada foto**, igual que en el catálogo impreso, para que los clientes reconozcan el formato.
- **Pedido por WhatsApp** en lugar de pago en línea: es lo que Mozam usa hoy y evita backend en esta etapa.
- **Una sola talla:** el catálogo vende talla estándar S/M (un vestido es XS/S), así que no hay selector de talla.

## 9. Verificación realizada

- `ng build` de producción sin errores.
- Prueba automatizada en navegador: 63 productos en el catálogo; filtro por categoría (17 faldas, 7 vestidos, 35 tops y blusas, 4 complementos); búsqueda; orden por precio; exigencia de color antes de agregar; carrito con total correcto; validación del formulario; mensaje de WhatsApp con el pedido completo.
- Favoritos: guardar y quitar desde el catálogo y el detalle, contador en el menú y persistencia al recargar.
- Panel de productos: validación del formulario, crear, editar, eliminar con confirmación, búsqueda, y restaurar el catálogo original; los cambios se reflejan en el catálogo.
- Revisión visual en escritorio y en pantalla de celular (incluido el menú hamburguesa).

## 10. Limitaciones y pendientes

- **Tops y blusas:** las 35 prendas del catálogo están cargadas. Una de las fotos del PDF (la blusa con mangas de encaje) traía un banner publicitario incrustado, que se recortó.
- **Colores:** cuando el catálogo no rotulaba los colores, se leyeron de las fotos. Conviene que la dueña los confirme.
- **Nombres:** se corrigieron erratas del catálogo ("Flda", "hoddie", "strapple", "Algodòn") y se diferenciaron productos con el mismo nombre añadiendo un detalle visible de la prenda (por ejemplo las tres "Falda fairy" o las cinco "Blusa asimétrica"). Las dos "Blusa asimétrica" de tull y terciopelo tienen datos idénticos en el catálogo y se dejaron como dos productos. El color se escribe "guindo", como en el catálogo.
- **Vestido halter:** en el catálogo figura como "Vestido encaje rosas", probablemente un error de copia; en la web se llama "Vestido halter".
- **Disponibilidad:** el vestido encaje tiene el color guindo marcado como agotado en el catálogo.
- **Panel de productos simulado:** no hay login ni servidor, así que cualquiera que abra `/admin` puede editar, y los cambios existen solo en el navegador donde se hicieron. Para uso real necesita backend con autenticación.
- **Sin inventario ni pagos:** no hay control de stock ni pasarela de pago.
- **Pruebas unitarias:** no se escribieron; la verificación fue funcional y manual/automatizada de extremo a extremo.

## 11. Instrucciones para seguir trabajando con el agente

Si se continúa el proyecto con este agente, estas reglas mantienen la coherencia:

- No inventar productos, precios, tallas ni políticas; pedirlos a la dueña.
- Mantener el catálogo en `public/data/products.json` como única fuente de datos.
- Entregar los archivos completos cuando se modifique código, no fragmentos.
- Correr `npm run build` antes de dar un cambio por terminado.
- Siguientes pasos sugeridos: backend con autenticación (por ejemplo Firebase o una API propia) para que el panel de productos guarde los cambios de verdad, control de stock y pruebas unitarias.
