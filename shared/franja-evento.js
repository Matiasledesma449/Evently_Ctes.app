// shared/franja-evento.js
// Franja que muestra cuál es el evento activo, para las páginas del panel que trabajan sobre un evento.
// Es un módulo: la página lo carga DESPUÉS de firebase-init.js y trae su contenedor en el HTML
// (con "—" ya escrito, para que nada salte al cargar):
//   <div id="franjaEvento" class="...">
//       Evento: <strong id="franjaEventoNombre">—</strong>
//       <a id="franjaEventoCambiar" href="eventos-seleccion.html">Cambiar</a>
//   </div>
//   <script type="module" src="../shared/franja-evento.js"></script>
// Qué hace:
//   1. Toma el evento activo con la misma regla del selector (?id= y, si no hay, el recordado).
//   2. Cuando Firebase responde, busca el nombre del evento (un solo getDoc) y lo escribe con textContent.
//   3. Si no hay evento activo o ya no existe, escribe "Elegí un evento para ver sus datos". Sin errores ni redirecciones.
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { elegirEventoActivo } from "./ventas-utils.js";

const contenedor = document.getElementById('franjaEvento');
const nombre = document.getElementById('franjaEventoNombre');

const TEXTO_ELEGIR = 'Elegí un evento para ver sus datos';
const TEXTO_CARGANDO = '—';

// El evento de la dirección o, si no hay, el último que se recordó
function leerEventoActivo() {
    let deLaDireccion = null;
    let recordado = null;
    try {
        deLaDireccion = new URLSearchParams(window.location.search).get('id');
        recordado = localStorage.getItem('eventoId');
    } catch (e) { /* sin almacenamiento */ }
    return elegirEventoActivo(deLaDireccion, recordado);
}

// Seguridad: el nombre lo escribe un organizador; va con textContent, nunca se interpreta como HTML
function mostrar(texto) {
    if (nombre) nombre.textContent = texto;
}

if (contenedor && nombre) {
    mostrar(TEXTO_CARGANDO);
    const eventoId = leerEventoActivo();

    if (!eventoId) {
        mostrar(TEXTO_ELEGIR);
    } else if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            try {
                const evento = await getDoc(doc(db, 'eventos', eventoId));
                const datos = evento.exists() ? evento.data() : null;
                mostrar(datos ? (datos.nombre || 'Sin nombre') : TEXTO_ELEGIR);
            } catch (e) {
                console.error('No se pudo cargar el nombre del evento de la franja:', e);
                mostrar(TEXTO_ELEGIR);
            }
        });
    }
}
