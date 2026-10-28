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
    append(...hs) { hs.forEach((h) => this.hijos.push(h)); },
    setAttribute(k, v) { this.atributos[k] = v; }
  };
}
const contexto = { document: { createElement: elementoFalso } };
const P = vm.runInNewContext(codigo + '\n;({ enlacesDelPie, enlacesLegales, dibujarPie, TEXTO_DE_DERECHOS, PAGINAS_CON_PIE })', contexto);

const textos = (pagina) => Array.from(P.enlacesDelPie(pagina)).map((e) => e.texto).join('|');
const hrefs = (pagina) => Array.from(P.enlacesDelPie(pagina)).map((e) => e.href).join('|');

// ---------- Links por página (pedido 20: siempre los mismos, en el mismo orden) ----------
const actuales = (lista) => Array.from(lista).filter((e) => e.actual).map((e) => e.id).join(',');
verificar('L1 los links de ayuda: Centro de ayuda y Enviar una consulta (Inicio está en la cabecera)', textos('evento') === 'Centro de ayuda|Enviar una consulta', textos('evento'));
verificar('L2 en el inicio están los mismos dos, sin ninguno marcado', textos('inicio') === textos('evento') && actuales(P.enlacesDelPie('inicio')) === '');
verificar('L3 en soporte están los mismos dos, con Centro de ayuda marcado', textos('soporte') === textos('evento') && actuales(P.enlacesDelPie('soporte')) === 'ayuda');
verificar('L4 "Enviar una consulta" lleva al formulario (#contacto)', hrefs('evento') === 'soporte.html|soporte.html#contacto', hrefs('evento'));
verificar('L5 una página desconocida o vacía recibe los dos links sin marcar', textos('xyz') === textos('evento') && actuales(P.enlacesDelPie(undefined)) === '');
verificar('L6 los links de ayuda no mezclan los legales', !/arrepentimiento|t[eé]rminos|privacidad/i.test(JSON.stringify(P.enlacesDelPie('evento'))));
verificar('L7 las páginas del comprador tienen pie, también las legales', Array.from(P.PAGINAS_CON_PIE).join(',') === 'inicio,evento,soporte,terminos,privacidad,arrepentimiento');
const legales = (p) => Array.from(P.enlacesLegales(p)).map((e) => e.href).join('|');
verificar('L8 los legales: términos, privacidad y arrepentimiento', legales('evento') === 'terminos.html|privacidad.html|arrepentimiento.html', legales('evento'));
verificar('L9 en una página legal siguen los tres, en el mismo orden, con la actual marcada',
  legales('terminos') === legales('evento') && legales('arrepentimiento') === legales('evento') && actuales(P.enlacesLegales('privacidad')) === 'privacidad');

// ---------- Dibujo del pie ----------
// Estructura: footer > contenedor > [fila (logo, links, espacio), línea, derechos]
const pie = elementoFalso('footer');
pie.hijos.push(elementoFalso('span')); // contenido viejo que debe desaparecer
P.dibujarPie(pie, 'evento');
const cont = pie.hijos[0];
const [fila, linea, derechos] = cont.hijos;
const [logo, nav, espacio] = fila.hijos;
verificar('D1 el pie tiene la fila (logo, links, espacio), una línea y los derechos', pie.hijos.length === 1 && cont.hijos.length === 3 && linea.tag === 'hr' && nav.tag === 'nav' && derechos._texto === '© 2026 Evently by Bali Group');
verificar('D2 los derechos dicen 2026', P.TEXTO_DE_DERECHOS === '© 2026 Evently by Bali Group');
verificar('D3 el logo de Evently va a la izquierda y lleva al inicio', logo.tag === 'a' && logo.href === 'index.html' && logo._texto === 'Evently' && /(^| )justify-self-start/.test(logo.className));
verificar('D4 los cinco links, centrados, cada uno con texto y destino', nav.hijos.length === 5 && /justify-center/.test(nav.className) && nav.hijos.every((a) => a.tag === 'a' && a.href && a._texto));
verificar('D5 sin logos de marcas: a la derecha queda solo un espacio vacío (pedido de la persona)', espacio.tag === 'div' && espacio.hijos.length === 0 && !/cargarLogosDelPie|logosPie/.test(fuente));
P.dibujarPie(pie, 'terminos');
const navTerminos = pie.hijos[0].hijos[0].hijos[1];
verificar('D6 volver a dibujar reemplaza el pie; en Términos siguen los 5 links y el actual va marcado',
  pie.hijos.length === 1 && navTerminos.hijos.length === 5 && navTerminos.hijos[2].atributos['aria-current'] === 'page' && navTerminos.hijos[2]._texto === 'Términos y condiciones');
let fallo = false;
try { P.dibujarPie(null, 'evento'); P.dibujarPie(undefined, 'inicio'); } catch (e) { fallo = true; }
verificar('D7 sin elemento no falla', !fallo);

// ---------- El módulo no arma HTML ----------
verificar('M1 el módulo usa textContent y no innerHTML ni insertAdjacentHTML', /textContent/.test(fuente) && !/innerHTML|insertAdjacentHTML|document\.write/.test(fuente.replace(/\/\/.*$/gm, '')));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
