// shared/resumen-visual.js
// El Resumen de un evento, en gráficos (pedido de la persona: "algo más visual", sin repetir las tarjetas de Reportes).
// La primera parte son funciones puras que arman los datos (se prueban con node: pruebas/47-resumen-visual.js);
// la segunda dibuja con SVG propio, createElement y textContent (sin librerías de gráficos y sin innerHTML).
// Todo sale de las ventas: las confirmadas para lo vendido y lo cobrado; "Estado de las compras" cuenta todas.

import { repartoPorcentual, porcentaje } from './porcentajes.js';

const aNumero = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
};
// Lo que vale la entrada (sin costo de servicio), igual que ingresoDeVenta de ventas-utils.js
const ingreso = (v) => (typeof v.subtotal === 'number' && Number.isFinite(v.subtotal) ? v.subtotal : aNumero(v.monto_total));

// Fecha de una venta como Date (Timestamp de Firestore, { seconds } o texto), o null
export function fechaDeVenta(venta) {
    const f = venta && venta.fecha;
    if (!f) return null;
    if (typeof f.toDate === 'function') return f.toDate();
    if (typeof f.seconds === 'number') return new Date(f.seconds * 1000);
    const d = new Date(f);
    return Number.isNaN(d.getTime()) ? null : d;
}

// Día ('AAAA-MM-DD') y hora (0-23) en Argentina, para agrupar
const ZONA = 'America/Argentina/Buenos_Aires';
export function diaEnArgentina(fecha) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}
export function horaEnArgentina(fecha) {
    return Number(new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', hourCycle: 'h23' }).format(fecha)) % 24;
}

// Suma un día a 'AAAA-MM-DD' (en UTC, así no lo mueve el horario de verano)
function diaSiguiente(dia) {
    const d = new Date(`${dia}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}

// Entradas y plata por día, sin huecos, desde el primer día con ventas hasta el último (como mucho los últimos 60)
export function ventasPorDia(confirmadas) {
    const porDia = new Map();
    for (const v of confirmadas) {
        const f = fechaDeVenta(v);
        if (!f) continue;
        const dia = diaEnArgentina(f);
        const dato = porDia.get(dia) || { entradas: 0, dinero: 0 };
        dato.entradas += aNumero(v.cantidad);
        dato.dinero += ingreso(v);
        porDia.set(dia, dato);
    }
    if (porDia.size === 0) return [];
    const dias = [...porDia.keys()].sort();
    const lista = [];
    for (let dia = dias[0]; dia <= dias[dias.length - 1]; dia = diaSiguiente(dia)) {
        const dato = porDia.get(dia) || { entradas: 0, dinero: 0 };
        lista.push({ dia, ...dato });
    }
    return lista.slice(-60);
}

// Lo que dibuja el Resumen de un evento. `claveDe` agrupa la forma de pago y `nombreDe` la muestra (shared/formas-de-pago.js).
export function datosDelResumen(evento, ventas, { claveDe = null, nombreDe = null } = {}) {
    const todas = (Array.isArray(ventas) ? ventas : []).filter((v) => v && typeof v === 'object');
    const confirmadas = todas.filter((v) => v.estado === 'confirmada');
    const lotesDelEvento = evento && Array.isArray(evento.lotes) ? evento.lotes.filter((l) => l && typeof l === 'object') : [];
    const capacidad = lotesDelEvento.reduce((s, l) => s + aNumero(l.disponibles), 0);
    const entradas = confirmadas.reduce((s, v) => s + aNumero(v.cantidad), 0);
    const recaudado = confirmadas.reduce((s, v) => s + ingreso(v), 0);

    // Cada lote: cuánto vendió de su capacidad y cuánto cobró (los lotes de las ventas que ya no existen, al final)
    const porLote = new Map(lotesDelEvento.map((l) => [l.nombre || 'Sin nombre', { nombre: l.nombre || 'Sin nombre', capacidad: aNumero(l.disponibles), vendidas: 0, dinero: 0 }]));
    const porMetodo = new Map();
    const porHora = Array.from({ length: 24 }, () => 0);
    for (const v of confirmadas) {
        const nombre = v.loteNombre || 'Sin lote';
        if (!porLote.has(nombre)) porLote.set(nombre, { nombre, capacidad: 0, vendidas: 0, dinero: 0 });
        const lote = porLote.get(nombre);
        lote.vendidas += aNumero(v.cantidad);
        lote.dinero += ingreso(v);
        const clave = (typeof claveDe === 'function' ? claveDe(v.metodo_pago) : v.metodo_pago) || 'Desconocido';
        porMetodo.set(clave, (porMetodo.get(clave) || 0) + 1);
        const f = fechaDeVenta(v);
        if (f) porHora[horaEnArgentina(f)] += 1;
    }
    const contar = (estado) => todas.filter((v) => v.estado === estado).length;

    return {
        recaudado,
        entradas,
        capacidad,
        compras: confirmadas.length,
        pendientes: contar('pendiente'),
        ocupacion: porcentaje(entradas, capacidad),
        lotes: [...porLote.values()].map((l) => ({ ...l, porcentaje: porcentaje(l.vendidas, l.capacidad) })),
        metodos: repartoPorcentual([...porMetodo].map(([clave, cantidad]) => ({ etiqueta: typeof nombreDe === 'function' ? nombreDe(clave) : clave, valor: cantidad }))),
        estados: [
            { etiqueta: 'Confirmadas', valor: contar('confirmada'), color: '#10b981' },
            { etiqueta: 'Pendientes de pago', valor: contar('pendiente'), color: '#f59e0b' },
            { etiqueta: 'Rechazadas o vencidas', valor: contar('rechazada'), color: '#e11d48' },
        ].map((e) => ({ ...e, porcentaje: porcentaje(e.valor, todas.length) })),
        porDia: ventasPorDia(confirmadas),
        porHora,
        hayVentas: confirmadas.length > 0,
    };
}

// ---------- Dibujo (navegador) ----------
// Colores por categoría en orden fijo (validados para daltonismo); del sexto en adelante se juntan en "Otros", en gris
const COLORES = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#e11d48'];
const GRIS = '#94a3b8';
const SVG = 'http://www.w3.org/2000/svg';
const pct = (p) => `${String(p).replace('.', ',')}%`;
const numero = (n) => Math.round(n).toLocaleString('es-AR');

function crear(tag, clase, texto) {
    const e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
}
function svg(tag, atributos = {}) {
    const e = document.createElementNS(SVG, tag);
    Object.entries(atributos).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e;
}

function tarjeta(titulo, ayuda, clase = '') {
    const caja = crear('section', `bg-white rounded-2xl border border-gray-200 p-5 flex flex-col relative ${clase}`);
    const cabeza = crear('div', 'mb-3');
    cabeza.append(crear('h3', 'text-sm font-semibold text-gray-800', titulo));
    if (ayuda) cabeza.append(crear('p', 'text-xs text-gray-500 mt-0.5', ayuda));
    caja.append(cabeza);
    return caja;
}
const vacio = (texto) => crear('p', 'text-sm text-gray-400 flex-1 flex items-center justify-center py-10 text-center', texto);

// Cartelito que sigue al mouse dentro de una tarjeta (texto plano)
function crearTooltip(caja) {
    const t = crear('div', 'pointer-events-none absolute z-10 hidden rounded-lg bg-gray-900 text-white text-xs px-2.5 py-1.5 shadow-lg whitespace-nowrap');
    caja.append(t);
    return {
        mostrar(lineas, x, y) {
            t.replaceChildren(...lineas.map((l, i) => crear('div', i === 0 ? 'font-semibold' : 'text-gray-300', l)));
            t.classList.remove('hidden');
            const ancho = caja.clientWidth;
            t.style.left = `${Math.min(Math.max(8, x - t.offsetWidth / 2), ancho - t.offsetWidth - 8)}px`;
            t.style.top = `${Math.max(4, y - t.offsetHeight - 10)}px`;
        },
        ocultar() { t.classList.add('hidden'); },
    };
}
// Posición del mouse relativa a la tarjeta
const enCaja = (caja, e) => { const r = caja.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

// Tiras de números de arriba (pocas y distintas de las tarjetas de Reportes)
function cifra(icono, titulo, valor, detalle, color = 'text-gray-900') {
    const caja = crear('div', 'bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4');
    const circulo = crear('span', 'w-11 h-11 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0');
    circulo.append(crear('span', 'material-symbols-outlined', icono));
    const textos = crear('div', 'min-w-0');
    textos.append(crear('p', 'text-xs text-gray-500', titulo), crear('p', `text-2xl font-bold tabular-nums leading-tight ${color}`, valor));
    if (detalle) textos.append(crear('p', 'text-xs text-gray-400 truncate', detalle));
    caja.append(circulo, textos);
    return caja;
}

// Anillo: un arco por parte (con 2px de separación) y el texto grande en el centro
function anillo(partes, centro, subtitulo, etiqueta) {
    const r = 54;
    const largo = 2 * Math.PI * r;
    const dibujo = svg('svg', { viewBox: '0 0 140 140', class: 'w-40 h-40', role: 'img', 'aria-label': etiqueta });
    dibujo.append(svg('circle', { cx: 70, cy: 70, r, fill: 'none', stroke: '#f1f5f9', 'stroke-width': 14 }));
    const total = partes.reduce((s, p) => s + p.valor, 0);
    let inicio = 0;
    if (total > 0) {
        partes.forEach((p) => {
            const tramo = (p.valor / total) * largo;
            const separacion = partes.length > 1 ? Math.min(2, tramo / 2) : 0;
            dibujo.append(svg('circle', {
                cx: 70, cy: 70, r, fill: 'none', stroke: p.color, 'stroke-width': 14,
                'stroke-dasharray': `${Math.max(0, tramo - separacion)} ${largo}`, 'stroke-dashoffset': -inicio, transform: 'rotate(-90 70 70)',
            }));
            inicio += tramo;
        });
    }
    const t1 = svg('text', { x: 70, y: subtitulo ? 72 : 78, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 700, fill: '#111827' });
    t1.textContent = centro;
    dibujo.append(t1);
    if (subtitulo) {
        const t2 = svg('text', { x: 70, y: 92, 'text-anchor': 'middle', 'font-size': 11, fill: '#6b7280' });
        t2.textContent = subtitulo;
        dibujo.append(t2);
    }
    return dibujo;
}

// Leyenda: punto de color + nombre + porcentaje (el texto va en gris oscuro, nunca del color de la serie)
function leyenda(items) {
    const lista = crear('ul', 'space-y-2 text-sm min-w-0');
    items.forEach((i) => {
        const fila = crear('li', 'flex items-center gap-2 min-w-0');
        const punto = crear('span', 'w-2.5 h-2.5 rounded-full flex-shrink-0');
        punto.style.background = i.color;
        fila.append(punto, crear('span', 'text-gray-700 truncate flex-1', i.etiqueta), crear('span', 'font-semibold text-gray-900 tabular-nums', pct(i.porcentaje)));
        if (i.detalle) fila.append(crear('span', 'text-xs text-gray-400 tabular-nums', i.detalle));
        lista.append(fila);
    });
    return lista;
}

// Gráfico de área: x = días, y = entradas vendidas. Con línea vertical y cartelito al pasar el mouse.
function graficoPorDia(caja, dias, dinero) {
    const ancho = 640, alto = 220, izq = 34, der = 10, arriba = 12, abajo = 26;
    const maximo = Math.max(1, ...dias.map((d) => d.entradas));
    const paso = Math.max(1, Math.ceil(maximo / 4));
    const tope = paso * 4;
    const x = (i) => izq + (dias.length === 1 ? (ancho - izq - der) / 2 : (i / (dias.length - 1)) * (ancho - izq - der));
    const y = (v) => arriba + (1 - v / tope) * (alto - arriba - abajo);
    const dibujo = svg('svg', { viewBox: `0 0 ${ancho} ${alto}`, class: 'w-full h-56', role: 'img', 'aria-label': 'Entradas vendidas por día' });
    // Grilla horizontal suave con sus valores
    for (let v = 0; v <= tope; v += paso) {
        dibujo.append(svg('line', { x1: izq, x2: ancho - der, y1: y(v), y2: y(v), stroke: '#eef0f3', 'stroke-width': 1 }));
        const t = svg('text', { x: izq - 6, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 10, fill: '#9ca3af' });
        t.textContent = String(v);
        dibujo.append(t);
    }
    // Fechas abajo: la primera, la última y algunas en el medio
    const cada = Math.max(1, Math.ceil(dias.length / 6));
    dias.forEach((d, i) => {
        if (i % cada !== 0 && i !== dias.length - 1) return;
        // La última fecha se alinea a la derecha para que no se corte
        const t = svg('text', { x: x(i), y: alto - 6, 'text-anchor': i === dias.length - 1 && dias.length > 1 ? 'end' : i === 0 && dias.length > 1 ? 'start' : 'middle', 'font-size': 10, fill: '#9ca3af' });
        t.textContent = `${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}`;
        dibujo.append(t);
    });
    const puntos = dias.map((d, i) => `${x(i)},${y(d.entradas)}`);
    const degradado = svg('linearGradient', { id: 'relleno-por-dia', x1: 0, x2: 0, y1: 0, y2: 1 });
    degradado.append(svg('stop', { offset: '0%', 'stop-color': '#7c3aed', 'stop-opacity': 0.28 }), svg('stop', { offset: '100%', 'stop-color': '#7c3aed', 'stop-opacity': 0.02 }));
    const defs = svg('defs');
    defs.append(degradado);
    dibujo.append(defs);
    if (dias.length > 1) {
        dibujo.append(svg('polygon', { points: `${x(0)},${y(0)} ${puntos.join(' ')} ${x(dias.length - 1)},${y(0)}`, fill: 'url(#relleno-por-dia)' }));
        dibujo.append(svg('polyline', { points: puntos.join(' '), fill: 'none', stroke: '#7c3aed', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    } else {
        dibujo.append(svg('circle', { cx: x(0), cy: y(dias[0].entradas), r: 5, fill: '#7c3aed' }));
    }
    // Capa de mouse: línea vertical, punto y cartelito
    const guia = svg('line', { y1: arriba, y2: alto - abajo, stroke: '#c4b5fd', 'stroke-width': 1, visibility: 'hidden' });
    const marca = svg('circle', { r: 5, fill: '#7c3aed', stroke: '#fff', 'stroke-width': 2, visibility: 'hidden' });
    const zona = svg('rect', { x: izq, y: 0, width: ancho - izq - der, height: alto, fill: 'transparent' });
    dibujo.append(guia, marca, zona);
    const tip = crearTooltip(caja);
    zona.addEventListener('mousemove', (e) => {
        const r = dibujo.getBoundingClientRect();
        const xv = ((e.clientX - r.left) / r.width) * ancho;
        const i = dias.length === 1 ? 0 : Math.round(((xv - izq) / (ancho - izq - der)) * (dias.length - 1));
        const d = dias[Math.min(Math.max(i, 0), dias.length - 1)];
        const ix = dias.indexOf(d);
        guia.setAttribute('x1', x(ix)); guia.setAttribute('x2', x(ix)); guia.setAttribute('visibility', 'visible');
        marca.setAttribute('cx', x(ix)); marca.setAttribute('cy', y(d.entradas)); marca.setAttribute('visibility', 'visible');
        const [cx, cy] = enCaja(caja, { clientX: r.left + (x(ix) / ancho) * r.width, clientY: r.top + (y(d.entradas) / alto) * r.height });
        tip.mostrar([`${d.dia.slice(8, 10)}/${d.dia.slice(5, 7)}/${d.dia.slice(0, 4)}`, `${numero(d.entradas)} ${d.entradas === 1 ? 'entrada' : 'entradas'}`, dinero(d.dinero)], cx, cy);
    });
    zona.addEventListener('mouseleave', () => { guia.setAttribute('visibility', 'hidden'); marca.setAttribute('visibility', 'hidden'); tip.ocultar(); });
    return dibujo;
}

// Columnas por hora del día (0 a 23), con cartelito por columna
function graficoPorHora(caja, horas) {
    const ancho = 640, alto = 200, izq = 8, der = 8, arriba = 10, abajo = 24;
    const maximo = Math.max(1, ...horas);
    const columna = (ancho - izq - der) / 24;
    const dibujo = svg('svg', { viewBox: `0 0 ${ancho} ${alto}`, class: 'w-full h-48', role: 'img', 'aria-label': 'Compras por hora del día' });
    dibujo.append(svg('line', { x1: izq, x2: ancho - der, y1: alto - abajo, y2: alto - abajo, stroke: '#e5e7eb', 'stroke-width': 1 }));
    const mejor = horas.indexOf(Math.max(...horas));
    const tip = crearTooltip(caja);
    horas.forEach((cantidad, h) => {
        const altoBarra = (cantidad / maximo) * (alto - arriba - abajo);
        const bx = izq + h * columna + 2;
        const by = alto - abajo - altoBarra;
        if (cantidad > 0) {
            // Columna con la punta redondeada y la base recta, apoyada en el eje
            const radio = Math.min(4, altoBarra, (columna - 4) / 2);
            const w = columna - 4;
            dibujo.append(svg('path', {
                d: `M${bx},${alto - abajo} V${by + radio} Q${bx},${by} ${bx + radio},${by} H${bx + w - radio} Q${bx + w},${by} ${bx + w},${by + radio} V${alto - abajo} Z`,
                fill: h === mejor ? '#7c3aed' : '#c4b5fd',
            }));
        }
        if (h % 3 === 0) {
            const t = svg('text', { x: izq + h * columna + columna / 2, y: alto - 7, 'text-anchor': 'middle', 'font-size': 10, fill: '#9ca3af' });
            t.textContent = `${String(h).padStart(2, '0')}h`;
            dibujo.append(t);
        }
        // Zona de mouse más grande que la columna
        const zona = svg('rect', { x: izq + h * columna, y: 0, width: columna, height: alto - abajo, fill: 'transparent' });
        zona.addEventListener('mousemove', (e) => {
            const [cx, cy] = enCaja(caja, e);
            tip.mostrar([`De ${String(h).padStart(2, '0')}:00 a ${String((h + 1) % 24).padStart(2, '0')}:00`, `${cantidad} ${cantidad === 1 ? 'compra' : 'compras'}`], cx, cy);
        });
        zona.addEventListener('mouseleave', () => tip.ocultar());
        dibujo.append(zona);
    });
    return { dibujo, mejor: horas[mejor] > 0 ? mejor : -1 };
}

// Cada lote: barra de lo vendido sobre su capacidad, con el % y la plata
function barrasDeLotes(lotes, dinero) {
    const lista = crear('ul', 'space-y-4');
    lotes.forEach((l, i) => {
        const fila = crear('li');
        const arriba = crear('div', 'flex items-baseline justify-between gap-3 text-sm');
        const nombre = crear('span', 'flex items-center gap-2 min-w-0');
        const punto = crear('span', 'w-2.5 h-2.5 rounded-full flex-shrink-0');
        punto.style.background = i < COLORES.length ? COLORES[i] : GRIS;
        nombre.append(punto, crear('span', 'text-gray-800 font-medium truncate', l.nombre));
        arriba.append(nombre, crear('span', 'font-semibold text-gray-900 tabular-nums', l.capacidad > 0 ? pct(l.porcentaje) : '—'));
        const pista = crear('div', 'mt-1.5 h-3 rounded-full bg-gray-100 overflow-hidden');
        const relleno = crear('div', 'h-full rounded-full');
        relleno.style.width = `${Math.min(100, l.capacidad > 0 ? Math.max(l.porcentaje, l.vendidas > 0 ? 2 : 0) : 0)}%`;
        relleno.style.background = i < COLORES.length ? COLORES[i] : GRIS;
        pista.append(relleno);
        const abajo = crear('p', 'text-xs text-gray-500 mt-1 tabular-nums',
            `${numero(l.vendidas)}${l.capacidad > 0 ? ` de ${numero(l.capacidad)}` : ''} entradas · ${dinero(l.dinero)}`);
        fila.append(arriba, pista, abajo);
        lista.append(fila);
    });
    return lista;
}

// Barra apilada al 100% (estado de las compras), con 2px de separación entre tramos
function barraApilada(partes) {
    const barra = crear('div', 'flex h-4 rounded-full overflow-hidden gap-[2px] bg-white');
    partes.filter((p) => p.valor > 0).forEach((p) => {
        const tramo = crear('div', 'h-full');
        tramo.style.width = `${p.porcentaje}%`;
        tramo.style.background = p.color;
        tramo.title = `${p.etiqueta}: ${p.valor} (${pct(p.porcentaje)})`;
        barra.append(tramo);
    });
    return barra;
}

// Dibuja el Resumen completo en el contenedor (lo reemplaza). datos = datosDelResumen(...) o null mientras carga.
export function dibujarResumenVisual(contenedor, datos, { dinero = (n) => '$' + numero(n) } = {}) {
    if (!contenedor) return;
    contenedor.textContent = '';
    if (!datos) {
        contenedor.append(crear('p', 'text-sm text-gray-400 py-10 text-center', 'Cargando el resumen…'));
        return;
    }
    // 1. Cifras de arriba
    const cifras = crear('div', 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4');
    cifras.append(
        cifra('payments', 'Recaudado', dinero(datos.recaudado), 'Solo lo confirmado', 'text-violet-700'),
        cifra('confirmation_number', 'Entradas vendidas', numero(datos.entradas), datos.capacidad ? `de ${numero(datos.capacidad)} de capacidad` : ''),
        cifra('shopping_bag', 'Compras confirmadas', numero(datos.compras), datos.compras ? `${String(Math.round((datos.entradas / datos.compras) * 10) / 10).replace('.', ',')} por compra` : ''),
        cifra('hourglass_top', 'Pagos en curso', numero(datos.pendientes), 'Todavía no suman', 'text-amber-600'));

    // 2. Ocupación + ventas por día
    const fila1 = crear('div', 'grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4');
    const ocupacion = tarjeta('Ocupación', 'Entradas vendidas sobre la capacidad');
    const centro = crear('div', 'flex-1 flex flex-col items-center justify-center');
    centro.append(anillo([{ valor: datos.entradas, color: '#7c3aed' }, { valor: Math.max(0, datos.capacidad - datos.entradas), color: '#ede9fe' }],
        pct(datos.ocupacion), 'vendido', `Ocupación ${pct(datos.ocupacion)}`));
    centro.append(crear('p', 'text-sm text-gray-600 mt-3 tabular-nums', `${numero(datos.entradas)} de ${numero(datos.capacidad)} entradas`));
    centro.append(crear('p', 'text-xs text-gray-400 tabular-nums', `Quedan ${numero(Math.max(0, datos.capacidad - datos.entradas))}`));
    ocupacion.append(centro);
    const porDia = tarjeta('Ventas por día', 'Entradas vendidas cada día. Pasá el mouse para ver el detalle.', 'lg:col-span-2');
    porDia.append(datos.porDia.length ? graficoPorDia(porDia, datos.porDia, dinero) : vacio('Cuando haya ventas confirmadas, acá vas a ver cómo se venden día a día.'));
    fila1.append(ocupacion, porDia);

    // 3. Lotes + formas de pago + estado de las compras
    const fila2 = crear('div', 'grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4');
    const lotes = tarjeta('Cómo va cada lote', 'Vendido sobre su capacidad');
    lotes.append(datos.lotes.length ? barrasDeLotes(datos.lotes, dinero) : vacio('Este evento no tiene lotes.'));
    const metodos = tarjeta('Formas de pago', 'Cómo pagaron las compras confirmadas');
    if (datos.metodos.length) {
        // Hasta 5 con color propio; el resto juntos en "Otros"
        const principales = datos.metodos.slice(0, COLORES.length).map((m, i) => ({ ...m, color: COLORES[i] }));
        const resto = datos.metodos.slice(COLORES.length);
        if (resto.length) principales.push({ etiqueta: 'Otros', valor: resto.reduce((s, m) => s + m.valor, 0), porcentaje: Math.round(resto.reduce((s, m) => s + m.porcentaje, 0) * 10) / 10, color: GRIS });
        const cuerpo = crear('div', 'flex-1 flex flex-col items-center gap-4');
        cuerpo.append(anillo(principales, numero(datos.compras), datos.compras === 1 ? 'compra' : 'compras', 'Formas de pago'), leyenda(principales));
        cuerpo.lastChild.classList.add('w-full');
        metodos.append(cuerpo);
    } else metodos.append(vacio('Todavía no hay compras confirmadas.'));
    const estados = tarjeta('Estado de las compras', 'Todas las compras que se empezaron');
    const totalCompras = datos.estados.reduce((s, e) => s + e.valor, 0);
    if (totalCompras) {
        const cuerpo = crear('div', 'flex-1 flex flex-col justify-center gap-5');
        const grande = crear('div');
        grande.append(crear('p', 'text-4xl font-bold text-gray-900 tabular-nums', pct(datos.estados[0].porcentaje)),
            crear('p', 'text-sm text-gray-500', 'de las compras se confirmaron'));
        cuerpo.append(grande, barraApilada(datos.estados), leyenda(datos.estados.map((e) => ({ ...e, detalle: numero(e.valor) }))));
        estados.append(cuerpo);
    } else estados.append(vacio('Todavía nadie empezó una compra.'));
    fila2.append(lotes, metodos, estados);

    // 4. Horario de compras
    const horario = tarjeta('¿A qué hora compran?', 'Compras confirmadas según la hora del día (hora de Argentina)', 'mt-4');
    if (datos.hayVentas) {
        const { dibujo, mejor } = graficoPorHora(horario, datos.porHora);
        if (mejor >= 0) horario.querySelector('p').textContent = `La hora con más compras es de ${String(mejor).padStart(2, '0')}:00 a ${String((mejor + 1) % 24).padStart(2, '0')}:00. Pasá el mouse por cada columna.`;
        horario.append(dibujo);
    } else horario.append(vacio('Cuando haya ventas confirmadas, acá vas a ver en qué horario compra la gente.'));

    contenedor.append(cifras, fila1, fila2, horario);
}
