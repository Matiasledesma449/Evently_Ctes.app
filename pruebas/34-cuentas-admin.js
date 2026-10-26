// Prueba de shared/cuentas-admin.js (cambio ajustes-tras-vista-previa): clave generada y qué hacer con cada correo.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const codigo = fs.readFileSync(path.join(__dirname, '..', 'shared', 'cuentas-admin.js'), 'utf8').replace(/^export /gm, '');
const A = vm.runInNewContext(codigo + '\n;({ generarClave, decidirAlta, normalizarCorreo, correoValido, crearUsuarioDeAuth })', { crypto: crypto.webcrypto, Uint32Array });

// Clave
const claves = Array.from({ length: 200 }, () => A.generarClave());
verificar('K1 la clave tiene 12 caracteres', claves.every((c) => c.length === 12));
verificar('K2 siempre tiene minúscula, mayúscula y número', claves.every((c) => /[a-z]/.test(c) && /[A-Z]/.test(c) && /[2-9]/.test(c)));
verificar('K3 no usa caracteres que se confunden (l, I, O, 0, 1)', claves.every((c) => !/[lIO01]/.test(c)));
verificar('K4 no se repiten', new Set(claves).size === claves.length);
verificar('K5 se puede pedir otro largo', A.generarClave(16).length === 16);
let falla = false;
try { A.generarClave(12, (a) => a.fill(0)); } catch (e) { falla = true; }
verificar('K6 si el azar no sirve, avisa en vez de devolver una clave débil', falla);

// Qué hacer con un correo
verificar('D1 correo sin cuenta: crear', A.decidirAlta(null, 'vali').accion === 'crear');
verificar('D2 cuenta de organización sin organización: vincular', A.decidirAlta({ rol: 'organizacion', organizacionId: '' }, 'vali').accion === 'vincular');
verificar('D3 ya es de esta organización: ya-esta', A.decidirAlta({ rol: 'organizacion', organizacionId: 'vali' }, 'vali').accion === 'ya-esta');
verificar('D4 es de OTRA organización: mover (se pide confirmar)', A.decidirAlta({ rol: 'organizacion', organizacionId: 'zavod' }, 'vali').accion === 'mover');
verificar('D5 un superadmin no puede ser admin de una organización', A.decidirAlta({ rol: 'superadmin' }, 'vali').accion === 'no-se-puede');
verificar('D6 una cuenta de comprador tampoco', A.decidirAlta({ rol: 'cliente' }, 'vali').accion === 'no-se-puede');
verificar('D7 una cuenta sin rol tampoco (no quedaría como admin)', A.decidirAlta({ organizacionId: '' }, 'vali').accion === 'no-se-puede');

// Correo
verificar('E1 el correo se compara sin espacios ni mayúsculas', A.normalizarCorreo('  Ana@Ejemplo.TEST ') === 'ana@ejemplo.test');
verificar('E2 correos válidos e inválidos', A.correoValido('a@b.co') && !A.correoValido('a@b') && !A.correoValido('') && !A.correoValido(null));

// Alta con la segunda app: no toca la sesión principal y cierra la de la segunda app
(async () => {
  const llamadas = [];
  const firebase = {
    apps: [],
    getApps() { return this.apps; },
    initializeApp(op, nombre) { const app = { name: nombre, op }; this.apps.push(app); llamadas.push('init:' + nombre); return app; },
    getAuth(app) { return { app }; },
    async createUserWithEmailAndPassword(auth, correo, clave) { llamadas.push(`alta:${auth.app.name}:${correo}`); return { user: { uid: 'uid-nuevo' } }; },
    async signOut(auth) { llamadas.push('salir:' + auth.app.name); },
  };
  const uid = await A.crearUsuarioDeAuth(firebase, { projectId: 'x' }, ' Nuevo@Ejemplo.test ', 'Clave123abc');
  verificar('F1 crea el usuario en la segunda app con el correo limpio y devuelve su uid', uid === 'uid-nuevo' && llamadas.includes('alta:altas-de-admins:nuevo@ejemplo.test'));
  verificar('F2 cierra la sesión de la segunda app (no la del superadmin)', llamadas[llamadas.length - 1] === 'salir:altas-de-admins');
  await A.crearUsuarioDeAuth(firebase, { projectId: 'x' }, 'otro@ejemplo.test', 'Clave123abc');
  verificar('F3 la segunda app se crea una sola vez', llamadas.filter((l) => l.startsWith('init:')).length === 1);
  const fallaAlta = { ...firebase, apps: [], async createUserWithEmailAndPassword() { throw new Error('auth/email-already-in-use'); }, async signOut() { llamadas.push('salir-tras-error'); } };
  let error = '';
  try { await A.crearUsuarioDeAuth(fallaAlta, {}, 'x@y.co', 'Clave123abc'); } catch (e) { error = e.message; }
  verificar('F4 si el alta falla, el error llega y la sesión de la segunda app igual se cierra', error === 'auth/email-already-in-use' && llamadas.includes('salir-tras-error'));
  verificar('F5 el módulo no usa innerHTML ni guarda la clave', !/innerHTML|localStorage|setDoc|addDoc/.test(codigo.replace(/\/\/.*$/gm, '')));

  console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
  process.exit(mal ? 1 : 0);
})();
