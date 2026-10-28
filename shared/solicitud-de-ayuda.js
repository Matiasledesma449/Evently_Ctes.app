// Solicitudes del Centro de ayuda y pedidos de arrepentimiento (cambio comprador-estilo-all-access).
// Valida lo que escribe el comprador y arma el texto que se guarda como una consulta pública más (consultas_publicas):
// mismos campos de siempre (nombre, email, mensaje...) y los datos nuevos dentro del mensaje, para no depender de
// que las reglas de Firestore acepten campos nuevos. Funciones puras: sin red ni base de datos.

export const ENCABEZADO_ARREPENTIMIENTO = 'ARREPENTIMIENTO DE COMPRA';
export const DIAS_PARA_ARREPENTIRSE = 10;

const texto = (valor, maximo) => (typeof valor === 'string' ? valor.trim().replace(/[ \t]+/g, ' ').slice(0, maximo) : '');
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// DNI sin puntos ni espacios: 7 u 8 números. Vacío es válido (es opcional). Devuelve el DNI limpio o null si no es válido.
export function limpiarDni(valor) {
    const limpio = typeof valor === 'string' ? valor.replace(/[.\s-]/g, '') : '';
    if (limpio === '') return '';
    return /^\d{7,8}$/.test(limpio) ? limpio : null;
}

// Arma la solicitud del Centro de ayuda. Devuelve { ok: true, datos: { nombre, email, mensaje } } o { ok: false, mensaje }.
export function armarSolicitud(campos = {}) {
    const email = texto(campos.email, 254);
    const asunto = texto(campos.asunto, 120);
    const nombre = texto(campos.nombre, 100);
    const evento = texto(campos.evento, 120);
    const numeroCompra = texto(campos.numeroCompra, 60);
    const descripcion = typeof campos.descripcion === 'string' ? campos.descripcion.trim().slice(0, 5000) : '';
    const dni = limpiarDni(campos.dni);

    if (!CORREO.test(email)) return { ok: false, mensaje: 'Escribí un correo válido para poder responderte.' };
    if (!asunto) return { ok: false, mensaje: 'Contanos el asunto de tu solicitud.' };
    if (!nombre) return { ok: false, mensaje: 'Escribí tu nombre y apellido.' };
    if (dni === null) return { ok: false, mensaje: 'El DNI va sin puntos y tiene 7 u 8 números.' };
    if (!descripcion) return { ok: false, mensaje: 'Contanos qué pasó en la descripción.' };

    const renglones = [`Asunto: ${asunto}`];
    if (dni) renglones.push(`DNI: ${dni}`);
    if (evento) renglones.push(`Evento: ${evento}`);
    if (numeroCompra) renglones.push(`Número de compra: ${numeroCompra}`);
    renglones.push('', descripcion);
    return { ok: true, datos: { nombre, email, mensaje: renglones.join('\n') } };
}

// Arma el pedido de arrepentimiento. El número de compra es obligatorio (sin él no se puede encontrar la compra).
export function armarArrepentimiento(campos = {}) {
    const email = texto(campos.email, 254);
    const nombre = texto(campos.nombre, 100);
    const numeroCompra = texto(campos.numeroCompra, 60);
    const motivo = typeof campos.motivo === 'string' ? campos.motivo.trim().slice(0, 2000) : '';
    const dni = limpiarDni(campos.dni);

    if (!CORREO.test(email)) return { ok: false, mensaje: 'Escribí el correo con el que hiciste la compra.' };
    if (!nombre) return { ok: false, mensaje: 'Escribí tu nombre y apellido.' };
    if (dni === null) return { ok: false, mensaje: 'El DNI va sin puntos y tiene 7 u 8 números.' };
    if (!numeroCompra) return { ok: false, mensaje: 'Escribí el número de compra (está en la página de confirmación de tu compra).' };

    const renglones = [ENCABEZADO_ARREPENTIMIENTO, `Número de compra: ${numeroCompra}`];
    if (dni) renglones.push(`DNI: ${dni}`);
    if (motivo) renglones.push('', `Motivo: ${motivo}`);
    return { ok: true, datos: { nombre, email, mensaje: renglones.join('\n') } };
}
