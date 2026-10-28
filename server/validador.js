// server/validador.js
// Validación de entradas en la puerta (validador.html), hecha por el servidor.
// Las reglas de Firestore no dejan que el navegador lea ni escriba `ventas`, así que el validador ya no puede hacerlo solo.
// Funciona así:
//   1. Un admin (organización) o el superadmin, con sesión, pide un ENLACE en "Escáner": el servidor arma una clave
//      firmada que dice de qué organización es y hasta cuándo vale (7 días). El personal de la puerta no necesita cuenta.
//   2. validador.html manda cada código escaneado con esa clave. El servidor comprueba la firma, busca la entrada y,
//      si es de esa organización y no se usó, la marca como usada en una transacción (dos lectores a la vez no la
//      pueden dejar pasar dos veces).
// Devuelve { status, cuerpo } y nunca lanza. Las dependencias (`deps`) se reemplazan en las pruebas (pruebas/48-validador.js).

const crypto = require('crypto');
const { requerir, VARIABLES } = require('./config');
const { tokenDe } = require('./admins');
// Arriba (y no dentro de una función) para que Vercel incluya estos módulos en la función
const adminAuth = require('firebase-admin/auth');
const { obtenerDb, Timestamp } = require('./firestore');

const DIAS_DE_VALIDEZ = 7;
const CODIGO_VALIDO = /^[A-Za-z0-9_-]{4,80}$/;
const ID_VALIDO = /^[A-Za-z0-9_-]{1,128}$/;

const respuesta = (status, cuerpo) => ({ status, cuerpo });
const error = (status, codigo, mensaje, extra = {}) => respuesta(status, { ok: false, error: { codigo, mensaje }, ...extra });
const base64url = (texto) => Buffer.from(texto).toString('base64url');

// El secreto para firmar sale de la clave privada del servidor (que ya está en Vercel): nunca sale del servidor
// y no hace falta cargar otra variable.
function secretoReal() {
  const { FIREBASE_PRIVATE_KEY } = requerir([VARIABLES.FIREBASE_PRIVATE_KEY]);
  return crypto.createHash('sha256').update('evently-validador:' + FIREBASE_PRIVATE_KEY).digest();
}

function firmar(contenido, secreto) {
  return crypto.createHmac('sha256', secreto).update(contenido).digest('base64url');
}

// Arma la clave del enlace: { o: organizacionId o '*' (superadmin, todas), x: vence (ms) }
function armarClave(datos, secreto) {
  const contenido = base64url(JSON.stringify(datos));
  return `${contenido}.${firmar(contenido, secreto)}`;
}

// Lee una clave. Devuelve { ok, datos } o { ok: false, motivo: 'invalida' | 'vencida' }.
function leerClave(clave, secreto, ahoraMs) {
  if (typeof clave !== 'string' || clave.length > 600) return { ok: false, motivo: 'invalida' };
  const partes = clave.split('.');
  if (partes.length !== 2) return { ok: false, motivo: 'invalida' };
  const esperada = Buffer.from(firmar(partes[0], secreto));
  const recibida = Buffer.from(partes[1]);
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) return { ok: false, motivo: 'invalida' };
  let datos;
  try { datos = JSON.parse(Buffer.from(partes[0], 'base64url').toString('utf8')); } catch (e) { return { ok: false, motivo: 'invalida' }; }
  if (!datos || typeof datos.o !== 'string' || typeof datos.x !== 'number') return { ok: false, motivo: 'invalida' };
  if (datos.x < ahoraMs) return { ok: false, motivo: 'vencida' };
  return { ok: true, datos };
}

function dependenciasReales() {
  const db = obtenerDb();
  return { db, auth: adminAuth.getAuth(), secreto: secretoReal(), ahoraMs: () => Date.now(), sello: () => Timestamp.now() };
}

// Nombre corto del comprador para mostrar en la puerta ("Ana P."): sirve para pedir el DNI sin mostrar todo
function compradorCorto(venta) {
  const nombre = typeof venta.nombre === 'string' ? venta.nombre.trim() : '';
  const apellido = typeof venta.apellido === 'string' ? venta.apellido.trim() : '';
  return [nombre, apellido ? `${apellido[0].toUpperCase()}.` : ''].filter(Boolean).join(' ');
}

// Fecha de un sello de Firestore (o similar) como texto ISO, o ''
function iso(sello) {
  if (!sello) return '';
  if (typeof sello.toDate === 'function') return sello.toDate().toISOString();
  if (typeof sello.seconds === 'number') return new Date(sello.seconds * 1000).toISOString();
  return '';
}

// ---------- 1. Enlace para la puerta (lo pide un admin con sesión) ----------
async function crearEnlace({ headers }, d) {
  const token = tokenDe(headers);
  if (!token) return error(401, 'SIN_SESION', 'Tu sesión expiró. Volvé a iniciar sesión.');
  let uid;
  try {
    uid = (await d.auth.verifyIdToken(token, true)).uid;
  } catch (e) {
    return error(401, 'SIN_SESION', 'Tu sesión expiró. Volvé a iniciar sesión.');
  }
  const perfil = await d.db.collection('usuarios').doc(uid).get();
  const datos = perfil.exists ? perfil.data() || {} : {};
  let organizacion = '';
  if (datos.rol === 'superadmin') organizacion = '*';
  else if (datos.rol === 'organizacion' && typeof datos.organizacionId === 'string' && ID_VALIDO.test(datos.organizacionId.trim())) organizacion = datos.organizacionId.trim();
  if (!organizacion) return error(403, 'NO_PERMITIDO', 'Tu cuenta no está vinculada a una organización: no puede validar entradas.');
  const vence = d.ahoraMs() + DIAS_DE_VALIDEZ * 24 * 60 * 60 * 1000;
  return respuesta(200, { ok: true, clave: armarClave({ o: organizacion, x: vence }, d.secreto), vence: new Date(vence).toISOString(), todas: organizacion === '*' });
}

// ---------- 2. Validar un código (lo manda validador.html con la clave del enlace) ----------
async function validarCodigo({ cuerpo }, d) {
  const pedido = cuerpo && typeof cuerpo === 'object' ? cuerpo : {};
  const clave = leerClave(pedido.clave, d.secreto, d.ahoraMs());
  if (!clave.ok) {
    return clave.motivo === 'vencida'
      ? error(401, 'ENLACE_VENCIDO', 'Este enlace del validador venció. Pedile uno nuevo al organizador (panel → Escáner).')
      : error(401, 'ENLACE_INVALIDO', 'Este enlace del validador no es válido. Pedile uno nuevo al organizador (panel → Escáner).');
  }
  const codigo = typeof pedido.codigo === 'string' ? pedido.codigo.trim() : '';
  if (!CODIGO_VALIDO.test(codigo)) return error(404, 'NO_EXISTE', 'Ese código no es una entrada de Evently.');
  const organizacion = clave.datos.o;
  const puedeVer = (venta) => organizacion === '*' || (typeof venta.organizacionId === 'string' && venta.organizacionId.trim() === organizacion);

  // La entrada se busca primero sin usar y, si no está, ya usada (para avisar cuándo se usó)
  const ventas = d.db.collection('ventas');
  let encontrada = (await ventas.where('entradas', 'array-contains', { codigo, usado: false }).limit(1).get()).docs[0];
  if (!encontrada) encontrada = (await ventas.where('entradas', 'array-contains', { codigo, usado: true }).limit(1).get()).docs[0];
  if (!encontrada) return error(404, 'NO_EXISTE', 'Esta entrada no existe. Puede ser falsa: no la dejes pasar.');

  return d.db.runTransaction(async (tx) => {
    const snap = await tx.get(encontrada.ref);
    const venta = snap.exists ? snap.data() || {} : {};
    // Ventas viejas sin organizacionId (anteriores a que se guardara): se toma la del evento
    if (!(typeof venta.organizacionId === 'string' && venta.organizacionId.trim()) && typeof venta.eventoId === 'string' && ID_VALIDO.test(venta.eventoId)) {
      const evento = await tx.get(d.db.collection('eventos').doc(venta.eventoId));
      if (evento.exists) venta.organizacionId = (evento.data() || {}).organizacionId || '';
    }
    // De otra organización: no se dice nada de la compra
    if (!puedeVer(venta)) return error(403, 'OTRA_ORGANIZACION', 'Esta entrada es de un evento de otra organización: no corresponde a esta puerta.');
    if (venta.estado !== 'confirmada') return error(409, 'NO_CONFIRMADA', 'Esta compra no está pagada (o fue anulada): no la dejes pasar.');
    const entradas = Array.isArray(venta.entradas) ? venta.entradas : [];
    const indice = entradas.findIndex((e) => e && e.codigo === codigo);
    if (indice === -1) return error(404, 'NO_EXISTE', 'Esta entrada no existe. Puede ser falsa: no la dejes pasar.');
    const datos = {
      evento: venta.eventoNombre || '',
      lote: venta.loteNombre || '',
      comprador: compradorCorto(venta),
      numero: `${indice + 1} de ${entradas.length}`,
    };
    const validaciones = venta.validaciones && typeof venta.validaciones === 'object' ? venta.validaciones : {};
    if (entradas[indice].usado === true) {
      return respuesta(409, { ok: false, error: { codigo: 'YA_USADA', mensaje: 'Esta entrada YA SE USÓ. No la dejes pasar otra vez.' }, ...datos, usadaEn: iso(validaciones[codigo]) });
    }
    // Se marca usada. Las entradas quedan con su forma exacta { codigo, usado } (así se buscan); el momento va aparte.
    const nuevas = entradas.map((e, i) => (i === indice ? { codigo: e.codigo, usado: true } : e));
    tx.update(encontrada.ref, { entradas: nuevas, validaciones: { ...validaciones, [codigo]: d.sello() } });
    return respuesta(200, { ok: true, resultado: 'valida', ...datos });
  });
}

// Punto de entrada de api/validador.js. `accion`: 'enlace' (admin con sesión) o 'validar' (puerta, con la clave)
async function validador(pedido, deps = null) {
  let d;
  try {
    d = deps || dependenciasReales();
  } catch (e) {
    console.error('validador: no se pudo iniciar Firebase', e && (e.code || e.name));
    return error(500, 'CONFIGURACION', 'El servidor no está configurado. Probá de nuevo en unos minutos.');
  }
  try {
    const accion = pedido && pedido.cuerpo && pedido.cuerpo.accion;
    if (accion === 'enlace') return await crearEnlace(pedido, d);
    if (accion === 'validar') return await validarCodigo(pedido, d);
    return error(400, 'ACCION_INVALIDA', 'Pedido no válido.');
  } catch (e) {
    console.error('validador: error inesperado', e && (e.code || e.name));
    return error(500, 'ERROR_INTERNO', 'No se pudo validar por un error del servidor. Probá de nuevo.');
  }
}

module.exports = { validador, armarClave, leerClave, compradorCorto, DIAS_DE_VALIDEZ };
