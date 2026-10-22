// server/estados.js
// Decide que le pasa a una venta cuando llega el estado de un pago.
// Es una funcion pura: no llama a la red ni a la base de datos, asi se prueba con `node -e`.
// Ver design.md, punto 5 (estados y transiciones):
//
//   pendiente --(aprobado)-------> confirmada            (final)
//   pendiente --(rechazado)------> rechazada
//   rechazada --(aprobado + hay stock)--> confirmada
//   aprobado sin stock ----------> rechazada (sin_stock, requiereReembolso)
//   confirmada nunca retrocede

// Estados de un pago en Mercado Pago, agrupados por lo que significan para la venta
const APROBADO = ['approved'];
const PENDIENTE = ['pending', 'in_process', 'authorized', 'in_mediation'];
const RECHAZADO = ['rejected', 'cancelled'];

// Devuelve 'aprobado', 'pendiente', 'rechazado' u 'otro' (por ejemplo reembolsado: no cambia la venta).
function clasificarPago(status) {
  if (APROBADO.includes(status)) return 'aprobado';
  if (PENDIENTE.includes(status)) return 'pendiente';
  if (RECHAZADO.includes(status)) return 'rechazado';
  return 'otro';
}

const SIN_CAMBIO = { accion: 'sin_cambio' };

// Devuelve { accion } con una de estas tres:
//   'sin_cambio'  la venta se queda como esta
//   'confirmar'   pasa a confirmada (se emiten las entradas y se descuenta el stock)
//   'rechazar'    pasa a rechazada, con `motivo` (y `requiereReembolso` si ya se cobro)
//
//   venta:           { estado, motivo } tal como esta guardada
//   pago:            { status, status_detail } tal como lo informa Mercado Pago
//   hayStock:        si al confirmar quedan entradas suficientes en el lote
//   motivoSinStock:  por que no se puede confirmar un pago aprobado (por defecto 'sin_stock')
function decidirTransicion({ venta, pago, hayStock, motivoSinStock = 'sin_stock' } = {}) {
  const estado = venta && venta.estado;

  // Una venta confirmada no retrocede, diga lo que diga un aviso posterior.
  // Y un estado que no conocemos tampoco se toca.
  if (estado !== 'pendiente' && estado !== 'rechazada') return SIN_CAMBIO;

  const clase = clasificarPago(pago && pago.status);

  if (clase === 'aprobado') {
    if (hayStock) return { accion: 'confirmar' };
    // Ya esta rechazada por la misma razon: repetir el aviso no cambia nada
    if (estado === 'rechazada' && venta.motivo === motivoSinStock) return SIN_CAMBIO;
    // Se cobro pero no se puede entregar: queda para devolver el dinero a mano
    return { accion: 'rechazar', motivo: motivoSinStock, motivoDetalle: null, requiereReembolso: true };
  }

  if (clase === 'rechazado') {
    // Solo una venta que seguia pendiente pasa a rechazada. Si ya estaba rechazada, se deja como esta.
    if (estado !== 'pendiente') return SIN_CAMBIO;
    return {
      accion: 'rechazar',
      motivo: pago.status === 'cancelled' ? 'pago_cancelado' : 'pago_rechazado',
      motivoDetalle: typeof pago.status_detail === 'string' ? pago.status_detail.slice(0, 100) : null,
      requiereReembolso: false,
    };
  }

  // Pendiente o en proceso (o un estado desconocido): la venta sigue como esta
  return SIN_CAMBIO;
}

module.exports = { clasificarPago, decidirTransicion };
