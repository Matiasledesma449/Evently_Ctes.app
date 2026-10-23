// Prueba de la seccion 8 (panel de administracion): reglas compartidas (shared/ventas-utils.js), la pantalla
// de Ventas con un navegador simulado, y las cifras de Dashboard, Reportes y Panel Global.
// No usa red ni base de datos.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), 'utf8');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// ---------- Cargar shared/ventas-utils.js (es un modulo del navegador: se le quitan los "export") ----------
const codigoUtils = leer('shared', 'ventas-utils.js').replace(/^export /gm, '');
const NOMBRES = 'escaparHtml, esConfirmada, soloConfirmadas, resumenDeVentas, textoDelMotivo, etiquetaDeEstado, claseDeEstado, nombreDelComprador, avisosDeVenta, cifrasDelEvento, tarjetasDeResumen';
const U = vm.runInNewContext(codigoUtils + '\n;({ ' + NOMBRES + ' })');

// Extrae el texto de una funcion de una pagina (contando llaves)
function extraerFuncion(codigo, nombre) {
  const i = codigo.indexOf('function ' + nombre + '(');
  if (i < 0) throw new Error('No esta la funcion ' + nombre);
  let k = codigo.indexOf('{', codigo.indexOf(')', i));
  let nivel = 0;
  for (; k < codigo.length; k++) {
    if (codigo[k] === '{') nivel++;
    else if (codigo[k] === '}') { nivel--; if (nivel === 0) break; }
  }
  return codigo.slice(i, k + 1);
}

// ---------- Datos de prueba: un evento con 2 confirmadas, 1 pendiente y 1 rechazada (mas casos especiales) ----------
const t = (s) => ({ seconds: 1760000000 + s });
const VENTAS = [
  { id: 'C1', estado: 'confirmada', cantidad: 3, monto_total: 15000, metodo_pago: 'Crédito', nombre: 'Ana', apellido: 'Pérez', correo: 'ana@example.com', loteNombre: 'General', fecha: t(5), entradas: [{ codigo: 'ENT-1', usado: false }, { codigo: 'ENT-2', usado: false }, { codigo: 'ENT-3', usado: false }] },
  { id: 'C2', estado: 'confirmada', cantidad: 2, monto_total: 10000, metodo_pago: 'Débito', nombre: 'Luis', apellido: 'Gómez', correo: 'luis@example.com', loteNombre: 'VIP', fecha: t(4), entradas: [{ codigo: 'ENT-4', usado: false }, { codigo: 'ENT-5', usado: true }] },
  { id: 'P1', estado: 'pendiente', cantidad: 4, monto_total: 20000, nombre: 'Eva', apellido: 'Rios', correo: 'eva@example.com', loteNombre: 'General', fecha: t(3), entradas: [] },
  { id: 'R1', estado: 'rechazada', motivo: 'vencida', cantidad: 6, monto_total: 30000, nombre: 'Tomas', apellido: 'Paz', correo: 'tomas@example.com', loteNombre: 'General', fecha: t(2), entradas: [] },
  { id: 'R2', estado: 'rechazada', motivo: 'sin_stock', requiereReembolso: true, mpPaymentId: '555', cantidad: 1, monto_total: 5000, metodo_pago: undefined, nombre: 'Sol', apellido: 'Vega', correo: 'sol@example.com', loteNombre: 'General', fecha: t(1), entradas: [] },
  { id: 'X1', estado: 'anulada', cantidad: 2, monto_total: 9999, metodo_pago: 'Efectivo', correo: 'viejo@example.com', loteNombre: 'General', fecha: t(0) }, // venta vieja de prueba: sin nombre ni apellido
];

// ====================== 1. Reglas compartidas ======================
{
  const r = U.resumenDeVentas(VENTAS);
  verificar('U1 resumen: recaudacion y entradas suman SOLO las 2 confirmadas (25.000 y 5)', r.recaudado === 25000 && r.entradas === 5 && r.confirmadas === 2, JSON.stringify(r));
  verificar('U2 resumen: 1 pendiente de pago aparte y 2 rechazadas que no suman nada', r.pendientes === 1 && r.rechazadas === 2);
  verificar('U3 soloConfirmadas deja solo las confirmadas', U.soloConfirmadas(VENTAS).map((v) => v.id).join() === 'C1,C2');
  verificar('U4 entradas raras no rompen (nulo, vacio, montos en texto o invalidos)',
    (() => { const x = U.resumenDeVentas([null, undefined, { estado: 'confirmada', monto_total: 'abc', cantidad: null }, { estado: 'confirmada', monto_total: '1500', cantidad: '2' }]); return x.recaudado === 1500 && x.entradas === 2 && x.confirmadas === 2; })()
      && U.resumenDeVentas(undefined).recaudado === 0 && U.soloConfirmadas(null).length === 0);
  verificar('U5 escaparHtml neutraliza etiquetas, comillas y &', U.escaparHtml('<img src=x onerror="alert(1)">&\'`') === '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;&#96;');
  verificar('U6 escaparHtml acepta nulos y numeros', U.escaparHtml(null) === '' && U.escaparHtml(undefined) === '' && U.escaparHtml(42) === '42');
  verificar('U7 motivo "vencida": "No se pagó a tiempo"', U.textoDelMotivo('vencida') === 'No se pagó a tiempo');
  verificar('U8 cada motivo conocido tiene texto simple y un motivo desconocido nunca se muestra tal cual',
    ['pago_rechazado', 'pago_cancelado', 'sin_stock', 'lote_inconsistente', 'evento_inexistente', 'error_mercado_pago'].every((m) => U.textoDelMotivo(m) && !U.textoDelMotivo(m).includes('_'))
      && U.textoDelMotivo('algo_raro') === 'Motivo no especificado' && U.textoDelMotivo(null) === '' && U.textoDelMotivo(undefined) === '');
  verificar('U9 etiquetas y colores de estado (incluye el viejo "anulada")', U.etiquetaDeEstado('rechazada') === 'Rechazada' && U.etiquetaDeEstado('pendiente') === 'Pendiente de pago' && U.etiquetaDeEstado('anulada') === 'Anulada (anterior)' && U.etiquetaDeEstado(undefined) === 'N/A'
    && U.claseDeEstado('confirmada') === 'estado-confirmada' && U.claseDeEstado('pendiente') === 'estado-pendiente' && U.claseDeEstado('rechazada') === 'estado-rechazada' && U.claseDeEstado('anulada') === 'estado-rechazada');
  verificar('U10 nombre del comprador: "Nombre Apellido" y vacio en ventas viejas', U.nombreDelComprador(VENTAS[0]) === 'Ana Pérez' && U.nombreDelComprador(VENTAS[5]) === '' && U.nombreDelComprador({ nombre: 'Solo' }) === 'Solo' && U.nombreDelComprador(null) === '');
  const a = U.avisosDeVenta(VENTAS[4]);
  verificar('U11 reembolso pendiente: avisa que hay que devolver desde Mercado Pago e indica el pago', a.length === 1 && /devolver el dinero desde el panel de Mercado Pago/.test(a[0]) && /555/.test(a[0]), JSON.stringify(a));
  const d = U.avisosDeVenta({ estado: 'confirmada', requiereReembolso: true, motivoReembolso: 'pago_duplicado', pagosDuplicados: ['111', '222'] });
  verificar('U12 pago duplicado: avisa del pago repetido con sus numeros', d.length === 1 && /Pago repetido/.test(d[0]) && /111, 222/.test(d[0]), JSON.stringify(d));
  verificar('U13 pago para revisar: avisa monto o moneda distinta', U.avisosDeVenta({ requiereRevision: true }).some((x) => /monto o una moneda distinta/.test(x)));
  verificar('U14 una venta normal no tiene avisos', U.avisosDeVenta(VENTAS[0]).length === 0 && U.avisosDeVenta(null).length === 0);
}

// ====================== 2. Pantalla de Ventas (admin/ventas.html) ======================
const htmlVentas = leer('admin', 'ventas.html');
{
  const sinComentarios = htmlVentas.replace(/<!--[\s\S]*?-->/g, '');
  verificar('V1 ya no hay boton ni codigo para confirmar a mano (Confirmar Pago, confirmarPagoModal, updateDoc, acciones)',
    !/Confirmar Pago|confirmarPagoModal|updateDoc|modalVentaAcciones|confirm\(/.test(sinComentarios));
  verificar('V2 el estado "anulada" ya no se ofrece: hay filtro "Rechazadas" y la clase estado-rechazada', !/anulada|Anulada/.test(sinComentarios) && /data-filtro="rechazada">❌ Rechazadas/.test(sinComentarios) && /\.estado-rechazada/.test(sinComentarios));
  verificar('V3 el HTML ya no trae metodos fijos: solo "Todos los métodos" (los demas salen de las ventas)',
    (sinComentarios.match(/<select id="filtroMetodo"[\s\S]*?<\/select>/)[0].match(/<option/g) || []).length === 1 && !/value="Crédito"|value="Débito"|value="Prepaga"/.test(sinComentarios));
  verificar('V4 las tarjetas ya no son fijas en el HTML: las arma el JavaScript segun el filtro', /id="resumenVentas"/.test(sinComentarios) && !/id="totalRecaudado"|id="totalPendientes"/.test(sinComentarios) && /id="textoFiltro"/.test(sinComentarios) && /id="avisoMetodo"/.test(sinComentarios));
}

class Elemento {
  constructor(id, tag = 'div') { this.id = id; this.tag = tag; this._clases = new Set(); this.textContent = ''; this.value = ''; this.className = ''; this.hijos = []; this.dataset = {}; this._oyentes = {}; this._html = ''; }
  get innerHTML() { return this._html; } set innerHTML(v) { this._html = String(v); }
  get classList() { const s = this._clases; return { add: (...c) => c.forEach((x) => s.add(x)), remove: (...c) => c.forEach((x) => s.delete(x)), contains: (c) => s.has(c) }; }
  appendChild(n) { this.hijos.push(n); return n; }
  replaceChildren(...ns) { this.hijos = [...ns]; }
  addEventListener(tipo, fn) { (this._oyentes[tipo] = this._oyentes[tipo] || []).push(fn); }
  async clic() { for (const fn of this._oyentes.click || []) await fn.call(this, {}); }
  async dispararCambio() { for (const fn of this._oyentes.change || []) await fn.call(this, {}); }
  get textoCompleto() { return this.textContent + this.hijos.map((h) => h.textoCompleto).join(' '); }
}

function abrirPaginaVentas(ventas) {
  const ids = new Set([...htmlVentas.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const els = {}; ids.forEach((id) => { els[id] = new Elemento(id); });
  els.filtroMetodo.value = 'todos';
  const botones = ['todos', 'confirmada', 'pendiente', 'rechazada'].map((f) => { const b = new Elemento('btn-' + f, 'button'); b.dataset.filtro = f; return b; });
  const problemas = [];
  const ventana = { location: { search: '?id=Evt1', href: '' } };
  const contexto = {
    document: {
      getElementById: (id) => { if (!els[id]) { problemas.push('id inexistente: ' + id); return null; } return els[id]; },
      querySelectorAll: (sel) => (sel === '.filtro-btn' ? botones : []),
      createElement: (tag) => new Elemento('nuevo', tag),
    },
    window: ventana, localStorage: { getItem: () => 'Evt1' }, console: { error() {}, log() {} }, URLSearchParams,
    alert() { problemas.push('se llamo a alert'); },
    db: {}, collection: () => ({}), where: () => ({}), query: () => ({}),
    onSnapshot: (q, ok) => { ok({ forEach: (f) => ventas.forEach((v) => { const { id, ...resto } = v; f({ id, data: () => resto }); }) }); return () => {}; },
  };
  vm.createContext(contexto);
  const script = [...htmlVentas.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('escucharVentas'));
  vm.runInContext(codigoUtils + '\n' + script.replace(/^\s*import .*$/gm, ''), contexto);
  return { els, botones, ventana, problemas, contexto, filas: () => (els.tablaVentasBody.innerHTML.match(/<tr class="venta-card/g) || []).length };
}

// Lee el valor de una tarjeta del resumen por su titulo (o null si esa tarjeta no esta)
const tarjeta = (els, titulo) => {
  const m = els.resumenVentas.innerHTML.match(new RegExp('<p class="text-sm text-gray-500">' + titulo + '</p>\\s*<p class="[^"]*">([^<]*)</p>'));
  return m ? m[1] : null;
};
const $ = (n) => '$' + n.toLocaleString();

(async () => {
  {
    const p = abrirPaginaVentas(VENTAS);
    const { els } = p;
    verificar('V5 el JavaScript solo usa elementos que existen y no usa alert', p.problemas.length === 0, p.problemas.join(' | '));
    verificar('V6 todas las ventas se ven en "Todos" (6 filas, incluida la vieja)', p.filas() === 6, 'filas=' + p.filas());
    verificar('V7 "Todos": recaudado = solo las 2 confirmadas ($25.000)', tarjeta(els, 'Total recaudado') === $(25000), tarjeta(els, 'Total recaudado'));
    verificar('V8 "Todos": entradas vendidas = 5 (solo confirmadas)', tarjeta(els, 'Entradas vendidas') === '5', tarjeta(els, 'Entradas vendidas'));
    verificar('V9 "Todos": "Ventas confirmadas" = 2 y "Pendientes de pago" = 1', tarjeta(els, 'Ventas confirmadas') === '2' && tarjeta(els, 'Pendientes de pago') === '1');
    verificar('V9b "Todos": la linea dice que se muestran las 6 ventas de todos los metodos', els.textoFiltro.textContent === 'Mostrando: Todas las ventas · Todos los métodos · 6 ventas', els.textoFiltro.textContent);
    verificar('V9c el desplegable ofrece solo los metodos que existen en las ventas (Crédito, Débito y el viejo Efectivo)',
      /^<option value="todos">Todos los métodos<\/option><option value="Crédito">Crédito<\/option><option value="Débito">Débito<\/option><option value="Efectivo">Efectivo<\/option>$/.test(els.filtroMetodo.innerHTML), els.filtroMetodo.innerHTML);
    verificar('V9d sin metodo elegido no hay aviso de pendientes', els.avisoMetodo.classList.contains('hidden') && els.avisoMetodo.textContent === '');

    const html = els.tablaVentasBody.innerHTML;
    verificar('V10 se ve quien compro: nombre, apellido y correo reales', /Ana Pérez/.test(html) && /ana@example\.com/.test(html) && /Luis Gómez/.test(html));
    verificar('V11 la venta vieja (sin nombre ni apellido, estado "anulada") se muestra sin errores', /viejo@example\.com/.test(html) && /Anulada \(anterior\)/.test(html));
    verificar('V12 la rechazada por vencida dice "No se pagó a tiempo"', /No se pagó a tiempo/.test(html));
    verificar('V13 la rechazada por falta de stock muestra el aviso de reembolso pendiente', /Reembolso pendiente: hay que devolver el dinero desde el panel de Mercado Pago/.test(html) && /555/.test(html));
    verificar('V14 la tabla no muestra los codigos internos de los motivos', !/vencida<|sin_stock|pago_rechazado/.test(html.replace(/data-id="[^"]*"/g, '')));

    // Filtros
    await p.botones[1].clic();
    verificar('V15 filtro "Confirmadas": 2 filas y tarjetas propias ($25.000, 5 entradas, 2 ventas, promedio $12.500)',
      p.filas() === 2 && tarjeta(els, 'Total recaudado') === $(25000) && tarjeta(els, 'Entradas vendidas') === '5' && tarjeta(els, 'Ventas confirmadas') === '2' && tarjeta(els, 'Promedio por venta') === $(12500) && tarjeta(els, 'Pendientes de pago') === null);
    await p.botones[2].clic();
    verificar('V16 filtro "Pendientes": 1 fila y tarjetas propias (1 venta, 4 entradas y $20.000 en espera), sin tarjeta de recaudado',
      p.filas() === 1 && tarjeta(els, 'Ventas pendientes') === '1' && tarjeta(els, 'Entradas en espera') === '4' && tarjeta(els, 'Dinero en espera') === $(20000) && tarjeta(els, 'Total recaudado') === null && /Pendiente de pago/.test(els.tablaVentasBody.innerHTML));
    verificar('V16b filtro "Pendientes": la linea lo dice y "La mas antigua" tiene un valor', els.textoFiltro.textContent === 'Mostrando: Pendientes · Todos los métodos · 1 venta' && tarjeta(els, 'La más antigua') !== null && !/NaN|undefined/.test(tarjeta(els, 'La más antigua')), els.textoFiltro.textContent);
    await p.botones[3].clic();
    verificar('V17 filtro "Rechazadas": solo las 2 rechazadas, cada una con su motivo, y no suman dinero',
      p.filas() === 2 && /No se pagó a tiempo/.test(els.tablaVentasBody.innerHTML) && /Se agotaron las entradas/.test(els.tablaVentasBody.innerHTML));
    verificar('V17b filtro "Rechazadas": tarjetas propias (2 ventas, 7 entradas, $35.000 no cobrados), sin tarjeta de recaudado',
      tarjeta(els, 'Ventas rechazadas') === '2' && tarjeta(els, 'Entradas que no se vendieron') === '7' && tarjeta(els, 'Dinero no cobrado') === $(35000) && tarjeta(els, 'Total recaudado') === null && tarjeta(els, 'Motivo más frecuente') !== null);
    verificar('V18 la venta vieja "anulada" NO aparece en "Rechazadas"', !/viejo@example\.com/.test(els.tablaVentasBody.innerHTML));

    // Filtro por metodo
    await p.botones[0].clic();
    els.filtroMetodo.value = 'Crédito';
    await els.btnAplicarFiltros.clic();
    verificar('V19 filtro de metodo "Crédito" (con tilde): muestra solo la venta pagada con credito', p.filas() === 1 && /ana@example\.com/.test(els.tablaVentasBody.innerHTML));
    verificar('V19b con "Crédito" las tarjetas y la linea usan esa misma lista (1 venta, $15.000) y aparece el aviso de pendientes',
      tarjeta(els, 'Total recaudado') === $(15000) && tarjeta(els, 'Ventas confirmadas') === '1' && els.textoFiltro.textContent === 'Mostrando: Todas las ventas · Crédito · 1 venta' && !els.avisoMetodo.classList.contains('hidden') && /todavía no tienen método de pago/.test(els.avisoMetodo.textContent), els.textoFiltro.textContent);
    await p.botones[1].clic();
    els.filtroMetodo.value = 'Débito';
    await els.filtroMetodo.dispararCambio();
    verificar('V24 "Confirmadas" + "Débito" se aplican juntos y al instante (sin apretar el boton): 1 fila, $10.000',
      p.filas() === 1 && tarjeta(els, 'Total recaudado') === $(10000) && tarjeta(els, 'Ventas confirmadas') === '1' && els.textoFiltro.textContent === 'Mostrando: Confirmadas · Débito · 1 venta', els.textoFiltro.textContent);
    await p.botones[2].clic();
    verificar('V25 "Pendientes" + un metodo: no hay filas (las pendientes no tienen metodo), las tarjetas quedan en 0 y el aviso se ve',
      p.filas() === 0 && tarjeta(els, 'Ventas pendientes') === '0' && tarjeta(els, 'La más antigua') === '—' && !els.avisoMetodo.classList.contains('hidden'));
    p.contexto.aplicarFiltrosYRenderizar(VENTAS);
    verificar('V26 al llegar datos nuevos el metodo elegido se conserva mientras exista', els.filtroMetodo.value === 'Débito', els.filtroMetodo.value);
    p.contexto.aplicarFiltrosYRenderizar(VENTAS.filter((v) => v.metodo_pago !== 'Débito'));
    verificar('V27 si el metodo elegido ya no existe, vuelve a "Todos los métodos" y el aviso desaparece', els.filtroMetodo.value === 'todos' && els.avisoMetodo.classList.contains('hidden'), els.filtroMetodo.value);
    await p.botones[0].clic();
    els.filtroMetodo.value = 'todos';
    await els.btnAplicarFiltros.clic();

    // Detalle
    window = p.ventana;
    p.ventana.abrirDetalleVenta('P1');
    verificar('V20 detalle de una venta pendiente: se abre, muestra el comprador y NO hay ningun boton para confirmar', !els.modalVenta.classList.contains('hidden') && /Eva Rios/.test(els.modalVentaCorreo.textContent) && !('modalVentaAcciones' in els) && /Pendiente de pago/.test(els.modalVentaEstadoContainer.textoCompleto));
    p.ventana.abrirDetalleVenta('R2');
    verificar('V21 detalle de la venta sin stock: muestra motivo y el aviso de reembolso con el numero de pago', /Se agotaron las entradas/.test(els.modalVentaEstadoContainer.textoCompleto) && /devolver el dinero/.test(els.modalVentaAvisos.textoCompleto) && /555/.test(els.modalVentaAvisos.textoCompleto));
    p.ventana.abrirDetalleVenta('C1');
    verificar('V22 detalle de una confirmada: lista los codigos, uno por linea', els.modalVentaCodigos.textContent === 'ENT-1\nENT-2\nENT-3' && els.modalVentaAvisos.hijos.length === 0, JSON.stringify(els.modalVentaCodigos.textContent));
    p.ventana.abrirDetalleVenta('X1');
    verificar('V23 detalle de la venta vieja: sin errores aunque falten nombre y apellido', /viejo@example\.com/.test(els.modalVentaCorreo.textContent) && !/undefined/.test(els.modalVentaCorreo.textContent));
  }

  // ---------- Seguridad: lo que escribe el comprador no se ejecuta en el panel ----------
  {
    const peligrosas = [
      { id: 'M1', estado: 'confirmada', cantidad: 1, monto_total: 100, metodo_pago: 'Crédito', nombre: 'Ana', apellido: 'Paz', correo: '<img/src=x/onerror=alert(1)>@a.bc', loteNombre: '<script>alert(2)</script>', fecha: t(9), entradas: [] },
      { id: 'M2', estado: 'rechazada', motivo: '<b>raro</b>', cantidad: 1, monto_total: 1, nombre: '"><svg onload=alert(3)>', apellido: 'X', correo: 'a@b.cd', loteNombre: 'General', fecha: t(8), metodo_pago: '<i>m</i>' },
    ];
    const p = abrirPaginaVentas(peligrosas);
    const html = p.els.tablaVentasBody.innerHTML;
    verificar('S1 correo, lote, nombre y metodo con HTML se muestran como texto en la tabla (sin etiquetas reales)', !/<img|<script|<svg|<b>raro|<i>/.test(html) && /&lt;img/.test(html) && /&lt;script&gt;/.test(html) && /&lt;svg/.test(html));
    verificar('S2 los atributos no se pueden romper con comillas', !/onerror=alert|onload=alert/.test(html.replace(/&quot;|&lt;|&gt;/g, '')) || !/"\s*onerror|"\s*onload/.test(html));
    verificar('S1b un metodo de pago con HTML se muestra como texto en el desplegable y en las tarjetas',
      !/<i>/.test(p.els.filtroMetodo.innerHTML) && /&lt;i&gt;m&lt;\/i&gt;/.test(p.els.filtroMetodo.innerHTML) && !/<i>|<svg|<script/.test(p.els.resumenVentas.innerHTML));
    p.ventana.abrirDetalleVenta('M1');
    verificar('S3 el detalle usa solo texto (nunca interpreta HTML)', p.els.modalVentaCorreo.textContent.includes('<img/src=x/onerror=alert(1)>@a.bc') && p.els.modalVentaLote.textContent.includes('<script>'));
    p.ventana.abrirDetalleVenta('M2');
    verificar('S4 un motivo desconocido o con HTML nunca se muestra tal cual', !/raro/.test(p.els.modalVentaEstadoContainer.textoCompleto) && /Motivo no especificado/.test(p.els.modalVentaEstadoContainer.textoCompleto));
  }

  // ====================== 3. Resumen (cifras del evento) ======================
  // Resumen arma sus tarjetas con cifrasDelEvento y tarjetasDeResumen (las mismas funciones que usa Reportes)
  {
    const html = leer('admin', 'dashboard.html');
    const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
    const evento = { lotes: [{ nombre: 'General', disponibles: 100, vendidas: 5, precio: 5000 }] };
    const tarjetas = U.tarjetasDeResumen(U.cifrasDelEvento([evento], VENTAS));
    const valor = (titulo) => (tarjetas.find((x) => x.titulo === titulo) || {}).valor;
    const todo = tarjetas.map((x) => x.titulo + ' ' + x.valor + ' ' + x.ayuda).join(' | ');
    verificar('D1 resumen: la recaudacion suma solo las 2 confirmadas ($25.000)', valor('Total recaudado') === '$' + (25000).toLocaleString(), valor('Total recaudado'));
    verificar('D2 resumen: "Ventas confirmadas" = 2 y 5 entradas vendidas (aunque el contador del lote diga 5 por otra razon)', valor('Ventas confirmadas') === '2' && valor('Entradas vendidas') === '5');
    verificar('D3 resumen: muestra 1 "Pendientes de pago" aparte', valor('Pendientes de pago') === '1');
    verificar('D4 resumen: no suma las rechazadas ni las pendientes (ni 20.000 ni 30.000 ni 5.000 de ellas, ni 9.999 de la vieja)', !todo.includes('$' + (45000).toLocaleString()) && !todo.includes('$' + (60000).toLocaleString()) && !todo.includes('$' + (35000).toLocaleString()));
    verificar('D5 resumen: el metodo mas usado sale solo de las confirmadas (no cuenta "Efectivo" de la vieja ni los sin metodo)', !/Efectivo|Desconocido/.test(todo));
    const vacias = U.tarjetasDeResumen(U.cifrasDelEvento([evento], []));
    verificar('D6 resumen: sin ventas no se rompe y muestra $0', (vacias.find((x) => x.titulo === 'Total recaudado') || {}).valor === '$0');
    verificar('D7 resumen: la pagina usa las funciones compartidas y ya no calcula ni usa los contadores "vendidas" de los lotes',
      /cifrasDelEvento/.test(sinComentarios) && /tarjetasDeResumen/.test(sinComentarios) && !/\.vendidas|actualizarKPIs/.test(sinComentarios));
    verificar('D8 resumen: no hay un texto "Cargando datos..." que se reemplace de golpe, y no redirige cuando falta el evento', !/Cargando datos/.test(sinComentarios) && !/window\.location\.href\s*=\s*'eventos-seleccion\.html'/.test(sinComentarios));
  }

  // ====================== 4. Reportes ======================
  {
    const html = leer('admin', 'reportes.html');
    const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
    verificar('R1 reportes: ya no hay ningun "[...ventas]" y soloConfirmadas se aplica en un unico lugar', !/\[\.\.\.ventas\]/.test(html) && (html.match(/soloConfirmadas\(ventas\)/g) || []).length === 1);
    verificar('R2 reportes: el filtro de metodo sale de los datos (metodosDePago), sin metodos fijos en el HTML', /metodosDePago\(ventas\)/.test(html) && !/<option value="(Crédito|Débito|Prepaga|Dinero en cuenta|Efectivo|Transferencia|Mixto)"/.test(html));

    // aplicarFiltros: se le pasa a cada seccion SOLO lo confirmado del lote y metodo elegidos
    const capturas = {};
    const nombresRender = ['renderResumen', 'renderDesglose', 'renderTransacciones', 'renderMetodos', 'renderComportamiento', 'renderIndicadores'];
    const utils = vm.runInNewContext(codigoUtils + '\n;({ resumenDeVentas, soloConfirmadas, cifrasDelEvento })');
    const ctx = { ventas: VENTAS, loteFilter: { value: 'todos' }, metodoFilter: { value: 'todos' }, textoFiltro: {}, datosListos: () => true, textoDeFiltros: () => 'x', ...utils };
    nombresRender.forEach((n) => { ctx[n] = (v) => { capturas[n] = v; }; });
    vm.createContext(ctx);
    vm.runInContext(extraerFuncion(html, 'ventasFiltradasActuales') + extraerFuncion(html, 'aplicarFiltros') + ';this.aplicarFiltros = aplicarFiltros;', ctx);
    ctx.aplicarFiltros();
    verificar('R3 reportes: todas las secciones reciben solo las 2 confirmadas', nombresRender.every((n) => capturas[n] && capturas[n].map((v) => v.id).join() === 'C1,C2'), JSON.stringify(Object.fromEntries(nombresRender.map((n) => [n, capturas[n] && capturas[n].map((v) => v.id)]))));
    ctx.loteFilter.value = 'VIP';
    ctx.aplicarFiltros();
    verificar('R4 reportes: el filtro de lote sigue funcionando sobre las confirmadas', capturas.renderResumen.map((v) => v.id).join() === 'C2');
    ctx.loteFilter.value = 'todos'; ctx.metodoFilter.value = 'Crédito';
    ctx.aplicarFiltros();
    verificar('R5 reportes: el filtro de metodo sigue funcionando sobre las confirmadas', capturas.renderResumen.map((v) => v.id).join() === 'C1');

    // cifras: las mismas que Resumen (cifrasDelEvento), con la capacidad de los lotes elegidos y los pendientes aparte
    const kpi = { innerHTML: '' };
    const evento = { id: 'E', lotes: [{ nombre: 'General', disponibles: 100 }, { nombre: 'VIP', disponibles: 50 }] };
    const ctx2 = { ventas: VENTAS, eventos: [evento], loteFilter: { value: 'todos' }, metodoFilter: { value: 'todos' }, kpiContainer: kpi, ...vm.runInNewContext(codigoUtils + '\n;({ resumenDeVentas, soloConfirmadas, cifrasDelEvento, tarjetasDeResumen, htmlDeTarjetasResumen, escaparHtml })') };
    vm.createContext(ctx2);
    vm.runInContext(['cifrasActuales', 'dibujarTarjetas', 'renderResumen'].map((n) => extraerFuncion(html, n)).join('\n') + ';this.renderResumen = renderResumen;', ctx2);
    ctx2.renderResumen(U.soloConfirmadas(VENTAS));
    const h = kpi.innerHTML.replace(/\s+/g, ' ');
    verificar('R6 reportes: recaudacion $25.000, 5 entradas vendidas, 2 ventas confirmadas (como Resumen)', h.includes('$' + (25000).toLocaleString() + '</p>') && /Entradas vendidas<\/span>[\s\S]*?>5</.test(h) && /Ventas confirmadas<\/span>[\s\S]*?>2<\/p>/.test(h));
    verificar('R7 reportes: muestra 1 "Pendientes de pago" aparte y la capacidad de todos los lotes (150)', /Pendientes de pago<\/span>[\s\S]*?>1<\/p>/.test(h) && /Capacidad total<\/span>[\s\S]*?>150</.test(h));
    ctx2.loteFilter.value = 'VIP';
    ctx2.renderResumen(U.soloConfirmadas(VENTAS).filter((v) => v.loteNombre === 'VIP'));
    const hv = kpi.innerHTML.replace(/\s+/g, ' ');
    verificar('R8 reportes: con el lote VIP los pendientes respetan el lote (0) y la capacidad es la de VIP (50)', /Pendientes de pago<\/span>[\s\S]*?>0<\/p>/.test(hv) && /Capacidad total<\/span>[\s\S]*?>50</.test(hv));
    // "Todos los eventos": dos eventos con un lote "General" no se juntan
    {
      const evs = [{ id: 'A', nombre: 'Fiesta A', lotes: [{ nombre: 'General', precio: 10, disponibles: 5 }] }, { id: 'B', nombre: 'Fiesta B', lotes: [{ nombre: 'General', precio: 99, disponibles: 7 }] }];
      const c = { EN_TODOS: true, eventos: evs };
      vm.createContext(c);
      vm.runInContext(['claveDeLote', 'claveDelLote', 'etiquetaDeLote', 'lotesInfoActual'].map((n) => extraerFuncion(html, n)).join('\n') + ';this.api = { claveDeLote, claveDelLote, etiquetaDeLote, lotesInfoActual };', c);
      const k1 = c.api.claveDeLote({ eventoId: 'A', loteNombre: 'General' });
      const k2 = c.api.claveDeLote({ eventoId: 'B', loteNombre: 'General' });
      const info = c.api.lotesInfoActual();
      verificar('R8c reportes (Todos): el lote "General" de dos eventos son filas distintas, con su propio precio y etiqueta "Evento · Lote"', k1 !== k2 && info[k1].precio === 10 && info[k2].precio === 99 && c.api.etiquetaDeLote(k2) === 'Fiesta B · General' && c.api.etiquetaDeLote('N/A') === 'N/A');
    }
    verificar('R8b reportes: lee solo el evento elegido (ya no suscribe a todos los eventos sin filtro) y no redirige si falta el evento', /where\("eventoId", "==", eventoId\)/.test(sinComentarios) && !/window\.location\.href\s*=\s*'eventos-seleccion\.html'/.test(sinComentarios));
  }

  // Reportes: la tabla de transacciones y el PDF no deben mostrar sin escapar el correo, el lote ni el metodo
  {
    const html = leer('admin', 'reportes.html');
    const sinEscapar = html.match(/\$\{v\.(correo|comprador|loteNombre|metodo_pago)[^}]*\}/g) || [];
    verificar('R9 reportes: ningun correo, lote ni metodo se inserta en el HTML sin escapar', sinEscapar.length === 0, sinEscapar.join(' | '));
    verificar('R9b reportes: la pestana Indicadores escapa titulo y valor (vienen de nombres de lote y metodo)', /\$\{escaparHtml\(ind\.label\)\}/.test(html) && /\$\{escaparHtml\(ind\.value\)\}/.test(html) && !/\$\{ind\.(label|value)\}/.test(html));
    verificar('R10 reportes: importa y usa escaparHtml', /import \{[^}]*escaparHtml[^}]*\} from "\.\.\/shared\/ventas-utils\.js"/.test(html) && (html.match(/escaparHtml\(/g) || []).length >= 13);

    const contenedor = { innerHTML: '' };
    const ctx = { document: { getElementById: () => contenedor }, ...vm.runInNewContext(codigoUtils + '\n;({ escaparHtml })') };
    vm.createContext(ctx);
    vm.runInContext(extraerFuncion(html, 'renderTransacciones') + ';this.renderTransacciones = renderTransacciones;', ctx);
    ctx.renderTransacciones([{ id: 'M1', estado: 'confirmada', cantidad: 1, monto_total: 100, metodo_pago: '<i>m</i>', correo: '<img/src=x/onerror=alert(1)>@a.bc', loteNombre: '<script>alert(2)</script>', fecha: { seconds: 1760000000 } }]);
    verificar('R11 reportes: la tabla real de transacciones muestra el correo y el metodo con codigo como texto',
      !/<img|<i>/.test(contenedor.innerHTML) && /&lt;img/.test(contenedor.innerHTML) && /&lt;i&gt;m&lt;\/i&gt;/.test(contenedor.innerHTML), contenedor.innerHTML.slice(0, 300));
    verificar('R12 reportes: una venta confirmada se ve con etiqueta verde (antes salia roja por comparar con mayuscula)',
      /bg-green-100 text-green-700">confirmada</.test(contenedor.innerHTML) && !/bg-red-100/.test(contenedor.innerHTML));
  }

  // ====================== 5. Panel Global (superadmin) ======================
  {
    const html = leer('admin', 'superadmin.html');
    const ev = { id: 'Evt1', nombre: 'Fiesta', lugar: 'Costanera', fechaPublicacion: { seconds: 1760000000 } };
    const contenedor = { innerHTML: '' };
    const ctx = {
      ventasGlobales: VENTAS.map((v) => ({ ...v, eventoId: 'Evt1' })).concat([{ id: 'Z', estado: 'confirmada', cantidad: 99, monto_total: 99999, eventoId: 'OtroEvento' }]),
      filtroOrganizacion: { value: 'todas' },
      document: { getElementById: () => contenedor },
      organizacionesFiltradas: () => [{ id: 'org1', nombre: 'Org Uno' }],
      eventosDeOrganizacion: () => [ev],
      ...vm.runInNewContext(codigoUtils + '\n;({ soloConfirmadas })'),
    };
    vm.createContext(ctx);
    vm.runInContext(extraerFuncion(html, 'renderizarEventosGlobales') + ';this.renderizarEventosGlobales = renderizarEventosGlobales;', ctx);
    ctx.renderizarEventosGlobales();
    verificar('G1 panel global: el evento muestra $25.000 y 5 entradas (solo confirmadas, y solo las de ese evento)', contenedor.innerHTML.includes('$' + (25000).toLocaleString('es-AR')) && /5 entradas/.test(contenedor.innerHTML), contenedor.innerHTML.replace(/\s+/g, ' ').slice(-260));
    verificar('G2 panel global: no suma pendientes, rechazadas, la venta vieja ni otros eventos', !/99\.999|45\.000|\b11 entradas|\b17 entradas/.test(contenedor.innerHTML));
    const h = html;
    verificar('G3 panel global: el detalle por organizacion tambien filtra a las confirmadas', (h.match(/soloConfirmadas\(ventasGlobales\.filter/g) || []).length === 2);
    verificar('G4 las cuatro pantallas importan las reglas compartidas', ['dashboard', 'reportes', 'superadmin', 'ventas'].every((n) => /shared\/ventas-utils\.js/.test(leer('admin', n + '.html'))));
  }

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
