// Gráfico de barras en SVG, sin librerías (cambio ajustes-tras-vista-previa-3).
// Una sola serie (un solo color violeta), eje recesivo, barras con la punta redondeada y un recuadro al pasar el mouse
// o al enfocar con el teclado. Los textos se ponen con textContent (nunca HTML).

const NS = 'http://www.w3.org/2000/svg';
const VIOLETA = '#7c3aed';
const VIOLETA_ACTIVO = '#5b21b6';
const GRILLA = '#ece9f3';
const TINTA_SECUNDARIA = '#6b7280';

const svg = (etiqueta, atributos = {}) => {
    const e = document.createElementNS(NS, etiqueta);
    Object.entries(atributos).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e;
};

// Un número "redondo" para el tope del eje (1, 2 o 5 por una potencia de 10)
export function topeDelEje(maximo) {
    if (!(maximo > 0)) return 1;
    const potencia = Math.pow(10, Math.floor(Math.log10(maximo)));
    for (const paso of [1, 2, 5, 10]) if (paso * potencia >= maximo) return paso * potencia;
    return 10 * potencia;
}

// Rectángulo con las dos esquinas de arriba redondeadas (la base queda recta, apoyada en el eje)
function barra(x, y, ancho, alto, radio) {
    const r = Math.min(radio, ancho / 2, alto);
    return `M${x},${y + alto} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + ancho - r},${y} Q${x + ancho},${y} ${x + ancho},${y + r} L${x + ancho},${y + alto} Z`;
}

// Dibuja barras verticales. `datos`: [{ etiqueta, valor, detalle: [[texto, valorFormateado], ...] }]
// `formato(n)` arma el texto de un monto. Devuelve el elemento (un div con el SVG y el recuadro).
export function dibujarBarras(contenedor, datos, { formato = String, titulo = '', alto = 260 } = {}) {
    contenedor.textContent = '';
    const caja = document.createElement('div');
    caja.className = 'relative';
    const ancho = Math.max(320, contenedor.clientWidth || 640);
    const margen = { arriba: 12, derecha: 8, abajo: 28, izquierda: 64 };
    const anchoUtil = ancho - margen.izquierda - margen.derecha;
    const altoUtil = alto - margen.arriba - margen.abajo;
    const tope = topeDelEje(Math.max(0, ...datos.map((d) => d.valor)));
    const dibujo = svg('svg', { viewBox: `0 0 ${ancho} ${alto}`, width: '100%', height: alto, role: 'img', 'aria-label': titulo });

    // Grilla y eje (recesivos): 4 marcas
    for (let i = 0; i <= 4; i++) {
        const y = margen.arriba + altoUtil - (altoUtil * i) / 4;
        dibujo.appendChild(svg('line', { x1: margen.izquierda, x2: ancho - margen.derecha, y1: y, y2: y, stroke: i === 0 ? '#d4d0dd' : GRILLA, 'stroke-width': 1 }));
        const marca = svg('text', { x: margen.izquierda - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: TINTA_SECUNDARIA });
        marca.textContent = formato((tope * i) / 4);
        dibujo.appendChild(marca);
    }

    const tooltip = document.createElement('div');
    tooltip.className = 'hidden absolute z-10 pointer-events-none bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs text-gray-700 min-w-[210px]';
    tooltip.setAttribute('role', 'status');

    const paso = anchoUtil / Math.max(1, datos.length);
    const anchoBarra = Math.max(4, Math.min(48, paso - 6)); // 2px de aire de cada lado como mínimo
    const cadaCuantasEtiquetas = Math.ceil(datos.length / Math.max(1, Math.floor(anchoUtil / 56)));
    datos.forEach((d, i) => {
        const centro = margen.izquierda + paso * i + paso / 2;
        const altoBarra = tope > 0 ? (altoUtil * Math.max(0, d.valor)) / tope : 0;
        const y = margen.arriba + altoUtil - altoBarra;
        const grupo = svg('g', { tabindex: 0, role: 'listitem', 'aria-label': `${d.etiqueta}: ${formato(d.valor)}` });
        // Zona de toque más grande que la barra
        grupo.appendChild(svg('rect', { x: centro - paso / 2, y: margen.arriba, width: paso, height: altoUtil, fill: 'transparent' }));
        const forma = svg('path', { d: altoBarra > 0 ? barra(centro - anchoBarra / 2, y, anchoBarra, altoBarra, 4) : '', fill: VIOLETA });
        grupo.appendChild(forma);
        if (i % cadaCuantasEtiquetas === 0) {
            const etiqueta = svg('text', { x: centro, y: alto - 8, 'text-anchor': 'middle', 'font-size': 11, fill: TINTA_SECUNDARIA });
            etiqueta.textContent = d.etiqueta;
            dibujo.appendChild(etiqueta);
        }
        const mostrar = () => {
            forma.setAttribute('fill', VIOLETA_ACTIVO);
            tooltip.textContent = '';
            const t = document.createElement('p'); t.className = 'font-semibold text-gray-900 mb-1'; t.textContent = d.etiqueta;
            tooltip.appendChild(t);
            [['Total', formato(d.valor)], ...(d.detalle || [])].forEach(([texto, valor]) => {
                const fila = document.createElement('p'); fila.className = 'flex justify-between gap-4';
                const a = document.createElement('span'); a.textContent = texto;
                const b = document.createElement('span'); b.className = 'font-medium text-gray-900 tabular-nums'; b.textContent = valor;
                fila.append(a, b); tooltip.appendChild(fila);
            });
            tooltip.classList.remove('hidden');
            const izquierda = Math.min(Math.max(0, (centro / ancho) * caja.clientWidth - 105), caja.clientWidth - 215);
            tooltip.style.left = `${izquierda}px`;
            tooltip.style.top = '0px';
        };
        const ocultar = () => { forma.setAttribute('fill', VIOLETA); tooltip.classList.add('hidden'); };
        grupo.addEventListener('mouseenter', mostrar);
        grupo.addEventListener('focus', mostrar);
        grupo.addEventListener('mouseleave', ocultar);
        grupo.addEventListener('blur', ocultar);
        dibujo.appendChild(grupo);
    });
    dibujo.setAttribute('aria-roledescription', 'gráfico de barras');
    caja.append(dibujo, tooltip);
    contenedor.appendChild(caja);
    return caja;
}

// Barras horizontales para un ranking (por evento u organización): nombre, barra y monto, de mayor a menor
export function dibujarRanking(contenedor, filas, { formato = String, maximoDeFilas = 10 } = {}) {
    contenedor.textContent = '';
    const lista = document.createElement('ol');
    lista.className = 'space-y-2';
    const visibles = filas.slice(0, maximoDeFilas);
    const maximo = Math.max(0, ...visibles.map((f) => f.valor));
    visibles.forEach((f) => {
        const item = document.createElement('li');
        item.className = 'grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm';
        const nombre = document.createElement('span'); nombre.className = 'truncate text-gray-700'; nombre.textContent = f.nombre; nombre.title = f.nombre;
        const pista = document.createElement('span'); pista.className = 'h-3 rounded-r bg-[#f3f0fa] overflow-hidden';
        const lleno = document.createElement('span'); lleno.className = 'block h-full rounded-r';
        lleno.style.background = VIOLETA;
        lleno.style.width = `${maximo > 0 ? Math.max(1, (f.valor / maximo) * 100) : 0}%`;
        pista.appendChild(lleno);
        const monto = document.createElement('span'); monto.className = 'tabular-nums font-medium text-gray-900'; monto.textContent = formato(f.valor);
        item.append(nombre, pista, monto);
        lista.appendChild(item);
    });
    if (filas.length > maximoDeFilas) {
        const resto = document.createElement('li'); resto.className = 'text-xs text-gray-500'; resto.textContent = `y ${filas.length - maximoDeFilas} más (ver la tabla)`;
        lista.appendChild(resto);
    }
    contenedor.appendChild(lista);
}
