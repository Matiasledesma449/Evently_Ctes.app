// api/crear-pago.js
// Funcion de Vercel: inicia una compra y devuelve el enlace de pago de Mercado Pago.
// Es publica (la llama evento.html). Toda la logica esta en server/crear-pago.js.

const { crearPago } = require('../server/crear-pago');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: { codigo: 'METODO_NO_PERMITIDO', mensaje: 'Método no permitido.' } });
  }

  // Si el JSON viene mal formado, leer el cuerpo lanza un error
  let cuerpo;
  try {
    cuerpo = req.body;
  } catch (e) {
    return res.status(400).json({ ok: false, error: { codigo: 'PEDIDO_INVALIDO', mensaje: 'No pudimos leer tu pedido. Volvé a intentarlo.' } });
  }

  const respuesta = await crearPago(cuerpo);
  return res.status(respuesta.status).json(respuesta.cuerpo);
};
