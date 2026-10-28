// api/validador.js
// Función de Vercel del validador de entradas: crea el enlace para la puerta (admin con sesión) y valida cada código.
// Toda la lógica está en server/validador.js.

const { validador } = require('../server/validador');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: { codigo: 'METODO_NO_PERMITIDO', mensaje: 'Método no permitido.' } });
  }

  let cuerpo;
  try {
    cuerpo = req.body;
  } catch (e) {
    cuerpo = undefined;
  }

  const respuesta = await validador({ headers: req.headers, cuerpo });
  return res.status(respuesta.status).json(respuesta.cuerpo);
};
