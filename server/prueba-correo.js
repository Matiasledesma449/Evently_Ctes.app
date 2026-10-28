// server/prueba-correo.js
// "Mandarme un correo de prueba" (pedido 23): el superadmin recibe en SU correo el mismo correo de confirmación que
// recibe un comprador, con datos de ejemplo. Sirve para comprobar que Gmail está bien configurado sin hacer una compra.
// Devuelve { status, cuerpo } y nunca lanza (lo usa api/correo-de-prueba.js).

const { ConfigError, siteUrl } = require('./config');
const { correoDeConfirmacion, enviarCorreo } = require('./correos');

const error = (status, codigo, mensaje) => ({ status, cuerpo: { ok: false, error: { codigo, mensaje } } });

function tokenDe(headers) {
  const valor = headers && (headers.authorization || headers.Authorization);
  const m = typeof valor === 'string' ? valor.match(/^Bearer\s+(.+)$/) : null;
  return m ? m[1].trim() : '';
}

function dependenciasReales() {
  const { obtenerDb } = require('./firestore');
  const db = obtenerDb(); // también inicia la app de firebase-admin
  const { getAuth } = require('firebase-admin/auth');
  return { db, auth: getAuth(), enviar: enviarCorreo };
}

async function mandarCorreoDePrueba({ headers }, deps = null) {
  try {
    let d;
    try {
      d = deps || dependenciasReales();
    } catch (e) {
      console.error(e instanceof ConfigError ? e.message : 'No se pudo iniciar Firebase en correo-de-prueba');
      return error(500, 'CONFIGURACION', 'El servidor no tiene configurado Firebase (en la vista previa suele faltar).');
    }
    const token = tokenDe(headers);
    if (!token) return error(401, 'SIN_SESION', 'Tu sesión expiró. Volvé a iniciar sesión.');
    let quien;
    try {
      quien = await d.auth.verifyIdToken(token, true);
    } catch (e) {
      return error(401, 'SIN_SESION', 'Tu sesión expiró. Volvé a iniciar sesión.');
    }
    const perfil = await d.db.collection('usuarios').doc(quien.uid).get();
    if (!perfil.exists || (perfil.data() || {}).rol !== 'superadmin') return error(403, 'NO_PERMITIDO', 'Solo el superadmin puede mandar correos de prueba.');
    if (!quien.email) return error(400, 'SIN_CORREO', 'Tu cuenta no tiene correo.');

    const sitio = siteUrl();
    const correo = correoDeConfirmacion({
      ventaId: 'PRUEBA123',
      venta: { nombre: 'Equipo de Evently', cantidad: 2, loteNombre: 'Preventa', monto_total: 24500, entradas: [{ codigo: 'EV-PRUEBA-0001' }, { codigo: 'EV-PRUEBA-0002' }] },
      evento: { nombre: 'Evento de prueba', fecha: 'Sáb 15 Nov · 21:00', lugar: 'Lugar de ejemplo' },
      enlace: `${sitio}/public/index.html`, sitio,
    });
    const r = await d.enviar({ para: quien.email, asunto: `[Prueba] ${correo.asunto}`, html: correo.html, texto: correo.texto });
    if (r.enviado) return { status: 200, cuerpo: { ok: true, correo: quien.email } };
    if (r.motivo === 'sin_configurar') return error(500, 'SIN_GMAIL', 'Faltan GMAIL_USUARIO o GMAIL_CLAVE_APLICACION en Vercel.');
    if (r.codigo === 'EAUTH' || r.codigo === 535) return error(502, 'GMAIL_RECHAZO', 'Gmail rechazó el usuario o la contraseña de aplicación. Revisalos en Vercel.');
    return error(502, 'FALLO_ENVIO', 'Gmail no aceptó el correo. Probá de nuevo en unos minutos.');
  } catch (e) {
    console.error('correo-de-prueba: error inesperado', e && (e.code || e.name));
    return error(500, 'ERROR_INTERNO', 'No se pudo mandar el correo de prueba.');
  }
}

module.exports = { mandarCorreoDePrueba };
