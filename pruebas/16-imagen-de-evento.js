// Prueba de la imagen de un evento (cambio imagenes-de-eventos): shared/imagen-evento.js.
// Funciones puras: sin red, sin base de datos y sin navegador (el DOM se simula con un objeto mínimo).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// shared/imagen-evento.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'imagen-evento.js'), 'utf8').replace(/^export /gm, '');
const I = vm.runInNewContext(codigo + '\n;({ direccionDeImagenValida, rellenoDelEvento, imagenDelEvento, htmlDeImagenEvento, crearImagenEvento })');

const FOTO = 'https://firebasestorage.googleapis.com/v0/b/x/o/eventos_solicitudes%2Fu1%2F1.jpg?alt=media&token=abc';
const ev = (id, nombre, imagen) => ({ id, nombre, imagen });

// ---------- Foto valida o relleno ----------
verificar('I1 un evento con foto https valida muestra esa foto', I.imagenDelEvento(ev('a', 'Fiesta', FOTO)).src === FOTO);
verificar('I2 la foto se recorta (espacios al principio y al final)', I.imagenDelEvento(ev('a', 'Fiesta', '  ' + FOTO + '  ')).src === FOTO);
const invalidas = ['', '   ', undefined, null, 42, {}, 'javascript:alert(1)', 'http://sitio.test/a.jpg', 'data:image/png;base64,AAAA', '//sitio.test/a.jpg', 'https://sitio.test/a b.jpg', 'https://sitio.test/a\n.jpg', './imag/Imagen de evento 1.jpg', 'https://'];
verificar('I3 vacia, ausente, de otro tipo, javascript:, http:, data:, relativa o con espacios: no hay foto', invalidas.every((x) => I.imagenDelEvento(ev('a', 'Fiesta', x)).src === ''), JSON.stringify(invalidas.filter((x) => I.imagenDelEvento(ev('a', 'Fiesta', x)).src !== '')));
verificar('I4 con cualquier entrada rara no falla y siempre hay relleno', [undefined, null, 0, 'texto', [], {}].every((x) => { const r = I.imagenDelEvento(x); return r.src === '' && !!r.relleno.letra && !!r.relleno.fondo && !!r.relleno.texto; }));

// ---------- Relleno propio y estable ----------
verificar('I5 la letra es la inicial del nombre en mayuscula', I.rellenoDelEvento(ev('a', 'noche de gala')).letra === 'N' && I.rellenoDelEvento(ev('a', '  ¡Fiesta!')).letra === 'F' && I.rellenoDelEvento(ev('a', 'Ñandú')).letra === 'Ñ' && I.rellenoDelEvento(ev('a', '2x1 Jueves')).letra === '2');
verificar('I6 evento sin nombre (o con nombre vacio o solo simbolos) muestra "?" y no falla', ['', '   ', '***', undefined, null, 7].every((n) => I.rellenoDelEvento(ev('a', n)).letra === '?') && I.rellenoDelEvento().letra === '?');
verificar('I7 el mismo evento da siempre el mismo relleno', JSON.stringify(I.rellenoDelEvento(ev('E-1', 'Fiesta'))) === JSON.stringify(I.rellenoDelEvento(ev('E-1', 'Fiesta'))));
const ids = ['CEflwN8zsUKBFstp2pgM', 'FdUEFpgLWbHql2vq9t4j', 'I2j3y6xhu77568I8D7WF', 'eaqhxzfvaEb0fghlBbVT', 'EVT1', 'EVT2'];
const colores = new Set(ids.map((id) => I.rellenoDelEvento(ev(id, 'Dia del Padre')).fondo));
verificar('I8 con el mismo nombre ("Dia del Padre" repetido en datos reales), ids distintos no quedan todos con el mismo color', colores.size >= 3, [...colores].join(' '));
verificar('I9 el color sale de la paleta fija (solo violetas/indigos conocidos)', ids.every((id) => /^#[0-9a-f]{6}$/.test(I.rellenoDelEvento(ev(id, 'X')).fondo) && /^#[0-9a-f]{6}$/.test(I.rellenoDelEvento(ev(id, 'X')).texto)));
verificar('I10 sin id el color sale del nombre, y es estable', I.rellenoDelEvento({ nombre: 'Gala' }).fondo === I.rellenoDelEvento({ nombre: 'Gala' }).fondo);
verificar('I11 dos eventos sin foto con ids distintos se distinguen por letra o por color', (() => {
  const pares = []; for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pares.push([ids[i], ids[j]]);
  const distintos = pares.filter(([a, b]) => { const x = I.rellenoDelEvento(ev(a, 'Dia del Padre')); const y = I.rellenoDelEvento(ev(b, 'Dia del Padre')); return x.fondo !== y.fondo; });
  return distintos.length >= pares.length * 0.7;
})());

// ---------- HTML seguro ----------
{
  const malo = ev('<x>', '<img src=x onerror=alert(1)>', 'https://sitio.test/a.jpg"onerror="alert(2)');
  const html = I.htmlDeImagenEvento(malo, { clases: 'h-64" onclick="alert(3)' });
  // sin atributos ni etiquetas inyectadas: lo que viene de los datos solo aparece con < > " ' escapados
  const etiquetas = (html.match(/<[a-z]+/gi) || []).map((t) => t.toLowerCase());
  const atributos = (html.match(/<[a-z]+[^>]*>/gi) || []).map((t) => t.replace(/="[^"]*"/g, '=""').match(/\s[a-z-]+=""/g).map((x) => x.trim().replace('=""', '')).join(' '));
  verificar('I12 un nombre, id, clase o direccion con codigo no agrega etiquetas ni atributos nuevos', etiquetas.join() === '<div,<span,<img' && !atributos.join(' ').includes('onclick') && atributos[2] === 'src alt loading class onerror', JSON.stringify(atributos));
  verificar('I13 el nombre se ve como texto (escapado)', html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  const conFoto = I.htmlDeImagenEvento(ev('a', 'Fiesta', FOTO));
  verificar('I14 con foto: hay <img> con la foto y el relleno queda detras; si no carga se quita (onerror)', /<img [^>]*src="https:\/\/firebasestorage[^"]*"/.test(conFoto) && /onerror="this\.remove\(\)"/.test(conFoto) && conFoto.indexOf('<span') < conFoto.indexOf('<img'));
  const sinFoto = I.htmlDeImagenEvento(ev('a', 'Fiesta', ''));
  verificar('I15 sin foto: no hay <img> y se ve la letra', !/<img/.test(sinFoto) && />F<\/span>/.test(sinFoto));
  verificar('I16 el mismo evento da el mismo HTML siempre', I.htmlDeImagenEvento(ev('a', 'Fiesta', FOTO)) === I.htmlDeImagenEvento(ev('a', 'Fiesta', FOTO)) && I.htmlDeImagenEvento(ev('a', 'Fiesta', '')) === I.htmlDeImagenEvento(ev('a', 'Fiesta', '')));
  verificar('I17 con entradas raras no falla', [undefined, null, 5, 'x'].every((x) => typeof I.htmlDeImagenEvento(x) === 'string'));
  verificar('I18 el marcador data-imagen-evento identifica lo que se ve (foto o relleno)', conFoto.includes(`data-imagen-evento="${FOTO.replace(/&/g, '&amp;')}"`) && /data-imagen-evento="relleno:F:#[0-9a-f]{6}"/.test(sinFoto));
}

// ---------- Version con elementos ----------
{
  const crear = (tag) => { const hijos = []; const attrs = {}; const oyentes = {}; return { tag, hijos, attrs, oyentes, style: {}, className: '', textContent: '', setAttribute(k, v) { attrs[k] = v; }, appendChild(h) { hijos.push(h); h.padre = this; }, addEventListener(t, f) { oyentes[t] = f; }, remove() { if (this.padre) this.padre.hijos.splice(this.padre.hijos.indexOf(this), 1); } }; };
  const doc = { createElement: crear };
  const conFoto = I.crearImagenEvento(ev('a', '<b>Fiesta</b>', FOTO), doc, { clases: 'h-40' });
  verificar('I19 crearImagenEvento: contenedor con letra y foto, nombre y clases sin interpretar', conFoto.hijos.length === 2 && conFoto.hijos[1].src === FOTO && conFoto.className.includes('h-40') && conFoto.attrs['aria-label'] === '<b>Fiesta</b>');
  conFoto.hijos[1].oyentes.error();
  verificar('I20 crearImagenEvento: si la foto no carga se quita y queda el relleno', conFoto.hijos.length === 1 && conFoto.hijos[0].textContent !== '');
  const sin = I.crearImagenEvento(ev('a', 'Fiesta', 'javascript:alert(1)'), doc);
  verificar('I21 crearImagenEvento con direccion peligrosa: solo relleno, sin <img>', sin.hijos.length === 1 && sin.attrs['data-imagen-evento'].startsWith('relleno:F:'));
}

// ---------- Las paginas usan la funcion compartida (sin rellenos propios) ----------
{
  const leer = (...p) => fs.readFileSync(path.join(RAIZ, ...p), 'utf8');
  const paginas = { 'public/index.html': leer('public', 'index.html'), 'public/evento.html': leer('public', 'evento.html'), 'admin/eventos-seleccion.html': leer('admin', 'eventos-seleccion.html'), 'admin/aprobaciones.js': leer('admin', 'aprobaciones.js') };
  const sinUsar = Object.keys(paginas).filter((n) => !/imagen-evento\.js/.test(paginas[n]));
  verificar('I22 las cuatro paginas que muestran un evento importan shared/imagen-evento.js', sinUsar.length === 0, sinUsar.join(', '));
  const viejos = Object.keys(paginas).filter((n) => /Imagen de evento 1\.jpg|images\.unsplash\.com/.test(paginas[n]));
  verificar('I23 ninguna pagina conserva su propio relleno (la foto repetida ni Unsplash)', viejos.length === 0, viejos.join(', '));
  verificar('I24 aprobar una solicitud sigue copiando su foto al evento', /dataEvento\.imagen\s*=\s*typeof solicitud\.imagen === 'string'/.test(paginas['admin/aprobaciones.js']));
  verificar('I25 evento.html y la lista de Eventos escapan el nombre del evento', /escaparHtml\(evento\.nombre/.test(paginas['public/evento.html']) && /escaparHtml\(evento\.nombre/.test(paginas['admin/eventos-seleccion.html']));
}

console.log(mal === 0 ? '\nTodos los casos pasaron.' : `\n${mal} caso(s) con problemas.`);
process.exit(mal === 0 ? 0 : 1);
