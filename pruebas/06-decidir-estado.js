// Prueba de 4.5: tabla de casos de la funcion que decide el estado de la venta. Funcion pura.
const REPO = require('path').join(__dirname, '..');
const { decidirTransicion, clasificarPago } = require(REPO + '/server/estados');

const venta = (estado, motivo = null) => ({ estado, motivo });
const pago = (status, status_detail) => ({ status, status_detail });

// [descripcion, entrada, accion esperada, motivo esperado, requiereReembolso esperado]
const casos = [
  // --- pago aprobado ---
  ['pendiente + aprobado + hay stock',                   { venta: venta('pendiente'), pago: pago('approved'), hayStock: true },  'confirmar'],
  ['rechazada(pago_rechazado) + aprobado + hay stock',   { venta: venta('rechazada', 'pago_rechazado'), pago: pago('approved'), hayStock: true }, 'confirmar'],
  ['rechazada(vencida) + aprobado tardio + hay stock',   { venta: venta('rechazada', 'vencida'), pago: pago('approved'), hayStock: true }, 'confirmar'],
  ['pendiente + aprobado + SIN stock',                   { venta: venta('pendiente'), pago: pago('approved'), hayStock: false }, 'rechazar', 'sin_stock', true],
  ['rechazada(vencida) + aprobado + sin stock',          { venta: venta('rechazada', 'vencida'), pago: pago('approved'), hayStock: false }, 'rechazar', 'sin_stock', true],
  ['rechazada(sin_stock) + aprobado repetido + sin stock', { venta: venta('rechazada', 'sin_stock'), pago: pago('approved'), hayStock: false }, 'sin_cambio'],
  ['sin stock por lote inconsistente',                   { venta: venta('pendiente'), pago: pago('approved'), hayStock: false, motivoSinStock: 'lote_inconsistente' }, 'rechazar', 'lote_inconsistente', true],
  // --- pago pendiente o en proceso ---
  ['pendiente + pago pending',                           { venta: venta('pendiente'), pago: pago('pending'), hayStock: true }, 'sin_cambio'],
  ['pendiente + pago in_process',                        { venta: venta('pendiente'), pago: pago('in_process'), hayStock: true }, 'sin_cambio'],
  ['pendiente + pago authorized',                        { venta: venta('pendiente'), pago: pago('authorized'), hayStock: true }, 'sin_cambio'],
  ['rechazada + pago pending',                           { venta: venta('rechazada', 'pago_rechazado'), pago: pago('pending'), hayStock: true }, 'sin_cambio'],
  // --- pago rechazado o cancelado ---
  ['pendiente + rejected',                               { venta: venta('pendiente'), pago: pago('rejected', 'cc_rejected_insufficient_amount'), hayStock: true }, 'rechazar', 'pago_rechazado', false],
  ['pendiente + cancelled',                              { venta: venta('pendiente'), pago: pago('cancelled'), hayStock: true }, 'rechazar', 'pago_cancelado', false],
  ['rechazada + otro rejected (no se pisa el motivo)',   { venta: venta('rechazada', 'vencida'), pago: pago('rejected'), hayStock: true }, 'sin_cambio'],
  // --- confirmada no retrocede ---
  ['confirmada + rejected tardio',                       { venta: venta('confirmada'), pago: pago('rejected'), hayStock: true }, 'sin_cambio'],
  ['confirmada + cancelled',                             { venta: venta('confirmada'), pago: pago('cancelled'), hayStock: true }, 'sin_cambio'],
  ['confirmada + approved repetido',                     { venta: venta('confirmada'), pago: pago('approved'), hayStock: true }, 'sin_cambio'],
  ['confirmada + approved sin stock',                    { venta: venta('confirmada'), pago: pago('approved'), hayStock: false }, 'sin_cambio'],
  ['confirmada + refunded',                              { venta: venta('confirmada'), pago: pago('refunded'), hayStock: true }, 'sin_cambio'],
  // --- casos raros: no se toca nada ---
  ['pendiente + refunded (estado que no manejamos)',     { venta: venta('pendiente'), pago: pago('refunded'), hayStock: true }, 'sin_cambio'],
  ['pendiente + charged_back',                           { venta: venta('pendiente'), pago: pago('charged_back'), hayStock: true }, 'sin_cambio'],
  ['pendiente + estado inventado',                       { venta: venta('pendiente'), pago: pago('xyz'), hayStock: true }, 'sin_cambio'],
  ['venta con estado desconocido + approved',            { venta: venta('anulada'), pago: pago('approved'), hayStock: true }, 'sin_cambio'],
  ['sin argumentos',                                     undefined, 'sin_cambio'],
  ['sin pago',                                           { venta: venta('pendiente'), hayStock: true }, 'sin_sambio_o_cambio'],
];

let mal = 0;
for (const [nombre, entrada, accion, motivo, reembolso] of casos) {
  if (accion === 'sin_sambio_o_cambio') { // pago ausente: debe quedar sin cambio y no romper
    let r; try { r = decidirTransicion(entrada); } catch (e) { r = { accion: 'ROMPIO ' + e.message }; }
    const bien = r.accion === 'sin_cambio'; if (!bien) mal++;
    console.log((bien ? 'OK  ' : 'MAL ') + nombre + ' -> ' + JSON.stringify(r)); continue;
  }
  const r = decidirTransicion(entrada);
  let bien = r.accion === accion;
  if (bien && motivo !== undefined) bien = r.motivo === motivo;
  if (bien && reembolso !== undefined) bien = r.requiereReembolso === reembolso;
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + nombre + ' -> ' + JSON.stringify(r));
}

// El detalle del rechazo se guarda recortado, nunca como valor raro
const largo = decidirTransicion({ venta: venta('pendiente'), pago: pago('rejected', 'x'.repeat(500)), hayStock: true });
const bienLargo = largo.motivoDetalle.length === 100; if (!bienLargo) mal++;
console.log((bienLargo ? 'OK  ' : 'MAL ') + 'detalle de rechazo recortado a 100 caracteres');

console.log(mal === 0 ? '\nTodos los casos dieron lo esperado (' + (casos.length + 1) + ').' : '\nFALLARON ' + mal + ' casos.');
process.exit(mal ? 1 : 0);
