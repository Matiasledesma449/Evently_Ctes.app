// Pie de página común del sitio del comprador (inicio, evento, soporte y las páginas legales).
// Los links son relativos a la carpeta public/, donde están todas esas páginas.
// Los links legales (términos, privacidad y arrepentimiento) van en un segundo renglón.

// Texto de derechos que ya tenía cada página
export const TEXTO_DE_DERECHOS = '© 2024 Evently by Bali Group';

// Páginas que muestran el pie (el nombre que cada una le pasa a dibujarPie)
export const PAGINAS_CON_PIE = ['inicio', 'evento', 'soporte', 'terminos', 'privacidad', 'arrepentimiento'];

// Links legales: nunca se ofrece ir a la página en la que se está
export function enlacesLegales(paginaActual) {
    return [
        { id: 'terminos', texto: 'Términos y condiciones', href: 'terminos.html' },
        { id: 'privacidad', texto: 'Política de privacidad', href: 'privacidad.html' },
        { id: 'arrepentimiento', texto: 'Botón de arrepentimiento', href: 'arrepentimiento.html' }
    ].filter((e) => e.id !== paginaActual);
}

// Links del pie para la página actual: nunca se ofrece ir a donde ya se está.
// "Enviar una consulta" lleva al formulario al final del Centro de ayuda, que existe también estando en esa página.
export function enlacesDelPie(paginaActual) {
    const enlaces = [
        { id: 'inicio', texto: 'Inicio', href: 'index.html' },
        { id: 'ayuda', texto: 'Centro de ayuda', href: 'soporte.html' },
        { id: 'consulta', texto: 'Enviar una consulta', href: 'soporte.html#contacto' }
    ];
    return enlaces.filter((e) => {
        if (paginaActual === 'inicio') return e.id !== 'inicio';
        if (paginaActual === 'soporte') return e.id !== 'ayuda';
        return true;
    });
}

// Pie oscuro estilo All Access, con el violeta de Evently: logo y logos de marcas arriba, una línea, los links y los derechos.
// Todo se arma con createElement y textContent (nunca HTML). Los logos los carga el superadmin en "Sitio" (configuracion/sitio).
const CLASE_ENLACE = 'text-white/85 hover:text-white hover:underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 rounded';

// Llena un <footer> vacío. Devuelve el contenedor de logos (para cargarLogosDelPie).
export function dibujarPie(elemento, paginaActual) {
    if (!elemento) return null;
    elemento.textContent = '';
    elemento.className = 'mt-auto bg-[#15101f] text-white';
    const contenedor = document.createElement('div');
    contenedor.className = 'max-w-6xl mx-auto px-4 pt-10 pb-6';

    // Fila de arriba: logo de Evently y logos de marcas
    const arriba = document.createElement('div');
    arriba.className = 'flex flex-wrap items-center justify-between gap-6';
    const logo = document.createElement('a');
    logo.href = 'index.html';
    logo.className = 'text-2xl font-extrabold tracking-tight text-violet-300 hover:text-violet-200';
    logo.textContent = 'Evently';
    logo.setAttribute('aria-label', 'Evently, ir al inicio');
    const logos = document.createElement('div');
    logos.className = 'flex flex-wrap items-center gap-6';
    logos.setAttribute('aria-label', 'Marcas que acompañan');
    arriba.append(logo, logos);

    const linea = document.createElement('hr');
    linea.className = 'my-6 border-white/20';

    // Links: ayuda y legales en una fila
    const nav = document.createElement('nav');
    nav.className = 'flex flex-wrap gap-x-6 gap-y-2 text-sm';
    nav.setAttribute('aria-label', 'Ayuda y legales');
    [...enlacesDelPie(paginaActual), ...enlacesLegales(paginaActual)].forEach((e) => {
        const a = document.createElement('a');
        a.href = e.href;
        a.textContent = e.texto;
        a.className = CLASE_ENLACE;
        nav.appendChild(a);
    });

    const derechos = document.createElement('p');
    derechos.className = 'mt-8 text-xs text-white/60';
    derechos.textContent = TEXTO_DE_DERECHOS;

    contenedor.append(arriba, linea, nav, derechos);
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
