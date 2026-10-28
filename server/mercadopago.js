// server/mercadopago.js
// Llamadas a la API de Mercado Pago (Checkout Pro) con `fetch`, sin su SDK.
// El Access Token solo se lee de la variable de entorno y nunca se imprime.

const { MINUTOS_VENCIMIENTO } = require('./config');

const API = 'https://api.mercadopago.com';
const TIEMPO_MAXIMO_MS = 10000;

// Se aceptan tarjetas de credito, de debito y prepagas, y dinero en cuenta.
// Lo unico que se excluye es el efectivo (tipo `ticket`: Rapipago y Pago Facil).
// Lista confirmada en la tarea 3.4 con GET /v1/payment_methods en la cuenta de prueba:
// los tipos de esa cuenta son debit_card, credit_card, prepaid_card y ticket.
const TIPOS_PERMITIDOS = ['credit_card', 'debit_card', 'prepaid_card', 'account_money'];
const TIPOS_EXCLUIDOS = ['ticket'];

// Error de Mercado Pago. `.message` es generico y seguro; `.estado` y `.detalle` son
// solo para los registros del servidor y NO deben enviarse al navegador.
class MercadoPagoError extends Error {
  constructor(mensaje, { estado = null, detalle = null } = {}) {
    super(mensaje);
    this.name = 'MercadoPagoError';
    this.estado = estado;
    this.detalle = detalle;
  }
}

// Mercado Pago pide las fechas con zona horaria. Argentina es UTC-3 todo el año.
function fechaArgentina(fecha) {
  const desplazada = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
  return desplazada.toISOString().slice(0, 19) + '.000-03:00';
}

// Arma el cuerpo de la preferencia. Funcion pura: no llama a nada.
function armarPreferencia({ ventaId, token, eventoId, evento, pedido, calculo, siteUrl, ahora = new Date() }) {
  const volver = `${siteUrl}/public/confirmacion.html?id=${encodeURIComponent(ventaId)}&t=${token}`;
  const vence = new Date(ahora.getTime() + MINUTOS_VENCIMIENTO * 60 * 1000);
  const titulo = `${evento.nombre || 'Evento'} - ${calculo.lote.nombre || 'Entrada'}`.slice(0, 250);

  const items = [{
    id: `${eventoId}-${calculo.loteIndex}`,
    title: titulo,
    description: `${pedido.cantidad} ${pedido.cantidad === 1 ? 'entrada' : 'entradas'}`,
    quantity: pedido.cantidad,
    unit_price: calculo.precioUnitario,
    currency_id: 'ARS',
  }];
  // El costo de servicio va como renglon aparte, para que el resumen de Mercado Pago coincida con la pagina
  if (calculo.costoServicio > 0) {
    items.push({
      id: `${eventoId}-servicio`,
      title: 'Costo de servicio',
      quantity: 1,
      unit_price: calculo.costoServicio,
      currency_id: 'ARS',
    });
  }

  // No se manda `payment_methods.installments`: Mercado Pago muestra las cuotas que corresponden.
  return {
    items,
    payer: { name: pedido.nombre, surname: pedido.apellido, email: pedido.correo },
    back_urls: { success: volver, pending: volver, failure: volver },
    auto_return: 'approved',
    // `?source_news=webhooks` pide el formato nuevo del aviso (con `data.id` y firma);
    // sin eso, Mercado Pago manda el formato viejo (`?id=…&topic=…`) y el webhook lo rechaza.
    notification_url: `${siteUrl}/api/mp-webhook?source_news=webhooks`,
    external_reference: ventaId,
    expires: true,
    expiration_date_from: fechaArgentina(ahora),
    expiration_date_to: fechaArgentina(vence),
    payment_methods: {
      excluded_payment_types: TIPOS_EXCLUIDOS.map((id) => ({ id })),
    },
  };
}

// Llamada generica a la API con tiempo maximo de espera. Devuelve el JSON de la respuesta.
async function llamar(metodo, ruta, accessToken, cuerpo, fetchFn = fetch) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);
  let respuesta;
  try {
    respuesta = await fetchFn(API + ruta, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: control.signal,
    });
  } catch (e) {
    const cortado = e && e.name === 'AbortError';
    throw new MercadoPagoError(cortado ? 'Mercado Pago tardó demasiado en responder' : 'No se pudo conectar con Mercado Pago', {
      detalle: cortado ? 'timeout' : String(e && e.message).slice(0, 200),
    });
  } finally {
    clearTimeout(reloj);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (e) {
    datos = null;
  }
  if (!respuesta.ok) {
    const detalle = datos && (datos.message || datos.error) ? String(datos.message || datos.error).slice(0, 200) : null;
    throw new MercadoPagoError(`Mercado Pago respondió con error ${respuesta.status}`, { estado: respuesta.status, detalle });
  }
  return datos;
}

// Crea la preferencia de pago. Devuelve { id, urlPago }.
// La direccion de pago es `init_point`; si no viniera, se usa `sandbox_init_point`
// (queda por confirmar con el primer pago de prueba cual corresponde con credenciales de prueba).
async function crearPreferencia(cuerpo, accessToken, fetchFn = fetch) {
  const datos = await llamar('POST', '/checkout/preferences', accessToken, cuerpo, fetchFn);
  const urlPago = datos && (datos.init_point || datos.sandbox_init_point);
  if (!datos || !datos.id || !urlPago) {
    throw new MercadoPagoError('Mercado Pago no devolvió el enlace de pago', { detalle: 'respuesta incompleta' });
  }
  return { id: String(datos.id), urlPago };
}

// Consulta un pago por su id. Es la UNICA fuente de verdad sobre el estado de un pago:
// lo que diga el aviso (webhook) no se usa para confirmar nada.
// El id viene de la direccion del aviso, asi que se exige que sea solo digitos
// antes de armar la ruta (evita que un valor raro cambie la direccion consultada).
async function obtenerPago(pagoId, accessToken, fetchFn = fetch) {
  const id = String(pagoId);
  if (!/^\d{1,20}$/.test(id)) {
    throw new MercadoPagoError('Identificador de pago inválido', { detalle: 'id_no_numerico' });
  }
  return llamar('GET', `/v1/payments/${id}`, accessToken, undefined, fetchFn);
}

// Lista los metodos de pago (solo para la tarea 3.4, que se hace una sola vez).
async function listarMetodosDePago(accessToken, fetchFn = fetch) {
  return llamar('GET', '/v1/payment_methods', accessToken, undefined, fetchFn);
}

module.exports = {
  TIPOS_PERMITIDOS,
  TIPOS_EXCLUIDOS,
  MercadoPagoError,
  fechaArgentina,
  armarPreferencia,
  crearPreferencia,
  obtenerPago,
  listarMetodosDePago,
};
