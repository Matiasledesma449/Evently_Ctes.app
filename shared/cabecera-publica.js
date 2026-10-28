// Cabecera común del sitio del comprador (cambio ajustes-tras-vista-previa).
// El logo siempre lleva al inicio; a la derecha "Eventos" y "Centro de ayuda" (la página actual se marca en violeta).
// Todo es texto fijo de este archivo: no entra ningún dato de afuera. Los links son relativos a public/.

export const ENLACES_DE_CABECERA = [
    { id: 'inicio', texto: 'Eventos', href: 'index.html' },
    { id: 'soporte', texto: 'Centro de ayuda', href: 'soporte.html' }
];

// Llena un <header> vacío. `paginaActual`: 'inicio', 'evento', 'soporte', 'terminos', 'privacidad' o 'arrepentimiento'.
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
        // Desde el inicio y el evento, el Centro de ayuda recuerda de dónde vino la persona (se guarda con la consulta)
        a.href = e.id === 'soporte' && (paginaActual === 'inicio' || paginaActual === 'evento')
            ? `soporte.html?origen=public/${paginaActual === 'inicio' ? 'index' : 'evento'}.html`
            : e.href;
        a.textContent = e.texto;
        const actual = e.id === paginaActual;
        a.className = 'px-3 py-2 rounded-full transition-colors ' + (actual ? 'bg-[#ede9fe] text-[#6d28d9]' : 'text-[#374151] hover:text-[#6d28d9] hover:bg-[#f6f5fa]');
        if (actual) a.setAttribute('aria-current', 'page');
        nav.appendChild(a);
    });

    contenedor.append(logo, nav);
    elemento.appendChild(contenedor);
}
