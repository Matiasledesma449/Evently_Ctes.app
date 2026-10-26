// Prueba del evento activo y del nombre del archivo del PDF (cambio evento-activo-en-todo-el-panel):
// elegirEventoActivo y nombreDeArchivoDeReporte de shared/ventas-utils.js. Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// shared/ventas-utils.js es un modulo del navegador: se le quitan los "export" para cargarlo aca
const codigo = fs.readFileSync(path.join(RAIZ, 'shared', 'ventas-utils.js'), 'utf8').replace(/^export /gm, '');
const U = vm.runInNewContext(codigo + '\n;({ elegirEventoActivo, nombreDeArchivoDeReporte })');

// ---------- Evento activo (tarea 1.1) ----------
verificar('A1 la dirección (?id=) gana sobre lo recordado', U.elegirEventoActivo('abc', 'xyz') === 'abc');
verificar('A2 sin dirección se usa el recordado', U.elegirEventoActivo(null, 'xyz') === 'xyz' && U.elegirEventoActivo('', 'xyz') === 'xyz');
verificar('A3 sin nada da texto vacío', U.elegirEventoActivo(null, null) === '' && U.elegirEventoActivo(undefined, undefined) === '' && U.elegirEventoActivo('', '') === '');
verificar('A4 "todos" de la dirección se respeta (Reportes)', U.elegirEventoActivo('todos', 'xyz') === 'todos');
verificar('A5 "todos" nunca se toma de lo recordado', U.elegirEventoActivo(null, 'todos') === '');
verificar('A6 entradas raras no fallan', [[7, {}], [[], 0], [{}, []]].every(([a, b]) => U.elegirEventoActivo(a, b) === ''));
verificar('A7 el selector usa la regla compartida', /elegirEventoActivo\(deLaDireccion, recordado\)/.test(fs.readFileSync(path.join(RAIZ, 'shared', 'selector-evento.js'), 'utf8')));

// ---------- Nombre del archivo del PDF (tarea 1.2) ----------
const dia = '2026-10-25';
verificar('N1 "Fiesta de Verano" da el nombre esperado', U.nombreDeArchivoDeReporte('Fiesta de Verano', dia) === 'Evently_Reporte_Fiesta-de-Verano_2026-10-25.pdf', U.nombreDeArchivoDeReporte('Fiesta de Verano', dia));
verificar('N2 sin tildes ni eñes', U.nombreDeArchivoDeReporte('Música en Corrientes ñandú', dia) === 'Evently_Reporte_Musica-en-Corrientes-nandu_2026-10-25.pdf', U.nombreDeArchivoDeReporte('Música en Corrientes ñandú', dia));
const raro = U.nombreDeArchivoDeReporte('Noche/de "Rock" <3', dia);
verificar('N3 sin / comillas ni < en el nombre', !/[\/"<>\\]/.test(raro) && /^Evently_Reporte_Noche-de-Rock-3_2026-10-25\.pdf$/.test(raro), raro);
verificar('N4 nombre vacío, nulo o raro da Todos-los-eventos', ['', '   ', null, undefined, 5, {}, '///'].every((n) => U.nombreDeArchivoDeReporte(n, dia) === 'Evently_Reporte_Todos-los-eventos_2026-10-25.pdf'));
const largo = U.nombreDeArchivoDeReporte('a'.repeat(300), dia);
verificar('N5 el nombre del evento tiene un largo máximo', largo.length <= 'Evently_Reporte_'.length + 40 + '_2026-10-25.pdf'.length, String(largo.length));
verificar('N6 al cortar no queda un guión antes de la fecha', !/-_/.test(U.nombreDeArchivoDeReporte('a'.repeat(39) + ' bbbbb', dia)));
verificar('N7 la fecha puede ser un Date', U.nombreDeArchivoDeReporte('X', new Date('2026-01-02T12:00:00Z')) === 'Evently_Reporte_X_2026-01-02.pdf');
verificar('N8 una fecha inválida no falla y deja una fecha', /^Evently_Reporte_X_\d{4}-\d{2}-\d{2}\.pdf$/.test(U.nombreDeArchivoDeReporte('X', 'ayer')) && /^Evently_Reporte_X_\d{4}-\d{2}-\d{2}\.pdf$/.test(U.nombreDeArchivoDeReporte('X', new Date('no'))));
verificar('N9 solo quedan letras, números, guiones y guion bajo', /^[A-Za-z0-9_.-]+$/.test(U.nombreDeArchivoDeReporte('Ñandú 100% <script>alert(1)</script> 🎉', dia)));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
