// Achica una imagen en el navegador para guardarla dentro de un documento (no se usa Firebase Storage).
// Para logos: conserva la transparencia (WebP, y si el navegador no lo sabe hacer, PNG) y no supera `maxBytes`.

const TIPOS_ACEPTADOS = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

// Tamaño aproximado en bytes de un data URL en base64
export function bytesDeDataUrl(dataUrl) {
    const coma = typeof dataUrl === 'string' ? dataUrl.indexOf(',') : -1;
    return coma < 0 ? 0 : Math.floor((dataUrl.length - coma - 1) * 3 / 4);
}

// Una imagen guardada solo se muestra si es un data URL de imagen (nunca una dirección cualquiera ni "javascript:")
export function esImagenGuardada(valor) {
    return typeof valor === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(valor);
}

// Devuelve un data URL o lanza un Error con un mensaje para la persona
export async function achicarLogo(archivo, { maxLado = 400, maxBytes = 80 * 1024 } = {}) {
    if (!archivo || !TIPOS_ACEPTADOS.includes(archivo.type)) throw new Error('Elegí una imagen PNG, JPG, WebP o SVG.');
    let imagen;
    try {
        imagen = await createImageBitmap(archivo);
    } catch (e) {
        throw new Error('No se pudo leer ese archivo como imagen. Probá con otro.');
    }
    const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(imagen.width * escala));
    lienzo.height = Math.max(1, Math.round(imagen.height * escala));
    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    for (const calidad of [0.9, 0.8, 0.65, 0.5]) {
        const dato = lienzo.toDataURL('image/webp', calidad);
        if (dato.startsWith('data:image/webp') && bytesDeDataUrl(dato) <= maxBytes) return dato;
    }
    const png = lienzo.toDataURL('image/png');
    if (bytesDeDataUrl(png) <= maxBytes) return png;
    throw new Error('El logo es muy pesado aun achicado. Probá con una imagen más simple.');
}
