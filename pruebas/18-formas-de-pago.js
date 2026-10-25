// Prueba de las formas de pago (cambio formas-de-pago-reales): shared/formas-de-pago.js
// y que ninguna pantalla ofrezca "Efectivo". Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// shared/formas-de-pago.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'formas-de-pago.js'), 'utf8').replace(/^export /gm, '');
const F = vm.runInNewContext(codigo + '\n;({ FORMAS_DE_PAGO, nombreParaMostrar, textoDeFormasDePago })');

// ---------- La lista compartida ----------
verificar('F1 la lista es Transferencia, Débito y Crédito', JSON.stringify(Array.from(F.FORMAS_DE_PAGO)) === JSON.stringify(['Transferencia', 'Débito', 'Crédito']));
verificar('F2 la lista no contiene Efectivo', !Array.from(F.FORMAS_DE_PAGO).some((f) => /efectivo/i.test(f)));
const texto = F.textoDeFormasDePago();
verificar('F3 el texto nombra cada forma una sola vez y no nombra el efectivo', Array.from(F.FORMAS_DE_PAGO).every((f) => texto.toLowerCase().split(f.toLowerCase()).length === 2) && !/efectivo/i.test(texto), texto);
verificar('F4 el texto se lee como lista ("a, b o c")', texto === 'transferencia, débito o crédito', texto);

// ---------- Nombre para mostrar (respuesta 5A) ----------
verificar('F5 "Dinero en cuenta" se muestra como "Transferencia"', F.nombreParaMostrar('Dinero en cuenta') === 'Transferencia' && F.nombreParaMostrar('  Dinero en cuenta ') === 'Transferencia');
verificar('F6 los demás nombres guardados se muestran igual (Crédito, Débito, Prepaga, Otro)', ['Crédito', 'Débito', 'Prepaga', 'Otro'].every((n) => F.nombreParaMostrar(n) === n));
verificar('F7 entradas raras no fallan y dan texto vacío', [undefined, null, 0, {}, []].every((x) => F.nombreParaMostrar(x) === ''));
verificar('F8 nombres del objeto base no se confunden con equivalencias', F.nombreParaMostrar('constructor') === 'constructor' && F.nombreParaMostrar('toString') === 'toString');

// ---------- Ninguna pantalla ofrece "Efectivo" ----------
// Se miran public/*.html, admin/*.html, validador.html y shared/*.js, sin los comentarios (ahí se puede explicar por qué se excluye).
function sinComentarios(texto) {
  return texto.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1');
}
// "Efectivo" como opción o valor de lista: <option ...Efectivo...>, o la palabra sola entre comillas
function ofreceEfectivo(texto) {
  const limpio = sinComentarios(texto);
  return /<option[^>]*>[^<]*efectivo/i.test(limpio) || /<option[^>]*value=["']efectivo["']/i.test(limpio) || /(["'`])efectivo\1/i.test(limpio);
}
function archivosDe(carpeta, extension) {
  const dir = path.join(RAIZ, carpeta);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((a) => a.endsWith(extension)).map((a) => path.join(carpeta, a)) : [];
}
const aMirar = [...archivosDe('public', '.html'), ...archivosDe('admin', '.html'), ...archivosDe('shared', '.js'), 'validador.html'].filter((a) => fs.existsSync(path.join(RAIZ, a)));
verificar('E0 se revisan las pantallas y los archivos compartidos', aMirar.length >= 10, String(aMirar.length));
const conEfectivo = aMirar.filter((a) => ofreceEfectivo(fs.readFileSync(path.join(RAIZ, a), 'utf8')));
verificar('E1 ninguna pantalla ni archivo compartido ofrece "Efectivo"', conEfectivo.length === 0, conEfectivo.join(', '));

// La propia revisión detecta el caso malo y deja pasar los comentarios
verificar('E2 detecta <option value="Efectivo"> y una lista con \'Efectivo\'', ofreceEfectivo('<select><option value="Efectivo">Efectivo</option></select>') && ofreceEfectivo("const m = ['Efectivo', 'Débito'];") && ofreceEfectivo('<option>Pago en efectivo</option>'));
verificar('E3 deja pasar comentarios y palabras que solo contienen "efectivo"', !ofreceEfectivo('<!-- no hay Efectivo -->') && !ofreceEfectivo("// el 'Efectivo' se excluye\nconst a = 1;") && !ofreceEfectivo('/* "Efectivo" */ window.rolEfectivo = function () {};'));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
