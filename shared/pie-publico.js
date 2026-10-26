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

// Links del pie: gris oscuro legible, violeta y subrayado al pasar o al enfocar con el teclado
const CLASE_ENLACE = 'text-[#374151] hover:text-[#6d28d9] hover:underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d28d9] rounded';

// Llena un <footer> vacío con los links y el texto de derechos, siempre como texto (nunca como HTML)
export function dibujarPie(elemento, paginaActual) {
    if (!elemento) return;
    elemento.textContent = '';
    // Mismo pie en todas las páginas, con contraste suficiente para leerlo (gris oscuro sobre blanco)
    elemento.className = 'mt-auto bg-white border-t border-[#e7e3f0] py-6 px-4 text-center text-sm text-[#4b5563]';

    const enlaces = enlacesDelPie(paginaActual);
    if (enlaces.length > 0) {
        const nav = document.createElement('nav');
        nav.className = 'flex flex-wrap justify-center gap-x-6 gap-y-2 mb-3 font-semibold';
        nav.setAttribute('aria-label', 'Ayuda');
        enlaces.forEach((e) => {
            const a = document.createElement('a');
            a.href = e.href;
            a.textContent = e.texto;
            a.className = CLASE_ENLACE;
            nav.appendChild(a);
        });
        elemento.appendChild(nav);
    }

    const legales = document.createElement('nav');
    legales.className = 'flex flex-wrap justify-center gap-x-6 gap-y-2 mb-3';
    legales.setAttribute('aria-label', 'Legales');
    enlacesLegales(paginaActual).forEach((e) => {
        const a = document.createElement('a');
        a.href = e.href;
        a.textContent = e.texto;
        a.className = CLASE_ENLACE;
        legales.appendChild(a);
    });
    elemento.appendChild(legales);

    const derechos = document.createElement('div');
    derechos.className = 'text-xs text-[#6b7280]';
    derechos.textContent = TEXTO_DE_DERECHOS;
    elemento.appendChild(derechos);
}
