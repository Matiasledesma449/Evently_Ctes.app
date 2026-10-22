// server/venta.js
// Consulta de una compra por parte del comprador. Devuelve { status, cuerpo } y nunca lanza:
// asi la funcion de Vercel (api/venta.js) solo tiene que enviar la respuesta.
// Las dependencias se pueden reemplazar (`deps`) para probar sin red ni base de datos.
// Ver specs/estado-de-venta y design.md, puntos 9 y 10.

const crypto = require('crypto');
const { ConfigError } = require('./config');
const { ID_VENTA_VALIDO } = require('./pagos');
const { leerVenta } = require('./ventas');
const { obtenerDb, FieldValue } = require('./firestore');

// El token de consulta son 24 bytes en hexadecimal (ver nuevoToken en ventas.js)
const TOKEN_VALIDO = /^[0-9a-f]{48}$/;

const MENSAJE_GENERICO = 'No pudimos consultar tu compra. Intentá de nuevo en unos minutos.';

// La MISMA respuesta para "no existe" y "token incorrecto": no se revela si la venta existe.
const NO_ENCONTRADA = () => ({
  status: 404,
  cuerpo: { ok: false, error: { codigo: 'NO_ENCONTRADA', mensaje: 'No encontramos esa compra.' } },
});

// Compara dos textos en tiempo constante (con el mismo largo, que aca siempre es el del token).
function mismoToken(recibido, guardado) {
  const a = Buffer.from(String(recibido), 'utf8');
  const b = Buffer.from(String(guardado), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Firestore devuelve un Timestamp (con toDate()); en pruebas puede venir una Date.
function aFecha(valor) {
  if (valor instanceof Date) return valor;
  if (valor && typeof valor.toDate === 'function') return valor.toDate();
  return null;
}

// Vencimiento "perezoso": si la venta sigue pendiente y ya paso su hora, pasa a rechazada (`vencida`).
// Se hace dentro de una transaccion: si justo en ese momento el aviso de pago la confirmo,
// la transaccion lo ve y no la toca. Devuelve los datos de la venta ya actualizados.
async function vencerSiCorresponde(db, ventaId, venta, ahora) {
  const vence = aFecha(venta.venceEn);
  if (venta.estado !== 'pendiente' || !vence || vence.getTime() > ahora.getTime()) return venta;

  return db.runTransaction(async (tx) => {
    const ref = db.collection('ventas').doc(ventaId);
    const snap = await tx.get(ref);
    if (!snap.exists) return venta;
    const actual = snap.data();
    const venceActual = aFecha(actual.venceEn);
    if (actual.estado !== 'pendiente' || !venceActual || venceActual.getTime() > ahora.getTime()) return actual;

    tx.update(ref, { estado: 'rechazada', motivo: 'vencida', fechaRechazo: FieldValue.serverTimestamp() });
    return { ...actual, estado: 'rechazada', motivo: 'vencida' };
  });
}

// Datos que ve el comprador. Se arman campo por campo (nada de copiar el documento entero),
// asi un campo nuevo en `ventas` nunca se filtra por accidente.
// NO incluye: token, ni identificadores de pago o de preferencia, ni datos del comprador.
function armarRespuesta(ventaId, venta, evento) {
  const confirmada = venta.estado === 'confirmada';
  const respuesta = {
    id: ventaId,
    estado: venta.estado,
    motivo: venta.motivo || null,
    reembolsoPendiente: venta.requiereReembolso === true,
    evento: {
      nombre: venta.eventoNombre || (evento && evento.nombre) || '',
      fecha: (evento && evento.fecha) || null,
      lugar: (evento && evento.lugar) || null,
    },
    lote: venta.loteNombre || '',
    cantidad: venta.cantidad,
    monto: venta.monto_total,
    moneda: venta.moneda || 'ARS',
  };
  // Los codigos de entrada SOLO existen en la respuesta si el pago esta confirmado
  if (confirmada) {
    respuesta.metodoPago = venta.metodo_pago || null;
    respuesta.entradas = (Array.isArray(venta.entradas) ? venta.entradas : [])
      .map((e) => ({ codigo: e.codigo, usado: e.usado === true }));
  }
  return respuesta;
}

// peticion: { id, token } tal como llegan del navegador (pueden ser cualquier cosa)
async function consultarVenta(peticion, deps = {}) {
  const { db: dbInyectada, ahora = new Date(), registrar = console.error } = deps;
  const { id, token } = peticion || {};

  try {
    // Un id o un token con formato raro no puede ser de ninguna venta: misma respuesta, sin tocar la base
    if (typeof id !== 'string' || !ID_VENTA_VALIDO.test(id) || typeof token !== 'string' || !TOKEN_VALIDO.test(token)) {
      return NO_ENCONTRADA();
    }

    const db = dbInyectada || obtenerDb();
    let venta = await leerVenta(db, id);

    // Si la venta no existe se compara igual contra un token de relleno, para que ambos casos tarden lo mismo
    const guardado = venta && typeof venta.tokenConsulta === 'string' ? venta.tokenConsulta : '0'.repeat(48);
    const coincide = mismoToken(token, guardado);
    if (!venta || !coincide) return NO_ENCONTRADA();

    venta = await vencerSiCorresponde(db, id, venta, ahora);

    // Nombre, fecha y lugar del evento: salen del evento guardado
    let evento = null;
    if (typeof venta.eventoId === 'string' && venta.eventoId) {
      const snap = await db.collection('eventos').doc(venta.eventoId).get();
      evento = snap.exists ? snap.data() : null;
    }

    return { status: 200, cuerpo: { ok: true, venta: armarRespuesta(id, venta, evento) } };
  } catch (e) {
    if (e instanceof ConfigError) {
      registrar('[venta] Error de configuracion', { faltantes: e.faltantes });
    } else {
      registrar('[venta] Error inesperado', { error: e && e.name });
    }
    return { status: 500, cuerpo: { ok: false, error: { codigo: 'ERROR_INTERNO', mensaje: MENSAJE_GENERICO } } };
  }
}

module.exports = { consultarVenta, vencerSiCorresponde, armarRespuesta, NO_ENCONTRADA, TOKEN_VALIDO };
