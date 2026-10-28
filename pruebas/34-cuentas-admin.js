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
const A = vm.runInNewContext(codigo + '\n;({ generarClave, validarClave, decidirAlta, normalizarCorreo, correoValido })', { crypto: crypto.webcrypto, Uint32Array });

// Clave
const claves = Array.from({ length: 200 }, () => A.generarClave());
verificar('K1 la clave tiene 12 caracteres', claves.every((c) => c.length === 12));
verificar('K2 siempre tiene minúscula, mayúscula, número y símbolo', claves.every((c) => /[a-z]/.test(c) && /[A-Z]/.test(c) && /[2-9]/.test(c) && /[!#$%*?]/.test(c)));
verificar('K2b la clave generada pasa la validación', claves.every((c) => A.validarClave(c) === ''));
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
verificar('D4 es de OTRA organización: no se mueve (en-otra)', A.decidirAlta({ rol: 'organizacion', organizacionId: 'zavod' }, 'vali').accion === 'en-otra');
verificar('D5 un superadmin no puede ser admin de una organización', A.decidirAlta({ rol: 'superadmin' }, 'vali').accion === 'no-se-puede');
verificar('D6 una cuenta de comprador tampoco', A.decidirAlta({ rol: 'cliente' }, 'vali').accion === 'no-se-puede');
verificar('D7 una cuenta sin rol tampoco (no quedaría como admin)', A.decidirAlta({ organizacionId: '' }, 'vali').accion === 'no-se-puede');

// Clave escrita por el superadmin
verificar('C1 una clave buena se acepta', A.validarClave('Bali2026!') === '');
verificar('C2 corta, sin mayúscula, sin número, sin símbolo o con espacios: se rechaza', ['Ab1!', 'bali2026!', 'Baliiiii!', 'Bali2026', 'Bali 2026!'].every((c) => A.validarClave(c) !== ''));

// Correo
verificar('E1 el correo se compara sin espacios ni mayúsculas', A.normalizarCorreo('  Ana@Ejemplo.TEST ') === 'ana@ejemplo.test');
verificar('E2 correos válidos e inválidos', A.correoValido('a@b.co') && !A.correoValido('a@b') && !A.correoValido('') && !A.correoValido(null));

(async () => {
  verificar('F5 el módulo no usa innerHTML, no guarda la clave y no crea cuentas (lo hace el servidor)', !/innerHTML|localStorage|setDoc|addDoc|createUserWithEmailAndPassword/.test(codigo.replace(/\/\/.*$/gm, '')));

  console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
  process.exit(mal ? 1 : 0);
})();
