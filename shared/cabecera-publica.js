// Cabecera común del sitio del comprador (cambio ajustes-tras-vista-previa).
// El logo siempre lleva al inicio; a la derecha "Inicio" y "Eventos" (la lista de eventos del inicio). La página actual
// se marca en violeta. El Centro de ayuda está en el pie. Todo es texto fijo de este archivo: no entra ningún dato de afuera.
// Los links son relativos a public/.

export const ENLACES_DE_CABECERA = [
    { id: 'inicio', texto: 'Inicio', href: 'index.html' },
    { id: 'eventos', texto: 'Eventos', href: 'index.html#eventos' }
];

// Qué link se marca en cada página: en el inicio "Inicio", en un evento "Eventos"; en las demás, ninguno
const MARCADO = { inicio: 'inicio', evento: 'eventos' };

// Llena un <header> vacío. `paginaActual`: 'inicio', 'evento', 'soporte', 'confirmacion', 'terminos', 'privacidad' o 'arrepentimiento'.
export function dibujarCabecera(elemento, paginaActual) {
    if (!elemento) return;
    elemento.className = 'bg-white/95 backdrop-blur border-b border-[#e7e3f0] sticky top-0 z-50';
    elemento.textContent = '';

    const contenedor = document.createElement('div');
    contenedor.className = 'max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4';

    const logo = document.createElement('a');
    logo.href = 'index.html';
    logo.className = 'text-2xl font-extrabold tracking-tight text-[#6d28d9] rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6d28d9]';
    logo.textContent = 'Evently';
    logo.setAttribute('aria-label', 'Evently, ir al inicio');

    const nav = document.createElement('nav');
    nav.className = 'flex items-center gap-1 sm:gap-2 text-sm font-semibold';
    nav.setAttribute('aria-label', 'Principal');
    ENLACES_DE_CABECERA.forEach((e) => {
        const a = document.createElement('a');
        a.href = e.href;
        a.textContent = e.texto;
        const actual = e.id === MARCADO[paginaActual];
        a.className = 'px-3 py-2 rounded-full transition-colors ' + (actual ? 'bg-[#ede9fe] text-[#6d28d9]' : 'text-[#374151] hover:text-[#6d28d9] hover:bg-[#f6f5fa]');
        if (actual) a.setAttribute('aria-current', 'page');
        nav.appendChild(a);
    });

    contenedor.append(logo, nav);
    elemento.appendChild(contenedor);
}
