// Prueba de shared/organizaciones.js (cambio organizaciones-y-correcciones-del-panel): de quién es cada evento
// y qué eventos ve cada cuenta. Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// shared/organizaciones.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'organizaciones.js'), 'utf8').replace(/^export /gm, '');
const O = vm.runInNewContext(codigo + '\n;({ eventosDeOrganizacion, eventosParaVer, organizacionDeEvento, validarOrganizacion })');
const ids = (l) => Array.from(l).map((e) => e.id).join(',');

const eventos = [
  { id: 'A', organizacionId: 'vali' },
  { id: 'B', organizacionId: 'otra' },
  { id: 'C', creadoPor: 'u-vali', correo: 'admin@vali.test' }, // viejo: sin organizacionId
  { id: 'D', organizacionId: ' vali ' },
  null,
];

// ---------- Pertenencia ----------
verificar('O1 un evento es solo de su organización', ids(O.eventosDeOrganizacion(eventos, 'vali')) === 'A,D', ids(O.eventosDeOrganizacion(eventos, 'vali')));
verificar('O2 un evento sin organizacionId no lo ve ninguna organización (ni por creadoPor ni por correo)',
  !ids(O.eventosDeOrganizacion(eventos, 'vali')).includes('C') && !ids(O.eventosDeOrganizacion(eventos, 'otra')).includes('C'));
verificar('O3 sin organización no hay eventos (vacío, null, espacios)', ['', null, undefined, '   '].every((x) => O.eventosDeOrganizacion(eventos, x).length === 0));
verificar('O4 listas nulas no fallan', O.eventosDeOrganizacion(null, 'vali').length === 0);

// ---------- Qué ve cada cuenta ----------
verificar('O5 superadmin sin vista ve todos', ids(O.eventosParaVer({ eventos, rolEfectivo: 'superadmin', rolReal: 'superadmin' })) === 'A,B,C,D');
verificar('O6 vista de organización con una elegida: solo esa', ids(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', rolReal: 'superadmin', organizacionElegida: 'otra' })) === 'B');
verificar('O7 vista de organización sin elegir: ninguno', O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', rolReal: 'superadmin' }).length === 0);
verificar('O8 una organización real ve los suyos', ids(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', rolReal: 'organizacion', organizacionId: 'vali' })) === 'A,D');
verificar('O9 una organización real no puede mirar otra con "organizacionElegida"',
  ids(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', rolReal: 'organizacion', organizacionId: 'vali', organizacionElegida: 'otra' })) === 'A,D');
verificar('O10 una cuenta sin organizacionId no ve nada', O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', rolReal: 'organizacion' }).length === 0);
verificar('O11 sin datos no falla', O.eventosParaVer().length === 0 && O.eventosParaVer({}).length === 0);

// ---------- Organización de un evento ----------
const organizaciones = [{ id: 'vali', nombre: 'Valigroup' }, { id: 'otra', nombre: 'Otra' }];
verificar('O12 la organización de un evento', (O.organizacionDeEvento(eventos[0], organizaciones) || {}).nombre === 'Valigroup');
verificar('O13 sin organizacionId o con una que no existe: null', O.organizacionDeEvento(eventos[2], organizaciones) === null && O.organizacionDeEvento({ organizacionId: 'x' }, organizaciones) === null && O.organizacionDeEvento(null, organizaciones) === null);

// ---------- Validar el nombre ----------
verificar('O14 un nombre normal está bien', O.validarOrganizacion({ nombre: 'Productora Norte' }, organizaciones) === '');
verificar('O15 vacío o solo espacios no', O.validarOrganizacion({ nombre: '   ' }, organizaciones) !== '' && O.validarOrganizacion({}, organizaciones) !== '');
verificar('O16 más de 60 caracteres no', O.validarOrganizacion({ nombre: 'x'.repeat(61) }, []) !== '' && O.validarOrganizacion({ nombre: 'x'.repeat(60) }, []) === '');
verificar('O17 repetido sin distinguir mayúsculas ni espacios ("Valigroup" y " valigroup ")', O.validarOrganizacion({ nombre: ' valigroup ' }, organizaciones) !== '');
verificar('O18 con etiquetas HTML no', O.validarOrganizacion({ nombre: '<b>Vali</b>' }, []) !== '');
verificar('O19 el archivo no usa innerHTML y la pertenencia no mira creadoPor ni correo',
  !/innerHTML|creadoPor|\.correo/.test(codigo.replace(/\/\/.*$/gm, '')));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
