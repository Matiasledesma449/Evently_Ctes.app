// Lotes de un evento (cambio ajustes-tras-vista-previa): cuándo está a la venta cada lote.
// Un lote es "Por fechas" (preventa: desde/hasta) o "Siempre disponible" (sectores: Campo, Platea, VIP).
// El superadmin puede habilitar un lote antes de tiempo (`habilitadoManual`).
// La MISMA regla está en server/lotes.js (el servidor de pagos es CommonJS); pruebas/35-lotes.js comprueba que coincidan.

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const fecha = (valor) => (typeof valor === 'string' && FECHA.test(valor) ? valor : '');

// La fecha de hoy en Argentina como 'AAAA-MM-DD' (el servidor corre en otra zona horaria)
export function hoyEnArgentina(ahora = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora);
    return partes; // en-CA ya da AAAA-MM-DD
}

// 'disponible' | 'proximo' (todavía no empezó) | 'finalizado' (ya terminó). `hoy` es 'AAAA-MM-DD'.
// Lotes viejos sin tipo ni fechas siguen disponibles, como siempre.
export function estadoDeLote(lote, hoy) {
    if (!lote || typeof lote !== 'object') return 'finalizado';
    if (lote.habilitadoManual === true) return 'disponible';
    if (lote.tipo === 'siempre') return 'disponible';
    const desde = fecha(lote.desde);
    const hasta = fecha(lote.hasta);
    if (desde && hoy < desde) return 'proximo';
    if (hasta && hoy > hasta) return 'finalizado';
    return 'disponible';
}

// "01/11" a partir de "2026-11-01"
export function diaMes(valor) {
    const f = fecha(valor);
    return f ? `${f.slice(8, 10)}/${f.slice(5, 7)}` : '';
}

// El texto de vigencia que se muestra: "01/11 al 20/11", "Desde el 01/11", "Hasta el 20/11" o el texto viejo
export function textoDeVigencia(lote) {
    if (!lote || typeof lote !== 'object') return '';
    if (lote.tipo === 'siempre') return '';
    const desde = diaMes(lote.desde);
    const hasta = diaMes(lote.hasta);
    if (desde && hasta) return `${desde} al ${hasta}`;
    if (desde) return `Desde el ${desde}`;
    if (hasta) return `Hasta el ${hasta}`;
    return typeof lote.vigencia === 'string' ? lote.vigencia : '';
}

// Valida las fechas de un lote al crearlo o editarlo. Devuelve el problema o ''.
// Con `hoy` ('AAAA-MM-DD') no deja elegir días que ya pasaron, salvo los que el lote ya tenía guardados (`original`):
// al editar, una preventa que ya empezó o terminó conserva sus fechas.
export function validarFechasDeLote({ tipo, desde, hasta } = {}, { hoy = '', original = null } = {}) {
    if (tipo !== 'fechas') return '';
    if (!fecha(desde) || !fecha(hasta)) return 'Elegí desde y hasta qué día se vende el lote.';
    if (hasta < desde) return 'La fecha "hasta" tiene que ser igual o posterior a "desde".';
    const antes = original && typeof original === 'object' ? original : {};
    if (fecha(hoy) && desde < hoy && desde !== antes.desde) return 'La fecha "desde" ya pasó: elegí hoy o un día que venga.';
    if (fecha(hoy) && hasta < hoy && hasta !== antes.hasta) return 'La fecha "hasta" ya pasó: elegí hoy o un día que venga.';
    return '';
}

// Lugares que le quedan a un lote (capacidad menos vendidas; nunca menos de 0)
export function lugaresQueQuedan(lote) {
    const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    return lote && typeof lote === 'object' ? Math.max(0, n(lote.disponibles) - n(lote.vendidas)) : 0;
}

// Cómo está la venta del evento entero, para los avisos del sitio. Devuelve { estado, desde }:
//  'a-la-venta'   hay al menos un lote en fecha con lugares
//  'proximamente' ninguno a la venta todavía, pero alguno empieza más adelante (`desde` = el primer día)
//  'agotado'      no queda nada por vender y algún lote se quedó sin lugares
//  'terminada'    todos los lotes terminaron su fecha de venta
//  'sin-lotes'    el evento no tiene lotes
export function estadoDeVentaDelEvento(lotes, hoy) {
    const lista = Array.isArray(lotes) ? lotes.filter((l) => l && typeof l === 'object') : [];
    if (lista.length === 0) return { estado: 'sin-lotes', desde: '' };
    const estados = lista.map((l) => ({ estado: estadoDeLote(l, hoy), quedan: lugaresQueQuedan(l), desde: fecha(l.desde) }));
    if (estados.some((e) => e.estado === 'disponible' && e.quedan > 0)) return { estado: 'a-la-venta', desde: '' };
    const proximos = estados.filter((e) => e.estado === 'proximo' && e.quedan > 0).map((e) => e.desde).filter(Boolean).sort();
    if (proximos.length) return { estado: 'proximamente', desde: proximos[0] };
    if (estados.some((e) => e.quedan === 0)) return { estado: 'agotado', desde: '' };
    return { estado: 'terminada', desde: '' };
}
