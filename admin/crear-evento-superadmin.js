// admin/crear-evento-superadmin.js
// Lo que solo usa el superadmin en "Crear evento" (eventos.html?modo=directo): la organización del evento (obligatoria),
// la categoría de costo de servicio del evento y el panel para crear y editar esas categorías.
// Lo carga eventos.html solo en modo directo. Las categorías se guardan en configuracion/comisiones (no se borran).
import { collection, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { validarCategoria, categoriasOrdenadas, nuevoIdDeCategoria, textoDePorcentaje } from "../shared/categorias-comision.js";

const DOC_COMISIONES = () => doc(db, 'configuracion', 'comisiones');

const panelServicio = document.getElementById('panelServicio');
const listaCategorias = document.getElementById('listaCategorias');
const formNuevaCategoria = document.getElementById('formNuevaCategoria');
const mensajeServicio = document.getElementById('mensajeServicio');
const bloqueSuperadmin = document.getElementById('bloqueSuperadmin');
const selectOrganizacion = document.getElementById('organizacionEvento');
const selectCategoria = document.getElementById('categoriaEvento');

let organizaciones = [];
let categorias = [];

panelServicio.classList.remove('hidden');
bloqueSuperadmin.classList.remove('hidden');
selectOrganizacion.required = true;

// ---------- Organización del evento ----------
// Cada nombre va con new Option (textContent): nunca se interpreta como HTML
onSnapshot(collection(db, 'organizaciones'), (snap) => {
    // Solo las organizaciones activas (las eliminadas no se ofrecen para eventos nuevos)
    organizaciones = snap.docs.filter((d) => (d.data() || {}).eliminada !== true).map((d) => ({ id: d.id, nombre: (d.data() || {}).nombre || 'Sin nombre' }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const elegida = selectOrganizacion.value;
    selectOrganizacion.replaceChildren(new Option(organizaciones.length ? 'Elegí la organización' : 'No hay organizaciones: creá una en "Organizaciones"', ''));
    organizaciones.forEach((o) => selectOrganizacion.add(new Option(o.nombre, o.id)));
    selectOrganizacion.value = organizaciones.some((o) => o.id === elegida) ? elegida : '';
}, (error) => {
    console.error('No se pudieron leer las organizaciones:', error);
    selectOrganizacion.replaceChildren(new Option('No se pudieron leer las organizaciones', ''));
});

// ---------- Categorías de costo de servicio ----------
function avisoServicio(texto, esError) {
    mensajeServicio.textContent = texto; // textContent: nunca se interpreta como HTML
    mensajeServicio.className = `mt-3 text-sm ${esError ? 'text-red-600' : 'text-green-700'}`;
}

onSnapshot(DOC_COMISIONES(), (snap) => {
    categorias = categoriasOrdenadas(snap.exists() ? snap.data() : null);
    dibujarCategorias();
    llenarSelectorCategoria();
}, (error) => {
    console.error('No se pudieron leer las categorías:', error);
    avisoServicio('No se pudieron leer las categorías de costo de servicio.', true);
});

function llenarSelectorCategoria() {
    const elegida = selectCategoria.value;
    selectCategoria.replaceChildren(new Option('Sin categoría (0%)', ''));
    categorias.forEach((c) => selectCategoria.add(new Option(`${c.nombre} (${textoDePorcentaje(c.porcentaje)})`, c.id)));
    selectCategoria.value = categorias.some((c) => c.id === elegida) ? elegida : '';
}

function crearCampoCategoria(valor, etiqueta, clases, extra = {}) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = valor;
    input.setAttribute('aria-label', etiqueta);
    input.className = `border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none ${clases}`;
    Object.entries(extra).forEach(([k, v]) => input.setAttribute(k, v));
    return input;
}

// Una fila por categoría, armada con textContent/value (el nombre lo escribe una persona)
function dibujarCategorias() {
    listaCategorias.replaceChildren();
    if (categorias.length === 0) {
        const vacio = document.createElement('p');
        vacio.className = 'text-sm text-gray-400';
        vacio.textContent = 'Todavía no hay categorías: todos los eventos cobran 0%.';
        listaCategorias.appendChild(vacio);
        return;
    }
    categorias.forEach((cat) => {
        const fila = document.createElement('div');
        fila.className = 'flex flex-col sm:flex-row gap-2';
        const nombre = crearCampoCategoria(cat.nombre, `Nombre de la categoría ${cat.nombre}`, 'flex-1', { maxlength: '40' });
        const porcentaje = crearCampoCategoria(textoDePorcentaje(cat.porcentaje).replace('%', ''), `Porcentaje de ${cat.nombre}`, 'sm:w-40', { inputmode: 'decimal', maxlength: '6' });
        const guardar = document.createElement('button');
        guardar.type = 'button';
        guardar.textContent = 'Guardar';
        guardar.className = 'border border-violet-600 text-violet-700 hover:bg-violet-50 px-4 py-2 rounded-lg text-sm font-medium transition';
        guardar.addEventListener('click', () => guardarCategoria(cat.id, nombre.value, porcentaje.value, guardar));
        fila.append(nombre, porcentaje, guardar);
        listaCategorias.appendChild(fila);
    });
}

async function escribirCategorias(lista) {
    await setDoc(DOC_COMISIONES(), { categorias: lista.map(({ id, nombre, porcentaje }) => ({ id, nombre, porcentaje })) });
}

async function guardarCategoria(id, nombre, porcentaje, boton) {
    const r = validarCategoria({ nombre, porcentaje });
    if (!r.ok) { avisoServicio(r.mensaje, true); return; }
    boton.disabled = true;
    try {
        await escribirCategorias(categorias.map((c) => (c.id === id ? { id, ...r.datos } : c)));
        avisoServicio(`Guardado: ${r.datos.nombre} (${textoDePorcentaje(r.datos.porcentaje)}). Vale para las compras nuevas.`, false);
    } catch (error) {
        console.error('No se pudo guardar la categoría:', error);
        avisoServicio('No se pudo guardar. Probá de nuevo.', true);
    } finally {
        boton.disabled = false;
    }
}

formNuevaCategoria.addEventListener('submit', async (e) => {
    e.preventDefault();
    const campoNombre = document.getElementById('nuevaCategoriaNombre');
    const campoPorcentaje = document.getElementById('nuevaCategoriaPorcentaje');
    const r = validarCategoria({ nombre: campoNombre.value, porcentaje: campoPorcentaje.value });
    if (!r.ok) { avisoServicio(r.mensaje, true); return; }
    try {
        await escribirCategorias([...categorias, { id: nuevoIdDeCategoria(categorias), ...r.datos }]);
        campoNombre.value = '';
        campoPorcentaje.value = '';
        avisoServicio(`Categoría agregada: ${r.datos.nombre} (${textoDePorcentaje(r.datos.porcentaje)}).`, false);
    } catch (error) {
        console.error('No se pudo agregar la categoría:', error);
        avisoServicio('No se pudo agregar. Probá de nuevo.', true);
    }
});

// Lo que el formulario agrega al evento: la organización (obligatoria) y la categoría (solo si se eligió una que existe)
export function datosDelSuperadmin() {
    const organizacionId = selectOrganizacion.value;
    if (!organizacionId || !organizaciones.some((o) => o.id === organizacionId)) throw new Error('Elegí la organización del evento.');
    const categoria = selectCategoria.value;
    return { organizacionId, ...(categoria && categorias.some((c) => c.id === categoria) ? { comisionCategoriaId: categoria } : {}) };
}
