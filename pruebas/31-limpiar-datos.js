// Prueba de herramientas/limpiar-datos.js con una base falsa: vista previa, frase equivocada y confirmación correcta.
// Sin red y sin la base de datos real.
const { limpiar, leerArgumentos } = require('../herramientas/limpiar-datos.js');

let mal = 0;
const verificar = (nombre, condicion, detalle = '') => {
  if (!condicion) mal++;
  console.log((condicion ? 'OK  ' : 'MAL ') + nombre + (detalle && !condicion ? '  -> ' + detalle : ''));
};

// Base falsa mínima: collection().get() con docs y ref, y batch().delete()/commit().
function baseFalsa() {
  const datos = {
    eventos: { e1: {}, e2: {} },
    ventas: { v1: {}, v2: {}, v3: {} },
    solicitudes_eventos: { s1: {} },
    usuarios: { u1: {} },
    configuracion: { comisiones: {} },
    organizaciones: { o1: {} },
  };
  const db = {
    collection: (col) => ({
      async get() { return { docs: Object.keys(datos[col]).map((id) => ({ id, ref: { col, id } })) }; },
    }),
    batch() {
      const ops = [];
      return { delete(ref) { ops.push(ref); }, async commit() { ops.forEach((r) => delete datos[r.col][r.id]); } };
    },
  };
  return { db, datos };
}
const cantidades = (datos) => Object.fromEntries(Object.keys(datos).map((c) => [c, Object.keys(datos[c]).length]));
const correr = async (argv, respuesta) => {
  const { db, datos } = baseFalsa();
  const mensajes = [];
  const r = await limpiar({ db, argv, preguntar: async () => respuesta, escribir: (t) => mensajes.push(t) });
  return { r, datos, mensajes: mensajes.join('\n') };
};

(async () => {
  // Vista previa: no borra y avisa cuántos hay
  let x = await correr([], 'BORRAR TODO');
  verificar('vista previa no borra nada', JSON.stringify(cantidades(x.datos)) === JSON.stringify({ eventos: 2, ventas: 3, solicitudes_eventos: 1, usuarios: 1, configuracion: 1, organizaciones: 1 }));
  verificar('vista previa informa las cantidades', /ventas: 3/.test(x.mensajes) && /eventos: 2/.test(x.mensajes));

  // Frase equivocada: no borra
  x = await correr(['--borrar'], 'borrar');
  verificar('frase equivocada no borra', cantidades(x.datos).ventas === 3 && cantidades(x.datos).eventos === 2);
  verificar('frase equivocada termina con error', x.r.codigo === 1);

  // Confirmación correcta: borra solo las tres colecciones
  x = await correr(['--borrar'], 'BORRAR TODO');
  const c = cantidades(x.datos);
  verificar('confirmación correcta vacía las tres colecciones', c.eventos === 0 && c.ventas === 0 && c.solicitudes_eventos === 0);
  verificar('conserva usuarios, configuracion y organizaciones', c.usuarios === 1 && c.configuracion === 1 && c.organizaciones === 1);
  verificar('informa lo borrado', x.r.borrados.ventas === 3 && /Borrados de ventas: 3/.test(x.mensajes));

  // --solo: una sola colección
  x = await correr(['--borrar', '--solo', 'ventas'], 'BORRAR TODO');
  verificar('--solo borra solo esa colección', cantidades(x.datos).ventas === 0 && cantidades(x.datos).eventos === 2 && cantidades(x.datos).solicitudes_eventos === 1);

  // Argumentos inválidos
  verificar('--solo con colección protegida da error', !!leerArgumentos(['--solo', 'usuarios']).error);
  verificar('argumento desconocido da error', !!leerArgumentos(['--todo']).error);
  x = await correr(['--solo', 'organizaciones', '--borrar'], 'BORRAR TODO');
  verificar('no borra nada si el argumento es inválido', cantidades(x.datos).organizaciones === 1 && x.r.codigo === 1);

  process.exit(mal ? 1 : 0);
})();
