// shared/ventas-utils.js
// Reglas comunes del panel de administracion sobre las ventas, para que Dashboard, Ventas, Reportes y
// Panel Global usen EXACTAMENTE el mismo criterio. Son funciones puras: no tocan la pagina ni Firestore.
//
// Criterio de dinero: solo cuentan las ventas `confirmada`. Las `pendiente` se informan aparte como
// "pendientes de pago" y las `rechazada` no suman a ninguna cifra (ver specs/panel-de-ventas).

// Escapa un texto para ponerlo dentro de HTML. El correo y el nombre los escribe quien compra y el
// nombre del lote lo escribe el organizador: nunca se deben mostrar sin escapar.
export function escaparHtml(valor) {
    const reemplazos = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
    return String(valor === undefined || valor === null ? '' : valor).replace(/[&<>"'`]/g, (c) => reemplazos[c]);
}

const aNumero = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
};

export function esConfirmada(venta) {
    return !!venta && venta.estado === 'confirmada';
}

// Solo las ventas confirmadas (las unicas que suman dinero y entradas vendidas)
export function soloConfirmadas(ventas) {
    return (Array.isArray(ventas) ? ventas : []).filter(esConfirmada);
}

// Cifras de un conjunto de ventas. `recaudado` y `entradas` salen unicamente de las confirmadas.
export function resumenDeVentas(ventas) {
    const resumen = { recaudado: 0, entradas: 0, confirmadas: 0, pendientes: 0, rechazadas: 0 };
    for (const v of (Array.isArray(ventas) ? ventas : [])) {
        if (!v) continue;
        if (v.estado === 'confirmada') {
            resumen.recaudado += aNumero(v.monto_total);
            resumen.entradas += aNumero(v.cantidad);
            resumen.confirmadas += 1;
        } else if (v.estado === 'pendiente') {
            resumen.pendientes += 1;
        } else if (v.estado === 'rechazada') {
            resumen.rechazadas += 1;
        }
    }
    return resumen;
}

// Motivos de rechazo en lenguaje simple (para quien administra el evento)
const MOTIVOS = {
    vencida: 'No se pagó a tiempo',
    pago_rechazado: 'Mercado Pago rechazó el pago',
    pago_cancelado: 'El pago fue cancelado',
    sin_stock: 'Se agotaron las entradas mientras pagaba',
    lote_inconsistente: 'El lote cambió mientras se pagaba',
    evento_inexistente: 'El evento ya no existe',
    error_mercado_pago: 'No se pudo iniciar el pago en Mercado Pago',
};

// Devuelve el texto del motivo, o '' si no hay motivo. Un motivo desconocido nunca se muestra tal cual.
export function textoDelMotivo(motivo) {
    if (!motivo) return '';
    return MOTIVOS[motivo] || 'Motivo no especificado';
}

const ETIQUETAS = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente de pago',
    rechazada: 'Rechazada',
    anulada: 'Anulada (anterior)', // ventas de prueba viejas: ya no se crea este estado
};

export function etiquetaDeEstado(estado) {
    return ETIQUETAS[estado] || (estado ? String(estado) : 'N/A');
}

// Clase de color de la etiqueta de estado
export function claseDeEstado(estado) {
    if (estado === 'confirmada') return 'estado-confirmada';
    if (estado === 'pendiente') return 'estado-pendiente';
    return 'estado-rechazada';
}

// "Nombre Apellido", o '' en las ventas viejas que no tienen esos datos
export function nombreDelComprador(venta) {
    if (!venta) return '';
    return [venta.nombre, venta.apellido]
        .filter((parte) => typeof parte === 'string' && parte.trim() !== '')
        .map((parte) => parte.trim())
        .join(' ');
}

// Avisos para quien administra: reembolsos pendientes y pagos para revisar. Devuelve una lista de textos.
export function avisosDeVenta(venta) {
    const avisos = [];
    if (!venta) return avisos;

    if (venta.requiereReembolso === true) {
        if (venta.motivoReembolso === 'pago_duplicado') {
            const ids = Array.isArray(venta.pagosDuplicados) ? venta.pagosDuplicados.join(', ') : '';
            avisos.push('Pago repetido: hay que devolver el dinero desde el panel de Mercado Pago' + (ids ? ` (pago N° ${ids})` : ''));
        } else {
            avisos.push('Reembolso pendiente: hay que devolver el dinero desde el panel de Mercado Pago' + (venta.mpPaymentId ? ` (pago N° ${venta.mpPaymentId})` : ''));
        }
    }

    if (venta.requiereRevision === true) {
        avisos.push('Revisar el pago: llegó con un monto o una moneda distinta a la de la venta');
    }
    return avisos;
}
