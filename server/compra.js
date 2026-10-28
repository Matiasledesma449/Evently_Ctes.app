// server/compra.js
// Reglas de la compra: que se puede vender, a que precio y cuantas entradas quedan.
// Todo se calcula con los datos GUARDADOS del evento: nunca con lo que mande el navegador.

const { categoriaDelEvento, calcularCostoServicio } = require('./comision');
const { estadoDeLote, hoyEnArgentina } = require('./lotes');

// Lee el evento en Firestore. Devuelve los datos o null si no existe.
async function leerEvento(db, eventoId) {
  const snap = await db.collection('eventos').doc(eventoId).get();
  return snap.exists ? snap.data() : null;
}

// Lee las categorias de costo de servicio. Si el documento no existe devuelve null (todos 0%).
// Si la lectura falla, el error se propaga: es mejor no vender que vender sin el costo de servicio.
async function leerConfiguracionComision(db) {
  const snap = await db.collection('configuracion').doc('comisiones').get();
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
// `config` es el documento de categorias de costo de servicio (o null: 0%). `hoy` (AAAA-MM-DD) es para las pruebas.
// Devuelve { ok: true, lote, loteIndex, precioUnitario, subtotal, costoServicio, comisionPorcentaje,
//            comisionCategoria, total, disponibles }
// o { ok: false, status, codigo, mensaje }. No escribe nada.
function calcularCompra(evento, pedido, config = null, hoy = null) {
  if (!evento) {
    return error(404, 'EVENTO_NO_ENCONTRADO', 'No encontramos ese evento.');
  }
  if (evento.estado !== 'publicado' || evento.activo === false || evento.eliminado === true) {
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

  // Un lote "por fechas" solo se vende entre sus fechas (salvo que el superadmin lo haya habilitado antes).
  // Solo se revisa al crear el pago: quien ya pagó no queda afuera si el lote termina mientras paga.
  const estadoLote = estadoDeLote(lote, hoy || hoyEnArgentina());
  if (estadoLote === 'proximo') {
    return error(409, 'LOTE_NO_EMPEZO', 'Este lote todavía no está a la venta.');
  }
  if (estadoLote === 'finalizado') {
    return error(409, 'LOTE_TERMINO', 'La venta de este lote ya terminó. Elegí otro.');
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

  const categoria = categoriaDelEvento(evento, config);
  const porcentaje = categoria ? categoria.porcentaje : 0;
  const { subtotal, costoServicio, total } = calcularCostoServicio(precioUnitario * pedido.cantidad, porcentaje);

  return {
    ok: true,
    lote,
    loteIndex: pedido.loteIndex,
    precioUnitario,
    subtotal,
    costoServicio,
    comisionPorcentaje: porcentaje,
    comisionCategoria: categoria ? categoria.nombre : '',
    total,
    disponibles,
  };
}

module.exports = { leerEvento, leerConfiguracionComision, calcularCompra };
