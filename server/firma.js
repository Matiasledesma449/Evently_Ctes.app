// server/firma.js
// Verifica que un aviso (webhook) venga de Mercado Pago de verdad.
// Es una funcion pura: no toca la red ni la base de datos, asi se prueba con `node -e`.
// Ver design.md, punto 7.

const crypto = require('crypto');

// Parte el encabezado `x-signature` ("ts=1700000000,v1=abc123...") en { ts, v1 }.
// Cada parte se separa en el PRIMER "=", y las partes desconocidas se ignoran.
function leerEncabezadoFirma(encabezado) {
  const partes = {};
  if (typeof encabezado !== 'string') return partes;
  for (const trozo of encabezado.split(',')) {
    const i = trozo.indexOf('=');
    if (i === -1) continue;
    const clave = trozo.slice(0, i).trim();
    const valor = trozo.slice(i + 1).trim();
    if (clave === 'ts' || clave === 'v1') partes[clave] = valor;
  }
  return partes;
}

const falta = (valor) => typeof valor !== 'string' || valor.trim() === '';

// Devuelve { ok: true } si la firma es correcta, o { ok: false, motivo } si no.
// `motivo` es solo para los registros del servidor: al navegador siempre se responde 401 generico.
//   xSignature: encabezado `x-signature`
//   xRequestId: encabezado `x-request-id`
//   dataId:     el `data.id` que viene en la direccion (?data.id=...), NO el del cuerpo
//   secreto:    MP_WEBHOOK_SECRET
function verificarFirma({ xSignature, xRequestId, dataId, secreto } = {}) {
  // Sin clave no se puede verificar nada: nunca se acepta un aviso "por las dudas"
  if (falta(secreto)) return { ok: false, motivo: 'sin_secreto' };

  const { ts, v1 } = leerEncabezadoFirma(xSignature);
  if (falta(ts)) return { ok: false, motivo: 'sin_ts' };
  if (falta(v1)) return { ok: false, motivo: 'sin_v1' };
  if (falta(xRequestId)) return { ok: false, motivo: 'sin_request_id' };
  if (dataId === undefined || dataId === null || String(dataId).trim() === '') {
    return { ok: false, motivo: 'sin_data_id' };
  }

  // Mercado Pago pide el id en minusculas si tiene letras; el de un pago es numerico y no cambia
  const id = String(dataId).trim().toLowerCase();
  const manifiesto = `id:${id};request-id:${xRequestId.trim()};ts:${ts};`;
  const esperada = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex');

  // timingSafeEqual exige el mismo largo: si difiere, ya es distinta (el largo del hash no es secreto)
  const recibida = Buffer.from(v1.toLowerCase(), 'utf8');
  const calculada = Buffer.from(esperada, 'utf8');
  if (recibida.length !== calculada.length) return { ok: false, motivo: 'firma_incorrecta' };
  if (!crypto.timingSafeEqual(recibida, calculada)) return { ok: false, motivo: 'firma_incorrecta' };

  return { ok: true };
}

module.exports = { verificarFirma, leerEncabezadoFirma };
