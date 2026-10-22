// server/pagos.js
// Reglas sobre un pago ya consultado a Mercado Pago: a que venta corresponde y si coincide.
// Son funciones puras: no llaman a la red ni a la base de datos, asi se prueban con `node -e`.

const MONEDA = 'ARS';

// Los montos se comparan en centavos enteros para evitar errores de decimales (0.1 + 0.2).
const enCentavos = (n) => Math.round(Number(n) * 100);

// Identificador de venta valido: los ids automaticos de Firestore son letras y numeros.
// Se descarta cualquier otra cosa (por ejemplo con "/") antes de usarla como ruta.
const ID_VENTA_VALIDO = /^[A-Za-z0-9]{1,64}$/;

// Devuelve el id de venta que Mercado Pago guardo como `external_reference`, o null si no sirve.
function ventaIdDelPago(pago) {
  const ref = pago && pago.external_reference;
  return typeof ref === 'string' && ID_VENTA_VALIDO.test(ref) ? ref : null;
}

// Compara el pago con la venta guardada. Devuelve { ok: true } o { ok: false, motivo }.
// El `motivo` es solo para los registros del servidor. Mientras no coincida TODO,
// la venta no se confirma (ver specs/confirmacion-de-pago).
//   pago:    respuesta de GET /v1/payments/{id}
//   ventaId: id de la venta que indica `external_reference`
//   venta:   datos guardados de la venta, o null si no existe
function compararPagoConVenta(pago, ventaId, venta) {
  if (!pago || typeof pago !== 'object') return { ok: false, motivo: 'pago_invalido' };
  if (!ventaId || pago.external_reference !== ventaId) return { ok: false, motivo: 'referencia_distinta' };
  if (!venta || typeof venta !== 'object') return { ok: false, motivo: 'venta_inexistente' };

  if (pago.currency_id !== MONEDA) return { ok: false, motivo: 'moneda_distinta' };

  // El monto del pago tiene que ser un numero de verdad (Number(null) y Number('') darian 0)
  if (typeof pago.transaction_amount !== 'number') return { ok: false, motivo: 'monto_invalido' };
  const montoPago = enCentavos(pago.transaction_amount);
  const montoVenta = enCentavos(venta.monto_total);
  if (!Number.isFinite(montoPago) || !Number.isFinite(montoVenta) || montoVenta <= 0) {
    return { ok: false, motivo: 'monto_invalido' };
  }
  // Tolerancia de un centavo
  if (Math.abs(montoPago - montoVenta) > 1) return { ok: false, motivo: 'monto_distinto' };

  return { ok: true };
}

module.exports = { MONEDA, ID_VENTA_VALIDO, ventaIdDelPago, compararPagoConVenta };
