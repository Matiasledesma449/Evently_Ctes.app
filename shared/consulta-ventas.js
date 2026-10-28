// shared/consulta-ventas.js
// Consultas de `ventas` del panel (cambio seguridad-ventas-por-organizacion).
// La regla de Firestore deja que una cuenta de organización lea solo las ventas con su `organizacionId`, y Firestore
// rechaza cualquier consulta que no lo pida explícitamente. Por eso Resumen, Ventas y Reportes arman sus consultas acá:
// al superadmin (real, también en "Ver como organización") no se le agrega nada; a una organización, su organizacionId.
import { collection, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Una cuenta sin organización no puede ver ventas: se pide un valor que ninguna venta tiene
const SIN_ORGANIZACION = '(sin organización)';

// Condiciones extra según el perfil (función pura: se prueba con node). Cada una es [campo, operador, valor].
export function condicionesDeOrganizacion(perfil) {
    if (perfil && perfil.rol === 'superadmin') return [];
    const org = perfil && typeof perfil.organizacionId === 'string' ? perfil.organizacionId.trim() : '';
    return [['organizacionId', '==', org || SIN_ORGANIZACION]];
}

// El perfil de quien está conectado, leído una sola vez
let perfilPrometido = null;
function perfilActual() {
    if (!perfilPrometido) {
        perfilPrometido = new Promise((resolver) => {
            onAuthStateChanged(auth, async (usuario) => {
                if (!usuario) return; // sin sesión, menu-rol.js lleva al login
                try {
                    const snap = await getDoc(doc(db, 'usuarios', usuario.uid));
                    resolver(snap.exists() ? snap.data() : null);
                } catch (error) {
                    console.error('No se pudo leer el perfil para consultar ventas:', error);
                    resolver(null);
                }
            });
        });
    }
    return perfilPrometido;
}

// query(collection(db, 'ventas'), ...condiciones) más la organización si hace falta
export async function consultaDeVentas(...condiciones) {
    const extras = condicionesDeOrganizacion(await perfilActual()).map(([campo, op, valor]) => where(campo, op, valor));
    return query(collection(db, 'ventas'), ...condiciones, ...extras);
}
