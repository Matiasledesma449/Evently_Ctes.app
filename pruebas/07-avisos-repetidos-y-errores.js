// Prueba de 4.6: avisos repetidos o simultaneos, y errores temporales. Flujo completo: firma -> pago -> venta -> transaccion.
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
// Mercado Pago falso: cada pago apunta a una venta
const mpFalso = (pagos) => async (url) => {
  const id = url.split('/').pop();
  const p = pagos[id];
  return { ok: !!p, status: p ? 200 : 404, json: async () => p || { message: 'not found' } };
};
const pagoDe = (id, ventaId, monto, extra = {}) => ({ id, status: 'approved', external_reference: ventaId, currency_id: 'ARS', transaction_amount: monto, payment_type_id: 'credit_card', ...extra });
const evento = (disponibles) => ({ nombre: 'Fiesta', lotes: [{ nombre: 'General', precio: 5000, disponibles, vendidas: 0 }] });
const venta = (cantidad = 2) => ({ estado: 'pendiente', motivo: null, eventoId: 'Evt1', loteIndex: 0, loteNombre: 'General', cantidad, monto_total: 5000 * cantidad, moneda: 'ARS', entradas: [] });
const silencio = () => {};

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

(async () => {
  // ---------- 1. El mismo aviso dos veces, uno despues del otro ----------
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento(10) }, ventas: { V1: venta(2) } });
    const deps = { db, fetchFn: mpFalso({ 777: pagoDe(777, 'V1', 10000) }), registrar: silencio };
    const r1 = await procesarAviso(aviso(777), deps);
    const codigos1 = datos.ventas.V1.entradas.map((e) => e.codigo).join();
    const r2 = await procesarAviso(aviso(777), deps);
    const r3 = await procesarAviso(aviso(777), deps);
    verificar('1a primer aviso confirma', r1.status === 200 && r1.cuerpo.resultado === 'confirmada', JSON.stringify(r1.cuerpo));
    verificar('1b los avisos repetidos responden 200 y no cambian nada', r2.status === 200 && r2.cuerpo.resultado === 'sin_cambio' && r3.cuerpo.resultado === 'sin_cambio');
    verificar('1c una sola confirmacion: 2 entradas, mismos codigos, stock descontado una vez',
      datos.ventas.V1.entradas.length === 2 && datos.ventas.V1.entradas.map((e) => e.codigo).join() === codigos1 && datos.eventos.Evt1.lotes[0].vendidas === 2);
  }

  // ---------- 2. El mismo aviso dos veces AL MISMO TIEMPO ----------
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: evento(10) }, ventas: { V1: venta(2) } });
    const deps = { db, fetchFn: mpFalso({ 777: pagoDe(777, 'V1', 10000) }), registrar: silencio };
    const [a, b, c] = await Promise.all([procesarAviso(aviso(777), deps), procesarAviso(aviso(777), deps), procesarAviso(aviso(777), deps)]);
    const resultados = [a, b, c].map((r) => r.cuerpo.resultado).sort().join();
    verificar('2a tres avisos simultaneos: uno confirma y los otros no cambian nada', resultados === 'confirmada,sin_cambio,sin_cambio' && [a, b, c].every((r) => r.status === 200), resultados);
    verificar('2b entradas y stock una sola vez (la transaccion se repitio al chocar)',
      datos.ventas.V1.entradas.length === 2 && datos.eventos.Evt1.lotes[0].vendidas === 2 && estado.reintentos >= 1, 'reintentos=' + estado.reintentos);
  }

  // ---------- 3. Dos ventas distintas pagan la ULTIMA entrada al mismo tiempo ----------
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento(1) }, ventas: { VA: venta(1), VB: venta(1) } });
    const deps = { db, fetchFn: mpFalso({ 801: pagoDe(801, 'VA', 5000), 802: pagoDe(802, 'VB', 5000) }), registrar: silencio };
    const rs = await Promise.all([procesarAviso(aviso(801), deps), procesarAviso(aviso(802), deps)]);
    const estados = [datos.ventas.VA.estado, datos.ventas.VB.estado].sort().join();
    verificar('3a una queda confirmada y la otra rechazada', estados === 'confirmada,rechazada' && rs.every((r) => r.status === 200), estados);
    const perdedora = datos.ventas.VA.estado === 'rechazada' ? datos.ventas.VA : datos.ventas.VB;
    verificar('3b la perdedora: sin_stock, reembolso pendiente, sin entradas', perdedora.motivo === 'sin_stock' && perdedora.requiereReembolso === true && perdedora.entradas.length === 0);
    verificar('3c el lote no vendio de mas (1 de 1)', datos.eventos.Evt1.lotes[0].vendidas === 1);
  }

  // ---------- 4. Error temporal de la base de datos al confirmar ----------
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: evento(10) }, ventas: { V1: venta(2) } });
    const deps = { db, fetchFn: mpFalso({ 777: pagoDe(777, 'V1', 10000) }), registrar: silencio };
    estado.fallarAlConfirmar = new Error('la base de datos no responde');
    const r = await procesarAviso(aviso(777), deps);
    verificar('4a error de base de datos: responde 500 para que Mercado Pago reintente', r.status === 500, String(r.status));
    verificar('4b la venta NO queda a medias (sigue pendiente, sin entradas, stock intacto)',
      datos.ventas.V1.estado === 'pendiente' && datos.ventas.V1.entradas.length === 0 && !datos.ventas.V1.mpPaymentId && datos.eventos.Evt1.lotes[0].vendidas === 0 && estado.escrituras === 0);
    verificar('4c el error no filtra detalles internos al cuerpo de la respuesta', !JSON.stringify(r.cuerpo).includes('base de datos'));
    // Mercado Pago reintenta mas tarde y esta vez la base responde
    estado.fallarAlConfirmar = null;
    const r2 = await procesarAviso(aviso(777), deps);
    verificar('4d el reintento posterior confirma normalmente', r2.status === 200 && r2.cuerpo.resultado === 'confirmada' && datos.ventas.V1.entradas.length === 2 && datos.eventos.Evt1.lotes[0].vendidas === 2);
  }

  // ---------- 5. Error al leer dentro de la transaccion ----------
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: evento(10) }, ventas: { V1: venta(2) } });
    const deps = { db, fetchFn: mpFalso({ 777: pagoDe(777, 'V1', 10000) }), registrar: silencio };
    estado.fallarAlLeer = new Error('timeout');
    const r = await procesarAviso(aviso(777), deps);
    verificar('5 base caida al leer: 500 y nada escrito', r.status === 500 && estado.escrituras === 0 && datos.ventas.V1.estado === 'pendiente');
  }

  // ---------- 6. Muchas compras a la vez por pocas entradas: nunca se vende de mas ----------
  {
    const N = 5, STOCK = 2;
    const ventas = {}, pagos = {};
    for (let i = 0; i < N; i++) { ventas['V' + i] = venta(1); pagos[900 + i] = pagoDe(900 + i, 'V' + i, 5000); }
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento(STOCK) }, ventas });
    const deps = { db, fetchFn: mpFalso(pagos), registrar: silencio };
    let pendientes = [...Array(N).keys()].map((i) => 900 + i);
    let rondas = 0;
    for (; rondas < 6 && pendientes.length; rondas++) { // Mercado Pago reintenta los avisos que dieron 500
      const rs = await Promise.all(pendientes.map((id) => procesarAviso(aviso(id), deps)));
      pendientes = pendientes.filter((id, i) => rs[i].status !== 200);
    }
    const confirmadas = Object.values(datos.ventas).filter((v) => v.estado === 'confirmada');
    const rechazadas = Object.values(datos.ventas).filter((v) => v.estado === 'rechazada');
    verificar('6a ' + N + ' compras simultaneas por ' + STOCK + ' entradas: se confirman exactamente ' + STOCK + ' (rondas de reintento: ' + rondas + ')', confirmadas.length === STOCK, 'confirmadas=' + confirmadas.length);
    verificar('6b el resto queda rechazado por sin_stock con reembolso pendiente', rechazadas.length === N - STOCK && rechazadas.every((v) => v.motivo === 'sin_stock' && v.requiereReembolso === true));
    verificar('6c el lote vendio exactamente ' + STOCK + ' (nunca de mas)', datos.eventos.Evt1.lotes[0].vendidas === STOCK, String(datos.eventos.Evt1.lotes[0].vendidas));
    const codigos = confirmadas.flatMap((v) => v.entradas.map((e) => e.codigo));
    verificar('6d todos los codigos emitidos son distintos', new Set(codigos).size === codigos.length && codigos.length === STOCK);
  }

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
