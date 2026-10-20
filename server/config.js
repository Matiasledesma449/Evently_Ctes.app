// server/config.js
// Lectura de variables de entorno y constantes del servidor de pagos.
// Los valores secretos viven solo en Vercel (Settings > Environment Variables).

// --- Constantes de negocio (ver specs/compra-con-mercado-pago) ---
const MINUTOS_VENCIMIENTO = 30; // la venta pendiente y el pago en Mercado Pago vencen a los 30 min
const MAX_ENTRADAS_POR_COMPRA = 10;

// --- Nombres de las variables de entorno ---
const VARIABLES = {
  MP_ACCESS_TOKEN: 'MP_ACCESS_TOKEN',
  MP_WEBHOOK_SECRET: 'MP_WEBHOOK_SECRET',
  FIREBASE_PROJECT_ID: 'FIREBASE_PROJECT_ID',
  FIREBASE_CLIENT_EMAIL: 'FIREBASE_CLIENT_EMAIL',
  FIREBASE_PRIVATE_KEY: 'FIREBASE_PRIVATE_KEY',
  SITE_URL: 'SITE_URL',
};

// Error de configuracion: falta alguna variable. El mensaje nombra las variables
// que faltan (nunca sus valores) y es SOLO para los registros del servidor:
// los handlers deben responder un mensaje generico al navegador.
class ConfigError extends Error {
  constructor(faltantes) {
    super(`Falta configurar variables de entorno: ${faltantes.join(', ')}`);
    this.name = 'ConfigError';
    this.faltantes = faltantes;
  }
}

// Devuelve { NOMBRE: valor } para los nombres pedidos. No usa valores por defecto:
// si alguno falta o esta vacio, lanza ConfigError con la lista de los que faltan.
function requerir(nombres) {
  const valores = {};
  const faltantes = [];
  for (const nombre of nombres) {
    const valor = process.env[nombre];
    if (typeof valor !== 'string' || valor.trim() === '') {
      faltantes.push(nombre);
    } else {
      valores[nombre] = valor;
    }
  }
  if (faltantes.length > 0) throw new ConfigError(faltantes);
  return valores;
}

// Direccion publica del sitio, sin barra final. Mercado Pago exige https para
// las direcciones de retorno y de aviso, asi que cualquier otra cosa es un error de configuracion.
function siteUrl() {
  const { SITE_URL } = requerir([VARIABLES.SITE_URL]);
  let url;
  try {
    url = new URL(SITE_URL.trim());
  } catch (e) {
    throw new ConfigError(['SITE_URL (no es una dirección válida)']);
  }
  if (url.protocol !== 'https:') throw new ConfigError(['SITE_URL (debe empezar con https://)']);
  return url.origin; // origin no incluye barra final ni ruta
}

module.exports = {
  MINUTOS_VENCIMIENTO,
  MAX_ENTRADAS_POR_COMPRA,
  VARIABLES,
  ConfigError,
  requerir,
  siteUrl,
};
