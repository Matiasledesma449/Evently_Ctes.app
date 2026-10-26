// Prueba del estado nuevo / leído / respondido y de la lista de organizaciones (cambio mensajes-estilo-whatsapp): shared/estado-mensajes.js.
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

// shared/estado-mensajes.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'estado-mensajes.js'), 'utf8').replace(/^export /gm, '');
const E = vm.runInNewContext(codigo + '\n;({ estadoDeConversacion, estadoDeConsulta, contarPorEstado, presentacionDeEstado, filtrarPorEstado, organizacionesParaChat, textoVacio })');
const lista = (x) => JSON.parse(JSON.stringify(x)); // saca los objetos del otro contexto para poder compararlos
const YO = 'uid-superadmin';
const ELLA = 'uid-org';

// ---------- Estado de una conversación ----------
verificar('E1 último mensaje de la organización sin abrir: nuevo', E.estadoDeConversacion({ ultimoDe: ELLA, ultimoLeido: false }, YO) === 'nuevo');
verificar('E2 sin el campo ultimoLeido también es nuevo', E.estadoDeConversacion({ ultimoDe: ELLA }, YO) === 'nuevo');
verificar('E3 abierta y sin responder: leído', E.estadoDeConversacion({ ultimoDe: ELLA, ultimoLeido: true }, YO) === 'leido');
verificar('E4 el último mensaje es mío: respondido', E.estadoDeConversacion({ ultimoDe: YO, ultimoLeido: false }, YO) === 'respondido');
verificar('E5 respondido aunque la otra persona ya lo haya leído', E.estadoDeConversacion({ ultimoDe: YO, ultimoLeido: true }, YO) === 'respondido');
verificar('E6 conversación vieja (sin ultimoDe): leído', [{}, { ultimoDe: '' }, { ultimoDe: null }, { ultimoDe: 5 }].every((c) => E.estadoDeConversacion(c, YO) === 'leido'));
verificar('E7 sin datos no falla', E.estadoDeConversacion(null, YO) === 'leido' && E.estadoDeConversacion(undefined, YO) === 'leido');
verificar('E8 desde el lado de la organización, lo mío es respondido', E.estadoDeConversacion({ ultimoDe: ELLA, ultimoLeido: false }, ELLA) === 'respondido');

// ---------- Estado de una consulta ----------
verificar('Q1 nueva, leída y respondida', E.estadoDeConsulta({ estado: 'nueva' }) === 'nuevo' && E.estadoDeConsulta({ estado: 'leida' }) === 'leido' && E.estadoDeConsulta({ estado: 'respondida' }) === 'respondido');
verificar('Q2 sin estado o con uno desconocido: leído', [{}, { estado: 'otra' }, { estado: null }, null, undefined].every((c) => E.estadoDeConsulta(c) === 'leido'));

// ---------- Contadores y filtro ----------
const consultas = [{ estado: 'nueva' }, { estado: 'nueva' }, { estado: 'leida' }, { estado: 'respondida' }, { estado: 'rara' }];
const cuenta = lista(E.contarPorEstado(consultas, E.estadoDeConsulta));
verificar('F1 los contadores suman por estado', cuenta.nuevo === 2 && cuenta.leido === 2 && cuenta.respondido === 1 && cuenta.total === 5, JSON.stringify(cuenta));
verificar('F2 una lista vacía o inválida cuenta cero', lista(E.contarPorEstado([], E.estadoDeConsulta)).total === 0 && lista(E.contarPorEstado(null, E.estadoDeConsulta)).total === 0);
verificar('F3 filtrar nuevos trae solo los nuevos', E.filtrarPorEstado(consultas, 'nuevo', E.estadoDeConsulta).length === 2);
verificar('F4 "todos" o un filtro desconocido trae todo', E.filtrarPorEstado(consultas, 'todos', E.estadoDeConsulta).length === 5 && E.filtrarPorEstado(consultas, 'xx', E.estadoDeConsulta).length === 5);
verificar('F5 el filtro coincide con el contador', ['nuevo', 'leido', 'respondido'].every((e) => E.filtrarPorEstado(consultas, e, E.estadoDeConsulta).length === cuenta[e]));
verificar('F6 filtrar no cambia la lista original', (() => { const copia = consultas.slice(); E.filtrarPorEstado(consultas, 'nuevo', E.estadoDeConsulta); return copia.every((c, i) => c === consultas[i]); })());

// ---------- Colores y etiquetas ----------
verificar('P1 cada estado tiene etiqueta y clases distintas', (() => { const p = ['nuevo', 'leido', 'respondido'].map((e) => E.presentacionDeEstado(e)); return new Set(p.map((x) => x.etiqueta)).size === 3 && new Set(p.map((x) => x.clasesInsignia)).size === 3 && new Set(p.map((x) => x.clasesPunto)).size === 3; })());
verificar('P2 solo "nuevo" va en negrita', E.presentacionDeEstado('nuevo').negrita === true && E.presentacionDeEstado('leido').negrita === false && E.presentacionDeEstado('respondido').negrita === false);
verificar('P3 los colores son ámbar, gris y verde', /amber/.test(E.presentacionDeEstado('nuevo').clasesInsignia) && /gray/.test(E.presentacionDeEstado('leido').clasesInsignia) && /green/.test(E.presentacionDeEstado('respondido').clasesInsignia));
verificar('P4 un estado desconocido se ve como leído', E.presentacionDeEstado('zzz').etiqueta === 'Leído');
verificar('P5 modificar lo devuelto no cambia los siguientes', (() => { const a = E.presentacionDeEstado('nuevo'); a.etiqueta = 'X'; return E.presentacionDeEstado('nuevo').etiqueta === 'Nuevo'; })());

// ---------- Organizaciones para "Nuevo mensaje" ----------
const usuarios = [
  { id: YO, rol: 'superadmin', nombre: 'Soporte' },
  { id: 'o1', rol: 'organizacion', nombre: 'Zeta Eventos', email: 'zeta@example.com' },
  { id: 'o2', rol: 'organizacion', nombre: 'álamo Producciones', email: 'alamo@example.com' },
  { id: 'o3', rol: 'organizacion', nombre: '   ', email: 'sin-nombre@example.com' },
  { id: 'c1', rol: 'cliente', nombre: 'Comprador' },
  { id: 'u1', rol: 'usuario', nombre: 'Otro' },
  { id: 'o4', rol: 'organizacion', nombre: 'Beta', email: 'Beta@Example.com' },
  null
];
const conversaciones = [{ id: 'conv-o4', participantes: [YO, 'o4'] }, { id: 'conv-x', participantes: [YO, 'otro'] }];
const todas = E.organizacionesParaChat(usuarios, YO, conversaciones, '');
verificar('O1 salen todas las organizaciones y solo ellas', todas.length === 4 && todas.every((o) => ['o1', 'o2', 'o3', 'o4'].includes(o.id)), todas.map((o) => o.id).join());
verificar('O2 van ordenadas por nombre sin importar tildes ni mayúsculas', todas.map((o) => o.id).join() === 'o2,o4,o3,o1', todas.map((o) => o.id).join());
verificar('O3 nombre vacío se muestra como "Organización sin nombre"', todas.find((o) => o.id === 'o3').nombre === 'Organización sin nombre');
verificar('O4 la que ya tiene conversación trae su id', todas.find((o) => o.id === 'o4').conversacionId === 'conv-o4' && todas.find((o) => o.id === 'o1').conversacionId === '');
verificar('O5 no se lista a uno mismo ni a quien no es organización', !todas.some((o) => o.id === YO || o.id === 'c1' || o.id === 'u1'));
verificar('O6 el buscador filtra por nombre sin importar tildes', E.organizacionesParaChat(usuarios, YO, conversaciones, 'ALAMO').map((o) => o.id).join() === 'o2');
verificar('O7 el buscador filtra por correo sin importar mayúsculas', E.organizacionesParaChat(usuarios, YO, conversaciones, 'beta@example').map((o) => o.id).join() === 'o4');
verificar('O8 una búsqueda sin coincidencias da lista vacía', E.organizacionesParaChat(usuarios, YO, conversaciones, 'nadie').length === 0);
verificar('O9 sin usuarios o sin conversaciones no falla', E.organizacionesParaChat(null, YO, null, '').length === 0 && E.organizacionesParaChat(usuarios, YO, undefined, undefined).length === 4);
verificar('O10 el texto con etiquetas se devuelve tal cual (quien lo muestra lo escapa)', E.organizacionesParaChat([{ id: 'o9', rol: 'organizacion', nombre: '<b>X</b>' }], YO, [], '')[0].nombre === '<b>X</b>');

// ---------- Estados vacíos ----------
verificar('V1 cada contexto tiene título y ayuda', ['mensajes-sin-conversaciones', 'consultas-sin-consultas', 'filtro-sin-resultados', 'organizaciones-sin-resultados'].every((c) => E.textoVacio(c).titulo && E.textoVacio(c).ayuda));
verificar('V2 sin nada y filtro sin resultados dicen cosas distintas', E.textoVacio('mensajes-sin-conversaciones').titulo !== E.textoVacio('filtro-sin-resultados').titulo && E.textoVacio('consultas-sin-consultas').titulo !== E.textoVacio('filtro-sin-resultados').titulo);
verificar('V3 solo el filtro sin resultados ofrece "Ver todas"', E.textoVacio('filtro-sin-resultados').verTodas === true && E.textoVacio('mensajes-sin-conversaciones').verTodas === false && E.textoVacio('consultas-sin-consultas').verTodas === false);
verificar('V4 "Mensajes" manda a "Nuevo mensaje"', /Nuevo mensaje/.test(E.textoVacio('mensajes-sin-conversaciones').ayuda));
verificar('V5 un contexto desconocido no falla', E.textoVacio('zzz').titulo === E.textoVacio('filtro-sin-resultados').titulo);

if (mal) {
  console.log(`\n${mal} caso(s) mal.`);
  process.exit(1);
}
console.log('\nTodo bien.');
