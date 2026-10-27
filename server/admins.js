// server/admins.js
// Alta de admins de organizaciones desde el panel del superadmin (cambio ajustes-tras-vista-previa-3).
// El proyecto de Firebase NO deja crear cuentas desde la página (y está bien: si no, cualquiera podría registrarse).
// Por eso la cuenta la crea el servidor, solo si quien la pide es un superadmin.
// Devuelve { status, cuerpo } y nunca lanza. Las dependencias (`deps`) se reemplazan en las pruebas.
// IMPORTANTE: la clave nunca se guarda ni se escribe en los registros.

const { ConfigError } = require('./config');

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;

const respuesta = (status, cuerpo) => ({ status, cuerpo });
const error = (status, codigo, mensaje) => respuesta(status, { ok: false, error: { codigo, mensaje } });

// La misma regla que shared/cuentas-admin.js (validarClave): 8+ caracteres, minúscula, mayúscula, número y símbolo
function problemaDeClave(clave) {
  if (typeof clave !== 'string' || clave.length < 8 || clave.length > 128) return 'La clave tiene que tener entre 8 y 128 caracteres.';
  if (/\s/.test(clave)) return 'La clave no puede tener espacios.';
  if (!/[a-z]/.test(clave) || !/[A-Z]/.test(clave) || !/[0-9]/.test(clave)) return 'La clave tiene que tener al menos una minúscula, una mayúscula y un número.';
  if (!/[^a-zA-Z0-9]/.test(clave)) return 'La clave tiene que tener al menos un símbolo.';
  return '';
}

// El token que manda el navegador: "Authorization: Bearer <token de Firebase>"
function tokenDe(headers) {
  const valor = headers && (headers.authorization || headers.Authorization);
  const m = typeof valor === 'string' ? valor.match(/^Bearer\s+(.+)$/) : null;
  return m ? m[1].trim() : '';
}

function dependenciasReales() {
  const { obtenerDb } = require('./firestore');
  const db = obtenerDb(); // también inicia la app de firebase-admin
  const { getAuth } = require('firebase-admin/auth');
  const { FieldValue } = require('firebase-admin/firestore');
  return { db, auth: getAuth(), ahora: () => FieldValue.serverTimestamp() };
}

async function crearAdmin(pedido, deps = null) {
  try {
    return await crearAdminSinAtrapar(pedido, deps);
  } catch (e) {
    console.error('crear-admin: error inesperado', e && e.code ? e.code : 'sin código');
    return error(500, 'ERROR_INTERNO', 'No se pudo crear la cuenta por un error del servidor. Probá de nuevo en unos minutos.');
  }
}

async function crearAdminSinAtrapar({ headers, cuerpo }, deps) {
  let d;
  try {
    d = deps || dependenciasReales();
  } catch (e) {
    console.error(e instanceof ConfigError ? e.message : 'No se pudo iniciar Firebase en crear-admin');
    return error(500, 'CONFIGURACION', 'El servidor no está configurado para crear cuentas.');
  }

  // 1) Quién lo pide: tiene que ser un superadmin con sesión
  const token = tokenDe(headers);
  if (!token) return error(401, 'SIN_SESION', 'Tu sesión expiró. Volvé a iniciar sesión.');
  let uidPide;
  try {
    uidPide = (await d.auth.verifyIdToken(token)).uid;
  } catch (e) {
    return error(401, 'SIN_SESION', 'Tu sesión expiró. Volvé a iniciar sesión.');
  }
  const perfil = await d.db.collection('usuarios').doc(uidPide).get();
  if (!perfil.exists || (perfil.data() || {}).rol !== 'superadmin') return error(403, 'NO_PERMITIDO', 'Solo el superadmin puede crear admins.');

  // 2) Qué pide: correo, clave y organización (activa)
  const datos = cuerpo && typeof cuerpo === 'object' ? cuerpo : {};
  const correo = typeof datos.correo === 'string' ? datos.correo.trim().toLowerCase() : '';
  if (!CORREO.test(correo) || correo.length > 254) return error(400, 'CORREO_INVALIDO', 'Escribí un correo válido.');
  const problema = problemaDeClave(datos.clave);
  if (problema) return error(400, 'CLAVE_INVALIDA', problema);
  const organizacionId = typeof datos.organizacionId === 'string' ? datos.organizacionId : '';
  if (!ID_VALIDO.test(organizacionId)) return error(400, 'ORGANIZACION_INVALIDA', 'Elegí una organización.');
  const org = await d.db.collection('organizaciones').doc(organizacionId).get();
  if (!org.exists || (org.data() || {}).eliminada === true) return error(404, 'ORGANIZACION_INVALIDA', 'Esa organización no existe o está eliminada.');
  const nombreOrg = (org.data() || {}).nombre || '';

  // 3) La cuenta. Si el correo ya tiene acceso pero no es cuenta de Evently, NO se vincula tal cual (alguien podría haber
  //    creado ese acceso antes con el correo de otro): se le pone la clave elegida por el superadmin y se cierran todas
  //    sus sesiones, así solo entra quien recibe esa clave.
  let usuario = null;
  let creada = false;
  try {
    usuario = await d.auth.getUserByEmail(correo);
  } catch (e) {
    if (!e || e.code !== 'auth/user-not-found') return errorDeAuth(e);
  }
  if (usuario) {
    const existente = await d.db.collection('usuarios').doc(usuario.uid).get();
    if (existente.exists) return error(409, 'YA_ES_CUENTA', 'Ese correo ya es una cuenta de Evently: agregalo sin clave desde la organización.');
    try {
      await d.auth.updateUser(usuario.uid, { password: datos.clave });
      await d.auth.revokeRefreshTokens(usuario.uid);
    } catch (e) {
      return errorDeAuth(e);
    }
  } else {
    try {
      usuario = await d.auth.createUser({ email: correo, password: datos.clave, emailVerified: false });
      creada = true;
    } catch (e) {
      return errorDeAuth(e);
    }
  }

  try {
    await d.db.collection('usuarios').doc(usuario.uid).set({
      email: correo, rol: 'organizacion', organizacionId, nombre: nombreOrg, creadoEn: d.ahora(),
    });
  } catch (e) {
    if (creada) {
      try { await d.auth.deleteUser(usuario.uid); } catch (x) { console.error('crear-admin: no se pudo deshacer el acceso', x && x.code ? x.code : 'sin código'); }
    }
    console.error('crear-admin: no se pudo guardar la cuenta', e && e.code ? e.code : 'sin código');
    return error(500, 'ERROR_GUARDADO', 'No se pudo guardar la cuenta. No se creó nada: probá de nuevo.');
  }
  // En los dos casos la clave que vale es la elegida por el superadmin (se muestra una sola vez en el panel)
  return respuesta(200, { ok: true, uid: usuario.uid, creada });
}

// Errores de Firebase Auth en palabras simples. El caso típico: la cuenta de servicio no tiene permiso para crear usuarios.
function errorDeAuth(e) {
  const codigo = e && e.code ? String(e.code) : '';
  console.error('crear-admin: error de Firebase Auth', codigo || 'sin código');
  if (codigo === 'auth/email-already-exists') return error(409, 'YA_EXISTE', 'Ese correo ya tiene acceso.');
  if (codigo === 'auth/invalid-password') return error(400, 'CLAVE_INVALIDA', 'Firebase no aceptó la clave: probá con una más larga.');
  if (codigo === 'auth/insufficient-permission' || /PERMISSION|permission/.test((e && e.message) || '')) {
    return error(500, 'SIN_PERMISO_AUTH', 'La cuenta de servicio del servidor no tiene permiso para crear usuarios. Hay que darle el rol "Administrador de Firebase Authentication" en Google Cloud.');
  }
  return error(500, 'ERROR_AUTH', `No se pudo crear la cuenta.${codigo ? ` (código: ${codigo})` : ''}`);
}

module.exports = { crearAdmin, problemaDeClave, tokenDe };
