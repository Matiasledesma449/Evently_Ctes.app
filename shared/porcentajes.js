// shared/porcentajes.js
// Porcentajes claros para Resumen y Reportes (pedido 17): ocupación, estado de las ventas, entradas por lote,
// recaudación por lote y formas de pago. Salen de las mismas ventas confirmadas que las tarjetas (no de los
// contadores `vendidas` de los lotes).
// La primera parte son funciones puras (se prueban con node); la segunda dibuja con createElement y textContent.

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

// ---------- Dibujo (navegador) ----------
const COLORES = ['#7c3aed', '#a78bfa', '#c026d3', '#f59e0b', '#10b981', '#64748b'];
const SVG = 'http://www.w3.org/2000/svg';
const formatoPorcentaje = (p) => `${String(p).replace('.', ',')}%`;

function crear(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
}

function tarjeta(titulo, ayuda) {
    const caja = crear('section', 'bg-white rounded-xl border border-gray-200 p-5 flex flex-col');
    caja.append(crear('h3', 'text-sm font-semibold text-gray-800', titulo));
    if (ayuda) caja.append(crear('p', 'text-xs text-gray-500 mt-0.5', ayuda));
    return caja;
}

// Anillo con el porcentaje en el centro (ocupación)
function dona(p) {
    const r = 52;
    const largo = 2 * Math.PI * r;
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 140 140');
    svg.setAttribute('class', 'w-36 h-36');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Ocupación ${formatoPorcentaje(p)}`);
    const fondo = document.createElementNS(SVG, 'circle');
    const arco = document.createElementNS(SVG, 'circle');
    [fondo, arco].forEach((c) => {
        c.setAttribute('cx', '70'); c.setAttribute('cy', '70'); c.setAttribute('r', String(r));
        c.setAttribute('fill', 'none'); c.setAttribute('stroke-width', '16');
    });
    fondo.setAttribute('stroke', '#ede9fe');
    arco.setAttribute('stroke', '#7c3aed');
    arco.setAttribute('stroke-linecap', 'round');
    arco.setAttribute('stroke-dasharray', `${(Math.min(p, 100) / 100) * largo} ${largo}`);
    arco.setAttribute('transform', 'rotate(-90 70 70)');
    const texto = document.createElementNS(SVG, 'text');
    texto.setAttribute('x', '70'); texto.setAttribute('y', '77'); texto.setAttribute('text-anchor', 'middle');
    texto.setAttribute('class', 'fill-gray-900'); texto.setAttribute('font-size', '24'); texto.setAttribute('font-weight', '700');
    texto.textContent = formatoPorcentaje(p);
    svg.append(fondo, arco, texto);
    return svg;
}

// Barras horizontales con su porcentaje, una por ítem
function barras(items, vacio) {
    const lista = crear('ul', 'mt-4 space-y-3');
    if (items.length === 0) {
        lista.append(crear('li', 'text-sm text-gray-400', vacio));
        return lista;
    }
    items.forEach((item, i) => {
        const fila = crear('li');
        const arriba = crear('div', 'flex items-baseline justify-between gap-3 text-sm');
        arriba.append(crear('span', 'text-gray-700 truncate', item.etiqueta), crear('span', 'font-semibold text-gray-900 tabular-nums', formatoPorcentaje(item.porcentaje)));
        const pista = crear('div', 'mt-1 h-2.5 rounded-full bg-gray-100 overflow-hidden');
        const relleno = crear('div', 'h-full rounded-full');
        relleno.style.width = `${Math.max(item.porcentaje, 1.5)}%`;
        relleno.style.background = COLORES[i % COLORES.length];
        pista.append(relleno);
        fila.append(arriba, pista);
        if (item.detalle) fila.append(crear('p', 'text-xs text-gray-500 mt-0.5', item.detalle));
        lista.append(fila);
    });
    return lista;
}

// Dibuja el panel completo en el contenedor (lo reemplaza). datos = porcentajesDelEvento(...) o null mientras carga.
export function dibujarPanelPorcentajes(contenedor, datos) {
    if (!contenedor) return;
    contenedor.textContent = '';
    contenedor.className = 'mt-6';
    const titulo = crear('div', 'mb-3');
    titulo.append(crear('h2', 'text-lg font-bold text-gray-800', 'En porcentajes'), crear('p', 'text-sm text-gray-500', 'Cómo se reparten las ventas. Solo cuentan las confirmadas, salvo en "Estado de las compras".'));
    const grilla = crear('div', 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4');
    contenedor.append(titulo, grilla);
    if (!datos) {
        grilla.append(crear('p', 'text-sm text-gray-400', 'Cargando…'));
        return;
    }
    const ocupacion = tarjeta('Ocupación', 'Entradas vendidas sobre la capacidad total');
    const centro = crear('div', 'flex flex-col items-center mt-3');
    centro.append(dona(datos.ocupacion.porcentaje), crear('p', 'text-sm text-gray-600 mt-2 tabular-nums',
        `${datos.ocupacion.vendidas.toLocaleString('es-AR')} de ${datos.ocupacion.capacidad.toLocaleString('es-AR')} entradas`));
    ocupacion.append(centro);

    const estados = tarjeta('Estado de las compras', 'Todas las compras iniciadas, por cómo terminaron');
    estados.append(barras(datos.estados, 'Todavía no hay compras.'));
    const lotes = tarjeta('Entradas por lote', 'Qué parte de las entradas vendidas es de cada lote');
    lotes.append(barras(datos.lotes, 'Todavía no hay entradas vendidas.'));
    const recaudacion = tarjeta('Recaudación por lote', 'Qué parte de la plata cobrada viene de cada lote');
    recaudacion.append(barras(datos.recaudacion, 'Todavía no hay recaudación.'));
    const metodos = tarjeta('Formas de pago', 'Cómo pagaron las compras confirmadas');
    metodos.append(barras(datos.metodos, 'Todavía no hay compras confirmadas.'));
    grilla.append(ocupacion, estados, lotes, recaudacion, metodos);
}
