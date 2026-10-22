// server/confirmacion.js
// Aplica un pago ya verificado a su venta, TODO dentro de una transaccion de Firestore:
// o se hace todo (estado, stock, entradas) o no se hace nada. Ver design.md, puntos 5, 6 y 8.
// Nunca imprime datos del comprador.

const crypto = require('crypto');
const { FieldValue } = require('./firestore');
const { clasificarPago, decidirTransicion } = require('./estados');

// Nombre del metodo de pago como lo muestran el panel y los reportes (con tilde)
const NOMBRES_METODO = {
  credit_card: 'Crédito',
  debit_card: 'Débito',
  prepaid_card: 'Prepaga',
  account_money: 'Dinero en cuenta',
};

function nombreMetodoPago(pago) {
  return NOMBRES_METODO[pago && pago.payment_type_id] || 'Otro';
}

// Un codigo por entrada. Mantiene el prefijo `ENT-` que ya usaba el sitio, pero con 12 bytes
// aleatorios (24 caracteres hexadecimales): imposible de adivinar, a diferencia de la hora + 4 letras.
function generarEntradas(cantidad, bytesAleatorios = crypto.randomBytes) {
  const codigos = new Set();
  while (codigos.size < cantidad) {
    codigos.add(`ENT-${bytesAleatorios(12).toString('hex')}`);
  }
  // Formato exacto { codigo, usado }: validador.html las busca con array-contains y no admite campos extra
  return [...codigos].map((codigo) => ({ codigo, usado: false }));
}

const aNumero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

// Comprueba si el lote de la venta existe y todavia tiene entradas para ella.
// Devuelve { hayStock, motivoSinStock, lotes, loteIndex }.
function revisarStock(evento, venta) {
  const sin = (motivoSinStock) => ({ hayStock: false, motivoSinStock });
  if (!evento) return sin('evento_inexistente');

  const lotes = Array.isArray(evento.lotes) ? evento.lotes : [];
  const lote = lotes[venta.loteIndex];
  // El lote se identifica por su posicion y se verifica que el nombre sea el mismo que al comprar.
  // crear-pago guarda '' cuando el lote no tiene nombre, asi que un nombre ausente equivale a ''.
  if (!lote || typeof lote !== 'object' || (lote.nombre || '') !== (venta.loteNombre || '')) return sin('lote_inconsistente');

  const cantidad = Number(venta.cantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1) return sin('lote_inconsistente');

  const disponibles = aNumero(lote.disponibles) - aNumero(lote.vendidas);
  if (cantidad > disponibles) return sin('sin_stock');

  return { hayStock: true, lotes, loteIndex: venta.loteIndex };
}

// Aplica el pago a la venta. Devuelve { resultado } con 'confirmada', 'rechazada', 'sin_cambio'
// o 'venta_inexistente' (y `pagoDuplicado: true` si una venta ya confirmada recibe OTRO pago aprobado).
// Si algo falla (base de datos, red), lanza el error: la transaccion no deja nada a medias.
async function aplicarPago(db, ventaId, pago) {
  return db.runTransaction(async (tx) => {
    // --- Primero TODAS las lecturas (Firestore no permite leer despues de escribir) ---
    const ventaRef = db.collection('ventas').doc(ventaId);
    const ventaSnap = await tx.get(ventaRef);
    if (!ventaSnap.exists) return { resultado: 'venta_inexistente' };
    const venta = ventaSnap.data();

    const aprobado = clasificarPago(pago.status) === 'aprobado';

    // Una venta confirmada no cambia. Si llega OTRO pago aprobado, el comprador pago dos veces: se avisa.
    if (venta.estado === 'confirmada') {
      const otroPago = aprobado && String(venta.mpPaymentId) !== String(pago.id);
      return otroPago ? { resultado: 'sin_cambio', pagoDuplicado: true } : { resultado: 'sin_cambio' };
    }

    // El stock solo importa si hay un pago aprobado que confirmar
    let stock = { hayStock: false };
    let eventoRef = null;
    if (aprobado && typeof venta.eventoId === 'string' && venta.eventoId) {
      eventoRef = db.collection('eventos').doc(venta.eventoId);
      const eventoSnap = await tx.get(eventoRef);
      stock = revisarStock(eventoSnap.exists ? eventoSnap.data() : null, venta);
    }

    const decision = decidirTransicion({
      venta,
      pago,
      hayStock: stock.hayStock,
      motivoSinStock: stock.motivoSinStock,
    });

    // --- Despues, las escrituras (se aplican todas juntas al terminar la transaccion) ---
    if (decision.accion === 'confirmar') {
      // Firestore no permite cambiar un elemento de un arreglo: se reescribe el arreglo completo
      const lotes = stock.lotes.map((lote, i) => (
        i === stock.loteIndex ? { ...lote, vendidas: aNumero(lote.vendidas) + Number(venta.cantidad) } : lote
      ));
      tx.update(eventoRef, { lotes });
      tx.update(ventaRef, {
        estado: 'confirmada',
        motivo: null,
        motivoDetalle: null,
        requiereReembolso: false,
        metodo_pago: nombreMetodoPago(pago),
        mpPaymentId: String(pago.id),
        entradas: generarEntradas(Number(venta.cantidad)),
        fechaConfirmacion: FieldValue.serverTimestamp(),
      });
      return { resultado: 'confirmada' };
    }

    if (decision.accion === 'rechazar') {
      tx.update(ventaRef, {
        estado: 'rechazada',
        motivo: decision.motivo,
        motivoDetalle: decision.motivoDetalle || null,
        requiereReembolso: decision.requiereReembolso === true,
        fechaRechazo: FieldValue.serverTimestamp(),
      });
      return { resultado: 'rechazada', motivo: decision.motivo };
    }

    return { resultado: 'sin_cambio' };
  });
}

module.exports = { NOMBRES_METODO, nombreMetodoPago, generarEntradas, revisarStock, aplicarPago };
