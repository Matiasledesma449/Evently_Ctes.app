// shared/i18n.js
// Esqueleto de internacionalización para Evently.
// Uso: import { t, setIdioma, getIdioma } from './i18n.js';

const TEXTOS = {
  es: {
    // Navegación
    nav_inicio: 'Inicio',
    nav_eventos: 'Eventos',
    nav_musica: 'Música',
    nav_teatro: 'Teatro',
    nav_categorias: 'Categorías',
    nav_soporte: 'Soporte',
    nav_ingresar: 'Ingresar',

    // Footer
    footer_terminos: 'Términos y condiciones',
    footer_privacidad: 'Políticas de privacidad',
    footer_cookies: 'Políticas de cookies',
    footer_contacto: 'Contacto y soporte',
    footer_defensa: 'Defensa al consumidor',
    footer_arrepentimiento: 'Arrepentimiento de compra',

    // Acciones comunes
    btn_comprar: 'Comprar entradas',
    btn_confirmar: 'Confirmar',
    btn_cancelar: 'Cancelar',
    btn_exportar: 'Exportar',
    btn_descargar_pdf: 'Descargar PDF',

    // Estados
    estado_aprobado: 'Aprobado',
    estado_pendiente: 'Pendiente',
    estado_rechazado: 'Rechazado',

    // Mensajes
    msg_contacto_pronto: 'Nos comunicaremos con vos a la brevedad.',
    msg_error_generico: 'Ocurrió un error. Intentá de nuevo.',

    // Idioma
    idioma_actual: 'Español'
  },

  en: {
    // Navigation
    nav_inicio: 'Home',
    nav_eventos: 'Events',
    nav_musica: 'Music',
    nav_teatro: 'Theater',
    nav_categorias: 'Categories',
    nav_soporte: 'Support',
    nav_ingresar: 'Sign in',

    // Footer
    footer_terminos: 'Terms and conditions',
    footer_privacidad: 'Privacy policy',
    footer_cookies: 'Cookie policy',
    footer_contacto: 'Contact & support',
    footer_defensa: 'Consumer protection',
    footer_arrepentimiento: 'Right of withdrawal',

    // Common actions
    btn_comprar: 'Buy tickets',
    btn_confirmar: 'Confirm',
    btn_cancelar: 'Cancel',
    btn_exportar: 'Export',
    btn_descargar_pdf: 'Download PDF',

    // States
    estado_aprobado: 'Approved',
    estado_pendiente: 'Pending',
    estado_rechazado: 'Rejected',

    // Messages
    msg_contacto_pronto: 'We will contact you shortly.',
    msg_error_generico: 'Something went wrong. Please try again.',

    // Language
    idioma_actual: 'English'
  }
};

const STORAGE_KEY = 'eventy_idioma';
const IDIOMA_DEFAULT = 'es';

let idiomaActual = (() => {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado && TEXTOS[guardado]) return guardado;
  } catch (_) {}
  // Detección por navegador
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return TEXTOS[nav] ? nav : IDIOMA_DEFAULT;
})();

/**
 * Devuelve el texto de una clave en el idioma actual.
 * Si no existe, devuelve la clave entre corchetes para detectar faltantes.
 */
export function t(clave) {
  const idioma = TEXTOS[idiomaActual] || TEXTOS[IDIOMA_DEFAULT];
  return idioma[clave] ?? `[${clave}]`;
}

/**
 * Cambia el idioma activo, lo persiste y dispara el evento 'idioma-cambiado'.
 */
export function setIdioma(codigo) {
  if (!TEXTOS[codigo]) {
    console.warn(`[i18n] Idioma no soportado: ${codigo}`);
    return;
  }
  idiomaActual = codigo;
  try { localStorage.setItem(STORAGE_KEY, codigo); } catch (_) {}
  document.documentElement.lang = codigo;
  window.dispatchEvent(new CustomEvent('idioma-cambiado', { detail: { idioma: codigo } }));
}

/**
 * Devuelve el código de idioma activo.
 */
export function getIdioma() {
  return idiomaActual;
}

/**
 * Devuelve todos los textos del idioma actual (útil para render masivo).
 */
export function getTextos() {
  return { ...(TEXTOS[idiomaActual] || TEXTOS[IDIOMA_DEFAULT]) };
}

// Inicializa el atributo lang al cargar
document.documentElement.lang = idiomaActual;