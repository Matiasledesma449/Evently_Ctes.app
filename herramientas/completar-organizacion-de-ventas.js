// herramientas/completar-organizacion-de-ventas.js
// Le pone a cada venta la organización de su evento (`organizacionId`), para que la regla de Firestore deje que cada
// organización lea solo sus ventas (cambio seguridad-ventas-por-organizacion). Las ventas nuevas ya lo traen del servidor;
// esta herramienta completa las viejas y corrige las que quedaron con otra organización (por ejemplo, si al evento se le
// cambió la organización). Se puede correr las veces que haga falta.
// La corre la persona en su computadora (ver herramientas/LEEME.md). Claude y la nube NO la ejecutan.
//
//   node herramientas/completar-organizacion-de-ventas.js            → solo muestra qué cambiaría (no escribe nada)
//   node herramientas/completar-organizacion-de-ventas.js --aplicar  → pide escribir la frase de confirmación y recién ahí escribe
//
// Solo cambia el campo `organizacionId` de `ventas`. No borra nada ni toca otros campos ni otras colecciones.
// Las credenciales se leen de la variable GOOGLE_APPLICATION_CREDENTIALS (un archivo en la computadora de la persona):
// este programa no lee ese archivo a la vista ni lo imprime, y el repositorio no incluye ninguna clave.

const FRASE = 'COMPLETAR ORGANIZACIONES';
const TANDA = 400; // Firestore acepta hasta 500 escrituras por lote

const texto = (v) => (typeof v === 'string' ? v.trim() : '');

// Qué hay que cambiar: [{ id, de, a }] para cada venta cuyo organizacionId no coincide con el de su evento.
// Las ventas de eventos que ya no existen o sin organización se cuentan aparte (no se tocan).
function cambiosNecesarios(ventas, eventos) {
    const orgDeEvento = new Map(eventos.map((e) => [e.id, texto(e.organizacionId)]));
    const cambios = [];
    let sinEvento = 0;
    let eventoSinOrganizacion = 0;
    for (const v of ventas) {
        if (!orgDeEvento.has(v.eventoId)) { sinEvento++; continue; }
        const org = orgDeEvento.get(v.eventoId);
        if (!org) { eventoSinOrganizacion++; continue; }
        if (texto(v.organizacionId) !== org) cambios.push({ id: v.id, de: texto(v.organizacionId), a: org });
    }
    return { cambios, sinEvento, eventoSinOrganizacion };
}

// `db` es una base de Firestore (firebase-admin) o una falsa para las pruebas.
async function completar({ db, aplicar, preguntar, escribir }) {
    const [snapVentas, snapEventos] = await Promise.all([db.collection('ventas').get(), db.collection('eventos').get()]);
    const ventas = snapVentas.docs.map((d) => ({ id: d.id, ...d.data() }));
    const eventos = snapEventos.docs.map((d) => ({ id: d.id, ...d.data() }));
    const { cambios, sinEvento, eventoSinOrganizacion } = cambiosNecesarios(ventas, eventos);

    escribir(`Ventas revisadas: ${ventas.length}`);
    escribir(`  - a completar o corregir: ${cambios.length}`);
    escribir(`  - de eventos que ya no existen (no se tocan): ${sinEvento}`);
    escribir(`  - de eventos sin organización (no se tocan): ${eventoSinOrganizacion}`);
    if (cambios.length === 0) { escribir('No hay nada que cambiar.'); return { escritas: 0, cambios }; }
    if (!aplicar) {
        escribir('Vista previa: no se escribió nada. Para aplicar, volvé a correrlo con --aplicar.');
        return { escritas: 0, cambios };
    }
    const respuesta = String(await preguntar(`Para aplicar, escribí exactamente: ${FRASE}\n> `) || '').trim();
    if (respuesta !== FRASE) { escribir('La frase no coincide: no se escribió nada.'); return { escritas: 0, cambios }; }

    let escritas = 0;
    for (let i = 0; i < cambios.length; i += TANDA) {
        const lote = db.batch();
        cambios.slice(i, i + TANDA).forEach((c) => lote.update(db.collection('ventas').doc(c.id), { organizacionId: c.a }));
        await lote.commit();
        escritas += Math.min(TANDA, cambios.length - i);
    }
    escribir(`  ✔ ${escritas} ventas actualizadas.`);
    escribir('Listo.');
    return { escritas, cambios };
}

module.exports = { cambiosNecesarios, completar, FRASE };

// Solo cuando se corre directo (no cuando lo carga una prueba)
if (require.main === module) {
    (async () => {
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.error('Falta la variable GOOGLE_APPLICATION_CREDENTIALS (ver herramientas/LEEME.md).');
            process.exit(1);
        }
        // Igual que server/firestore.js: firebase-admin 14 se carga por partes (app y firestore)
        const { initializeApp, applicationDefault } = require('firebase-admin/app');
        const { getFirestore } = require('firebase-admin/firestore');
        initializeApp({ credential: applicationDefault() });
        const readline = require('readline');
        const preguntar = (t) => new Promise((resolver) => {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question(t, (r) => { rl.close(); resolver(r); });
        });
        await completar({ db: getFirestore(), aplicar: process.argv.includes('--aplicar'), preguntar, escribir: (t) => console.log(t) });
        process.exit(0);
    })().catch((error) => {
        console.error('No se pudo terminar:', error.message);
        process.exit(1);
    });
}
