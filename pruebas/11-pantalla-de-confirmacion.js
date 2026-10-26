// Prueba de la seccion 7 (public/confirmacion.html): busqueda de texto + comportamiento del JavaScript real
// con un navegador simulado, un fetch falso y relojes falsos. No usa red ni base de datos.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'confirmacion.html'), 'utf8');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// ====================== 7.3: busqueda de texto ======================
const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '');
const prohibidos = ['CBU', 'pagos@evently.com', 'getDoc', 'Descargar PDF', 'btnDescargarPDF', 'alert(', 'firebase', 'Firebase', 'Transferencia', 'Efectivo', 'Banco Naci'];
const hallados = prohibidos.filter((p) => sinComentarios.includes(p));
verificar('7.3a no aparecen CBU, pagos@evently.com, getDoc, "Descargar PDF", Firebase ni alert()', hallados.length === 0, hallados.join(','));
verificar('7.3b la pantalla confirmada indica que se guarde el enlace', /Guardá el enlace de tu compra/.test(html) && /No te enviamos las entradas por correo/.test(html));
verificar('7.3c no carga nada de Firebase y avisa a los navegadores que no envien la direccion a otros sitios',
  !/firebase-init|gstatic\.com\/firebasejs/.test(html) && /<meta name="referrer" content="no-referrer"/.test(html));

// ====================== Navegador simulado ======================
class Texto { constructor(t) { this.texto = t; } }
class Nodo {
  constructor(tag) {
    this.tag = tag; this.className = ''; this.children = []; this._texto = ''; this.escrituraHtml = 0;
    this.href = undefined; this.type = undefined; this.value = ''; this.readOnly = false; this._attrs = {}; this._oyentes = {}; this.seleccionado = 0;
  }
  get textContent() { return this._texto; }
  set textContent(t) { this._texto = String(t); this.children = []; }
  set innerHTML(v) { this.escrituraHtml++; }
  get innerHTML() { return ''; }
  appendChild(n) { this.children.push(n); return n; }
  replaceChildren(...ns) { this.children = [...ns]; this._texto = ''; }
  setAttribute(k, v) { this._attrs[k] = v; }
  addEventListener(t, fn) { (this._oyentes[t] = this._oyentes[t] || []).push(fn); }
  async clic() { for (const fn of this._oyentes.click || []) await fn({}); }
  select() { this.seleccionado++; }
}
const textoDe = (n) => (n instanceof Texto ? n.texto : n._texto + n.children.map(textoDe).join(' '));
const recorrer = (n, f) => { f(n); if (!(n instanceof Texto)) n.children.forEach((h) => recorrer(h, f)); };
const buscar = (n, pred) => { const r = []; recorrer(n, (x) => { if (!(x instanceof Texto) && pred(x)) r.push(x); }); return r; };
const botonCon = (n, texto) => buscar(n, (x) => x.tag === 'button' && textoDe(x).includes(texto))[0];
const enlaceCon = (n, texto) => buscar(n, (x) => x.tag === 'a' && textoDe(x).includes(texto))[0];

function crearPagina({ buscar: busqueda = '?id=Venta0001&t=' + 'a'.repeat(48), respuestas = [], qr = true, portapapeles = 'ok' }) {
  const contenedor = new Nodo('div');
  const cola = []; // relojes falsos: los setTimeout esperan a que la prueba los dispare
  const llamadas = [];
  const qrs = [];
  const urlsReemplazadas = [];
  let usoInnerHtmlEnRaiz = false;
  let indice = 0;
  const pagina = {
    contenedor, llamadas, qrs, urlsReemplazadas, cola, impresiones: 0, copiados: [],
    get usoInnerHtml() { return usoInnerHtmlEnRaiz || buscar(contenedor, (x) => x.escrituraHtml > 0).length > 0 || contenedor.escrituraHtml > 0; },
    async avanzar() { const f = cola.shift(); if (f) { await f(); } await new Promise((r) => setImmediate(r)); return !!f; },
  };
  const contexto = {
    document: {
      getElementById: (id) => { if (id !== 'confirmacionContainer') throw new Error('id inexistente: ' + id); return contenedor; },
      createElement: (tag) => new Nodo(tag), createTextNode: (t) => new Texto(t),
    },
    window: {
      location: { search: busqueda, origin: 'https://evently-ctes-app.vercel.app', pathname: '/public/confirmacion.html' },
      history: { replaceState: (a, b, url) => urlsReemplazadas.push(url) },
      print: () => { pagina.impresiones++; },
    },
    navigator: { clipboard: { writeText: async (t) => { if (portapapeles !== 'ok') throw new Error('bloqueado'); pagina.copiados.push(t); } } },
    URLSearchParams, encodeURIComponent, console: { error() {}, log() {} }, Promise, JSON, Number, String, Array, Date,
    setTimeout: (fn) => { cola.push(fn); return cola.length; },
    fetch: async (url, op) => {
      llamadas.push({ url, op });
      let r = respuestas[Math.min(indice++, respuestas.length - 1)];
      if (typeof r === 'function') r = await r(); // una respuesta lenta, que la prueba libera cuando quiere
      if (r instanceof Error) throw r;
      return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => { if (r.sinJson) throw new Error('no json'); return r.json; } };
    },
  };
  if (qr) {
    contexto.QRCode = function (el, opciones) { qrs.push(opciones.text); el.appendChild(new Nodo('canvas')); };
    contexto.QRCode.CorrectLevel = { H: 'H' };
  }
  vm.createContext(contexto);
  const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  pagina.iniciar = async () => { vm.runInContext(js, contexto); await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r)); };
  return pagina;
}

const venta = (extra = {}) => ({
  id: 'Venta0001', eventoId: 'Evt1', estado: 'pendiente', motivo: null, reembolsoPendiente: false,
  evento: { nombre: 'Fiesta del Rio', fecha: '15 Dic 2026 21:00', lugar: 'Costanera Corrientes' },
  lote: 'General', cantidad: 3, monto: 15000, moneda: 'ARS', ...extra,
});
const ok = (v) => ({ status: 200, json: { ok: true, venta: v } });
const confirmada = (extra = {}) => ok(venta({
  estado: 'confirmada', metodoPago: 'Crédito',
  entradas: [{ codigo: 'ENT-aaaaaaaaaaaaaaaaaaaaaaaa', usado: false }, { codigo: 'ENT-bbbbbbbbbbbbbbbbbbbbbbbb', usado: true }, { codigo: 'ENT-cccccccccccccccccccccccc', usado: false }], ...extra,
}));
const NO_ENCONTRADA = { status: 404, json: { ok: false, error: { codigo: 'NO_ENCONTRADA', mensaje: 'No encontramos esa compra.' } } };
const TOKEN = 'a'.repeat(48);
const ENLACE_LIMPIO = 'https://evently-ctes-app.vercel.app/public/confirmacion.html?id=Venta0001&t=' + TOKEN;

(async () => {
  // ---------- 7.1: enlace sin datos / con otro token ----------
  for (const [nombre, busqueda] of [['sin ningun dato', ''], ['sin token', '?id=Venta0001'], ['sin id', '?t=' + TOKEN]]) {
    const p = crearPagina({ buscar: busqueda, respuestas: [ok(venta())] });
    await p.iniciar();
    verificar('7.1 enlace ' + nombre + ': "Compra no encontrada" y no se consulta nada', /Compra no encontrada/.test(textoDe(p.contenedor)) && p.llamadas.length === 0 && p.cola.length === 0);
  }
  {
    const p = crearPagina({ respuestas: [NO_ENCONTRADA] });
    await p.iniciar();
    verificar('7.1 token equivocado o compra inexistente (el servidor dice 404): "Compra no encontrada" y deja de consultar', /Compra no encontrada/.test(textoDe(p.contenedor)) && p.llamadas.length === 1 && p.cola.length === 0);
    verificar('7.1 esa pantalla no muestra ningun dato de compra ni QR', !/Fiesta|Entrada|Total/.test(textoDe(p.contenedor)) && p.qrs.length === 0);
  }

  // ---------- 7.1: la consulta usa solo id y token, y manda sobre lo que diga la direccion ----------
  {
    const mp = '?collection_id=555&collection_status=approved&status=approved&payment_type=credit_card&external_reference=Venta0001&id=Venta0001&t=' + TOKEN;
    const p = crearPagina({ buscar: mp, respuestas: [ok(venta()), confirmada()] });
    await p.iniciar();
    const cuerpo = JSON.parse(p.llamadas[0].op.body);
    verificar('7.1 consulta POST /api/venta con solo { id, t } (ignora lo que agrega Mercado Pago)', p.llamadas[0].url === '/api/venta' && p.llamadas[0].op.method === 'POST' && Object.keys(cuerpo).sort().join() === 'id,t' && cuerpo.id === 'Venta0001' && cuerpo.t === TOKEN);
    verificar('7.1 limpia la direccion: queda solo ?id=...&t=...', p.urlsReemplazadas.length === 1 && p.urlsReemplazadas[0] === '?id=Venta0001&t=' + TOKEN, JSON.stringify(p.urlsReemplazadas));
    verificar('7.1 aunque la direccion diga "approved", si el servidor dice pendiente se muestra "Estamos confirmando" y NO se ven entradas',
      /Estamos confirmando tu pago/.test(textoDe(p.contenedor)) && p.qrs.length === 0 && !/Compra exitosa/.test(textoDe(p.contenedor)));
    // ---------- se actualiza sola ----------
    verificar('7.1 queda programada otra consulta (cada 3 segundos)', p.cola.length === 1);
    await p.avanzar();
    verificar('7.1 al cambiar el estado a confirmada, la pantalla se actualiza sola y deja de consultar', /Compra exitosa/.test(textoDe(p.contenedor)) && p.llamadas.length === 2 && p.cola.length === 0 && p.qrs.length === 3);
  }

  // ---------- 7.1: pendiente por mucho tiempo ----------
  {
    const p = crearPagina({ respuestas: [ok(venta())] });
    await p.iniciar();
    while (await p.avanzar()) { /* corre todas las esperas */ }
    verificar('7.1 pendiente durante 2 minutos: exactamente 40 consultas y luego se detiene', p.llamadas.length === 40 && p.cola.length === 0, 'consultas=' + p.llamadas.length);
    const t = textoDe(p.contenedor);
    verificar('7.1 avisa que el pago tarda mas de lo esperado, pide no pagar de nuevo y ofrece volver a consultar y guardar el enlace',
      /tardando más de lo esperado/.test(t) && /no pagues de nuevo/.test(t) && !!botonCon(p.contenedor, 'Volver a consultar') && /Guardá el enlace/.test(t));
    p.contexto = null;
    await botonCon(p.contenedor, 'Volver a consultar').clic(); await new Promise((r) => setImmediate(r));
    verificar('7.1 "Volver a consultar" reinicia la espera (otra consulta y otras esperas)', p.llamadas.length === 41 && p.cola.length === 1);
  }

  // ---------- 7.1: apretar "Volver a consultar" varias veces no multiplica las consultas ----------
  {
    let liberar;
    const lenta = () => new Promise((r) => { liberar = () => r(ok(venta())); });
    const pendiente = ok(venta());
    const p = crearPagina({ respuestas: [...Array(40).fill(pendiente), lenta, pendiente] });
    await p.iniciar();
    while (await p.avanzar()) { /* agota los 2 minutos */ }
    const boton = botonCon(p.contenedor, 'Volver a consultar');
    const antes = p.llamadas.length; // 40
    boton.clic();                         // primer clic: la consulta queda esperando la respuesta lenta
    await new Promise((r) => setImmediate(r));
    await boton.clic(); await boton.clic(); await boton.clic(); // clics repetidos mientras espera
    verificar('7.1 clics repetidos mientras una consulta esta en marcha: no se lanzan consultas extra', p.llamadas.length === antes + 1, 'consultas=' + p.llamadas.length);
    verificar('7.1 el boton queda deshabilitado despues del primer clic', boton.disabled === true);
    liberar(); await new Promise((r) => setImmediate(r)); await new Promise((r) => setImmediate(r));
    verificar('7.1 al llegar la respuesta queda UNA sola espera programada (no se acumulan cadenas)', p.cola.length === 1, 'esperas=' + p.cola.length);
    while (await p.avanzar()) { /* vuelve a agotar */ }
    verificar('7.1 el tope de 2 minutos se respeta tambien despues de reintentar (40 consultas mas, no mas)', p.llamadas.length === antes + 40, 'consultas=' + p.llamadas.length);
  }

  // ---------- 7.1: errores temporales no son "no encontrada" ----------
  {
    const p = crearPagina({ respuestas: [{ status: 500, json: null, sinJson: true }, new Error('sin conexion'), ok(venta()), confirmada()] });
    await p.iniciar();
    verificar('7.1 si el servidor falla (500) NO dice "no encontrada": avisa el problema y sigue intentando', /Tuvimos un problema para actualizar/.test(textoDe(p.contenedor)) && !/no encontrada/i.test(textoDe(p.contenedor)) && p.cola.length === 1);
    await p.avanzar();
    verificar('7.1 si no hay conexion tambien sigue intentando', /Tuvimos un problema/.test(textoDe(p.contenedor)) && p.cola.length === 1);
    await p.avanzar(); await p.avanzar();
    verificar('7.1 cuando el servidor se recupera, muestra la compra confirmada', /Compra exitosa/.test(textoDe(p.contenedor)));
  }

  // ---------- 7.2: confirmada con 3 entradas ----------
  {
    const p = crearPagina({ respuestas: [confirmada()] });
    await p.iniciar();
    const t = textoDe(p.contenedor);
    verificar('7.2 confirmada de 3 entradas: 3 codigos QR, uno por entrada, con codigos distintos', p.qrs.length === 3 && new Set(p.qrs).size === 3 && p.qrs[0] === 'ENT-aaaaaaaaaaaaaaaaaaaaaaaa' && p.qrs[2] === 'ENT-cccccccccccccccccccccccc', JSON.stringify(p.qrs));
    verificar('7.2 muestra "Entrada 1 de 3 ... 3 de 3"', /Entrada 1 de 3/.test(t) && /Entrada 2 de 3/.test(t) && /Entrada 3 de 3/.test(t));
    verificar('7.2 marca la entrada que ya fue usada (solo esa)', (t.match(/ya fue utilizada/g) || []).length === 1);
    verificar('7.2 resumen: evento, fecha, lugar, lote, cantidad, metodo de pago y total',
      /Fiesta del Rio/.test(t) && /15 Dic 2026 21:00/.test(t) && /Costanera Corrientes/.test(t) && /General/.test(t) && /Cantidad:\s*3/.test(t) && /Crédito/.test(t) && t.includes('$' + (15000).toLocaleString()));
    verificar('7.2 sin costo de servicio: el resumen no tiene la linea "Costo de servicio"', !/Costo de servicio/.test(t));
    {
      const c = crearPagina({ respuestas: [confirmada({ monto: 16200, costoServicio: 1200 })] });
      await c.iniciar();
      const tc = textoDe(c.contenedor);
      verificar('7.2 con costo de servicio: muestra entradas, costo de servicio y total',
        /Entradas:\s*\$15,?000|Entradas:\s*\$15\.000/.test(tc) && /Costo de servicio:\s*\$1,?200|Costo de servicio:\s*\$1\.200/.test(tc) && tc.includes('$' + (16200).toLocaleString()), tc);
    }
    verificar('7.2 mensaje de exito y boton para imprimir (que existe de verdad)', /Compra exitosa/.test(t) && !!botonCon(p.contenedor, 'Imprimir'));
    await botonCon(p.contenedor, 'Imprimir').clic();
    verificar('7.2 "Imprimir entradas" imprime la pagina', p.impresiones === 1);
    // 7.3: guardar el enlace
    const campo = buscar(p.contenedor, (x) => x.tag === 'input')[0];
    verificar('7.3 muestra el enlace de la compra para guardar (limpio, con id y token)', campo && campo.value === ENLACE_LIMPIO && campo.readOnly === true, campo && campo.value);
    verificar('7.3 avisa que el enlace da acceso a las entradas y que no se comparta', /no lo compartas/.test(t));
    await botonCon(p.contenedor, 'Copiar enlace').clic();
    verificar('7.3 "Copiar enlace" copia ese enlace', p.copiados[0] === ENLACE_LIMPIO && /¡Enlace copiado!/.test(textoDe(botonCon(p.contenedor, 'copiado'))));
    verificar('7.2 la pantalla confirmada no ofrece "Descargar PDF" ni datos bancarios', !/PDF|CBU|Banco|transferencia/i.test(t));
  }
  {
    const p = crearPagina({ respuestas: [confirmada()], portapapeles: 'bloqueado' });
    await p.iniciar();
    await botonCon(p.contenedor, 'Copiar enlace').clic();
    const campo = buscar(p.contenedor, (x) => x.tag === 'input')[0];
    verificar('7.3 si el navegador no deja copiar, deja el enlace seleccionado para copiarlo a mano', campo.seleccionado >= 1 && !!botonCon(p.contenedor, 'manualmente'));
  }
  {
    const p = crearPagina({ respuestas: [confirmada()], qr: false });
    await p.iniciar();
    verificar('7.2 si no carga la libreria de QR, igual se ven los codigos de las entradas', /ENT-aaaaaaaaaaaaaaaaaaaaaaaa/.test(textoDe(p.contenedor)) && /No pudimos dibujar el QR/.test(textoDe(p.contenedor)));
  }
  {
    const p = crearPagina({ respuestas: [confirmada({ reembolsoPendiente: true })] });
    await p.iniciar();
    verificar('7.2 confirmada con un segundo pago: conserva sus entradas y avisa que se devuelve el pago repetido', p.qrs.length === 3 && /segundo pago por esta misma compra/.test(textoDe(p.contenedor)));
  }

  // ---------- 7.2: pendiente y rechazada ----------
  {
    const p = crearPagina({ respuestas: [ok(venta())] });
    await p.iniciar();
    verificar('7.2 pendiente: sin QR, sin codigos y con el resumen', p.qrs.length === 0 && !/ENT-/.test(textoDe(p.contenedor)) && /Fiesta del Rio/.test(textoDe(p.contenedor)));
  }
  const motivos = [
    ['vencida', /30 minutos/], ['pago_rechazado', /no aprobó el pago/], ['pago_cancelado', /cancelado/], ['sin_stock', /se agotaron/],
    ['lote_inconsistente', /lote de este evento cambió/], ['evento_inexistente', /ya no está disponible/], ['error_mercado_pago', /No pudimos iniciar el pago/],
  ];
  for (const [motivo, patron] of motivos) {
    const p = crearPagina({ respuestas: [ok(venta({ estado: 'rechazada', motivo }))] });
    await p.iniciar();
    const t = textoDe(p.contenedor);
    verificar('7.2 rechazada por "' + motivo + '": explica el motivo en lenguaje simple, sin QR ni codigos', patron.test(t) && p.qrs.length === 0 && !/ENT-/.test(t) && !t.includes(motivo));
  }
  {
    const p = crearPagina({ respuestas: [ok(venta({ estado: 'rechazada', motivo: 'pago_rechazado' }))] });
    await p.iniciar();
    verificar('7.2 rechazada: boton "Volver a intentar" que lleva al mismo evento', enlaceCon(p.contenedor, 'Volver a intentar').href === 'evento.html?id=Evt1');
    verificar('7.2 rechazada: deja de consultar', p.cola.length === 0);
    const antes = p.llamadas.length;
    await botonCon(p.contenedor, 'Ya pagué').clic(); await new Promise((r) => setImmediate(r));
    verificar('7.2 rechazada: "Ya pagué: actualizar" vuelve a consultar', p.llamadas.length === antes + 1);
  }
  {
    const p = crearPagina({ respuestas: [ok(venta({ estado: 'rechazada', motivo: 'vencida', eventoId: '../../otra-cosa' }))] });
    await p.iniciar();
    verificar('7.2 si el id del evento tiene formato raro, "Volver a intentar" lleva al inicio (no se arma una direccion rara)', enlaceCon(p.contenedor, 'Volver a intentar').href === 'index.html');
  }
  {
    const p = crearPagina({ respuestas: [ok(venta({ estado: 'rechazada', motivo: 'sin_stock', reembolsoPendiente: true }))] });
    await p.iniciar();
    const t = textoDe(p.contenedor);
    verificar('7.2 sin stock con reembolso pendiente: avisa que se devuelve el dinero y ofrece guardar el enlace', /vamos a devolverte el dinero/.test(t) && /Guardá el enlace/.test(t) && p.qrs.length === 0);
  }
  {
    const p = crearPagina({ respuestas: [ok(venta({ estado: 'rechazada', motivo: 'algo_nuevo' }))] });
    await p.iniciar();
    verificar('7.2 un motivo desconocido muestra un mensaje general (nunca el codigo interno)', /no pudo completarse/.test(textoDe(p.contenedor)) && !/algo_nuevo/.test(textoDe(p.contenedor)));
  }

  // ---------- Seguridad: lo que escribe el organizador no se ejecuta ----------
  {
    const peligroso = '<img src=x onerror=alert(1)>';
    const p = crearPagina({ respuestas: [confirmada({ evento: { nombre: peligroso, fecha: '<b>hoy</b>', lugar: '<script>alert(1)</script>' }, lote: '<i>VIP</i>' })] });
    await p.iniciar();
    verificar('S el nombre, fecha, lugar y lote del evento se muestran como texto y nunca se interpretan como HTML', !p.usoInnerHtml && textoDe(p.contenedor).includes(peligroso) && textoDe(p.contenedor).includes('<script>alert(1)</script>'));
  }

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
