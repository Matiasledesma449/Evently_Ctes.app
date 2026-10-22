// Prueba de 4.4 (confirmar en una transaccion) y de los casos de 4.5 aplicados de punta a punta.
// Usa una base de datos falsa en memoria; no toca Firestore ni la red.
const REPO = require('path').join(__dirname, '..');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
const { aplicarPago, generarEntradas, nombreMetodoPago } = require(REPO + '/server/confirmacion');

const evento = () => ({
  nombre: 'Fiesta de Prueba', estado: 'publicado', organizador: 'org1',
  lotes: [
    { nombre: 'General', precio: 5000, disponibles: 100, vendidas: 10 },
    { nombre: 'VIP', precio: 9000, disponibles: 5, vendidas: 0 },
    { nombre: 'Ultima', precio: 7000, disponibles: 1, vendidas: 0 },
  ],
});
const venta = (extra = {}) => ({
  estado: 'pendiente', motivo: null, eventoId: 'Evt1', loteIndex: 0, loteNombre: 'General',
  cantidad: 3, monto_total: 15000, moneda: 'ARS', nombre: 'Ana', apellido: 'Prueba', correo: 'ana@example.com',
  entradas: [], ...extra,
});
const pago = (extra = {}) => ({ id: 555, status: 'approved', payment_type_id: 'credit_card', ...extra });

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

(async () => {
  // ---------- A. Pago aprobado: todo junto ----------
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    const r = await aplicarPago(db, 'V1', pago());
    const v = datos.ventas.V1, ev = datos.eventos.Evt1;
    verificar('A1 resultado "confirmada"', r.resultado === 'confirmada', JSON.stringify(r));
    verificar('A2 la venta queda confirmada, sin motivo ni reembolso', v.estado === 'confirmada' && v.motivo === null && v.requiereReembolso === false);
    verificar('A3 tantas entradas como cantidad (3)', v.entradas.length === 3);
    verificar('A4 cada entrada es exactamente { codigo, usado:false } (compatible con validador.html)',
      v.entradas.every((e) => Object.keys(e).sort().join() === 'codigo,usado' && e.usado === false && typeof e.codigo === 'string'));
    verificar('A5 los codigos son distintos entre si', new Set(v.entradas.map((e) => e.codigo)).size === 3);
    verificar('A6 codigos con prefijo ENT- y 24 caracteres aleatorios', v.entradas.every((e) => /^ENT-[0-9a-f]{24}$/.test(e.codigo)));
    verificar('A7 metodo de pago real "Crédito"', v.metodo_pago === 'Crédito', v.metodo_pago);
    verificar('A8 guarda el id del pago (mpPaymentId)', v.mpPaymentId === '555');
    verificar('A9 el lote sube las vendidas (10 -> 13)', ev.lotes[0].vendidas === 13, String(ev.lotes[0].vendidas));
    verificar('A10 los otros lotes y los demas campos del lote/evento no se tocan',
      ev.lotes[1].vendidas === 0 && ev.lotes[2].vendidas === 0 && ev.lotes[0].precio === 5000 && ev.lotes[0].disponibles === 100 &&
      ev.nombre === 'Fiesta de Prueba' && ev.organizador === 'org1' && ev.lotes.length === 3);
    verificar('A11 conserva los datos del comprador', v.nombre === 'Ana' && v.correo === 'ana@example.com' && v.monto_total === 15000);
    verificar('A12 una sola transaccion', estado.transacciones === 1);
  }

  // ---------- B. Nombres de metodo de pago ----------
  verificar('B1 debit_card -> Débito', nombreMetodoPago({ payment_type_id: 'debit_card' }) === 'Débito');
  verificar('B2 prepaid_card -> Prepaga', nombreMetodoPago({ payment_type_id: 'prepaid_card' }) === 'Prepaga');
  verificar('B3 account_money -> Dinero en cuenta', nombreMetodoPago({ payment_type_id: 'account_money' }) === 'Dinero en cuenta');
  verificar('B4 tipo desconocido -> Otro', nombreMetodoPago({ payment_type_id: 'bank_transfer' }) === 'Otro' && nombreMetodoPago({}) === 'Otro');

  // ---------- C. Codigos ----------
  {
    const e10 = generarEntradas(10);
    verificar('C1 diez entradas con codigos distintos', new Set(e10.map((e) => e.codigo)).size === 10);
    // Si el generador repitiera un valor, se vuelve a pedir otro hasta completar
    let n = 0;
    const repetido = () => Buffer.from(n++ < 3 ? '0'.repeat(24) : String(n).padStart(24, '1'), 'hex');
    const e3 = generarEntradas(3, repetido);
    verificar('C2 si el azar repite un codigo, igual salen distintos', new Set(e3.map((e) => e.codigo)).size === 3 && e3.length === 3);
  }

  // ---------- D/E/F/G. Otros estados del pago ----------
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    const r = await aplicarPago(db, 'V1', pago({ status: 'pending' }));
    verificar('D pago pendiente: la venta sigue pendiente, sin entradas, sin stock descontado',
      r.resultado === 'sin_cambio' && datos.ventas.V1.estado === 'pendiente' && datos.ventas.V1.entradas.length === 0 && datos.eventos.Evt1.lotes[0].vendidas === 10);
  }
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta() } });
    const r = await aplicarPago(db, 'V1', pago({ status: 'rejected', status_detail: 'cc_rejected_insufficient_amount' }));
    const v = datos.ventas.V1;
    verificar('E1 pago rechazado: venta rechazada con motivo y detalle', r.resultado === 'rechazada' && v.estado === 'rechazada' && v.motivo === 'pago_rechazado' && v.motivoDetalle === 'cc_rejected_insufficient_amount');
    verificar('E2 el stock no cambia y no hay entradas', datos.eventos.Evt1.lotes[0].vendidas === 10 && v.entradas.length === 0 && v.requiereReembolso === false);
    // F. Reintento aprobado despues del rechazo
    const r2 = await aplicarPago(db, 'V1', pago({ id: 556 }));
    verificar('F reintento aprobado: la rechazada pasa a confirmada con entradas y stock', r2.resultado === 'confirmada' && datos.ventas.V1.estado === 'confirmada' && datos.ventas.V1.entradas.length === 3 && datos.eventos.Evt1.lotes[0].vendidas === 13 && datos.ventas.V1.motivo === null && datos.ventas.V1.motivoDetalle === null);
    // G. Un rechazo tardio no la baja
    const r3 = await aplicarPago(db, 'V1', pago({ id: 557, status: 'rejected' }));
    verificar('G aviso tardio de rechazo: la confirmada sigue confirmada', r3.resultado === 'sin_cambio' && datos.ventas.V1.estado === 'confirmada' && datos.ventas.V1.entradas.length === 3);
  }

  // ---------- H. Sin stock ----------
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta({ loteIndex: 1, loteNombre: 'VIP', cantidad: 6 }) } });
    const r = await aplicarPago(db, 'V1', pago());
    const v = datos.ventas.V1;
    verificar('H1 pago aprobado sin stock: rechazada con motivo sin_stock y reembolso pendiente', r.resultado === 'rechazada' && v.estado === 'rechazada' && v.motivo === 'sin_stock' && v.requiereReembolso === true);
    verificar('H2 no se emiten entradas y el lote no vende de mas', v.entradas.length === 0 && datos.eventos.Evt1.lotes[1].vendidas === 0);
    const r2 = await aplicarPago(db, 'V1', pago());
    verificar('H3 el mismo aviso repetido no cambia nada', r2.resultado === 'sin_cambio');
  }

  // ---------- I. La ultima entrada ----------
  {
    const mismoLote = { loteIndex: 2, loteNombre: 'Ultima', cantidad: 1 };
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V2: venta(mismoLote), V3: venta(mismoLote) } });
    const r2 = await aplicarPago(db, 'V2', pago({ id: 601 }));
    const r3 = await aplicarPago(db, 'V3', pago({ id: 602 }));
    verificar('I1 dos pagan la ultima entrada: la primera se confirma', r2.resultado === 'confirmada' && datos.ventas.V2.estado === 'confirmada');
    verificar('I2 la segunda queda rechazada sin_stock con reembolso pendiente', r3.resultado === 'rechazada' && datos.ventas.V3.motivo === 'sin_stock' && datos.ventas.V3.requiereReembolso === true);
    verificar('I3 el lote no vendio de mas (1 de 1)', datos.eventos.Evt1.lotes[2].vendidas === 1);
  }

  // ---------- J/K/L/M. Casos raros ----------
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta({ loteNombre: 'OtroNombre' }) } });
    const r = await aplicarPago(db, 'V1', pago());
    verificar('J lote que ya no coincide: no confirma, rechazada con reembolso pendiente', r.resultado === 'rechazada' && datos.ventas.V1.motivo === 'lote_inconsistente' && datos.ventas.V1.requiereReembolso === true && datos.eventos.Evt1.lotes[0].vendidas === 10);
  }
  {
    // Un lote sin nombre: crear-pago guarda '' en la venta y el lote no tiene el campo. Debe confirmar igual.
    const ev = evento(); delete ev.lotes[0].nombre;
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: ev }, ventas: { V1: venta({ loteNombre: '' }) } });
    const r = await aplicarPago(db, 'V1', pago());
    verificar('J2 lote sin nombre (venta con nombre vacio): confirma igual', r.resultado === 'confirmada' && datos.eventos.Evt1.lotes[0].vendidas === 13, JSON.stringify(r));
  }
  {
    const { db, datos } = crearDbFalsa({ eventos: {}, ventas: { V1: venta() } });
    const r = await aplicarPago(db, 'V1', pago());
    verificar('K evento borrado: no confirma, rechazada con reembolso pendiente', r.resultado === 'rechazada' && datos.ventas.V1.motivo === 'evento_inexistente' && datos.ventas.V1.requiereReembolso === true);
  }
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento() }, ventas: { V1: venta({ estado: 'confirmada', mpPaymentId: '555', entradas: [{ codigo: 'ENT-x', usado: false }] }) } });
    const r = await aplicarPago(db, 'V1', pago({ id: 999 }));
    verificar('L otro pago aprobado en una venta ya confirmada: sin cambios y se avisa del duplicado', r.resultado === 'sin_cambio' && r.pagoDuplicado === true && datos.ventas.V1.mpPaymentId === '555' && datos.eventos.Evt1.lotes[0].vendidas === 10);
    const r2 = await aplicarPago(db, 'V1', pago({ id: 555 }));
    verificar('L2 el mismo pago otra vez: sin cambios y sin aviso de duplicado', r2.resultado === 'sin_cambio' && !r2.pagoDuplicado);
  }
  {
    const { db, estado } = crearDbFalsa({ eventos: {}, ventas: {} });
    const r = await aplicarPago(db, 'NoExiste', pago());
    verificar('M venta inexistente: no escribe nada', r.resultado === 'venta_inexistente' && estado.escrituras === 0);
  }

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
