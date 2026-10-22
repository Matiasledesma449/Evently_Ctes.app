// Prueba de 4.3 integrada al flujo del aviso: el pago se compara con la venta y, si no coincide, no se toca nada.
const crypto = require('crypto');
const REPO = require('path').join(__dirname, '..');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
process.env.MP_WEBHOOK_SECRET = 'secreto-de-ejemplo-no-real';
process.env.MP_ACCESS_TOKEN = 'TOKEN-DE-EJEMPLO-NO-REAL';
const { procesarAviso } = require(REPO + '/server/webhook');

const peticion = (id) => {
  const req = 'r-1', ts = '1700000000';
  const v1 = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update('id:' + id + ';request-id:' + req + ';ts:' + ts + ';').digest('hex');
  return { query: { 'data.id': id, type: 'payment' }, headers: { 'x-signature': 'ts=' + ts + ',v1=' + v1, 'x-request-id': req } };
};
const mp = (json, status = 200) => async () => ({ ok: status < 300, status, json: async () => json });
const ventaBase = { estado: 'pendiente', monto_total: 15000, moneda: 'ARS', cantidad: 2, entradas: [], eventoId: 'Evt1', loteIndex: 0, loteNombre: 'General' };

let mal = 0;
const eventoOk = { nombre: 'Fiesta', lotes: [{ nombre: 'General', precio: 7500, disponibles: 50, vendidas: 0 }] };
async function caso(nombre, ventas, pagoMp, esperaResultado, esperaMotivoEnLog, escrituras = 0) {
  const { db, estado } = crearDbFalsa({ ventas, eventos: { Evt1: eventoOk } });
  const logs = [];
  const r = await procesarAviso(peticion('555'), { db, fetchFn: mp(pagoMp), registrar: (m, o) => logs.push(m + ' ' + JSON.stringify(o || {})) });
  // Si el pago coincide se confirma (2 escrituras: venta y evento). Si el dinero no coincide, solo se marca la venta (1).
  // En cualquier otro caso no se escribe nada.
  const sinCambios = estado.escrituras === escrituras;
  const motivoOk = !esperaMotivoEnLog || logs.some((l) => l.includes(esperaMotivoEnLog));
  const bien = r.status === 200 && r.cuerpo.resultado === esperaResultado && sinCambios && motivoOk;
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + nombre + ' -> ' + r.status + ' ' + r.cuerpo.resultado + ' | escrituras: ' + estado.escrituras + (esperaMotivoEnLog ? ' | log: ' + (motivoOk ? 'tiene "' + esperaMotivoEnLog + '"' : 'FALTA "' + esperaMotivoEnLog + '"') : ''));
}

(async () => {
  const pago = { id: 555, status: 'approved', external_reference: 'Venta0001', currency_id: 'ARS', transaction_amount: 15000 };
  await caso('pago que coincide con la venta: se confirma', { Venta0001: ventaBase }, pago, 'confirmada', null, 2);
  await caso('monto distinto: no confirma, registra el motivo y marca la venta para revision', { Venta0001: ventaBase }, { ...pago, transaction_amount: 1 }, 'no_coincide', 'monto_distinto', 1);
  await caso('moneda distinta: no confirma, registra el motivo y marca la venta para revision', { Venta0001: ventaBase }, { ...pago, currency_id: 'USD' }, 'no_coincide', 'moneda_distinta', 1);
  await caso('venta inexistente: no cambia nada', {}, pago, 'venta_inexistente', 'venta_inexistente');
  await caso('referencia a otra venta que no existe', { Venta0001: ventaBase }, { ...pago, external_reference: 'Otra9999' }, 'venta_inexistente', 'venta_inexistente');
  await caso('referencia con caracteres de ruta', { Venta0001: ventaBase }, { ...pago, external_reference: 'ventas/Venta0001' }, 'sin_venta');
  await caso('pago sin referencia', { Venta0001: ventaBase }, { ...pago, external_reference: null }, 'sin_venta');

  // Un fallo al leer la base de datos es temporal: 500 para que Mercado Pago reintente
  const { db, estado } = crearDbFalsa({ ventas: { Venta0001: ventaBase } });
  estado.fallarAlLeer = new Error('base caida');
  const r = await procesarAviso(peticion('555'), { db, fetchFn: mp(pago), registrar: () => {} });
  const bien = r.status === 500 && estado.escrituras === 0;
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + 'base de datos caida al leer la venta -> ' + r.status + ' | escrituras: ' + estado.escrituras);

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
