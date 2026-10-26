// Organizaciones (cambio organizaciones-y-correcciones-del-panel): de quién es cada evento y qué eventos ve cada cuenta.
// Funciones puras, sin red ni base de datos: las usan las pantallas del panel y las pruebas.
// Regla única de pertenencia: un evento es de la organización cuyo id está en su campo `organizacionId`.
// (Ya no se usan `creadoPor` ni el correo: cada pantalla los combinaba a su manera y contaban distinto.)

const LARGO_MAXIMO_NOMBRE = 60;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const lista = (valor) => (Array.isArray(valor) ? valor : []).filter(Boolean);

// Los eventos cuyo organizacionId es exactamente ese. Sin organización no hay eventos.
export function eventosDeOrganizacion(eventos, organizacionId) {
    const id = texto(organizacionId);
    if (!id) return [];
    return lista(eventos).filter((ev) => texto(ev.organizacionId) === id);
}

// Qué eventos se muestran según el rol con el que se mira:
// superadmin (sin "Ver como organización") → todos; vista de organización → los de la organización elegida
// (ninguno si no eligió); organización → los de su propia organización.
export function eventosParaVer({ eventos, rolEfectivo, rolReal, organizacionId, organizacionElegida } = {}) {
    const real = rolReal || rolEfectivo;
    if (rolEfectivo === 'superadmin') return lista(eventos);
    if (real === 'superadmin') return eventosDeOrganizacion(eventos, organizacionElegida);
    return eventosDeOrganizacion(eventos, organizacionId);
}

// La organización de un evento (de la lista `organizaciones`, cada una con su id) o null si no tiene
export function organizacionDeEvento(evento, organizaciones) {
    const id = evento ? texto(evento.organizacionId) : '';
    if (!id) return null;
    return lista(organizaciones).find((o) => texto(o.id) === id) || null;
}

// Nombre comparable: sin espacios sobrantes ni diferencias de mayúsculas
const comparable = (nombre) => texto(nombre).replace(/\s+/g, ' ').toLocaleLowerCase('es');

// Valida el nombre de una organización nueva o editada. Devuelve el texto del problema o '' si está bien.
// `existentes` son las demás organizaciones (al editar, sin la que se edita).
export function validarOrganizacion({ nombre } = {}, existentes = []) {
    const limpio = texto(nombre).replace(/\s+/g, ' ');
    if (!limpio) return 'Escribí el nombre de la organización.';
    if (limpio.length > LARGO_MAXIMO_NOMBRE) return `El nombre puede tener hasta ${LARGO_MAXIMO_NOMBRE} caracteres.`;
    if (/[<>]/.test(limpio)) return 'El nombre no puede tener los signos < ni >.';
    if (lista(existentes).some((o) => comparable(o.nombre) === comparable(limpio))) return 'Ya existe una organización con ese nombre.';
    return '';
}
