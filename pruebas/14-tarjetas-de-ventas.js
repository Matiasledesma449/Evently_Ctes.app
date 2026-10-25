// Prueba de las tarjetas de resumen de la pantalla Ventas (cambio ventas-tarjetas-por-filtro).
// Funciones puras de shared/ventas-utils.js: sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// shared/ventas-utils.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'ventas-utils.js'), 'utf8').replace(/^export /gm, '');
const U = vm.runInNewContext(codigo + '\n;({ filtrarVentas, metodosDePago, tiempoDesde, tarjetasDelFiltro, resumenDeVentas })');

const $ = (n) => '$' + n.toLocaleString();
const AHORA = Date.parse('2026-10-23T12:00:00Z');
const hace = (minutos) => ({ seconds: (AHORA - minutos * 60000) / 1000 }); // fecha de Firestore
const valor = (tarjetas, titulo) => (tarjetas.find((t) => t.titulo === titulo) || {}).valor;
const titulos = (tarjetas) => tarjetas.map((t) => t.titulo);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const conf = (monto, cant = 1, extra = {}) => ({ estado: 'confirmada', monto_total: monto, cantidad: cant, metodo_pago: 'Crédito', ...extra });
const pend = (monto, cant = 1, extra = {}) => ({ estado: 'pendiente', monto_total: monto, cantidad: cant, ...extra });
const rech = (monto, cant = 1, motivo = 'vencida', extra = {}) => ({ estado: 'rechazada', monto_total: monto, cantidad: cant, motivo, ...extra });

// ---------- "Todos" ----------
{
  const ventas = [conf(12), conf(12), conf(12), pend(12), pend(12)];
  const t = U.tarjetasDelFiltro('todos', ventas, AHORA);
  verificar('T1 "Todos": 3 confirmadas de $12 y 2 pendientes -> recaudado $36', valor(t, 'Total recaudado') === $(36), valor(t, 'Total recaudado'));
  verificar('T2 "Todos": 3 entradas vendidas, 3 confirmadas y 2 pendientes de pago',
    valor(t, 'Entradas vendidas') === '3' && valor(t, 'Ventas confirmadas') === '3' && valor(t, 'Pendientes de pago') === '2');
  verificar('T3 "Todos": las 4 tarjetas, en orden', igual(titulos(t), ['Total recaudado', 'Entradas vendidas', 'Ventas confirmadas', 'Pendientes de pago']));
  verificar('T4 el dinero pendiente NO suma a la recaudacion', valor(U.tarjetasDelFiltro('todos', [conf(36), pend(24)], AHORA), 'Total recaudado') === $(36));
  verificar('T5 el dinero rechazado NO suma a la recaudacion', valor(U.tarjetasDelFiltro('todos', [conf(36), rech(24)], AHORA), 'Total recaudado') === $(36));
  verificar('T6 un estado desconocido muestra las tarjetas de "Todos"', igual(titulos(U.tarjetasDelFiltro('algo-raro', ventas, AHORA)), titulos(t)));
  verificar('T7 sin ventas: todo en 0', U.tarjetasDelFiltro('todos', [], AHORA).every((x) => x.valor === '0' || x.valor === $(0)));
}

// ---------- "Confirmadas" ----------
{
  const t = U.tarjetasDelFiltro('confirmada', [conf(10, 1), conf(10, 1), conf(10, 1), conf(18, 3)], AHORA);
  verificar('T8 "Confirmadas": 4 ventas que suman $48 -> promedio $12', valor(t, 'Promedio por venta') === $(12), valor(t, 'Promedio por venta'));
  verificar('T9 "Confirmadas": recaudado $48, 6 entradas, 4 ventas', valor(t, 'Total recaudado') === $(48) && valor(t, 'Entradas vendidas') === '6' && valor(t, 'Ventas confirmadas') === '4');
  verificar('T10 "Confirmadas": las 4 tarjetas, en orden', igual(titulos(t), ['Total recaudado', 'Entradas vendidas', 'Ventas confirmadas', 'Promedio por venta']));
  const vacia = U.tarjetasDelFiltro('confirmada', [], AHORA);
  const decimal = U.tarjetasDelFiltro('confirmada', [conf(12), conf(24), conf(60), conf(12), conf(0, 2)], AHORA);
  verificar('T10b un promedio que no es redondo muestra dos decimales ($21,60 y no $21,6)', valor(decimal, 'Promedio por venta') === '$' + (21.6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), valor(decimal, 'Promedio por venta'));
  verificar('T11 "Confirmadas" sin ventas: promedio "—" y las demas en 0', valor(vacia, 'Promedio por venta') === '—' && valor(vacia, 'Ventas confirmadas') === '0' && valor(vacia, 'Entradas vendidas') === '0');
  const mezcla = U.tarjetasDelFiltro('confirmada', [conf(12), pend(100), rech(100)], AHORA);
  verificar('T12 "Confirmadas" ignora pendientes y rechazadas aunque lleguen en la lista', valor(mezcla, 'Total recaudado') === $(12) && valor(mezcla, 'Ventas confirmadas') === '1');
}

// ---------- "Pendientes" ----------
{
  const t = U.tarjetasDelFiltro('pendiente', [pend(12, 1, { fecha: hace(30) }), pend(12, 2, { fecha: hace(180) })], AHORA);
  verificar('T13 "Pendientes": 2 ventas, 3 entradas en espera, $24 de dinero en espera',
    valor(t, 'Ventas pendientes') === '2' && valor(t, 'Entradas en espera') === '3' && valor(t, 'Dinero en espera') === $(24));
  verificar('T14 "Pendientes": la mas antigua es la de hace 3 horas', valor(t, 'La más antigua') === 'hace 3 h', valor(t, 'La más antigua'));
  verificar('T15 "Pendientes": las 4 tarjetas, en orden y SIN la palabra "recaudado"',
    igual(titulos(t), ['Ventas pendientes', 'Entradas en espera', 'Dinero en espera', 'La más antigua']) && !titulos(t).some((x) => /recaudad/i.test(x)));
  const sinFecha = U.tarjetasDelFiltro('pendiente', [pend(12), pend(12)], AHORA);
  verificar('T16 "Pendientes" sin fechas: "La mas antigua" muestra "—"', valor(sinFecha, 'La más antigua') === '—');
  const conUna = U.tarjetasDelFiltro('pendiente', [pend(12), pend(12, 1, { fecha: hace(5) })], AHORA);
  verificar('T17 "Pendientes": una venta sin fecha se ignora para la antiguedad', valor(conUna, 'La más antigua') === 'hace 5 min', valor(conUna, 'La más antigua'));
  const vacia = U.tarjetasDelFiltro('pendiente', [], AHORA);
  verificar('T18 "Pendientes" sin ventas: 0, 0, $0 y "—"', valor(vacia, 'Ventas pendientes') === '0' && valor(vacia, 'Dinero en espera') === $(0) && valor(vacia, 'La más antigua') === '—');
  verificar('T19 "Pendientes" ignora confirmadas y rechazadas aunque lleguen en la lista', valor(U.tarjetasDelFiltro('pendiente', [conf(12), rech(12), pend(5)], AHORA), 'Ventas pendientes') === '1');
}

// ---------- "Rechazadas" ----------
{
  const t = U.tarjetasDelFiltro('rechazada', [rech(12, 1, 'vencida'), rech(12, 1, 'vencida'), rech(12, 2, 'pago_rechazado')], AHORA);
  verificar('T20 "Rechazadas": 3 ventas, 4 entradas, $36 no cobrados',
    valor(t, 'Ventas rechazadas') === '3' && valor(t, 'Entradas que no se vendieron') === '4' && valor(t, 'Dinero no cobrado') === $(36));
  verificar('T21 "Rechazadas": el motivo mas frecuente es "No se pagó a tiempo"', valor(t, 'Motivo más frecuente') === 'No se pagó a tiempo', valor(t, 'Motivo más frecuente'));
  verificar('T22 "Rechazadas": las 4 tarjetas, en orden', igual(titulos(t), ['Ventas rechazadas', 'Entradas que no se vendieron', 'Dinero no cobrado', 'Motivo más frecuente']));
  const empate = U.tarjetasDelFiltro('rechazada', [rech(1, 1, 'pago_cancelado'), rech(1, 1, 'vencida')], AHORA);
  verificar('T23 con empate de motivos gana el primero que aparece', valor(empate, 'Motivo más frecuente') === 'El pago fue cancelado', valor(empate, 'Motivo más frecuente'));
  const sinMotivo = U.tarjetasDelFiltro('rechazada', [rech(1, 1, null), { estado: 'rechazada', monto_total: 1, cantidad: 1 }], AHORA);
  verificar('T24 "Rechazadas" sin motivos: "—"', valor(sinMotivo, 'Motivo más frecuente') === '—');
  const raro = U.tarjetasDelFiltro('rechazada', [rech(1, 1, 'motivo_inventado')], AHORA);
  verificar('T25 un motivo desconocido no se muestra tal cual', valor(raro, 'Motivo más frecuente') === 'Motivo no especificado', valor(raro, 'Motivo más frecuente'));
  const vacia = U.tarjetasDelFiltro('rechazada', [], AHORA);
  verificar('T26 "Rechazadas" sin ventas: 0, 0, $0 y "—"', valor(vacia, 'Ventas rechazadas') === '0' && valor(vacia, 'Dinero no cobrado') === $(0) && valor(vacia, 'Motivo más frecuente') === '—');
}

// ---------- Colores (tono) ----------
{
  const tono = (estado, titulo) => (U.tarjetasDelFiltro(estado, [conf(1), pend(1), rech(1)], AHORA).find((x) => x.titulo === titulo) || {}).tono;
  verificar('T27 la recaudacion va en violeta ("dinero")', tono('todos', 'Total recaudado') === 'dinero');
  verificar('T28 lo pendiente va en amarillo y lo rechazado en rojo', tono('pendiente', 'Dinero en espera') === 'pendiente' && tono('rechazada', 'Dinero no cobrado') === 'rechazo' && tono('todos', 'Pendientes de pago') === 'pendiente');
}

// ---------- Filtrar por estado y por metodo ----------
{
  const ventas = [conf(12, 1, { metodo_pago: 'Crédito' }), conf(12, 1, { metodo_pago: 'Dinero en cuenta' }), pend(12), rech(12, 1, 'vencida', { metodo_pago: 'Crédito' })];
  verificar('T29 filtrarVentas "todos" y "todos" no saca nada', U.filtrarVentas(ventas, 'todos', 'todos').length === 4);
  verificar('T30 filtrarVentas por estado', U.filtrarVentas(ventas, 'confirmada', 'todos').length === 2 && U.filtrarVentas(ventas, 'pendiente', 'todos').length === 1);
  verificar('T31 filtrarVentas por metodo', U.filtrarVentas(ventas, 'todos', 'Crédito').length === 2);
  verificar('T32 estado y metodo juntos: solo las confirmadas con dinero en cuenta', U.filtrarVentas(ventas, 'confirmada', 'Dinero en cuenta').length === 1);
  verificar('T33 con un metodo elegido no entran las pendientes (no tienen metodo)', U.filtrarVentas(ventas, 'pendiente', 'Crédito').length === 0);
  const m = U.tarjetasDelFiltro('confirmada', U.filtrarVentas(ventas, 'confirmada', 'Dinero en cuenta'), AHORA);
  verificar('T34 las tarjetas se calculan con la misma lista que la tabla', valor(m, 'Ventas confirmadas') === '1' && valor(m, 'Total recaudado') === $(12));
  verificar('T35b un metodo con espacios sobrantes se ofrece y tambien filtra', U.filtrarVentas([conf(1, 1, { metodo_pago: ' Crédito ' })], 'todos', 'Crédito').length === 1 && U.metodosDePago([conf(1, 1, { metodo_pago: ' Crédito ' })])[0] === 'Crédito');
  verificar('T35 filtrarVentas tolera listas nulas y ventas nulas', igual(U.filtrarVentas(null), []) && U.filtrarVentas([null, undefined, conf(1)], 'todos', 'todos').length === 1);
}

// ---------- Metodos que existen en los datos ----------
{
  const ventas = [conf(1, 1, { metodo_pago: 'Crédito' }), conf(1, 1, { metodo_pago: 'Dinero en cuenta' }), conf(1, 1, { metodo_pago: 'Otro' }),
    conf(1, 1, { metodo_pago: 'Crédito' }), conf(1, 1, { metodo_pago: 'Efectivo' }), conf(1, 1, { metodo_pago: 'Transferencia' }), pend(1), conf(1, 1, { metodo_pago: '  ' })];
  const m = U.metodosDePago(ventas);
  verificar('T36 metodosDePago: sin repetir, sin vacios y ordenados', igual(m, ['Crédito', 'Dinero en cuenta', 'Efectivo', 'Otro', 'Transferencia']), JSON.stringify(m));
  verificar('T37 metodosDePago sin ventas: lista vacia', igual(U.metodosDePago([]), []) && igual(U.metodosDePago(null), []));
}

// ---------- tiempoDesde ----------
{
  verificar('T38 menos de un minuto: "hace un momento"', U.tiempoDesde(hace(0.5), AHORA) === 'hace un momento');
  verificar('T39 minutos: "hace 5 min"', U.tiempoDesde(hace(5), AHORA) === 'hace 5 min');
  verificar('T40 horas: "hace 3 h"', U.tiempoDesde(hace(185), AHORA) === 'hace 3 h');
  verificar('T41 un dia y varios dias', U.tiempoDesde(hace(25 * 60), AHORA) === 'hace 1 día' && U.tiempoDesde(hace(72 * 60), AHORA) === 'hace 3 días');
  verificar('T42 acepta Date y numero, ademas de la fecha de Firestore', U.tiempoDesde(new Date(AHORA - 10 * 60000), AHORA) === 'hace 10 min' && U.tiempoDesde(AHORA - 120 * 60000, AHORA) === 'hace 2 h');
  verificar('T43 una fecha futura no da numeros negativos', U.tiempoDesde(hace(-60), AHORA) === 'hace un momento');
  verificar('T44 sin fecha o con fecha invalida: "—"', U.tiempoDesde(null, AHORA) === '—' && U.tiempoDesde(undefined, AHORA) === '—' && U.tiempoDesde({ seconds: 'x' }, AHORA) === '—' && U.tiempoDesde({}, AHORA) === '—');
}

// ---------- Datos viejos o raros ----------
{
  const raras = [conf(NaN), conf('mucho'), conf(undefined), { estado: 'confirmada' }, null, pend('x'), rech(null)];
  const todas = ['todos', 'confirmada', 'pendiente', 'rechazada'].map((e) => U.tarjetasDelFiltro(e, raras, AHORA));
  verificar('T45 ventas con montos raros no producen NaN ni "undefined" en ninguna tarjeta', todas.every((ts) => ts.every((x) => !/NaN|undefined|null/.test(x.valor))));
  verificar('T46 el monto no numerico cuenta como 0', valor(U.tarjetasDelFiltro('confirmada', [conf(NaN), conf(12)], AHORA), 'Total recaudado') === $(12));
  const original = [conf(12), pend(12)];
  const copia = JSON.stringify(original);
  U.tarjetasDelFiltro('todos', original, AHORA); U.filtrarVentas(original, 'confirmada', 'Crédito'); U.metodosDePago(original);
  verificar('T47 las funciones no modifican la lista que reciben', JSON.stringify(original) === copia);
}

if (mal > 0) { console.log('\nFALLARON ' + mal + ' casos.'); process.exit(1); }
console.log('\nTodos los casos pasaron.');
