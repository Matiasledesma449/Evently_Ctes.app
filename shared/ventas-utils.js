// shared/ventas-utils.js
// Reglas comunes del panel de administracion sobre las ventas, para que Dashboard, Ventas, Reportes y
// Panel Global usen EXACTAMENTE el mismo criterio. Son funciones puras: no tocan la pagina ni Firestore.
//
// Criterio de dinero: solo cuentan las ventas `confirmada`. Las `pendiente` se informan aparte como
// "pendientes de pago" y las `rechazada` no suman a ninguna cifra (ver specs/panel-de-ventas).

// Escapa un texto para ponerlo dentro de HTML. El correo y el nombre los escribe quien compra y el
// nombre del lote lo escribe el organizador: nunca se deben mostrar sin escapar.
export function escaparHtml(valor) {
    const reemplazos = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
    return String(valor === undefined || valor === null ? '' : valor).replace(/[&<>"'`]/g, (c) => reemplazos[c]);
}

const aNumero = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
};

// Lo que le corresponde a la organización en una venta: el precio de las entradas, SIN el costo de servicio
// (que se cobra aparte al comprador). Las ventas anteriores al costo de servicio solo tienen `monto_total`.
export function ingresoDeVenta(venta) {
    if (!venta) return 0;
    if (typeof venta.subtotal === 'number' && Number.isFinite(venta.subtotal)) return venta.subtotal;
    return aNumero(venta.monto_total);
}

// El costo de servicio que pagó el comprador en esa venta (0 si no tiene)
export function costoServicioDeVenta(venta) {
    if (!venta) return 0;
    const costo = aNumero(venta.costo_servicio);
    return costo > 0 ? costo : 0;
}

export function esConfirmada(venta) {
    return !!venta && venta.estado === 'confirmada';
}

// Solo las ventas confirmadas (las unicas que suman dinero y entradas vendidas)
export function soloConfirmadas(ventas) {
    return (Array.isArray(ventas) ? ventas : []).filter(esConfirmada);
}

// Cifras de un conjunto de ventas. `recaudado` y `entradas` salen unicamente de las confirmadas.
export function resumenDeVentas(ventas) {
    const resumen = { recaudado: 0, entradas: 0, confirmadas: 0, pendientes: 0, rechazadas: 0 };
    for (const v of (Array.isArray(ventas) ? ventas : [])) {
        if (!v) continue;
        if (v.estado === 'confirmada') {
            resumen.recaudado += ingresoDeVenta(v);
            resumen.entradas += aNumero(v.cantidad);
            resumen.confirmadas += 1;
        } else if (v.estado === 'pendiente') {
            resumen.pendientes += 1;
        } else if (v.estado === 'rechazada') {
            resumen.rechazadas += 1;
        }
    }
    return resumen;
}

// Motivos de rechazo en lenguaje simple (para quien administra el evento)
const MOTIVOS = {
    vencida: 'No se pagó a tiempo',
    pago_rechazado: 'Mercado Pago rechazó el pago',
    pago_cancelado: 'El pago fue cancelado',
    sin_stock: 'Se agotaron las entradas mientras pagaba',
    lote_inconsistente: 'El lote cambió mientras se pagaba',
    evento_inexistente: 'El evento ya no existe',
    error_mercado_pago: 'No se pudo iniciar el pago en Mercado Pago',
};

// Devuelve el texto del motivo, o '' si no hay motivo. Un motivo desconocido nunca se muestra tal cual.
export function textoDelMotivo(motivo) {
    if (!motivo) return '';
    return MOTIVOS[motivo] || 'Motivo no especificado';
}

const ETIQUETAS = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente de pago',
    rechazada: 'Rechazada',
    anulada: 'Anulada (anterior)', // ventas de prueba viejas: ya no se crea este estado
};

export function etiquetaDeEstado(estado) {
    return ETIQUETAS[estado] || (estado ? String(estado) : 'N/A');
}

// Clase de color de la etiqueta de estado
export function claseDeEstado(estado) {
    if (estado === 'confirmada') return 'estado-confirmada';
    if (estado === 'pendiente') return 'estado-pendiente';
    return 'estado-rechazada';
}

// "Nombre Apellido", o '' en las ventas viejas que no tienen esos datos
export function nombreDelComprador(venta) {
    if (!venta) return '';
    return [venta.nombre, venta.apellido]
        .filter((parte) => typeof parte === 'string' && parte.trim() !== '')
        .map((parte) => parte.trim())
        .join(' ');
}

// El monto de una venta para el detalle: "$4.860" y, si tiene costo de servicio, "$4.860 (entradas $4.500 + costo de servicio $360)".
export function textoDeMontoDeVenta(venta) {
    const total = aNumero(venta && venta.monto_total);
    const costo = costoServicioDeVenta(venta);
    const base = `$${total.toLocaleString()}`;
    return costo > 0 ? `${base} (entradas $${ingresoDeVenta(venta).toLocaleString()} + costo de servicio $${costo.toLocaleString()})` : base;
}

// Avisos para quien administra: reembolsos pendientes y pagos para revisar. Devuelve una lista de textos.
export function avisosDeVenta(venta) {
    const avisos = [];
    if (!venta) return avisos;

    if (venta.requiereReembolso === true) {
        if (venta.motivoReembolso === 'pago_duplicado') {
            const ids = Array.isArray(venta.pagosDuplicados) ? venta.pagosDuplicados.join(', ') : '';
            avisos.push('Pago repetido: hay que devolver el dinero desde el panel de Mercado Pago' + (ids ? ` (pago N° ${ids})` : ''));
        } else {
            avisos.push('Reembolso pendiente: hay que devolver el dinero desde el panel de Mercado Pago' + (venta.mpPaymentId ? ` (pago N° ${venta.mpPaymentId})` : ''));
        }
    }

    if (venta.requiereRevision === true) {
        avisos.push('Revisar el pago: llegó con un monto o una moneda distinta a la de la venta');
    }
    return avisos;
}

// ======================================================================================================
// Tarjetas de resumen de la pantalla Ventas: cambian según el filtro de estado y de método de pago.
// Son funciones puras (sin página ni Firestore) para poder probarlas con node.
// "Recaudado" cuenta SOLO ventas confirmadas; lo pendiente se muestra como "en espera" y lo rechazado
// como "no cobrado", nunca como recaudación.
// ======================================================================================================

// Milisegundos de una fecha de Firestore ({ seconds }), de un Date o de un número. null si no hay fecha válida.
function fechaEnMs(fecha) {
    if (fecha === null || fecha === undefined) return null;
    if (typeof fecha === 'number') return Number.isFinite(fecha) ? fecha : null;
    if (Object.prototype.toString.call(fecha) === '[object Date]') {
        const t = fecha.getTime();
        return Number.isFinite(t) ? t : null;
    }
    if (typeof fecha === 'object' && typeof fecha.seconds === 'number' && Number.isFinite(fecha.seconds)) return fecha.seconds * 1000;
    return null;
}

// Las ventas que cumplen a la vez el filtro de estado y el de método ('todos' no filtra).
// `claveDe` convierte lo guardado en la opción del filtro: las pantallas pasan claveDeFormaDePago (shared/formas-de-pago.js),
// así "Dinero en cuenta" filtra como "Transferencia". Sin `claveDe` se compara el texto guardado sin espacios sobrantes.
export function filtrarVentas(ventas, estado = 'todos', metodo = 'todos', claveDe = null) {
    const guardado = (v) => (typeof v.metodo_pago === 'string' ? v.metodo_pago.trim() : '');
    const metodoDe = typeof claveDe === 'function' ? (v) => claveDe(v.metodo_pago) : guardado;
    return (Array.isArray(ventas) ? ventas : []).filter((v) =>
        v && (estado === 'todos' || v.estado === estado) && (metodo === 'todos' || metodoDe(v) === metodo));
}

// Los métodos de pago que tienen las ventas, sin repetir, sin vacíos y ordenados
export function metodosDePago(ventas) {
    const vistos = new Set();
    for (const v of (Array.isArray(ventas) ? ventas : [])) {
        if (v && typeof v.metodo_pago === 'string' && v.metodo_pago.trim() !== '') vistos.add(v.metodo_pago.trim());
    }
    return [...vistos].sort((a, b) => a.localeCompare(b, 'es'));
}

// "hace 5 min", "hace 3 h", "hace 2 días". `ahora` es un Date o un número (se recibe para poder probarlo).
export function tiempoDesde(fecha, ahora = Date.now()) {
    const desde = fechaEnMs(fecha);
    const hasta = fechaEnMs(ahora);
    if (desde === null || hasta === null) return '—';
    const minutos = Math.floor((hasta - desde) / 60000);
    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
}

const dinero = (n) => `$${aNumero(n).toLocaleString()}`;
// Para promedios: si no es un número redondo se muestran los dos decimales ("$21,60" y no "$21,6")
const dineroPromedio = (n) => (Number.isInteger(n) ? dinero(n)
    : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

// Las 4 tarjetas del filtro de estado elegido: { titulo, valor, ayuda, tono }.
// `valor` ya viene como texto listo para mostrar. `tono`: 'dinero' (violeta), 'pendiente' (amarillo),
// 'rechazo' (rojo) o 'normal' (gris), los mismos colores que ya usa el panel.
export function tarjetasDelFiltro(estado, ventas, ahora = Date.now()) {
    const lista = Array.isArray(ventas) ? ventas.filter(Boolean) : [];

    if (estado === 'pendiente') {
        const pendientes = lista.filter((v) => v.estado === 'pendiente');
        const fechas = pendientes.map((v) => fechaEnMs(v.fecha)).filter((t) => t !== null);
        const masVieja = fechas.length > 0 ? Math.min(...fechas) : null;
        return [
            { titulo: 'Ventas pendientes', valor: String(pendientes.length), ayuda: 'Esperando que se pague', tono: 'pendiente' },
            { titulo: 'Entradas en espera', valor: String(pendientes.reduce((s, v) => s + aNumero(v.cantidad), 0)), ayuda: 'Todavía no se vendieron', tono: 'pendiente' },
            { titulo: 'Dinero en espera', valor: dinero(pendientes.reduce((s, v) => s + ingresoDeVenta(v), 0)), ayuda: 'Todavía no se cobró', tono: 'pendiente' },
            { titulo: 'La más antigua', valor: masVieja === null ? '—' : tiempoDesde(masVieja, ahora), ayuda: 'Venta pendiente más vieja', tono: 'normal' }
        ];
    }

    if (estado === 'rechazada') {
        const rechazadas = lista.filter((v) => v.estado === 'rechazada');
        const cuenta = new Map();
        for (const v of rechazadas) {
            if (v.motivo) cuenta.set(v.motivo, (cuenta.get(v.motivo) || 0) + 1);
        }
        let motivo = null;
        let max = 0;
        for (const [m, n] of cuenta) {
            if (n > max) { max = n; motivo = m; }
        }
        return [
            { titulo: 'Ventas rechazadas', valor: String(rechazadas.length), ayuda: 'No se completaron', tono: 'rechazo' },
            { titulo: 'Entradas que no se vendieron', valor: String(rechazadas.reduce((s, v) => s + aNumero(v.cantidad), 0)), ayuda: 'Volvieron a estar disponibles', tono: 'rechazo' },
            { titulo: 'Dinero no cobrado', valor: dinero(rechazadas.reduce((s, v) => s + ingresoDeVenta(v), 0)), ayuda: 'No suma a la recaudación', tono: 'rechazo' },
            { titulo: 'Motivo más frecuente', valor: motivo === null ? '—' : textoDelMotivo(motivo), ayuda: 'Por qué se rechazan más', tono: 'normal' }
        ];
    }

    const r = resumenDeVentas(lista);

    if (estado === 'confirmada') {
        return [
            { titulo: 'Total recaudado', valor: dinero(r.recaudado), ayuda: 'Solo ventas confirmadas', tono: 'dinero' },
            { titulo: 'Entradas vendidas', valor: String(r.entradas), ayuda: 'De ventas confirmadas', tono: 'normal' },
            { titulo: 'Ventas confirmadas', valor: String(r.confirmadas), ayuda: 'Pagos aprobados', tono: 'normal' },
            { titulo: 'Promedio por venta', valor: r.confirmadas > 0 ? dineroPromedio(r.recaudado / r.confirmadas) : '—', ayuda: 'Recaudado ÷ ventas', tono: 'normal' }
        ];
    }

    // 'todos' (y cualquier valor desconocido): las cifras generales de siempre
    return [
        { titulo: 'Total recaudado', valor: dinero(r.recaudado), ayuda: 'Solo ventas confirmadas', tono: 'dinero' },
        { titulo: 'Entradas vendidas', valor: String(r.entradas), ayuda: 'De ventas confirmadas', tono: 'normal' },
        { titulo: 'Ventas confirmadas', valor: String(r.confirmadas), ayuda: 'Pagos aprobados', tono: 'normal' },
        { titulo: 'Pendientes de pago', valor: String(r.pendientes), ayuda: 'No suman a la recaudación', tono: 'pendiente' }
    ];
}

// ======================================================================================================
// Evento activo y cifras de Resumen y Reportes (cambio panel-claro-resumen-reportes).
// Funciones puras: Resumen y Reportes calculan con las MISMAS, así que con el mismo evento los números no pueden diferir.
// Todo sale de las ventas confirmadas y de los lotes; los contadores "vendidas" guardados en los lotes NO se usan.
// ======================================================================================================

// Los eventos que una persona puede elegir. Superadmin: todos. Organización: los de su organización (`organizacionId`),
// la misma regla que eventosDeOrganizacion de shared/organizaciones.js (no se importa porque las pruebas cargan este
// archivo sin módulos). `uid` ya no se usa: se deja para no cambiar las llamadas.
export function eventosDeLaPersona(eventos, usuario, uid) {
    const lista = (Array.isArray(eventos) ? eventos : []).filter(Boolean);
    if (usuario && usuario.rol === 'superadmin') return lista;
    const suya = usuario && typeof usuario.organizacionId === 'string' ? usuario.organizacionId.trim() : '';
    if (!suya) return [];
    return lista.filter((ev) => typeof ev.organizacionId === 'string' && ev.organizacionId.trim() === suya);
}

// Cuál es el evento activo: el de la dirección (?id=) y, si no hay, el recordado. "todos" nunca se toma de lo recordado.
// Devuelve el id o '' si no hay ninguno. Lo usan el selector y la franja del evento activo.
export function elegirEventoActivo(deLaDireccion, recordado) {
    const limpio = (valor) => (typeof valor === 'string' ? valor.trim() : '');
    const direccion = limpio(deLaDireccion);
    if (direccion) return direccion;
    const guardado = limpio(recordado);
    return guardado === 'todos' ? '' : guardado;
}

// Las ventas de uno o varios eventos (por id)
export function ventasDeEventos(ventas, ids) {
    const buscados = new Set(Array.isArray(ids) ? ids : [ids]);
    return (Array.isArray(ventas) ? ventas : []).filter((v) => v && v.eventoId && buscados.has(v.eventoId));
}

// Las cifras de uno o varios eventos. `eventos` es una lista (con sus lotes) y `ventas` las ventas de esos eventos.
// `claveDe` (opcional) agrupa la forma de pago (claveDeFormaDePago: "Dinero en cuenta" cuenta como Transferencia).
export function cifrasDelEvento(eventos, ventas, claveDe = null) {
    const lista = (Array.isArray(eventos) ? eventos : []).filter(Boolean);
    const todas = (Array.isArray(ventas) ? ventas : []).filter(Boolean);
    const confirmadas = soloConfirmadas(todas);
    const resumen = resumenDeVentas(todas);

    const capacidad = lista.reduce((suma, ev) =>
        suma + (Array.isArray(ev.lotes) ? ev.lotes.reduce((s, l) => s + aNumero(l && l.disponibles), 0) : 0), 0);
    const entradas = resumen.entradas;
    const recaudado = resumen.recaudado;

    const porLote = new Map();
    const porMetodo = new Map();
    for (const v of confirmadas) {
        const lote = v.loteNombre || 'Sin lote';
        const dato = porLote.get(lote) || { nombre: lote, entradas: 0, dinero: 0 };
        dato.entradas += aNumero(v.cantidad);
        dato.dinero += ingresoDeVenta(v);
        porLote.set(lote, dato);
        const metodo = (typeof claveDe === 'function' ? claveDe(v.metodo_pago) : v.metodo_pago) || 'Desconocido';
        porMetodo.set(metodo, (porMetodo.get(metodo) || 0) + 1);
    }
    let loteMasVendido = null;
    let loteMasRentable = null;
    for (const dato of porLote.values()) {
        if (!loteMasVendido || dato.entradas > loteMasVendido.entradas) loteMasVendido = { nombre: dato.nombre, entradas: dato.entradas };
        if (!loteMasRentable || dato.dinero > loteMasRentable.dinero) loteMasRentable = { nombre: dato.nombre, dinero: dato.dinero };
    }
    let metodoMasUsado = null;
    for (const [nombre, cantidad] of porMetodo) {
        if (!metodoMasUsado || cantidad > metodoMasUsado.cantidad) {
            metodoMasUsado = { nombre, cantidad, porcentaje: Math.round((cantidad / resumen.confirmadas) * 100) };
        }
    }

    return {
        capacidad,
        entradas,
        aforoRestante: Math.max(0, capacidad - entradas),
        ocupacion: capacidad > 0 ? Math.round((entradas / capacidad) * 100) : 0,
        recaudado,
        confirmadas: resumen.confirmadas,
        pendientes: resumen.pendientes,
        promedioEntradas: resumen.confirmadas > 0 ? entradas / resumen.confirmadas : null,
        loteMasVendido,
        loteMasRentable,
        metodoMasUsado
    };
}

const miles = (n) => aNumero(n).toLocaleString();
const entradasPorCompra = (n) => (Number.isInteger(n) ? String(n) : n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

// Las tarjetas de Resumen: { id, titulo, valor, ayuda, tono, icono, ancho (1, 2 o 4 columnas), progreso (solo ocupación), texto (el valor es un nombre, no un número) }.
// Con `cifras = null` (datos que todavía no llegaron) devuelve las MISMAS tarjetas con "—", para que nada salte al cargar.
// Los títulos que también existen en Ventas son idénticos a los de allá.
// `nombreDelMetodo` (opcional) cambia solo el texto del método más usado (ej: nombreParaMostrar de formas-de-pago.js).
export function tarjetasDeResumen(cifras, nombreDelMetodo = (nombre) => nombre) {
    const c = cifras || null;
    const v = (valor) => (c ? valor : '—');
    return [
        { id: 'capacidad', titulo: 'Capacidad total', valor: v(c && miles(c.capacidad)), ayuda: 'Suma de las entradas de todos los lotes', tono: 'normal', icono: 'groups', ancho: 1 },
        { id: 'entradas', titulo: 'Entradas vendidas', valor: v(c && String(c.entradas)), ayuda: c ? `De ${miles(c.capacidad)} de capacidad · ventas confirmadas` : 'De ventas confirmadas', tono: 'normal', icono: 'confirmation_number', ancho: 1 },
        { id: 'aforo', titulo: 'Aforo restante', valor: v(c && miles(c.aforoRestante)), ayuda: 'Capacidad menos entradas vendidas', tono: 'normal', icono: 'event_seat', ancho: 1 },
        { id: 'ocupacion', titulo: 'Tasa de ocupación', valor: v(c && `${c.ocupacion}%`), ayuda: 'Entradas vendidas sobre la capacidad', tono: 'normal', icono: 'pie_chart', ancho: 1, progreso: c ? c.ocupacion : 0 },
        { id: 'recaudado', titulo: 'Total recaudado', valor: v(c && dinero(c.recaudado)), ayuda: 'Solo ventas confirmadas', tono: 'dinero', icono: 'payments', ancho: 2 },
        { id: 'confirmadas', titulo: 'Ventas confirmadas', valor: v(c && String(c.confirmadas)), ayuda: 'Pagos aprobados', tono: 'normal', icono: 'receipt_long', ancho: 1 },
        { id: 'pendientes', titulo: 'Pendientes de pago', valor: v(c && String(c.pendientes)), ayuda: 'No suman a la recaudación', tono: 'pendiente', icono: 'hourglass_top', ancho: 1 },
        { id: 'promedio', titulo: 'Prom. entradas/compra', valor: v(c && (c.promedioEntradas === null ? '—' : entradasPorCompra(c.promedioEntradas))), ayuda: 'Entradas ÷ ventas confirmadas', tono: 'normal', icono: 'shopping_cart', ancho: 1 },
        { id: 'loteVendido', titulo: 'Lote más vendido', valor: v(c && (c.loteMasVendido ? c.loteMasVendido.nombre : '—')), ayuda: c && c.loteMasVendido ? `${miles(c.loteMasVendido.entradas)} entradas` : 'Según las ventas confirmadas', tono: 'normal', icono: 'sell', ancho: 1, texto: true },
        { id: 'loteRentable', titulo: 'Lote más rentable', valor: v(c && (c.loteMasRentable ? c.loteMasRentable.nombre : '—')), ayuda: c && c.loteMasRentable ? `${dinero(c.loteMasRentable.dinero)} recaudados` : 'Según las ventas confirmadas', tono: 'normal', icono: 'trending_up', ancho: 1, texto: true },
        { id: 'metodo', titulo: 'Método más usado', valor: v(c && (c.metodoMasUsado ? nombreDelMetodo(c.metodoMasUsado.nombre) : '—')), ayuda: c && c.metodoMasUsado ? `${c.metodoMasUsado.porcentaje}% de las ventas confirmadas` : 'Según las ventas confirmadas', tono: 'normal', icono: 'account_balance_wallet', ancho: 1, texto: true }
    ];
}

// ======================================================================================================
// Secciones del PDF de Reportes (cambio formas-de-pago-reales). Función pura: se prueba con node.
// ======================================================================================================

// Las secciones del PDF, en el orden fijo en que salen
const SECCIONES_DEL_PDF = [
    { clave: 'resumen', titulo: 'Resumen general' },
    { clave: 'lotes', titulo: 'Desglose por lote' },
    { clave: 'detalle', titulo: 'Detalle de transacciones' },
    { clave: 'metodos', titulo: 'Métodos de pago' },
    { clave: 'indicadores', titulo: 'Indicadores clave' }
];

// Recibe las claves marcadas y devuelve las secciones a incluir: { clave, titulo, numero }, siempre en el orden
// fijo y numeradas 1, 2, 3… sin saltos. Las claves desconocidas o repetidas se ignoran; sin claves válidas devuelve [].
export function seccionesDelPdf(elegidas) {
    const marcadas = new Set(Array.isArray(elegidas) ? elegidas : []);
    return SECCIONES_DEL_PDF
        .filter((s) => marcadas.has(s.clave))
        .map((s, i) => ({ clave: s.clave, titulo: s.titulo, numero: i + 1 }));
}

// ======================================================================================================
// Nombre del archivo del PDF de Reportes (cambio evento-activo-en-todo-el-panel). Función pura: se prueba con node.
// ======================================================================================================

const LARGO_MAXIMO_DEL_EVENTO = 40;

// "Evently_Reporte_<evento>_<fecha>.pdf". El nombre del evento lo escribe un organizador: se le quitan tildes, espacios y
// caracteres especiales (solo quedan letras, números y guiones) y se le pone un largo máximo. Sin nombre: "Todos-los-eventos".
// `fecha` es un Date o un texto AAAA-MM-DD (se recibe para poder probarlo).
export function nombreDeArchivoDeReporte(nombreEvento, fecha = new Date()) {
    const limpio = (typeof nombreEvento === 'string' ? nombreEvento : '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, LARGO_MAXIMO_DEL_EVENTO)
        .replace(/-+$/g, '');
    const dia = Object.prototype.toString.call(fecha) === '[object Date]' && Number.isFinite(fecha.getTime())
        ? fecha.toISOString().slice(0, 10)
        : (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : new Date().toISOString().slice(0, 10));
    return `Evently_Reporte_${limpio || 'Todos-los-eventos'}_${dia}.pdf`;
}

const CLASE_DEL_TONO ={ dinero: 'text-violet-600', pendiente: 'text-yellow-600', normal: 'text-gray-800' };
const CLASE_DEL_ICONO = { pendiente: 'text-yellow-600' };
const CLASE_DE_COLUMNAS = { 1: '', 2: 'sm:col-span-2', 4: 'sm:col-span-2 lg:col-span-4' };

// El HTML de las tarjetas de Resumen (el mismo en Resumen y en Reportes). Todo texto pasa por escaparHtml;
// las clases salen de tablas fijas y el ancho de la barra de ocupación siempre es un número entre 0 y 100.
export function htmlDeTarjetasResumen(tarjetas) {
    return (Array.isArray(tarjetas) ? tarjetas : []).map((t) => `
                <div class="bg-white rounded-xl border border-gray-200 p-5 hover-card ${CLASE_DE_COLUMNAS[t.ancho] || ''}" title="${escaparHtml(t.titulo + ': ' + t.valor)}">
                    <div class="flex justify-between items-start">
                        <span class="text-sm text-gray-500">${escaparHtml(t.titulo)}</span>
                        <span class="material-symbols-outlined ${CLASE_DEL_ICONO[t.tono] || 'text-violet-600'}">${escaparHtml(t.icono)}</span>
                    </div>
                    <p class="${t.texto ? 'text-xl font-bold break-words' : 'kpi-value truncate'} ${CLASE_DEL_TONO[t.tono] || CLASE_DEL_TONO.normal} mt-2">${escaparHtml(t.valor)}</p>
                    ${t.progreso === undefined ? '' : `<div class="w-full bg-gray-200 rounded-full h-2 mt-2"><div class="bg-violet-600 h-2 rounded-full" style="width: ${Math.min(100, Math.max(0, Number(t.progreso) || 0))}%"></div></div>`}
                    <p class="text-xs text-gray-400 mt-1">${escaparHtml(t.ayuda)}</p>
                </div>`).join('');
}
