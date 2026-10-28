// shared/comision.js
// Costo de servicio en el navegador: solo para MOSTRAR el desglose antes de pagar.
// Funciones puras (sin Firestore ni página). Lo que se cobra lo calcula el servidor (server/comision.js)
// con las mismas reglas; la prueba 25 comprueba que los dos den el mismo resultado.

export const PORCENTAJE_MAXIMO_COMISION = 30;

const redondearComision = (n) => Math.round(n * 100) / 100;

// La categoría de costo de servicio del evento: { id, nombre, porcentaje }, o null si no tiene,
// ya no existe o su porcentaje no es válido (0 a 30). `config` es el documento configuracion/comisiones.
export function categoriaDeComision(evento, config) {
    const id = evento && typeof evento.comisionCategoriaId === 'string' ? evento.comisionCategoriaId : '';
    if (!id) return null;
    const lista = config && Array.isArray(config.categorias) ? config.categorias : [];
    const c = lista.find((x) => x && typeof x === 'object' && x.id === id);
    if (!c || typeof c.porcentaje !== 'number' || !Number.isFinite(c.porcentaje)) return null;
    if (c.porcentaje < 0 || c.porcentaje > PORCENTAJE_MAXIMO_COMISION) return null;
    return { id: c.id, nombre: typeof c.nombre === 'string' ? c.nombre : '', porcentaje: c.porcentaje };
}

// { subtotal, costoServicio, total } de una compra. El costo se calcula sobre el total, no por entrada.
export function desgloseDeCompra(precioUnitario, cantidad, porcentaje) {
    const subtotal = redondearComision((Number(precioUnitario) || 0) * (Number(cantidad) || 0));
    const pct = Number(porcentaje);
    const costoServicio = Number.isFinite(pct) && pct > 0 ? redondearComision((subtotal * pct) / 100) : 0;
    return { subtotal, costoServicio, total: redondearComision(subtotal + costoServicio) };
}
