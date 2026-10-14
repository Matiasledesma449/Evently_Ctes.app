// shared/menu-rol.js
// Sin import - usa las variables globales de firebase-init.js

// =====================================================
// 1. SIDEBAR COLAPSABLE (estilo apps de IA)
// =====================================================
(function configurarSidebarColapsable() {
    if (!document.getElementById('sidebar-colapsable-style')) {
        const style = document.createElement('style');
        style.id = 'sidebar-colapsable-style';
        style.textContent = `
            aside.sidebar-principal {
                transition: width 0.25s ease;
                overflow: visible;
                position: relative;
            }

            body.sidebar-colapsado aside.sidebar-principal {
                width: 76px !important;
            }

            body.sidebar-colapsado aside.sidebar-principal > div:first-child {
                display: none !important;
            }

            body.sidebar-colapsado aside.sidebar-principal nav a {
                justify-content: center !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                font-size: 0 !important;
                position: relative;
                gap: 0 !important;
            }

            body.sidebar-colapsado aside.sidebar-principal nav a .material-symbols-outlined {
                font-size: 24px !important;
                margin: 0 !important;
            }

            body.sidebar-colapsado aside.sidebar-principal nav a .badge-no-leidos {
                font-size: 10px !important;
                position: absolute !important;
                top: 6px;
                right: 8px;
                margin: 0 !important;
            }

            body.sidebar-colapsado aside.sidebar-principal .link-logout {
                justify-content: center !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                font-size: 0 !important;
                gap: 0 !important;
            }
            body.sidebar-colapsado aside.sidebar-principal .link-logout .material-symbols-outlined {
                font-size: 24px !important;
                margin: 0 !important;
            }

            #btnToggleSidebar {
                position: absolute;
                top: 12px;
                right: -14px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: white;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 6px rgba(0,0,0,0.08);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 60;
                transition: all 0.2s;
            }
            #btnToggleSidebar:hover {
                background: #f5f3ff;
                border-color: #7c3aed;
            }
            #btnToggleSidebar .material-symbols-outlined {
                font-size: 16px !important;
                color: #7c3aed;
            }

            @media (max-width: 1023px) {
                #btnToggleSidebar { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    function initSidebar() {
        const aside = document.querySelector('aside');
        if (!aside) return;
        if (aside.querySelector('#btnToggleSidebar')) return; // ya inicializado

        aside.classList.add('sidebar-principal');

        const linkLogout = aside.querySelector('#btnCerrarSesion');
        if (linkLogout) linkLogout.classList.add('link-logout');

        const btn = document.createElement('button');
        btn.id = 'btnToggleSidebar';
        btn.title = 'Colapsar / expandir menú';
        btn.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
        aside.appendChild(btn);

        const colapsado = localStorage.getItem('sidebarColapsado') === 'true';
        if (colapsado) {
            document.body.classList.add('sidebar-colapsado');
            btn.querySelector('span').textContent = 'chevron_right';
        }

        btn.addEventListener('click', () => {
            const estaColapsado = document.body.classList.toggle('sidebar-colapsado');
            localStorage.setItem('sidebarColapsado', estaColapsado);
            btn.querySelector('span').textContent = estaColapsado ? 'chevron_right' : 'chevron_left';
        });
    }

    // ✅ Ejecutar cuando el DOM esté listo (o inmediatamente si ya lo está)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();

// =====================================================
// 2. LÓGICA DE ROLES Y BADGE DE MENSAJES
// =====================================================
function aplicarRolVisual(rol) {
    const esAdmin = rol === 'superadmin';
    const esOrganizacion = rol === 'organizacion';
    document.querySelectorAll('[data-role="superadmin"]').forEach(enlace => enlace.classList.toggle('hidden', !esAdmin));
    document.querySelectorAll('[data-role="organizacion"]').forEach(enlace => enlace.classList.toggle('hidden', !esOrganizacion));
    document.querySelectorAll('[data-nav-key="superadmin"] > span:last-child').forEach(label => {
        label.textContent = 'Panel Global';
    });

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
        const activo = paginaActual === destino;
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
            localStorage.removeItem('eventlyRol');
            aplicarRolVisual(null);
            mostrarNavegacion();
            return;
        }
        try {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (!userDoc.exists()) {
                localStorage.removeItem('eventlyRol');
                aplicarRolVisual(null);
                mostrarNavegacion();
                return;
            }

            const rol = userDoc.data().rol;
            const esAdmin = rol === 'superadmin';
            localStorage.setItem('eventlyRol', rol);
            aplicarRolVisual(rol);
            actualizarBadgeConsultasPublicas(esAdmin);

            // Iniciar contadores de notificaciones
            escucharNoLeidos(user.uid, esAdmin);
            mostrarNavegacion();
        } catch (e) {
            console.error('Error al verificar rol:', e);
            localStorage.removeItem('eventlyRol');
            aplicarRolVisual(null);
            mostrarNavegacion();
        }
    });
}

function actualizarBadgeConsultasPublicas(esAdmin) {
    if (!esAdmin) return;
    const badges = [...document.querySelectorAll('.badge-consultas-publicas')];
    if (badges.length === 0) return;
    const consultasNuevasQuery = query(
        collection(db, 'consultas_publicas'),
        where('estado', '==', 'nueva')
    );

    onSnapshot(consultasNuevasQuery, snapshot => {
        const cantidad = snapshot.size;
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
        const total = totalMensajesNoLeidos + totalSolicitudesPendientes;
        actualizarBadge(total);
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
            localStorage.removeItem('eventlyRol');
            // ✅ replace: elimina la página actual del historial
            window.location.replace('login.html');
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
    }
});