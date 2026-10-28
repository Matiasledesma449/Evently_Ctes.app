// Prueba de server/validador.js (/api/validador): el enlace de la puerta y la validación de entradas en el servidor.
// Sin red ni Firebase: base y Auth falsos. Comprueba que una entrada se usa una sola vez y que cada organización
// valida solo las suyas.
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..');
const { validador, armarClave, leerClave, compradorCorto } = require(path.join(RAIZ, 'server', 'validador.js'));

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const SECRETO = Buffer.from('secreto-de-prueba');
const AHORA = Date.UTC(2026, 9, 28, 22, 0, 0);

function falsos() {
  const datos = {
    usuarios: { 'u-super': { rol: 'superadmin' }, 'u-org': { rol: 'organizacion', organizacionId: 'vali' }, 'u-suelto': { rol: 'organizacion' } },
    ventas: {
      V1: { estado: 'confirmada', organizacionId: 'vali', eventoNombre: 'Fiesta', loteNombre: 'General', nombre: 'Ana', apellido: 'pérez',
        entradas: [{ codigo: 'ENT-aaa111', usado: false }, { codigo: 'ENT-bbb222', usado: false }] },
      V2: { estado: 'confirmada', organizacionId: 'otra', eventoNombre: 'Otra', entradas: [{ codigo: 'ENT-ccc333', usado: false }] },
      V3: { estado: 'pendiente', organizacionId: 'vali', entradas: [{ codigo: 'ENT-ddd444', usado: false }] },
      V4: { estado: 'confirmada', eventoId: 'EV-vali', entradas: [{ codigo: 'ENT-eee555', usado: false }] },
    },
    eventos: { 'EV-vali': { organizacionId: 'vali' } },
  };
  const ref = (c, id) => ({ c, id, async get() { const d = (datos[c] || {})[id]; return { exists: Boolean(d), data: () => d && JSON.parse(JSON.stringify(d)) }; } });
  const iguales = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const db = {
    collection: (c) => ({
      doc: (id) => ref(c, id),
      where: (campo, op, valor) => ({
        limit: () => ({
          async get() {
            const docs = Object.keys(datos[c] || {}).filter((id) => op === 'array-contains' && (datos[c][id][campo] || []).some((x) => iguales(x, valor)))
              .map((id) => ({ id, ref: ref(c, id) }));
            return { docs };
          },
        }),
      }),
    }),
    // Transacción simple: aplica las escrituras al final
    async runTransaction(fn) {
      const pendientes = [];
      const r = await fn({ get: (x) => x.get(), update: (x, d) => pendientes.push([x, d]) });
      pendientes.forEach(([x, d]) => { datos[x.c][x.id] = { ...datos[x.c][x.id], ...d }; });
      return r;
    },
  };
  const auth = { verifyIdToken: async (t) => { const u = { 'tok-super': 'u-super', 'tok-org': 'u-org', 'tok-suelto': 'u-suelto' }[t]; if (!u) throw new Error('token'); return { uid: u }; } };
  return { datos, deps: { db, auth, secreto: SECRETO, ahoraMs: () => AHORA, sello: () => ({ seconds: AHORA / 1000 }) } };
}
const enlace = (f, token) => validador({ headers: token ? { authorization: 'Bearer ' + token } : {}, cuerpo: { accion: 'enlace' } }, f.deps);
const validar = (f, clave, codigo) => validador({ headers: {}, cuerpo: { accion: 'validar', clave, codigo } }, f.deps);

(async () => {
  // ---------- Enlace ----------
  let f = falsos();
  verificar('E1 sin sesión no se arma el enlace', (await enlace(f, null)).status === 401 && (await enlace(f, 'tok-malo')).status === 401);
  verificar('E2 una cuenta sin organización no puede', (await enlace(f, 'tok-suelto')).status === 403);
  const deOrg = await enlace(f, 'tok-org');
  const deSuper = await enlace(f, 'tok-super');
  verificar('E3 la organización recibe una clave suya que vence en 7 días', deOrg.status === 200 && leerClave(deOrg.cuerpo.clave, SECRETO, AHORA).datos.o === 'vali'
    && deOrg.cuerpo.vence === new Date(AHORA + 7 * 86400000).toISOString() && deOrg.cuerpo.todas === false);
  verificar('E4 el superadmin recibe una clave para todas', deSuper.status === 200 && deSuper.cuerpo.todas === true && leerClave(deSuper.cuerpo.clave, SECRETO, AHORA).datos.o === '*');

  // ---------- Clave ----------
  const clave = deOrg.cuerpo.clave;
  const [contenido, firma] = clave.split('.');
  const trucha = Buffer.from(JSON.stringify({ o: '*', x: AHORA + 1e9 })).toString('base64url') + '.' + firma;
  verificar('K1 una clave cambiada a mano (para ver todas) no sirve', (await validar(f, trucha, 'ENT-aaa111')).cuerpo.error.codigo === 'ENLACE_INVALIDO');
  verificar('K2 sin clave o con basura no sirve', (await validar(f, '', 'ENT-aaa111')).status === 401 && (await validar(f, 'x.y.z', 'ENT-aaa111')).status === 401);
  const vencida = armarClave({ o: 'vali', x: AHORA - 1 }, SECRETO);
  verificar('K3 una clave vencida avisa que venció', (await validar(f, vencida, 'ENT-aaa111')).cuerpo.error.codigo === 'ENLACE_VENCIDO');
  verificar('K4 firmada con otro secreto no sirve', leerClave(armarClave({ o: 'vali', x: AHORA + 1000 }, Buffer.from('otro')), SECRETO, AHORA).ok === false && contenido.length > 0);

  // ---------- Validar ----------
  const r1 = await validar(f, clave, 'ENT-aaa111');
  verificar('V1 entrada buena: pasa y dice evento, lote, comprador y número', r1.status === 200 && r1.cuerpo.ok && r1.cuerpo.evento === 'Fiesta' && r1.cuerpo.lote === 'General'
    && r1.cuerpo.comprador === 'Ana P.' && r1.cuerpo.numero === '1 de 2', JSON.stringify(r1.cuerpo));
  verificar('V2 queda marcada usada con su forma exacta { codigo, usado } y el momento aparte', JSON.stringify(f.datos.ventas.V1.entradas[0]) === '{"codigo":"ENT-aaa111","usado":true}'
    && f.datos.ventas.V1.validaciones['ENT-aaa111'].seconds === AHORA / 1000 && f.datos.ventas.V1.entradas[1].usado === false);
  const r2 = await validar(f, clave, 'ENT-aaa111');
  verificar('V3 la misma entrada otra vez: YA USADA, con cuándo se usó', r2.status === 409 && r2.cuerpo.error.codigo === 'YA_USADA' && r2.cuerpo.usadaEn === new Date(AHORA).toISOString(), JSON.stringify(r2.cuerpo));
  verificar('V4 un código que no existe: no pasa', (await validar(f, clave, 'ENT-zzz999')).cuerpo.error.codigo === 'NO_EXISTE');
  verificar('V5 un código raro (con símbolos o muy largo) no se busca', (await validar(f, clave, '<script>')).cuerpo.error.codigo === 'NO_EXISTE' && (await validar(f, clave, 'A'.repeat(200))).cuerpo.error.codigo === 'NO_EXISTE');
  const r6 = await validar(f, clave, 'ENT-ccc333');
  verificar('V6 una entrada de otra organización no pasa, no se marca y no muestra datos', r6.status === 403 && !r6.cuerpo.evento && f.datos.ventas.V2.entradas[0].usado === false);
  verificar('V7 una compra sin pagar no pasa', (await validar(f, clave, 'ENT-ddd444')).cuerpo.error.codigo === 'NO_CONFIRMADA' && f.datos.ventas.V3.entradas[0].usado === false);
  verificar('V8 el enlace del superadmin valida entradas de cualquier organización', (await validar(f, deSuper.cuerpo.clave, 'ENT-ccc333')).status === 200);
  verificar('V8b una venta vieja sin organización toma la de su evento', (await validar(f, clave, 'ENT-eee555')).status === 200 && f.datos.ventas.V4.entradas[0].usado === true);
  verificar('V9 una acción desconocida se rechaza', (await validador({ headers: {}, cuerpo: { accion: 'borrar' } }, f.deps)).status === 400);
  verificar('V10 comprador corto sin apellido o vacío', compradorCorto({ nombre: 'Luis' }) === 'Luis' && compradorCorto({}) === '');

  // ---------- Páginas ----------
  const html = fs.readFileSync(path.join(RAIZ, 'validador.html'), 'utf8');
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\/.*$/gm, '');
  verificar('P1 validador.html ya no lee ni escribe la base: valida con /api/validador', /\/api\/validador/.test(html) && !/updateDoc|getDocs|collection\(db/.test(sinComentarios));
  verificar('P2 validador.html no pone el código escaneado como HTML', !/innerHTML\s*=\s*`[^`]*\$\{qrData\}/.test(html) && /function mostrarResultado/.test(html));
  const escaner = fs.readFileSync(path.join(RAIZ, 'admin', 'escaner.html'), 'utf8');
  verificar('P3 Escáner arma el enlace con la clave del servidor', /accion: 'enlace'/.test(escaner) && /validador\.html#clave=/.test(escaner));

  console.log(mal === 0 ? '\nTodo OK.' : '\nHay ' + mal + ' problema(s).');
  process.exit(mal === 0 ? 0 : 1);
})();
