// api/mp-webhook.js
// Funcion de Vercel: recibe los avisos de Mercado Pago. La llama Mercado Pago, no el navegador.
// Toda la logica esta en server/webhook.js.

const { procesarAviso } = require('../server/webhook');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: { codigo: 'METODO_NO_PERMITIDO', mensaje: 'Método no permitido.' } });
  }

  // Si el JSON viene mal formado, leer el cuerpo lanza un error. Se sigue sin cuerpo:
  // lo importante (firma e id del pago) viaja en los encabezados y en la direccion.
  let cuerpo;
  try {
    cuerpo = req.body;
  } catch (e) {
    cuerpo = undefined;
  }

  const respuesta = await procesarAviso({ query: req.query, headers: req.headers, body: cuerpo });
  return res.status(respuesta.status).json(respuesta.cuerpo);
};
