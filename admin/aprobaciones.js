    // ==========================================
    // admin/aprobaciones.js
    // Lógica de las solicitudes de eventos: pestaña "Solicitudes" de "Crear evento" (eventos.html?modo=directo)
    // ==========================================

    const db = window.db;
    const auth = window.auth;

    import { crearImagenEvento } from "../shared/imagen-evento.js";
    import { armarComentario, comentariosDeSolicitud, ultimoComentario, enlacesDeContacto } from "../shared/solicitudes-evento.js";
    import {
        collection, query, where, onSnapshot, doc, updateDoc, setDoc,
        serverTimestamp, getDoc, getDocs, deleteField, arrayUnion
    } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

    // Referencias al DOM (IDs únicos del modal de confirmación)
    const seccionSolicitudes = document.getElementById('seccion-solicitudes');
    const gridSolicitudes = document.getElementById('grid-solicitudes');
    const contadorSolicitudes = document.getElementById('contador-solicitudes');
    const botonesEstadoSolicitud = document.querySelectorAll('[data-estado-solicitud]');
    const modalEditarSolicitud = document.getElementById('modalEditarSolicitud');
    const formEditarSolicitud = document.getElementById('formEditarSolicitud');
    const lotesEdicionContainer = document.getElementById('lotesEdicionContainer');
    const errorEditarSolicitud = document.getElementById('errorEditarSolicitud');
    const btnGuardarEdicion = document.getElementById('btnGuardarEdicion');

    const modal = document.getElementById('modalConfirmacion');
    const modalTitulo = document.getElementById('modalConfirmacionTitulo');
    const modalMensaje = document.getElementById('modalConfirmacionMensaje');
    const contenedorMotivo = document.getElementById('contenedorMotivoConfirmacion');
    const inputMotivo = document.getElementById('inputMotivoConfirmacion');
    const btnCancelar = document.getElementById('btnCancelarModalConfirmacion');
    const btnConfirmar = document.getElementById('btnConfirmarModalConfirmacion');

    let accionPendiente = null;
    let solicitudSeleccionada = null;
    const organizacionesPorClave = new Map();
    const organizacionPorSolicitud = new Map();
    let solicitudesCache = [];
    let estadoSolicitudesActual = 'pendiente';
    let solicitudEditando = null;

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

            // Selector de organizaciones de la sección (una opción por organización, ordenadas por nombre)
            const selector = document.getElementById('filtroOrganizacionSolicitud');
            const unicas = new Map();
            organizacionesPorClave.forEach(organizacion => unicas.set(organizacion.id, organizacion));
            [...unicas.values()]
                .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'))
                .forEach(organizacion => selector.add(new Option(organizacion.nombre || organizacion.email || 'Sin nombre', organizacion.id)));
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

        const visibles = solicitudesCache.filter(solicitud => {
            const org = organizacionesPorClave.get(solicitud.organizacionId)
                || organizacionesPorClave.get(solicitud.creadoPor)
                || organizacionesPorClave.get(solicitud.correo?.toLowerCase());
            const coincideEstado = (solicitud.estado || 'pendiente') === estadoSolicitudesActual;
            const coincideOrg = organizacionId === 'todas' || org?.id === organizacionId;
            const coincideBusqueda = !busqueda || [solicitud.nombre, solicitud.correo, org?.nombre]
                .some(valor => (valor || '').toLowerCase().includes(busqueda));
            const fecha = solicitud.fechaSolicitud && typeof solicitud.fechaSolicitud.toDate === 'function'
                ? solicitud.fechaSolicitud.toDate()
                : null;
            const coincidePeriodo = periodo === 'todos' || !fecha || fecha >= limite;
            return coincideEstado && coincideOrg && coincideBusqueda && coincidePeriodo;
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
            const organizacion = organizacionesPorClave.get(solicitud.organizacionId)
                || organizacionesPorClave.get(solicitud.creadoPor)
                || organizacionesPorClave.get(solicitud.correo?.toLowerCase());
            const clave = organizacion?.id || solicitud.organizacionId || solicitud.creadoPor || solicitud.correo || 'sin-organizacion';
            const nombre = organizacion?.nombre || solicitud.nombreOrganizacion || solicitud.organizacionId || solicitud.correo || 'Organización no identificada';
            if (!grupos.has(clave)) grupos.set(clave, { nombre, solicitudes: [] });
            grupos.get(clave).solicitudes.push({ ...solicitud, nombreOrganizacion: organizacion?.nombre || nombre });
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

        body.append(titulo, detalle, comentarioVisible, contacto, acciones);
        cardElement.append(imagenFrame, body);

        contenedor.appendChild(cardElement);
    }

    function crearFilaLoteEdicion(lote = {}) {
        const fila = document.createElement('div');
        fila.dataset.loteEdicion = 'true';
        fila.dataset.vendidas = String(Number(lote.vendidas) || 0);
        fila.className = 'grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-gray-200 p-3';

        const nombre = document.createElement('input');
        nombre.type = 'text';
        nombre.maxLength = 100;
        nombre.required = true;
        nombre.placeholder = 'Nombre del lote';
        nombre.value = lote.nombre || '';
        nombre.dataset.campo = 'nombre';
        nombre.className = 'border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500';

        const precio = document.createElement('input');
        precio.type = 'number';
        precio.min = '0.01';
        precio.step = '0.01';
        precio.required = true;
        precio.placeholder = 'Precio';
        precio.value = lote.precio ?? '';
        precio.dataset.campo = 'precio';
        precio.className = 'border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500';

        const disponibles = document.createElement('input');
        disponibles.type = 'number';
        disponibles.min = '1';
        disponibles.step = '1';
        disponibles.required = true;
        disponibles.placeholder = 'Disponibles';
        disponibles.value = lote.disponibles ?? '';
        disponibles.dataset.campo = 'disponibles';
        disponibles.className = 'border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500';

        const vigencia = document.createElement('input');
        vigencia.type = 'text';
        vigencia.maxLength = 120;
        vigencia.placeholder = 'Vigencia (opcional)';
        vigencia.value = lote.vigencia || '';
        vigencia.dataset.campo = 'vigencia';
        vigencia.className = 'sm:col-span-2 border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500';

        const eliminar = document.createElement('button');
        eliminar.type = 'button';
        eliminar.className = 'rounded-lg px-2 py-2 text-sm text-red-700 hover:bg-red-50';
        eliminar.textContent = 'Quitar lote';
        eliminar.addEventListener('click', () => fila.remove());

        fila.append(nombre, precio, disponibles, vigencia, eliminar);
        return fila;
    }

    function abrirModalEdicion(solicitud) {
        if ((solicitud.estado || 'pendiente') !== 'pendiente') return;
        solicitudEditando = solicitud;
        document.getElementById('editarNombreSolicitud').value = solicitud.nombre || '';
        const campoFecha = document.getElementById('editarFechaSolicitud');
        campoFecha.value = solicitud.fecha || '';
        // Con días y horarios cargados, la fecha es la del primer día: cambiarla a mano los dejaría contradictorios
        const tieneDias = Array.isArray(solicitud.dias) && solicitud.dias.length > 0;
        campoFecha.readOnly = tieneDias;
        campoFecha.classList.toggle('bg-gray-100', tieneDias);
        campoFecha.title = tieneDias ? 'La fecha sale de los días del evento. Para cambiarlos, pedí una solicitud nueva.' : '';
        document.getElementById('editarLugarSolicitud').value = solicitud.lugar || '';
        errorEditarSolicitud.classList.add('hidden');
        lotesEdicionContainer.replaceChildren();
        (solicitud.lotes || []).forEach(lote => lotesEdicionContainer.appendChild(crearFilaLoteEdicion(lote)));
        if (!solicitud.lotes?.length) lotesEdicionContainer.appendChild(crearFilaLoteEdicion());
        modalEditarSolicitud.classList.remove('hidden');
        modalEditarSolicitud.classList.add('flex');
        document.getElementById('editarNombreSolicitud').focus();
    }

    function cerrarModalEdicion() {
        modalEditarSolicitud.classList.add('hidden');
        modalEditarSolicitud.classList.remove('flex');
        solicitudEditando = null;
    }

    document.getElementById('btnCerrarModalEditar').addEventListener('click', cerrarModalEdicion);
    document.getElementById('btnCancelarEdicion').addEventListener('click', cerrarModalEdicion);
    document.getElementById('btnAgregarLoteEdicion').addEventListener('click', () => {
        lotesEdicionContainer.appendChild(crearFilaLoteEdicion());
    });

    formEditarSolicitud.addEventListener('submit', async event => {
        event.preventDefault();
        if (!solicitudEditando || (solicitudEditando.estado || 'pendiente') !== 'pendiente') return;

        const solicitudActual = solicitudesCache.find(item => item.id === solicitudEditando.id);
        if (!solicitudActual || (solicitudActual.estado || 'pendiente') !== 'pendiente') {
            errorEditarSolicitud.textContent = 'La solicitud ya no está pendiente y no se puede editar.';
            errorEditarSolicitud.classList.remove('hidden');
            return;
        }

        const lotes = [...lotesEdicionContainer.querySelectorAll('[data-lote-edicion]')].map(fila => ({
            nombre: fila.querySelector('[data-campo="nombre"]').value.trim(),
            precio: Number(fila.querySelector('[data-campo="precio"]').value),
            disponibles: Number.parseInt(fila.querySelector('[data-campo="disponibles"]').value, 10),
            vendidas: Number(fila.dataset.vendidas) || 0,
            vigencia: fila.querySelector('[data-campo="vigencia"]').value.trim()
        }));

        if (lotes.length === 0 || lotes.some(lote => !lote.nombre || !Number.isFinite(lote.precio) || lote.precio <= 0 || !Number.isInteger(lote.disponibles) || lote.disponibles < 1)) {
            errorEditarSolicitud.textContent = 'Agregá al menos un lote e ingresá nombre, precio y cantidad válida en cada uno.';
            errorEditarSolicitud.classList.remove('hidden');
            return;
        }

        const cambios = {
            nombre: document.getElementById('editarNombreSolicitud').value.trim(),
            fecha: document.getElementById('editarFechaSolicitud').value.trim(),
            lugar: document.getElementById('editarLugarSolicitud').value.trim(),
            lotes
        };
        // Si cambia el texto del lugar, el punto del mapa elegido antes ya no corresponde: se saca para no mostrar un mapa equivocado
        if (solicitudActual.ubicacion && cambios.lugar !== (solicitudActual.lugar || '')) cambios.ubicacion = deleteField();
        if (!cambios.nombre || !cambios.fecha || !cambios.lugar) {
            errorEditarSolicitud.textContent = 'Nombre, fecha y lugar son obligatorios.';
            errorEditarSolicitud.classList.remove('hidden');
            return;
        }

        btnGuardarEdicion.disabled = true;
        try {
            await updateDoc(doc(db, 'solicitudes_eventos', solicitudEditando.id), cambios);
            cerrarModalEdicion();
        } catch (error) {
            console.error('No se pudo actualizar la solicitud:', error);
            errorEditarSolicitud.textContent = 'No se pudo guardar. Verificá los permisos de Firestore e intentá otra vez.';
            errorEditarSolicitud.classList.remove('hidden');
        } finally {
            btnGuardarEdicion.disabled = false;
        }
    });

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
            modalMensaje.innerHTML = `¿Confirmas la publicación de <strong>${solicitudSeleccionada.nombre}</strong>? Pasará a la cartelera pública.`;
            contenedorMotivo.classList.add('hidden');
            btnConfirmar.textContent = 'Sí, Publicar';
            btnConfirmar.className = 'px-5 py-2 text-white font-medium rounded-lg transition shadow-md min-w-[120px] bg-violet-600 hover:bg-violet-700';
        } else {
            modalTitulo.textContent = 'Rechazar Solicitud';
            modalMensaje.innerHTML = `Vas a rechazar el evento <strong>${solicitudSeleccionada.nombre}</strong>.`;
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

        const dataEvento = { ...solicitud };
        delete dataEvento.id;
        delete dataEvento.comentarios; // los comentarios son entre el superadmin y la organización: el evento es público
        dataEvento.imagen = typeof solicitud.imagen === 'string' ? solicitud.imagen.trim() : '';
        dataEvento.estado = 'publicado';
        dataEvento.fechaPublicacion = serverTimestamp();

        await setDoc(eventoRef, dataEvento);
        await updateDoc(solicitudRef, { estado: 'aprobada' });
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