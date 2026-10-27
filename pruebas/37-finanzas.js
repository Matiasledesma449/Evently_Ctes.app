// Prueba de shared/finanzas.js: balance por período y liquidaciones. Sin red ni base de datos.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const codigo = fs.readFileSync(path.join(__dirname, '..', 'shared', 'finanzas.js'), 'utf8').replace(/^export /gm, '');
const F = vm.runInNewContext(codigo + '\n;({ aPagarDeVenta, servicioDeVenta, msDeVenta, periodoDe, ultimosPeriodos, balancePorPeriodo, totales, liquidaciones, ventasEntre })', { Date, Map, Number, Math, String });

const ms = (iso) => new Date(iso).getTime();
const AHORA = ms('2026-10-26T21:00:00-03:00');
const v = (id, eventoId, iso, subtotal, costo, extra = {}) => ({ id, eventoId, estado: 'confirmada', cantidad: 1, subtotal, costo_servicio: costo, monto_total: subtotal + costo, fechaConfirmacion: { seconds: ms(iso) / 1000 }, ...extra });
const ventas = [
  v('a', 'E1', '2026-10-20T12:00:00-03:00', 1000, 150),
  v('b', 'E1', '2026-10-25T23:30:00-03:00', 2000, 300),
  v('c', 'E2', '2026-09-10T12:00:00-03:00', 500, 0),
  v('d', 'E3', '2025-12-31T23:30:00-03:00', 800, 80),
  { id: 'p', eventoId: 'E1', estado: 'pendiente', subtotal: 9999, costo_servicio: 999, fecha: { seconds: AHORA / 1000 } },
  { id: 'viejo', eventoId: 'E2', estado: 'confirmada', cantidad: 2, monto_total: 700, fecha: { seconds: ms('2026-10-21T10:00:00-03:00') / 1000 } },
];

// Montos de cada venta
verificar('M1 a pagar es el subtotal (sin el costo de servicio)', F.aPagarDeVenta(ventas[0]) === 1000 && F.servicioDeVenta(ventas[0]) === 150);
verificar('M2 una venta vieja sin subtotal paga su monto total y no tiene servicio', F.aPagarDeVenta(ventas[5]) === 700 && F.servicioDeVenta(ventas[5]) === 0);
verificar('M3 la fecha es la de confirmación y si no hay, la de creación', F.msDeVenta(ventas[0]) === ms('2026-10-20T12:00:00-03:00') && F.msDeVenta(ventas[5]) === ms('2026-10-21T10:00:00-03:00') && F.msDeVenta({}) === null);

// Períodos (en hora de Argentina)
verificar('P1 una venta del 31/12 a las 23:30 en Argentina es de ese año (no del siguiente)', F.periodoDe(F.msDeVenta(ventas[3]), 'anio').clave === '2025' && F.periodoDe(F.msDeVenta(ventas[3]), 'mes').clave === '2025-12');
verificar('P2 trimestre y semestre', F.periodoDe(ms('2026-10-20T12:00:00-03:00'), 'trimestre').etiqueta === 'T4 2026' && F.periodoDe(ms('2026-05-01T12:00:00-03:00'), 'semestre').etiqueta === '1º sem 2026');
verificar('P3 la semana empieza el lunes', F.periodoDe(ms('2026-10-25T12:00:00-03:00'), 'semana').clave === '2026-10-19' && F.periodoDe(ms('2026-10-26T12:00:00-03:00'), 'semana').clave === '2026-10-26');
const meses = F.ultimosPeriodos('mes', AHORA);
verificar('P4 últimos 12 meses, del más viejo a octubre 2026', meses.length === 12 && meses[11].clave === '2026-10' && meses[0].clave === '2025-11', meses.map((m) => m.clave).join(','));
verificar('P5 cantidad de períodos de cada tipo', F.ultimosPeriodos('semana', AHORA).length === 12 && F.ultimosPeriodos('trimestre', AHORA).length === 8 && F.ultimosPeriodos('semestre', AHORA).length === 6 && F.ultimosPeriodos('anio', AHORA).length === 5);

// Balance
const porMes = F.balancePorPeriodo(ventas, 'mes', AHORA);
const oct = porMes.find((p) => p.clave === '2026-10');
verificar('B1 octubre suma solo confirmadas: 1000 + 2000 + 700 a pagar y 450 de servicio', oct.aPagar === 3700 && oct.servicio === 450 && oct.total === 4150 && oct.ventas === 3 && oct.entradas === 4, JSON.stringify(oct));
verificar('B2 los meses sin ventas aparecen en 0', porMes.filter((p) => p.ventas === 0).length === 9);
verificar('B3 diciembre 2025 tiene la venta de fin de año', porMes.find((p) => p.clave === '2025-12').aPagar === 800);
const porAnio = F.balancePorPeriodo(ventas, 'anio', AHORA);
verificar('B4 por año: 2026 y 2025 separados', porAnio.find((p) => p.clave === '2026').aPagar === 4200 && porAnio.find((p) => p.clave === '2025').aPagar === 800);

// Totales y liquidaciones
const t = F.totales(ventas);
verificar('T1 totales: a pagar 5000, servicio 530, total 5530 (sin la pendiente)', t.aPagar === 5000 && t.servicio === 530 && t.total === 5530 && t.ventas === 5);
const eventos = [{ id: 'E1', nombre: 'Fiesta', organizacionId: 'vali' }, { id: 'E2', nombre: 'Recital', organizacionId: 'vali' }, { id: 'E3', nombre: 'Viejo' }];
const orgs = [{ id: 'vali', nombre: 'Valigroup' }];
const liq = F.liquidaciones(ventas, eventos, orgs);
verificar('L1 Valigroup cobra 4200 (Fiesta 3000 + Recital 1200) y Evently 450', liq[0].nombre === 'Valigroup' && liq[0].aPagar === 4200 && liq[0].servicio === 450 && liq[0].eventos.length === 2 && liq[0].eventos[0].nombre === 'Fiesta' && liq[0].eventos[0].aPagar === 3000);
verificar('L2 un evento sin organización va a "Sin organización"', liq[1].nombre === 'Sin organización' && liq[1].aPagar === 800);
verificar('L3 la suma de las liquidaciones es el total a pagar', liq.reduce((s, o) => s + o.aPagar, 0) === t.aPagar);
verificar('L4 sin datos no falla', F.liquidaciones(null, null, null).length === 0 && F.totales(null).total === 0);

// Rango
const enOct = F.ventasEntre(ventas, ms('2026-10-01T00:00:00-03:00'), null);
verificar('R1 ventas desde el 1/10', enOct.map((x) => x.id).join(',') === 'a,b,p,viejo');

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
