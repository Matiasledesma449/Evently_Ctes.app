// Prueba de shared/categorias-comision.js (change costo-de-servicio, tarea 4.2): validación de lo que escribe
// el superadmin, ids nuevos y orden. Funciones puras: sin red, sin Firebase y sin navegador.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = path.join(__dirname, '..');

// Los módulos compartidos son del navegador: se cargan juntos y sin "export"/"import", como en las otras pruebas
const quitar = (archivo) => fs.readFileSync(path.join(REPO, 'shared', archivo), 'utf8').replace(/^export /gm, '').replace(/^import .*$/gm, '');
const contexto = {};
vm.createContext(contexto);
vm.runInContext(quitar('comision.js') + ';' + quitar('categorias-comision.js')
  + ';this.api = { validarCategoria, categoriasOrdenadas, nuevoIdDeCategoria, textoDePorcentaje };', contexto);
const { validarCategoria, categoriasOrdenadas, nuevoIdDeCategoria, textoDePorcentaje } = contexto.api;

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};
const campo = (r) => (r.ok ? 'ok' : r.campo);

// ---------- Valores válidos ----------
for (const [nombre, entrada, esperado] of [
  ['8 como número', { nombre: 'Estándar', porcentaje: 8 }, 8],
  ['"8" como texto', { nombre: 'Estándar', porcentaje: '8' }, 8],
  ['"7,5" con coma', { nombre: 'Especial', porcentaje: '7,5' }, 7.5],
  ['"7.5" con punto', { nombre: 'Especial', porcentaje: '7.5' }, 7.5],
  ['12,25 con dos decimales', { nombre: 'X', porcentaje: '12,25' }, 12.25],
  ['0 (sin costo)', { nombre: 'Sin costo', porcentaje: 0 }, 0],
  ['30 (el tope)', { nombre: 'Tope', porcentaje: '30' }, 30],
  ['con espacios alrededor', { nombre: '  Mi   categoría ', porcentaje: ' 5 ' }, 5],
]) {
  const r = validarCategoria(entrada);
  verificar(nombre + ': se acepta', r.ok === true && r.datos.porcentaje === esperado, JSON.stringify(r));
}
verificar('el nombre se limpia (espacios de más)', validarCategoria({ nombre: '  Mi   categoría ', porcentaje: 5 }).datos.nombre === 'Mi categoría');

// ---------- Porcentajes inválidos ----------
for (const [nombre, valor] of [
  ['80', '80'], ['31', 31], ['30,01', '30,01'], ['"ocho"', 'ocho'], ['vacío', ''], ['solo espacios', '   '], ['negativo', '-1'], ['negativo como número', -5],
  ['tres decimales', '7,555'], ['tres decimales como número', 7.555], ['notación científica', '1e1'], ['hexadecimal', '0x10'], ['con signo %', '8%'],
  ['dos comas', '7,5,1'], ['NaN', NaN], ['infinito', Infinity], ['nulo', null], ['indefinido', undefined], ['objeto', { a: 1 }], ['arreglo', [8]], ['booleano', true],
]) {
  const r = validarCategoria({ nombre: 'Estándar', porcentaje: valor });
  verificar('porcentaje ' + nombre + ': se rechaza con mensaje claro', r.ok === false && r.campo === 'porcentaje' && /entre 0 y 30/.test(r.mensaje), JSON.stringify(r));
}

// ---------- Nombres inválidos ----------
for (const [nombre, valor] of [['vacío', ''], ['solo espacios', '    '], ['41 caracteres', 'a'.repeat(41)], ['no es texto', 42], ['nulo', null], ['indefinido', undefined]]) {
  const r = validarCategoria({ nombre: valor, porcentaje: 8 });
  verificar('nombre ' + nombre + ': se rechaza', campo(r) === 'nombre', JSON.stringify(r));
}
verificar('nombre de 40 caracteres: se acepta', validarCategoria({ nombre: 'a'.repeat(40), porcentaje: 8 }).ok === true);
verificar('sin argumentos no rompe', campo(validarCategoria()) === 'nombre' && campo(validarCategoria(null)) === 'nombre');
verificar('un nombre con código se guarda como texto, sin tocarlo (se escapa al mostrarlo)', validarCategoria({ nombre: '<b>x</b>', porcentaje: 8 }).datos.nombre === '<b>x</b>');

// ---------- Ids nuevos ----------
verificar('primer id: cat-1', nuevoIdDeCategoria([]) === 'cat-1' && nuevoIdDeCategoria(undefined) === 'cat-1' && nuevoIdDeCategoria(null) === 'cat-1');
verificar('sigue al número más alto', nuevoIdDeCategoria([{ id: 'cat-1' }, { id: 'cat-4' }]) === 'cat-5');
verificar('no repite un id aunque haya huecos', nuevoIdDeCategoria([{ id: 'cat-2' }]) === 'cat-3');
verificar('ignora ids que no siguen el formato', nuevoIdDeCategoria([{ id: 'otra' }, { id: 'cat-x' }, null, {}]) === 'cat-1');
verificar('ids repetidos al crear dos seguidas: no se repiten', (() => {
  const lista = [];
  for (let i = 0; i < 5; i++) lista.push({ id: nuevoIdDeCategoria(lista) });
  return new Set(lista.map((c) => c.id)).size === 5;
})());

// ---------- Orden ----------
const ordenadas = categoriasOrdenadas({ categorias: [
  { id: 'cat-2', nombre: 'Zeta', porcentaje: 3 }, { id: 'cat-1', nombre: 'álamo', porcentaje: 8 }, { id: 'cat-3', nombre: 'Beta', porcentaje: 0 },
  { nombre: 'sin id', porcentaje: 1 }, null, 5, { id: '', nombre: 'id vacío' },
] });
verificar('ordena por nombre (con acentos) y descarta lo que no tiene id', ordenadas.map((c) => c.nombre).join() === 'álamo,Beta,Zeta', ordenadas.map((c) => c.nombre).join());
verificar('sin configuración devuelve lista vacía', categoriasOrdenadas(null).length === 0 && categoriasOrdenadas({}).length === 0 && categoriasOrdenadas({ categorias: 'x' }).length === 0);

// ---------- Texto ----------
verificar('porcentaje en texto: 8 -> "8%" y 7,5 -> "7,5%"', textoDePorcentaje(8) === '8%' && textoDePorcentaje(7.5) === '7,5%' && textoDePorcentaje('x') === '0%');

// ---------- Pantalla del superadmin (admin/eventos-seleccion.html): revisión del archivo ----------
{
  const html = fs.readFileSync(path.join(REPO, 'admin', 'eventos-seleccion.html'), 'utf8');
  const modulos = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const js = modulos.find((m) => m.includes('renderizarListaEventos')) || '';
  let compila = true;
  try { new vm.Script(js.replace(/^\s*import .*$/gm, '')); } catch (e) { compila = false; console.log('     ' + e.message); }
  verificar('el JavaScript de la pantalla de eventos no tiene errores de sintaxis', js !== '' && compila);
  verificar('el panel de categorías ya no está en Eventos (pasó a Crear evento)', !/panelServicio|formNuevaCategoria|setDoc/.test(html));
  verificar('las tarjetas de Eventos ya no tienen el costo de servicio ni "Editar lotes" (se eligen al crear el evento)', !/htmlSelectorServicio|data-servicio-evento|data-editar-lotes|Editar lotes/.test(html));
  verificar('la pantalla no borra categorías ni eventos', !/deleteDoc|deleteField/.test(js));
}

// ---------- Crear evento (admin/eventos.html + admin/crear-evento-superadmin.js): categorías y categoría del evento ----------
{
  const html = fs.readFileSync(path.join(REPO, 'admin', 'eventos.html'), 'utf8');
  const js = fs.readFileSync(path.join(REPO, 'admin', 'crear-evento-superadmin.js'), 'utf8');
  let compila = true;
  try { new vm.Script(js.replace(/^\s*import .*$/gm, '').replace(/^export /gm, '')); } catch (e) { compila = false; console.log('     ' + e.message); }
  verificar('el JavaScript de Crear evento del superadmin no tiene errores de sintaxis', compila);
  verificar('el panel de categorías y el bloque del superadmin empiezan ocultos', /id="panelServicio" class="hidden/.test(html) && /id="bloqueSuperadmin" class="hidden/.test(html));
  verificar('solo se cargan en modo directo (el del superadmin)', /modoDirecto \? import\('\.\/crear-evento-superadmin\.js'\)/.test(html));
  verificar('las filas de categorías se arman con value/textContent, no con innerHTML', !/innerHTML/.test(js));
  verificar('el evento lleva la categoría solo si se eligió una que existe', /categoria && categorias\.some\(\(c\) => c\.id === categoria\) \? \{ comisionCategoriaId: categoria \}/.test(js));
  verificar('no se puede publicar sin elegir la organización', /throw new Error\('Elegí la organización del evento\.'\)/.test(js));
  verificar('Crear evento no borra categorías ni eventos', !/deleteDoc|deleteField/.test(js));
}

console.log(mal === 0 ? '\nTodo bien.' : '\nFALLARON ' + mal + ' casos.');
process.exit(mal ? 1 : 0);
