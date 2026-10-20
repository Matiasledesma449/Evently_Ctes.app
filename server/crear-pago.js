// server/crear-pago.js
// Flujo completo de "crear pago". Devuelve { status, cuerpo } y nunca lanza:
// asi la funcion de Vercel (api/crear-pago.js) solo tiene que enviar la respuesta.
// Las dependencias se pueden reemplazar (`deps`) para probar sin red ni base de datos.

const { requerir, VARIABLES, siteUrl, ConfigError } = require('./config');
const { validarPedido } = require('./validaciones');
const { leerEvento, calcularCompra } = require('./compra');
const { crearVentaPendiente, guardarPreferencia, marcarRechazada } = require('./ventas');
const { armarPreferencia, crearPreferencia, MercadoPagoError } = require('./mercadopago');
const { obtenerDb } = require('./firestore');

// Mensaje unico que ve el comprador cuando algo falla por nuestra parte o la de Mercado Pago.
// Nunca incluye detalles internos, nombres de variables ni claves.
const MENSAJE_GENERICO = 'No pudimos iniciar el pago. Intentá de nuevo en unos minutos.';

const ok = (cuerpo) => ({ status: 200, cuerpo: { ok: true, ...cuerpo } });
const fallo = (status, error) => ({ status, cuerpo: { ok: false, error } });

async function crearPago(cuerpoPedido, deps = {}) {
  const { db: dbInyectada, fetchFn = fetch, ahora = new Date(), registrar = console.error } = deps;

  try {
    // 1) Datos del comprador (no toca ningun servicio externo)
    const validacion = validarPedido(cuerpoPedido);
    if (!validacion.ok) {
      return fallo(400, {
        codigo: 'PEDIDO_INVALIDO',
        mensaje: validacion.errores[0].mensaje,
        errores: validacion.errores,
      });
    }
    const pedido = validacion.datos;

    // 2) Configuracion: si falta un secreto NO se crea ninguna venta
    const { MP_ACCESS_TOKEN } = requerir([VARIABLES.MP_ACCESS_TOKEN]);
    const base = siteUrl();
    const db = dbInyectada || obtenerDb();

    // 3) Evento, precio y stock: todo desde lo guardado en el servidor
    const evento = await leerEvento(db, pedido.eventoId);
    const calculo = calcularCompra(evento, pedido);
    if (!calculo.ok) {
      const error = { codigo: calculo.codigo, mensaje: calculo.mensaje };
      if (calculo.disponibles !== undefined) error.disponibles = calculo.disponibles;
      return fallo(calculo.status, error);
    }

    // 4) Venta pendiente (su id sera la referencia del pago)
    const venta = await crearVentaPendiente(db, { eventoId: pedido.eventoId, evento, pedido, calculo, ahora });

    // 5) Preferencia en Mercado Pago
    let preferencia;
    try {
      const cuerpoMp = armarPreferencia({
        ventaId: venta.id, token: venta.token, eventoId: pedido.eventoId,
        evento, pedido, calculo, siteUrl: base, ahora,
      });
      preferencia = await crearPreferencia(cuerpoMp, MP_ACCESS_TOKEN, fetchFn);
    } catch (e) {
      if (!(e instanceof MercadoPagoError)) throw e;
      // Mercado Pago fallo: la venta queda rechazada y el comprador puede reintentar
      registrar('[crear-pago] Mercado Pago fallo', { estado: e.estado, detalle: e.detalle, ventaId: venta.id });
      try {
        await marcarRechazada(db, venta.id, 'error_mercado_pago');
      } catch (e2) {
        registrar('[crear-pago] No se pudo marcar la venta como rechazada', { ventaId: venta.id, error: e2 && e2.name });
      }
      return fallo(502, { codigo: 'ERROR_MERCADO_PAGO', mensaje: MENSAJE_GENERICO });
    }

    // 6) Guardar el id de la preferencia (informativo: si falla, el pago igual sigue)
    try {
      await guardarPreferencia(db, venta.id, preferencia.id);
    } catch (e) {
      registrar('[crear-pago] No se pudo guardar la preferencia', { ventaId: venta.id, error: e && e.name });
    }

    return ok({ urlPago: preferencia.urlPago });
  } catch (e) {
    if (e instanceof ConfigError) {
      // Se registra QUE variables faltan (nunca sus valores); el comprador ve el mensaje generico
      registrar('[crear-pago] Error de configuracion', { faltantes: e.faltantes });
    } else {
      registrar('[crear-pago] Error inesperado', { error: e && e.name });
    }
    return fallo(500, { codigo: 'ERROR_INTERNO', mensaje: MENSAJE_GENERICO });
  }
}

module.exports = { crearPago, MENSAJE_GENERICO };
