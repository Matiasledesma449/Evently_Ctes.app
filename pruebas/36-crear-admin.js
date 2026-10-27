// Prueba de server/admins.js (/api/crear-admin): solo el superadmin crea admins, se valida todo y la clave no se guarda.
// Sin red ni Firebase: se usan una base y un Auth falsos.
const path = require('path');
const { crearAdmin, problemaDeClave, tokenDe } = require(path.join(__dirname, '..', 'server', 'admins.js'));

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

function falsos({ authUsuarios = {}, errorAlCrear = null } = {}) {
  const datos = {
    usuarios: { 'u-super': { rol: 'superadmin' }, 'u-org': { rol: 'organizacion', organizacionId: 'vali' }, 'u-viejo': { rol: 'organizacion' } },
    organizaciones: { vali: { nombre: 'Valigroup' }, vieja: { nombre: 'Vieja', eliminada: true } },
  };
  const escrituras = [];
  const db = {
    collection: (c) => ({ doc: (id) => ({
      get: async () => ({ exists: Boolean(datos[c] && datos[c][id]), data: () => (datos[c] || {})[id] }),
      set: async (d) => { escrituras.push({ c, id, d }); (datos[c] = datos[c] || {})[id] = d; },
    }) }),
  };
  const auth = {
    verifyIdToken: async (t) => { if (t === 'tok-super') return { uid: 'u-super' }; if (t === 'tok-org') return { uid: 'u-org' }; throw new Error('token'); },
    getUserByEmail: async (correo) => { if (authUsuarios[correo]) return authUsuarios[correo]; const e = new Error('no'); e.code = 'auth/user-not-found'; throw e; },
    createUser: async ({ email, password }) => { if (errorAlCrear) throw errorAlCrear; auth.creados.push({ email, largo: password.length }); return { uid: 'nuevo-' + email }; },
    creados: [],
  };
  return { deps: { db, auth, ahora: () => 'AHORA' }, escrituras, auth };
}
const pedir = (f, token, cuerpo) => crearAdmin({ headers: token ? { authorization: 'Bearer ' + token } : {}, cuerpo }, f.deps);
const bien = { correo: ' Duenio@Productora.TEST ', clave: 'Bali2026!', organizacionId: 'vali' };

(async () => {
  // Quién lo pide
  let f = falsos();
  verificar('Q1 sin sesión: 401', (await pedir(f, null, bien)).status === 401);
  verificar('Q2 token inválido: 401', (await pedir(f, 'otro', bien)).status === 401);
  verificar('Q3 una organización no puede crear admins: 403', (await pedir(f, 'tok-org', bien)).status === 403 && f.auth.creados.length === 0);

  // Qué pide
  verificar('V1 correo inválido: 400', (await pedir(f, 'tok-super', { ...bien, correo: 'x' })).cuerpo.error.codigo === 'CORREO_INVALIDO');
  verificar('V2 clave débil: 400', (await pedir(f, 'tok-super', { ...bien, clave: 'bali2026' })).cuerpo.error.codigo === 'CLAVE_INVALIDA');
  verificar('V3 organización eliminada o inexistente: 404', (await pedir(f, 'tok-super', { ...bien, organizacionId: 'vieja' })).status === 404 && (await pedir(f, 'tok-super', { ...bien, organizacionId: 'nada' })).status === 404);
  verificar('V4 id de organización raro: 400', (await pedir(f, 'tok-super', { ...bien, organizacionId: '../x' })).status === 400);
  verificar('V5 nada se creó con pedidos malos', f.auth.creados.length === 0 && f.escrituras.length === 0);

  // Alta
  const r = await pedir(f, 'tok-super', bien);
  verificar('A1 el superadmin crea la cuenta con el correo limpio', r.status === 200 && r.cuerpo.creada === true && f.auth.creados[0].email === 'duenio@productora.test');
  const escrito = f.escrituras[0] || {};
  verificar('A2 se guarda en usuarios como organización de Valigroup', escrito.c === 'usuarios' && escrito.d.rol === 'organizacion' && escrito.d.organizacionId === 'vali' && escrito.d.nombre === 'Valigroup');
  verificar('A3 la clave NO se guarda en usuarios', !JSON.stringify(f.escrituras).includes('Bali2026!'));

  // Correo con acceso pero sin cuenta de Evently: se vincula sin cambiarle la clave
  f = falsos({ authUsuarios: { 'suelto@x.co': { uid: 'u-suelto' } } });
  const r2 = await pedir(f, 'tok-super', { ...bien, correo: 'suelto@x.co' });
  verificar('B1 correo con acceso y sin cuenta: se vincula (creada = false) sin crear otro usuario', r2.status === 200 && r2.cuerpo.creada === false && f.auth.creados.length === 0 && f.escrituras[0].id === 'u-suelto');
  f = falsos({ authUsuarios: { 'org@x.co': { uid: 'u-org' } } });
  verificar('B2 correo que ya es cuenta de Evently: 409 y no escribe', (await pedir(f, 'tok-super', { ...bien, correo: 'org@x.co' })).status === 409 && f.escrituras.length === 0);

  // Errores de Firebase
  const sinPermiso = Object.assign(new Error('Caller does not have required permission'), { code: 'auth/insufficient-permission' });
  f = falsos({ errorAlCrear: sinPermiso });
  const r3 = await pedir(f, 'tok-super', bien);
  verificar('E1 sin permiso en Google Cloud: explica qué rol falta', r3.cuerpo.error.codigo === 'SIN_PERMISO_AUTH' && /Administrador de Firebase Authentication/.test(r3.cuerpo.error.mensaje));
  verificar('E2 si falla el alta no se escribe en usuarios', f.escrituras.length === 0);
  // Si falla guardar en usuarios, el acceso recién creado se borra (no queda una cuenta a medias)
  f = falsos();
  const borrados = [];
  f.deps.auth.deleteUser = async (uid) => { borrados.push(uid); };
  const dbOriginal = f.deps.db;
  f.deps.db = { collection: (c) => ({ doc: (id) => ({ get: dbOriginal.collection(c).doc(id).get, set: async () => { throw Object.assign(new Error('x'), { code: 'unavailable' }); } }) }) };
  const r4 = await pedir(f, 'tok-super', bien);
  verificar('E4 si no se puede guardar la cuenta, se borra el acceso creado y se avisa', r4.status === 500 && r4.cuerpo.error.codigo === 'ERROR_GUARDADO' && borrados.length === 1);
  // Un error inesperado de Firestore no hace caer la función
  f = falsos();
  f.deps.db = { collection: () => ({ doc: () => ({ get: async () => { throw new Error('caída'); } }) }) };
  const r5 = await pedir(f, 'tok-super', bien);
  verificar('E5 si Firestore falla, responde 500 con un mensaje claro (no lanza)', r5.status === 500 && r5.cuerpo.error.codigo === 'ERROR_INTERNO');
  const sinConfig = await crearAdmin({ headers: {}, cuerpo: bien }, null).catch(() => null);
  verificar('E3 sin configuración de Firebase responde 500 y no lanza', sinConfig && sinConfig.status === 500 && sinConfig.cuerpo.error.codigo === 'CONFIGURACION');

  // Ayudas
  verificar('H1 la regla de la clave es la misma del panel', problemaDeClave('Bali2026!') === '' && ['Ab1!', 'bali2026!', 'Bali2026', 'Bali 2026!'].every((c) => problemaDeClave(c) !== ''));
  verificar('H2 el token se lee de "Authorization: Bearer"', tokenDe({ authorization: 'Bearer abc' }) === 'abc' && tokenDe({}) === '' && tokenDe({ authorization: 'abc' }) === '');

  console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
  process.exit(mal ? 1 : 0);
})();
