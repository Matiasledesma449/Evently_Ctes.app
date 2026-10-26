// Prueba de los comentarios y contactos de las solicitudes (cambio superadmin-sin-panel-global): shared/solicitudes-evento.js.
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

// shared/solicitudes-evento.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'solicitudes-evento.js'), 'utf8').replace(/^export /gm, '');
const S = vm.runInNewContext(codigo + '\n;({ armarComentario, comentariosDeSolicitud, ultimoComentario, enlacesDeContacto })');
const lista = (x) => JSON.parse(JSON.stringify(x)); // saca los objetos del otro contexto para poder compararlos
const AHORA = new Date('2026-10-26T14:30:00.000Z');

// ---------- Armar el comentario ----------
verificar('C1 un comentario lleva texto, autor y fecha', JSON.stringify(lista(S.armarComentario('Falta la hora de fin', AHORA))) === '{"texto":"Falta la hora de fin","autor":"superadmin","fecha":"2026-10-26T14:30:00.000Z"}', JSON.stringify(S.armarComentario('Falta la hora de fin', AHORA)));
verificar('C2 se sacan los espacios de los costados', S.armarComentario('  hola  ', AHORA).texto === 'hola');
verificar('C3 vacío, solo espacios o algo que no es texto da null', ['', '   ', '\n\t', undefined, null, 5, {}].every((x) => S.armarComentario(x, AHORA) === null));
verificar('C4 un texto muy largo se corta a 500', S.armarComentario('a'.repeat(900), AHORA).texto.length === 500);
verificar('C5 el texto con etiquetas se guarda tal cual (quien lo muestra lo escapa)', S.armarComentario('<b>hola</b>', AHORA).texto === '<b>hola</b>');
verificar('C6 sin fecha válida usa la de ahora', /^\d{4}-\d{2}-\d{2}T/.test(S.armarComentario('hola', undefined).fecha) && /^\d{4}-\d{2}-\d{2}T/.test(S.armarComentario('hola', new Date('x')).fecha));

// ---------- Leer los comentarios ----------
const c1 = { texto: 'Primero', autor: 'superadmin', fecha: '2026-10-25T10:00:00.000Z' };
const c2 = { texto: 'Segundo', autor: 'superadmin', fecha: '2026-10-26T10:00:00.000Z' };
verificar('L1 salen del más nuevo al más viejo', S.comentariosDeSolicitud({ comentarios: [c1, c2] }).map((c) => c.texto).join() === 'Segundo,Primero');
verificar('L2 una solicitud vieja (sin comentarios) da lista vacía y no falla', [{}, null, undefined, { comentarios: null }, { comentarios: 'x' }].every((x) => S.comentariosDeSolicitud(x).length === 0));
verificar('L3 se descarta lo que no tiene texto', S.comentariosDeSolicitud({ comentarios: [null, 'x', {}, { texto: '  ' }, { texto: 5 }, c1] }).length === 1);
verificar('L4 el último comentario es el más nuevo', S.ultimoComentario({ comentarios: [c2, c1] }).texto === 'Segundo');
verificar('L5 sin comentarios, el último es null', S.ultimoComentario({}) === null && S.ultimoComentario(undefined) === null);
verificar('L6 con la misma fecha, el que se guardó después va primero', S.comentariosDeSolicitud({ comentarios: [{ texto: 'A', fecha: 'x' }, { texto: 'B', fecha: 'x' }] }).map((c) => c.texto).join() === 'B,A');
verificar('L7 sin autor se toma superadmin', S.comentariosDeSolicitud({ comentarios: [{ texto: 'A' }] })[0].autor === 'superadmin');
verificar('L8 no modifica lo que recibe', (() => { const entrada = [c1, c2]; S.comentariosDeSolicitud({ comentarios: entrada }); return entrada[0] === c1 && entrada[1] === c2; })());

// ---------- Contacto ----------
const completo = S.enlacesDeContacto({ correo: 'org@example.com', telefono: '+54 9 3782 45-6789', nombreEvento: 'Fiesta del Río' });
verificar('K1 con correo y teléfono hay los dos enlaces', completo.correo.startsWith('mailto:org@example.com?') && completo.whatsapp.startsWith('https://wa.me/'));
verificar('K2 el enlace de WhatsApp usa solo dígitos', completo.whatsapp.startsWith('https://wa.me/5493782456789?text='), completo.whatsapp);
verificar('K3 el texto inicial nombra el evento (codificado)', completo.whatsapp.includes(encodeURIComponent('"Fiesta del Río"')) && completo.correo.includes(encodeURIComponent('Fiesta del Río')));
verificar('K4 sin teléfono solo queda el correo', (() => { const e = S.enlacesDeContacto({ correo: 'org@example.com', nombreEvento: 'X' }); return e.correo !== '' && e.whatsapp === ''; })());
verificar('K5 sin correo solo queda WhatsApp', (() => { const e = S.enlacesDeContacto({ telefono: '3782456789', nombreEvento: 'X' }); return e.correo === '' && e.whatsapp !== ''; })());
verificar('K6 un teléfono muy corto no da enlace', S.enlacesDeContacto({ telefono: '123456' }).whatsapp === '');
verificar('K7 un correo mal escrito no da enlace', ['sin-arroba', 'a b@c.com', ''].every((c) => S.enlacesDeContacto({ correo: c }).correo === ''));
verificar('K8 sin datos no falla y da enlaces vacíos', (() => { const a = S.enlacesDeContacto(); const b = S.enlacesDeContacto({}); return !a.correo && !a.whatsapp && !b.correo && !b.whatsapp; })());
verificar('K9 sin nombre de evento dice "tu evento"', S.enlacesDeContacto({ correo: 'a@b.co' }).correo.includes(encodeURIComponent('tu evento')));
verificar('K10 un teléfono guardado como número también sirve', S.enlacesDeContacto({ telefono: 5493782456789 }).whatsapp.startsWith('https://wa.me/5493782456789'));
verificar('K11 comillas, & y saltos en el nombre no rompen el enlace', (() => { const e = S.enlacesDeContacto({ correo: 'a@b.co', nombreEvento: 'Rock & "Roll"\n#1' }); return !/[\s"]/.test(e.correo) && e.correo.split('?').length === 2; })());

if (mal) {
  console.log(`\n${mal} caso(s) mal.`);
  process.exit(1);
}
console.log('\nTodo bien.');
