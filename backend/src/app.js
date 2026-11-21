import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { manejarErrores, rutaNoEncontrada } from './middlewares/error-handler.js';
import routes from './routes/index.js';

const app = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', routes);
app.use('/api', rutaNoEncontrada);
app.use(manejarErrores);

export default app;
