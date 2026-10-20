// server/compra.js
// Reglas de la compra: que se puede vender, a que precio y cuantas entradas quedan.
// Todo se calcula con los datos GUARDADOS del evento: nunca con lo que mande el navegador.

// Lee el evento en Firestore. Devuelve los datos o null si no existe.
async function leerEvento(db, eventoId) {
  const snap = await db.collection('eventos').doc(eventoId).get();
  return snap.exists ? snap.data() : null;
}

const aNumero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};
const redondear2 = (n) => Math.round(n * 100) / 100;

function error(status, codigo, mensaje, extra) {
  return { ok: false, status, codigo, mensaje, ...extra };
}

// Calcula la compra a partir del evento guardado y del pedido ya validado.
// Devuelve { ok: true, lote, loteIndex, precioUnitario, total, disponibles }
// o { ok: false, status, codigo, mensaje }. No escribe nada.
function calcularCompra(evento, pedido) {
  if (!evento) {
    return error(404, 'EVENTO_NO_ENCONTRADO', 'No encontramos ese evento.');
  }
  if (evento.estado !== 'publicado' || evento.activo === false) {
    return error(409, 'EVENTO_NO_DISPONIBLE', 'Este evento no está disponible para la venta.');
  }

  const lotes = Array.isArray(evento.lotes) ? evento.lotes : [];
  const lote = lotes[pedido.loteIndex];
  if (!lote || typeof lote !== 'object') {
    return error(404, 'LOTE_INEXISTENTE', 'Ese lote no existe. Volvé a abrir el evento y elegí otro.');
  }
  // Si el navegador dice cual lote eligio, tiene que ser el mismo que hay guardado.
  if (pedido.loteNombre && lote.nombre !== pedido.loteNombre) {
    return error(409, 'LOTE_CAMBIO', 'El lote cambió mientras comprabas. Recargá la página y elegí de nuevo.');
  }

  const precioUnitario = redondear2(aNumero(lote.precio));
  if (precioUnitario <= 0) {
    return error(409, 'LOTE_SIN_PRECIO', 'Este lote no se puede comprar por ahora.');
  }

  // Disponibles = capacidad - vendidas (solo las ya confirmadas). Las pendientes no cuentan.
  const disponibles = Math.max(0, aNumero(lote.disponibles) - aNumero(lote.vendidas));
  if (pedido.cantidad > disponibles) {
    const mensaje = disponibles === 0
      ? 'Este lote está agotado.'
      : `Quedan solo ${disponibles} ${disponibles === 1 ? 'entrada' : 'entradas'} en este lote.`;
    return error(409, 'SIN_STOCK', mensaje, { disponibles });
  }

  return {
    ok: true,
    lote,
    loteIndex: pedido.loteIndex,
    precioUnitario,
    total: redondear2(precioUnitario * pedido.cantidad),
    disponibles,
  };
}

module.exports = { leerEvento, calcularCompra };
