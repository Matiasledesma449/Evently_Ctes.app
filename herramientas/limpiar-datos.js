// herramientas/limpiar-datos.js
// Vacía los datos de prueba para empezar de cero (cambio organizaciones-y-correcciones-del-panel).
// La corre la persona en su computadora (ver herramientas/LEEME.md). Claude y la nube NO la ejecutan.
//
//   node herramientas/limpiar-datos.js                    → solo muestra cuántos documentos borraría (no borra nada)
//   node herramientas/limpiar-datos.js --borrar           → pide escribir la frase de confirmación y recién ahí borra
//   node herramientas/limpiar-datos.js --solo ventas      → lo mismo, pero solo con esa colección
//
// Borra solo `eventos`, `ventas` y `solicitudes_eventos`. Nunca toca `usuarios`, `configuracion` ni `organizaciones`.
// Las credenciales se leen de la variable GOOGLE_APPLICATION_CREDENTIALS (un archivo en la computadora de la persona):
// este programa no lee ese archivo a la vista ni lo imprime, y el repositorio no incluye ninguna clave.

const COLECCIONES_QUE_SE_VACIAN = ['eventos', 'ventas', 'solicitudes_eventos'];
const COLECCIONES_QUE_SE_CONSERVAN = ['usuarios', 'configuracion', 'organizaciones'];
const FRASE = 'BORRAR DATOS DE PRUEBA';
const TANDA = 400; // Firestore acepta hasta 500 escrituras por lote

// Qué colecciones se tocan según los argumentos. Devuelve { colecciones, borrar } o { error }.
function leerArgumentos(args) {
    const borrar = args.includes('--borrar');
    const i = args.indexOf('--solo');
    if (i === -1) return { colecciones: COLECCIONES_QUE_SE_VACIAN.slice(), borrar };
    const elegida = args[i + 1];
    if (!elegida) return { error: 'Después de --solo va el nombre de una colección: ' + COLECCIONES_QUE_SE_VACIAN.join(', ') + '.' };
    if (COLECCIONES_QUE_SE_CONSERVAN.includes(elegida)) return { error: `"${elegida}" no se borra nunca con esta herramienta.` };
    if (!COLECCIONES_QUE_SE_VACIAN.includes(elegida)) return { error: `"${elegida}" no es una colección que se pueda vaciar. Son: ${COLECCIONES_QUE_SE_VACIAN.join(', ')}.` };
    return { colecciones: [elegida], borrar };
}

// Cuenta y, si se confirmó, borra. `db` es una base de Firestore (firebase-admin) o una falsa para las pruebas.
// `preguntar(texto)` devuelve lo que la persona escribe. `escribir(texto)` muestra un renglón.
async function limpiar({ db, colecciones, borrar, preguntar, escribir }) {
    const conteo = {};
    for (const nombre of colecciones) {
        if (COLECCIONES_QUE_SE_CONSERVAN.includes(nombre)) throw new Error(`"${nombre}" no se borra nunca.`);
        conteo[nombre] = (await db.collection(nombre).get()).size;
    }
    escribir('Esto es lo que se borraría:');
    for (const nombre of colecciones) escribir(`  - ${nombre}: ${conteo[nombre]} documentos`);
    escribir(`Se conservan siempre: ${COLECCIONES_QUE_SE_CONSERVAN.join(', ')}.`);

    if (!borrar) {
        escribir('Vista previa: no se borró nada. Para borrar, volvé a correrlo con --borrar.');
        return { borrados: {}, conteo };
    }
    const respuesta = String(await preguntar(`Para borrar, escribí exactamente: ${FRASE}\n> `) || '').trim();
    if (respuesta !== FRASE) {
        escribir('La frase no coincide: no se borró nada.');
        return { borrados: {}, conteo };
    }

    const borrados = {};
    for (const nombre of colecciones) {
        borrados[nombre] = 0;
        // Se borra de a tandas hasta que la colección queda vacía
        for (;;) {
            const snap = await db.collection(nombre).limit(TANDA).get();
            if (snap.size === 0) break;
            const lote = db.batch();
            snap.docs.forEach((d) => lote.delete(d.ref));
            await lote.commit();
            borrados[nombre] += snap.size;
        }
        escribir(`  ✔ ${nombre}: ${borrados[nombre]} documentos borrados`);
    }
    escribir('Listo.');
    return { borrados, conteo };
}

module.exports = { leerArgumentos, limpiar, FRASE, COLECCIONES_QUE_SE_VACIAN, COLECCIONES_QUE_SE_CONSERVAN };

// Solo cuando se corre directo (no cuando lo carga una prueba)
if (require.main === module) {
    (async () => {
        const opciones = leerArgumentos(process.argv.slice(2));
        if (opciones.error) { console.error(opciones.error); process.exit(1); }
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.error('Falta la variable GOOGLE_APPLICATION_CREDENTIALS (ver herramientas/LEEME.md).');
            process.exit(1);
        }
        const admin = require('firebase-admin');
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        const readline = require('readline');
        const preguntar = (texto) => new Promise((resolver) => {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question(texto, (r) => { rl.close(); resolver(r); });
        });
        await limpiar({ db: admin.firestore(), ...opciones, preguntar, escribir: (t) => console.log(t) });
        process.exit(0);
    })().catch((error) => {
        console.error('No se pudo terminar:', error.message);
        process.exit(1);
    });
}
