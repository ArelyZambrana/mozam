import mysql from 'mysql2/promise';
import { config } from './env.js';

const { host, port, user, password, database } = config.db;

export const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

export async function verificarConexion() {
  await pool.query('SELECT 1');
  const [tablas] = await pool.query(
    'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name IN (?)',
    [database, ['productos', 'pedidos', 'pedido_items', 'conocimiento', 'chat_mensajes']],
  );
  if (tablas[0].n < 5) {
    throw new Error(`La base "${database}" existe pero faltan tablas. Importa database/mozam.sql`);
  }
}
