// Prueba de los datos del Resumen en gráficos (shared/resumen-visual.js) y de los cambios del 28/10 a la noche:
// Reportes sin porcentajes ni "Secciones del PDF", Ojo de halcón sin correo de prueba y banners legales como el de Ayuda.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};
const leer = (archivo) => fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
const sinExport = (archivo) => leer(archivo).replace(/^export /gm, '').replace(/^import .*$/gm, '');
const P = vm.runInNewContext(sinExport('shared/porcentajes.js') + '\n;({ porcentaje, repartoPorcentual })');
const R = vm.runInNewContext(sinExport('shared/resumen-visual.js') + '\n;({ datosDelResumen, ventasPorDia, horaEnArgentina, diaEnArgentina, fechaDeVenta })',
  { Intl, porcentaje: P.porcentaje, repartoPorcentual: P.repartoPorcentual });

// 15/11 21:30 y 23:10 en Argentina (UTC-3), y 17/11 10:05
const t = (iso) => ({ seconds: Math.floor(new Date(iso).getTime() / 1000) });
const evento = { lotes: [{ nombre: 'Preventa', disponibles: 10 }, { nombre: 'General', disponibles: 30 }] };
const ventas = [
  { estado: 'confirmada', cantidad: 2, subtotal: 2000, monto_total: 2200, loteNombre: 'Preventa', metodo_pago: 'credito', fecha: t('2026-11-16T00:30:00Z') },
  { estado: 'confirmada', cantidad: 3, subtotal: 3000, loteNombre: 'General', metodo_pago: 'debito', fecha: t('2026-11-16T02:10:00Z') },
  { estado: 'confirmada', cantidad: 1, monto_total: 1000, loteNombre: 'General', metodo_pago: 'credito', fecha: t('2026-11-17T13:05:00Z') },
  { estado: 'pendiente', cantidad: 4, subtotal: 4000, loteNombre: 'General', fecha: t('2026-11-17T14:00:00Z') },
  { estado: 'rechazada', cantidad: 1, subtotal: 1000, loteNombre: 'General', fecha: t('2026-11-17T15:00:00Z') },
];
const d = R.datosDelResumen(evento, ventas, { claveDe: (m) => m, nombreDe: (c) => c.toUpperCase() });

verificar('R1 recaudado: solo confirmadas y sin costo de servicio (2000 + 3000 + 1000)', d.recaudado === 6000, d.recaudado);
verificar('R2 entradas, capacidad y ocupación (6 de 40 = 15%)', d.entradas === 6 && d.capacidad === 40 && d.ocupacion === 15, JSON.stringify([d.entradas, d.capacidad, d.ocupacion]));
verificar('R3 compras confirmadas y pagos en curso', d.compras === 3 && d.pendientes === 1);
verificar('R4 cada lote: vendido sobre su capacidad y su plata', JSON.stringify(d.lotes.map((l) => [l.nombre, l.vendidas, l.capacidad, l.porcentaje, l.dinero])) === JSON.stringify([['Preventa', 2, 10, 20, 2000], ['General', 4, 30, 13.3, 4000]]), JSON.stringify(d.lotes));
verificar('R5 formas de pago con su nombre y porcentaje', JSON.stringify(d.metodos.map((m) => [m.etiqueta, m.porcentaje])) === JSON.stringify([['CREDITO', 66.7], ['DEBITO', 33.3]]), JSON.stringify(d.metodos));
verificar('R6 estado de las compras cuenta todas (3 de 5 confirmadas = 60%)', d.estados[0].valor === 3 && d.estados[0].porcentaje === 60 && d.estados[1].valor === 1 && d.estados[2].valor === 1);
verificar('R7 ventas por día en hora argentina y sin huecos (15, 16 vacío, 17)',
  JSON.stringify(d.porDia.map((x) => [x.dia, x.entradas])) === JSON.stringify([['2026-11-15', 5], ['2026-11-16', 0], ['2026-11-17', 1]]), JSON.stringify(d.porDia));
verificar('R8 compras por hora en Argentina (21h, 23h y 10h)', d.porHora[21] === 1 && d.porHora[23] === 1 && d.porHora[10] === 1 && d.porHora.reduce((a, b) => a + b, 0) === 3);
const vacio = R.datosDelResumen(null, null);
verificar('R9 sin evento ni ventas no se rompe', vacio.recaudado === 0 && vacio.ocupacion === 0 && vacio.porDia.length === 0 && vacio.hayVentas === false);
verificar('R10 una venta con un lote que ya no existe igual se cuenta', R.datosDelResumen(evento, [{ estado: 'confirmada', cantidad: 1, subtotal: 5, loteNombre: 'Viejo' }]).lotes.some((l) => l.nombre === 'Viejo' && l.vendidas === 1));
const muchos = Array.from({ length: 90 }, (_, i) => ({ estado: 'confirmada', cantidad: 1, subtotal: 1, fecha: t(new Date(Date.UTC(2026, 0, 1 + i, 15)).toISOString()) }));
verificar('R11 ventas por día muestra como mucho los últimos 60 días', R.ventasPorDia(muchos).length === 60);

// ---------- Páginas ----------
const resumen = leer('admin/dashboard.html');
verificar('P1 el Resumen dibuja gráficos y ya no repite las tarjetas de Reportes', /dibujarResumenVisual/.test(resumen) && !/tarjetasDeResumen|kpiContainer|panelPorcentajes/.test(resumen));
const reportes = leer('admin/reportes.html');
verificar('P2 Reportes ya no tiene el panel de porcentajes ni las casillas "Secciones del PDF"', !/panelPorcentajes|dibujarPanelPorcentajes|Secciones del PDF|seccionesPdf/.test(reportes) && /btnExportarPDF/.test(reportes));
verificar('P3 Ojo de halcón ya no tiene el correo de prueba (ni su función en el servidor)', !/correo-de-prueba|ojoCorreoPrueba/.test(leer('admin/ojo-de-halcon.html')) && !fs.existsSync(path.join(RAIZ, 'api', 'correo-de-prueba.js')));
verificar('P4 los banners legales son como el del Centro de ayuda (centrado, título grande)', ['terminos', 'privacidad', 'arrepentimiento'].every((p) => /text-center">\s*<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">/.test(leer(`public/${p}.html`))));
verificar('P5 la barra "Estás viendo" arranca donde termina el menú', /#franjaOrganizacion \{ left: 256px; \}/.test(leer('shared/admin-shell.css')));
verificar('P6 los gráficos no usan innerHTML (todo con textContent)', !/innerHTML|insertAdjacentHTML/.test(leer('shared/resumen-visual.js').replace(/\/\/.*$/gm, '')));

console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
process.exit(mal === 0 ? 0 : 1);
