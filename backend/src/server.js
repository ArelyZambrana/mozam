import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { iniciarBD, pool } from './db.js';
import { exigirAdmin } from './middleware/adminKey.js';
import { chat } from './routes/chat.js';
import { conocimiento } from './routes/conocimiento.js';
import { pedidos } from './routes/pedidos.js';
import { productos } from './routes/productos.js';

const app = express();
// El frontend (Angular) corre en otro puerto; en desarrollo usa un proxy, pero dejamos CORS abierto para él
app.use(cors({ origin: ['http://localhost:4200'] }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/salud', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, base_de_datos: 'conectada' });
  } catch {
    res.status(503).json({ ok: false, base_de_datos: 'sin conexión' });
  }
});

// Sirve para que el panel compruebe la clave antes de mostrarse
app.get('/api/admin/verificar', exigirAdmin, (_req, res) => res.json({ ok: true }));

app.use('/api/productos', productos);
app.use('/api/pedidos', pedidos);
app.use('/api/chat', chat);
app.use('/api/conocimiento', conocimiento);

app.use('/api', (_req, res) => res.status(404).json({ error: 'no_encontrado', mensaje: 'Ruta no encontrada.' }));

// Cualquier error inesperado (por ejemplo, MySQL caído) llega aquí
app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return res.end();
  res.status(500).json({ error: 'error_interno', mensaje: 'Ocurrió un error en el servidor.' });
});

try {
  await iniciarBD();
} catch (e) {
  console.error('\nNo se pudo conectar a MySQL:', e.message);
  console.error('Revisa que MySQL esté corriendo y que DB_USER / DB_PASSWORD de backend/.env sean correctos.\n');
  process.exit(1);
}

if (config.adminKey === 'mozam-admin') {
  console.warn('Aviso: estás usando la clave de admin por defecto. Cámbiala en backend/.env (ADMIN_KEY).');
}

app.listen(config.port, () => {
  console.log(`API de Mozam lista en http://localhost:${config.port}/api`);
  console.log(`Chatbot: ${config.ollama.model} vía ${config.ollama.url}`);
});
