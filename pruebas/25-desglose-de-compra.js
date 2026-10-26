// Prueba de shared/comision.js (lo que ve el navegador) contra server/comision.js (lo que se cobra):
// con los mismos datos tienen que dar exactamente los mismos numeros. Funciones puras: sin red ni base de datos.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = path.join(__dirname, '..');
const servidor = require(REPO + '/server/comision');

// El archivo compartido es un modulo del navegador: se carga sin sus "export", como en las otras pruebas
const contexto = {};
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(path.join(REPO, 'shared', 'comision.js'), 'utf8').replace(/^export /gm, '')
  + ';this.categoriaDeComision = categoriaDeComision; this.desgloseDeCompra = desgloseDeCompra; this.MAXIMO = PORCENTAJE_MAXIMO_COMISION;', contexto);
const { categoriaDeComision, desgloseDeCompra } = contexto;

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

verificar('el tope de porcentaje es el mismo en el navegador y en el servidor', contexto.MAXIMO === servidor.PORCENTAJE_MAXIMO);

// ---------- Desglose: mismos numeros que el servidor ----------
const precios = [1, 99.99, 500, 1234, 1500, 7500, 12345.67];
const cantidades = [1, 2, 3, 7, 10];
const porcentajes = [0, 1, 4.5, 7.5, 8, 12.25, 30];
let distintos = 0;
let casos = 0;
for (const precio of precios) for (const cantidad of cantidades) for (const pct of porcentajes) {
  const a = desgloseDeCompra(precio, cantidad, pct);
  const b = servidor.calcularCostoServicio(Math.round(precio * cantidad * 100) / 100, pct);
  casos++;
  if (a.subtotal !== b.subtotal || a.costoServicio !== b.costoServicio || a.total !== b.total) {
    distintos++;
    if (distintos <= 3) console.log('     distinto en', precio, cantidad, pct, JSON.stringify(a), JSON.stringify(b));
  }
}
verificar('el desglose del navegador y del servidor coinciden en ' + casos + ' combinaciones', distintos === 0, distintos + ' distintas');
verificar('3 entradas de 1500 con 8%: 4500 + 360 = 4860', JSON.stringify(desgloseDeCompra(1500, 3, 8)) === JSON.stringify({ subtotal: 4500, costoServicio: 360, total: 4860 }));
verificar('0%: el total es el subtotal', desgloseDeCompra(1500, 3, 0).costoServicio === 0 && desgloseDeCompra(1500, 3, 0).total === 4500);
verificar('valores raros no rompen (todo en 0)', JSON.stringify(desgloseDeCompra('x', undefined, 'y')) === JSON.stringify({ subtotal: 0, costoServicio: 0, total: 0 }));

// ---------- Categoria del evento: misma respuesta que el servidor ----------
const config = { categorias: [
  { id: 'cat-1', nombre: 'Estándar', porcentaje: 8 }, { id: 'cat-2', nombre: 'Cero', porcentaje: 0 },
  { id: 'cat-3', nombre: 'Tope', porcentaje: 30 }, { id: 'cat-malo', nombre: 'Roto', porcentaje: 31 },
  { id: 'cat-neg', nombre: 'Negativo', porcentaje: -1 }, { id: 'cat-texto', nombre: 'Texto', porcentaje: '8' }, { id: 'cat-nan', nombre: 'NaN', porcentaje: NaN },
] };
const eventos = [{ comisionCategoriaId: 'cat-1' }, { comisionCategoriaId: 'cat-2' }, { comisionCategoriaId: 'cat-3' }, { comisionCategoriaId: 'cat-malo' },
  { comisionCategoriaId: 'cat-neg' }, { comisionCategoriaId: 'cat-texto' }, { comisionCategoriaId: 'cat-nan' }, { comisionCategoriaId: 'cat-9' },
  { comisionCategoriaId: '' }, { comisionCategoriaId: 7 }, {}, null, undefined];
const iguales = eventos.every((ev) => JSON.stringify(categoriaDeComision(ev, config)) === JSON.stringify(servidor.categoriaDelEvento(ev, config)));
verificar('la categoria del evento es la misma en el navegador y en el servidor (válidas, fuera de rango, texto, inexistentes)', iguales);
verificar('cat-1 da 8%', categoriaDeComision({ comisionCategoriaId: 'cat-1' }, config).porcentaje === 8);
verificar('el tope exacto (30%) se acepta y 31% se descarta', categoriaDeComision({ comisionCategoriaId: 'cat-3' }, config) !== null && categoriaDeComision({ comisionCategoriaId: 'cat-malo' }, config) === null);
verificar('sin configuración: null', categoriaDeComision({ comisionCategoriaId: 'cat-1' }, null) === null && categoriaDeComision({ comisionCategoriaId: 'cat-1' }, undefined) === null);

console.log(mal === 0 ? '\nTodo bien.' : '\nFALLARON ' + mal + ' casos.');
process.exit(mal ? 1 : 0);
