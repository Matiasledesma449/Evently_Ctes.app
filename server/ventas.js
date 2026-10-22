// server/ventas.js
// Escritura de ventas en Firestore. SOLO el servidor escribe en `ventas`
// (las reglas de Firestore lo prohiben al navegador).

const crypto = require('crypto');
const { MINUTOS_VENCIMIENTO } = require('./config');
const { FieldValue, Timestamp } = require('./firestore');

// Token de consulta: 24 bytes aleatorios = 48 caracteres hexadecimales, imposible de adivinar.
function nuevoToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Crea la venta en estado `pendiente`, sin entradas todavia.
// El precio y el monto vienen del calculo del servidor, nunca del navegador.
// Devuelve { id, token, venceEn } (el id se usa como referencia del pago en Mercado Pago).
async function crearVentaPendiente(db, { eventoId, evento, pedido, calculo, ahora = new Date() }) {
  const ref = db.collection('ventas').doc(); // id automatico
  const token = nuevoToken();
  const venceEn = new Date(ahora.getTime() + MINUTOS_VENCIMIENTO * 60 * 1000);

  await ref.set({
    eventoId,
    eventoNombre: evento.nombre || '',
    loteIndex: pedido.loteIndex,
    loteNombre: calculo.lote.nombre || '',
    cantidad: pedido.cantidad,
    precio_unitario: calculo.precioUnitario,
    monto_total: calculo.total,
    moneda: 'ARS',
    nombre: pedido.nombre,
    apellido: pedido.apellido,
    correo: pedido.correo,
    estado: 'pendiente',
    motivo: null,
    entradas: [],
    tokenConsulta: token,
    venceEn: Timestamp.fromDate(venceEn),
    fecha: FieldValue.serverTimestamp(),
  });

  return { id: ref.id, token, venceEn };
}

// Lee una venta. Devuelve sus datos o null si no existe.
async function leerVenta(db, ventaId) {
  const snap = await db.collection('ventas').doc(ventaId).get();
  return snap.exists ? snap.data() : null;
}

// Guarda el identificador de la preferencia de Mercado Pago en la venta.
async function guardarPreferencia(db, ventaId, preferenceId) {
  await db.collection('ventas').doc(ventaId).update({ mpPreferenceId: preferenceId });
}

// Marca una venta como rechazada con su motivo (por ejemplo `error_mercado_pago`).
async function marcarRechazada(db, ventaId, motivo) {
  await db.collection('ventas').doc(ventaId).update({
    estado: 'rechazada',
    motivo,
    fechaRechazo: FieldValue.serverTimestamp(),
  });
}

module.exports = { nuevoToken, crearVentaPendiente, leerVenta, guardarPreferencia, marcarRechazada };
