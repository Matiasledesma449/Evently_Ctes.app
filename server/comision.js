// server/comision.js
// Costo de servicio: el porcentaje que paga el comprador, aparte del precio de la entrada.
// Funciones puras (sin red ni base de datos). El porcentaje sale de la categoria que el superadmin
// le asigno al evento (`comisionCategoriaId`), guardada en `configuracion/comisiones`.

const PORCENTAJE_MAXIMO = 30;

const redondear2 = (n) => Math.round(n * 100) / 100;

// Devuelve la lista de categorias validas { id, nombre, porcentaje } del documento de configuracion.
// Lo que no sirve (sin id, porcentaje fuera de rango o no numerico) se descarta: nunca se cobra con eso.
function normalizarCategorias(config) {
  const lista = config && Array.isArray(config.categorias) ? config.categorias : [];
  const validas = [];
  for (const c of lista) {
    if (!c || typeof c !== 'object') continue;
    if (typeof c.id !== 'string' || c.id === '') continue;
    const porcentaje = typeof c.porcentaje === 'number' ? c.porcentaje : NaN;
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > PORCENTAJE_MAXIMO) continue;
    validas.push({ id: c.id, nombre: typeof c.nombre === 'string' ? c.nombre : '', porcentaje });
  }
  return validas;
}

// La categoria del evento: { id, nombre, porcentaje }, o null si no tiene (o ya no existe) = 0%.
function categoriaDelEvento(evento, config) {
  const id = evento && typeof evento.comisionCategoriaId === 'string' ? evento.comisionCategoriaId : '';
  if (!id) return null;
  return normalizarCategorias(config).find((c) => c.id === id) || null;
}

// Costo de servicio sobre el total de la compra (no por entrada: asi no se acumulan redondeos).
// Devuelve { subtotal, costoServicio, total }.
function calcularCostoServicio(subtotal, porcentaje) {
  const base = redondear2(Number(subtotal) || 0);
  const pct = Number(porcentaje);
  const costoServicio = Number.isFinite(pct) && pct > 0 ? redondear2((base * pct) / 100) : 0;
  return { subtotal: base, costoServicio, total: redondear2(base + costoServicio) };
}

module.exports = { PORCENTAJE_MAXIMO, normalizarCategorias, categoriaDelEvento, calcularCostoServicio };
