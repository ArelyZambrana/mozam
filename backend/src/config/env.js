import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 3000,
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
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
};
