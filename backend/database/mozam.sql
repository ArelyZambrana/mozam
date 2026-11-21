SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS mozam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mozam;

CREATE TABLE IF NOT EXISTS productos (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria ENUM('faldas','vestidos','tops','complementos') NOT NULL,
  precio INT UNSIGNED NOT NULL,
  talla VARCHAR(40) NOT NULL DEFAULT 'Estándar S/M',
  material VARCHAR(80) NULL,
  colores TEXT NOT NULL,
  imagen VARCHAR(255) NOT NULL,
  destacado TINYINT(1) NOT NULL DEFAULT 0,
  nota VARCHAR(255) NULL,
  orden INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categoria (categoria),
  INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedidos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cliente VARCHAR(100) NOT NULL,
  entrega ENUM('delivery','correo','envio') NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  notas TEXT NULL,
  total INT UNSIGNED NOT NULL,
  estado ENUM('nuevo','confirmado','entregado','cancelado') NOT NULL DEFAULT 'nuevo',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedido_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT UNSIGNED NOT NULL,
  producto_id VARCHAR(100) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  color VARCHAR(60) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario INT UNSIGNED NOT NULL,
  CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conocimiento (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tema VARCHAR(80) NOT NULL,
  contenido TEXT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  orden INT NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_mensajes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sesion VARCHAR(60) NOT NULL,
  rol ENUM('user','assistant') NOT NULL,
  contenido TEXT NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sesion (sesion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO productos (id, nombre, categoria, precio, talla, material, colores, imagen, destacado, nota, orden) VALUES
('falda-larga-encaje-asimetrica', 'Falda larga encaje asimétrica', 'faldas', 190, 'Estándar S/M', 'Encaje', '[\"Negro\",\"Guindo\",\"Rosa palo\",\"Café\"]', 'images/products/falda-larga-encaje-asimetrica.jpg', 1, NULL, 0),
('falda-larga-encaje-volados', 'Falda larga encaje en volados', 'faldas', 150, 'Estándar S/M', 'Encaje', '[\"Negro\",\"Blanco\",\"Guindo\"]', 'images/products/falda-larga-encaje-volados.jpg', 0, NULL, 1),
('falda-mini-encaje', 'Falda mini encaje', 'faldas', 130, 'Estándar S/M', 'Encaje', '[\"Negro\",\"Blanco\"]', 'images/products/falda-mini-encaje.jpg', 0, NULL, 2),
('falda-larga-gasa', 'Falda larga gasa', 'faldas', 140, 'Estándar S/M', 'Gasa', '[\"Negro\"]', 'images/products/falda-larga-gasa.jpg', 0, NULL, 3),
('falda-estilo-alt', 'Falda estilo alt', 'faldas', 130, 'Estándar S/M', 'Licra fría', '[\"Negro con morado\"]', 'images/products/falda-estilo-alt.jpg', 1, NULL, 4),
('falda-larga-encaje-capas', 'Falda larga encaje en capas', 'faldas', 130, 'Estándar S/M', 'Encaje', '[\"Negro\"]', 'images/products/falda-larga-encaje-capas.jpg', 0, NULL, 5),
('falda-lentejuelas-grandes', 'Falda lentejuelas grandes', 'faldas', 140, 'Estándar S/M', 'Lentejuelas', '[\"Rojo\"]', 'images/products/falda-lentejuelas-grandes.jpg', 1, NULL, 6),
('falda-lentejuelas', 'Falda lentejuelas', 'faldas', 120, 'Estándar S/M', 'Lentejuelas', '[\"Negro\",\"Plateado\"]', 'images/products/falda-lentejuelas.jpg', 0, NULL, 7),
('falda-lentejuelas-lila', 'Falda lentejuelas lila', 'faldas', 130, 'Estándar S/M', 'Lentejuelas', '[\"Lila iridiscente\"]', 'images/products/falda-lentejuelas-lila.jpg', 0, NULL, 8),
('falda-fairy-morada', 'Falda fairy morada', 'faldas', 110, 'Estándar S/M', 'Licra fría', '[\"Morado\"]', 'images/products/falda-fairy-morada.jpg', 0, NULL, 9),
('falda-larga-tull', 'Falda larga tull', 'faldas', 110, 'Estándar S/M', 'Tull', '[\"Guindo\"]', 'images/products/falda-larga-tull.jpg', 0, NULL, 10),
('falda-de-encaje', 'Falda de encaje', 'faldas', 140, 'Estándar S/M', 'Licra fría', '[\"Negro\"]', 'images/products/falda-de-encaje.jpg', 0, NULL, 11),
('falda-alt', 'Falda alt', 'faldas', 100, 'Estándar S/M', 'Algodón', '[\"Negro con morado\"]', 'images/products/falda-alt.jpg', 0, NULL, 12),
('falda-eco-cuero', 'Falda eco cuero', 'faldas', 120, 'Estándar S/M', 'Eco cuero', '[\"Negro\"]', 'images/products/falda-eco-cuero.jpg', 0, NULL, 13),
('falda-fairy-roja', 'Falda fairy roja', 'faldas', 120, 'Estándar S/M', 'Tull', '[\"Rojo\"]', 'images/products/falda-fairy-roja.jpg', 0, NULL, 14),
('falda-animal-print', 'Falda animal print', 'faldas', 110, 'Estándar S/M', 'Algodón licrado', '[\"Animal print\"]', 'images/products/falda-animal-print.jpg', 0, NULL, 15),
('falda-fairy-panuelo', 'Falda fairy pañuelo', 'faldas', 110, 'Estándar S/M', 'Licra fría', '[\"Blanco\",\"Café\",\"Guindo\"]', 'images/products/falda-fairy-panuelo.jpg', 0, NULL, 16),
('vestido-coquette-rosa', 'Vestido coquette', 'vestidos', 150, 'Estándar S/M', 'Licra fría', '[\"Rosa\",\"Negro\",\"Guindo\",\"Blanco\"]', 'images/products/vestido-coquette-rosa.jpg', 1, NULL, 17),
('vestido-coquette-encaje', 'Vestido coquette encaje', 'vestidos', 150, 'Estándar S/M', 'Encaje', '[\"Blanco\"]', 'images/products/vestido-coquette-encaje.jpg', 0, NULL, 18),
('vestido-encaje', 'Vestido encaje', 'vestidos', 175, 'Estándar S/M', 'Encaje', '[\"Negro\",\"Negro con base nude\"]', 'images/products/vestido-encaje.jpg', 0, 'El color guindo está agotado.', 19),
('vestido-estilo-goth', 'Vestido estilo goth', 'vestidos', 150, 'Estándar S/M', 'Tull', '[\"Negro con base guindo\"]', 'images/products/vestido-estilo-goth.jpg', 1, NULL, 20),
('vestido-encaje-rosas', 'Vestido encaje rosas', 'vestidos', 175, 'Estándar S/M', 'Encaje', '[\"Guindo\",\"Negro con base nude\",\"Negro\"]', 'images/products/vestido-encaje-rosas.jpg', 0, NULL, 21),
('vestido-halter', 'Vestido halter', 'vestidos', 175, 'Estándar S/M', 'Encaje', '[\"Negro\"]', 'images/products/vestido-halter.jpg', 0, NULL, 22),
('vestido-con-brillo', 'Vestido con brillo', 'vestidos', 120, 'XS/S', 'Escuba', '[\"Rojo\"]', 'images/products/vestido-con-brillo.jpg', 0, NULL, 23),
('blusa-cruz', 'Blusa cruz', 'tops', 95, 'Estándar S/M', 'Algodón licrado', '[\"Negro\",\"Blanco\"]', 'images/products/blusa-cruz.jpg', 0, NULL, 24),
('blusa-asimetrica-tull-1', 'Blusa asimétrica tull y terciopelo', 'tops', 95, 'Estándar S/M', 'Tull y terciopelo', '[\"Guindo\"]', 'images/products/blusa-asimetrica-tull-1.jpg', 0, NULL, 25),
('blusa-asimetrica-tull-2', 'Blusa asimétrica tull y terciopelo', 'tops', 95, 'Estándar S/M', 'Tull y terciopelo', '[\"Guindo\"]', 'images/products/blusa-asimetrica-tull-2.jpg', 0, NULL, 26),
('blusa-corset', 'Blusa corset', 'tops', 75, 'Estándar S/M', 'Algodón licrado', '[\"Rosa\",\"Blanco\"]', 'images/products/blusa-corset.jpg', 0, NULL, 27),
('blusa-asimetrica-encaje', 'Blusa asimétrica encaje', 'tops', 130, 'Estándar S/M', 'Licra fría', '[\"Negro\",\"Café\",\"Guindo\",\"Rosa\"]', 'images/products/blusa-asimetrica-encaje.jpg', 0, NULL, 28),
('blusa-alt', 'Blusa alt', 'tops', 95, 'Estándar S/M', 'Licra fría', '[\"Negro con guindo\"]', 'images/products/blusa-alt.jpg', 0, NULL, 29),
('blusa-asimetrica-mangas', 'Blusa asimétrica y mangas', 'tops', 95, 'Estándar S/M', 'Algodón', '[\"Negro\",\"Guindo\",\"Café\",\"Palo de rosa\",\"Rosa\"]', 'images/products/blusa-asimetrica-mangas.jpg', 0, NULL, 30),
('blusa-mangas-encaje', 'Blusa mangas de encaje', 'tops', 120, 'Estándar S/M', 'Licra fría', '[\"Negro\"]', 'images/products/blusa-mangas-encaje.jpg', 0, NULL, 31),
('blusa-halter', 'Blusa halter', 'tops', 95, 'Estándar S/M', 'Licra fría', '[\"Negro\",\"Blanco\"]', 'images/products/blusa-halter.jpg', 0, NULL, 32),
('blusa-asimetrica-ojales', 'Blusa asimétrica ojales', 'tops', 130, 'Estándar S/M', 'Licra fría', '[\"Negro\",\"Café\",\"Guindo\",\"Rosa\"]', 'images/products/blusa-asimetrica-ojales.jpg', 0, NULL, 33),
('blusa-con-cruz', 'Blusa con cruz', 'tops', 60, 'Estándar S/M', 'Algodón licrado', '[\"Negro\"]', 'images/products/blusa-con-cruz.jpg', 0, NULL, 34),
('blusa-asimetrica-panuelo', 'Blusa asimétrica pañuelo', 'tops', 85, 'Estándar S/M', 'Suplex', '[\"Amarillo\"]', 'images/products/blusa-asimetrica-panuelo.jpg', 0, NULL, 35),
('top-hoodie', 'Top hoodie', 'tops', 120, 'Estándar S/M', 'Suplex', '[\"Negro\"]', 'images/products/top-hoodie.jpg', 0, NULL, 36),
('blusa-cuello-v', 'Blusa cuello V', 'tops', 60, 'Estándar S/M', 'Algodón licrado', '[\"Negro\",\"Beige\",\"Guindo\",\"Terracota\",\"Azul marino\"]', 'images/products/blusa-cuello-v.jpg', 0, NULL, 37),
('blusa-coquette-manga-larga', 'Blusa coquette manga larga', 'tops', 75, 'Estándar S/M', 'Algodón licrado', '[\"Guindo\"]', 'images/products/blusa-coquette-manga-larga.jpg', 0, NULL, 38),
('blusa-asimetrica-halter', 'Blusa asimétrica halter', 'tops', 60, 'Estándar S/M', 'Algodón licrado', '[\"Beige\"]', 'images/products/blusa-asimetrica-halter.jpg', 0, NULL, 39),
('blusa-asimetrica-drapeada', 'Blusa asimétrica drapeada', 'tops', 110, 'Estándar S/M', 'Licra fría', '[\"Blanco\"]', 'images/products/blusa-asimetrica-drapeada.jpg', 0, NULL, 40),
('blusa-off-shoulder', 'Blusa off shoulder', 'tops', 75, 'Estándar S/M', 'Algodón licrado', '[\"Guindo\",\"Azul marino\"]', 'images/products/blusa-off-shoulder.jpg', 0, NULL, 41),
('blusa-cuello-alto', 'Blusa cuello alto', 'tops', 50, 'Estándar S/M', 'Algodón licrado', '[\"Negro\",\"Guindo\",\"Terracota\",\"Azul marino\"]', 'images/products/blusa-cuello-alto.jpg', 0, NULL, 42),
('blusa-satin-copas', 'Blusa satín con copas', 'tops', 120, 'Estándar S/M', 'Satín', '[\"Café\"]', 'images/products/blusa-satin-copas.jpg', 0, NULL, 43),
('blusa-qipao-manga-larga', 'Blusa qipao manga larga', 'tops', 65, 'Estándar S/M', 'Algodón', '[\"Guindo\"]', 'images/products/blusa-qipao-manga-larga.jpg', 0, NULL, 44),
('blusa-qipao-manga-corta', 'Blusa qipao manga corta', 'tops', 60, 'Estándar S/M', 'Algodón licrado', '[\"Guindo\",\"Azul marino\"]', 'images/products/blusa-qipao-manga-corta.jpg', 0, NULL, 45),
('blusa-animal-print', 'Blusa animal print', 'tops', 75, 'Estándar S/M', 'Algodón licrado', '[\"Animal print\"]', 'images/products/blusa-animal-print.jpg', 0, NULL, 46),
('blusa-animal-print-panuelo', 'Blusa animal print pañuelo', 'tops', 95, 'Estándar S/M', 'Licra fría', '[\"Animal print\"]', 'images/products/blusa-animal-print-panuelo.jpg', 0, NULL, 47),
('strapless-ojales', 'Strapless con ojales', 'tops', 75, 'Estándar S/M', 'Algodón licrado', '[\"Azul marino\",\"Negro\",\"Palo de rosa\",\"Guindo\"]', 'images/products/strapless-ojales.jpg', 0, NULL, 48),
('top-2000s', 'Top 2000s', 'tops', 85, 'Estándar S/M', 'Licra fría', '[\"Negro\",\"Guindo\",\"Café\",\"Azul marino\"]', 'images/products/top-2000s.jpg', 0, NULL, 49),
('top-asimetrico', 'Top asimétrico', 'tops', 65, 'Estándar S/M', 'Algodón', '[\"Terracota\"]', 'images/products/top-asimetrico.jpg', 0, NULL, 50),
('blusa-basica', 'Blusa básica', 'tops', 75, 'Estándar S/M', 'Algodón', '[\"Negro\",\"Guindo\",\"Palo de rosa\",\"Café\"]', 'images/products/blusa-basica.jpg', 0, NULL, 51),
('top-abertura', 'Top con abertura', 'tops', 85, 'Estándar S/M', 'Suplex', '[\"Negro\",\"Guindo\",\"Beige dorado\"]', 'images/products/top-abertura.jpg', 0, NULL, 52),
('top-jellyfish', 'Top jellyfish', 'tops', 120, 'Estándar S/M', 'Encaje', '[\"Negro\"]', 'images/products/top-jellyfish.jpg', 0, NULL, 53),
('top-goth', 'Top estilo goth', 'tops', 95, 'Estándar S/M', 'Terciopelo', '[\"Negro\"]', 'images/products/top-goth.jpg', 0, NULL, 54),
('blusa-coquette-tirantes', 'Blusa coquette tirantes', 'tops', 75, 'Estándar S/M', 'Algodón licrado', '[\"Guindo con negro\"]', 'images/products/blusa-coquette-tirantes.jpg', 0, NULL, 55),
('blusa-coquette-hombros', 'Blusa coquette hombros caídos', 'tops', 110, 'Estándar S/M', 'Licra fría', '[\"Café\"]', 'images/products/blusa-coquette-hombros.jpg', 0, NULL, 56),
('blusa-cruzada', 'Blusa cruzada', 'tops', 45, 'Estándar S/M', 'Algodón licrado', '[\"Lila\"]', 'images/products/blusa-cruzada.jpg', 0, NULL, 57),
('blusa-eco-cuero', 'Blusa eco cuero', 'tops', 85, 'Estándar S/M', 'Eco cuero', '[\"Negro\"]', 'images/products/blusa-eco-cuero.jpg', 0, NULL, 58),
('guantes-encaje', 'Guantes encaje', 'complementos', 55, 'Estándar S/M', 'Encaje', '[\"Negro\"]', 'images/products/guantes-encaje.jpg', 0, NULL, 59),
('torera-victoriana', 'Torera victoriana', 'complementos', 150, 'Estándar S/M', NULL, '[\"Negro\"]', 'images/products/torera-victoriana.jpg', 0, NULL, 60),
('torera-encaje', 'Torera encaje', 'complementos', 95, 'Estándar S/M', NULL, '[\"Negro\"]', 'images/products/torera-encaje.jpg', 0, NULL, 61),
('chaleco', 'Chaleco', 'complementos', 110, 'Estándar S/M', NULL, '[\"Morado con negro\"]', 'images/products/chaleco.jpg', 0, NULL, 62);

INSERT IGNORE INTO conocimiento (id, tema, contenido, activo, orden) VALUES
(1, 'Qué es Mozam', 'Mozam es una tienda de ropa de Cochabamba, Bolivia, con estilo alt, coquette y goth. Vende faldas, vestidos, tops y blusas, y complementos (toreras, chaleco, guantes de encaje) en encaje, lentejuelas, tull, eco cuero y otros materiales. Atiende por redes sociales y WhatsApp, y ahora también tiene esta tienda web.', 1, 0),
(2, 'Qué es esta aplicación', 'Es la tienda web de Mozam. Sirve para ver el catálogo completo con fotos y precios, guardar favoritos, armar un carrito y enviar el pedido por WhatsApp. No hay pago en línea. Tiene un asistente virtual (tú) que responde dudas sobre la tienda.', 1, 1),
(3, 'Páginas de la tienda web', 'Inicio (categorías y destacados), Catálogo (filtros por categoría, búsqueda por texto, material, precio máximo y orden por precio o nombre), página de cada producto (elegir color y cantidad, agregar al carrito o consultar por WhatsApp), Favoritos, Carrito y Envíos e info. También hay un panel de administración que solo usa la dueña con una clave.', 1, 2),
(4, 'Favoritos', 'En cada producto hay un corazón para guardarlo en favoritos. Los favoritos se ven en la página Favoritos y quedan guardados en el navegador de quien los marcó.', 1, 3),
(5, 'Cómo comprar', '1) Entra al producto y elige el color y la cantidad (si tiene un solo color ya viene elegido). 2) Agrégalo al carrito. 3) En el carrito llena tu nombre, el tipo de entrega, tu ciudad o zona y notas opcionales. 4) Toca Enviar pedido por WhatsApp: se abre WhatsApp con el pedido ya armado y el pedido queda registrado con un número. El pago y la entrega se coordinan por WhatsApp. En la web no hay pago en línea.', 1, 4),
(6, 'Envíos y entregas', 'Hay entregas en el correo, delivery con costo extra y envíos a otros departamentos y provincias. El costo del delivery o del envío se coordina por WhatsApp. El total que muestra el carrito no incluye el costo de envío.', 1, 5),
(7, 'Devoluciones', 'No hay devoluciones. Conviene revisar bien el pedido antes de confirmarlo.', 1, 6),
(8, 'Tallas', 'Casi todas las prendas son de talla estándar S/M. Si una prenda tiene otra talla, aparece indicada en el producto.', 1, 7),
(9, 'Disponibilidad', 'La tienda web no controla el stock. Si un color está agotado, el producto lo indica en una nota. Para confirmar si algo está disponible, hay que escribir por WhatsApp.', 1, 8),
(10, 'Contacto', 'WhatsApp y teléfono: 79787211. Instagram: @mozam_cb. TikTok: @mozam_cb. Ubicación: Cochabamba, Bolivia.', 1, 9),
(11, 'Cómo se hizo este proyecto', 'La tienda web fue desarrollada por Arely Zambrana con ayuda de Claude, un agente de IA de Anthropic. El frontend es Angular, el backend es Node.js con Express, la base de datos es MySQL y este chatbot funciona con Ollama y el modelo gemma3. El catálogo y lo que sabe este chatbot se guardan en MySQL y se administran desde el panel.', 1, 10);
