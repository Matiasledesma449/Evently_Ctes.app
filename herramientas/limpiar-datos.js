// Vacía los datos de prueba: eventos, ventas y solicitudes de eventos.
// La corre solo la persona, con su archivo de credenciales fuera del repo (ver herramientas/LEEME.md).
//
// Uso:
//   node herramientas/limpiar-datos.js                      -> vista previa: cuenta lo que borraría y no borra nada
//   node herramientas/limpiar-datos.js --solo ventas        -> vista previa de una sola colección
//   node herramientas/limpiar-datos.js --borrar             -> pide escribir la frase de confirmación y recién ahí borra
//
// Conserva siempre: usuarios, configuracion y organizaciones.

const COLECCIONES = ['eventos', 'ventas', 'solicitudes_eventos'];
const FRASE = 'BORRAR TODO';
const LOTE = 400; // Firestore admite hasta 500 operaciones por lote

// Lee los argumentos: { borrar, solo } o { error } si algo no se entiende.
function leerArgumentos(argv) {
  const r = { borrar: false, solo: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--borrar') r.borrar = true;
    else if (a === '--solo') {
      const col = argv[++i];
      if (!COLECCIONES.includes(col)) return { error: '--solo necesita una de estas colecciones: ' + COLECCIONES.join(', ') + '.' };
      r.solo = col;
    } else return { error: 'No entiendo "' + a + '". Se puede usar --borrar y --solo <colección>.' };
  }
  return r;
}

async function contar(db, col) {
  const snap = await db.collection(col).get();
  return snap.docs;
}

async function borrarDocs(db, docs) {
  for (let i = 0; i < docs.length; i += LOTE) {
    const lote = db.batch();
    docs.slice(i, i + LOTE).forEach((d) => lote.delete(d.ref));
    await lote.commit();
  }
}

// `preguntar(texto)` devuelve lo que escribió la persona; `escribir(texto)` muestra un mensaje.
async function limpiar({ db, argv, preguntar, escribir }) {
  const args = leerArgumentos(argv);
  if (args.error) { escribir(args.error); return { codigo: 1 }; }
  const colecciones = args.solo ? [args.solo] : COLECCIONES;

  const encontrados = {};
  for (const col of colecciones) encontrados[col] = await contar(db, col);

  escribir(args.borrar ? 'Esto se va a borrar:' : 'Vista previa (no se borra nada):');
  for (const col of colecciones) escribir('  ' + col + ': ' + encontrados[col].length + ' documentos');
  escribir('Se conservan: usuarios, configuracion y organizaciones.');

  if (!args.borrar) {
    escribir('Para borrar de verdad, corré el mismo comando con --borrar.');
    return { codigo: 0, borrados: {} };
  }

  const respuesta = await preguntar('Para confirmar escribí exactamente "' + FRASE + '": ');
  if (String(respuesta).trim() !== FRASE) {
    escribir('La frase no coincide. No se borró nada.');
    return { codigo: 1, borrados: {} };
  }

  const borrados = {};
  for (const col of colecciones) {
    await borrarDocs(db, encontrados[col]);
    borrados[col] = encontrados[col].length;
    escribir('Borrados de ' + col + ': ' + borrados[col]);
  }
  escribir('Listo.');
  return { codigo: 0, borrados };
}

module.exports = { limpiar, leerArgumentos, COLECCIONES, FRASE };

if (require.main === module) {
  (async () => {
    // Las credenciales las toma firebase-admin del archivo que indica GOOGLE_APPLICATION_CREDENTIALS.
    // Este programa no abre ese archivo ni muestra su contenido.
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Falta indicar el archivo de credenciales. Mirá los pasos en herramientas/LEEME.md.');
      process.exit(1);
    }
    const { initializeApp, applicationDefault } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    initializeApp({ credential: applicationDefault() });
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    const preguntar = (t) => new Promise((ok) => readline.question(t, ok));
    try {
      const { codigo } = await limpiar({ db: getFirestore(), argv: process.argv.slice(2), preguntar, escribir: console.log });
      readline.close();
      process.exit(codigo);
    } catch (e) {
      readline.close();
      console.log('Algo falló: ' + (e && e.message ? e.message : e));
      process.exit(1);
    }
  })();
}
