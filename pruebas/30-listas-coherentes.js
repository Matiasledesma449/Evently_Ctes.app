// Prueba de que Resumen (selector), Eventos, Ventas y Reportes arman la lista de eventos con la MISMA función
// (cambio organizaciones-y-correcciones-del-panel). Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};
const leer = (a) => fs.readFileSync(path.join(RAIZ, a), 'utf8');

const O = vm.runInNewContext(leer('shared/organizaciones.js').replace(/^export /gm, '') + '\n;({ eventosParaVer })');
const ids = (lista) => Array.from(lista).map((e) => e.id).join();

// ---------- Con la función compartida: la misma cuenta ve lo mismo en cualquier pantalla ----------
const eventos = [
  { id: 'A', nombre: 'Fiesta A', organizacionId: 'valigroup' },
  { id: 'B', nombre: 'Fiesta B', organizacionId: 'valigroup' },
  { id: 'C', nombre: 'Fiesta C', organizacionId: 'otra' },
  { id: 'D', nombre: 'Vieja sin organización' },
];
const cuentas = {
  'organización Valigroup': { rolEfectivo: 'organizacion', organizacionId: 'valigroup' },
  'organización Otra': { rolEfectivo: 'organizacion', organizacionId: 'otra' },
  'superadmin': { rolEfectivo: 'superadmin' },
  'superadmin viendo como Valigroup': { rolEfectivo: 'organizacion', vistaDeSuperadmin: true, organizacionElegida: 'valigroup' },
  'superadmin viendo como organización sin elegir': { rolEfectivo: 'organizacion', vistaDeSuperadmin: true, organizacionElegida: '' },
};
const esperado = {
  'organización Valigroup': 'A,B',
  'organización Otra': 'C',
  'superadmin': 'A,B,C,D',
  'superadmin viendo como Valigroup': 'A,B',
  'superadmin viendo como organización sin elegir': '',
};
for (const [nombre, cuenta] of Object.entries(cuentas)) {
  verificar(`C1 ${nombre}: ve ${esperado[nombre] || 'ningún evento'}`, ids(O.eventosParaVer({ eventos, ...cuenta })) === esperado[nombre], ids(O.eventosParaVer({ eventos, ...cuenta })));
}
verificar('C2 el superadmin viendo como Valigroup ve lo mismo que la cuenta de Valigroup', ids(O.eventosParaVer({ eventos, ...cuentas['superadmin viendo como Valigroup'] })) === ids(O.eventosParaVer({ eventos, ...cuentas['organización Valigroup'] })));
verificar('C3 el evento viejo sin organización lo ve solo el superadmin', ids(O.eventosParaVer({ eventos, ...cuentas['superadmin'] })).includes('D') && !Object.entries(cuentas).some(([n, c]) => n !== 'superadmin' && ids(O.eventosParaVer({ eventos, ...c })).includes('D')));

// ---------- Las cuatro pantallas usan esa función ----------
const sinComentarios = (t) => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1');
const pantallas = {
  'Resumen y Ventas (selector de evento)': 'shared/selector-evento.js',
  'Eventos': 'admin/eventos-seleccion.html',
  'Reportes': 'admin/reportes.html',
};
for (const [nombre, archivo] of Object.entries(pantallas)) {
  const codigo = sinComentarios(leer(archivo));
  verificar(`P1 ${nombre} importa y usa eventosParaVer`, /import \{[^}]*eventosParaVer[^}]*\} from ["'][./]*(\.\.\/)?(shared\/)?(\.\/)?organizaciones\.js["']/.test(codigo) && /eventosParaVer\(/.test(codigo), archivo);
  verificar(`P2 ${nombre} ya no decide la pertenencia con creadoPor ni con el correo`, !/ev\.creadoPor|ev\.correo|eventosDeLaPersona/.test(codigo), archivo);
  verificar(`P3 ${nombre} toma el rol y la organización de la vista (rolEfectivo y vistaOrganizacion)`, /rolEfectivo/.test(codigo) && /vistaOrganizacion/.test(codigo), archivo);
}
// Ventas y Resumen no arman lista propia: usan el selector
for (const archivo of ['admin/ventas.html', 'admin/dashboard.html']) {
  const html = leer(archivo);
  verificar(`P4 ${archivo} usa el selector compartido y no arma su propia lista de eventos`, /shared\/selector-evento\.js/.test(html) && !/eventosDeLaPersona|collection\(db, ?["']eventos["']\)/.test(html), archivo);
}
verificar('P5 las organizaciones salen de la colección "organizaciones", no de las cuentas', !/organizacionDeEvento\(ev\)\s*\{[\s\S]*org\.email/.test(leer('admin/eventos-seleccion.html')) && /collection\(db, "organizaciones"\)/.test(leer('admin/eventos-seleccion.html')));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
