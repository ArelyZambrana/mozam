import { Router } from 'express';
import * as chatbot from '../controllers/chatbot.js';
import * as conocimiento from '../controllers/conocimiento.js';
import * as pedidos from '../controllers/pedidos.js';
import * as productos from '../controllers/productos.js';
import * as salud from '../controllers/salud.js';
import { exigirAdmin } from '../middlewares/admin-key.js';
import { limitarMensajes } from '../middlewares/rate-limit.js';

const router = Router();

router.get('/salud', salud.salud);
router.get('/admin/verificar', exigirAdmin, salud.verificarAdmin);

router.get('/productos', productos.listar);
router.get('/productos/:id', productos.obtener);
router.post('/productos', exigirAdmin, productos.crear);
router.put('/productos/:id', exigirAdmin, productos.actualizar);
router.delete('/productos/:id', exigirAdmin, productos.eliminar);

router.post('/pedidos', pedidos.crear);
router.get('/pedidos', exigirAdmin, pedidos.listar);
router.patch('/pedidos/:id', exigirAdmin, pedidos.cambiarEstado);
router.delete('/pedidos/:id', exigirAdmin, pedidos.eliminar);

router.get('/conocimiento', exigirAdmin, conocimiento.listar);
router.post('/conocimiento', exigirAdmin, conocimiento.crear);
router.put('/conocimiento/:id', exigirAdmin, conocimiento.actualizar);
router.delete('/conocimiento/:id', exigirAdmin, conocimiento.eliminar);

router.get('/chat/estado', chatbot.estado);
router.get('/chat/mensajes', exigirAdmin, chatbot.historial);
router.post('/chat', limitarMensajes, chatbot.conversar);

export default router;
