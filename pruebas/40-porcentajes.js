// Prueba de shared/porcentajes.js (pedido 17): los porcentajes de Resumen y Reportes.
// Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const fuente = fs.readFileSync(path.join(__dirname, '..', 'shared', 'porcentajes.js'), 'utf8');
const P = vm.runInNewContext(fuente.replace(/^export /gm, '') + '\n;({ porcentaje, repartoPorcentual, porcentajesDelEvento })');
const json = (x) => JSON.stringify(x);

verificar('P1 porcentaje con un decimal', P.porcentaje(1, 3) === 33.3 && P.porcentaje(2, 3) === 66.7 && P.porcentaje(5, 5) === 100);
verificar('P2 sin total da 0 (no divide por cero)', P.porcentaje(3, 0) === 0 && P.porcentaje(3, undefined) === 0 && P.porcentaje('x', 10) === 0);
const reparto = P.repartoPorcentual([{ etiqueta: 'B', valor: 1 }, { etiqueta: 'A', valor: 3 }, { etiqueta: 'Cero', valor: 0 }, null]);
verificar('P3 reparto ordenado de mayor a menor, sin ceros', json(reparto.map((i) => [i.etiqueta, i.porcentaje])) === json([['A', 75], ['B', 25]]), json(reparto));

const evento = { lotes: [{ nombre: 'Preventa', disponibles: 10 }, { nombre: 'General', disponibles: 10 }] };
const ventas = [
  { estado: 'confirmada', cantidad: 2, loteNombre: 'Preventa', subtotal: 200, monto_total: 220, metodo_pago: 'credit_card' },
  { estado: 'confirmada', cantidad: 3, loteNombre: 'General', monto_total: 600, metodo_pago: 'account_money' },
  { estado: 'confirmada', cantidad: 1, loteNombre: 'General', monto_total: NaN, metodo_pago: 'credit_card' },
  { estado: 'pendiente', cantidad: 4, loteNombre: 'General', monto_total: 800 },
  { estado: 'rechazada', cantidad: 1, loteNombre: 'Preventa', monto_total: 100 },
];
const d = P.porcentajesDelEvento([evento], ventas, { claveDe: (m) => (m === 'credit_card' ? 'credito' : 'otro'), nombreDe: (c) => c.toUpperCase(), dinero: (n) => `$${n}` });
verificar('O1 ocupación: 6 confirmadas de 20 = 30%', d.ocupacion.porcentaje === 30 && d.ocupacion.vendidas === 6 && d.ocupacion.capacidad === 20, json(d.ocupacion));
verificar('O2 estados cuentan todas las compras (3 de 5 confirmadas = 60%)', json(d.estados.map((e) => [e.etiqueta, e.porcentaje])) === json([['Confirmadas', 60], ['Pendientes de pago', 20], ['Rechazadas o vencidas', 20]]), json(d.estados));
verificar('O3 entradas por lote solo con confirmadas', json(d.lotes.map((e) => [e.etiqueta, e.valor, e.porcentaje])) === json([['General', 4, 66.7], ['Preventa', 2, 33.3]]), json(d.lotes));
verificar('O4 recaudación usa el subtotal (sin costo de servicio) y un monto roto cuenta 0', json(d.recaudacion.map((e) => [e.etiqueta, e.valor, e.detalle])) === json([['General', 600, '$600'], ['Preventa', 200, '$200']]), json(d.recaudacion));
verificar('O5 formas de pago agrupadas y con nombre', json(d.metodos.map((e) => [e.etiqueta, e.porcentaje])) === json([['CREDITO', 66.7], ['OTRO', 33.3]]), json(d.metodos));
const vacio = P.porcentajesDelEvento([], []);
verificar('O6 sin datos: todo vacío y 0%', vacio.ocupacion.porcentaje === 0 && vacio.estados.length === 0 && vacio.lotes.length === 0 && vacio.hayVentas === false);
verificar('M1 el dibujo no usa innerHTML', !/innerHTML|insertAdjacentHTML/.test(fuente.replace(/\/\/.*$/gm, '')));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
