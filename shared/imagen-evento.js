// La imagen de un evento: una sola regla para todas las páginas.
// Si el evento tiene una foto válida (https) se muestra esa; si no, un relleno propio del evento
// (letra inicial sobre un violeta de la paleta, estable por evento). Sin red ni base de datos.

const escapar = (valor) => {
    const reemplazos = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
    return String(valor === undefined || valor === null ? '' : valor).replace(/[&<>"'`]/g, (c) => reemplazos[c]);
};

// Colores fijos del relleno (fondo y letra). Las clases/estilos salen de esta tabla, nunca de los datos.
const PALETA_RELLENO = [
    { fondo: '#ede9fe', texto: '#6d28d9' },
    { fondo: '#ddd6fe', texto: '#5b21b6' },
    { fondo: '#c4b5fd', texto: '#4c1d95' },
    { fondo: '#e0e7ff', texto: '#4338ca' },
    { fondo: '#f3e8ff', texto: '#7e22ce' },
    { fondo: '#fae8ff', texto: '#a21caf' }
];

// Hash simple y estable de un texto (el mismo texto da siempre el mismo número)
function hashDeTexto(texto) {
    let h = 2166136261;
    const s = String(texto);
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
}

// Solo se aceptan direcciones https, sin espacios ni caracteres de control (nada de javascript:, data: ni http:)
export function direccionDeImagenValida(valor) {
    if (typeof valor !== 'string') return '';
    const url = valor.trim();
    return /^https:\/\/[^\s\u0000-\u001f]+$/i.test(url) ? url : '';
}

// El relleno del evento: letra inicial del nombre y color elegido por su id (o por su nombre si no tiene id)
export function rellenoDelEvento(evento) {
    const e = evento && typeof evento === 'object' ? evento : {};
    const nombre = typeof e.nombre === 'string' ? e.nombre : '';
    const letra = Array.from(((nombre.match(/[\p{L}\p{N}]/u) || ['?'])[0]).toUpperCase())[0]; // un solo carácter ("ß" en mayúscula son dos)
    const semilla = e.id !== undefined && e.id !== null && String(e.id) !== '' ? String(e.id) : nombre;
    const color = PALETA_RELLENO[hashDeTexto(semilla) % PALETA_RELLENO.length];
    return { letra, fondo: color.fondo, texto: color.texto };
}

// Qué mostrar de un evento: { src, relleno }. src vacío significa "no tiene foto válida".
export function imagenDelEvento(evento) {
    const e = evento && typeof evento === 'object' ? evento : {};
    return { src: direccionDeImagenValida(e.imagen), relleno: rellenoDelEvento(e) };
}

// HTML listo para innerHTML. El relleno queda detrás y la foto encima: si la foto no carga, se quita y se ve el relleno.
// `clases` da el tamaño (por ejemplo "h-40" o "h-64"); el contenedor siempre ocupa todo el ancho.
export function htmlDeImagenEvento(evento, opciones = {}) {
    const e = evento && typeof evento === 'object' ? evento : {};
    const { src, relleno } = imagenDelEvento(e);
    const nombre = typeof e.nombre === 'string' ? e.nombre : '';
    const clases = typeof opciones.clases === 'string' ? opciones.clases : '';
    const vista = src || `relleno:${relleno.letra}:${relleno.fondo}`;
    const foto = src
        ? `<img src="${escapar(src)}" alt="${escapar(nombre || 'Imagen del evento')}" loading="lazy" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()">`
        : '';
    return `<div class="imagen-evento relative w-full overflow-hidden ${escapar(clases)}" role="img" aria-label="${escapar(nombre || 'Imagen del evento')}" data-imagen-evento="${escapar(vista)}" style="background:${relleno.fondo}">`
        + `<span aria-hidden="true" class="absolute inset-0 flex items-center justify-center font-bold select-none" style="color:${relleno.texto};font-size:3.5rem;line-height:1">${escapar(relleno.letra)}</span>`
        + foto
        + '</div>';
}

// Lo mismo como elemento (sin innerHTML), para las páginas que arman la pantalla con createElement
export function crearImagenEvento(evento, documento, opciones = {}) {
    const e = evento && typeof evento === 'object' ? evento : {};
    const { src, relleno } = imagenDelEvento(e);
    const nombre = typeof e.nombre === 'string' && e.nombre ? e.nombre : 'Imagen del evento';
    const clases = typeof opciones.clases === 'string' ? opciones.clases : '';

    const contenedor = documento.createElement('div');
    contenedor.className = `imagen-evento relative w-full overflow-hidden ${clases}`.trim();
    contenedor.setAttribute('role', 'img');
    contenedor.setAttribute('aria-label', nombre);
    contenedor.setAttribute('data-imagen-evento', src || `relleno:${relleno.letra}:${relleno.fondo}`);
    contenedor.style.background = relleno.fondo;

    const letra = documento.createElement('span');
    letra.setAttribute('aria-hidden', 'true');
    letra.className = 'absolute inset-0 flex items-center justify-center font-bold select-none';
    letra.style.color = relleno.texto;
    letra.style.fontSize = '3.5rem';
    letra.style.lineHeight = '1';
    letra.textContent = relleno.letra;
    contenedor.appendChild(letra);

    if (src) {
        const foto = documento.createElement('img');
        foto.className = 'absolute inset-0 w-full h-full object-cover';
        foto.loading = 'lazy';
        foto.alt = nombre;
        foto.addEventListener('error', () => foto.remove());
        foto.src = src;
        contenedor.appendChild(foto);
    }
    return contenedor;
}
