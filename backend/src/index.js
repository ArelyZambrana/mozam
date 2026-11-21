import app from './app.js';
import { verificarConexion } from './config/database.js';
import { config } from './config/env.js';

try {
  await verificarConexion();
} catch (e) {
  console.error('\nNo se pudo usar la base de datos:', e.message);
  console.error('Revisa que MySQL esté corriendo, que backend/.env tenga el usuario y la clave correctos y que hayas importado database/mozam.sql\n');
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`API de Mozam lista en http://localhost:${config.port}/api`);
  console.log(`Chatbot: ${config.ollama.model} vía ${config.ollama.url}`);
});
