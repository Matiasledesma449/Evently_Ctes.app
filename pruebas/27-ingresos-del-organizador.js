// Prueba de lo que el panel cuenta como recaudado cuando hay costo de servicio (change costo-de-servicio, tareas 4.5 a 4.7):
// funciones puras de shared/ventas-utils.js (sin red, sin base de datos y sin navegador) y revisión de Reportes y Ventas.
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
const U = vm.runInNewContext(codigo + '\n;({ ingresoDeVenta, costoServicioDeVenta, textoDeMontoDeVenta, resumenDeVentas, tarjetasDelFiltro, cifrasDelEvento })');
const $ = (n) => '$' + n.toLocaleString();
const valor = (tarjetas, titulo) => (tarjetas.find((t) => t.titulo === titulo) || {}).valor;

// Una venta con costo de servicio (8% sobre 4500) y una anterior al cambio
const nueva = (estado = 'confirmada', extra = {}) => ({ estado, cantidad: 3, loteNombre: 'General', metodo_pago: 'Crédito', subtotal: 4500, costo_servicio: 360, comision_porcentaje: 8, monto_total: 4860, ...extra });
const vieja = (estado = 'confirmada', extra = {}) => ({ estado, cantidad: 1, loteNombre: 'General', metodo_pago: 'Crédito', monto_total: 2000, ...extra });

// ---------- Ingreso de una venta ----------
verificar('I1 venta con costo de servicio: el ingreso es el subtotal (4500) y no el total pagado (4860)', U.ingresoDeVenta(nueva()) === 4500);
verificar('I2 venta anterior al cambio: el ingreso es el monto total (2000)', U.ingresoDeVenta(vieja()) === 2000);
verificar('I3 venta sin costo de servicio pero con subtotal: ingreso = subtotal', U.ingresoDeVenta({ subtotal: 1500, costo_servicio: 0, monto_total: 1500 }) === 1500);
verificar('I4 subtotal 0 se respeta (no cae al monto total)', U.ingresoDeVenta({ subtotal: 0, monto_total: 99 }) === 0);
verificar('I5 datos raros cuentan como 0 y no dan NaN', [null, undefined, {}, { subtotal: 'x', monto_total: 'y' }, { subtotal: NaN, monto_total: NaN }].every((v) => U.ingresoDeVenta(v) === 0));
verificar('I6 subtotal de texto cae al monto total', U.ingresoDeVenta({ subtotal: '4500', monto_total: 4860 }) === 4860);
verificar('C1 costo de servicio de una venta: 360; en una vieja o con datos raros: 0',
  U.costoServicioDeVenta(nueva()) === 360 && U.costoServicioDeVenta(vieja()) === 0 && [null, {}, { costo_servicio: 'x' }, { costo_servicio: -5 }, { costo_servicio: NaN }].every((v) => U.costoServicioDeVenta(v) === 0));

// ---------- Recaudado ----------
const ventas = [nueva(), nueva(), vieja(), nueva('pendiente'), nueva('rechazada', { motivo: 'vencida' })];
const r = U.resumenDeVentas(ventas);
verificar('R1 recaudado = 4500 + 4500 + 2000 (sin el costo de servicio, solo confirmadas)', r.recaudado === 11000, String(r.recaudado));
verificar('R2 las entradas y las ventas confirmadas siguen igual', r.entradas === 7 && r.confirmadas === 3 && r.pendientes === 1 && r.rechazadas === 1);

// ---------- Tarjetas de Ventas ----------
verificar('T1 "Total recaudado" (todos y confirmadas) usa el ingreso', valor(U.tarjetasDelFiltro('todos', ventas), 'Total recaudado') === $(11000) && valor(U.tarjetasDelFiltro('confirmada', ventas), 'Total recaudado') === $(11000));
verificar('T2 "Dinero en espera" usa el subtotal de las pendientes', valor(U.tarjetasDelFiltro('pendiente', ventas), 'Dinero en espera') === $(4500));
verificar('T3 "Dinero no cobrado" usa el subtotal de las rechazadas', valor(U.tarjetasDelFiltro('rechazada', ventas), 'Dinero no cobrado') === $(4500));

// ---------- Cifras del evento (Resumen y Reportes) ----------
const evento = { lotes: [{ nombre: 'General', disponibles: 100 }] };
const c = U.cifrasDelEvento([evento], ventas);
verificar('E1 las cifras del evento recaudan el subtotal', c.recaudado === 11000, String(c.recaudado));
verificar('E2 el lote más rentable cuenta el subtotal', c.loteMasRentable && c.loteMasRentable.dinero === 11000, JSON.stringify(c.loteMasRentable));

// ---------- Detalle de la venta ----------
verificar('D1 con costo de servicio el detalle muestra total, entradas y costo', U.textoDeMontoDeVenta(nueva()) === `${$(4860)} (entradas ${$(4500)} + costo de servicio ${$(360)})`, U.textoDeMontoDeVenta(nueva()));
verificar('D2 sin costo de servicio solo muestra el monto, como antes', U.textoDeMontoDeVenta(vieja()) === $(2000));
verificar('D3 sin datos muestra $0', U.textoDeMontoDeVenta(null) === '$0' && U.textoDeMontoDeVenta({}) === '$0');

// ---------- Reportes y Ventas: ya no suman monto_total para recaudar ----------
const reportes = fs.readFileSync(path.join(RAIZ, 'admin', 'reportes.html'), 'utf8');
verificar('P1 Reportes no suma monto_total en ninguna cifra de recaudación', !/monto_total/.test(reportes));
verificar('P2 Reportes usa ingresoDeVenta (importado de ventas-utils)', /ingresoDeVenta\(v\)/.test(reportes) && /nombreDeArchivoDeReporte, ingresoDeVenta(, \w+)* \} from "\.\.\/shared\/ventas-utils\.js"/.test(reportes));
const ventasHtml = fs.readFileSync(path.join(RAIZ, 'admin', 'ventas.html'), 'utf8');
verificar('P3 Ventas muestra el ingreso en la tabla y el desglose en el detalle', /ingresoDeVenta\(v\)/.test(ventasHtml) && /textoDeMontoDeVenta\(venta\)/.test(ventasHtml) && !/monto_total/.test(ventasHtml));
const dashboard = fs.readFileSync(path.join(RAIZ, 'admin', 'dashboard.html'), 'utf8');
verificar('P4 el Resumen no suma monto_total por su cuenta', !/monto_total/.test(dashboard));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
