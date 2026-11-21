export function rutaNoEncontrada(_req, res) {
  res.status(404).json({ error: 'no_encontrado', mensaje: 'Ruta no encontrada.' });
}

export function manejarErrores(err, _req, res, _next) {
  if (res.headersSent) return res.end();
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'datos_invalidos', mensaje: 'El cuerpo no es un JSON válido.' });
  }
  if (err.status && err.codigo) {
    return res.status(err.status).json({ error: err.codigo, mensaje: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'error_interno', mensaje: 'Ocurrió un error en el servidor.' });
}
