// server/webhook.js
// Flujo del aviso (webhook) de Mercado Pago. Devuelve { status, cuerpo } y nunca lanza:
// asi la funcion de Vercel (api/mp-webhook.js) solo tiene que enviar la respuesta.
// Las dependencias se pueden reemplazar (`deps`) para probar sin red ni base de datos.
//
// Codigos de respuesta (Mercado Pago reintenta ante cualquier respuesta que no sea 2xx):
//   401  firma ausente o incorrecta: no se hace nada
//   200  aviso recibido (tambien cuando se ignora o no hay nada que cambiar)
//   500  error temporal nuestro o de Mercado Pago: se pide que reintente

const { requerir, VARIABLES, ConfigError } = require('./config');
const { verificarFirma } = require('./firma');
const { obtenerPago, MercadoPagoError } = require('./mercadopago');
const { ventaIdDelPago, compararPagoConVenta } = require('./pagos');
const { leerVenta, marcarRevision } = require('./ventas');
const { aplicarPago } = require('./confirmacion');
const { obtenerDb } = require('./firestore');
const { enviarConfirmacion } = require('./correos');

// Motivos de no coincidencia que dejan la venta marcada para revision (los que tienen que ver con el dinero)
const MOTIVOS_DE_REVISION = ['monto_distinto', 'moneda_distinta', 'monto_invalido'];

const ok = (cuerpo) => ({ status: 200, cuerpo: { ok: true, ...cuerpo } });
const fallo = (status, codigo, mensaje) => ({ status, cuerpo: { ok: false, error: { codigo, mensaje } } });

// Un valor de la direccion o de los encabezados solo sirve si es un texto.
// (Si llegara repetido, Node lo entrega como arreglo y se descarta.)
const texto = (valor) => (typeof valor === 'string' ? valor : undefined);

// Tipo del aviso: `type` (formato actual), `topic` (formato viejo) o el del cuerpo.
function tipoDeAviso(query, body) {
  const q = query || {};
  const b = body && typeof body === 'object' ? body : {};
  return texto(q.type) || texto(q.topic) || texto(b.type);
}

// peticion: { query, headers, body }. Los encabezados llegan en minusculas.
async function procesarAviso(peticion, deps = {}) {
  const { db: dbInyectada, fetchFn = fetch, registrar = console.error } = deps;
  // Correo de confirmación (pedido 23): solo si se configuró Gmail en Vercel, o si una prueba lo reemplaza
  const mandarConfirmacion = deps.enviarConfirmacion
    || (process.env.GMAIL_USUARIO && process.env.GMAIL_CLAVE_APLICACION ? (base, id) => enviarConfirmacion(base, id, { registrar }) : null);
  const { query = {}, headers = {}, body } = peticion || {};

  try {
    // 1) Firma: sin una firma valida no se hace NADA mas (ni se consulta a Mercado Pago)
    const { MP_WEBHOOK_SECRET } = requerir([VARIABLES.MP_WEBHOOK_SECRET]);
    const dataId = texto(query['data.id']);
    const firma = verificarFirma({
      xSignature: texto(headers['x-signature']),
      xRequestId: texto(headers['x-request-id']),
      dataId,
      secreto: MP_WEBHOOK_SECRET,
    });
    if (!firma.ok) {
      registrar('[mp-webhook] Aviso rechazado por la firma', { motivo: firma.motivo, ...firma.diagnostico });
      return fallo(401, 'NO_AUTORIZADO', 'No autorizado.');
    }

    // 2) Solo interesan los avisos de pagos; el resto se confirma con 200 y se ignora
    if (tipoDeAviso(query, body) !== 'payment') {
      return ok({ resultado: 'ignorado' });
    }
    if (!/^\d{1,20}$/.test(dataId.trim())) {
      registrar('[mp-webhook] Aviso de pago con identificador no numerico');
      return ok({ resultado: 'ignorado' });
    }

    // 3) Estado real del pago: se le pregunta a Mercado Pago, nunca se cree lo que dice el aviso
    const { MP_ACCESS_TOKEN } = requerir([VARIABLES.MP_ACCESS_TOKEN]);
    let pago;
    try {
      pago = await obtenerPago(dataId.trim(), MP_ACCESS_TOKEN, fetchFn);
    } catch (e) {
      if (!(e instanceof MercadoPagoError)) throw e;
      // Un pago que no existe no se arregla reintentando: se confirma recibido y no se cambia nada
      if (e.estado === 404) {
        registrar('[mp-webhook] Pago inexistente en Mercado Pago', { pagoId: dataId.trim() });
        return ok({ resultado: 'pago_no_encontrado' });
      }
      // Cualquier otro fallo es temporal: 500 para que Mercado Pago vuelva a avisar
      registrar('[mp-webhook] No se pudo consultar el pago', { estado: e.estado, detalle: e.detalle, pagoId: dataId.trim() });
      return fallo(500, 'ERROR_TEMPORAL', 'No pudimos procesar el aviso. Reintentá.');
    }

    // 4) A que venta pertenece el pago: la indica `external_reference` (la pusimos al crear la preferencia)
    const ventaId = ventaIdDelPago(pago);
    if (!ventaId) {
      registrar('[mp-webhook] Pago sin referencia de venta valida', { pagoId: dataId.trim() });
      return ok({ resultado: 'sin_venta' });
    }
    const db = dbInyectada || obtenerDb();
    const venta = await leerVenta(db, ventaId);

    // 5) Debe coincidir TODO (venta existente, moneda y monto). Si no, no se confirma nada:
    //    se registra el motivo y se responde 200 (reintentar no cambiaria el resultado).
    const comparacion = compararPagoConVenta(pago, ventaId, venta);
    if (!comparacion.ok) {
      registrar('[mp-webhook] El pago no coincide con la venta', { motivo: comparacion.motivo, ventaId, pagoId: dataId.trim() });
      // Si la venta existe y lo que no coincide es el dinero (monto o moneda), queda marcada para revision.
      // No se cambia su estado: solo se deja constancia para que una persona la mire.
      if (venta && MOTIVOS_DE_REVISION.includes(comparacion.motivo) && !venta.requiereRevision) {
        await marcarRevision(db, ventaId, comparacion.motivo);
      }
      return ok({ resultado: comparacion.motivo === 'venta_inexistente' ? 'venta_inexistente' : 'no_coincide' });
    }

    // 6) Confirmar o rechazar la venta, todo dentro de una transaccion (server/confirmacion.js).
    //    Si falla, el error llega al catch de abajo y se responde 500 para que Mercado Pago reintente.
    const aplicado = await aplicarPago(db, ventaId, pago);
    if (aplicado.pagoDuplicado) {
      // La venta ya estaba confirmada con otro pago: el comprador pago dos veces y hay que devolverle uno
      registrar('[mp-webhook] Pago duplicado en una venta ya confirmada: revisar reembolso', { ventaId, pagoId: dataId.trim() });
    }
    // 7) Venta recién confirmada: se le manda el correo con sus entradas. Si falla, la venta queda confirmada igual
    //    (enviarConfirmacion nunca lanza) y el comprador sigue teniendo la página de su compra.
    if (aplicado.resultado === 'confirmada' && mandarConfirmacion) {
      await mandarConfirmacion(db, ventaId);
    }
    return ok({ resultado: aplicado.resultado });
  } catch (e) {
    if (e instanceof ConfigError) {
      // Se registra QUE variables faltan (nunca sus valores)
      registrar('[mp-webhook] Error de configuracion', { faltantes: e.faltantes });
    } else {
      registrar('[mp-webhook] Error inesperado', { error: e && e.name });
    }
    return fallo(500, 'ERROR_INTERNO', 'No pudimos procesar el aviso. Reintentá.');
  }
}

module.exports = { procesarAviso, tipoDeAviso };
