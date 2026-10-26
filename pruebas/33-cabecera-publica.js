// Prueba de shared/cabecera-publica.js (cambio ajustes-tras-vista-previa): la cabecera común del sitio del comprador.
// Sin red ni navegador: se usa un document falso mínimo.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

function elementoFalso(tag) {
  return {
    tag, hijos: [], atributos: {}, className: '', href: '', _texto: '',
    set textContent(v) { this._texto = v; if (v === '') this.hijos = []; }, get textContent() { return this._texto; },
    appendChild(h) { this.hijos.push(h); return h; }, append(...hs) { hs.forEach((h) => this.hijos.push(h)); },
    setAttribute(k, v) { this.atributos[k] = v; },
  };
}
const contexto = { document: { createElement: elementoFalso } };
const fuente = fs.readFileSync(path.join(RAIZ, 'shared', 'cabecera-publica.js'), 'utf8');
const C = vm.runInNewContext(fuente.replace(/^export /gm, '') + '\n;({ dibujarCabecera, ENLACES_DE_CABECERA })', contexto);

const dibujar = (pagina) => { const h = elementoFalso('header'); C.dibujarCabecera(h, pagina); return h; };
const partes = (h) => { const c = h.hijos[0]; return { logo: c.hijos[0], links: c.hijos[1].hijos }; };

const ini = partes(dibujar('inicio'));
verificar('C1 el logo dice Evently y lleva al inicio', ini.logo.tag === 'a' && ini.logo._texto === 'Evently' && ini.logo.href === 'index.html');
verificar('C2 hay dos links: Eventos y Centro de ayuda', ini.links.map((a) => a._texto).join('|') === 'Eventos|Centro de ayuda');
verificar('C3 en el inicio, "Eventos" se marca como la página actual', ini.links[0].atributos['aria-current'] === 'page' && !ini.links[1].atributos['aria-current']);
verificar('C4 desde el inicio y el evento el Centro de ayuda lleva el origen', ini.links[1].href === 'soporte.html?origen=public/index.html' && partes(dibujar('evento')).links[1].href === 'soporte.html?origen=public/evento.html');
const sop = partes(dibujar('soporte'));
verificar('C5 en el Centro de ayuda se marca ese link y no lleva origen', sop.links[1].atributos['aria-current'] === 'page' && sop.links[1].href === 'soporte.html');
verificar('C6 en las páginas legales ningún link se marca como actual', partes(dibujar('terminos')).links.every((a) => !a.atributos['aria-current']));
const h = dibujar('evento'); C.dibujarCabecera(h, 'evento');
verificar('C7 volver a dibujar no duplica la cabecera', h.hijos.length === 1);
let fallo = false;
try { C.dibujarCabecera(null, 'inicio'); } catch (e) { fallo = true; }
verificar('C8 sin elemento no falla', !fallo);
verificar('C9 el módulo no usa innerHTML', !/innerHTML|insertAdjacentHTML/.test(fuente.replace(/\/\/.*$/gm, '')));
const paginas = ['index', 'evento', 'soporte', 'terminos', 'privacidad', 'arrepentimiento'];
verificar('C10 las seis páginas del comprador usan la cabecera común', paginas.every((p) => /<header id="cabecera"/.test(fs.readFileSync(path.join(RAIZ, 'public', p + '.html'), 'utf8'))));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
