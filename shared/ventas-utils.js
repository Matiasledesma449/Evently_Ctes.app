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

// ======================================================================================================
// Tarjetas de resumen de la pantalla Ventas: cambian según el filtro de estado y de método de pago.
// Son funciones puras (sin página ni Firestore) para poder probarlas con node.
// "Recaudado" cuenta SOLO ventas confirmadas; lo pendiente se muestra como "en espera" y lo rechazado
// como "no cobrado", nunca como recaudación.
// ======================================================================================================

// Milisegundos de una fecha de Firestore ({ seconds }), de un Date o de un número. null si no hay fecha válida.
function fechaEnMs(fecha) {
    if (fecha === null || fecha === undefined) return null;
    if (typeof fecha === 'number') return Number.isFinite(fecha) ? fecha : null;
    if (Object.prototype.toString.call(fecha) === '[object Date]') {
        const t = fecha.getTime();
        return Number.isFinite(t) ? t : null;
    }
    if (typeof fecha === 'object' && typeof fecha.seconds === 'number' && Number.isFinite(fecha.seconds)) return fecha.seconds * 1000;
    return null;
}

// Las ventas que cumplen a la vez el filtro de estado y el de método ('todos' no filtra)
export function filtrarVentas(ventas, estado = 'todos', metodo = 'todos') {
    // El método se compara sin espacios sobrantes, igual que en metodosDePago, para que lo que se ofrece siempre filtre
    const metodoDe = (v) => (typeof v.metodo_pago === 'string' ? v.metodo_pago.trim() : '');
    return (Array.isArray(ventas) ? ventas : []).filter((v) =>
        v && (estado === 'todos' || v.estado === estado) && (metodo === 'todos' || metodoDe(v) === metodo));
}

// Los métodos de pago que tienen las ventas, sin repetir, sin vacíos y ordenados
export function metodosDePago(ventas) {
    const vistos = new Set();
    for (const v of (Array.isArray(ventas) ? ventas : [])) {
        if (v && typeof v.metodo_pago === 'string' && v.metodo_pago.trim() !== '') vistos.add(v.metodo_pago.trim());
    }
    return [...vistos].sort((a, b) => a.localeCompare(b, 'es'));
}

// "hace 5 min", "hace 3 h", "hace 2 días". `ahora` es un Date o un número (se recibe para poder probarlo).
export function tiempoDesde(fecha, ahora = Date.now()) {
    const desde = fechaEnMs(fecha);
    const hasta = fechaEnMs(ahora);
    if (desde === null || hasta === null) return '—';
    const minutos = Math.floor((hasta - desde) / 60000);
    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
}

const dinero = (n) => `$${aNumero(n).toLocaleString()}`;

// Las 4 tarjetas del filtro de estado elegido: { titulo, valor, ayuda, tono }.
// `valor` ya viene como texto listo para mostrar. `tono`: 'dinero' (violeta), 'pendiente' (amarillo),
// 'rechazo' (rojo) o 'normal' (gris), los mismos colores que ya usa el panel.
export function tarjetasDelFiltro(estado, ventas, ahora = Date.now()) {
    const lista = Array.isArray(ventas) ? ventas.filter(Boolean) : [];

    if (estado === 'pendiente') {
        const pendientes = lista.filter((v) => v.estado === 'pendiente');
        const fechas = pendientes.map((v) => fechaEnMs(v.fecha)).filter((t) => t !== null);
        const masVieja = fechas.length > 0 ? Math.min(...fechas) : null;
        return [
            { titulo: 'Ventas pendientes', valor: String(pendientes.length), ayuda: 'Esperando que se pague', tono: 'pendiente' },
            { titulo: 'Entradas en espera', valor: String(pendientes.reduce((s, v) => s + aNumero(v.cantidad), 0)), ayuda: 'Todavía no se vendieron', tono: 'pendiente' },
            { titulo: 'Dinero en espera', valor: dinero(pendientes.reduce((s, v) => s + aNumero(v.monto_total), 0)), ayuda: 'Todavía no se cobró', tono: 'pendiente' },
            { titulo: 'La más antigua', valor: masVieja === null ? '—' : tiempoDesde(masVieja, ahora), ayuda: 'Venta pendiente más vieja', tono: 'normal' }
        ];
    }

    if (estado === 'rechazada') {
        const rechazadas = lista.filter((v) => v.estado === 'rechazada');
        const cuenta = new Map();
        for (const v of rechazadas) {
            if (v.motivo) cuenta.set(v.motivo, (cuenta.get(v.motivo) || 0) + 1);
        }
        let motivo = null;
        let max = 0;
        for (const [m, n] of cuenta) {
            if (n > max) { max = n; motivo = m; }
        }
        return [
            { titulo: 'Ventas rechazadas', valor: String(rechazadas.length), ayuda: 'No se completaron', tono: 'rechazo' },
            { titulo: 'Entradas que no se vendieron', valor: String(rechazadas.reduce((s, v) => s + aNumero(v.cantidad), 0)), ayuda: 'Volvieron a estar disponibles', tono: 'rechazo' },
            { titulo: 'Dinero no cobrado', valor: dinero(rechazadas.reduce((s, v) => s + aNumero(v.monto_total), 0)), ayuda: 'No suma a la recaudación', tono: 'rechazo' },
            { titulo: 'Motivo más frecuente', valor: motivo === null ? '—' : textoDelMotivo(motivo), ayuda: 'Por qué se rechazan más', tono: 'normal' }
        ];
    }

    const r = resumenDeVentas(lista);

    if (estado === 'confirmada') {
        return [
            { titulo: 'Total recaudado', valor: dinero(r.recaudado), ayuda: 'Solo ventas confirmadas', tono: 'dinero' },
            { titulo: 'Entradas vendidas', valor: String(r.entradas), ayuda: 'De ventas confirmadas', tono: 'normal' },
            { titulo: 'Ventas confirmadas', valor: String(r.confirmadas), ayuda: 'Pagos aprobados', tono: 'normal' },
            { titulo: 'Promedio por venta', valor: r.confirmadas > 0 ? dinero(r.recaudado / r.confirmadas) : '—', ayuda: 'Recaudado ÷ ventas', tono: 'normal' }
        ];
    }

    // 'todos' (y cualquier valor desconocido): las cifras generales de siempre
    return [
        { titulo: 'Total recaudado', valor: dinero(r.recaudado), ayuda: 'Solo ventas confirmadas', tono: 'dinero' },
        { titulo: 'Entradas vendidas', valor: String(r.entradas), ayuda: 'De ventas confirmadas', tono: 'normal' },
        { titulo: 'Ventas confirmadas', valor: String(r.confirmadas), ayuda: 'Pagos aprobados', tono: 'normal' },
        { titulo: 'Pendientes de pago', valor: String(r.pendientes), ayuda: 'No suman a la recaudación', tono: 'pendiente' }
    ];
}
