// Prueba del filtro de formas de pago del panel (cambio organizaciones-y-correcciones-del-panel):
// claveDeFormaDePago y opcionesDeFiltroDePago de shared/formas-de-pago.js, y filtrarVentas con esa clave.
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

const sinExport = (a) => fs.readFileSync(path.join(RAIZ, a), 'utf8').replace(/^export /gm, '');
const F = vm.runInNewContext(sinExport('shared/formas-de-pago.js') + '\n;({ claveDeFormaDePago, opcionesDeFiltroDePago })');
const V = vm.runInNewContext(sinExport('shared/ventas-utils.js') + '\n;({ filtrarVentas, resumenDeVentas })');

const igual = (a, b) => JSON.stringify(Array.from(a)) === JSON.stringify(b);
const conf = (metodo, monto = 100) => ({ estado: 'confirmada', cantidad: 1, monto_total: monto, metodo_pago: metodo });

// ---------- La clave de cada venta ----------
verificar('K1 "Dinero en cuenta" cuenta como Transferencia', F.claveDeFormaDePago('Dinero en cuenta') === 'Transferencia' && F.claveDeFormaDePago(' Dinero en cuenta ') === 'Transferencia');
verificar('K2 Transferencia, Débito y Crédito quedan igual', ['Transferencia', 'Débito', 'Crédito'].every((m) => F.claveDeFormaDePago(m) === m));
verificar('K3 Prepaga, Efectivo viejo, vacío y valores raros van a Otros', ['Prepaga', 'Efectivo', '', '  ', 'Mixto', undefined, null, 5, {}].every((m) => F.claveDeFormaDePago(m) === 'Otros'));
verificar('K4 nombres del objeto base no se confunden con una forma', F.claveDeFormaDePago('constructor') === 'Otros' && F.claveDeFormaDePago('toString') === 'Otros');

// ---------- Las opciones del filtro ----------
verificar('F1 sin ventas el filtro ofrece igual las tres formas', igual(F.opcionesDeFiltroDePago([]), ['Transferencia', 'Débito', 'Crédito']) && igual(F.opcionesDeFiltroDePago(null), ['Transferencia', 'Débito', 'Crédito']));
verificar('F2 nunca ofrece Efectivo, ni con ventas viejas de efectivo', !Array.from(F.opcionesDeFiltroDePago([conf('Efectivo')])).some((o) => /efectivo/i.test(o)));
verificar('F3 "Otros" solo aparece si hay ventas de otro método', igual(F.opcionesDeFiltroDePago([conf('Prepaga')]), ['Transferencia', 'Débito', 'Crédito', 'Otros']) && !Array.from(F.opcionesDeFiltroDePago([conf('Crédito'), conf('Dinero en cuenta')])).includes('Otros'));
verificar('F4 las ventas sin método (pendientes) no hacen aparecer "Otros"', !Array.from(F.opcionesDeFiltroDePago([{ estado: 'pendiente' }, { estado: 'pendiente', metodo_pago: '' }, null])).includes('Otros'));
verificar('F5 "Dinero en cuenta" no aparece como opción aparte', !Array.from(F.opcionesDeFiltroDePago([conf('Dinero en cuenta')])).includes('Dinero en cuenta'));

// ---------- filtrarVentas por la clave ----------
const ventas = [conf('Crédito', 10), conf('Dinero en cuenta', 20), conf('Transferencia', 30), conf('Débito', 40), conf('Prepaga', 50), { estado: 'pendiente', monto_total: 60 }];
const montos = (lista) => Array.from(lista).map((v) => v.monto_total);
verificar('G1 filtrar Transferencia junta "Dinero en cuenta" y "Transferencia"', igual(montos(V.filtrarVentas(ventas, 'todos', 'Transferencia', F.claveDeFormaDePago)), [20, 30]));
verificar('G2 filtrar Crédito y Débito', igual(montos(V.filtrarVentas(ventas, 'todos', 'Crédito', F.claveDeFormaDePago)), [10]) && igual(montos(V.filtrarVentas(ventas, 'todos', 'Débito', F.claveDeFormaDePago)), [40]));
verificar('G3 filtrar Otros trae Prepaga, pero no las pendientes (no tienen método)', igual(montos(V.filtrarVentas(ventas, 'todos', 'Otros', F.claveDeFormaDePago)), [50]));
verificar('G4 "todos" no filtra nada', V.filtrarVentas(ventas, 'todos', 'todos', F.claveDeFormaDePago).length === 6);
verificar('G5 sin la clave se compara el texto guardado, como antes', igual(montos(V.filtrarVentas(ventas, 'todos', 'Dinero en cuenta')), [20]));
verificar('G6 estado y forma de pago juntos', igual(montos(V.filtrarVentas(ventas, 'confirmada', 'Transferencia', F.claveDeFormaDePago)), [20, 30]) && V.filtrarVentas(ventas, 'pendiente', 'Transferencia', F.claveDeFormaDePago).length === 0);

// ---------- Los totales no cambian ----------
const recaudado = (lista) => V.resumenDeVentas(lista).recaudado;
verificar('T1 filtrar por forma no cambia los montos: las partes suman el total (las pendientes no suman)', recaudado(ventas) === ['Transferencia', 'Débito', 'Crédito', 'Otros'].reduce((s, f) => s + recaudado(V.filtrarVentas(ventas, 'todos', f, F.claveDeFormaDePago)), 0), String(recaudado(ventas)));

// ---------- Las pantallas usan estas funciones ----------
const leer = (a) => fs.readFileSync(path.join(RAIZ, a), 'utf8');
for (const pantalla of ['admin/ventas.html', 'admin/reportes.html']) {
  const html = leer(pantalla);
  verificar(`P1 ${pantalla} arma el filtro con opcionesDeFiltroDePago`, /opcionesDeFiltroDePago\(/.test(html));
  verificar(`P2 ${pantalla} no arma el filtro con los métodos que haya guardados`, !/metodosDePago\(/.test(html));
}
verificar('P3 Ventas filtra con claveDeFormaDePago', /filtrarVentas\([^)]*claveDeFormaDePago\)/.test(leer('admin/ventas.html')));
verificar('P4 Reportes filtra con claveDeFormaDePago', /claveDeFormaDePago\(v\.metodo_pago\) === metodoFilter\.value/.test(leer('admin/reportes.html')));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
