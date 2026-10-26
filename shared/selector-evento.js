// shared/selector-evento.js
// Selector del evento activo, igual en Resumen, Ventas y Reportes.
// Es un módulo: cada pantalla lo carga DESPUÉS de firebase-init.js y trae su contenedor en el HTML
// (con el desplegable ya dibujado en "—", para que nada salte al cargar):
//   <div id="selectorEvento" data-con-todos="1"> ... </div>        (data-con-todos solo en Reportes)
//   <script type="module" src="../shared/selector-evento.js"></script>
// Qué hace:
//   1. Si la dirección trae ?id=, lo recuerda como evento activo (antes solo lo recordaba la lista de Eventos).
//   2. Cuando Firebase responde, arma la lista con los eventos que esa persona puede elegir.
//   3. Al elegir otro, recuerda el evento y vuelve a cargar la pantalla con el ?id= nuevo.
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { escaparHtml, elegirEventoActivo } from "./ventas-utils.js";
import { eventosParaVer } from "./organizaciones.js";

const contenedor = document.getElementById('selectorEvento');
const desplegable = document.getElementById('selectorEventoSelect');
const aviso = document.getElementById('selectorEventoAviso');
const conTodos = !!contenedor && contenedor.dataset.conTodos === '1';

// El evento de la dirección o, si no hay, el último que se recordó. "todos" nunca se recuerda.
function leerEventoActivo() {
    let deLaDireccion = null;
    let recordado = null;
    try {
        deLaDireccion = new URLSearchParams(window.location.search).get('id');
        recordado = localStorage.getItem('eventoId');
    } catch (e) { /* sin almacenamiento */ }
    return elegirEventoActivo(deLaDireccion, recordado);
}

function recordar(id) {
    if (!id || id === 'todos') return;
    try { localStorage.setItem('eventoId', id); } catch (e) { /* sin almacenamiento */ }
}

// Se recuerda apenas carga, sin esperar a Firebase
try {
    const idDireccion = new URLSearchParams(window.location.search).get('id');
    recordar(idDireccion);
} catch (e) { /* sin dirección */ }

const TEXTO_ELEGIR = 'Elegí un evento para ver sus datos';

function armar(eventos, usuario, uid) {
    if (!desplegable) return;
    const activo = leerEventoActivo();
    // Los mismos eventos que la lista de Eventos: según el rol con el que se mira ("Ver como organización" incluida)
    const rolReal = usuario ? usuario.rol : '';
    const propios = eventosParaVer({
        eventos, rolReal, rolEfectivo: window.rolEfectivo ? window.rolEfectivo(rolReal) : rolReal,
        organizacionId: usuario ? usuario.organizacionId : '', organizacionElegida: window.vistaOrganizacion ? window.vistaOrganizacion() : ''
    })
        .slice()
        .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));

    const opciones = [];
    const valido = (activo === 'todos' && conTodos) || propios.some((ev) => ev.id === activo);
    if (!valido) opciones.push('<option value="" selected disabled>Elegí un evento…</option>');
    if (conTodos) opciones.push(`<option value="todos"${activo === 'todos' ? ' selected' : ''}>Todos los eventos</option>`);
    for (const ev of propios) {
        opciones.push(`<option value="${escaparHtml(ev.id)}"${ev.id === activo ? ' selected' : ''}>${escaparHtml(ev.nombre || 'Sin nombre')}</option>`);
    }
    // Seguridad: el nombre y el id de cada evento los escribe un organizador; pasan por escaparHtml antes de entrar al HTML
    desplegable.innerHTML = opciones.join('');
    desplegable.disabled = propios.length === 0 && !conTodos;

    if (aviso) {
        aviso.textContent = valido ? '' : TEXTO_ELEGIR; // textContent: nunca se interpreta como HTML
        if (valido) aviso.classList.add('hidden'); else aviso.classList.remove('hidden');
    }
}

// Elegir otro evento: se recuerda y la pantalla se vuelve a cargar con su ?id=
if (desplegable) {
    desplegable.addEventListener('change', () => {
        const id = desplegable.value;
        if (!id) return;
        recordar(id);
        window.location.href = `${window.location.pathname}?id=${encodeURIComponent(id)}`;
    });
}

// Cuando hay sesión, se leen el perfil y los eventos una sola vez
if (contenedor && typeof auth !== 'undefined' && typeof db !== 'undefined') {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        try {
            const [perfil, instantanea] = await Promise.all([getDoc(doc(db, 'usuarios', user.uid)), getDocs(collection(db, 'eventos'))]);
            const eventos = [];
            instantanea.forEach((d) => eventos.push({ id: d.id, ...d.data() }));
            armar(eventos, perfil.exists() ? perfil.data() : null, user.uid);
        } catch (e) {
            console.error('No se pudo cargar la lista de eventos del selector:', e);
        }
    });
}
