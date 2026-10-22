// api/venta.js
// Funcion de Vercel: el comprador consulta el estado de su compra con el id y el token.
// Es publica (la llama confirmacion.html). Toda la logica esta en server/venta.js.
// Se usa POST con los datos en el cuerpo (no en la direccion) para que el token
// no quede en los registros de acceso del servidor.

const { consultarVenta } = require('../server/venta');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: { codigo: 'METODO_NO_PERMITIDO', mensaje: 'Método no permitido.' } });
  }

  // Si el JSON viene mal formado, leer el cuerpo lanza un error: se trata como una consulta sin datos
  let cuerpo;
  try {
    cuerpo = req.body;
  } catch (e) {
    cuerpo = undefined;
  }

  const datos = cuerpo && typeof cuerpo === 'object' ? cuerpo : {};
  const respuesta = await consultarVenta({ id: datos.id, token: datos.t });
  return res.status(respuesta.status).json(respuesta.cuerpo);
};
