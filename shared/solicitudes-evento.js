// Comentarios del superadmin en una solicitud de evento y enlaces de contacto con la organización.
// Son solo cálculos sobre textos, sin red ni base de datos. Los textos se devuelven como texto: quien los muestre los escapa.
// Una solicitud vieja (sin `comentarios`) se sigue viendo igual.

const LARGO_MAXIMO_COMENTARIO = 500;
const MINIMO_DE_DIGITOS_DEL_TELEFONO = 8;

// El comentario listo para guardar { texto, autor, fecha }, o null si no hay texto. `ahora` es un Date.
export function armarComentario(texto, ahora) {
    const limpio = typeof texto === 'string' ? texto.trim().slice(0, LARGO_MAXIMO_COMENTARIO).trim() : '';
    if (!limpio) return null;
    const esFecha = Object.prototype.toString.call(ahora) === '[object Date]' && !Number.isNaN(ahora.getTime());
    const momento = esFecha ? ahora : new Date();
    return { texto: limpio, autor: 'superadmin', fecha: momento.toISOString() };
}

// Los comentarios de una solicitud, del más nuevo al más viejo. Descarta lo que no tiene texto.
export function comentariosDeSolicitud(solicitud) {
    const lista = solicitud && Array.isArray(solicitud.comentarios) ? solicitud.comentarios : [];
    return lista
        .filter((c) => c && typeof c === 'object' && typeof c.texto === 'string' && c.texto.trim() !== '')
        .map((c) => ({
            texto: c.texto.trim(),
            autor: typeof c.autor === 'string' && c.autor ? c.autor : 'superadmin',
            fecha: typeof c.fecha === 'string' ? c.fecha : ''
        }))
        .map((c, posicion) => ({ c, posicion }))
        .sort((a, b) => (a.c.fecha < b.c.fecha ? 1 : a.c.fecha > b.c.fecha ? -1 : b.posicion - a.posicion))
        .map(({ c }) => c);
}

// El comentario más nuevo, o null si no hay
export function ultimoComentario(solicitud) {
    return comentariosDeSolicitud(solicitud)[0] || null;
}

// Enlaces para contactar a la organización: { correo, whatsapp }. Cada uno es '' si falta el dato.
export function enlacesDeContacto({ correo, telefono, nombreEvento } = {}) {
    const evento = typeof nombreEvento === 'string' && nombreEvento.trim() ? nombreEvento.trim() : 'tu evento';
    const saludo = `Hola, te escribimos de Evently por la solicitud de "${evento}".`;
    const direccion = typeof correo === 'string' ? correo.trim() : '';
    const digitos = typeof telefono === 'string' || typeof telefono === 'number' ? String(telefono).replace(/\D/g, '') : '';
    return {
        correo: direccion && /^[^\s@]+@[^\s@]+$/.test(direccion)
            ? `mailto:${direccion}?subject=${encodeURIComponent(`Tu solicitud de evento: ${evento}`)}&body=${encodeURIComponent(saludo)}`
            : '',
        whatsapp: digitos.length >= MINIMO_DE_DIGITOS_DEL_TELEFONO
            ? `https://wa.me/${digitos}?text=${encodeURIComponent(saludo)}`
            : ''
    };
}
