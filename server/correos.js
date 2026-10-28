// server/correos.js
// Correos de Evently (pedido 23). Hoy salen desde una cuenta de Gmail con una contraseña de aplicación, usando
// nodemailer (SMTP). Todo el envío está en este archivo: para pasar más adelante a un servicio pago (Resend, Brevo,
// Google Workspace) alcanza con cambiar `enviarCorreo`.
//
// Variables de entorno (las carga la persona en Vercel): GMAIL_USUARIO y GMAIL_CLAVE_APLICACION.
// Si faltan, no se manda nada y no es un error: la compra sigue igual.

const { siteUrl } = require('./config');
const { FieldValue } = require('./firestore');
// Arriba (y no dentro de una función) para que Vercel incluya nodemailer en la función del webhook
const nodemailer = require('nodemailer');

// Texto seguro para meter dentro del HTML del correo (los nombres los escriben compradores y organizadores)
function escapar(valor) {
  return String(valor === null || valor === undefined ? '' : valor)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const pesos = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR');
const VIOLETA = '#6d28d9';

// Esqueleto común de los correos: encabezado violeta, contenido y pie con ayuda y arrepentimiento
function plantilla({ titulo, contenidoHtml, sitio }) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f5f3ff;font-family:Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:${VIOLETA};padding:22px 28px;color:#ffffff;">
<div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">Evently</div>
<div style="font-size:15px;opacity:.9;margin-top:4px;">${escapar(titulo)}</div></td></tr>
<tr><td style="padding:26px 28px;font-size:15px;line-height:1.6;">${contenidoHtml}</td></tr>
<tr><td style="padding:18px 28px;background:#faf9ff;font-size:12px;color:#6b7280;line-height:1.5;">
¿Necesitás ayuda? Escribinos desde el <a href="${sitio}/public/soporte.html" style="color:${VIOLETA};">Centro de ayuda</a>.
Si te arrepentiste de la compra, tenés el <a href="${sitio}/public/arrepentimiento.html" style="color:${VIOLETA};">Botón de arrepentimiento</a>.<br>
© 2026 Evently by Bali Group · Recibís este correo porque compraste entradas en Evently.</td></tr>
</table></td></tr></table></body></html>`;
}

// Correo de confirmación de una compra (función pura: se prueba sin red).
// venta: el documento de la venta ya confirmada; evento: el del evento; enlace: la página con los QR de la compra.
function correoDeConfirmacion({ ventaId, venta, evento, enlace, sitio }) {
  const ev = evento || {};
  const nombreEvento = ev.nombre || venta.eventoNombre || 'tu evento';
  const entradas = Array.isArray(venta.entradas) ? venta.entradas : [];
  const cantidad = Number(venta.cantidad) || entradas.length;
  const filas = [
    ['Evento', nombreEvento],
    ['Fecha', ev.fecha || ''],
    ['Lugar', ev.lugar || ''],
    [cantidad === 1 ? 'Entrada' : 'Entradas', `${cantidad} × ${venta.loteNombre || 'General'}`],
    ['Total pagado', pesos(venta.monto_total)],
    ['Número de compra', ventaId],
  ].filter(([, valor]) => valor !== '');

  const tabla = filas.map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b7280;width:42%;">${escapar(k)}</td><td style="padding:6px 0;font-weight:600;">${escapar(v)}</td></tr>`).join('');
  const codigos = entradas.map((e, i) => `<li style="margin:2px 0;">Entrada ${i + 1}: <code style="background:#f3f4f6;padding:1px 6px;border-radius:4px;">${escapar(e && e.codigo)}</code></li>`).join('');
  const nombre = venta.nombre ? `Hola ${escapar(venta.nombre)},` : 'Hola,';

  const contenidoHtml = `<p style="margin:0 0 12px;">${nombre}</p>
<p style="margin:0 0 16px;"><strong>¡Tu compra está confirmada!</strong> Ya tenés tus entradas para <strong>${escapar(nombreEvento)}</strong>. Te esperamos.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:0 0 18px;">${tabla}</table>
<p style="text-align:center;margin:22px 0;"><a href="${escapar(enlace)}" style="background:${VIOLETA};color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:700;display:inline-block;">Ver mis entradas (códigos QR)</a></p>
${codigos ? `<p style="margin:0 0 6px;font-size:13px;color:#4b5563;">Tus códigos, por las dudas:</p><ul style="margin:0 0 16px;padding-left:20px;font-size:13px;">${codigos}</ul>` : ''}
<div style="background:#f5f3ff;border-radius:10px;padding:12px 14px;font-size:13px;color:#4b5563;">
<strong style="color:#1f2937;">Para el día del evento</strong><br>
• Mostrá el QR desde el celular en la entrada (no hace falta imprimirlo).<br>
• Cada código sirve para entrar <strong>una sola vez</strong>: no lo compartas ni lo publiques.<br>
• Llevá tu documento: el organizador puede pedirlo.</div>`;

  const texto = [
    venta.nombre ? `Hola ${venta.nombre},` : 'Hola,', '',
    `¡Tu compra está confirmada! Ya tenés tus entradas para ${nombreEvento}.`, '',
    ...filas.map(([k, v]) => `${k}: ${v}`), '',
    `Ver tus entradas (códigos QR): ${enlace}`, '',
    ...entradas.map((e, i) => `Entrada ${i + 1}: ${e && e.codigo}`), '',
    'Mostrá el QR desde el celular en la entrada. Cada código sirve una sola vez: no lo compartas.',
    `Ayuda: ${sitio}/public/soporte.html`,
  ].join('\n');

  return { asunto: `¡Listo! Tus entradas para ${nombreEvento}`, html: plantilla({ titulo: 'Tu compra está confirmada', contenidoHtml, sitio }), texto };
}

// Envía un correo. Devuelve { enviado: true } o { enviado: false, motivo }. Nunca lanza.
// `transporte` se puede reemplazar en las pruebas.
async function enviarCorreo({ para, asunto, html, texto }, { transporte = null, entorno = process.env } = {}) {
  const usuario = (entorno.GMAIL_USUARIO || '').trim();
  const clave = (entorno.GMAIL_CLAVE_APLICACION || '').replace(/\s+/g, '');
  if (!transporte && (!usuario || !clave)) return { enviado: false, motivo: 'sin_configurar' };
  if (typeof para !== 'string' || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(para.trim())) return { enviado: false, motivo: 'correo_invalido' };
  try {
    const t = transporte || nodemailer.createTransport({
      service: 'gmail', auth: { user: usuario, pass: clave },
      // Tiempos cortos: si Gmail tarda, se abandona el envío y el webhook le contesta igual a Mercado Pago
      connectionTimeout: 6000, greetingTimeout: 6000, socketTimeout: 8000,
    });
    await t.sendMail({ from: { name: 'Evently', address: usuario || 'no-responder@evently' }, to: para.trim(), subject: asunto, html, text: texto });
    return { enviado: true };
  } catch (e) {
    return { enviado: false, motivo: 'fallo_envio', codigo: e && (e.code || e.responseCode) };
  }
}

// Después de confirmar una venta: arma y manda el correo, y deja anotado que se mandó (para no repetirlo).
// Nunca lanza: si algo falla, la venta queda confirmada igual y se registra el motivo.
async function enviarConfirmacion(db, ventaId, { enviar = enviarCorreo, registrar = console.error } = {}) {
  try {
    const ventaRef = db.collection('ventas').doc(ventaId);
    const snap = await ventaRef.get();
    if (!snap.exists) return { enviado: false, motivo: 'venta_inexistente' };
    const venta = snap.data();
    if (venta.estado !== 'confirmada' || (venta.correoConfirmacion && venta.correoConfirmacion.enviado)) return { enviado: false, motivo: 'no_corresponde' };
    let evento = null;
    if (typeof venta.eventoId === 'string' && venta.eventoId) {
      const ev = await db.collection('eventos').doc(venta.eventoId).get();
      evento = ev.exists ? ev.data() : null;
    }
    const sitio = siteUrl();
    const enlace = `${sitio}/public/confirmacion.html?id=${encodeURIComponent(ventaId)}&t=${encodeURIComponent(venta.tokenConsulta || '')}`;
    const correo = correoDeConfirmacion({ ventaId, venta, evento, enlace, sitio });
    const resultado = await enviar({ para: venta.correo, ...correo });
    if (resultado.enviado) {
      await ventaRef.update({ correoConfirmacion: { enviado: true, fecha: FieldValue.serverTimestamp() } });
    } else if (resultado.motivo !== 'sin_configurar') {
      registrar('[correos] No se pudo mandar la confirmación', { ventaId, motivo: resultado.motivo, codigo: resultado.codigo });
    }
    return resultado;
  } catch (e) {
    registrar('[correos] Error al preparar la confirmación', { ventaId, error: e && e.name });
    return { enviado: false, motivo: 'error' };
  }
}

module.exports = { escapar, correoDeConfirmacion, enviarCorreo, enviarConfirmacion };
