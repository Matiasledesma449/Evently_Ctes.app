// Base de datos falsa en memoria, con la forma minima de Firestore que usa el servidor.
// Copia el comportamiento clave de las transacciones: todas las lecturas antes que las escrituras,
// y las escrituras se aplican juntas al final (o no se aplica ninguna si algo falla).
function crearDbFalsa(inicial = {}) {
  const datos = {};
  for (const col of Object.keys(inicial)) {
    datos[col] = {};
    for (const id of Object.keys(inicial[col])) datos[col][id] = structuredClone(inicial[col][id]);
  }
  const estado = { escrituras: 0, transacciones: 0, reintentos: 0, fallarAlConfirmar: null, fallarAlLeer: null };
  // Version de cada documento: sirve para imitar el bloqueo optimista de Firestore. Si otra transaccion
  // cambia un documento que ESTA leyo, al confirmar se detecta el choque y la transaccion se repite.
  const versiones = {};
  const clave = (col, id) => col + '/' + id;

  const instantanea = (col, id) => {
    const d = datos[col] && datos[col][id];
    return { exists: d !== undefined, id, data: () => (d === undefined ? undefined : structuredClone(d)) };
  };
  const aplicar = (w) => {
    datos[w.col] = datos[w.col] || {};
    if (w.tipo === 'set') datos[w.col][w.id] = structuredClone(w.d);
    else datos[w.col][w.id] = { ...(datos[w.col][w.id] || {}), ...structuredClone(w.d) };
    versiones[clave(w.col, w.id)] = (versiones[clave(w.col, w.id)] || 0) + 1;
    estado.escrituras++;
  };
  const ref = (col, id) => ({
    _col: col, _id: id,
    async get() { if (estado.fallarAlLeer) throw estado.fallarAlLeer; return instantanea(col, id); },
    async set(d) { aplicar({ tipo: 'set', col, id, d }); },
    async update(d) { aplicar({ tipo: 'update', col, id, d }); },
  });

  const db = {
    collection: (col) => ({ doc: (id) => ref(col, id || 'auto' + Math.random().toString(36).slice(2, 12)) }),
    async runTransaction(fn) {
      for (let intento = 0; intento < 6; intento++) {
        estado.transacciones++;
        const pendientes = [];
        const leidas = {}; // clave -> version que vio esta transaccion
        const tx = {
          async get(r) {
            if (pendientes.length) throw new Error('Firestore: las lecturas deben ir antes que las escrituras');
            if (estado.fallarAlLeer) throw estado.fallarAlLeer;
            await new Promise((x) => setImmediate(x)); // cede el turno: asi dos transacciones se pueden intercalar
            leidas[clave(r._col, r._id)] = versiones[clave(r._col, r._id)] || 0;
            return instantanea(r._col, r._id);
          },
          set(r, d) { pendientes.push({ tipo: 'set', col: r._col, id: r._id, d }); return tx; },
          update(r, d) { pendientes.push({ tipo: 'update', col: r._col, id: r._id, d }); return tx; },
        };
        const resultado = await fn(tx);
        if (estado.fallarAlConfirmar) throw estado.fallarAlConfirmar; // falla ANTES de aplicar: no queda nada a medias
        // Si alguien cambio un documento que leimos, Firestore repite la transaccion
        const choque = Object.keys(leidas).some((k) => (versiones[k] || 0) !== leidas[k]);
        if (choque) { estado.reintentos++; continue; }
        for (const w of pendientes) aplicar(w);
        return resultado;
      }
      throw new Error('Firestore: demasiados reintentos por contencion');
    },
  };
  return { db, datos, estado };
}

// Reemplaza `firebase-admin` por un doble minimo SOLO dentro de la prueba, para no instalar nada.
// El servidor lo carga con require('firebase-admin/app') y require('firebase-admin/firestore').
function simularFirebaseAdmin() {
  const Module = require('module');
  const cargar = Module._load;
  const marca = { __marca: 'serverTimestamp' };
  const dobles = {
    'firebase-admin/app': { initializeApp() {}, getApps: () => [], cert: (x) => x },
    'firebase-admin/firestore': {
      getFirestore() { throw new Error('La prueba no debe usar la base de datos real'); },
      FieldValue: { serverTimestamp: () => marca },
      Timestamp: { fromDate: (d) => ({ __marca: 'timestamp', fecha: d }) },
    },
  };
  Module._load = function (pedido, ...resto) {
    if (dobles[pedido]) return dobles[pedido];
    return cargar.call(this, pedido, ...resto);
  };
}

module.exports = { crearDbFalsa, simularFirebaseAdmin };
