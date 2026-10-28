// shared/banners.js
// Imágenes de los banners (franjas violetas) del sitio del comprador (pedido 21).
// Para poner una imagen: copiar el archivo a public/assets/banners/ y escribir su nombre en IMAGENES_DE_BANNERS.
// Sin imagen, el banner queda con el violeta de siempre. Con imagen, se le pone encima un velo violeta para que el
// texto blanco se siga leyendo.

export const IMAGENES_DE_BANNERS = {
    soporte: '',          // Centro de ayuda
    terminos: '',         // Términos y condiciones
    privacidad: '',       // Política de privacidad
    arrepentimiento: '',  // Botón de arrepentimiento
};

// Solo nombres de archivo simples de imagen (sin carpetas ni comillas): así nada raro entra en el estilo
const NOMBRE_VALIDO = /^[A-Za-z0-9_-][A-Za-z0-9._-]*\.(jpe?g|png|webp)$/i;

// La dirección de la imagen del banner de una página (relativa a public/) o '' si no tiene
export function urlDeBanner(pagina, imagenes = IMAGENES_DE_BANNERS) {
    const nombre = imagenes && Object.prototype.hasOwnProperty.call(imagenes, pagina) ? imagenes[pagina] : '';
    return typeof nombre === 'string' && NOMBRE_VALIDO.test(nombre) ? `assets/banners/${nombre}` : '';
}

// Pone la imagen en la sección del banner (si la página tiene una)
export function aplicarBanner(seccion, pagina) {
    const url = urlDeBanner(pagina);
    if (!seccion || !url) return;
    seccion.style.backgroundImage = `linear-gradient(120deg, rgba(76, 29, 149, 0.88) 0%, rgba(124, 58, 237, 0.72) 100%), url("${url}")`;
    seccion.style.backgroundSize = 'cover';
    seccion.style.backgroundPosition = 'center';
}
