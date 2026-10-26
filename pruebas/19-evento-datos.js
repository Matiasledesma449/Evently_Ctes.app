// Prueba de los datos del evento (cambio crear-evento-completo): shared/evento-datos.js.
// Días con horario y detalle en campos. Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// shared/evento-datos.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'evento-datos.js'), 'utf8').replace(/^export /gm, '');
const E = vm.runInNewContext(codigo + '\n;({ TIPOS_DE_EVENTO, normalizarDias, validarDias, fechaDeTexto, resumenDeDias, armarDetalle, detalleParaMostrar, armarUbicacion, ubicacionDeEvento })');
const lista = (x) => JSON.parse(JSON.stringify(x)); // saca los objetos del otro contexto para poder compararlos

const dia1 = { fecha: '2026-12-15', horaInicio: '21:00', horaFin: '05:00' };
const dia2 = { fecha: '2026-12-16', horaInicio: '18:30', horaFin: '23:00' };

// ---------- Días ----------
verificar('D1 dos días desordenados quedan ordenados por fecha', E.normalizarDias([dia2, dia1]).map((d) => d.fecha).join() === '2026-12-15,2026-12-16');
verificar('D2 los días sin fecha o con fecha que no existe se descartan', E.normalizarDias([{ fecha: '' }, { fecha: '2026-02-30' }, { fecha: '15/12/2026' }, null, 'x', dia1]).length === 1);
verificar('D3 una hora mal escrita queda vacía', E.normalizarDias([{ fecha: '2026-12-15', horaInicio: '25:00', horaFin: '9:5' }])[0].horaInicio === '' && E.normalizarDias([{ fecha: '2026-12-15', horaInicio: '25:00', horaFin: '9:5' }])[0].horaFin === '');
verificar('D4 si no es lista da lista vacía', [undefined, null, 'x', 5, {}].every((x) => E.normalizarDias(x).length === 0));
verificar('D5 no modifica lo que recibe', (() => { const entrada = [dia2, dia1]; E.normalizarDias(entrada); return entrada[0] === dia2 && entrada[1] === dia1; })());

verificar('V1 días bien cargados no dan aviso', E.validarDias([dia1, dia2]) === '');
verificar('V2 sin ningún día pide agregar uno', E.validarDias([]) === 'Agregá al menos un día.' && E.validarDias(null) === 'Agregá al menos un día.');
verificar('V3 sin fecha en el primer día dice "La fecha es obligatoria"', E.validarDias([{ fecha: '', horaInicio: '21:00', horaFin: '23:00' }]).startsWith('La fecha es obligatoria'));
verificar('V4 una fecha repetida se avisa', /repite/.test(E.validarDias([dia1, { ...dia1, horaInicio: '10:00' }])));
verificar('V5 sin hora de inicio o de fin se avisa', /hora de inicio/.test(E.validarDias([{ fecha: '2026-12-15', horaInicio: '', horaFin: '23:00' }])) && /hora de fin/.test(E.validarDias([{ fecha: '2026-12-15', horaInicio: '21:00', horaFin: '' }])));
verificar('V6 la hora de fin menor que la de inicio se acepta', E.validarDias([dia1]) === '');
verificar('V7 el aviso nombra el día que falla', /día 2/.test(E.validarDias([dia1, { fecha: '' }])));

verificar('F1 el texto de la fecha es el del primer día', E.fechaDeTexto([dia2, dia1]) === '15 Diciembre 2026', E.fechaDeTexto([dia2, dia1]));
verificar('F2 el día no lleva cero adelante', E.fechaDeTexto([{ fecha: '2026-03-05' }]) === '5 Marzo 2026');
verificar('F3 sin días da texto vacío', E.fechaDeTexto([]) === '' && E.fechaDeTexto(undefined) === '');

verificar('R1 un renglón por día', E.resumenDeDias({ dias: [dia1, dia2] }).length === 2);
verificar('R2 el renglón lleva día de la semana, fecha y horario', lista(E.resumenDeDias({ dias: [dia2] }))[0] === 'Mié 16 dic · 18:30 a 23:00', E.resumenDeDias({ dias: [dia2] })[0]);
verificar('R3 si termina de madrugada lo dice', E.resumenDeDias({ dias: [dia1] })[0] === 'Mar 15 dic · 21:00 a 05:00 (termina al día siguiente)', E.resumenDeDias({ dias: [dia1] })[0]);
verificar('R4 un evento viejo da un solo renglón con su fecha', JSON.stringify(lista(E.resumenDeDias({ fecha: '15 Diciembre 2024' }))) === '["15 Diciembre 2024"]');
verificar('R5 sin fecha ni días no da renglones y no falla', E.resumenDeDias({}).length === 0 && E.resumenDeDias(null).length === 0 && E.resumenDeDias(undefined).length === 0);
verificar('R6 con días, ignora la fecha de texto', E.resumenDeDias({ fecha: 'otra cosa', dias: [dia2] }).length === 1 && !/otra/.test(E.resumenDeDias({ fecha: 'otra cosa', dias: [dia2] })[0]));

// ---------- Detalle ----------
verificar('T1 el detalle completo guarda los cuatro campos', Object.keys(E.armarDetalle({ actividad: 'Baile', tipo: 'Fiesta', requisitos: 'DNI', edad: '18+' })).length === 4);
verificar('T2 los campos vacíos o con espacios no se guardan', JSON.stringify(lista(E.armarDetalle({ actividad: ' Baile ', tipo: '', requisitos: '   ', edad: undefined }))) === '{"actividad":"Baile"}');
verificar('T3 con todo vacío o entradas raras da objeto vacío', [undefined, null, 'x', {}, { actividad: 5 }].every((x) => Object.keys(E.armarDetalle(x)).length === 0));
verificar('T4 se ignoran campos que no son del detalle', Object.keys(E.armarDetalle({ actividad: 'a', otro: 'b' })).join() === 'actividad');
verificar('T5 un texto muy largo se corta', E.armarDetalle({ actividad: 'a'.repeat(900) }).actividad.length === 500);

verificar('M1 las filas salen en orden y con título', E.detalleParaMostrar({ detalle: { edad: '18+', actividad: 'Baile', tipo: 'Fiesta' } }).map((f) => f.titulo).join() === 'Actividad,Tipo de evento,Edad');
verificar('M2 un evento viejo muestra su descripción sin título', JSON.stringify(lista(E.detalleParaMostrar({ descripcion: 'Texto de siempre' }))) === '[{"titulo":"","texto":"Texto de siempre"}]');
verificar('M3 con detalle y descripción, la descripción va al final como "Más información"', (() => { const f = lista(E.detalleParaMostrar({ detalle: { actividad: 'Baile' }, descripcion: 'Algo más' })); return f.length === 2 && f[1].titulo === 'Más información'; })());
verificar('M4 sin nada no da filas y no falla', E.detalleParaMostrar({}).length === 0 && E.detalleParaMostrar(null).length === 0);
verificar('M5 el texto con etiquetas se devuelve tal cual (quien lo muestra lo escapa)', E.detalleParaMostrar({ detalle: { actividad: '<b>hola</b>' } })[0].texto === '<b>hola</b>');
verificar('M6 los tipos ofrecidos incluyen "Otro" al final', E.TIPOS_DE_EVENTO[E.TIPOS_DE_EVENTO.length - 1] === 'Otro' && E.TIPOS_DE_EVENTO.length === 6);

// ---------- Ubicación (lugar con mapa) ----------
verificar('U1 latitud y longitud válidas se guardan', JSON.stringify(lista(E.armarUbicacion(-28.25, -58.63))) === '{"lat":-28.25,"lng":-58.63}');
verificar('U2 acepta números escritos como texto (lo que devuelve Nominatim)', JSON.stringify(lista(E.armarUbicacion('-28.2512345678', '-58.6312345678'))) === '{"lat":-28.251235,"lng":-58.631235}', JSON.stringify(E.armarUbicacion('-28.2512345678', '-58.6312345678')));
verificar('U3 fuera de rango da null', E.armarUbicacion(91, 0) === null && E.armarUbicacion(0, 181) === null && E.armarUbicacion(-91, 0) === null);
verificar('U4 vacío, texto o inválido da null', [[undefined, undefined], [null, null], ['', ''], ['a', 'b'], [NaN, 1], [Infinity, 1], [{}, []]].every(([a, b]) => E.armarUbicacion(a, b) === null));
verificar('U5 el cero es una ubicación válida', E.armarUbicacion(0, 0) !== null);
verificar('U6 un evento viejo (sin ubicación) da null y no falla', E.ubicacionDeEvento({}) === null && E.ubicacionDeEvento(null) === null && E.ubicacionDeEvento({ ubicacion: null }) === null && E.ubicacionDeEvento({ ubicacion: 'x' }) === null);
verificar('U7 un evento con ubicación la devuelve', JSON.stringify(lista(E.ubicacionDeEvento({ lugar: 'Salón', ubicacion: { lat: -28.25, lng: -58.63 } }))) === '{"lat":-28.25,"lng":-58.63}');
verificar('U8 un evento con ubicación rota no muestra mapa', E.ubicacionDeEvento({ ubicacion: { lat: 500, lng: 1 } }) === null && E.ubicacionDeEvento({ ubicacion: {} }) === null);

if (mal) {
  console.log(`\n${mal} caso(s) mal.`);
  process.exit(1);
}
console.log('\nTodo bien.');
