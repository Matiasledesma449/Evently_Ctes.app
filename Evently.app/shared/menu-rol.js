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

        // ✅ Selector robusto del link de cerrar sesión
        const linkLogout = aside.querySelector('a[href="login.html"]') 
                        || aside.querySelector('#btnCerrarSesion') 
                        || aside.querySelector('#btnCerrarSesionMobile');
        if (linkLogout) linkLogout.classList.add('link-logout');

        // ✅ Listener de logout si no lo tiene (para superadmin.html)
        const btnLogout = aside.querySelector('#btnCerrarSesion');
        if (btnLogout && !btnLogout.dataset.listenerAttached) {
            btnLogout.dataset.listenerAttached = 'true';
            btnLogout.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await window.signOut(auth);
                    window.location.href = 'login.html';
                } catch (err) {
                    console.error('Error al cerrar sesión:', err);
                }
            });
        }

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
function initRoles() {
    if (typeof auth === 'undefined' || !auth) {
        console.warn('⚠️ auth no está disponible todavía');
        return;
    }

    window.onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (!userDoc.exists()) return;

            const rol = userDoc.data().rol;
            const esAdmin = rol === 'superadmin';

            document.querySelectorAll('aside.sidebar-principal nav a[href="eventos.html"], nav.lg\\:hidden a[href="eventos.html"]').forEach(enlace => {
                if (esAdmin) {
                    enlace.href = 'eventos.html?modo=directo';
                    Array.from(enlace.childNodes).forEach(nodo => {
                        if (nodo.nodeType === Node.TEXT_NODE && nodo.textContent.trim()) {
                            nodo.textContent = ' Crear Evento Directo';
                        }
                    });
                } else {
                    enlace.href = 'eventos.html';
                    Array.from(enlace.childNodes).forEach(nodo => {
                        if (nodo.nodeType === Node.TEXT_NODE && nodo.textContent.trim()) {
                            nodo.textContent = ' Solicitar Evento';
                        }
                    });
                }
            });

            // ✅ Verificación de cambio Soporte <-> Mensajes sigue intacto
            const nuevoHref = esAdmin ? 'mensajes.html' : 'soporte.html';
            const nuevoIcono = esAdmin ? 'chat' : 'support_agent';
            const nuevoTexto = esAdmin ? 'Mensajes' : 'Soporte';

            document.querySelectorAll('.link-soporte, .link-soporte-mobile').forEach(el => {
                el.href = nuevoHref;
                el.classList.remove('hidden');
            });
            document.querySelectorAll('.icono-soporte, .icono-soporte-mobile').forEach(el => {
                el.textContent = nuevoIcono;
            });
            document.querySelectorAll('.texto-soporte, .texto-soporte-mobile').forEach(el => {
                el.textContent = nuevoTexto;
            });

            // =====================================================
            // ✅ NUEVO: INYECTAR BOTÓN DE PANEL GLOBAL (SOLO SUPERADMIN)
            // =====================================================
            if (esAdmin) {
                const navDesktop = document.querySelector('aside.sidebar-principal nav');
                const navMobile = document.querySelector('nav.lg\\:hidden'); // Selector escapado para Tailwind
                const urlActual = window.location.href;
                const enSuperadmin = urlActual.includes('superadmin.html');

                // Inyectar en Desktop
                if (navDesktop && !document.getElementById('link-panel-global')) {
                    const linkDesktop = document.createElement('a');
                    linkDesktop.id = 'link-panel-global';
                    linkDesktop.href = 'superadmin.html';
                    linkDesktop.className = enSuperadmin 
                        ? 'active-link flex items-center gap-3 px-4 py-3 rounded-lg font-medium'
                        : 'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition';
                    
                    linkDesktop.innerHTML = `
                        <span class="material-symbols-outlined">admin_panel_settings</span>
                        <span>Panel Global</span>
                    `;
                    navDesktop.appendChild(linkDesktop);
                }

                // Inyectar en Mobile (Bottom Nav) antes del botón de Salir
                if (navMobile && !document.getElementById('link-panel-global-mobile')) {
                    const linkMobile = document.createElement('a');
                    linkMobile.id = 'link-panel-global-mobile';
                    linkMobile.href = 'superadmin.html';
                    linkMobile.className = enSuperadmin
                        ? 'flex flex-col items-center text-violet-600'
                        : 'flex flex-col items-center text-gray-500';
                    
                    linkMobile.innerHTML = `
                        <span class="material-symbols-outlined">admin_panel_settings</span>
                        <span class="text-[10px]">Admin</span>
                    `;
                    
                    const btnCerrarMobile = document.getElementById('btnCerrarSesionMobile');
                    if (btnCerrarMobile) {
                        navMobile.insertBefore(linkMobile, btnCerrarMobile);
                    } else {
                        navMobile.appendChild(linkMobile);
                    }
                }
            }

            // Iniciar contadores de notificaciones
            escucharNoLeidos(user.uid, esAdmin);
        } catch (e) {
            console.error('Error al verificar rol:', e);
        }
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
        let badge = el.querySelector('.badge-no-leidos');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'badge-no-leidos bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center';

            if (el.classList.contains('link-soporte')) {
                badge.classList.add('ml-auto');
            }
            if (el.classList.contains('link-soporte-mobile')) {
                badge.classList.add('absolute', 'top-1', 'right-2');
                el.style.position = 'relative';
            }
            el.appendChild(badge);
        }
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
            await auth.signOut();
            // ✅ replace: elimina la página actual del historial
            window.location.replace('login.html');
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
    }
});