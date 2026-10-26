// Datos de un evento que se cargan en el formulario y se muestran en el sitio: días con horario y detalle en campos.
// Son solo cálculos sobre textos, sin red ni base de datos. Los textos se devuelven como texto: quien los muestre los escapa.
// Un evento viejo (sin `dias` ni `detalle`) se sigue mostrando con su `fecha` y su `descripcion`.

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const LARGO_MAXIMO_DETALLE = 500;

// Tipos de evento que ofrece el formulario ("Otro" se escribe a mano)
export const TIPOS_DE_EVENTO = ['Fiesta', 'Recital', 'Show', 'Deportivo', 'Cultural', 'Otro'];

// Lee "AAAA-MM-DD" y devuelve { anio, mes, dia } si es una fecha que existe; si no, null
function leerFecha(texto) {
    const partes = typeof texto === 'string' ? texto.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
    if (!partes) return null;
    const anio = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) return null;
    return { anio, mes, dia };
}

function horaValida(texto) {
    return typeof texto === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(texto.trim());
}

// Deja la lista limpia: solo días con fecha que existe, ordenados por fecha. Las horas mal escritas quedan vacías.
export function normalizarDias(dias) {
    if (!Array.isArray(dias)) return [];
    return dias
        .filter((dia) => dia && typeof dia === 'object' && leerFecha(dia.fecha))
        .map((dia) => ({
            fecha: dia.fecha.trim(),
            horaInicio: horaValida(dia.horaInicio) ? dia.horaInicio.trim() : '',
            horaFin: horaValida(dia.horaFin) ? dia.horaFin.trim() : ''
        }))
        .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

// Devuelve el primer problema en español, o '' si los días están bien. Se le pasa lo que escribió la persona, sin limpiar.
export function validarDias(dias) {
    if (!Array.isArray(dias) || dias.length === 0) return 'Agregá al menos un día.';
    const vistas = new Set();
    for (let i = 0; i < dias.length; i++) {
        const dia = dias[i] && typeof dias[i] === 'object' ? dias[i] : {};
        const numero = i + 1;
        if (!leerFecha(dia.fecha)) return `La fecha es obligatoria (día ${numero}).`;
        const clave = dia.fecha.trim();
        if (vistas.has(clave)) return `El día ${numero} repite una fecha ya cargada.`;
        vistas.add(clave);
        if (!horaValida(dia.horaInicio)) return `Completá la hora de inicio (día ${numero}).`;
        if (!horaValida(dia.horaFin)) return `Completá la hora de fin (día ${numero}).`;
    }
    return '';
}

// Texto del primer día, como "15 Diciembre 2026": es lo que se guarda en `fecha` para lo que ya la lee
export function fechaDeTexto(dias) {
    const primero = normalizarDias(dias)[0];
    if (!primero) return '';
    const f = leerFecha(primero.fecha);
    return `${f.dia} ${MESES[f.mes - 1]} ${f.anio}`;
}

function horario(dia) {
    if (!dia.horaInicio && !dia.horaFin) return '';
    if (!dia.horaFin) return `desde las ${dia.horaInicio}`;
    if (!dia.horaInicio) return `hasta las ${dia.horaFin}`;
    const alDiaSiguiente = dia.horaFin < dia.horaInicio ? ' (termina al día siguiente)' : '';
    return `${dia.horaInicio} a ${dia.horaFin}${alDiaSiguiente}`;
}

// Un renglón por día: "Sáb 15 dic · 21:00 a 05:00 (termina al día siguiente)".
// Sin `dias` devuelve un solo renglón con `fecha`, o ninguno si tampoco hay.
export function resumenDeDias(evento) {
    const dias = normalizarDias(evento && evento.dias);
    if (dias.length === 0) {
        const fecha = evento && typeof evento.fecha === 'string' ? evento.fecha.trim() : '';
        return fecha ? [fecha] : [];
    }
    return dias.map((dia) => {
        const f = leerFecha(dia.fecha);
        const diaSemana = DIAS_CORTOS[new Date(Date.UTC(f.anio, f.mes - 1, f.dia)).getUTCDay()];
        const cabecera = `${diaSemana} ${f.dia} ${MESES_CORTOS[f.mes - 1]}`;
        const horas = horario(dia);
        return horas ? `${cabecera} · ${horas}` : cabecera;
    });
}

// El detalle sin campos vacíos ni espacios de más. Con todo vacío devuelve {}.
export function armarDetalle(campos) {
    const origen = campos && typeof campos === 'object' ? campos : {};
    const detalle = {};
    for (const clave of ['actividad', 'tipo', 'requisitos', 'edad']) {
        const valor = typeof origen[clave] === 'string' ? origen[clave].trim().slice(0, LARGO_MAXIMO_DETALLE) : '';
        if (valor) detalle[clave] = valor;
    }
    return detalle;
}

const TITULOS_DEL_DETALLE = [
    ['actividad', 'Actividad'],
    ['tipo', 'Tipo de evento'],
    ['requisitos', 'Requisitos'],
    ['edad', 'Edad']
];

// Filas { titulo, texto } para mostrar. Sin `detalle`, la descripción de siempre queda como una fila sin título.
export function detalleParaMostrar(evento) {
    const detalle = armarDetalle(evento && evento.detalle);
    const filas = TITULOS_DEL_DETALLE
        .filter(([clave]) => detalle[clave])
        .map(([clave, titulo]) => ({ titulo, texto: detalle[clave] }));
    const descripcion = evento && typeof evento.descripcion === 'string' ? evento.descripcion.trim() : '';
    if (descripcion) filas.push({ titulo: filas.length ? 'Más información' : '', texto: descripcion });
    return filas;
}
