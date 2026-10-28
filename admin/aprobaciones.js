    // ==========================================
    // admin/aprobaciones.js
    // Lógica de las solicitudes de eventos: pestaña "Solicitudes" de Eventos (eventos-seleccion.html#solicitudes).
    // "Editar" abre la solicitud en el formulario completo de Crear evento (eventos.html?modo=directo&solicitud=<id>),
    // donde el superadmin elige también la categoría de costo de servicio y la publica.
    // ==========================================

    const db = window.db;
    const auth = window.auth;

    import { crearImagenEvento } from "../shared/imagen-evento.js";
    import { eventosDeOrganizacion } from "../shared/organizaciones.js";
    import { armarComentario, comentariosDeSolicitud, ultimoComentario, enlacesDeContacto } from "../shared/solicitudes-evento.js";
    import { resumenDeDias, detalleParaMostrar } from "../shared/evento-datos.js";
    import { escaparHtml } from "../shared/ventas-utils.js";
    import {
        collection, query, where, onSnapshot, doc, updateDoc, setDoc,
        serverTimestamp, getDoc, getDocs, arrayUnion, runTransaction
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    // Referencias al DOM (IDs únicos del modal de confirmación)
    const seccionSolicitudes = document.getElementById('seccion-solicitudes');
    const gridSolicitudes = document.getElementById('grid-solicitudes');
    const contadorSolicitudes = document.getElementById('contador-solicitudes');
    const botonesEstadoSolicitud = document.querySelectorAll('[data-estado-solicitud]');

    const modal = document.getElementById('modalConfirmacion');
    const modalTitulo = document.getElementById('modalConfirmacionTitulo');
    const modalMensaje = document.getElementById('modalConfirmacionMensaje');
    const contenedorMotivo = document.getElementById('contenedorMotivoConfirmacion');
    const inputMotivo = document.getElementById('inputMotivoConfirmacion');
    const btnCancelar = document.getElementById('btnCancelarModalConfirmacion');
    const btnConfirmar = document.getElementById('btnConfirmarModalConfirmacion');

    let accionPendiente = null;
    let solicitudSeleccionada = null;
    // Cuentas de organización (para el contacto: correo y teléfono), por uid, organizacionId y correo
    const organizacionesPorClave = new Map();
    // Nombre de cada organización (colección organizaciones), por su id: el organizacionId de las solicitudes
    const nombresDeOrganizacion = new Map();
    const organizacionPorSolicitud = new Map();
    let solicitudesCache = [];
    let estadoSolicitudesActual = 'pendiente';

    // Abre la solicitud en el formulario completo de Crear evento (solo las pendientes)
    function abrirEdicionCompleta(solicitud) {
        if ((solicitud.estado || 'pendiente') !== 'pendiente') return;
        window.location.href = `eventos.html?modo=directo&solicitud=${encodeURIComponent(solicitud.id)}`;
    }

    // ==========================================
    // 1. VERIFICACIÓN DE SEGURIDAD (SUPERADMIN)
    // ==========================================
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDocRef = doc(db, 'usuarios', user.uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists() && userSnap.data().rol === 'superadmin') {
                    seccionSolicitudes.classList.remove('hidden');
                    await cargarOrganizaciones();
                    inicializarSolicitudes();
                }
            } catch (error) {
                console.error('Error verificando el rol del usuario:', error);
            }
        }
    });

    async function cargarOrganizaciones() {
        try {
            const organizacionesSnap = await getDocs(query(
                collection(db, 'usuarios'),
                where('rol', '==', 'organizacion')
            ));

            organizacionesSnap.forEach(orgSnap => {
                const organizacion = { id: orgSnap.id, ...orgSnap.data() };
                [organizacion.id, organizacion.organizacionId, organizacion.email?.toLowerCase()]
                    .filter(Boolean)
                    .forEach(clave => organizacionesPorClave.set(clave, organizacion));
            });

            // Selector de organizaciones de la sección: las de la colección organizaciones, ordenadas por nombre
            const organizacionesSnapLista = await getDocs(collection(db, 'organizaciones'));
            organizacionesSnapLista.forEach(d => nombresDeOrganizacion.set(d.id, (d.data() || {}).nombre || 'Sin nombre'));
            const selector = document.getElementById('filtroOrganizacionSolicitud');
            const eliminadas = new Set(organizacionesSnapLista.docs.filter(d => (d.data() || {}).eliminada === true).map(d => d.id));
            [...nombresDeOrganizacion.entries()]
                .filter(([id]) => !eliminadas.has(id))
                .sort((a, b) => a[1].localeCompare(b[1], 'es'))
                .forEach(([id, nombre]) => selector.add(new Option(nombre, id)));
        } catch (error) {
            console.error('No se pudieron cargar las organizaciones para agrupar solicitudes:', error);
        }
    }

    // ==========================================
    // 2. ESCUCHAR SOLICITUDES EN TIEMPO REAL
    // ==========================================
    function inicializarSolicitudes() {
        onSnapshot(collection(db, 'solicitudes_eventos'), snapshot => {
            solicitudesCache = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            const pendientes = solicitudesCache.filter(solicitud => (solicitud.estado || 'pendiente') === 'pendiente').length;
            const insigniaPendientes = document.getElementById('pendientesSolicitudes');
            insigniaPendientes.textContent = pendientes;
            insigniaPendientes.classList.toggle('hidden', pendientes === 0);
            insigniaPendientes.classList.toggle('flex', pendientes > 0);
            renderizarSolicitudes();
        }, error => {
            console.error('No se pudieron cargar solicitudes pendientes:', error);
            gridSolicitudes.textContent = 'No se pudieron cargar las solicitudes. Verificá las reglas de Firestore.';
        });
    }

    function renderizarSolicitudes() {
        const busqueda = document.getElementById('buscarSolicitud').value.toLowerCase().trim();
        const organizacionId = document.getElementById('filtroOrganizacionSolicitud').value;
        const periodo = document.getElementById('filtroPeriodoSolicitud').value;
        const limite = new Date();
        if (periodo !== 'todos') limite.setDate(limite.getDate() - Number(periodo));

        // La organización de una solicitud es solo su organizacionId (la misma regla que los eventos)
        const deLaOrganizacion = organizacionId === 'todas' ? solicitudesCache : eventosDeOrganizacion(solicitudesCache, organizacionId);
        const visibles = deLaOrganizacion.filter(solicitud => {
            const nombreOrg = nombresDeOrganizacion.get(solicitud.organizacionId);
            const coincideEstado = (solicitud.estado || 'pendiente') === estadoSolicitudesActual;
            const coincideOrg = true;
            const coincideBusqueda = !busqueda || [solicitud.nombre, solicitud.correo, nombreOrg]
                .some(valor => (valor || '').toLowerCase().includes(busqueda));
            const fecha = solicitud.fechaSolicitud && typeof solicitud.fechaSolicitud.toDate === 'function'
                ? solicitud.fechaSolicitud.toDate()
                : null;
            const coincidePeriodo = periodo === 'todos' || !fecha || fecha >= limite;
            return coincideEstado && coincideOrg && coincideBusqueda && coincidePeriodo; // coincideOrg: ya se filtró arriba
        });

        gridSolicitudes.replaceChildren();
        contadorSolicitudes.textContent = visibles.length;

        if (visibles.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'bg-white border border-gray-200 rounded-lg text-center text-gray-500 py-8';
            const existenEnEstado = solicitudesCache.some(solicitud => (solicitud.estado || 'pendiente') === estadoSolicitudesActual);
            vacio.textContent = existenEnEstado
                ? 'No hay solicitudes para los filtros seleccionados.'
                : 'No hay solicitudes para este estado.';
            gridSolicitudes.appendChild(vacio);
            return;
        }

        const grupos = new Map();
        visibles.forEach(solicitud => {
            // La cuenta que la envió (solo para el contacto) y su organización (para agrupar)
            const organizacion = organizacionesPorClave.get(solicitud.creadoPor)
                || organizacionesPorClave.get(solicitud.correo?.toLowerCase());
            const clave = solicitud.organizacionId || 'sin-organizacion';
            const nombre = nombresDeOrganizacion.get(solicitud.organizacionId) || 'Sin organización';
            if (!grupos.has(clave)) grupos.set(clave, { nombre, solicitudes: [] });
            grupos.get(clave).solicitudes.push({ ...solicitud, nombreOrganizacion: nombre });
            // El teléfono se guarda aparte: la solicitud se copia entera al evento público y no debe llevarlo
            organizacionPorSolicitud.set(solicitud.id, organizacion || null);
        });

        [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).forEach(grupo => {
            const seccionGrupo = document.createElement('section');
            const encabezado = document.createElement('h3');
            encabezado.className = 'text-base font-semibold text-gray-800 mb-2';
            const etiquetaEstado = estadoSolicitudesActual === 'aprobada'
                ? (grupo.solicitudes.length === 1 ? 'aceptado' : 'aceptados')
                : estadoSolicitudesActual === 'rechazada'
                    ? (grupo.solicitudes.length === 1 ? 'rechazado' : 'rechazados')
                    : (grupo.solicitudes.length === 1 ? 'pendiente' : 'pendientes');
            encabezado.textContent = `${grupo.nombre} (${grupo.solicitudes.length} ${etiquetaEstado})`;
            const gridGrupo = document.createElement('div');
            gridGrupo.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch';
            seccionGrupo.append(encabezado, gridGrupo);
            gridSolicitudes.appendChild(seccionGrupo);
            grupo.solicitudes.forEach(solicitud => renderizarCard(solicitud, gridGrupo));
        });
    }

    ['buscarSolicitud', 'filtroOrganizacionSolicitud', 'filtroPeriodoSolicitud'].forEach(id => {
        document.getElementById(id).addEventListener(id === 'buscarSolicitud' ? 'input' : 'change', renderizarSolicitudes);
    });

    // ==========================================
    // 3. RENDERIZADO DE TARJETAS
    // ==========================================
    function renderizarCard(solicitud, contenedor = gridSolicitudes) {
        const estado = solicitud.estado || 'pendiente';
        const pendiente = estado === 'pendiente';
        const etiquetasEstado = { pendiente: 'PENDIENTE', aprobada: 'ACEPTADA', rechazada: 'RECHAZADA' };
        const mesesAbreviados = {
            enero: 'Ene', febrero: 'Feb', marzo: 'Mar', abril: 'Abr', mayo: 'May', junio: 'Jun',
            julio: 'Jul', agosto: 'Ago', septiembre: 'Sep', octubre: 'Oct', noviembre: 'Nov', diciembre: 'Dic'
        };
        const partesFecha = String(solicitud.fecha || '').trim().split(/\s+/);
        const mesFecha = (partesFecha[1] || '').toLocaleLowerCase('es');
        const fechaCorta = mesesAbreviados[mesFecha]
            ? `${partesFecha[0]} ${mesesAbreviados[mesFecha]}`
            : solicitud.fecha || 'Fecha sin definir';
        const cardElement = document.createElement('article');
        cardElement.className = 'bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200 flex flex-col';
        cardElement.dataset.solicitud = JSON.stringify(solicitud);

        const imagenFrame = document.createElement('div');
        imagenFrame.className = 'relative h-32 w-full bg-violet-50';
        const imagen = crearImagenEvento(solicitud, document, { clases: 'h-32' });

        const badge = document.createElement('span');
        badge.className = 'absolute top-2 right-2 bg-white/95 px-2 py-1 rounded text-[10px] font-bold text-violet-800 shadow-sm';
        badge.textContent = etiquetasEstado[estado] || estado.toUpperCase();
        imagenFrame.append(imagen, badge);

        const body = document.createElement('div');
        body.className = 'p-4 flex flex-col flex-1';
        const titulo = document.createElement('h3');
        titulo.className = 'text-lg font-bold text-gray-900 truncate';
        titulo.textContent = solicitud.nombre || 'Sin título';
        titulo.title = solicitud.nombre || '';

        // De qué organización es (pedido de la persona: que se vea en la tarjeta, no solo en el título del grupo)
        const lineaOrganizacion = document.createElement('p');
        lineaOrganizacion.className = 'text-sm font-semibold text-violet-700 truncate mt-1 flex items-center gap-1';
        const iconoOrg = document.createElement('span');
        iconoOrg.className = 'material-symbols-outlined text-[16px]';
        iconoOrg.textContent = 'corporate_fare';
        lineaOrganizacion.append(iconoOrg, document.createTextNode(solicitud.nombreOrganizacion || 'Sin organización'));

        const detalle = document.createElement('p');
        detalle.className = 'text-sm text-gray-600 truncate mt-1';
        detalle.textContent = `${fechaCorta} · ${solicitud.lugar || 'Lugar sin definir'}`;
        detalle.title = detalle.textContent;

        // Último comentario del superadmin (como texto) y accesos a comentar y a contactar a la organización
        const ultimo = ultimoComentario(solicitud);
        const comentarioVisible = document.createElement('p');
        comentarioVisible.className = ultimo ? 'text-xs text-gray-600 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 mt-3 line-clamp-2' : 'hidden';
        comentarioVisible.textContent = ultimo ? `Comentario: ${ultimo.texto}` : '';

        const contacto = document.createElement('div');
        contacto.className = 'flex flex-wrap gap-2 mt-3';
        // Ver todo el detalle (y desde ahí editar, publicar o rechazar)
        const verDetalle = document.createElement('button');
        verDetalle.type = 'button';
        verDetalle.className = 'px-3 py-1.5 rounded-lg border border-violet-600 text-violet-700 hover:bg-violet-50 text-xs font-semibold';
        verDetalle.textContent = 'Ver detalle';
        verDetalle.addEventListener('click', () => abrirDetalle(solicitud, cardElement));
        contacto.appendChild(verDetalle);
        if (pendiente) {
            const editar = document.createElement('button');
            editar.type = 'button';
            editar.className = 'px-3 py-1.5 rounded-lg border border-violet-600 text-violet-700 hover:bg-violet-50 text-xs font-semibold';
            editar.textContent = 'Editar';
            editar.addEventListener('click', () => abrirEdicionCompleta(solicitud));
            contacto.appendChild(editar);
        }

        const comentar = document.createElement('button');
        comentar.type = 'button';
        comentar.className = 'px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1';
        const cantidadComentarios = comentariosDeSolicitud(solicitud).length;
        comentar.textContent = cantidadComentarios ? `Comentar (${cantidadComentarios})` : 'Comentar';
        comentar.addEventListener('click', () => abrirModalComentarios(solicitud.id));
        contacto.appendChild(comentar);

        const organizacion = organizacionPorSolicitud.get(solicitud.id);
        const enlaces = enlacesDeContacto({
            correo: solicitud.correo || organizacion?.email,
            telefono: organizacion?.telefono,
            nombreEvento: solicitud.nombre
        });
        [['Escribir por correo', enlaces.correo], ['WhatsApp', enlaces.whatsapp]].forEach(([texto, href]) => {
            if (!href) return;
            const enlace = document.createElement('a');
            enlace.href = href;
            enlace.target = '_blank';
            enlace.rel = 'noopener noreferrer';
            enlace.className = 'px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold';
            enlace.textContent = texto;
            contacto.appendChild(enlace);
        });

        const acciones = document.createElement('div');
        acciones.className = 'flex gap-2 mt-auto pt-4';
        if (pendiente) {
            const rechazar = document.createElement('button');
            rechazar.type = 'button';
            rechazar.className = 'flex-1 px-2 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold';
            rechazar.textContent = 'Rechazar';
            rechazar.addEventListener('click', () => abrirModal('rechazar', cardElement));

            const publicar = document.createElement('button');
            publicar.type = 'button';
            publicar.className = 'flex-1 px-2 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold';
            publicar.textContent = 'Publicar';
            publicar.addEventListener('click', () => abrirModal('publicar', cardElement));
            acciones.append(rechazar, publicar);
        }

        body.append(titulo, lineaOrganizacion, detalle, comentarioVisible, contacto, acciones);
        cardElement.append(imagenFrame, body);

        contenedor.appendChild(cardElement);
    }

    // ==========================================
    // 3a. DETALLE COMPLETO DE UNA SOLICITUD (ver, contactar, editar, publicar o rechazar)
    // ==========================================
    function crearEl(tag, clase, texto) {
        const e = document.createElement(tag);
        if (clase) e.className = clase;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function abrirDetalle(solicitud, cardElement) {
        const pendiente = (solicitud.estado || 'pendiente') === 'pendiente';
        const cuenta = organizacionPorSolicitud.get(solicitud.id);
        const fondo = crearEl('div', 'fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4');
        const caja = crearEl('div', 'bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto');
        caja.setAttribute('role', 'dialog');
        caja.setAttribute('aria-modal', 'true');
        const cerrar = () => fondo.remove();
        fondo.addEventListener('click', (e) => { if (e.target === fondo) cerrar(); });
        fondo.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

        const portada = crearEl('div', 'relative h-44 bg-violet-50');
        portada.appendChild(crearImagenEvento(solicitud, document, { clases: 'h-44' }));
        const x = crearEl('button', 'absolute top-3 right-3 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-white');
        x.type = 'button';
        x.setAttribute('aria-label', 'Cerrar');
        x.appendChild(crearEl('span', 'material-symbols-outlined', 'close'));
        x.addEventListener('click', cerrar);
        portada.appendChild(x);

        const cuerpo = crearEl('div', 'p-6 space-y-5');
        const cabeza = crearEl('div');
        cabeza.append(crearEl('h2', 'text-2xl font-bold text-gray-900', solicitud.nombre || 'Sin título'),
            crearEl('p', 'text-sm font-semibold text-violet-700 mt-1', `Organización: ${solicitud.nombreOrganizacion || nombresDeOrganizacion.get(solicitud.organizacionId) || 'Sin organización'}`));
        cuerpo.appendChild(cabeza);

        // Contacto directo con la organización
        const contacto = crearEl('section', 'bg-violet-50 border border-violet-100 rounded-xl p-4');
        contacto.appendChild(crearEl('h3', 'text-sm font-bold text-gray-800 mb-2', 'Contacto de la organización'));
        const correo = solicitud.correo || cuenta?.email || '';
        const telefono = cuenta?.telefono || '';
        [['Cuenta', cuenta?.nombre || ''], ['Correo', correo], ['Teléfono', telefono ? String(telefono) : 'No cargado']].forEach(([k, v]) => {
            if (!v) return;
            const fila = crearEl('p', 'text-sm text-gray-700');
            fila.append(crearEl('span', 'text-gray-500', `${k}: `), document.createTextNode(v));
            contacto.appendChild(fila);
        });
        const enlaces = enlacesDeContacto({ correo, telefono, nombreEvento: solicitud.nombre });
        const botonesContacto = crearEl('div', 'flex flex-wrap gap-2 mt-3');
        [['mail', 'Escribir por correo', enlaces.correo], ['chat', 'WhatsApp', enlaces.whatsapp]].forEach(([icono, texto, href]) => {
            if (!href) return;
            const a = crearEl('a', 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 text-sm font-semibold');
            a.href = href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.append(crearEl('span', 'material-symbols-outlined text-base', icono), document.createTextNode(texto));
            botonesContacto.appendChild(a);
        });
        if (botonesContacto.children.length) contacto.appendChild(botonesContacto);
        cuerpo.appendChild(contacto);

        // Cuándo y dónde
        const datos = crearEl('section', 'grid grid-cols-1 sm:grid-cols-2 gap-4');
        const dias = resumenDeDias(solicitud);
        const cuando = crearEl('div');
        cuando.appendChild(crearEl('h3', 'text-xs font-semibold text-gray-500 uppercase', 'Cuándo'));
        (dias.length ? dias : ['Sin fecha']).forEach((d) => cuando.appendChild(crearEl('p', 'text-sm text-gray-800', d)));
        const donde = crearEl('div');
        donde.append(crearEl('h3', 'text-xs font-semibold text-gray-500 uppercase', 'Dónde'), crearEl('p', 'text-sm text-gray-800', solicitud.lugar || 'Sin lugar'));
        datos.append(cuando, donde);
        cuerpo.appendChild(datos);

        // Detalle de la actividad y descripción
        const detalle = detalleParaMostrar(solicitud);
        const filasDetalle = Array.isArray(detalle) ? detalle : Object.entries(detalle || {});
        if (filasDetalle.length) {
            const sec = crearEl('section');
            sec.appendChild(crearEl('h3', 'text-xs font-semibold text-gray-500 uppercase mb-1', 'Sobre el evento'));
            filasDetalle.forEach((f) => {
                const [k, v] = Array.isArray(f) ? f : [f.titulo || f.etiqueta || '', f.texto || f.valor || ''];
                if (!v) return;
                const p = crearEl('p', 'text-sm text-gray-800 whitespace-pre-line');
                p.append(crearEl('span', 'text-gray-500', k ? `${k}: ` : ''), document.createTextNode(v));
                sec.appendChild(p);
            });
            cuerpo.appendChild(sec);
        }

        // Entradas
        const lotes = Array.isArray(solicitud.lotes) ? solicitud.lotes : [];
        const secLotes = crearEl('section');
        secLotes.appendChild(crearEl('h3', 'text-xs font-semibold text-gray-500 uppercase mb-1', solicitud.ventaSimple ? 'Entrada' : 'Lotes'));
        if (!lotes.length) secLotes.appendChild(crearEl('p', 'text-sm text-gray-400', 'Sin lotes cargados.'));
        lotes.forEach((l) => {
            const fila = crearEl('div', 'flex justify-between gap-3 text-sm border-b border-gray-100 py-1.5');
            fila.append(crearEl('span', 'text-gray-800', `${l.nombre || 'Lote'}${l.vigencia ? ` · ${l.vigencia}` : ''}`),
                crearEl('span', 'font-semibold text-gray-900 whitespace-nowrap', `$${Number(l.precio || 0).toLocaleString('es-AR')} · ${Number(l.disponibles || 0)} lugares`));
            secLotes.appendChild(fila);
        });
        cuerpo.appendChild(secLotes);

        // Acciones
        const acciones = crearEl('div', 'flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100');
        const boton = (texto, clase, alHacer) => {
            const b = crearEl('button', `px-4 py-2 rounded-lg text-sm font-semibold ${clase}`, texto);
            b.type = 'button';
            b.addEventListener('click', () => { cerrar(); alHacer(); });
            return b;
        };
        acciones.appendChild(boton('Comentar', 'border border-gray-300 text-gray-700 hover:bg-gray-50', () => abrirModalComentarios(solicitud.id)));
        if (pendiente) {
            acciones.append(
                boton('Editar', 'border border-violet-600 text-violet-700 hover:bg-violet-50', () => abrirEdicionCompleta(solicitud)),
                boton('Rechazar', 'bg-gray-100 hover:bg-gray-200 text-gray-700', () => abrirModal('rechazar', cardElement)),
                boton('Publicar', 'bg-violet-600 hover:bg-violet-700 text-white', () => abrirModal('publicar', cardElement)));
        }
        cuerpo.appendChild(acciones);

        caja.append(portada, cuerpo);
        fondo.appendChild(caja);
        document.body.appendChild(fondo);
        x.focus();
    }

    // ==========================================
    // 3b. COMENTARIOS DE UNA SOLICITUD
    // ==========================================
    const modalComentar = document.getElementById('modalComentarSolicitud');
    const historialComentarios = document.getElementById('historialComentarios');
    const formComentar = document.getElementById('formComentarSolicitud');
    const textoComentar = document.getElementById('textoComentarSolicitud');
    const errorComentar = document.getElementById('errorComentarSolicitud');
    const btnGuardarComentar = document.getElementById('btnGuardarComentar');
    let solicitudComentandoId = null;

    // El historial se dibuja con textContent: el texto de un comentario nunca se interpreta como HTML
    function dibujarHistorial(solicitud) {
        historialComentarios.replaceChildren();
        const comentarios = comentariosDeSolicitud(solicitud);
        if (comentarios.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'text-sm text-gray-400';
            vacio.textContent = 'Todavía no hay comentarios en esta solicitud.';
            historialComentarios.appendChild(vacio);
            return;
        }
        comentarios.forEach(comentario => {
            const caja = document.createElement('div');
            caja.className = 'bg-violet-50 border border-violet-100 rounded-lg px-3 py-2';
            const texto = document.createElement('p');
            texto.className = 'text-sm text-gray-800 whitespace-pre-line';
            texto.textContent = comentario.texto;
            const cuando = document.createElement('p');
            cuando.className = 'text-[11px] text-gray-400 mt-1';
            const fecha = new Date(comentario.fecha);
            cuando.textContent = Number.isNaN(fecha.getTime()) ? '' : fecha.toLocaleString('es-AR');
            caja.append(texto, cuando);
            historialComentarios.appendChild(caja);
        });
    }

    function abrirModalComentarios(solicitudId) {
        const solicitud = solicitudesCache.find(item => item.id === solicitudId);
        if (!solicitud) return;
        solicitudComentandoId = solicitudId;
        document.getElementById('subtituloComentarSolicitud').textContent = solicitud.nombre || 'Solicitud sin título';
        textoComentar.value = '';
        errorComentar.classList.add('hidden');
        dibujarHistorial(solicitud);
        modalComentar.classList.remove('hidden');
        modalComentar.classList.add('flex');
        textoComentar.focus();
    }

    function cerrarModalComentarios() {
        modalComentar.classList.add('hidden');
        modalComentar.classList.remove('flex');
        solicitudComentandoId = null;
    }

    document.getElementById('btnCerrarModalComentar').addEventListener('click', cerrarModalComentarios);
    document.getElementById('btnCancelarComentar').addEventListener('click', cerrarModalComentarios);

    formComentar.addEventListener('submit', async event => {
        event.preventDefault();
        if (!solicitudComentandoId) return;
        const comentario = armarComentario(textoComentar.value, new Date());
        if (!comentario) {
            errorComentar.textContent = 'Escribí el comentario antes de guardar.';
            errorComentar.classList.remove('hidden');
            return;
        }
        errorComentar.classList.add('hidden');
        btnGuardarComentar.disabled = true;
        try {
            // arrayUnion agrega sin pisar los comentarios anteriores. No cambia el estado de la solicitud.
            await updateDoc(doc(db, 'solicitudes_eventos', solicitudComentandoId), { comentarios: arrayUnion(comentario) });
            textoComentar.value = '';
            const actualizada = solicitudesCache.find(item => item.id === solicitudComentandoId);
            if (actualizada) dibujarHistorial({ ...actualizada, comentarios: [...(actualizada.comentarios || []), comentario] });
        } catch (error) {
            console.error('No se pudo guardar el comentario:', error);
            errorComentar.textContent = 'No se pudo guardar el comentario. Intentá otra vez.';
            errorComentar.classList.remove('hidden');
        } finally {
            btnGuardarComentar.disabled = false;
        }
    });

    // ==========================================
    // 4. LÓGICA DEL MODAL DE CONFIRMACIÓN
    // ==========================================
    function abrirModal(accion, cardElement) {
        solicitudSeleccionada = JSON.parse(cardElement.dataset.solicitud);
        accionPendiente = accion;

        if (accion === 'publicar') {
            modalTitulo.textContent = 'Publicar Evento';
            modalMensaje.innerHTML = `¿Confirmas la publicación de <strong>${escaparHtml(solicitudSeleccionada.nombre || '')}</strong>? Pasará a la cartelera pública.`;
            contenedorMotivo.classList.add('hidden');
            btnConfirmar.textContent = 'Sí, Publicar';
            btnConfirmar.className = 'px-5 py-2 text-white font-medium rounded-lg transition shadow-md min-w-[120px] bg-violet-600 hover:bg-violet-700';
        } else {
            modalTitulo.textContent = 'Rechazar Solicitud';
            modalMensaje.innerHTML = `Vas a rechazar el evento <strong>${escaparHtml(solicitudSeleccionada.nombre || '')}</strong>.`;
            contenedorMotivo.classList.remove('hidden');
            inputMotivo.value = '';
            btnConfirmar.textContent = 'Rechazar Evento';
            btnConfirmar.className = 'px-5 py-2 text-white font-medium rounded-lg transition shadow-md min-w-[120px] bg-red-500 hover:bg-red-600';
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    btnCancelar.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });

    btnConfirmar.addEventListener('click', async () => {
        if (!solicitudSeleccionada) return;

        const textoOriginal = btnConfirmar.textContent;
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = `<span class="animate-pulse">Procesando...</span>`;
        btnConfirmar.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            if (accionPendiente === 'publicar') {
                await procesarPublicacion(solicitudSeleccionada);
            } else if (accionPendiente === 'rechazar') {
                const motivo = inputMotivo.value.trim();
                await procesarRechazo(solicitudSeleccionada.id, motivo);
            }

            modal.classList.add('hidden');
            modal.classList.remove('flex');
        } catch (error) {
            console.error('Error al procesar solicitud:', error);
            alert('Ocurrió un error: ' + error.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = textoOriginal;
            btnConfirmar.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    });

    // ==========================================
    // 5. OPERACIONES A FIREBASE FIRESTORE
    // ==========================================
    async function procesarPublicacion(solicitud) {
        const solicitudRef = doc(db, 'solicitudes_eventos', solicitud.id);
        const eventoRef = doc(db, 'eventos', solicitud.id);

        // El evento es de la organización de la solicitud. Si la cuenta se vinculó después de enviarla, se toma la de la cuenta.
        const cuenta = organizacionPorSolicitud.get(solicitud.id);
        const organizacionId = solicitud.organizacionId || cuenta?.organizacionId || '';
        if (!organizacionId || !nombresDeOrganizacion.has(organizacionId)) {
            throw new Error('La solicitud no tiene una organización que exista. Vinculá la cuenta que la envió en "Organizaciones" y volvé a publicarla.');
        }

        // En una transacción y con lo GUARDADO (no la copia de la tarjeta): si otra pestaña ya la publicó o la
        // rechazó, o la cambió desde el formulario completo, no se pisa nada
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(solicitudRef);
            if (!snap.exists() || (snap.data().estado || 'pendiente') !== 'pendiente') throw new Error('Esta solicitud ya fue revisada. Recargá la página.');
            const dataEvento = { ...snap.data(), organizacionId: snap.data().organizacionId || organizacionId };
            delete dataEvento.comentarios; // los comentarios son entre el superadmin y la organización: el evento es público
            dataEvento.imagen = typeof dataEvento.imagen === 'string' ? dataEvento.imagen.trim() : '';
            dataEvento.estado = 'publicado';
            dataEvento.fechaPublicacion = serverTimestamp();
            tx.set(eventoRef, dataEvento);
            tx.update(solicitudRef, { estado: 'aprobada', fechaAprobacion: serverTimestamp() });
        });
    }

    async function procesarRechazo(solicitudId, motivo) {
        const solicitudRef = doc(db, 'solicitudes_eventos', solicitudId);

        await updateDoc(solicitudRef, {
            estado: 'rechazada',
            motivoRechazo: motivo || 'Rechazado por el administrador sin motivo especificado.',
            fechaRechazo: serverTimestamp()
        });
    }

    botonesEstadoSolicitud.forEach(boton => {
        boton.addEventListener('click', () => {
            estadoSolicitudesActual = boton.dataset.estadoSolicitud;
            botonesEstadoSolicitud.forEach(opcion => {
                const activa = opcion === boton;
                opcion.setAttribute('aria-pressed', String(activa));
                opcion.className = activa
                    ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-violet-600 text-white'
                    : 'px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100';
            });
            renderizarSolicitudes();
        });
    });