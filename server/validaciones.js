// server/validaciones.js
// Validacion del pedido de compra que llega desde el navegador.
// Solo se copian los campos permitidos: cualquier otro dato que venga
// (precio, monto, estado, etc.) se ignora y nunca llega a la venta.

const { MAX_ENTRADAS_POR_COMPRA } = require('./config');

const ID_EVENTO = /^[A-Za-z0-9_-]{1,128}$/;
// Letras (con tildes), espacios, apostrofe, punto y guion. Sin numeros ni simbolos raros.
const NOMBRE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function limpiarTexto(valor) {
  return typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : '';
}

// Devuelve { ok: true, datos } o { ok: false, errores: [{ campo, mensaje }] }.
function validarPedido(cuerpo) {
  const errores = [];
  const falla = (campo, mensaje) => errores.push({ campo, mensaje });

  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return { ok: false, errores: [{ campo: 'pedido', mensaje: 'No pudimos leer tu pedido. Volvé a intentarlo.' }] };
  }

  const eventoId = typeof cuerpo.eventoId === 'string' ? cuerpo.eventoId.trim() : '';
  if (!ID_EVENTO.test(eventoId)) falla('eventoId', 'No encontramos el evento. Volvé a abrirlo desde la página de inicio.');

  const loteIndex = cuerpo.loteIndex;
  if (!Number.isInteger(loteIndex) || loteIndex < 0 || loteIndex > 99) falla('loteIndex', 'Elegí un lote.');

  let loteNombre = null;
  if (cuerpo.loteNombre !== undefined && cuerpo.loteNombre !== null) {
    loteNombre = limpiarTexto(cuerpo.loteNombre);
    if (loteNombre === '' || loteNombre.length > 120) falla('loteNombre', 'Elegí un lote.');
  }

  const cantidad = cuerpo.cantidad;
  if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_ENTRADAS_POR_COMPRA) {
    falla('cantidad', `Elegí entre 1 y ${MAX_ENTRADAS_POR_COMPRA} entradas (un número entero).`);
  }

  const nombre = limpiarTexto(cuerpo.nombre);
  if (nombre === '') falla('nombre', 'Escribí tu nombre.');
  else if (nombre.length > 60 || !NOMBRE.test(nombre)) falla('nombre', 'Revisá tu nombre: solo letras, hasta 60 caracteres.');

  const apellido = limpiarTexto(cuerpo.apellido);
  if (apellido === '') falla('apellido', 'Escribí tu apellido.');
  else if (apellido.length > 60 || !NOMBRE.test(apellido)) falla('apellido', 'Revisá tu apellido: solo letras, hasta 60 caracteres.');

  const correo = limpiarTexto(cuerpo.correo).toLowerCase();
  if (correo === '') falla('correo', 'Escribí tu correo electrónico.');
  else if (correo.length > 254 || !CORREO.test(correo)) falla('correo', 'El correo no parece válido. Revisalo (por ejemplo nombre@correo.com).');

  if (errores.length > 0) return { ok: false, errores };

  // Solo estos campos pasan. Nada de precio, monto ni estado.
  return { ok: true, datos: { eventoId, loteIndex, loteNombre, cantidad, nombre, apellido, correo } };
}

module.exports = { validarPedido };
