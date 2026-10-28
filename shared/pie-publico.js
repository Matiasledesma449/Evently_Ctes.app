// Pie de página común del sitio del comprador (inicio, evento, soporte y las páginas legales).
// Los links son relativos a la carpeta public/, donde están todas esas páginas.

// Texto de derechos
export const TEXTO_DE_DERECHOS = '© 2026 Evently by Bali Group';

// Páginas que muestran el pie (el nombre que cada una le pasa a dibujarPie)
export const PAGINAS_CON_PIE = ['inicio', 'evento', 'soporte', 'terminos', 'privacidad', 'arrepentimiento'];

// Links legales, siempre los mismos y en el mismo orden (pedido 20: no desaparecen al entrar a uno).
// El de la página en la que se está va marcado con `actual: true`.
export function enlacesLegales(paginaActual) {
    return [
        { id: 'terminos', texto: 'Términos y condiciones', href: 'terminos.html' },
        { id: 'privacidad', texto: 'Política de privacidad', href: 'privacidad.html' },
        { id: 'arrepentimiento', texto: 'Botón de arrepentimiento', href: 'arrepentimiento.html' }
    ].map((e) => ({ ...e, actual: e.id === paginaActual }));
}

// Links de ayuda, siempre los mismos y en el mismo orden. "Enviar una consulta" lleva al formulario del Centro de ayuda.
export function enlacesDelPie(paginaActual) {
    const actual = { inicio: 'inicio', soporte: 'ayuda' }[paginaActual] || '';
    return [
        { id: 'inicio', texto: 'Inicio', href: 'index.html' },
        { id: 'ayuda', texto: 'Centro de ayuda', href: 'soporte.html' },
        { id: 'consulta', texto: 'Enviar una consulta', href: 'soporte.html#contacto' }
    ].map((e) => ({ ...e, actual: e.id === actual }));
}

// Pie oscuro con el violeta de Evently: en una fila, el logo a la izquierda, los links centrados y los logos de marcas
// a la derecha; abajo una línea y los derechos, centrados. Todo con createElement y textContent (nunca HTML).
const CLASE_ENLACE = 'text-white/85 hover:text-white hover:underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 rounded';
const CLASE_ACTUAL = 'text-white font-semibold underline underline-offset-4 decoration-violet-400 rounded';

// Llena un <footer> vacío. Devuelve el contenedor de logos (para cargarLogosDelPie).
export function dibujarPie(elemento, paginaActual) {
    if (!elemento) return null;
    elemento.textContent = '';
    elemento.className = 'mt-auto bg-[#15101f] text-white';
    const contenedor = document.createElement('div');
    contenedor.className = 'max-w-6xl mx-auto px-4 pt-10 pb-6';

    // Fila: logo (izquierda), links (centro) y logos de marcas (derecha)
    const fila = document.createElement('div');
    fila.className = 'grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6';
    const logo = document.createElement('a');
    logo.href = 'index.html';
    logo.className = 'justify-self-start text-2xl font-extrabold tracking-tight text-violet-300 hover:text-violet-200';
    logo.textContent = 'Evently';
    logo.setAttribute('aria-label', 'Evently, ir al inicio');

    const nav = document.createElement('nav');
    nav.className = 'flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-center';
    nav.setAttribute('aria-label', 'Ayuda y legales');
    [...enlacesDelPie(paginaActual), ...enlacesLegales(paginaActual)].forEach((e) => {
        const a = document.createElement('a');
        a.href = e.href;
        a.textContent = e.texto;
        a.className = e.actual ? CLASE_ACTUAL : CLASE_ENLACE;
        if (e.actual) a.setAttribute('aria-current', 'page');
        nav.appendChild(a);
    });

    const logos = document.createElement('div');
    logos.className = 'flex flex-wrap items-center justify-center md:justify-end gap-6';
    logos.setAttribute('aria-label', 'Marcas que acompañan');
    fila.append(logo, nav, logos);

    const linea = document.createElement('hr');
    linea.className = 'my-6 border-white/20';

    const derechos = document.createElement('p');
    derechos.className = 'text-center text-xs text-white/60';
    derechos.textContent = TEXTO_DE_DERECHOS;

    contenedor.append(fila, linea, derechos);
    elemento.appendChild(contenedor);
    return logos;
}

// Un logo guardado: imagen en data URL (png, jpeg o webp) y, si tiene, un enlace https
export function logoValido(logo) {
    return Boolean(logo && typeof logo === 'object' && typeof logo.imagen === 'string'
        && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo.imagen));
}
const enlaceValido = (enlace) => typeof enlace === 'string' && /^https:\/\/[^\s"'<>]+$/.test(enlace);

// Dibuja los logos en su contenedor (con su enlace si tiene). Los inválidos se ignoran.
export function dibujarLogos(contenedor, logos) {
    if (!contenedor) return;
    contenedor.textContent = '';
    (Array.isArray(logos) ? logos : []).filter(logoValido).slice(0, 8).forEach((logo) => {
        const img = document.createElement('img');
        img.src = logo.imagen;
        img.alt = typeof logo.nombre === 'string' ? logo.nombre : '';
        img.className = 'h-10 w-auto max-w-[160px] object-contain';
        img.loading = 'lazy';
        if (enlaceValido(logo.enlace)) {
            const a = document.createElement('a');
            a.href = logo.enlace;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.appendChild(img);
            contenedor.appendChild(a);
        } else {
            contenedor.appendChild(img);
        }
    });
}

// Lee los logos de configuracion/sitio cuando Firebase está listo (las páginas cargan firebase-init.js).
// Si no hay logos o falla la lectura, el pie queda igual, sin logos.
export function cargarLogosDelPie(contenedor) {
    if (!contenedor) return;
    const leer = () => {
        if (!window.db || !window.getDoc || !window.doc) return;
        window.getDoc(window.doc(window.db, 'configuracion', 'sitio'))
            .then((snap) => { if (snap.exists()) dibujarLogos(contenedor, (snap.data() || {}).logosPie); })
            .catch(() => { /* sin logos: el pie se ve igual */ });
    };
    if (window.db) leer(); else window.addEventListener('firebase-ready', leer, { once: true });
}
