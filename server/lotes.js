// server/lotes.js
// Cuándo está a la venta un lote (cambio ajustes-tras-vista-previa). Es la MISMA regla que shared/lotes.js
// (que usa el navegador); pruebas/35-lotes.js comprueba que las dos den lo mismo.

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fecha = (valor) => (typeof valor === 'string' && FECHA.test(valor) ? valor : '');

// La fecha de hoy en Argentina como 'AAAA-MM-DD' (el servidor corre en otra zona horaria)
function hoyEnArgentina(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
}

// 'disponible' | 'proximo' | 'finalizado'. Lotes viejos sin tipo ni fechas siguen disponibles.
function estadoDeLote(lote, hoy) {
  if (!lote || typeof lote !== 'object') return 'finalizado';
  if (lote.habilitadoManual === true) return 'disponible';
  if (lote.tipo === 'siempre') return 'disponible';
  const desde = fecha(lote.desde);
  const hasta = fecha(lote.hasta);
  if (desde && hoy < desde) return 'proximo';
  if (hasta && hoy > hasta) return 'finalizado';
  return 'disponible';
}

module.exports = { hoyEnArgentina, estadoDeLote };
