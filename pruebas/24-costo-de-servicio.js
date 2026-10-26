// Prueba del costo de servicio (change costo-de-servicio, tareas 1.x): calculo en el servidor,
// renglon aparte en Mercado Pago y desglose guardado en la venta. Todo simulado: sin red ni base real.
const REPO = require('path').join(__dirname, '..');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
process.env.MP_ACCESS_TOKEN = 'TOKEN-DE-EJEMPLO-NO-REAL';
process.env.SITE_URL = 'https://ejemplo.test';
const { calcularCostoServicio, categoriaDelEvento, normalizarCategorias } = require(REPO + '/server/comision');
const { calcularCompra } = require(REPO + '/server/compra');
const { armarPreferencia } = require(REPO + '/server/mercadopago');
const { crearPago } = require(REPO + '/server/crear-pago');
const { compararPagoConVenta } = require(REPO + '/server/pagos');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const config = { categorias: [
  { id: 'cat-1', nombre: 'Estándar', porcentaje: 8 },
  { id: 'cat-2', nombre: 'Especial', porcentaje: 7.5 },
  { id: 'cat-3', nombre: 'Gratis', porcentaje: 0 },
  { id: 'cat-malo', nombre: 'Roto', porcentaje: 80 },
  { id: 'cat-texto', nombre: 'Texto', porcentaje: 'ocho' },
] };
const eventoBase = (extra = {}) => ({ nombre: 'Fiesta', estado: 'publicado', lotes: [{ nombre: 'General', precio: 1500, disponibles: 50, vendidas: 0 }], ...extra });
const pedido = { eventoId: 'Evt1', loteIndex: 0, loteNombre: 'General', cantidad: 3, nombre: 'Ana', apellido: 'Prueba', correo: 'ana@example.com' };

// ---------- Calculo puro ----------
verificar('8% sobre 4500: costo 360 y total 4860', JSON.stringify(calcularCostoServicio(4500, 8)) === JSON.stringify({ subtotal: 4500, costoServicio: 360, total: 4860 }));
verificar('7,5% sobre 1234: costo 92,55 y total 1326,55', JSON.stringify(calcularCostoServicio(1234, 7.5)) === JSON.stringify({ subtotal: 1234, costoServicio: 92.55, total: 1326.55 }));
verificar('0%: sin costo', calcularCostoServicio(1000, 0).costoServicio === 0 && calcularCostoServicio(1000, 0).total === 1000);
verificar('porcentaje no numerico: sin costo', calcularCostoServicio(1000, 'x').costoServicio === 0);
verificar('porcentaje negativo: sin costo', calcularCostoServicio(1000, -5).costoServicio === 0);

// ---------- Categorias ----------
verificar('categoria del evento: la encuentra', (categoriaDelEvento({ comisionCategoriaId: 'cat-1' }, config) || {}).porcentaje === 8);
verificar('evento sin categoria: null', categoriaDelEvento({}, config) === null);
verificar('categoria que no existe: null', categoriaDelEvento({ comisionCategoriaId: 'cat-9' }, config) === null);
verificar('categoria con porcentaje fuera de rango (80): se descarta', categoriaDelEvento({ comisionCategoriaId: 'cat-malo' }, config) === null);
verificar('categoria con porcentaje de texto: se descarta', categoriaDelEvento({ comisionCategoriaId: 'cat-texto' }, config) === null);
verificar('sin configuracion: null', categoriaDelEvento({ comisionCategoriaId: 'cat-1' }, null) === null);
verificar('configuracion rara no rompe', normalizarCategorias({ categorias: 'x' }).length === 0 && normalizarCategorias(undefined).length === 0 && normalizarCategorias({ categorias: [null, 5, {}] }).length === 0);

// ---------- Compra ----------
const c8 = calcularCompra(eventoBase({ comisionCategoriaId: 'cat-1' }), pedido, config);
verificar('3 entradas de 1500 con 8%: subtotal 4500, costo 360, total 4860',
  c8.ok && c8.subtotal === 4500 && c8.costoServicio === 360 && c8.total === 4860 && c8.comisionPorcentaje === 8 && c8.comisionCategoria === 'Estándar', JSON.stringify(c8));
const c0 = calcularCompra(eventoBase(), pedido, config);
verificar('evento sin categoria: costo 0 y total igual al subtotal', c0.ok && c0.costoServicio === 0 && c0.total === 4500 && c0.comisionPorcentaje === 0);
const cSin = calcularCompra(eventoBase({ comisionCategoriaId: 'cat-1' }), pedido);
verificar('sin configuracion (null): 0%', cSin.ok && cSin.costoServicio === 0 && cSin.total === 4500);
verificar('el pedido del navegador con "comision"/"porcentaje" se ignora', (() => {
  const r = calcularCompra(eventoBase({ comisionCategoriaId: 'cat-1' }), { ...pedido, comision: 99, porcentaje: 0, costoServicio: 0 }, config);
  return r.ok && r.costoServicio === 360;
})());

// ---------- Preferencia de Mercado Pago ----------
const pref8 = armarPreferencia({ ventaId: 'V1', token: 't', eventoId: 'Evt1', evento: eventoBase(), pedido, calculo: c8, siteUrl: 'https://ejemplo.test' });
const sumaItems = (p) => Math.round(p.items.reduce((s, i) => s + i.unit_price * i.quantity, 0) * 100) / 100;
verificar('con costo: dos renglones y la suma coincide con el total', pref8.items.length === 2 && pref8.items[1].title === 'Costo de servicio' && pref8.items[1].quantity === 1 && sumaItems(pref8) === c8.total, JSON.stringify(pref8.items));
const pref0 = armarPreferencia({ ventaId: 'V1', token: 't', eventoId: 'Evt1', evento: eventoBase(), pedido, calculo: c0, siteUrl: 'https://ejemplo.test' });
verificar('sin costo: un solo renglon', pref0.items.length === 1 && sumaItems(pref0) === c0.total);
verificar('no restringe las cuotas', !JSON.stringify(pref8).includes('installments'));
verificar('sigue excluyendo el efectivo', JSON.stringify(pref8.payment_methods.excluded_payment_types) === JSON.stringify([{ id: 'ticket' }]));

// ---------- Flujo completo: crearPago ----------
const fetchMp = (llamadas) => async (url, opciones) => {
  llamadas.push(JSON.parse(opciones.body));
  return { ok: true, status: 201, json: async () => ({ id: 'pref-1', init_point: 'https://mp.test/pagar' }) };
};
(async () => {
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: eventoBase({ comisionCategoriaId: 'cat-1' }) }, configuracion: { comisiones: config } });
    const llamadas = [];
    const r = await crearPago({ ...pedido, comision: 99 }, { db, fetchFn: fetchMp(llamadas), registrar: () => {} });
    const ventas = Object.values(datos.ventas || {});
    const v = ventas[0] || {};
    verificar('crearPago con 8%: responde ok y guarda el desglose en la venta',
      r.status === 200 && ventas.length === 1 && v.subtotal === 4500 && v.costo_servicio === 360 && v.comision_porcentaje === 8 && v.comision_categoria === 'Estándar' && v.monto_total === 4860, 'respuesta: ' + JSON.stringify(r) + ' ventas: ' + ventas.length);
    verificar('crearPago con 8%: Mercado Pago recibe dos renglones que suman el total', llamadas.length === 1 && llamadas[0].items.length === 2 && sumaItems(llamadas[0]) === 4860);
    verificar('el pago por el total se acepta', compararPagoConVenta({ external_reference: 'V', currency_id: 'ARS', transaction_amount: 4860 }, 'V', v).ok === true);
    const solo = compararPagoConVenta({ external_reference: 'V', currency_id: 'ARS', transaction_amount: 4500 }, 'V', v);
    verificar('un pago por solo el subtotal NO se acepta (queda para revisar)', solo.ok === false && solo.motivo === 'monto_distinto');
  }
  {
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: eventoBase() } });
    const r = await crearPago(pedido, { db, fetchFn: fetchMp([]), registrar: () => {} });
    const v = Object.values(datos.ventas || {})[0] || {};
    verificar('crearPago sin configuracion guardada: 0% y total igual al subtotal', r.status === 200 && v.costo_servicio === 0 && v.monto_total === 4500 && v.comision_porcentaje === 0);
  }
  {
    const { db, datos, estado } = crearDbFalsa({ eventos: { Evt1: eventoBase({ comisionCategoriaId: 'cat-1' }) }, configuracion: { comisiones: config } });
    // La lectura de "configuracion" falla pero la del evento anda: se simula con una base que falla solo ahi
    const dbQueFalla = {
      ...db,
      collection: (col) => (col === 'configuracion' ? { doc: () => ({ get: async () => { throw new Error('base caida'); } }) } : db.collection(col)),
    };
    const llamadas = [];
    const registros = [];
    const r = await crearPago(pedido, { db: dbQueFalla, fetchFn: fetchMp(llamadas), registrar: (m) => registros.push(m) });
    verificar('si falla la lectura del costo de servicio: error generico, sin venta y sin llamar a Mercado Pago',
      r.status === 500 && r.cuerpo.ok === false && Object.keys(datos.ventas || {}).length === 0 && estado.escrituras === 0 && llamadas.length === 0);
  }
  {
    const { db, datos } = crearDbFalsa({ eventos: {}, configuracion: { comisiones: config } });
    const r = await crearPago(pedido, { db, fetchFn: fetchMp([]), registrar: () => {} });
    verificar('evento inexistente sigue dando 404', r.status === 404 && Object.keys(datos.ventas || {}).length === 0);
  }

  console.log(mal === 0 ? '\nTodo bien.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
