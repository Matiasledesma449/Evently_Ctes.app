// Prueba de las cifras de Resumen y Reportes y del selector de evento (cambio panel-claro-resumen-reportes).
// Funciones puras de shared/ventas-utils.js: sin red, sin base de datos y sin navegador.
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
const U = vm.runInNewContext(codigo + '\n;({ eventosDeLaPersona, ventasDeEventos, cifrasDelEvento, tarjetasDeResumen, tarjetasDelFiltro, metodosDePago, htmlDeTarjetasResumen })');

const $ = (n) => '$' + n.toLocaleString();
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ids = (lista) => lista.map((e) => e.id);
const tarjeta = (tarjetas, id) => tarjetas.find((t) => t.id === id) || {};
const porTitulo = (tarjetas, titulo) => tarjetas.find((t) => t.titulo === titulo) || {};

const conf = (monto, cant = 1, extra = {}) => ({ eventoId: 'E1', estado: 'confirmada', monto_total: monto, cantidad: cant, loteNombre: 'Lote 1', metodo_pago: 'Crédito', ...extra });
const pend = (monto, cant = 1, extra = {}) => ({ eventoId: 'E1', estado: 'pendiente', monto_total: monto, cantidad: cant, loteNombre: 'Lote 1', ...extra });
const rech = (monto, cant = 1, extra = {}) => ({ eventoId: 'E1', estado: 'rechazada', monto_total: monto, cantidad: cant, loteNombre: 'Lote 1', motivo: 'vencida', ...extra });
const evento = (id, lotes, extra = {}) => ({ id, nombre: 'Evento ' + id, lotes, ...extra });
const EVENTO = evento('E1', [{ nombre: 'Lote 1', disponibles: 100, vendidas: 7 }, { nombre: 'Lote 2', disponibles: 200, vendidas: 0 }]);

// ---------- Quien puede elegir que evento ----------
{
  const eventos = [
    { id: 'A', organizacionId: 'orgX' },
    { id: 'B', creadoPor: 'uid-1' },
    { id: 'C', correo: 'ana@ejemplo.test' },
    { id: 'D', organizacionId: 'otra', creadoPor: 'uid-9', correo: 'otra@ejemplo.test' },
    { id: 'E' },
  ];
  verificar('E1 el superadmin elige todos los eventos', igual(ids(U.eventosDeLaPersona(eventos, { rol: 'superadmin' }, 'u')), ['A', 'B', 'C', 'D', 'E']));
  const org = { rol: 'organizacion', organizacionId: 'orgX', email: 'ana@ejemplo.test' };
  verificar('E2 una organizacion elige los de su organizacion, los que creo y los de su correo', igual(ids(U.eventosDeLaPersona(eventos, org, 'uid-1')), ['A', 'B', 'C']));
  verificar('E3 una organizacion no ve los eventos de otras', !ids(U.eventosDeLaPersona(eventos, org, 'uid-1')).includes('D'));
  verificar('E4 sin organizacionId ni correo no coincide con eventos que tampoco los tienen (undefined no es igual a undefined)',
    igual(ids(U.eventosDeLaPersona(eventos, { rol: 'organizacion' }, 'uid-7')), []));
  verificar('E5 por separado: solo por creadoPor', igual(ids(U.eventosDeLaPersona(eventos, { rol: 'organizacion' }, 'uid-1')), ['B']));
  verificar('E6 listas nulas y eventos nulos no fallan', igual(U.eventosDeLaPersona(null, org, 'u'), []) && igual(ids(U.eventosDeLaPersona([null, undefined, eventos[0]], org, 'u')), ['A']));
  verificar('E7 sin datos de la persona no se ve ningun evento ajeno', igual(U.eventosDeLaPersona(eventos, null, null), []));
}

// ---------- Ventas de uno o varios eventos ----------
{
  const ventas = [conf(1, 1, { eventoId: 'A' }), conf(1, 1, { eventoId: 'B' }), conf(1, 1, { eventoId: 'C' }), { estado: 'confirmada' }, null];
  verificar('V1 las ventas de un evento', U.ventasDeEventos(ventas, 'A').length === 1);
  verificar('V2 las ventas de varios eventos', U.ventasDeEventos(ventas, ['A', 'C']).length === 2);
  verificar('V3 una venta sin eventoId o nula no entra ni rompe', U.ventasDeEventos(ventas, ['A', 'B', 'C']).length === 3 && igual(U.ventasDeEventos(null, 'A'), []));
}

// ---------- Cifras del evento (todo desde las ventas confirmadas) ----------
{
  const ventas = [conf(12, 1), conf(24, 2), conf(48, 3, { loteNombre: 'Lote 2', metodo_pago: 'Débito' }), conf(12, 2, { metodo_pago: 'Dinero en cuenta', loteNombre: 'Lote 2' })];
  const c = U.cifrasDelEvento([EVENTO], ventas);
  verificar('C1 ejemplo: 4 ventas confirmadas, 8 entradas, $96, promedio 2', c.confirmadas === 4 && c.entradas === 8 && c.recaudado === 96 && c.promedioEntradas === 2, JSON.stringify(c));
  verificar('C2 capacidad 300, aforo restante 292 y ocupacion 3%', c.capacidad === 300 && c.aforoRestante === 292 && c.ocupacion === 3);
  verificar('C3 el contador "vendidas" del lote NO cambia las cifras (el lote dice 7 y las ventas suman 8)', c.entradas === 8);
  const desfasado = U.cifrasDelEvento([evento('E1', [{ nombre: 'Lote 1', disponibles: 100, vendidas: 999 }])], [conf(12, 1)]);
  verificar('C4 un contador muy desfasado tampoco', desfasado.entradas === 1 && desfasado.ocupacion === 1);
  verificar('C5 lote mas vendido: Lote 2 con 5 entradas', igual(c.loteMasVendido, { nombre: 'Lote 2', entradas: 5 }), JSON.stringify(c.loteMasVendido));
  verificar('C6 lote mas rentable: Lote 2 con $60', igual(c.loteMasRentable, { nombre: 'Lote 2', dinero: 60 }), JSON.stringify(c.loteMasRentable));
  const caso84 = U.cifrasDelEvento([EVENTO], [conf(84, 7), conf(12, 1, { loteNombre: 'Lote 2' })]);
  const empateLotes = U.cifrasDelEvento([EVENTO], [conf(10, 1), conf(10, 1, { loteNombre: 'Lote 2' })]);
  verificar('C6b con empate de lotes gana el primero que aparece', empateLotes.loteMasRentable.nombre === 'Lote 1' && empateLotes.loteMasVendido.nombre === 'Lote 1');
  verificar('C7 el dinero de un lote nunca supera la recaudacion total ($84 de $96)', caso84.loteMasRentable.dinero === 84 && caso84.loteMasRentable.dinero <= caso84.recaudado && caso84.recaudado === 96);
  verificar('C8 metodo mas usado: Crédito con 2 de 4 (50%)', c.metodoMasUsado.nombre === 'Crédito' && c.metodoMasUsado.porcentaje === 50, JSON.stringify(c.metodoMasUsado));
  const empate = U.cifrasDelEvento([EVENTO], [conf(1, 1, { metodo_pago: 'Débito' }), conf(1, 1, { metodo_pago: 'Crédito' })]);
  verificar('C9 con empate de metodos gana el primero que aparece', empate.metodoMasUsado.nombre === 'Débito');
  verificar('C10 una venta sin metodo cuenta como "Desconocido"', U.cifrasDelEvento([EVENTO], [conf(1, 1, { metodo_pago: undefined })]).metodoMasUsado.nombre === 'Desconocido');

  const mezcla = U.cifrasDelEvento([EVENTO], [conf(36, 3), pend(24, 2), rech(100, 5)]);
  verificar('C11 las pendientes y las rechazadas no suman dinero ni entradas', mezcla.recaudado === 36 && mezcla.entradas === 3 && mezcla.confirmadas === 1);
  verificar('C12 pendientes de pago: se cuentan aparte y no suman dinero', mezcla.pendientes === 1 && mezcla.recaudado === 36);

  const vacio = U.cifrasDelEvento([EVENTO], []);
  verificar('C13 sin ventas: 0 entradas, $0, sin promedio, sin lotes ni metodo', vacio.entradas === 0 && vacio.recaudado === 0 && vacio.promedioEntradas === null && vacio.loteMasVendido === null && vacio.loteMasRentable === null && vacio.metodoMasUsado === null);
  verificar('C14 sin ventas la capacidad y el aforo siguen saliendo de los lotes', vacio.capacidad === 300 && vacio.aforoRestante === 300 && vacio.ocupacion === 0);
  const lleno = U.cifrasDelEvento([evento('E1', [{ nombre: 'Lote 1', disponibles: 5 }])], [conf(100, 8)]);
  verificar('C15 el aforo restante nunca es negativo', lleno.aforoRestante === 0 && lleno.ocupacion === 160);
  verificar('C16 un evento sin lotes tiene capacidad 0 y no divide por cero', U.cifrasDelEvento([evento('E1', undefined)], [conf(1, 1)]).ocupacion === 0 && U.cifrasDelEvento([evento('E1', [])], []).capacidad === 0);
  const raras = U.cifrasDelEvento([EVENTO], [conf(NaN, 2), conf('mucho', 1), conf(undefined, 1), { estado: 'confirmada' }, null]);
  verificar('C17 ventas viejas con datos raros no producen NaN', Object.values(raras).every((v) => typeof v !== 'number' || Number.isFinite(v)) && raras.recaudado === 0, JSON.stringify(raras));
  const dos = U.cifrasDelEvento([EVENTO, evento('E2', [{ nombre: 'General', disponibles: 50 }])], [conf(10, 1), conf(10, 1, { eventoId: 'E2', loteNombre: 'General' })]);
  verificar('C18 varios eventos ("Todos"): suman capacidad, entradas y dinero', dos.capacidad === 350 && dos.entradas === 2 && dos.recaudado === 20);
  verificar('C19 con listas nulas no falla', U.cifrasDelEvento(null, null).capacidad === 0 && U.cifrasDelEvento(undefined, undefined).confirmadas === 0);
  const original = JSON.stringify([ventas, [EVENTO]]);
  U.cifrasDelEvento([EVENTO], ventas);
  verificar('C20 no modifica lo que recibe', JSON.stringify([ventas, [EVENTO]]) === original);
}

// ---------- Tarjetas de Resumen ----------
{
  const ventas = [conf(12, 1), conf(24, 2), conf(48, 3, { loteNombre: 'Lote 2', metodo_pago: 'Débito' }), conf(12, 2, { metodo_pago: 'Dinero en cuenta', loteNombre: 'Lote 2' }), pend(24, 2)];
  const c = U.cifrasDelEvento([EVENTO], ventas);
  const t = U.tarjetasDeResumen(c);
  const carga = U.tarjetasDeResumen(null);
  verificar('T1 hay 11 tarjetas con ids distintos', t.length === 11 && new Set(t.map((x) => x.id)).size === 11);
  verificar('T2 mientras cargan: las MISMAS tarjetas (mismos ids, titulos y anchos) con "—", para que nada salte', igual(carga.map((x) => [x.id, x.titulo, x.ancho]), t.map((x) => [x.id, x.titulo, x.ancho])) && carga.every((x) => x.valor === '—'));
  verificar('T3 todas las tarjetas explican que cuentan (ayuda no vacia), con y sin datos', t.every((x) => x.ayuda && x.ayuda.length > 3) && carga.every((x) => x.ayuda && x.ayuda.length > 3));
  verificar('T4 ningun valor tiene NaN, undefined ni null', t.concat(carga).every((x) => !/NaN|undefined|null/.test(x.valor + ' ' + x.ayuda)));
  verificar('T5 los valores de cada tarjeta', tarjeta(t, 'capacidad').valor === '300' && tarjeta(t, 'entradas').valor === '8' && tarjeta(t, 'aforo').valor === '292' && tarjeta(t, 'ocupacion').valor === '3%' && tarjeta(t, 'recaudado').valor === $(96) && tarjeta(t, 'confirmadas').valor === '4' && tarjeta(t, 'pendientes').valor === '1' && tarjeta(t, 'promedio').valor === '2', JSON.stringify(t.map((x) => x.valor)));
  verificar('T6 la barra de ocupacion lleva su porcentaje', tarjeta(t, 'ocupacion').progreso === 3 && tarjeta(carga, 'ocupacion').progreso === 0);
  verificar('T7 los anchos son 1, 2 o 4 columnas', t.every((x) => [1, 2, 4].includes(x.ancho)));
  verificar('T8 colores: el dinero en violeta ("dinero") y lo pendiente en amarillo ("pendiente")', tarjeta(t, 'recaudado').tono === 'dinero' && tarjeta(t, 'pendientes').tono === 'pendiente');
  const promedio = U.tarjetasDeResumen(U.cifrasDelEvento([EVENTO], [conf(1, 3), conf(1, 2)]));
  verificar('T9 un promedio que no es redondo muestra un decimal (2,5)', tarjeta(promedio, 'promedio').valor === (2.5).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), tarjeta(promedio, 'promedio').valor);
  const sin = U.tarjetasDeResumen(U.cifrasDelEvento([EVENTO], []));
  verificar('T10 sin ventas: promedio, lote mas vendido, lote mas rentable y metodo en "—"; recaudado en $0 y entradas en 0',
    tarjeta(sin, 'promedio').valor === '—' && tarjeta(sin, 'loteVendido').valor === '—' && tarjeta(sin, 'loteRentable').valor === '—' && tarjeta(sin, 'metodo').valor === '—' && tarjeta(sin, 'recaudado').valor === $(0) && tarjeta(sin, 'entradas').valor === '0');
  verificar('T12 los valores que son nombres (lotes y metodo) se marcan como texto y los numeros no', ['loteVendido', 'loteRentable', 'metodo'].every((id) => tarjeta(t, id).texto === true) && ['capacidad', 'recaudado', 'promedio'].every((id) => !tarjeta(t, id).texto));
  verificar('T11 lote y metodo con datos', tarjeta(t, 'loteVendido').valor === 'Lote 2' && /5 entradas/.test(tarjeta(t, 'loteVendido').ayuda) && tarjeta(t, 'loteRentable').valor === 'Lote 2' && tarjeta(t, 'metodo').valor === 'Crédito');
}

// ---------- El HTML de las tarjetas ----------
{
  const hostil = [{ id: 'x', titulo: '<script>alert(1)</script>', valor: '"><img src=x onerror=alert(2)>', ayuda: "<b>a</b>'", tono: 'dinero', icono: '<i>', ancho: 4, progreso: '50%; background:url(x)' }];
  const html = U.htmlDeTarjetasResumen(hostil);
  verificar('H1 el HTML escapa titulo, valor, ayuda e icono (nada se interpreta como etiqueta)', !/<script|<img|<b>|<i>/.test(html) && /&lt;script&gt;/.test(html) && /&lt;img/.test(html), html.slice(0, 200));
  verificar('H2 el ancho de la barra de ocupacion es siempre un numero (nada de estilos inyectados)', /style="width: 0%"/.test(html) && !/background:url/.test(html), (html.match(/style="[^"]*"/) || [''])[0]);
  verificar('H3 una barra con 250 se limita a 100% y una negativa a 0%', /width: 100%/.test(U.htmlDeTarjetasResumen([{ id: 'o', titulo: 'a', valor: 'b', ayuda: 'c', progreso: 250 }])) && /width: 0%/.test(U.htmlDeTarjetasResumen([{ id: 'o', titulo: 'a', valor: 'b', ayuda: 'c', progreso: -5 }])));
  const t = U.tarjetasDeResumen(U.cifrasDelEvento([EVENTO], [conf(12, 1)]));
  const h = U.htmlDeTarjetasResumen(t);
  verificar('H4 una tarjeta por cada elemento y los 11 titulos aparecen', (h.match(/hover-card/g) || []).length === 11 && t.every((x) => h.includes('>' + x.titulo + '<')));
  verificar('H5 con listas raras no falla', U.htmlDeTarjetasResumen(null) === '' && U.htmlDeTarjetasResumen([]) === '');
}

// ---------- Resumen y Ventas dan los mismos numeros con los mismos datos ----------
{
  const ventas = [conf(12, 1), conf(24, 2), conf(48, 3, { metodo_pago: 'Débito' }), conf(12, 2, { metodo_pago: 'Dinero en cuenta' }), pend(24, 2), pend(12, 1), rech(12, 1), conf(NaN, 2, { metodo_pago: 'Efectivo' })];
  const resumen = U.tarjetasDeResumen(U.cifrasDelEvento([EVENTO], ventas));
  const ventasTodos = U.tarjetasDelFiltro('todos', ventas);
  const titulosEnComun = ['Total recaudado', 'Entradas vendidas', 'Ventas confirmadas', 'Pendientes de pago'];
  for (const titulo of titulosEnComun) {
    verificar(`X1 "${titulo}": Resumen y Ventas muestran lo mismo`, porTitulo(resumen, titulo).valor === porTitulo(ventasTodos, titulo).valor && porTitulo(resumen, titulo).valor !== undefined,
      `${porTitulo(resumen, titulo).valor} vs ${porTitulo(ventasTodos, titulo).valor}`);
  }
}

// ---------- Todos los eventos de la persona ----------
{
  const eventos = [evento('E1', [{ nombre: 'Lote 1', disponibles: 100 }], { creadoPor: 'u-org' }), evento('E2', [{ nombre: 'Lote 1', disponibles: 50 }], { creadoPor: 'otra' })];
  const ventas = [conf(10, 1), conf(20, 2, { eventoId: 'E2' })];
  const suyos = U.eventosDeLaPersona(eventos, { rol: 'organizacion' }, 'u-org');
  const cifras = U.cifrasDelEvento(suyos, U.ventasDeEventos(ventas, ids(suyos)));
  verificar('Z1 "Todos" de una organizacion suma solo sus eventos (capacidad 100, $10)', cifras.capacidad === 100 && cifras.recaudado === 10 && cifras.entradas === 1, JSON.stringify(cifras));
  const todos = U.eventosDeLaPersona(eventos, { rol: 'superadmin' }, 'x');
  const cifrasTodos = U.cifrasDelEvento(todos, U.ventasDeEventos(ventas, ids(todos)));
  verificar('Z2 "Todos" del superadmin suma todos (capacidad 150, $30)', cifrasTodos.capacidad === 150 && cifrasTodos.recaudado === 30 && cifrasTodos.entradas === 3);
  verificar('Z3 con un solo evento, "Todos" y ese evento dan lo mismo', igual(U.cifrasDelEvento([eventos[0]], U.ventasDeEventos(ventas, 'E1')), cifras));
}

if (mal > 0) { console.log('\nFALLARON ' + mal + ' casos.'); process.exit(1); }
console.log('\nTodos los casos pasaron.');
