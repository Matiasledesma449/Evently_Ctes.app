// shared/estado-evento.js
// Situación de venta de un evento publicado (pedido 13): activo, suspendido o eliminado (recuperable).
// Funciones puras, sin red ni base de datos: las usan la lista de Eventos, el sitio del comprador y las pruebas.
// Nada se borra: "eliminado" es una marca (`eliminado: true`) que también lo deja sin venta (`activo: false`).

// 'eliminado', 'suspendido' o 'activo'
export function situacionDelEvento(evento) {
    if (!evento) return 'activo';
    if (evento.eliminado === true) return 'eliminado';
    if (evento.activo === false) return 'suspendido';
    return 'activo';
}

// Si se puede ver y comprar en el sitio: publicado, ni suspendido ni eliminado
export function seVendeEnElSitio(evento) {
    return !!evento && (evento.estado || 'publicado') === 'publicado' && situacionDelEvento(evento) === 'activo';
}

// Los campos que cambia cada acción del superadmin. Recuperar lo deja suspendido (no vuelve a la venta solo).
const CAMBIOS = {
    suspender: { activo: false },
    activar: { activo: true },
    eliminar: { eliminado: true, activo: false },
    recuperar: { eliminado: false, activo: false },
};
export function cambiosDeAccion(accion) {
    return Object.prototype.hasOwnProperty.call(CAMBIOS, accion) ? { ...CAMBIOS[accion] } : null;
}

// Qué acciones ofrece la tarjeta según la situación
export function accionesDeEvento(evento) {
    const situacion = situacionDelEvento(evento);
    if (situacion === 'eliminado') return ['recuperar'];
    if (situacion === 'suspendido') return ['activar', 'eliminar'];
    return ['suspender', 'eliminar'];
}
