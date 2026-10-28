// shared/forma-de-venta.js
// Cambiar la forma de venta de un evento ya publicado (pedidos 12 y 16): entrada única ↔ lotes.
// Funciones puras, sin red ni base de datos: las usan Editar evento (admin/eventos.html) y las pruebas.
// Regla de fondo: el servidor confirma cada venta por la POSICIÓN y el NOMBRE de su lote (server/confirmacion.js).
// Por eso un lote con ventas (confirmadas o con el pago en curso) nunca se quita, se mueve ni se renombra.

const VENTAS_QUE_CUENTAN = ['confirmada', 'pendiente'];

// Posiciones de los lotes que tienen ventas: por su contador `vendidas` o por alguna venta confirmada o pendiente
export function lotesConVentas(lotes, ventas) {
    const lista = Array.isArray(lotes) ? lotes : [];
    const posiciones = new Set();
    lista.forEach((lote, i) => { if (lote && Number(lote.vendidas) > 0) posiciones.add(i); });
    (Array.isArray(ventas) ? ventas : []).forEach((venta) => {
        if (!venta || !VENTAS_QUE_CUENTAN.includes(venta.estado)) return;
        let i = Number.isInteger(venta.loteIndex) ? venta.loteIndex : -1;
        if (i < 0 && typeof venta.loteNombre === 'string') i = lista.findIndex((l) => l && l.nombre === venta.loteNombre);
        if (i >= 0) posiciones.add(i);
    });
    return [...posiciones].sort((a, b) => a - b);
}

// Se puede pasar a entrada única si queda el primer lote y los que se quitan no tienen ventas.
// Devuelve { sePuede, quitados, conVentas } (quitados y conVentas son nombres de lotes).
export function pasarAUnica(lotes, ventas) {
    const lista = Array.isArray(lotes) ? lotes : [];
    if (lista.length <= 1) return { sePuede: lista.length === 1, quitados: [], conVentas: [] };
    const conVentas = lotesConVentas(lista, ventas).filter((i) => i > 0);
    const nombre = (i) => (lista[i] && lista[i].nombre) || `Lote ${i + 1}`;
    return {
        sePuede: conVentas.length === 0,
        quitados: lista.slice(1).map((_, k) => nombre(k + 1)),
        conVentas: conVentas.map(nombre),
    };
}
