// Prueba de las preguntas frecuentes (cambio pagina-de-compra-mejorada): shared/preguntas-frecuentes.js.
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

// Son modulos del navegador: se les quitan los "import" y los "export" para cargarlos aca
const leer = (a) => fs.readFileSync(path.join(RAIZ, a), 'utf8');
const formas = leer('shared/formas-de-pago.js').replace(/^export /gm, '');
const fuente = leer('shared/preguntas-frecuentes.js');
const preguntas = fuente.replace(/^import .*$/gm, '').replace(/^export /gm, '');
const P = vm.runInNewContext(formas + '\n' + preguntas + '\n;({ TEMAS_DE_AYUDA, normalizarTexto, buscarPreguntas })');
const ids = (temas) => Array.from(temas).map((t) => t.id).join(',');

// ---------- Los temas ----------
verificar('T1 hay cinco temas, en orden', ids(P.TEMAS_DE_AYUDA) === 'como-comprar,pagos,mi-entrada,anulaciones,reprogramaciones', ids(P.TEMAS_DE_AYUDA));
verificar('T2 cada tema tiene título y al menos una pregunta con su respuesta', Array.from(P.TEMAS_DE_AYUDA).every((t) => t.titulo && t.preguntas.length > 0 && Array.from(t.preguntas).every((p) => p.pregunta && p.respuesta.length > 0 && Array.from(p.respuesta).every((r) => typeof r === 'string' && r.length > 0))));
const todoElTexto = JSON.stringify(P.TEMAS_DE_AYUDA);
verificar('T3 la respuesta de formas de pago sale de la lista compartida', todoElTexto.includes('transferencia, débito o crédito') && !/efectivo/i.test(todoElTexto));
verificar('T4 ninguna respuesta nombra plazos ni reembolsos', !/reembols|\b\d+\s*(días|dias|horas)\b|plazo/i.test(todoElTexto));
const codigoSinComentarios = fuente.replace(/\/\/.*$/gm, '');
verificar('T5 el módulo no usa innerHTML y su única dependencia es formas-de-pago.js', !/innerHTML/.test(codigoSinComentarios) && Array.from(fuente.matchAll(/^import .* from '(.*)';$/gm)).every((m) => m[1] === './formas-de-pago.js'));

// ---------- normalizarTexto ----------
verificar('N1 pasa a minúsculas y quita acentos', P.normalizarTexto('ENTRADA Devolución') === 'entrada devolucion');
verificar('N2 junta espacios y recorta', P.normalizarTexto('  hola    mundo  ') === 'hola mundo');
verificar('N3 entradas raras dan texto vacío', [undefined, null, 5, {}, []].every((x) => P.normalizarTexto(x) === ''));

// ---------- buscarPreguntas ----------
verificar('B1 texto vacío, solo espacios o raro devuelve todo', ['', '   ', null, undefined, 7].every((x) => ids(P.buscarPreguntas(x)) === ids(P.TEMAS_DE_AYUDA)));
const entrada = P.buscarPreguntas('ENTRADA');
verificar('B2 "ENTRADA" (mayúsculas) encuentra preguntas', entrada.length > 0);
verificar('B3 "entrada" y "ENTRADA" dan lo mismo', JSON.stringify(P.buscarPreguntas('entrada')) === JSON.stringify(entrada));
verificar('B4 "tarjeta" encuentra la pregunta de los datos de la tarjeta', P.buscarPreguntas('tarjeta').some((t) => t.preguntas.some((p) => /tarjeta/i.test(p.pregunta))));
verificar('B5 "debito" sin acento encuentra "Débito"', ids(P.buscarPreguntas('debito')).includes('pagos'));
verificar('B6 todas las palabras deben aparecer', P.buscarPreguntas('tarjeta qr').length === 0 && P.buscarPreguntas('qr enlace').length > 0);
verificar('B7 una palabra que no existe devuelve vacío', P.buscarPreguntas('zzzxxqq').length === 0);
verificar('B8 cada tema devuelto trae solo las preguntas que coinciden', P.buscarPreguntas('tarjeta').every((t) => t.preguntas.length > 0 && t.preguntas.length <= P.TEMAS_DE_AYUDA.find((o) => o.id === t.id).preguntas.length));
verificar('B9 el HTML escrito se trata como texto: no rompe ni coincide', P.buscarPreguntas('<b>hola</b>').length === 0 && P.buscarPreguntas('<script>').length === 0);
verificar('B10 la búsqueda no cambia la lista original', P.TEMAS_DE_AYUDA.length === 5 && P.TEMAS_DE_AYUDA[1].preguntas.length === 3);

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
