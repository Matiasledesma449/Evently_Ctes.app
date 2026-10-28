// Finanzas del superadmin (cambio ajustes-tras-vista-previa-3): balance por período y liquidaciones a las productoras.
// Funciones puras: sin red ni base de datos. Todo sale de las ventas CONFIRMADAS.
// A pagar a la productora = lo que vale la entrada (subtotal). El costo de servicio lo paga el comprador aparte y es de Evently.

const aNumero = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const confirmada = (v) => v && v.estado === 'confirmada';

// Lo que cobra la productora por una venta (sin el costo de servicio)
export function aPagarDeVenta(v) {
    if (!v) return 0;
    if (typeof v.subtotal === 'number' && Number.isFinite(v.subtotal)) return v.subtotal;
    return aNumero(v.monto_total); // ventas viejas: no tenían costo de servicio
}
// Lo que cobra Evently por una venta (el costo de servicio)
export function servicioDeVenta(v) {
    const c = v ? aNumero(v.costo_servicio) : 0;
    return c > 0 ? c : 0;
}

// Milisegundos de la venta: cuándo se confirmó (o cuándo se creó, en ventas viejas)
export function msDeVenta(v) {
    for (const f of [v && v.fechaConfirmacion, v && v.fecha]) {
        if (!f) continue;
        if (typeof f === 'number') return f;
        if (f instanceof Date) return f.getTime();
        if (typeof f.toMillis === 'function') return f.toMillis();
        if (typeof f.seconds === 'number') return f.seconds * 1000;
    }
    return null;
}

// Argentina no tiene horario de verano: es UTC-3 todo el año
const enArgentina = (ms) => new Date(ms - 3 * 3600 * 1000);
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Los tipos de período y cuántos se muestran hacia atrás
export const PERIODOS = {
    semana: { titulo: 'Por semana (últimas 12)', cantidad: 12 },
    mes: { titulo: 'Por mes (últimos 12)', cantidad: 12 },
    trimestre: { titulo: 'Por trimestre (últimos 8)', cantidad: 8 },
    semestre: { titulo: 'Por semestre (últimos 6)', cantidad: 6 },
    anio: { titulo: 'Por año (últimos 5)', cantidad: 5 },
};

// La clave y la etiqueta del período de una fecha (en Argentina)
export function periodoDe(ms, tipo) {
    const d = enArgentina(ms);
    const y = d.getUTCFullYear(), m = d.getUTCMonth();
    if (tipo === 'semana') {
        // Semana que empieza el lunes
        const lunes = new Date(Date.UTC(y, m, d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
        const dd = String(lunes.getUTCDate()).padStart(2, '0'), mm = String(lunes.getUTCMonth() + 1).padStart(2, '0');
        return { clave: `${lunes.getUTCFullYear()}-${mm}-${dd}`, etiqueta: `${dd}/${mm}` };
    }
    if (tipo === 'mes') return { clave: `${y}-${String(m + 1).padStart(2, '0')}`, etiqueta: `${MESES[m]} ${String(y).slice(2)}` };
    if (tipo === 'trimestre') { const t = Math.floor(m / 3) + 1; return { clave: `${y}-T${t}`, etiqueta: `T${t} ${y}` }; }
    if (tipo === 'semestre') { const s = m < 6 ? 1 : 2; return { clave: `${y}-S${s}`, etiqueta: `${s}º sem ${y}` }; }
    return { clave: String(y), etiqueta: String(y) };
}

// Los últimos N períodos hasta `ahora` (del más viejo al más nuevo), aunque no tengan ventas
export function ultimosPeriodos(tipo, ahora) {
    const cantidad = (PERIODOS[tipo] || PERIODOS.mes).cantidad;
    const d = enArgentina(ahora);
    const lista = [];
    for (let i = cantidad - 1; i >= 0; i--) {
        let fecha;
        if (tipo === 'semana') fecha = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 7 * i);
        else if (tipo === 'mes') fecha = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 15);
        else if (tipo === 'trimestre') fecha = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 3 * i, 15);
        else if (tipo === 'semestre') fecha = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 6 * i, 15);
        else fecha = Date.UTC(d.getUTCFullYear() - i, 5, 15);
        lista.push(periodoDe(fecha + 3 * 3600 * 1000, tipo));
    }
    return lista;
}

// Balance por período: { clave, etiqueta, aPagar, servicio, total, entradas, ventas } de cada período
export function balancePorPeriodo(ventas, tipo, ahora = Date.now()) {
    const periodos = ultimosPeriodos(tipo, ahora).map((p) => ({ ...p, aPagar: 0, servicio: 0, total: 0, entradas: 0, ventas: 0 }));
    const porClave = new Map(periodos.map((p) => [p.clave, p]));
    for (const v of Array.isArray(ventas) ? ventas : []) {
        if (!confirmada(v)) continue;
        const ms = msDeVenta(v);
        if (ms === null) continue;
        const p = porClave.get(periodoDe(ms, tipo).clave);
        if (!p) continue; // fuera de la ventana que se muestra
        p.aPagar += aPagarDeVenta(v);
        p.servicio += servicioDeVenta(v);
        p.entradas += aNumero(v.cantidad);
        p.ventas += 1;
    }
    periodos.forEach((p) => { p.total = p.aPagar + p.servicio; });
    return periodos;
}

// Totales de un conjunto de ventas confirmadas
export function totales(ventas) {
    const t = { aPagar: 0, servicio: 0, total: 0, entradas: 0, ventas: 0 };
    for (const v of Array.isArray(ventas) ? ventas : []) {
        if (!confirmada(v)) continue;
        t.aPagar += aPagarDeVenta(v);
        t.servicio += servicioDeVenta(v);
        t.entradas += aNumero(v.cantidad);
        t.ventas += 1;
    }
    t.total = t.aPagar + t.servicio;
    return t;
}

// Liquidaciones: por organización, con el detalle por evento. Ordenadas de mayor a menor "a pagar".
// `eventos` traen su organizacionId; `organizaciones` su nombre. Los eventos sin organización van a "Sin organización".
export function liquidaciones(ventas, eventos, organizaciones) {
    const eventoPorId = new Map((Array.isArray(eventos) ? eventos : []).filter(Boolean).map((e) => [e.id, e]));
    const nombreOrg = new Map((Array.isArray(organizaciones) ? organizaciones : []).filter(Boolean).map((o) => [o.id, o.nombre || 'Sin nombre']));
    const porOrg = new Map();
    for (const v of Array.isArray(ventas) ? ventas : []) {
        if (!confirmada(v)) continue;
        const ev = eventoPorId.get(v.eventoId) || { id: v.eventoId, nombre: v.eventoNombre || 'Evento borrado' };
        const orgId = ev.organizacionId || '';
        if (!porOrg.has(orgId)) porOrg.set(orgId, { id: orgId, nombre: orgId ? (nombreOrg.get(orgId) || 'Organización borrada') : 'Sin organización', aPagar: 0, servicio: 0, entradas: 0, ventas: 0, eventos: new Map() });
        const org = porOrg.get(orgId);
        if (!org.eventos.has(ev.id)) org.eventos.set(ev.id, { id: ev.id, nombre: ev.nombre || 'Sin nombre', aPagar: 0, servicio: 0, entradas: 0, ventas: 0 });
        const fila = org.eventos.get(ev.id);
        for (const x of [org, fila]) {
            x.aPagar += aPagarDeVenta(v);
            x.servicio += servicioDeVenta(v);
            x.entradas += aNumero(v.cantidad);
            x.ventas += 1;
        }
    }
    return [...porOrg.values()]
        .map((o) => ({ ...o, eventos: [...o.eventos.values()].sort((a, b) => b.aPagar - a.aPagar) }))
        .sort((a, b) => b.aPagar - a.aPagar);
}

// Ventas de un rango [desde, hasta] (ms, ambos incluidos; null = sin límite)
export function ventasEntre(ventas, desde, hasta) {
    return (Array.isArray(ventas) ? ventas : []).filter((v) => {
        const ms = msDeVenta(v);
        if (ms === null) return desde === null && hasta === null;
        return (desde === null || ms >= desde) && (hasta === null || ms <= hasta);
    });
}
