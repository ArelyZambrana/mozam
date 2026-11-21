import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..');

export const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'mozam',
  },
  adminKey: process.env.ADMIN_KEY || 'mozam-admin',
  ollama: {
    url: (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, ''),
    model: process.env.OLLAMA_MODEL || 'gemma3:4b',
  },
  /** Datos iniciales: se cargan en MySQL la primera vez (y con `npm run seed`) */
  productsJson: path.join(raiz, 'data', 'products.json'),
  conocimientoJson: path.join(raiz, 'data', 'conocimiento.json'),
};
