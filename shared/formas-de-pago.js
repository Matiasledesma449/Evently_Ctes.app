// Las formas de pago que se nombran en el sitio: una sola lista para todas las páginas.
// Es solo el texto que ve la persona; lo que guarda el servidor (server/confirmacion.js) no cambia.
// No hay efectivo: el servidor lo excluye al crear el pago (Rapipago y Pago Fácil). Sin red ni base de datos.

// Formas que se le nombran a quien compra, en este orden
export const FORMAS_DE_PAGO = ['Transferencia', 'Débito', 'Crédito'];

// Cómo se muestra lo que el servidor guarda en `metodo_pago`. "Dinero en cuenta" se muestra como "Transferencia".
// "Prepaga" no se le nombra a quien compra, pero se sigue mostrando tal cual en el panel si aparece.
const NOMBRE_PARA_MOSTRAR = { 'Dinero en cuenta': 'Transferencia' };

export function nombreParaMostrar(guardado) {
    if (typeof guardado !== 'string') return '';
    const nombre = guardado.trim();
    return Object.prototype.hasOwnProperty.call(NOMBRE_PARA_MOSTRAR, nombre) ? NOMBRE_PARA_MOSTRAR[nombre] : nombre;
}

// A qué forma del filtro pertenece lo que guardó el servidor: 'Transferencia', 'Débito', 'Crédito' u 'Otros'.
// "Dinero en cuenta" cuenta como Transferencia. Lo demás (Prepaga, Efectivo viejo, vacío, desconocido) va a 'Otros'.
// Es el único lugar donde se decide la agrupación: filtro, tarjetas y gráficos usan esta función.
export function claveDeFormaDePago(guardado) {
    const nombre = nombreParaMostrar(guardado);
    return FORMAS_DE_PAGO.includes(nombre) ? nombre : 'Otros';
}

// Las opciones del filtro de forma de pago: siempre las tres formas, y 'Otros' solo si alguna venta con un método
// guardado cae ahí (las pendientes no tienen método y no cuentan)
export function opcionesDeFiltroDePago(ventas) {
    const hayOtros = (Array.isArray(ventas) ? ventas : []).some((v) =>
        v && typeof v.metodo_pago === 'string' && v.metodo_pago.trim() !== '' && claveDeFormaDePago(v.metodo_pago) === 'Otros');
    return hayOtros ? [...FORMAS_DE_PAGO, 'Otros'] : [...FORMAS_DE_PAGO];
}

// "Transferencia, débito o crédito" (la última con "o"), para el aviso del paso de pago
export function textoDeFormasDePago() {
    const nombres = FORMAS_DE_PAGO.map((f) => f.toLowerCase());
    return nombres.slice(0, -1).join(', ') + ' o ' + nombres[nombres.length - 1];
}
