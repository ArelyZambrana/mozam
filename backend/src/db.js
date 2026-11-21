import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from './config.js';

export const CATEGORIAS = ['faldas', 'vestidos', 'tops', 'complementos'];
export const ENTREGAS = ['delivery', 'correo', 'envio'];
export const ESTADOS = ['nuevo', 'confirmado', 'entregado', 'cancelado'];

/** @type {import('mysql2/promise').Pool} */
export let pool;

const TABLAS = [
  `CREATE TABLE IF NOT EXISTS productos (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS pedidos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cliente VARCHAR(100) NOT NULL,
    entrega ENUM('delivery','correo','envio') NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    notas TEXT NULL,
    total INT UNSIGNED NOT NULL,
    estado ENUM('nuevo','confirmado','entregado','cancelado') NOT NULL DEFAULT 'nuevo',
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // producto_id no es llave foránea a propósito: si se borra un producto, el pedido conserva su historial
  `CREATE TABLE IF NOT EXISTS pedido_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT UNSIGNED NOT NULL,
    producto_id VARCHAR(100) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    color VARCHAR(60) NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    precio_unitario INT UNSIGNED NOT NULL,
    CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Lo que sabe el chatbot sobre Mozam y la tienda web. Se edita desde el panel.
  `CREATE TABLE IF NOT EXISTS conocimiento (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tema VARCHAR(80) NOT NULL,
    contenido TEXT NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    orden INT NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS chat_mensajes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sesion VARCHAR(60) NOT NULL,
    rol ENUM('user','assistant') NOT NULL,
    contenido TEXT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sesion (sesion)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

/** Convierte una fila de MySQL al mismo formato que usa el front end. */
export function aProducto(fila) {
  const p = {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    precio: Number(fila.precio),
    talla: fila.talla,
    colores: JSON.parse(fila.colores),
    imagen: fila.imagen,
  };
  if (fila.material) p.material = fila.material;
  if (fila.destacado) p.destacado = true;
  if (fila.nota) p.nota = fila.nota;
  return p;
}

/** Crea la base y las tablas si no existen, y carga el catálogo la primera vez. */
export async function iniciarBD() {
  const { host, port, user, password, database } = config.db;
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DB_NAME solo puede tener letras, números y guion bajo');
  }

  const conexion = await mysql.createConnection({ host, port, user, password });
  await conexion.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conexion.end();

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
  });

  for (const sql of TABLAS) await pool.query(sql);

  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM productos');
  if (n === 0) {
    const cargados = await sembrar();
    console.log(`Catálogo cargado en MySQL: ${cargados} productos.`);
  }

  const [[{ k }]] = await pool.query('SELECT COUNT(*) AS k FROM conocimiento');
  if (k === 0) {
    const cargadas = await sembrarConocimiento();
    console.log(`Conocimiento del chatbot cargado en MySQL: ${cargadas} temas.`);
  }
}

/** Carga conocimiento.json en la tabla conocimiento. Con reemplazar=true borra antes lo que haya. */
export async function sembrarConocimiento(reemplazar = false) {
  const temas = JSON.parse(await readFile(config.conocimientoJson, 'utf8'));
  if (reemplazar) await pool.query('DELETE FROM conocimiento');
  await pool.query('INSERT INTO conocimiento (tema, contenido, activo, orden) VALUES ?', [
    temas.map((t, i) => [t.tema, t.contenido, 1, i]),
  ]);
  return temas.length;
}

/** Carga products.json en la tabla productos. Con reemplazar=true borra antes lo que haya. */
export async function sembrar(reemplazar = false) {
  const texto = await readFile(config.productsJson, 'utf8');
  const productos = JSON.parse(texto);
  if (reemplazar) await pool.query('DELETE FROM productos');
  const filas = productos.map((p, i) => [
    p.id,
    p.nombre,
    p.categoria,
    p.precio,
    p.talla,
    p.material ?? null,
    JSON.stringify(p.colores),
    p.imagen,
    p.destacado ? 1 : 0,
    p.nota ?? null,
    i,
  ]);
  await pool.query(
    'INSERT INTO productos (id, nombre, categoria, precio, talla, material, colores, imagen, destacado, nota, orden) VALUES ?',
    [filas],
  );
  return filas.length;
}
