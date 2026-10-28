// Prueba de la seguridad de ventas por organización (cambio seguridad-ventas-por-organizacion):
// herramientas/completar-organizacion-de-ventas.js con una base falsa, shared/consulta-ventas.js y que el servidor
// guarde la organización en cada venta nueva. Sin red ni claves.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const RAIZ = path.join(__dirname, '..');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// Base falsa mínima al estilo de firebase-admin: collection().get(), collection().doc(id), batch().update(ref, datos)
function crearDbFalsa(datos) {
  const cols = JSON.parse(JSON.stringify(datos));
  return {
    cols,
    collection(nombre) {
      return {
        get: async () => ({ docs: Object.entries(cols[nombre] || {}).map(([id, d]) => ({ id, data: () => d })) }),
        doc: (id) => ({ nombre, id }),
      };
    },
    batch() {
      const pendientes = [];
      return { update: (ref, d) => pendientes.push([ref, d]), commit: async () => pendientes.forEach(([ref, d]) => Object.assign(cols[ref.nombre][ref.id], d)) };
    },
  };
}
const H = require(path.join(RAIZ, 'herramientas', 'completar-organizacion-de-ventas.js'));
const json = (x) => JSON.stringify(x);

const datos = {
  eventos: { E1: { organizacionId: 'vali' }, E2: { organizacionId: 'norte' }, E3: {} },
  ventas: {
    V1: { eventoId: 'E1' },                              // sin organización: se completa
    V2: { eventoId: 'E1', organizacionId: 'vali' },      // ya está bien
    V3: { eventoId: 'E2', organizacionId: 'vali' },      // el evento cambió de organización: se corrige
    V4: { eventoId: 'BORRADO' },                         // evento que ya no existe: no se toca
    V5: { eventoId: 'E3' },                              // evento sin organización: no se toca
  },
};

(async () => {
  const r = H.cambiosNecesarios(Object.entries(datos.ventas).map(([id, v]) => ({ id, ...v })), Object.entries(datos.eventos).map(([id, e]) => ({ id, ...e })));
  verificar('H1 detecta las que faltan y las que cambiaron', json(r.cambios) === json([{ id: 'V1', de: '', a: 'vali' }, { id: 'V3', de: 'vali', a: 'norte' }]), json(r.cambios));
  verificar('H2 cuenta aparte las de eventos borrados o sin organización', r.sinEvento === 1 && r.eventoSinOrganizacion === 1);

  let db = crearDbFalsa(datos); let preguntas = 0; const salida = [];
  await H.completar({ db, aplicar: false, preguntar: async () => { preguntas++; return H.FRASE; }, escribir: (t) => salida.push(t) });
  verificar('H3 vista previa: no escribe ni pregunta', !db.cols.ventas.V1.organizacionId && preguntas === 0 && salida.some((t) => /no se escribió nada/.test(t)));

  db = crearDbFalsa(datos);
  await H.completar({ db, aplicar: true, preguntar: async () => 'otra cosa', escribir: () => {} });
  verificar('H4 sin la frase exacta no escribe', !db.cols.ventas.V1.organizacionId);

  db = crearDbFalsa(datos);
  const res = await H.completar({ db, aplicar: true, preguntar: async () => H.FRASE, escribir: () => {} });
  verificar('H5 con la frase completa y corrige, sin tocar las demás',
    res.escritas === 2 && db.cols.ventas.V1.organizacionId === 'vali' && db.cols.ventas.V3.organizacionId === 'norte'
    && db.cols.ventas.V4.organizacionId === undefined && db.cols.ventas.V5.organizacionId === undefined);
  verificar('H6 solo cambia organizacionId', json(Object.keys(db.cols.ventas.V1).sort()) === json(['eventoId', 'organizacionId']));

  // El servidor guarda la organización del evento en cada venta nueva
  const fuenteVentas = fs.readFileSync(path.join(RAIZ, 'server', 'ventas.js'), 'utf8');
  verificar('S1 crearVentaPendiente guarda organizacionId del evento', /organizacionId: typeof evento\.organizacionId === 'string'/.test(fuenteVentas));

  // Las pantallas del panel de una organización piden solo sus ventas (la regla de Firestore lo exige en la consulta)
  const C = vm.runInNewContext(fs.readFileSync(path.join(RAIZ, 'shared', 'consulta-ventas.js'), 'utf8')
    .replace(/^import .*$/gm, '').replace(/^export /gm, '') + '\n;({ condicionesDeOrganizacion })');
  verificar('C1 superadmin: sin condición extra', json(C.condicionesDeOrganizacion({ rol: 'superadmin' })) === json([]));
  verificar('C2 organización: su organizacionId', json(C.condicionesDeOrganizacion({ rol: 'organizacion', organizacionId: ' vali ' })) === json([['organizacionId', '==', 'vali']]));
  verificar('C3 sin organización ni perfil: una condición que no trae nada', json(C.condicionesDeOrganizacion({ rol: 'organizacion' })) === json([['organizacionId', '==', '(sin organización)']]) && json(C.condicionesDeOrganizacion(null)) === json([['organizacionId', '==', '(sin organización)']]));
  for (const pagina of ['dashboard', 'ventas', 'reportes', 'eventos']) {
    const html = fs.readFileSync(path.join(RAIZ, 'admin', pagina + '.html'), 'utf8');
    verificar(`P ${pagina}: las consultas de ventas pasan por consultaDeVentas`, /consultaDeVentas\(/.test(html) && !/collection\(db, ["']ventas["']\)/.test(html));
  }

  console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
  process.exit(mal ? 1 : 0);
})();
