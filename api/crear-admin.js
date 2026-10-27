// api/crear-admin.js
// Función de Vercel: el superadmin crea la cuenta del admin de una organización (correo y clave).
// Toda la lógica está en server/admins.js. La clave viaja en el cuerpo (no en la dirección) y nunca se guarda.

const { crearAdmin } = require('../server/admins');

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

  const respuesta = await crearAdmin({ headers: req.headers, cuerpo });
  return res.status(respuesta.status).json(respuesta.cuerpo);
};
