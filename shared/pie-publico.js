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

// Llena un <footer> vacío con los links y el texto de derechos, siempre como texto (nunca como HTML)
export function dibujarPie(elemento, paginaActual) {
    if (!elemento) return;
    elemento.textContent = '';

    const enlaces = enlacesDelPie(paginaActual);
    if (enlaces.length > 0) {
        const nav = document.createElement('nav');
        nav.className = 'flex flex-wrap justify-center gap-x-6 gap-y-1 mb-2';
        nav.setAttribute('aria-label', 'Ayuda');
        enlaces.forEach((e) => {
            const a = document.createElement('a');
            a.href = e.href;
            a.textContent = e.texto;
            a.className = 'hover:text-violet-700';
            nav.appendChild(a);
        });
        elemento.appendChild(nav);
    }

    const legales = document.createElement('nav');
    legales.className = 'flex flex-wrap justify-center gap-x-6 gap-y-1 mb-2 text-xs';
    legales.setAttribute('aria-label', 'Legales');
    enlacesLegales(paginaActual).forEach((e) => {
        const a = document.createElement('a');
        a.href = e.href;
        a.textContent = e.texto;
        a.className = 'hover:text-violet-700';
        legales.appendChild(a);
    });
    elemento.appendChild(legales);

    const derechos = document.createElement('div');
    derechos.textContent = TEXTO_DE_DERECHOS;
    elemento.appendChild(derechos);
}
