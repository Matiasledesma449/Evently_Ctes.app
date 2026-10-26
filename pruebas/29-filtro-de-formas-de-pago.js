// Prueba del filtro de formas de pago del panel (cambio organizaciones-y-correcciones-del-panel):
// claveDeFormaDePago y opcionesDeFiltroDePago de shared/formas-de-pago.js, y filtrarVentas de shared/ventas-utils.js.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// Los dos son modulos del navegador: se les quitan los "export" para cargarlos aca
const cargar = (archivo, nombres) => vm.runInNewContext(
  fs.readFileSync(path.join(RAIZ, 'shared', archivo), 'utf8').replace(/^export /gm, '') + `\n;({ ${nombres} })`);
const F = cargar('formas-de-pago.js', 'claveDeFormaDePago, opcionesDeFiltroDePago');
const U = cargar('ventas-utils.js', 'filtrarVentas, resumenDeVentas');
const json = (x) => JSON.stringify(Array.from(x));

verificar('P1 "Dinero en cuenta" cuenta como Transferencia', F.claveDeFormaDePago('Dinero en cuenta') === 'Transferencia' && F.claveDeFormaDePago(' Dinero en cuenta ') === 'Transferencia');
verificar('P2 Débito y Crédito quedan igual', F.claveDeFormaDePago('Débito') === 'Débito' && F.claveDeFormaDePago('Crédito') === 'Crédito');
verificar('P3 Efectivo, Prepaga y nombres raros van a Otros', ['Efectivo', 'Prepaga', 'Mixto'].every((x) => F.claveDeFormaDePago(x) === 'Otros'));
verificar('P3b sin forma de pago (venta pendiente) no tiene clave', ['', '  ', null, undefined, 3].every((x) => F.claveDeFormaDePago(x) === ''));

verificar('P4 sin ventas el filtro ofrece igual las tres formas', json(F.opcionesDeFiltroDePago([])) === json(['todos', 'Transferencia', 'Débito', 'Crédito']) && json(F.opcionesDeFiltroDePago(null)) === json(['todos', 'Transferencia', 'Débito', 'Crédito']));
const ventas = [
  { id: 1, estado: 'confirmada', metodo_pago: 'Dinero en cuenta', monto_total: 10, cantidad: 1 },
  { id: 2, estado: 'confirmada', metodo_pago: 'Transferencia', monto_total: 20, cantidad: 1 },
  { id: 3, estado: 'confirmada', metodo_pago: 'Crédito', monto_total: 30, cantidad: 2 },
  { id: 4, estado: 'pendiente', monto_total: 40, cantidad: 1 },
];
verificar('P5 sin ventas de otro método no aparece "Otros"', !Array.from(F.opcionesDeFiltroDePago(ventas)).includes('Otros'));
const conViejas = ventas.concat([{ id: 5, estado: 'confirmada', metodo_pago: 'Efectivo', monto_total: 50, cantidad: 1 }]);
const opciones = Array.from(F.opcionesDeFiltroDePago(conViejas));
verificar('P6 con una venta vieja en efectivo aparece "Otros" y no "Efectivo"', opciones.includes('Otros') && !opciones.includes('Efectivo'), json(opciones));

const filtrar = (lista, metodo) => Array.from(U.filtrarVentas(lista, 'todos', metodo, F.claveDeFormaDePago)).map((v) => v.id).join(',');
verificar('P7 filtrar por Transferencia junta "Dinero en cuenta" y "Transferencia"', filtrar(conViejas, 'Transferencia') === '1,2');
verificar('P8 filtrar por Otros trae solo la de efectivo', filtrar(conViejas, 'Otros') === '5');
verificar('P9 filtrar por Débito sin ventas de débito da vacío', filtrar(conViejas, 'Débito') === '');
verificar('P10 "todos" no filtra', filtrar(conViejas, 'todos') === '1,2,3,4,5');
verificar('P11 sin claveDe se sigue comparando el texto guardado', Array.from(U.filtrarVentas(conViejas, 'todos', 'Dinero en cuenta')).map((v) => v.id).join(',') === '1');
const total = (l) => U.resumenDeVentas(l).recaudado;
verificar('P12 los totales no cambian: la suma de cada forma es igual al total',
  ['Transferencia', 'Débito', 'Crédito', 'Otros'].reduce((s, m) => s + total(U.filtrarVentas(conViejas, 'todos', m, F.claveDeFormaDePago)), 0) === total(conViejas));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
