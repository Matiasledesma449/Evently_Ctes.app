// api/correo-de-prueba.js
// Función de Vercel: el superadmin se manda a sí mismo el correo de confirmación de ejemplo (pedido 23).
// Toda la lógica está en server/prueba-correo.js.

const { mandarCorreoDePrueba } = require('../server/prueba-correo');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: { codigo: 'METODO_NO_PERMITIDO', mensaje: 'Método no permitido.' } });
  }
  const respuesta = await mandarCorreoDePrueba({ headers: req.headers });
  return res.status(respuesta.status).json(respuesta.cuerpo);
};
