// Prueba de los dos ajustes: venta marcada para revision (monto/moneda) y pago duplicado marcado con reembolso pendiente.
const crypto = require('crypto');
const REPO = require('path').join(__dirname, '..');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
process.env.MP_WEBHOOK_SECRET = 'secreto-de-ejemplo-no-real';
process.env.MP_ACCESS_TOKEN = 'TOKEN-DE-EJEMPLO-NO-REAL';
const { procesarAviso } = require(REPO + '/server/webhook');

const aviso = (pagoId) => {
  const req = 'r-' + pagoId, ts = '1700000000';
  const v1 = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update('id:' + pagoId + ';request-id:' + req + ';ts:' + ts + ';').digest('hex');
  return { query: { 'data.id': String(pagoId), type: 'payment' }, headers: { 'x-signature': 'ts=' + ts + ',v1=' + v1, 'x-request-id': req } };
};
const mpFalso = (pagos) => async (url) => {
  const p = pagos[url.split('/').pop()];
  return { ok: !!p, status: p ? 200 : 404, json: async () => p || {} };
};
const pagoDe = (id, ventaId, monto, extra = {}) => ({ id, status: 'approved', external_reference: ventaId, currency_id: 'ARS', transaction_amount: monto, payment_type_id: 'credit_card', ...extra });
const evento = () => ({ nombre: 'Fiesta', lotes: [{ nombre: 'General', precio: 5000, disponibles: 10, vendidas: 0 }] });
const venta = (extra = {}) => ({ estado: 'pendiente', motivo: null, eventoId: 'Evt1', loteIndex: 0, loteNombre: 'General', cantidad: 2, monto_total: 10000, moneda: 'ARS', entradas: [], ...extra });
const silencio = () => {};

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

(async () => {
  // ---------- Ajuste 1: marcar para revision cuando el dinero no coincide ----------
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    const deps = { db, fetchFn: mpFalso({ 1: pagoDe(1, 'V1', 1) }), registrar: silencio };
    const r = await procesarAviso(aviso(1), deps);
    const v = datos.ventas.V1;
    verificar('R1 monto distinto: responde 200 y marca la venta para revision con su motivo', r.status === 200 && v.requiereRevision === true && v.motivoRevision === 'monto_distinto', JSON.stringify(r.cuerpo));
    verificar('R2 NO cambia el estado, ni crea entradas, ni toca el stock', v.estado === 'pendiente' && v.entradas.length === 0 && datos.eventos.Evt1.lotes[0].vendidas === 0);
    const antes = estado.escrituras;
    await procesarAviso(aviso(1), deps);
    verificar('R3 el mismo aviso repetido no vuelve a escribir', estado.escrituras === antes);
  }
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    await procesarAviso(aviso(2), { db, fetchFn: mpFalso({ 2: pagoDe(2, 'V1', 10000, { currency_id: 'USD' }) }), registrar: silencio });
    verificar('R4 moneda distinta: tambien queda marcada para revision', datos.ventas.V1.requiereRevision === true && datos.ventas.V1.motivoRevision === 'moneda_distinta');
  }
  {
    // Venta inexistente / referencia de otra venta: no hay venta que marcar, no se escribe nada
    const { db, estado } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    await procesarAviso(aviso(3), { db, fetchFn: mpFalso({ 3: pagoDe(3, 'NoExiste1', 10000) }), registrar: silencio });
    await procesarAviso(aviso(4), { db, fetchFn: mpFalso({ 4: pagoDe(4, 'ventas/V1', 10000) }), registrar: silencio });
    verificar('R5 venta inexistente o referencia invalida: no se escribe nada', estado.escrituras === 0);
  }
  {
    // Una venta confirmada tampoco cambia de estado por un pago con otro monto: solo se marca
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta({ estado: 'confirmada', mpPaymentId: '9', entradas: [{ codigo: 'ENT-a', usado: false }] }) } });
    await procesarAviso(aviso(5), { db, fetchFn: mpFalso({ 5: pagoDe(5, 'V1', 77) }), registrar: silencio });
    verificar('R6 venta confirmada con un pago de otro monto: sigue confirmada, con sus entradas, y queda marcada', datos.ventas.V1.estado === 'confirmada' && datos.ventas.V1.entradas.length === 1 && datos.ventas.V1.requiereRevision === true);
  }

  // ---------- Ajuste 2: pago duplicado ----------
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    const pagos = { 10: pagoDe(10, 'V1', 10000), 11: pagoDe(11, 'V1', 10000), 12: pagoDe(12, 'V1', 10000) };
    const deps = { db, fetchFn: mpFalso(pagos), registrar: silencio };
    await procesarAviso(aviso(10), deps);
    const v0 = structuredClone(datos.ventas.V1);
    verificar('D1 con el primer pago la venta no pide reembolso', v0.estado === 'confirmada' && v0.requiereReembolso === false && !v0.pagosDuplicados);

    const r = await procesarAviso(aviso(11), deps);
    const v = datos.ventas.V1;
    verificar('D2 un segundo pago aprobado: la venta pide reembolso por pago duplicado y anota el pago repetido',
      r.status === 200 && v.requiereReembolso === true && v.motivoReembolso === 'pago_duplicado' && JSON.stringify(v.pagosDuplicados) === '["11"]', JSON.stringify(v));
    verificar('D3 sigue confirmada, mismas entradas, mismo pago original y el stock no se descuenta otra vez',
      v.estado === 'confirmada' && JSON.stringify(v.entradas) === JSON.stringify(v0.entradas) && v.mpPaymentId === '10' && datos.eventos.Evt1.lotes[0].vendidas === 2);

    const antes = estado.escrituras;
    await procesarAviso(aviso(11), deps);
    verificar('D4 el aviso del mismo pago repetido no vuelve a escribir ni duplica el registro', estado.escrituras === antes && datos.ventas.V1.pagosDuplicados.length === 1);

    await procesarAviso(aviso(12), deps);
    verificar('D5 un tercer pago se suma a la lista', JSON.stringify(datos.ventas.V1.pagosDuplicados) === '["11","12"]');

    const antes2 = estado.escrituras;
    await procesarAviso(aviso(10), deps);
    verificar('D6 el aviso repetido del pago ORIGINAL no se toma como duplicado', estado.escrituras === antes2 && datos.ventas.V1.pagosDuplicados.length === 2);
  }

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
