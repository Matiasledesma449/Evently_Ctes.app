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

// "Transferencia, débito o crédito" (la última con "o"), para el aviso del paso de pago
export function textoDeFormasDePago() {
    const nombres = FORMAS_DE_PAGO.map((f) => f.toLowerCase());
    return nombres.slice(0, -1).join(', ') + ' o ' + nombres[nombres.length - 1];
}
