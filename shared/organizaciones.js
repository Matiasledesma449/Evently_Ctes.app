// shared/organizaciones.js
// Qué eventos le corresponden a cada organización y cómo se valida el nombre de una organización nueva.
// Funciones puras: no tocan la página ni Firestore, así se prueban con node (pruebas 28 y 30).
// La única regla de pertenencia es el `organizacionId` del evento: ya no se mira `creadoPor` ni el correo.

export const LARGO_MAXIMO_NOMBRE_ORGANIZACION = 60;

const comoLista = (eventos) => (Array.isArray(eventos) ? eventos : []).filter((e) => e && typeof e === 'object');
const idValido = (id) => (typeof id === 'string' && id.trim() !== '' ? id.trim() : '');

// Los eventos cuyo organizacionId es exactamente ese. Sin organizacionId (de la persona) no se ve ninguno.
export function eventosDeOrganizacion(eventos, organizacionId) {
    const buscado = idValido(organizacionId);
    if (!buscado) return [];
    return comoLista(eventos).filter((ev) => idValido(ev.organizacionId) === buscado);
}

// Los eventos que se muestran en el panel, según con qué rol se está mirando.
//  - 'superadmin' (sin vista de organización): todos.
//  - 'organizacion' mirado por un superadmin (`vistaDeSuperadmin: true`): los de `organizacionElegida` (vacío si no eligió).
//  - 'organizacion' real: los de su `organizacionId`.
//  - cualquier otro rol: ninguno.
export function eventosParaVer({ eventos, rolEfectivo, organizacionId, organizacionElegida, vistaDeSuperadmin } = {}) {
    if (rolEfectivo === 'superadmin') return comoLista(eventos);
    if (rolEfectivo === 'organizacion') {
        return eventosDeOrganizacion(eventos, vistaDeSuperadmin ? organizacionElegida : organizacionId);
    }
    return [];
}

// La organización a la que pertenece el evento, o null ("Sin organización")
export function organizacionDeEvento(evento, organizaciones) {
    const id = evento && typeof evento === 'object' ? idValido(evento.organizacionId) : '';
    if (!id) return null;
    const lista = Array.isArray(organizaciones) ? organizaciones : [];
    return lista.find((o) => o && o.id === id) || null;
}

// Nombre sin espacios sobrantes y en minúsculas, para comparar "Valigroup" con " valigroup "
function claveDeNombre(nombre) {
    return String(nombre).replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
}

// Valida el nombre de una organización nueva o editada. `existentes` es la lista actual ({ id, nombre });
// `idActual` es la organización que se está editando (para que no choque consigo misma).
// Devuelve { ok: true, datos: { nombre } } o { ok: false, campo: 'nombre', mensaje }.
export function validarOrganizacion(entrada, existentes, idActual) {
    const { nombre } = entrada && typeof entrada === 'object' ? entrada : {};
    const limpio = typeof nombre === 'string' ? nombre.replace(/\s+/g, ' ').trim() : '';
    if (limpio === '' || limpio.length > LARGO_MAXIMO_NOMBRE_ORGANIZACION) {
        return { ok: false, campo: 'nombre', mensaje: `El nombre debe tener entre 1 y ${LARGO_MAXIMO_NOMBRE_ORGANIZACION} caracteres.` };
    }
    const repetida = (Array.isArray(existentes) ? existentes : []).some((o) =>
        o && typeof o.nombre === 'string' && o.id !== idActual && claveDeNombre(o.nombre) === claveDeNombre(limpio));
    if (repetida) return { ok: false, campo: 'nombre', mensaje: 'Ya existe una organización con ese nombre.' };
    // El nombre siempre se muestra con textContent, así que las etiquetas HTML no hacen nada; igual no se aceptan < ni >
    if (/[<>]/.test(limpio)) return { ok: false, campo: 'nombre', mensaje: 'El nombre no puede llevar los signos < ni >.' };
    return { ok: true, datos: { nombre: limpio } };
}

// Las organizaciones del documento, ordenadas por nombre (para los desplegables)
export function organizacionesOrdenadas(organizaciones) {
    return (Array.isArray(organizaciones) ? organizaciones : [])
        .filter((o) => o && typeof o.id === 'string' && o.id !== '')
        .map((o) => ({ id: o.id, nombre: typeof o.nombre === 'string' ? o.nombre : '' }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
