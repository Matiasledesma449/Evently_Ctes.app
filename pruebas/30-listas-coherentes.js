// Prueba de listas coherentes (cambio organizaciones-y-correcciones-del-panel): Resumen (selector), Eventos, Ventas y
// Reportes arman la lista de eventos con la misma función, así que la misma cuenta ve los mismos eventos en todas.
// Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), 'utf8');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const O = vm.runInNewContext(leer('shared', 'organizaciones.js').replace(/^export /gm, '') + '\n;({ eventosParaVer })');
const U = vm.runInNewContext(leer('shared', 'ventas-utils.js').replace(/^export /gm, '') + '\n;({ eventosDeLaPersona })');
const ids = (l) => Array.from(l).map((e) => e.id).sort().join(',');

// Dos organizaciones, un evento viejo sin organización
const eventos = [
  { id: 'V1', organizacionId: 'vali' }, { id: 'V2', organizacionId: 'vali' },
  { id: 'N1', organizacionId: 'norte' },
  { id: 'X', creadoPor: 'u-vali', correo: 'admin@vali.test' },
];

// Lo que pasa cada pantalla a eventosParaVer (selector de Resumen y Ventas, Reportes "Todos", lista de Eventos)
const cuentas = {
  'admin de Valigroup': { rolReal: 'organizacion', rolEfectivo: 'organizacion', organizacionId: 'vali', organizacionElegida: '' },
  'superadmin': { rolReal: 'superadmin', rolEfectivo: 'superadmin', organizacionId: '', organizacionElegida: '' },
  'superadmin viendo Norte': { rolReal: 'superadmin', rolEfectivo: 'organizacion', organizacionId: '', organizacionElegida: 'norte' },
  'superadmin con Valigroup en la franja': { rolReal: 'superadmin', rolEfectivo: 'superadmin', organizacionId: '', organizacionElegida: 'vali' },
  'superadmin con una organización sin eventos': { rolReal: 'superadmin', rolEfectivo: 'superadmin', organizacionId: '', organizacionElegida: 'zavod' },
};
const esperado = { 'admin de Valigroup': 'V1,V2', 'superadmin': 'N1,V1,V2,X', 'superadmin viendo Norte': 'N1',
  'superadmin con Valigroup en la franja': 'V1,V2', 'superadmin con una organización sin eventos': '' };
for (const [nombre, c] of Object.entries(cuentas)) {
  const lista = ids(O.eventosParaVer({ eventos, ...c }));
  verificar(`L1 ${nombre}: ve ${esperado[nombre]}`, lista === esperado[nombre], lista);
}
verificar('L2 la regla de ventas-utils (eventosDeLaPersona) da lo mismo que eventosParaVer para una organización',
  ids(U.eventosDeLaPersona(eventos, { rol: 'organizacion', organizacionId: 'vali' })) === 'V1,V2');
verificar('L3 y para el superadmin sin vista',
  ids(U.eventosDeLaPersona(eventos, { rol: 'superadmin' })) === ids(O.eventosParaVer({ eventos, ...cuentas.superadmin })));
verificar('L4 el evento viejo sin organización no lo ve ninguna organización ni la vista', !['admin de Valigroup', 'superadmin viendo Norte'].some((n) => ids(O.eventosParaVer({ eventos, ...cuentas[n] })).includes('X')));

// Las pantallas usan esa función (y no un filtro propio)
const usa = (archivo) => /eventosParaVer\(/.test(leer(...archivo.split('/')));
verificar('L5 el selector de evento (Resumen y Ventas) usa eventosParaVer', usa('shared/selector-evento.js'));
verificar('L6 Reportes "Todos los eventos" usa eventosParaVer', usa('admin/reportes.html'));
verificar('L7 la lista de Eventos usa eventosParaVer y ya no filtra por creadoPor ni correo', usa('admin/eventos-seleccion.html') && !/ev\.creadoPor &&|ev\.correo &&/.test(leer('admin', 'eventos-seleccion.html')));
verificar('L8 Ventas y Resumen toman sus eventos del selector compartido', ['ventas.html', 'dashboard.html'].every((f) => /shared\/selector-evento\.js/.test(leer('admin', f))));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
