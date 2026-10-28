// Prueba de shared/exportar.js (pedido 17): CSV seguro y nombres y fechas de las descargas.
// Sin red, sin base de datos y sin navegador.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const fuente = fs.readFileSync(path.join(__dirname, '..', 'shared', 'exportar.js'), 'utf8');
const X = vm.runInNewContext(fuente.replace(/^export /gm, '') + '\n;({ celdaCsv, textoCsv, fechaHora, nombreDeArchivo, pesos })', { URL, Date, Intl });

verificar('C1 los textos van entre comillas y las comillas se duplican', X.celdaCsv('Dijo "hola"') === '"Dijo ""hola"""');
verificar('C2 una fórmula no se ejecuta en Excel (apóstrofo adelante)', ['=SUMA(A1)', '+1', '-2', '@x'].every((t) => X.celdaCsv(t).startsWith('"\'')));
verificar('C3 los números van con coma decimal y sin comillas', X.celdaCsv(12.5) === '12,5' && X.celdaCsv(3) === '3' && X.celdaCsv(NaN) === '');
verificar('C4 vacíos y nulos quedan vacíos', X.celdaCsv(null) === '""' && X.celdaCsv(undefined) === '""');
const csv = X.textoCsv([['Nombre', 'Total'], ['Ana; Pérez', 100]]);
verificar('C5 el archivo lleva BOM, punto y coma y saltos de Windows', csv === '﻿"Nombre";"Total"\r\n"Ana; Pérez";100', JSON.stringify(csv));
verificar('C6 sin filas no falla', X.textoCsv(null) === '﻿');

const ts = { seconds: Date.UTC(2026, 9, 28, 15, 5) / 1000 }; // 28/10/2026 12:05 en Argentina
verificar('F1 fecha de Firestore en hora argentina', X.fechaHora(ts).replace(/\s+/g, ' ') === '28/10/2026, 12:05', X.fechaHora(ts));
verificar('F2 con toDate() también', X.fechaHora({ toDate: () => new Date(ts.seconds * 1000) }) === X.fechaHora(ts));
verificar('F3 un texto que no es fecha se deja como está y lo vacío da vacío', X.fechaHora('ayer') === 'ayer' && X.fechaHora(null) === '' && X.fechaHora({}) === '');

const ahora = new Date(Date.UTC(2026, 9, 28, 15, 0));
verificar('N1 nombre de archivo sin acentos ni símbolos', X.nombreDeArchivo(['Ventas', 'Fiesta del Río!'], 'csv', ahora) === 'ventas-fiesta-del-rio-2026-10-28.csv', X.nombreDeArchivo(['Ventas', 'Fiesta del Río!'], 'csv', ahora));
verificar('N2 sin partes usa "evently"', X.nombreDeArchivo([], 'pdf', ahora) === 'evently-2026-10-28.pdf');
verificar('P1 pesos sin decimales', X.pesos(12500.4) === '$ 12.500' && X.pesos('x') === '$ 0');
verificar('M1 el PDF se arma sin innerHTML', !/innerHTML|insertAdjacentHTML/.test(fuente.replace(/\/\/.*$/gm, '')));

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
