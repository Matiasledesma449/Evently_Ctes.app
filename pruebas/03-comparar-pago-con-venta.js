// Prueba de la tarea 4.3 (comparar el pago con la venta). Funciones puras: sin red ni base de datos.
const REPO = require('path').join(__dirname, '..');
const { compararPagoConVenta, ventaIdDelPago } = require(REPO + '/server/pagos');

const venta = { monto_total: 15000, moneda: 'ARS', estado: 'pendiente' };
const pagoBueno = { external_reference: 'Abc123XyZ', currency_id: 'ARS', transaction_amount: 15000, status: 'approved' };
const con = (cambios) => ({ ...pagoBueno, ...cambios });

const casos = [
  ['pago correcto',                         con({}), 'Abc123XyZ', venta, true],
  ['monto con un centavo de diferencia',    con({ transaction_amount: 15000.01 }), 'Abc123XyZ', venta, true],
  ['monto con decimales de punto flotante', con({ transaction_amount: 0.1 + 0.2 }), 'Abc123XyZ', { monto_total: 0.3 }, true],
  ['monto distinto',                        con({ transaction_amount: 100 }), 'Abc123XyZ', venta, false, 'monto_distinto'],
  ['monto dos centavos de diferencia',      con({ transaction_amount: 15000.02 }), 'Abc123XyZ', venta, false, 'monto_distinto'],
  ['moneda distinta',                       con({ currency_id: 'USD' }), 'Abc123XyZ', venta, false, 'moneda_distinta'],
  ['moneda ausente',                        con({ currency_id: undefined }), 'Abc123XyZ', venta, false, 'moneda_distinta'],
  ['venta inexistente',                     con({}), 'Abc123XyZ', null, false, 'venta_inexistente'],
  ['referencia de otra venta',              con({ external_reference: 'OtraVenta1' }), 'Abc123XyZ', venta, false, 'referencia_distinta'],
  ['sin referencia',                        con({ external_reference: undefined }), 'Abc123XyZ', venta, false, 'referencia_distinta'],
  ['monto del pago ausente',                con({ transaction_amount: undefined }), 'Abc123XyZ', venta, false, 'monto_invalido'],
  ['monto del pago en texto no numerico',   con({ transaction_amount: 'mucho' }), 'Abc123XyZ', venta, false, 'monto_invalido'],
  ['monto del pago nulo (no se toma como 0)', con({ transaction_amount: null }), 'Abc123XyZ', venta, false, 'monto_invalido'],
  ['monto del pago en texto numerico',      con({ transaction_amount: '15000' }), 'Abc123XyZ', venta, false, 'monto_invalido'],
  ['venta sin monto',                       con({}), 'Abc123XyZ', { moneda: 'ARS' }, false, 'monto_invalido'],
  ['venta con monto cero',                  con({ transaction_amount: 0 }), 'Abc123XyZ', { monto_total: 0 }, false, 'monto_invalido'],
  ['pago vacio',                            null, 'Abc123XyZ', venta, false, 'pago_invalido'],
];

let mal = 0;
for (const [nombre, pago, id, v, espera, motivo] of casos) {
  const r = compararPagoConVenta(pago, id, v);
  const bien = r.ok === espera && (espera || r.motivo === motivo);
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + nombre + ' -> ' + JSON.stringify(r));
}

// ventaIdDelPago: solo ids de letras y numeros (nada que se pueda usar como ruta)
const ids = [
  ['id normal', { external_reference: 'Abc123XyZ' }, 'Abc123XyZ'],
  ['con barra (ruta)', { external_reference: 'ventas/otra' }, null],
  ['con punto y barras', { external_reference: '../../x' }, null],
  ['vacio', { external_reference: '' }, null],
  ['numero', { external_reference: 123 }, null],
  ['sin pago', null, null],
];
for (const [nombre, pago, espera] of ids) {
  const r = ventaIdDelPago(pago);
  const bien = r === espera;
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + 'ventaIdDelPago: ' + nombre + ' -> ' + JSON.stringify(r));
}

console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
process.exit(mal ? 1 : 0);
