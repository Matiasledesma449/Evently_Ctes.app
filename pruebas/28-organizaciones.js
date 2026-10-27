// Prueba de shared/organizaciones.js (cambio organizaciones-y-correcciones-del-panel):
// qué eventos ve cada organización y cómo se valida el nombre. Sin red, sin base de datos y sin navegador.
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
const O = vm.runInNewContext(codigo + '\n;({ eventosDeOrganizacion, eventosParaVer, organizacionDeEvento, validarOrganizacion, organizacionesOrdenadas })');
const U = vm.runInNewContext(fs.readFileSync(path.join(RAIZ, 'shared', 'ventas-utils.js'), 'utf8').replace(/^export /gm, '') + '\n;({ eventosDeLaPersona })');

const igual = (a, b) => JSON.stringify(Array.from(a)) === JSON.stringify(b);
const ids = (lista) => Array.from(lista).map((e) => e.id);

const eventos = [
  { id: 'A', organizacionId: 'valigroup' },
  { id: 'B', organizacionId: 'valigroup', creadoPor: 'uid-9' },
  { id: 'C', organizacionId: 'otra', correo: 'ana@ejemplo.test', creadoPor: 'uid-1' },
  { id: 'D' },
  { id: 'E', organizacionId: '' },
];

// ---------- Pertenencia ----------
verificar('O1 un evento es solo de su organización', igual(ids(O.eventosDeOrganizacion(eventos, 'valigroup')), ['A', 'B']) && igual(ids(O.eventosDeOrganizacion(eventos, 'otra')), ['C']));
verificar('O2 un evento sin organizacionId no lo ve ninguna organización', !ids(O.eventosDeOrganizacion(eventos, 'valigroup')).includes('D') && !ids(O.eventosDeOrganizacion(eventos, '')).includes('E'));
verificar('O3 sin organizacionId de la persona no se ve ningún evento (ni los sin organización)', igual(O.eventosDeOrganizacion(eventos, ''), []) && igual(O.eventosDeOrganizacion(eventos, undefined), []) && igual(O.eventosDeOrganizacion(eventos, null), []));
verificar('O4 creadoPor y correo ya no dan pertenencia', igual(O.eventosDeOrganizacion([{ id: 'X', creadoPor: 'uid-1', correo: 'ana@ejemplo.test' }], 'uid-1'), []));
verificar('O5 listas y eventos nulos no fallan', igual(O.eventosDeOrganizacion(null, 'valigroup'), []) && igual(ids(O.eventosDeOrganizacion([null, undefined, 5, eventos[0]], 'valigroup')), ['A']));
verificar('O6 el id se compara exacto (sin confundir prefijos)', igual(O.eventosDeOrganizacion([{ id: 'X', organizacionId: 'valigroup2' }], 'valigroup'), []));

// ---------- Qué se ve según con qué rol se mira ----------
verificar('V1 superadmin sin vista ve todos', igual(ids(O.eventosParaVer({ eventos, rolEfectivo: 'superadmin' })), ['A', 'B', 'C', 'D', 'E']));
verificar('V2 superadmin en vista de organización con una elegida ve solo esa', igual(ids(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', vistaDeSuperadmin: true, organizacionElegida: 'otra' })), ['C']));
verificar('V3 superadmin en vista de organización sin elegir no ve ninguno', igual(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', vistaDeSuperadmin: true, organizacionElegida: '' }), []));
verificar('V4 una organización real ve los suyos, aunque haya una "elegida" guardada', igual(ids(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion', organizacionId: 'valigroup', organizacionElegida: 'otra' })), ['A', 'B']));
verificar('V5 una organización real sin organizacionId no ve ninguno', igual(O.eventosParaVer({ eventos, rolEfectivo: 'organizacion' }), []));
verificar('V6 un rol desconocido o ausente no ve nada', igual(O.eventosParaVer({ eventos, rolEfectivo: 'cliente' }), []) && igual(O.eventosParaVer(), []));

// ---------- organizacionDeEvento ----------
const orgs = [{ id: 'valigroup', nombre: 'Valigroup' }, { id: 'otra', nombre: 'Otra' }];
verificar('D1 devuelve la organización del evento', O.organizacionDeEvento(eventos[0], orgs).nombre === 'Valigroup');
verificar('D2 sin organización o con una que no existe devuelve null', O.organizacionDeEvento(eventos[3], orgs) === null && O.organizacionDeEvento({ organizacionId: 'borrada' }, orgs) === null && O.organizacionDeEvento(null, orgs) === null);

// ---------- Validar el nombre ----------
const existentes = [{ id: 'valigroup', nombre: 'Valigroup' }];
verificar('N1 un nombre válido se acepta y se limpia', O.validarOrganizacion({ nombre: '  Nueva   Productora ' }, existentes).datos.nombre === 'Nueva Productora');
verificar('N2 nombre vacío o solo espacios se rechaza', !O.validarOrganizacion({ nombre: '' }, existentes).ok && !O.validarOrganizacion({ nombre: '   ' }, existentes).ok && !O.validarOrganizacion({}, existentes).ok && !O.validarOrganizacion(null, existentes).ok);
verificar('N3 más de 60 caracteres se rechaza; 60 se acepta', !O.validarOrganizacion({ nombre: 'a'.repeat(61) }, existentes).ok && O.validarOrganizacion({ nombre: 'a'.repeat(60) }, existentes).ok);
verificar('N4 "Valigroup" y " valigroup " cuentan como repetidos', !O.validarOrganizacion({ nombre: ' valigroup ' }, existentes).ok && !O.validarOrganizacion({ nombre: 'VALIGROUP' }, existentes).ok);
verificar('N5 al editar, el propio nombre no cuenta como repetido', O.validarOrganizacion({ nombre: 'Valigroup' }, existentes, 'valigroup').ok);
verificar('N6 un nombre con etiquetas HTML se rechaza', !O.validarOrganizacion({ nombre: '<img src=x onerror=alert(1)>' }, existentes).ok && !O.validarOrganizacion({ nombre: '<b>hola</b>' }, existentes).ok);
verificar('N7 el rechazo trae campo y mensaje', (() => { const r = O.validarOrganizacion({ nombre: '' }, existentes); return r.campo === 'nombre' && typeof r.mensaje === 'string' && r.mensaje.length > 0; })());
verificar('N8 la lista ordenada ignora entradas rotas y ordena por nombre', igual(O.organizacionesOrdenadas([{ id: 'b', nombre: 'Zeta' }, null, { nombre: 'sin id' }, { id: 'a', nombre: 'Alfa' }]).map((o) => o.id), ['a', 'b']));

// ---------- eventosDeLaPersona (ventas-utils) sigue la misma regla ----------
{
  const orgX = { rol: 'organizacion', organizacionId: 'valigroup', email: 'ana@ejemplo.test' };
  const mismos = ['valigroup', 'otra', '', undefined].every((id) =>
    igual(ids(U.eventosDeLaPersona(eventos, { rol: 'organizacion', organizacionId: id }, 'uid-1')), ids(O.eventosDeOrganizacion(eventos, id))));
  verificar('L1 eventosDeLaPersona da lo mismo que eventosDeOrganizacion para una organización', mismos);
  verificar('L2 una organización no ve por creadoPor ni por correo', !ids(U.eventosDeLaPersona(eventos, { ...orgX, organizacionId: 'sin-eventos' }, 'uid-1')).includes('C'));
  verificar('L3 el superadmin ve todos', igual(ids(U.eventosDeLaPersona(eventos, { rol: 'superadmin' }, 'u')), ['A', 'B', 'C', 'D', 'E']));
}

// ---------- El archivo es puro: sin red, sin base de datos y sin innerHTML ----------
{
  const fuente = fs.readFileSync(path.join(RAIZ, 'shared', 'organizaciones.js'), 'utf8').replace(/\/\/.*$/gm, '');
  verificar('P1 organizaciones.js no usa innerHTML, fetch ni Firestore', !/innerHTML|fetch\(|firestore|getDocs|document\./i.test(fuente));
  verificar('P2 la pertenencia no mira creadoPor ni el correo', !/creadoPor|correo|email/.test(fuente));
}

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
