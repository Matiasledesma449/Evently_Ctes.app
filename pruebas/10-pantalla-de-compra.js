// Prueba de la seccion 6 (public/evento.html): HTML estatico + comportamiento del JavaScript real con un navegador simulado.
const fs = require('fs');
const vm = require('vm');
const ARCHIVO = require('path').join(__dirname, '..', 'public', 'evento.html');
const html = fs.readFileSync(ARCHIVO, 'utf8');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// ====================== 6.1 y 6.3: HTML estatico ======================
const paso2 = html.slice(html.indexOf('id="step2"'), html.indexOf('id="loadingContainer"'));
const inputs = [...paso2.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
const ids = inputs.map((i) => (i.match(/id="([^"]+)"/) || [])[1]);
verificar('6.1a el paso 2 solo tiene 3 campos: nombre, apellido y correo', JSON.stringify(ids) === '["inputNombre","inputApellido","inputCorreo"]', JSON.stringify(ids));
// Se mira solo lo que se renderiza: los comentarios del HTML no se muestran en pantalla
const htmlRenderizado = html.replace(/<!--[\s\S]*?-->/g, '');
verificar('6.1b no hay campos de tarjeta, billetera ni efectivo (ni sus ids ni sus estilos)',
  !/cardNumber|cardCvv|cardExp|cardName|debitCard|cuotas|billetera|tarjeta-option|metodo-option|pagoEfectivo|pagoTransferencia|pagoCredito|pagoDebito|data-metodo/i.test(htmlRenderizado));
verificar('6.1c ningun input pide numero de tarjeta, vencimiento ni CVV', !inputs.some((i) => /cvv|card|tarjeta|vencim|expir/i.test(i)));
verificar('6.1d hay aviso visible de modo de prueba', /id="avisoModoPrueba"/.test(paso2) && /Modo de prueba/.test(paso2) && /no se cobra dinero real/i.test(paso2));
verificar('6.1e el boton dice "Pagar con Mercado Pago" y hay resumen de la compra', />\s*Pagar con Mercado Pago\s*</.test(paso2) && /Resumen de tu compra/.test(paso2) && /id="totalMostrado"/.test(paso2));
verificar('6.1f el formulario tiene correo, nombre y apellido con autocompletado', /autocomplete="given-name"/.test(paso2) && /autocomplete="family-name"/.test(paso2) && /autocomplete="email"/.test(paso2));

const prohibidosEnArchivo = ['addDoc', 'updateDoc', 'sin-correo@evently.com', 'serverTimestamp', 'recargo', 'alert(', 'Date.now()', 'monto_total', 'metodo_pago'];
const encontrados = prohibidosEnArchivo.filter((p) => html.includes(p));
verificar('6.3 el archivo no contiene addDoc, updateDoc, sin-correo@evently.com, serverTimestamp, recargos ni alert()', encontrados.length === 0, encontrados.join(','));
verificar('6.3b ya no escribe en "ventas" ni en "eventos" desde el navegador', !/collection\(db|setDoc|deleteDoc|writeBatch|runTransaction/.test(html) && !/"ventas"/.test(html));

// ====================== Navegador simulado ======================
const idsEnHtml = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const problemas = [];

class El {
  constructor(id) {
    this.id = id; this._clases = new Set(); this.textContent = ''; this.value = ''; this.disabled = false;
    this._attrs = {}; this._oyentes = {}; this.focos = 0; this.escrituraHtml = 0; this._html = '';
    const self = this;
    this.classList = {
      add: (...c) => c.forEach((x) => self._clases.add(x)), remove: (...c) => c.forEach((x) => self._clases.delete(x)),
      contains: (c) => self._clases.has(c), toggle: (c, forzar) => { const poner = forzar === undefined ? !self._clases.has(c) : !!forzar; poner ? self._clases.add(c) : self._clases.delete(c); },
    };
  }
  // En un navegador real, asignar un numero a un campo de texto lo convierte en texto
  get value() { return this._valor === undefined ? '' : this._valor; }
  set value(v) { this._valor = String(v); }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = v; this.escrituraHtml++; }
  addEventListener(t, fn) { (this._oyentes[t] = this._oyentes[t] || []).push(fn); }
  async disparar(t, ev = {}) { for (const fn of this._oyentes[t] || []) await fn({ preventDefault() {}, ...ev }); }
  setAttribute(k, v) { this._attrs[k] = v; } removeAttribute(k) { delete this._attrs[k]; } getAttribute(k) { return this._attrs[k]; }
  focus() { this.focos++; }
  querySelectorAll() { return []; } querySelector() { return null; }
  get oculto() { return this._clases.has('hidden'); }
}

function crearPagina({ evento, fetchFn, buscar = '?id=Evt1' }) {
  const els = {};
  for (const id of idsEnHtml) els[id] = new El(id);
  // Los .lote-card aparecen cuando el JS escribe el HTML de los lotes
  els.lotesContainer.querySelectorAll = (sel) => {
    if (sel !== '.lote-card') return [];
    const n = (els.lotesContainer.innerHTML.match(/class="lote-card/g) || []).length;
    els.lotesContainer._cards = els.lotesContainer._cards || Array.from({ length: n }, () => {
      const c = new El('card'); c.click = () => c.disparar('click'); return c;
    });
    return els.lotesContainer._cards;
  };
  const ubicacion = { search: buscar, navegadoA: null, set href(v) { this.navegadoA = v; } };
  const ventana = { location: ubicacion, _oyentes: {}, addEventListener(t, fn) { (this._oyentes[t] = this._oyentes[t] || []).push(fn); } };
  const alertas = [];
  const contexto = {
    document: { getElementById: (id) => { if (!els[id]) { problemas.push('getElementById con id inexistente: ' + id); return null; } return els[id]; }, querySelectorAll: () => [] },
    window: ventana, URLSearchParams, URL, console: { error() {}, log() {}, warn() {} }, setTimeout, Promise,
    alert: (m) => alertas.push(m),
    db: {}, doc: (db, col, id) => ({ col, id }),
    getDoc: async () => ({ exists: () => true, id: 'Evt1', data: () => evento }),
    fetch: (...a) => contexto._fetch(...a), _fetch: fetchFn,
  };
  vm.createContext(contexto);
  // Los modulos compartidos (escaparHtml, htmlDeImagenEvento) se cargan sin sus "export", como en las otras pruebas
  const compartido = (archivo) => fs.readFileSync(require('path').join(__dirname, '..', 'shared', archivo), 'utf8').replace(/^export /gm, '');
  vm.runInContext(compartido('ventas-utils.js') + ';' + compartido('imagen-evento.js') + ';' + compartido('formas-de-pago.js'), contexto);
  const js = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*$/gm, '');
  vm.runInContext(js, contexto);
  return { els, ubicacion, ventana, alertas, contexto };
}

const tick = () => new Promise((r) => setImmediate(r));
const EVENTO = { nombre: 'Fiesta del Rio', fecha: '15 Dic 2026', lugar: 'Costanera', lotes: [
  { nombre: 'General', precio: 5000, disponibles: 100, vendidas: 10 },
  { nombre: 'Agotado', precio: 9000, disponibles: 5, vendidas: 5 },
  { nombre: 'Pocos', precio: 7000, disponibles: 4, vendidas: 2 },
] };
const respuesta = (status, json, { sinJson = false } = {}) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => { if (sinJson) throw new Error('no es json'); return json; } });

async function irAlPaso2(pagina, { lote = 0, cantidad } = {}) {
  await tick(); await tick();
  const cards = pagina.els.lotesContainer.querySelectorAll('.lote-card');
  await cards[lote].click();
  if (cantidad !== undefined) { pagina.els.cantidadInput.value = String(cantidad); await pagina.els.cantidadInput.disparar('change'); }
  await pagina.els.btnContinuarPaso1.disparar('click');
}
async function completar(pagina, d = {}) {
  pagina.els.inputNombre.value = d.nombre ?? 'Ana';
  pagina.els.inputApellido.value = d.apellido ?? 'Prueba';
  pagina.els.inputCorreo.value = d.correo ?? 'ana@example.com';
}
const enviar = async (pagina) => { await pagina.els.formCompra.disparar('submit'); await tick(); await tick(); };

(async () => {
  // ---------- Carga y paso 1 ----------
  {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(200, {}) });
    await irAlPaso2(p, { cantidad: 3 });
    verificar('P1 sin ids inexistentes: el JavaScript solo usa elementos que estan en el HTML', problemas.length === 0, problemas.join(' | '));
    verificar('P2 avanza al paso 2', p.els.step2._clases.has('active') && !p.els.step1._clases.has('active'));
    verificar('P3 el resumen muestra evento, lote, cantidad y total', p.els.resumenEvento.textContent === 'Fiesta del Rio' && p.els.resumenLote.textContent === 'General' && p.els.resumenCantidad.textContent === '3' && p.els.totalMostrado.textContent === '$' + (15000).toLocaleString(), p.els.totalMostrado.textContent);
  }
  {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(200, {}) });
    await irAlPaso2(p, { lote: 1 }); // lote agotado
    verificar('P4 lote agotado: se avisa en pantalla (sin alert) y no avanza', !p.els.errorPaso1.oculto && /agotado/i.test(p.els.errorPaso1.textContent) && !p.els.step2._clases.has('active') && p.alertas.length === 0, p.els.errorPaso1.textContent);
    const q = crearPagina({ evento: EVENTO, fetchFn: respuesta(200, {}) });
    await irAlPaso2(q, { lote: 2, cantidad: 5 }); // quedan 2
    verificar('P5 mas entradas que las que quedan: aviso en pantalla con cuantas quedan', !q.els.errorPaso1.oculto && /solo 2/.test(q.els.errorPaso1.textContent) && !q.els.step2._clases.has('active'), q.els.errorPaso1.textContent);
    const r = crearPagina({ evento: EVENTO, fetchFn: respuesta(200, {}) });
    await irAlPaso2(r, { cantidad: 99 });
    verificar('P6 cantidad exagerada se corrige al maximo (10)', r.els.cantidadInput.value === '10' && r.els.resumenCantidad.textContent === '10', r.els.cantidadInput.value);
  }

  // ---------- 6.2: pago exitoso ----------
  {
    const pedidos = [];
    const p = crearPagina({ evento: EVENTO, fetchFn: async (url, op) => { pedidos.push({ url, op }); return { ok: true, status: 200, json: async () => ({ ok: true, urlPago: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123' }) }; } });
    await irAlPaso2(p, { cantidad: 2 }); await completar(p, { nombre: ' Ana ', correo: 'ANA@Example.com' });
    await enviar(p);
    const cuerpo = JSON.parse(pedidos[0].op.body);
    verificar('S1 llama a POST /api/crear-pago una sola vez', pedidos.length === 1 && pedidos[0].url === '/api/crear-pago' && pedidos[0].op.method === 'POST');
    verificar('S2 el pedido trae SOLO evento, lote, cantidad y datos del comprador (ningun precio, monto ni estado)',
      Object.keys(cuerpo).sort().join() === 'apellido,cantidad,correo,eventoId,loteIndex,loteNombre,nombre' && cuerpo.cantidad === 2 && cuerpo.loteIndex === 0 && cuerpo.eventoId === 'Evt1' && cuerpo.loteNombre === 'General', JSON.stringify(cuerpo));
    verificar('S3 cantidad y lote viajan como numeros enteros', Number.isInteger(cuerpo.cantidad) && Number.isInteger(cuerpo.loteIndex));
    verificar('S4 con datos validos el navegador va al enlace de Mercado Pago', p.ubicacion.navegadoA === 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123', String(p.ubicacion.navegadoA));
    verificar('S5 mientras cambia de pagina el boton queda deshabilitado ("Procesando...") y no hay errores', p.els.btnPagarAhora.disabled === true && p.els.btnPagarAhora.textContent === 'Procesando...' && p.els.errorCompra.oculto && !p.els.loadingContainer.oculto);
    verificar('S6 nunca usa alert()', p.alertas.length === 0);
    // El comprador vuelve con "atras" y la pagina vuelve congelada
    await Promise.all((p.ventana._oyentes.pageshow || []).map((fn) => fn({ persisted: true })));
    verificar('S7 si vuelve con el boton "atras", el boton se rehabilita', p.els.btnPagarAhora.disabled === false && p.els.btnPagarAhora.textContent === 'Pagar con Mercado Pago' && p.els.loadingContainer.oculto);
  }

  // ---------- 6.2: errores del servidor, en pantalla ----------
  {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(400, { ok: false, error: { codigo: 'PEDIDO_INVALIDO', mensaje: 'El correo no parece válido.', errores: [{ campo: 'correo', mensaje: 'El correo no parece válido. Revisalo (por ejemplo nombre@correo.com).' }, { campo: 'nombre', mensaje: 'Escribí tu nombre.' }] } }) });
    await irAlPaso2(p); await completar(p, { nombre: '', correo: 'malo' });
    await enviar(p);
    verificar('E1 correo invalido: el mensaje aparece junto al campo, en pantalla, sin alert', !p.els.errorCorreo.oculto && /no parece válido/.test(p.els.errorCorreo.textContent) && p.els.inputCorreo.getAttribute('aria-invalid') === 'true' && p.alertas.length === 0);
    verificar('E2 tambien marca los otros campos que fallaron (nombre) y pone el foco en el primero', !p.els.errorNombre.oculto && p.els.inputNombre.getAttribute('aria-invalid') === 'true' && p.els.inputNombre.focos === 1, 'foco nombre=' + p.els.inputNombre.focos);
    verificar('E3 no redirige y el boton vuelve a estar activo para corregir', p.ubicacion.navegadoA === null && p.els.btnPagarAhora.disabled === false && p.els.btnPagarAhora.textContent === 'Pagar con Mercado Pago' && p.els.loadingContainer.oculto);
    // Al reintentar, los errores anteriores se limpian
    p.contexto._fetch = respuesta(200, { ok: true, urlPago: 'https://www.mercadopago.com.ar/x' });
    await completar(p); await enviar(p);
    verificar('E4 al corregir y reintentar, se borran los errores viejos y se redirige', p.els.errorCorreo.oculto && p.els.errorNombre.oculto && p.els.inputCorreo.getAttribute('aria-invalid') === undefined && p.ubicacion.navegadoA === 'https://www.mercadopago.com.ar/x');
  }
  {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(409, { ok: false, error: { codigo: 'SIN_STOCK', mensaje: 'Quedan solo 2 entradas en este lote.', disponibles: 2 } }) });
    await irAlPaso2(p); await completar(p); await enviar(p);
    verificar('E5 sin stock: se muestra el mensaje del servidor (cuantas quedan) en pantalla', !p.els.errorCompra.oculto && p.els.errorCompra.textContent === 'Quedan solo 2 entradas en este lote.' && p.ubicacion.navegadoA === null && p.alertas.length === 0);
  }
  {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(502, { ok: false, error: { codigo: 'ERROR_MERCADO_PAGO', mensaje: 'No pudimos iniciar el pago. Intentá de nuevo en unos minutos.' } }) });
    await irAlPaso2(p); await completar(p); await enviar(p);
    verificar('E6 Mercado Pago no responde: mensaje para reintentar y el boton queda activo', /Intentá de nuevo/.test(p.els.errorCompra.textContent) && p.els.btnPagarAhora.disabled === false);
  }
  {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(500, null, { sinJson: true }) });
    await irAlPaso2(p); await completar(p); await enviar(p);
    verificar('E7 respuesta que no es JSON: mensaje generico', /No pudimos iniciar el pago/.test(p.els.errorCompra.textContent) && p.ubicacion.navegadoA === null);
    const q = crearPagina({ evento: EVENTO, fetchFn: async () => { throw new TypeError('Failed to fetch'); } });
    await irAlPaso2(q); await completar(q); await enviar(q);
    verificar('E8 sin conexion: mensaje claro, boton activo, sin alert', /conexión/.test(q.els.errorCompra.textContent) && q.els.btnPagarAhora.disabled === false && q.alertas.length === 0);
  }

  // ---------- Seguridad del enlace de pago ----------
  for (const [nombre, url] of [['javascript:', 'javascript:alert(1)'], ['http sin cifrar', 'http://www.mercadopago.com.ar/x'], ['vacio', ''], ['no es texto', 123], ['sin enlace', undefined]]) {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(200, { ok: true, urlPago: url }) });
    await irAlPaso2(p); await completar(p); await enviar(p);
    verificar('X ' + nombre + ': NO se abre y se muestra un error', p.ubicacion.navegadoA === null && !p.els.errorCompra.oculto && p.els.btnPagarAhora.disabled === false);
  }

  // ---------- Doble clic ----------
  {
    let llamadas = 0, liberar;
    const espera = new Promise((r) => { liberar = r; });
    const p = crearPagina({ evento: EVENTO, fetchFn: async () => { llamadas++; await espera; return { ok: true, status: 200, json: async () => ({ ok: true, urlPago: 'https://www.mercadopago.com.ar/y' }) }; } });
    await irAlPaso2(p); await completar(p);
    const a = p.els.formCompra.disparar('submit'); // primer clic: queda esperando
    await tick();
    const estabaBloqueado = p.els.btnPagarAhora.disabled === true;
    await p.els.formCompra.disparar('submit'); await p.els.formCompra.disparar('submit'); // segundo y tercer clic
    liberar(); await a; await tick();
    verificar('D un doble o triple clic no crea mas de una compra', llamadas === 1 && estabaBloqueado, 'llamadas=' + llamadas);
  }

  // ---------- Los mensajes no se interpretan como HTML ----------
  {
    const p = crearPagina({ evento: EVENTO, fetchFn: respuesta(400, { ok: false, error: { codigo: 'X', mensaje: '<img src=x onerror=alert(1)>', errores: [{ campo: 'correo', mensaje: '<b>hola</b>' }] } }) });
    await irAlPaso2(p); await completar(p); await enviar(p);
    verificar('H los mensajes del servidor se escriben como texto (nunca como HTML)', p.els.errorCorreo.escrituraHtml === 0 && p.els.errorCompra.escrituraHtml === 0 && p.els.errorCorreo.textContent === '<b>hola</b>');
  }

  verificar('Z durante toda la prueba el JavaScript solo uso ids que existen en el HTML', problemas.length === 0, problemas.join(' | '));
  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
