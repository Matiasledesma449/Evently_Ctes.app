// shared/menu-rol.js
// Sin import - usa las variables globales de firebase-init.js

// Este archivo maneja los roles (qué secciones se muestran), los avisos de no leídos y el cierre de sesión.
// El menú en sí (dibujo, botón de achicar y estado) vive en shared/menu-admin.js.

// =====================================================
// 2. LÓGICA DE ROLES Y BADGE DE MENSAJES
// =====================================================
function aplicarRolVisual(rol) {
    // En la vista "Ver como organización" un superadmin se muestra como organización (solo lo que se ve)
    rol = window.rolEfectivo ? window.rolEfectivo(rol) : rol;
    const esAdmin = rol === 'superadmin';
    const esOrganizacion = rol === 'organizacion';
    document.querySelectorAll('[data-role="superadmin"]').forEach(enlace => enlace.classList.toggle('hidden', !esAdmin));
    document.querySelectorAll('[data-role="organizacion"]').forEach(enlace => enlace.classList.toggle('hidden', !esOrganizacion));

    const nuevoHref = esAdmin ? 'mensajes.html' : 'soporte.html';
    document.querySelectorAll('.link-soporte, .link-soporte-mobile').forEach(enlace => {
        enlace.href = nuevoHref;
        enlace.classList.remove('hidden');
    });
    document.querySelectorAll('.icono-soporte, .icono-soporte-mobile').forEach(icono => {
        icono.textContent = esAdmin ? 'chat' : 'support_agent';
    });
    document.querySelectorAll('.texto-soporte, .texto-soporte-mobile').forEach(texto => {
        texto.textContent = esAdmin ? 'Mensajes' : 'Soporte';
    });

    const eventoId = localStorage.getItem('eventoId');
    const hrefDashboard = eventoId ? `dashboard.html?id=${encodeURIComponent(eventoId)}` : 'dashboard.html';
    document.querySelectorAll('[data-nav-key="dashboard"]').forEach(enlace => { enlace.href = hrefDashboard; });

    const paginaActual = window.location.pathname.split('/').pop();
    document.querySelectorAll('[data-nav-key]').forEach(enlace => {
        const destino = enlace.dataset.navKey === 'soporte-mensajes'
            ? esAdmin ? 'mensajes.html' : 'soporte.html'
            : `${enlace.dataset.navKey}.html`;
        // Consultas públicas es una pestaña de Mensajes: la sección activa sigue siendo Mensajes
        const activo = paginaActual === destino
            || (enlace.dataset.navKey === 'soporte-mensajes' && esAdmin && paginaActual === 'consultas-publicas.html')
            || (enlace.dataset.navKey === 'eventos-seleccion' && esAdmin && paginaActual === 'organizaciones.html');
        if (enlace.classList.contains('mobile-nav-link')) {
            enlace.classList.toggle('text-violet-600', activo);
            enlace.classList.toggle('text-gray-500', !activo);
        } else {
            enlace.classList.toggle('active-link', activo);
            enlace.classList.toggle('font-medium', activo);
            enlace.classList.toggle('text-gray-600', !activo);
        }
        if (activo) enlace.setAttribute('aria-current', 'page');
        else enlace.removeAttribute('aria-current');
    });

    document.querySelectorAll('.admin-role-nav').forEach(nav => nav.classList.remove('invisible'));
}

const rolCacheado = localStorage.getItem('eventlyRol');
if (rolCacheado) aplicarRolVisual(rolCacheado);

function initRoles() {
    if (typeof auth === 'undefined' || !auth) {
        console.warn('⚠️ auth no está disponible todavía');
        return;
    }

    const mostrarNavegacion = () => document.querySelectorAll('.admin-role-nav').forEach(nav => nav.classList.remove('invisible'));

    window.onAuthStateChanged(auth, async (user) => {
        if (!user) {
            localStorage.removeItem('eventlyRol'); localStorage.removeItem('vistaComo'); localStorage.removeItem('vistaOrganizacionId'); localStorage.removeItem('organizacionElegida'); localStorage.removeItem('organizacionElegidaNombre');
            aplicarRolVisual(null);
            mostrarNavegacion();
            return;
        }
        try {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (!userDoc.exists()) {
                localStorage.removeItem('eventlyRol'); localStorage.removeItem('vistaComo'); localStorage.removeItem('vistaOrganizacionId'); localStorage.removeItem('organizacionElegida'); localStorage.removeItem('organizacionElegidaNombre');
                aplicarRolVisual(null);
                mostrarNavegacion();
                return;
            }

            const rol = userDoc.data().rol;
            localStorage.setItem('eventlyRol', rol);
            // La vista "Ver como organización" solo vale para un superadmin real
            if (rol !== 'superadmin' && localStorage.getItem('vistaComo')) {
                localStorage.removeItem('vistaComo'); localStorage.removeItem('vistaOrganizacionId'); localStorage.removeItem('organizacionElegida'); localStorage.removeItem('organizacionElegidaNombre');
                if (document.getElementById('avisoVistaOrganizacion')) { location.reload(); return; }
            }
            // La franja rosa también es solo del superadmin (se dibujó con un rol recordado que ya no vale)
            if (rol !== 'superadmin' && document.getElementById('franjaOrganizacion')) { location.reload(); return; }
            const esAdmin = (window.rolEfectivo ? window.rolEfectivo(rol) : rol) === 'superadmin';
            aplicarRolVisual(rol);
            actualizarBadgeConsultasPublicas(esAdmin);

            // Iniciar contadores de notificaciones
            escucharNoLeidos(user.uid, esAdmin);
            mostrarNavegacion();
        } catch (e) {
            console.error('Error al verificar rol:', e);
            localStorage.removeItem('eventlyRol'); localStorage.removeItem('vistaComo'); localStorage.removeItem('vistaOrganizacionId'); localStorage.removeItem('organizacionElegida'); localStorage.removeItem('organizacionElegidaNombre');
            aplicarRolVisual(null);
            mostrarNavegacion();
        }
    });
}

// Lo que se cuenta para la sección Mensajes del superadmin: sus dos pestañas y la suma en el menú
let avisoMensajes = 0;   // mensajes sin leer de organizaciones + solicitudes de contraseña
let avisoConsultas = 0;  // consultas públicas nuevas
let esSuperadminAvisos = false;

function pintarContador(selector, cantidad) {
    document.querySelectorAll(selector).forEach(el => {
        el.textContent = cantidad > 99 ? '99+' : String(cantidad);
        el.classList.toggle('hidden', cantidad === 0);
        el.classList.toggle('flex', cantidad > 0);
    });
}

function pintarAvisos() {
    actualizarBadge(esSuperadminAvisos ? avisoMensajes + avisoConsultas : avisoMensajes);
    pintarContador('.contador-pestana-mensajes', avisoMensajes);
    pintarContador('.contador-pestana-consultas', avisoConsultas);
}

function actualizarBadgeConsultasPublicas(esAdmin) {
    if (!esAdmin) return;
    esSuperadminAvisos = true;
    const badges = [...document.querySelectorAll('.badge-consultas-publicas')];
    const consultasNuevasQuery = query(
        collection(db, 'consultas_publicas'),
        where('estado', '==', 'nueva')
    );

    onSnapshot(consultasNuevasQuery, snapshot => {
        const cantidad = snapshot.size;
        avisoConsultas = cantidad;
        pintarAvisos();
        badges.forEach(badge => {
            badge.textContent = cantidad > 99 ? '99+' : String(cantidad);
            badge.classList.toggle('hidden', cantidad === 0);
            if (cantidad > 0) badge.classList.add('flex');
            else badge.classList.remove('flex');
        });
    }, error => {
        console.error('No se pudo cargar el contador de consultas públicas:', error);
    });
}

// ✅ Ejecutar cuando Firebase esté listo
if (window.auth) {
    initRoles();
} else {
    window.addEventListener('firebase-ready', initRoles);
}

// --- Contador de mensajes no leídos + solicitudes de contraseña ---
function escucharNoLeidos(miUid, esAdmin) {
    let totalMensajesNoLeidos = 0;
    let totalSolicitudesPendientes = 0;

    function actualizarTotal() {
        avisoMensajes = totalMensajesNoLeidos + totalSolicitudesPendientes;
        pintarAvisos(); // el menú suma también las consultas públicas (superadmin)
    }

    // 1. Contar mensajes no leídos (solo para superadmin)
    if (esAdmin) {
        const qConv = query(
            collection(db, "conversaciones"),
            where("participantes", "array-contains", miUid)
        );

        onSnapshot(qConv, (snapshotConv) => {
            const conversacionesIds = [];
            snapshotConv.forEach(d => conversacionesIds.push(d.id));

            if (conversacionesIds.length === 0) {
                totalMensajesNoLeidos = 0;
                actualizarTotal();
                return;
            }

            const chunks = [];
            for (let i = 0; i < conversacionesIds.length; i += 10) {
                chunks.push(conversacionesIds.slice(i, i + 10));
            }

            const resultadosChunks = {};

            chunks.forEach((chunkIds, idx) => {
                const qMsg = query(
                    collection(db, "mensajes"),
                    where("conversacionId", "in", chunkIds)
                );

                onSnapshot(qMsg, (snapshotMsg) => {
                    let countChunk = 0;
                    snapshotMsg.forEach(d => {
                        const m = d.data();
                        if (!m.leido && m.de !== miUid) countChunk++;
                    });

                    resultadosChunks[idx] = countChunk;

                    let total = 0;
                    Object.values(resultadosChunks).forEach(c => total += c);
                    totalMensajesNoLeidos = total;
                    actualizarTotal();
                });
            });
        });

        // ✅ 2. Contar solicitudes de contraseña pendientes
        const qSolicitudes = query(
            collection(db, "solicitudes_password"),
            where("estado", "==", "pendiente")
        );

        onSnapshot(qSolicitudes, (snapshotSol) => {
            totalSolicitudesPendientes = snapshotSol.size;
            actualizarTotal();
        });
    } else {
        // Para clientes: solo contar mensajes no leídos
        const qConv = query(
            collection(db, "conversaciones"),
            where("participantes", "array-contains", miUid)
        );

        onSnapshot(qConv, (snapshotConv) => {
            const conversacionesIds = [];
            snapshotConv.forEach(d => conversacionesIds.push(d.id));

            if (conversacionesIds.length === 0) {
                totalMensajesNoLeidos = 0;
                actualizarTotal();
                return;
            }

            const chunks = [];
            for (let i = 0; i < conversacionesIds.length; i += 10) {
                chunks.push(conversacionesIds.slice(i, i + 10));
            }

            const resultadosChunks = {};

            chunks.forEach((chunkIds, idx) => {
                const qMsg = query(
                    collection(db, "mensajes"),
                    where("conversacionId", "in", chunkIds)
                );

                onSnapshot(qMsg, (snapshotMsg) => {
                    let countChunk = 0;
                    snapshotMsg.forEach(d => {
                        const m = d.data();
                        if (!m.leido && m.de !== miUid) countChunk++;
                    });

                    resultadosChunks[idx] = countChunk;

                    let total = 0;
                    Object.values(resultadosChunks).forEach(c => total += c);
                    totalMensajesNoLeidos = total;
                    actualizarTotal();
                });
            });
        });
    }
}   

function actualizarBadge(count) {
    document.querySelectorAll('.link-soporte, .link-soporte-mobile').forEach(el => {
        const badge = el.querySelector('.badge-no-leidos');
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    });
}

// =====================================================
// 3. LOGOUT CENTRALIZADO (previene el botón atrás)
// =====================================================
document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href="login.html"], #btnCerrarSesion, #btnCerrarSesionMobile');
    if (link) {
        e.preventDefault();
        try {
            await window.signOut(auth);
            localStorage.removeItem('eventlyRol'); localStorage.removeItem('vistaComo'); localStorage.removeItem('vistaOrganizacionId'); localStorage.removeItem('organizacionElegida'); localStorage.removeItem('organizacionElegidaNombre');
            // ✅ replace: elimina la página actual del historial
            window.location.replace('login.html');
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
    }
});