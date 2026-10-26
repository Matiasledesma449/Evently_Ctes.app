// Prueba de los lotes por fechas (cambio ajustes-tras-vista-previa): shared/lotes.js (navegador), server/lotes.js
// (servidor) y que el servidor de pagos rechace un lote que no está a la venta. Sin red ni base de datos.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const N = vm.runInNewContext(fs.readFileSync(path.join(RAIZ, 'shared', 'lotes.js'), 'utf8').replace(/^export /gm, '') + '\n;({ estadoDeLote, textoDeVigencia, validarFechasDeLote, hoyEnArgentina, diaMes })', { Intl });
const S = require(path.join(RAIZ, 'server', 'lotes.js'));
const { calcularCompra } = require(path.join(RAIZ, 'server', 'compra.js'));

const preventa = { nombre: 'Preventa', tipo: 'fechas', desde: '2026-11-01', hasta: '2026-11-20', precio: 100, disponibles: 10 };
const campo = { nombre: 'Campo', tipo: 'siempre', precio: 200, disponibles: 10 };
const viejo = { nombre: 'Lote 1', vigencia: '01/11-20/11', precio: 50, disponibles: 10 };

// Estado
verificar('E1 antes de la fecha "desde": próximo', N.estadoDeLote(preventa, '2026-10-31') === 'proximo');
verificar('E2 el primer y el último día: disponible', N.estadoDeLote(preventa, '2026-11-01') === 'disponible' && N.estadoDeLote(preventa, '2026-11-20') === 'disponible');
verificar('E3 después de "hasta": finalizado', N.estadoDeLote(preventa, '2026-11-21') === 'finalizado');
verificar('E4 "Siempre disponible" (sector de un concierto) está siempre a la venta', ['2020-01-01', '2030-12-31'].every((h) => N.estadoDeLote(campo, h) === 'disponible'));
verificar('E5 un lote viejo sin tipo ni fechas sigue disponible (no se rompe lo que hay)', N.estadoDeLote(viejo, '2026-12-31') === 'disponible');
verificar('E6 el superadmin lo habilita antes de tiempo', N.estadoDeLote({ ...preventa, habilitadoManual: true }, '2026-10-01') === 'disponible');
verificar('E7 fechas mal escritas no cuentan', N.estadoDeLote({ ...preventa, desde: '01/11/2026' }, '2026-10-01') === 'disponible');
verificar('E8 sin lote: finalizado', N.estadoDeLote(null, '2026-10-01') === 'finalizado');

// Navegador y servidor dan lo mismo
const casos = [preventa, campo, viejo, { ...preventa, habilitadoManual: true }, { tipo: 'fechas', hasta: '2026-11-05' }, { tipo: 'fechas', desde: '2026-11-05' }, null, 'x'];
const dias = ['2026-10-01', '2026-11-01', '2026-11-05', '2026-11-20', '2026-11-21', '2027-01-01'];
verificar('M1 shared/lotes.js y server/lotes.js dan siempre el mismo estado', casos.every((l) => dias.every((d) => N.estadoDeLote(l, d) === S.estadoDeLote(l, d))));
const ahora = new Date('2026-11-01T02:30:00Z'); // en Argentina todavía es 31/10 a las 23:30
verificar('M2 "hoy" es la fecha de Argentina, no la del servidor', N.hoyEnArgentina(ahora) === '2026-10-31' && S.hoyEnArgentina(ahora) === '2026-10-31');

// Textos y validación
verificar('T1 vigencia con las dos fechas', N.textoDeVigencia(preventa) === '01/11 al 20/11');
verificar('T2 un sector no muestra vigencia', N.textoDeVigencia(campo) === '');
verificar('T3 un lote viejo muestra su texto de siempre', N.textoDeVigencia(viejo) === '01/11-20/11');
verificar('V1 por fechas sin fechas no se acepta', N.validarFechasDeLote({ tipo: 'fechas', desde: '', hasta: '' }) !== '');
verificar('V2 "hasta" antes de "desde" no se acepta', N.validarFechasDeLote({ tipo: 'fechas', desde: '2026-11-10', hasta: '2026-11-01' }) !== '');
verificar('V3 fechas bien y "siempre" se aceptan', N.validarFechasDeLote({ tipo: 'fechas', desde: '2026-11-01', hasta: '2026-11-01' }) === '' && N.validarFechasDeLote({ tipo: 'siempre' }) === '');

// Servidor de pagos
const evento = { estado: 'publicado', lotes: [preventa, campo, viejo] };
const pedido = (loteIndex) => ({ eventoId: 'E', loteIndex, cantidad: 1 });
verificar('P1 el servidor rechaza un lote que todavía no empezó', calcularCompra(evento, pedido(0), null, '2026-10-31').codigo === 'LOTE_NO_EMPEZO');
verificar('P2 el servidor rechaza un lote que ya terminó', calcularCompra(evento, pedido(0), null, '2026-11-21').codigo === 'LOTE_TERMINO');
verificar('P3 entre sus fechas se vende', calcularCompra(evento, pedido(0), null, '2026-11-10').ok === true);
verificar('P4 "Siempre disponible" y los lotes viejos se venden', calcularCompra(evento, pedido(1), null, '2030-01-01').ok && calcularCompra(evento, pedido(2), null, '2030-01-01').ok);
verificar('P5 habilitado por el superadmin se vende antes de tiempo', calcularCompra({ ...evento, lotes: [{ ...preventa, habilitadoManual: true }] }, pedido(0), null, '2026-10-01').ok === true);

console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
process.exit(mal ? 1 : 0);
