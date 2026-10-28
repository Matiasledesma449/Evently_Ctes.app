// Prueba de server/correos.js (pedido 23): el correo de confirmación de una compra.
// Sin red, sin Gmail y sin base de datos real (base falsa en memoria y un "transporte" de correo falso).
const path = require('path');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
process.env.SITE_URL = 'https://evently.ejemplo.test';
const C = require(path.join(__dirname, '..', 'server', 'correos.js'));

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const venta = {
  estado: 'confirmada', eventoId: 'E1', eventoNombre: 'Fiesta', nombre: '<b>Ana</b>', correo: 'ana@ejemplo.test',
  cantidad: 2, loteNombre: 'Preventa', monto_total: 24500, tokenConsulta: 'tok123',
  entradas: [{ codigo: 'EV-AAA', usado: false }, { codigo: 'EV-BBB', usado: false }],
};
const evento = { nombre: 'Fiesta <script>alert(1)</script>', fecha: 'Sáb 15 Nov · 21:00', lugar: 'Costanera' };

(async () => {
  // ---------- Armado del correo ----------
  const c = C.correoDeConfirmacion({ ventaId: 'V1', venta, evento, enlace: 'https://evently.ejemplo.test/public/confirmacion.html?id=V1&t=tok123', sitio: 'https://evently.ejemplo.test' });
  verificar('A1 asunto con el nombre del evento', c.asunto === '¡Listo! Tus entradas para Fiesta <script>alert(1)</script>');
  verificar('A2 el HTML escapa lo que escriben compradores y organizadores', !/<script>|<b>Ana<\/b>/.test(c.html) && /&lt;script&gt;/.test(c.html) && /&lt;b&gt;Ana/.test(c.html));
  verificar('A3 trae fecha, lugar, lote, total, número de compra y los dos códigos', ['Sáb 15 Nov', 'Costanera', '2 × Preventa', '$ 24.500', 'V1', 'EV-AAA', 'EV-BBB'].every((t) => c.html.includes(t)));
  verificar('A4 botón a la página de la compra con su token', c.html.includes('confirmacion.html?id=V1&amp;t=tok123'));
  verificar('A5 versión de solo texto con el enlace y los códigos', c.texto.includes('confirmacion.html?id=V1&t=tok123') && c.texto.includes('Entrada 2: EV-BBB'));
  verificar('A6 trae ayuda y arrepentimiento', c.html.includes('/public/soporte.html') && c.html.includes('/public/arrepentimiento.html'));

  // ---------- Envío ----------
  verificar('E1 sin las variables de Gmail no se manda nada (y no es error)', JSON.stringify(await C.enviarCorreo({ para: 'a@b.co', asunto: 'x', html: '', texto: '' }, { entorno: {} })) === JSON.stringify({ enviado: false, motivo: 'sin_configurar' }));
  const enviados = [];
  const transporte = { sendMail: async (m) => { enviados.push(m); } };
  verificar('E2 un correo inválido no se intenta', (await C.enviarCorreo({ para: 'no-es-correo', asunto: 'x' }, { transporte })).motivo === 'correo_invalido' && enviados.length === 0);
  const r = await C.enviarCorreo({ para: ' ana@ejemplo.test ', asunto: 'Hola', html: '<p>h</p>', texto: 'h' }, { transporte, entorno: { GMAIL_USUARIO: 'evently@ejemplo.test' } });
  verificar('E3 se manda desde "Evently" al comprador', r.enviado === true && enviados[0].to === 'ana@ejemplo.test' && enviados[0].from.name === 'Evently' && enviados[0].from.address === 'evently@ejemplo.test');
  const fallo = await C.enviarCorreo({ para: 'a@b.co', asunto: 'x' }, { transporte: { sendMail: async () => { const e = new Error('x'); e.code = 'EAUTH'; throw e; } } });
  verificar('E4 si Gmail falla no lanza: devuelve el motivo', fallo.enviado === false && fallo.motivo === 'fallo_envio' && fallo.codigo === 'EAUTH');

  // ---------- Después de confirmar la venta ----------
  const { db, datos } = crearDbFalsa({ ventas: { V1: venta }, eventos: { E1: evento } });
  const mandados = [];
  const enviar = async (m) => { mandados.push(m); return { enviado: true }; };
  const r1 = await C.enviarConfirmacion(db, 'V1', { enviar, registrar: () => {} });
  verificar('C1 manda la confirmación al correo de la compra', r1.enviado === true && mandados.length === 1 && mandados[0].para === 'ana@ejemplo.test' && mandados[0].html.includes('EV-AAA'));
  verificar('C2 deja anotado que se mandó', datos.ventas.V1.correoConfirmacion && datos.ventas.V1.correoConfirmacion.enviado === true);
  await C.enviarConfirmacion(db, 'V1', { enviar, registrar: () => {} });
  verificar('C3 no lo manda dos veces', mandados.length === 1);
  const { db: db2 } = crearDbFalsa({ ventas: { V2: { ...venta, estado: 'pendiente' } } });
  verificar('C4 una venta no confirmada no recibe correo', (await C.enviarConfirmacion(db2, 'V2', { enviar, registrar: () => {} })).motivo === 'no_corresponde' && mandados.length === 1);
  const logs = [];
  const { db: db3, datos: datos3 } = crearDbFalsa({ ventas: { V3: venta }, eventos: { E1: evento } });
  const r3 = await C.enviarConfirmacion(db3, 'V3', { enviar: async () => ({ enviado: false, motivo: 'fallo_envio' }), registrar: (...a) => logs.push(a) });
  verificar('C5 si el envío falla: no lanza, se registra y no se marca como enviado', r3.enviado === false && logs.length === 1 && !datos3.ventas.V3.correoConfirmacion);

  // ---------- El webhook lo llama solo al confirmar ----------
  const fuente = require('fs').readFileSync(path.join(__dirname, '..', 'server', 'webhook.js'), 'utf8');
  verificar('W1 el webhook manda la confirmación solo cuando la venta queda confirmada', /aplicado\.resultado === 'confirmada' && mandarConfirmacion/.test(fuente));

  console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
  process.exit(mal ? 1 : 0);
})();
