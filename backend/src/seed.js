// Uso: npm run seed
// Borra los productos y el conocimiento del chatbot de MySQL y los vuelve a cargar desde backend/data/
import { iniciarBD, pool, sembrar, sembrarConocimiento } from './db.js';

try {
  await iniciarBD();
  const n = await sembrar(true);
  const t = await sembrarConocimiento(true);
  console.log(`Listo: ${n} productos y ${t} temas del chatbot cargados en MySQL.`);
} catch (e) {
  console.error('No se pudo cargar los datos iniciales:', e.message);
  process.exitCode = 1;
} finally {
  await pool?.end();
}
