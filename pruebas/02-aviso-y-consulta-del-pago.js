// Prueba de la tarea 4.2 (avisos que no son de pagos + consulta del pago). Sin red ni base de datos.
const crypto = require('crypto');
const REPO = require('path').join(__dirname, '..');

require('./_ayuda-db-falsa').simularFirebaseAdmin();
process.env.MP_WEBHOOK_SECRET = 'secreto-de-ejemplo-no-real';
process.env.MP_ACCESS_TOKEN = 'TOKEN-DE-EJEMPLO-NO-REAL';
const { procesarAviso } = require(REPO + '/server/webhook');

const firmar = (id, req, ts) => 'ts=' + ts + ',v1=' + crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
  .update('id:' + id + ';request-id:' + req + ';ts:' + ts + ';').digest('hex');

function armar({ id = '123456', tipo = 'payment', firmaMala = false, sinFirma = false, extraQuery = {}, body } = {}) {
  const req = 'req-1', ts = '1700000000';
  const f = firmar(id, req, ts);
  return {
    query: { 'data.id': id, ...(tipo ? { type: tipo } : {}), ...extraQuery },
    headers: sinFirma ? { 'x-request-id': req } : { 'x-signature': firmaMala ? f.slice(0, -1) + (f.slice(-1) === 'a' ? 'b' : 'a') : f, 'x-request-id': req },
    body,
  };
}

function fetchFalso(respuesta) {
  const llamadas = [];
  const fn = async (url, opciones) => {
    llamadas.push({ url, auth: opciones.headers.Authorization, metodo: opciones.method });
    if (respuesta instanceof Error) throw respuesta;
    return { ok: respuesta.status >= 200 && respuesta.status < 300, status: respuesta.status, json: async () => respuesta.json };
  };
  fn.llamadas = llamadas;
  return fn;
}

let mal = 0;
async function caso(nombre, peticion, respuestaMp, esperaStatus, esperaResultado, esperaLlamadas) {
  const fetchFn = fetchFalso(respuestaMp || { status: 200, json: { id: 1, status: 'approved' } });
  const logs = [];
  const r = await procesarAviso(peticion, { fetchFn, registrar: (...a) => logs.push(JSON.stringify(a)) });
  const resultado = r.cuerpo.resultado || (r.cuerpo.error && r.cuerpo.error.codigo);
  const filtrado = logs.join('').includes(process.env.MP_WEBHOOK_SECRET) || logs.join('').includes(process.env.MP_ACCESS_TOKEN)
    || JSON.stringify(r).includes(process.env.MP_WEBHOOK_SECRET) || JSON.stringify(r).includes(process.env.MP_ACCESS_TOKEN);
  const bien = r.status === esperaStatus && resultado === esperaResultado && fetchFn.llamadas.length === esperaLlamadas && !filtrado;
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + nombre + ' -> ' + r.status + ' ' + resultado + ' | consultas a MP: ' + fetchFn.llamadas.length + (filtrado ? ' | ¡SE FILTRO UN SECRETO!' : ''));
  return fetchFn;
}

(async () => {
  await caso('firma incorrecta', armar({ firmaMala: true }), null, 401, 'NO_AUTORIZADO', 0);
  await caso('sin encabezado de firma', armar({ sinFirma: true }), null, 401, 'NO_AUTORIZADO', 0);
  await caso('data.id repetido (arreglo) en la direccion', { ...armar(), query: { 'data.id': ['1', '2'], type: 'payment' } }, null, 401, 'NO_AUTORIZADO', 0);
  await caso('firma valida pero el id no es el firmado', { ...armar(), query: { 'data.id': '999', type: 'payment' } }, null, 401, 'NO_AUTORIZADO', 0);
  await caso('aviso que no es de pago (merchant_order)', armar({ tipo: 'merchant_order' }), null, 200, 'ignorado', 0);
  await caso('aviso sin tipo', armar({ tipo: null }), null, 200, 'ignorado', 0);
  await caso('id no numerico (firmado bien)', armar({ id: 'abc123' }), null, 200, 'ignorado', 0);
  const f = await caso('pago aprobado', armar(), { status: 200, json: { id: 123456, status: 'approved' } }, 200, 'sin_venta', 1);
  console.log('     consulta hecha a:', f.llamadas[0].metodo, f.llamadas[0].url, '| con token:', f.llamadas[0].auth === 'Bearer ' + process.env.MP_ACCESS_TOKEN);
  await caso('formato viejo (topic=payment)', armar({ tipo: null, extraQuery: { topic: 'payment' } }), null, 200, 'sin_venta', 1);
  await caso('tipo en el cuerpo', armar({ tipo: null, body: { type: 'payment' } }), null, 200, 'sin_venta', 1);
  await caso('pago inexistente (Mercado Pago responde 404)', armar({ id: '123456' }), { status: 404, json: { message: 'not found' } }, 200, 'pago_no_encontrado', 1);
  await caso('Mercado Pago falla (500)', armar(), { status: 500, json: { message: 'error' } }, 500, 'ERROR_TEMPORAL', 1);
  await caso('sin conexion con Mercado Pago', armar(), new Error('red caida'), 500, 'ERROR_TEMPORAL', 1);

  // Sin la clave del aviso configurada: error de configuracion y no se consulta nada
  const guardada = process.env.MP_WEBHOOK_SECRET;
  const peticionFirmada = armar(); // se firma ANTES de borrar la clave
  delete process.env.MP_WEBHOOK_SECRET;
  const fx = fetchFalso({ status: 200, json: {} });
  const logs = [];
  const r = await procesarAviso(peticionFirmada, { fetchFn: fx, registrar: (...a) => logs.push(JSON.stringify(a)) });
  const bien = r.status === 500 && fx.llamadas.length === 0 && logs.join('').includes('MP_WEBHOOK_SECRET');
  if (!bien) mal++;
  console.log((bien ? 'OK  ' : 'MAL ') + 'sin MP_WEBHOOK_SECRET configurada -> ' + r.status + ' | consultas: ' + fx.llamadas.length);
  process.env.MP_WEBHOOK_SECRET = guardada;

  console.log(mal === 0 ? '\nTodos los casos dieron lo esperado.' : '\nFALLARON ' + mal + ' casos.');
  process.exit(mal ? 1 : 0);
})();
