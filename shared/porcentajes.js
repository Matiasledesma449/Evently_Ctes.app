// shared/porcentajes.js
// Cálculo de porcentajes (pedido 17): ocupación, estado de las ventas, entradas por lote, recaudación por lote y
// formas de pago. Los gráficos del Resumen (shared/resumen-visual.js) usan porcentaje y repartoPorcentual. Salen de las mismas ventas confirmadas que las tarjetas (no de los
// contadores `vendidas` de los lotes).
// Son funciones puras: se prueban con node (pruebas/40-porcentajes.js).

const aNumero = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
};

// Porcentaje de parte sobre total, redondeado a un decimal (0 si no hay total)
export function porcentaje(parte, total) {
    const t = aNumero(total);
    if (t <= 0) return 0;
    return Math.round((aNumero(parte) / t) * 1000) / 10;
}

// Cada ítem con su porcentaje del total, de mayor a menor. items: [{ etiqueta, valor, detalle? }]
export function repartoPorcentual(items) {
    const lista = (Array.isArray(items) ? items : []).filter((i) => i && aNumero(i.valor) > 0);
    const total = lista.reduce((s, i) => s + aNumero(i.valor), 0);
    return lista
        .map((i) => ({ etiqueta: String(i.etiqueta || 'Sin nombre'), valor: aNumero(i.valor), detalle: i.detalle || '', porcentaje: porcentaje(i.valor, total) }))
        .sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta, 'es'));
}

// Lo que muestra el panel de porcentajes de uno o varios eventos.
// `claveDe` agrupa la forma de pago y `nombreDe` la muestra (shared/formas-de-pago.js); `dinero` da formato a la plata.
export function porcentajesDelEvento(eventos, ventas, { claveDe = null, nombreDe = null, dinero = String } = {}) {
    const listaEventos = (Array.isArray(eventos) ? eventos : []).filter(Boolean);
    const todas = (Array.isArray(ventas) ? ventas : []).filter(Boolean);
    const confirmadas = todas.filter((v) => v.estado === 'confirmada');
    const capacidad = listaEventos.reduce((s, ev) => s + (Array.isArray(ev.lotes) ? ev.lotes.reduce((t, l) => t + aNumero(l && l.disponibles), 0) : 0), 0);
    const entradas = confirmadas.reduce((s, v) => s + aNumero(v.cantidad), 0);

    const contar = (estado) => todas.filter((v) => v.estado === estado).length;
    const estados = repartoPorcentual([
        { etiqueta: 'Confirmadas', valor: contar('confirmada') },
        { etiqueta: 'Pendientes de pago', valor: contar('pendiente') },
        { etiqueta: 'Rechazadas o vencidas', valor: contar('rechazada') },
    ]);

    const porLote = new Map();
    const porMetodo = new Map();
    for (const v of confirmadas) {
        const lote = v.loteNombre || 'Sin lote';
        const dato = porLote.get(lote) || { entradas: 0, dinero: 0 };
        dato.entradas += aNumero(v.cantidad);
        // Lo que vale la entrada (sin costo de servicio), igual que ingresoDeVenta de ventas-utils.js
        dato.dinero += typeof v.subtotal === 'number' && Number.isFinite(v.subtotal) ? v.subtotal : aNumero(v.monto_total);
        porLote.set(lote, dato);
        const clave = (typeof claveDe === 'function' ? claveDe(v.metodo_pago) : v.metodo_pago) || 'Desconocido';
        porMetodo.set(clave, (porMetodo.get(clave) || 0) + 1);
    }
    const lotes = repartoPorcentual([...porLote].map(([etiqueta, d]) => ({ etiqueta, valor: d.entradas, detalle: `${d.entradas} ${d.entradas === 1 ? 'entrada' : 'entradas'}` })));
    const recaudacion = repartoPorcentual([...porLote].map(([etiqueta, d]) => ({ etiqueta, valor: d.dinero, detalle: dinero(d.dinero) })));
    const metodos = repartoPorcentual([...porMetodo].map(([clave, cantidad]) => ({
        etiqueta: typeof nombreDe === 'function' ? nombreDe(clave) : clave, valor: cantidad, detalle: `${cantidad} ${cantidad === 1 ? 'compra' : 'compras'}`
    })));

    return {
        ocupacion: { porcentaje: porcentaje(entradas, capacidad), vendidas: entradas, capacidad },
        estados, lotes, recaudacion, metodos,
        hayVentas: todas.length > 0,
    };
}
