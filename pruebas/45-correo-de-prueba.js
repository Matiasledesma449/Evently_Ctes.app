// Prueba de server/prueba-correo.js (pedido 23): solo el superadmin se manda el correo de ejemplo, a su propio correo.
// Sin red, sin Gmail y sin Firebase real.
const path = require('path');
const { crearDbFalsa, simularFirebaseAdmin } = require('./_ayuda-db-falsa');
simularFirebaseAdmin();
process.env.SITE_URL = 'https://evently.ejemplo.test';
const { mandarCorreoDePrueba } = require(path.join(__dirname, '..', 'server', 'prueba-correo.js'));

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const { db } = crearDbFalsa({ usuarios: { SUPER: { rol: 'superadmin' }, ORG: { rol: 'organizacion' } } });
const auth = { verifyIdToken: async (t) => { if (t === 'malo') throw new Error('x'); return { uid: t, email: t.toLowerCase() + '@ejemplo.test' }; } };
const pedido = (token) => ({ headers: token ? { authorization: `Bearer ${token}` } : {} });

(async () => {
  const enviados = [];
  const enviar = async (m) => { enviados.push(m); return { enviado: true }; };
  verificar('P1 sin sesión: 401', (await mandarCorreoDePrueba(pedido(''), { db, auth, enviar })).status === 401);
  verificar('P2 token inválido: 401', (await mandarCorreoDePrueba(pedido('malo'), { db, auth, enviar })).status === 401);
  verificar('P3 una organización no puede: 403', (await mandarCorreoDePrueba(pedido('ORG'), { db, auth, enviar })).status === 403 && enviados.length === 0);
  const r = await mandarCorreoDePrueba(pedido('SUPER'), { db, auth, enviar });
  verificar('P4 el superadmin lo recibe en su propio correo, marcado como prueba', r.status === 200 && enviados.length === 1 && enviados[0].para === 'super@ejemplo.test' && enviados[0].asunto.startsWith('[Prueba]') && enviados[0].html.includes('EV-PRUEBA-0001'));
  const sinGmail = await mandarCorreoDePrueba(pedido('SUPER'), { db, auth, enviar: async () => ({ enviado: false, motivo: 'sin_configurar' }) });
  verificar('P5 sin Gmail configurado lo dice', sinGmail.status === 500 && /GMAIL_USUARIO/.test(sinGmail.cuerpo.error.mensaje));
  const rechazo = await mandarCorreoDePrueba(pedido('SUPER'), { db, auth, enviar: async () => ({ enviado: false, motivo: 'fallo_envio', codigo: 'EAUTH' }) });
  verificar('P6 si Gmail rechaza la contraseña lo dice', rechazo.status === 502 && /contraseña de aplicación/.test(rechazo.cuerpo.error.mensaje));

  console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
  process.exit(mal ? 1 : 0);
})();
