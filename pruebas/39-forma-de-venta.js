// Prueba de shared/forma-de-venta.js (pedido 16): cuándo se puede pasar de lotes a entrada única sin romper ventas.
// Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const codigo = fs.readFileSync(path.join(__dirname, '..', 'shared', 'forma-de-venta.js'), 'utf8').replace(/^export /gm, '');
const F = vm.runInNewContext(codigo + '\n;({ lotesConVentas, pasarAUnica })');
const json = (x) => JSON.stringify(x);

const lotes = [{ nombre: 'Preventa', vendidas: 3 }, { nombre: 'General', vendidas: 0 }, { nombre: 'VIP', vendidas: 0 }];

verificar('V1 sin ventas en los lotes que se quitan: se puede', F.pasarAUnica(lotes, []).sePuede === true);
verificar('V2 dice qué lotes se quitan', json(F.pasarAUnica(lotes, []).quitados) === json(['General', 'VIP']));
verificar('V3 el contador vendidas de un lote que se quita lo bloquea',
  F.pasarAUnica([{ nombre: 'A' }, { nombre: 'B', vendidas: 1 }], []).sePuede === false);
verificar('V4 una venta pendiente (pago en curso) en otro lote lo bloquea',
  json(F.pasarAUnica(lotes, [{ estado: 'pendiente', loteIndex: 2, loteNombre: 'VIP' }]).conVentas) === json(['VIP']));
verificar('V5 una venta confirmada encontrada solo por nombre lo bloquea',
  F.pasarAUnica(lotes, [{ estado: 'confirmada', loteNombre: 'General' }]).sePuede === false);
verificar('V6 las rechazadas no cuentan', F.pasarAUnica(lotes, [{ estado: 'rechazada', loteIndex: 1 }]).sePuede === true);
verificar('V7 las ventas del primer lote no bloquean (ese lote se queda)',
  F.pasarAUnica(lotes, [{ estado: 'confirmada', loteIndex: 0 }]).sePuede === true);
verificar('V8 un solo lote: se puede, sin quitar nada', json(F.pasarAUnica([{ nombre: 'Único' }], [])) === json({ sePuede: true, quitados: [], conVentas: [] }));
verificar('V9 sin lotes: no se puede', F.pasarAUnica([], []).sePuede === false);
verificar('V10 posiciones con ventas ordenadas y sin repetir',
  json(F.lotesConVentas(lotes, [{ estado: 'confirmada', loteIndex: 2 }, { estado: 'pendiente', loteIndex: 0 }, { estado: 'confirmada', loteIndex: 2 }])) === json([0, 2]));
verificar('V11 datos raros no rompen', json(F.lotesConVentas(null, [null, {}, { estado: 'confirmada', loteNombre: 'No existe' }])) === json([]));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
