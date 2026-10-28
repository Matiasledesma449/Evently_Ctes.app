// Prueba de shared/banners.js (pedido 21): solo nombres de imagen simples llegan al estilo del banner.
// Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const codigo = fs.readFileSync(path.join(__dirname, '..', 'shared', 'banners.js'), 'utf8').replace(/^export /gm, '');
const B = vm.runInNewContext(codigo + '\n;({ IMAGENES_DE_BANNERS, urlDeBanner })');

verificar('B1 las cuatro páginas con banner están en la lista', Object.keys(B.IMAGENES_DE_BANNERS).join(',') === 'soporte,terminos,privacidad,arrepentimiento');
verificar('B2 sin imagen no hay dirección', B.urlDeBanner('soporte', { soporte: '' }) === '' && B.urlDeBanner('inexistente') === '');
verificar('B3 un nombre simple va a assets/banners', B.urlDeBanner('soporte', { soporte: 'centro-de-ayuda.jpg' }) === 'assets/banners/centro-de-ayuda.jpg');
verificar('B4 se rechazan carpetas, comillas, direcciones y otros formatos',
  ['../x.jpg', 'a/b.png', 'x.jpg") , url("y', 'https://x.co/a.jpg', 'imagen.svg', 'sin-extension', '.oculto.png'].every((n) => B.urlDeBanner('soporte', { soporte: n }) === ''));
verificar('B5 no se lee algo heredado como "toString"', B.urlDeBanner('toString', {}) === '');

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
