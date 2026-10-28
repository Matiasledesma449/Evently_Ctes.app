// Prueba de shared/estado-evento.js (pedido 13): suspender, reactivar, eliminar y recuperar eventos.
// Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// Los modulos del navegador se cargan sin sus "export"
const cargar = (archivo, nombres) => vm.runInNewContext(
  fs.readFileSync(path.join(RAIZ, 'shared', archivo), 'utf8').replace(/^export /gm, '') + `\n;({ ${nombres} })`);
const E = cargar('estado-evento.js', 'situacionDelEvento, seVendeEnElSitio, cambiosDeAccion, accionesDeEvento');
const O = cargar('organizaciones.js', 'eventosParaVer');
const { calcularCompra } = require(path.join(RAIZ, 'server', 'compra.js'));
const json = (x) => JSON.stringify(x);
const ids = (l) => Array.from(l).map((e) => e.id).join(',');

verificar('E1 sin marcas: activo', E.situacionDelEvento({ estado: 'publicado' }) === 'activo');
verificar('E2 activo false: suspendido', E.situacionDelEvento({ activo: false }) === 'suspendido');
verificar('E3 eliminado gana a suspendido', E.situacionDelEvento({ activo: false, eliminado: true }) === 'eliminado');
verificar('E4 se vende solo publicado y activo',
  E.seVendeEnElSitio({ estado: 'publicado' }) && !E.seVendeEnElSitio({ estado: 'publicado', activo: false })
  && !E.seVendeEnElSitio({ estado: 'publicado', eliminado: true }) && !E.seVendeEnElSitio({ estado: 'pendiente' }) && !E.seVendeEnElSitio(null));
verificar('E5 eliminar deja sin venta', json(E.cambiosDeAccion('eliminar')) === json({ eliminado: true, activo: false }));
verificar('E6 recuperar vuelve suspendido', json(E.cambiosDeAccion('recuperar')) === json({ eliminado: false, activo: false }));
verificar('E7 activar y suspender', E.cambiosDeAccion('activar').activo === true && E.cambiosDeAccion('suspender').activo === false);
verificar('E8 acción desconocida: null', E.cambiosDeAccion('borrar') === null && E.cambiosDeAccion('toString') === null);
verificar('E9 acciones por situación', json(E.accionesDeEvento({})) === json(['suspender', 'eliminar'])
  && json(E.accionesDeEvento({ activo: false })) === json(['activar', 'eliminar'])
  && json(E.accionesDeEvento({ eliminado: true })) === json(['recuperar']));

// Las listas del panel no muestran eliminados (los suspendidos sí)
const eventos = [{ id: 'A', organizacionId: 'o' }, { id: 'S', organizacionId: 'o', activo: false }, { id: 'X', organizacionId: 'o', eliminado: true, activo: false }];
verificar('E10 superadmin no ve eliminados', ids(O.eventosParaVer({ eventos, rolEfectivo: 'superadmin', rolReal: 'superadmin' })) === 'A,S');
verificar('E11 organización no ve eliminados', ids(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', rolReal: 'organizacion', organizacionId: 'o' })) === 'A,S');
verificar('E12 superadmin con organización elegida no ve eliminados',
  ids(O.eventosParaVer({ eventos, rolEfectivo: 'superadmin', rolReal: 'superadmin', organizacionElegida: 'o' })) === 'A,S');

// El servidor rechaza comprar un evento suspendido o eliminado
const base = { estado: 'publicado', lotes: [{ nombre: 'General', precio: 10, disponibles: 5, vendidas: 0, tipo: 'siempre' }] };
const pedido = { loteIndex: 0, loteNombre: 'General', cantidad: 1 };
verificar('E13 servidor: suspendido no se vende', calcularCompra({ ...base, activo: false }, pedido).codigo === 'EVENTO_NO_DISPONIBLE');
verificar('E14 servidor: eliminado no se vende', calcularCompra({ ...base, eliminado: true }, pedido).codigo === 'EVENTO_NO_DISPONIBLE');
verificar('E15 servidor: activo sí se vende', calcularCompra({ ...base }, pedido).ok === true, json(calcularCompra({ ...base }, pedido)));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
