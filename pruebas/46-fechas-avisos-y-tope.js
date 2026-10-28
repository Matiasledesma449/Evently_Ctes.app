// Prueba de los pedidos del 28/10 (tarde): fechas que ya pasaron, avisos de venta del evento, lugar en corto
// y tope de 10 entradas por persona (contra la reventa). Sin red ni base de datos reales.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
process.env.MP_ACCESS_TOKEN = 'TOKEN-DE-EJEMPLO-NO-REAL';
process.env.SITE_URL = 'https://ejemplo.test';

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const sinExport = (archivo) => fs.readFileSync(path.join(RAIZ, 'shared', archivo), 'utf8').replace(/^export /gm, '');
const L = vm.runInNewContext(sinExport('lotes.js') + '\n;({ estadoDeVentaDelEvento, validarFechasDeLote, lugaresQueQuedan })', { Intl });
const D = vm.runInNewContext(sinExport('evento-datos.js') + '\n;({ validarDias, lugarCorto, direccionCorta })', {});
const { entradasDeLaPersona, mensajeDeTope } = require(path.join(RAIZ, 'server', 'compra.js'));
const { crearPago } = require(path.join(RAIZ, 'server', 'crear-pago.js'));

const HOY = '2026-10-28';

// ---------- Fechas que ya pasaron ----------
const dia = (fecha) => ({ fecha, horaInicio: '21:00', horaFin: '23:00' });
verificar('F1 un día anterior a hoy no se acepta', /ya pasó/.test(D.validarDias([dia('2026-10-27')], { hoy: HOY })));
verificar('F2 un mes antes tampoco', /ya pasó/.test(D.validarDias([dia('2026-09-28')], { hoy: HOY })));
verificar('F3 hoy y días que vienen sí', D.validarDias([dia(HOY), dia('2026-12-31')], { hoy: HOY }) === '');
verificar('F4 al editar, un día que el evento ya tenía guardado se conserva', D.validarDias([dia('2026-10-20'), dia('2026-11-02')], { hoy: HOY, permitidas: ['2026-10-20'] }) === '');
verificar('F5 sin "hoy" se comporta como antes (no rompe a quien no lo pasa)', D.validarDias([dia('2020-01-01')]) === '');
const preventa = { tipo: 'fechas', desde: '2026-11-01', hasta: '2026-11-20' };
verificar('F6 lote con "desde" que ya pasó: no', /"desde" ya pasó/.test(L.validarFechasDeLote({ ...preventa, desde: '2026-10-01' }, { hoy: HOY })));
verificar('F7 lote con "hasta" que ya pasó: no', /"hasta" ya pasó/.test(L.validarFechasDeLote({ tipo: 'fechas', desde: '2026-10-01', hasta: '2026-10-10' }, { hoy: HOY, original: { desde: '2026-10-01' } })));
verificar('F8 una preventa que ya empezó conserva su "desde" al editar', L.validarFechasDeLote({ ...preventa, desde: '2026-10-01' }, { hoy: HOY, original: { desde: '2026-10-01', hasta: '2026-11-20' } }) === '');
verificar('F9 lote en fecha válida: bien', L.validarFechasDeLote(preventa, { hoy: HOY }) === '');
verificar('F10 "Siempre disponible" no tiene fechas que revisar', L.validarFechasDeLote({ tipo: 'siempre' }, { hoy: HOY }) === '');

// ---------- Estado de la venta del evento (avisos del sitio) ----------
const estado = (lotes) => L.estadoDeVentaDelEvento(lotes, HOY).estado;
const general = { nombre: 'General', tipo: 'siempre', precio: 100, disponibles: 10, vendidas: 3 };
verificar('V1 con lugares y en fecha: a la venta', estado([general]) === 'a-la-venta');
verificar('V2 todo vendido: agotado', estado([{ ...general, vendidas: 10 }]) === 'agotado');
verificar('V3 pasó la fecha de venta ("Se vende hasta"): terminada', estado([{ ...general, tipo: 'fechas', desde: '2026-09-01', hasta: '2026-10-27' }]) === 'terminada');
const proxima = L.estadoDeVentaDelEvento([{ ...general, tipo: 'fechas', desde: '2026-11-05', hasta: '2026-11-30' }], HOY);
verificar('V4 todavía no empezó: próximamente, con el primer día', proxima.estado === 'proximamente' && proxima.desde === '2026-11-05');
verificar('V5 preventa terminada y general agotada: agotado', estado([{ ...general, tipo: 'fechas', desde: '2026-09-01', hasta: '2026-10-01' }, { ...general, vendidas: 10 }]) === 'agotado');
verificar('V6 un lote agotado pero otro con lugares: a la venta', estado([{ ...general, vendidas: 10 }, general]) === 'a-la-venta');
verificar('V7 sin lotes', estado([]) === 'sin-lotes' && estado(undefined) === 'sin-lotes');
verificar('V8 lugares que quedan nunca da negativo', L.lugaresQueQuedan({ disponibles: 5, vendidas: 9 }) === 0 && L.lugaresQueQuedan({ disponibles: '8', vendidas: '3' }) === 5);

// ---------- Lugar en corto ----------
verificar('U1 dirección larga del mapa: nombre, calle con número y ciudad',
  D.lugarCorto('Zavod, 10, Lamadrid, Barrio Arazaty, Seccional 2°, Corrientes, Departamento Capital, Corrientes, 3400, Argentina') === 'Zavod, Lamadrid 10, Corrientes');
verificar('U2 un lugar escrito a mano queda igual', D.lugarCorto('Complejo Municipalidad de Saladas') === 'Complejo Municipalidad de Saladas' && D.lugarCorto('Club Social, San Martín 500, Saladas') === 'Club Social, San Martín 500, Saladas');
verificar('U3 empieza con el número de la calle', D.lugarCorto('10, Lamadrid, Barrio Norte, Corrientes, W3400, Argentina') === 'Lamadrid 10, Corrientes');
verificar('U5 dirección del mapa: solo calle, número y provincia', D.direccionCorta({ amenity: 'Policonsultorio Dr. Viscaino', house_number: '1017', road: 'Mendoza', suburb: 'Barrio Centro', city: 'Corrientes', state: 'Corrientes', postcode: '3400', country: 'Argentina' }, 'x') === 'Mendoza 1017, Corrientes');
verificar('U6 sin número queda calle y provincia; sin calle, el lugar en corto', D.direccionCorta({ road: 'Avenida 3 de Abril', state: 'Corrientes' }) === 'Avenida 3 de Abril, Corrientes' && D.direccionCorta({ state: 'Corrientes' }, 'Complejo Municipal, Saladas') === 'Complejo Municipal, Saladas' && D.direccionCorta(null, '') === '');
verificar('U4 vacío o raro no rompe', D.lugarCorto('') === '' && D.lugarCorto(null) === '' && D.lugarCorto(5) === '');

// ---------- Tope por persona ----------
const ahora = new Date('2026-10-28T12:00:00Z');
const venta = (estado, cantidad, venceEnMinutos) => ({ estado, cantidad, venceEn: venceEnMinutos === undefined ? undefined : { toDate: () => new Date(ahora.getTime() + venceEnMinutos * 60000) } });
verificar('T1 cuentan las confirmadas y los pagos en curso que no vencieron', entradasDeLaPersona([venta('confirmada', 4), venta('pendiente', 3, 10), venta('pendiente', 5, -5), venta('rechazada', 2)], ahora) === 7);
verificar('T2 sin ventas: 0', entradasDeLaPersona([], ahora) === 0 && entradasDeLaPersona(null, ahora) === 0);
verificar('T3 el aviso dice cuántas le quedan', /ya tenés 7: podés sumar 3 más/.test(mensajeDeTope(7, 10)));
verificar('T4 si ya llegó al máximo lo dice', /Ya tenés 10 entradas/.test(mensajeDeTope(10, 10)));

const evento = { nombre: 'Fiesta', estado: 'publicado', lotes: [{ nombre: 'General', precio: 1000, disponibles: 100, vendidas: 0 }] };
const pedido = { eventoId: 'Evt1', loteIndex: 0, loteNombre: 'General', cantidad: 4, nombre: 'Ana', apellido: 'Prueba', correo: 'ana@example.com' };
const fetchMp = async () => ({ ok: true, status: 201, json: async () => ({ id: 'pref-1', init_point: 'https://mp.test/pagar' }) });
(async () => {
  {
    // Ya tiene 7 confirmadas con el mismo correo: 4 más pasarían el tope
    const { db, datos } = crearDbFalsa({ eventos: { Evt1: evento }, ventas: { V1: { eventoId: 'Evt1', correo: 'ana@example.com', estado: 'confirmada', cantidad: 7 } } });
    const r = await crearPago(pedido, { db, fetchFn: fetchMp, ahora, registrar: () => {} });
    verificar('T5 el servidor frena la compra que pasa las 10 por persona (y no crea la venta)', r.status === 409 && r.cuerpo.error.codigo === 'TOPE_POR_PERSONA' && Object.keys(datos.ventas).length === 1, JSON.stringify(r.cuerpo));
  }
  {
    // Otro correo u otro evento no cuentan
    const { db } = crearDbFalsa({ eventos: { Evt1: evento }, ventas: {
      V1: { eventoId: 'Evt1', correo: 'otra@example.com', estado: 'confirmada', cantidad: 9 },
      V2: { eventoId: 'Evt2', correo: 'ana@example.com', estado: 'confirmada', cantidad: 9 },
    } });
    const r = await crearPago(pedido, { db, fetchFn: fetchMp, ahora, registrar: () => {} });
    verificar('T6 las compras de otro correo o de otro evento no cuentan', r.status === 200 && r.cuerpo.ok === true, JSON.stringify(r.cuerpo));
  }
  {
    const { db } = crearDbFalsa({ eventos: { Evt1: evento }, ventas: { V1: { eventoId: 'Evt1', correo: 'ana@example.com', estado: 'confirmada', cantidad: 6 } } });
    const r = await crearPago(pedido, { db, fetchFn: fetchMp, ahora, registrar: () => {} });
    verificar('T7 justo 10 en total se puede', r.status === 200, JSON.stringify(r.cuerpo));
  }

  // ---------- Páginas ----------
  const leer = (archivo) => fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
  const crear = leer('admin/eventos.html');
  verificar('P1 Crear evento: los calendarios arrancan en hoy (aplicarMinimoDeFechas)', /function aplicarMinimoDeFechas/.test(crear) && /campo\.min = hoy/.test(crear));
  verificar('P2 Crear evento: al guardar se revisan los días y los lotes con la fecha de hoy', /validarDias\(leerDias\(\), \{ hoy, permitidas/.test(crear) && /validarFechasDeLote\(\{ tipo, desde, hasta \}, \{ hoy,/.test(crear));
  verificar('P3 Editar una solicitud abre el formulario completo (con la categoría de costo de servicio)', /eventos\.html\?modo=directo&solicitud=/.test(leer('admin/aprobaciones.js')) && /cargarSolicitudParaRevisar/.test(crear) && !/modalEditarSolicitud/.test(crear));
  const sel = leer('admin/eventos-seleccion.html');
  verificar('P4 las solicitudes viven en Eventos (pestaña Solicitudes) y ya no en Crear evento', /id="panelSolicitudes"/.test(sel) && /import\('\.\/aprobaciones\.js'\)/.test(sel) && !/panelSolicitudes|pestanasSuperadmin/.test(crear));
  verificar('P5 el inicio usa tarjetas anchas con el lugar en corto y el aviso de venta', /aspect-ratio: 12 \/ 5/.test(leer('public/index.html')) && /lugarCorto\(evento\.lugar\)/.test(leer('public/index.html')) && /estadoDeVentaDelEvento/.test(leer('public/index.html')));
  verificar('P6 la barra "Estás viendo" ya no es rosa', !/pink-/.test(leer('shared/menu-admin.js')) && !/pink-/.test(leer('shared/selector-evento.js')));

  console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
  process.exit(mal === 0 ? 0 : 1);
})();
