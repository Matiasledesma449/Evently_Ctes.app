// Prueba del pie común (cambio pagina-de-compra-mejorada): shared/pie-publico.js.
// Sin red, sin base de datos y sin navegador (el "document" es simulado).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// Es un modulo del navegador: se le quitan los "export" para cargarlo aca
const fuente = fs.readFileSync(path.join(RAIZ, 'shared', 'pie-publico.js'), 'utf8');
const codigo = fuente.replace(/^export /gm, '');

// Un "document" minimo: crea elementos que recuerdan sus hijos y su texto
function elementoFalso(tag) {
  return {
    tag, hijos: [], atributos: {}, className: '', href: '', _texto: '',
    set textContent(v) { this._texto = v; if (v === '') this.hijos = []; },
    get textContent() { return this._texto; },
    appendChild(h) { this.hijos.push(h); return h; },
    setAttribute(k, v) { this.atributos[k] = v; }
  };
}
const contexto = { document: { createElement: elementoFalso } };
const P = vm.runInNewContext(codigo + '\n;({ enlacesDelPie, enlacesLegales, dibujarPie, TEXTO_DE_DERECHOS, PAGINAS_CON_PIE })', contexto);

const textos = (pagina) => Array.from(P.enlacesDelPie(pagina)).map((e) => e.texto).join('|');
const hrefs = (pagina) => Array.from(P.enlacesDelPie(pagina)).map((e) => e.href).join('|');

// ---------- Links por página ----------
verificar('L1 en el evento: Inicio, Centro de ayuda y Enviar una consulta', textos('evento') === 'Inicio|Centro de ayuda|Enviar una consulta', textos('evento'));
verificar('L2 en el inicio no aparece Inicio', textos('inicio') === 'Centro de ayuda|Enviar una consulta', textos('inicio'));
verificar('L3 en soporte no aparece Centro de ayuda', textos('soporte') === 'Inicio|Enviar una consulta', textos('soporte'));
verificar('L4 "Enviar una consulta" lleva al formulario (#contacto)', hrefs('evento') === 'index.html|soporte.html|soporte.html#contacto', hrefs('evento'));
verificar('L5 una página desconocida o vacía recibe los tres links', textos('xyz') === textos('evento') && textos(undefined) === textos('evento'));
verificar('L6 los links de ayuda no mezclan los legales', !/arrepentimiento|t[eé]rminos|privacidad/i.test(JSON.stringify(P.enlacesDelPie('evento'))));
verificar('L7 las páginas del comprador tienen pie, también las legales', Array.from(P.PAGINAS_CON_PIE).join(',') === 'inicio,evento,soporte,terminos,privacidad,arrepentimiento');
const legales = (p) => Array.from(P.enlacesLegales(p)).map((e) => e.href).join('|');
verificar('L8 los legales: términos, privacidad y arrepentimiento', legales('evento') === 'terminos.html|privacidad.html|arrepentimiento.html', legales('evento'));
verificar('L9 en una página legal no se ofrece ir a ella misma', legales('terminos') === 'privacidad.html|arrepentimiento.html' && legales('arrepentimiento') === 'terminos.html|privacidad.html');

// ---------- Dibujo del pie ----------
const pie = elementoFalso('footer');
pie.hijos.push(elementoFalso('span')); // contenido viejo que debe desaparecer
P.dibujarPie(pie, 'evento');
verificar('D1 el pie tiene los links de ayuda, los legales y el texto de derechos', pie.hijos.length === 3 && pie.hijos[0].tag === 'nav' && pie.hijos[1].tag === 'nav' && pie.hijos[1].hijos.length === 3 && pie.hijos[2]._texto === '© 2024 Evently by Bali Group');
verificar('D2 se conserva el texto de derechos de siempre', P.TEXTO_DE_DERECHOS === '© 2024 Evently by Bali Group');
const links = pie.hijos[0].hijos;
verificar('D3 cada link es un <a> con su texto y su destino', links.length === 3 && links.every((a) => a.tag === 'a' && a.href && a._texto));
P.dibujarPie(pie, 'soporte');
verificar('D4 volver a dibujar reemplaza el pie y no lo duplica', pie.hijos.length === 3 && pie.hijos[0].hijos.length === 2);
let fallo = false;
try { P.dibujarPie(null, 'evento'); P.dibujarPie(undefined, 'inicio'); } catch (e) { fallo = true; }
verificar('D5 sin elemento no falla', !fallo);

// ---------- El módulo no arma HTML ----------
verificar('M1 el módulo usa textContent y no innerHTML ni insertAdjacentHTML', /textContent/.test(fuente) && !/innerHTML|insertAdjacentHTML|document\.write/.test(fuente.replace(/\/\/.*$/gm, '')));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
