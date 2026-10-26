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

// ---------- Ventas, Reportes y Dashboard muestran "Transferencia" (tarea 1.3) ----------
const leer = (a) => fs.readFileSync(path.join(RAIZ, a), 'utf8');
const sinExport = leer('shared/ventas-utils.js').replace(/^export /gm, '');
const VU = vm.runInNewContext(sinExport + '\n;({ tarjetasDeResumen, cifrasDelEvento, seccionesDelPdf })');
const cifrasConMetodo = { capacidad: 10, entradas: 1, aforoRestante: 9, ocupacion: 10, recaudado: 1, confirmadas: 1, pendientes: 0, promedioEntradas: 1, loteMasVendido: null, loteMasRentable: null, metodoMasUsado: { nombre: 'Dinero en cuenta', cantidad: 1, porcentaje: 100 } };
const valorMetodo = (tarjetas) => tarjetas.find((t) => t.id === 'metodo').valor;
verificar('T1 la tarjeta "Método más usado" muestra "Transferencia" con la equivalencia', valorMetodo(VU.tarjetasDeResumen(cifrasConMetodo, F.nombreParaMostrar)) === 'Transferencia');
verificar('T2 sin equivalencia la tarjeta muestra el nombre guardado', valorMetodo(VU.tarjetasDeResumen(cifrasConMetodo)) === 'Dinero en cuenta');
verificar('T3 sin datos la tarjeta sigue mostrando "—"', valorMetodo(VU.tarjetasDeResumen(null, F.nombreParaMostrar)) === '—');
for (const pantalla of ['admin/ventas.html', 'admin/reportes.html', 'admin/dashboard.html']) {
  const html = leer(pantalla);
  verificar(`T4 ${pantalla} importa nombreParaMostrar de formas-de-pago.js`, /import \{ nombreParaMostrar[^}]*\} from "\.\.\/shared\/formas-de-pago\.js"/.test(html));
}
verificar('T5 Ventas y Reportes no muestran metodo_pago sin pasar por nombreParaMostrar', !/escaparHtml\(v\.metodo_pago \|\|/.test(leer('admin/ventas.html') + leer('admin/reportes.html')));
verificar('T6 los desplegables ofrecen la lista fija (opcionesDeFiltroDePago) y filtran por claveDeFormaDePago', ['admin/ventas.html', 'admin/reportes.html'].every((f) => /opcionesDeFiltroDePago\(ventas\)/.test(leer(f)) && /claveDeFormaDePago/.test(leer(f)) && /<option value="\$\{escaparHtml\(m\)\}">/.test(leer(f))));
verificar('T7 Dashboard y Reportes pasan nombreParaMostrar a las tarjetas', /tarjetasDeResumen\(cifras, nombreParaMostrar\)/.test(leer('admin/dashboard.html')) && /tarjetasDeResumen\(cifras, nombreParaMostrar\)/.test(leer('admin/reportes.html')));

// ---------- Secciones del PDF de Reportes (tarea 3.1) ----------
const TODAS = ['resumen', 'lotes', 'detalle', 'metodos', 'indicadores'];
const numeros = (lista) => Array.from(lista).map((s) => s.numero).join(',');
const claves = (lista) => Array.from(lista).map((s) => s.clave).join(',');
const todas = VU.seccionesDelPdf(TODAS);
verificar('P1 todas marcadas da 5 secciones numeradas 1 a 5', todas.length === 5 && numeros(todas) === '1,2,3,4,5', numeros(todas));
const sinDetalle = VU.seccionesDelPdf(TODAS.filter((c) => c !== 'detalle'));
verificar('P2 sin "detalle" da 4 secciones numeradas 1 a 4 sin saltos', sinDetalle.length === 4 && numeros(sinDetalle) === '1,2,3,4' && !claves(sinDetalle).includes('detalle'), claves(sinDetalle));
verificar('P3 el orden es fijo aunque se marquen en otro orden', claves(VU.seccionesDelPdf(['indicadores', 'resumen', 'metodos'])) === 'resumen,metodos,indicadores');
verificar('P4 claves desconocidas o repetidas se ignoran', claves(VU.seccionesDelPdf(['resumen', 'resumen', 'xyz', 'constructor', 7, null])) === 'resumen');
verificar('P5 lista vacía, null y entradas raras devuelven vacío sin fallar', [[], null, undefined, 'resumen', 5, {}].every((x) => VU.seccionesDelPdf(x).length === 0));
verificar('P6 cada sección trae su título', todas[0].titulo === 'Resumen general' && todas[2].titulo === 'Detalle de transacciones' && todas[4].titulo === 'Indicadores clave');

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
