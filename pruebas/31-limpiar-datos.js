// Prueba de herramientas/limpiar-datos.js con una base falsa: sin red ni claves.
// (La base falsa de los pagos, _ayuda-db-falsa.js, no tiene batch ni limit: esta es propia y mínima.)
const path = require('path');

// Lo que usa la herramienta, al estilo de firebase-admin: collection(nombre).get(), .limit(n).get(), batch().delete(ref), commit()
function crearDbFalsa(datos) {
  const colecciones = {};
  for (const [nombre, ids] of Object.entries(datos)) colecciones[nombre] = new Set(ids);
  const snap = (nombre, ids) => ({ size: ids.length, docs: ids.map((id) => ({ id, ref: { nombre, id } })) });
  return {
    colecciones,
    collection(nombre) {
      const lista = () => [...(colecciones[nombre] || [])];
      return { get: async () => snap(nombre, lista()), limit: (n) => ({ get: async () => snap(nombre, lista().slice(0, n)) }) };
    },
    batch() {
      const pendientes = [];
      return { delete: (ref) => pendientes.push(ref), commit: async () => pendientes.forEach((ref) => colecciones[ref.nombre].delete(ref.id)) };
    },
  };
}
const H = require(path.join(__dirname, '..', 'herramientas', 'limpiar-datos.js'));

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

const nueva = () => crearDbFalsa({
  eventos: ['e1', 'e2'], ventas: Array.from({ length: 905 }, (_, i) => 'v' + i), solicitudes_eventos: ['s1'],
  usuarios: ['u1', 'u2'], configuracion: ['comisiones'], organizaciones: ['o1'],
});
const tamanos = (db) => Object.fromEntries(Object.entries(db.colecciones).map(([k, v]) => [k, v.size]));

(async () => {
  // Argumentos
  verificar('A1 sin argumentos: las tres colecciones, sin borrar', JSON.stringify(H.leerArgumentos([])) === JSON.stringify({ colecciones: ['eventos', 'ventas', 'solicitudes_eventos'], borrar: false }));
  verificar('A2 --solo ventas --borrar', JSON.stringify(H.leerArgumentos(['--solo', 'ventas', '--borrar'])) === JSON.stringify({ colecciones: ['ventas'], borrar: true }));
  verificar('A3 --solo usuarios se rechaza', !!H.leerArgumentos(['--solo', 'usuarios']).error);
  verificar('A4 --solo con una colección desconocida o sin nombre se rechaza', !!H.leerArgumentos(['--solo', 'otra']).error && !!H.leerArgumentos(['--solo']).error);

  // Vista previa: no borra
  let db = nueva(); let preguntas = 0; const salida = [];
  await H.limpiar({ db, ...H.leerArgumentos([]), preguntar: async () => { preguntas++; return H.FRASE; }, escribir: (t) => salida.push(t) });
  verificar('B1 la vista previa no borra nada ni pregunta la frase', tamanos(db).ventas === 905 && tamanos(db).eventos === 2 && preguntas === 0);
  verificar('B2 la vista previa informa cuántos documentos hay', salida.some((l) => /ventas: 905/.test(l)) && salida.some((l) => /no se borró nada/i.test(l)));

  // Frase equivocada: no borra
  db = nueva();
  await H.limpiar({ db, ...H.leerArgumentos(['--borrar']), preguntar: async () => 'borrar datos de prueba', escribir: () => {} });
  verificar('C1 con la frase equivocada (otra mayúscula) no borra nada', tamanos(db).ventas === 905 && tamanos(db).eventos === 2);

  // Confirmación correcta: borra solo las tres colecciones (también más de una tanda)
  db = nueva();
  const r = await H.limpiar({ db, ...H.leerArgumentos(['--borrar']), preguntar: async () => '  ' + H.FRASE + ' ', escribir: () => {} });
  const t = tamanos(db);
  verificar('D1 con la frase correcta vacía eventos, ventas (905, en varias tandas) y solicitudes', t.eventos === 0 && t.ventas === 0 && t.solicitudes_eventos === 0 && r.borrados.ventas === 905);
  verificar('D2 conserva usuarios, configuracion y organizaciones', t.usuarios === 2 && t.configuracion === 1 && t.organizaciones === 1);

  // --solo: solo esa colección
  db = nueva();
  await H.limpiar({ db, ...H.leerArgumentos(['--solo', 'ventas', '--borrar']), preguntar: async () => H.FRASE, escribir: () => {} });
  verificar('E1 --solo ventas borra solo las ventas', tamanos(db).ventas === 0 && tamanos(db).eventos === 2 && tamanos(db).solicitudes_eventos === 1);

  // Nunca una colección protegida, aunque se la pasen directo
  let rechazo = false;
  try { await H.limpiar({ db: nueva(), colecciones: ['usuarios'], borrar: true, preguntar: async () => H.FRASE, escribir: () => {} }); } catch (e) { rechazo = true; }
  verificar('F1 pedir borrar usuarios directamente da error y no borra', rechazo);

  console.log(mal ? `\n${mal} verificaciones fallaron` : '\nTodas las verificaciones pasaron');
  process.exit(mal ? 1 : 0);
})();
