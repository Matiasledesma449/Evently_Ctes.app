// shared/menu-admin.js
// Menú del panel (escritorio y celular), definido una sola vez.
// Es un script clásico (no módulo) y va en la página justo donde antes estaba el <aside>:
// el navegador lo ejecuta en ese momento y el menú nace ya en su estado final (sin parpadeo).
// Cada página lo llama así:  <script src="../shared/menu-admin.js" data-pagina="ventas"></script>
// Los roles, los avisos de no leídos y el cierre de sesión los sigue manejando menu-rol.js
// con las mismas clases y atributos de siempre (data-nav-key, data-role, link-soporte, badge-*).
(function () {
    const script = document.currentScript;
    if (!script) return;
    const pagina = script.dataset.pagina || '';

    // Estado de visitas anteriores. Si el almacenamiento no está disponible, se sigue sin él.
    let rol = null;
    let colapsado = false;
    let eventoId = null;
    let vistaComo = null;
    try {
        rol = localStorage.getItem('eventlyRol');
        colapsado = localStorage.getItem('sidebarColapsado') === 'true';
        eventoId = localStorage.getItem('eventoId');
        vistaComo = localStorage.getItem('vistaComo');
    } catch (e) { /* sin almacenamiento */ }

    // "Ver como organización": un superadmin mira el panel como una organización. Cambia SOLO lo que se ve:
    // el rol guardado, los permisos y los datos siguen siendo los reales. Solo vale para un superadmin.
    const vistaActiva = rol === 'superadmin' && vistaComo === 'organizacion';
    const rolMenu = vistaActiva ? 'organizacion' : rol;
    const esAdmin = rolMenu === 'superadmin';
    const SOLO_SUPERADMIN = ['consultas-publicas', 'mensajes', 'organizaciones'];
    const TEXTO_VISTA = 'Estás viendo el panel como organización';

    // El mismo cálculo lo usa menu-rol.js, para que el menú y los roles coincidan
    window.rolEfectivo = function (rolReal) {
        let vista = null;
        try { vista = localStorage.getItem('vistaComo'); } catch (e) { /* sin almacenamiento */ }
        return rolReal === 'superadmin' && vista === 'organizacion' ? 'organizacion' : rolReal;
    };

    // La organización que el superadmin eligió mirar en la vista de organización ('' si no eligió o si la vista no está activa).
    // Las pantallas la usan junto con rolEfectivo para decidir qué eventos mostrar (shared/organizaciones.js, eventosParaVer).
    window.vistaOrganizacion = function () {
        if (!vistaActiva) return '';
        let elegida = '';
        try { elegida = localStorage.getItem('vistaOrganizacionId') || ''; } catch (e) { /* sin almacenamiento */ }
        return elegida;
    };

    // Una página solo de superadmin abierta en la vista de organización lleva a la lista de Eventos
    if (vistaActiva && SOLO_SUPERADMIN.includes(pagina)) {
        location.replace('eventos-seleccion.html');
        return;
    }

    // Seguridad: todo lo que se inserta como HTML es texto fijo de este archivo. Lo único que viene de
    // afuera es el id del evento (de localStorage), y va con encodeURIComponent dentro de comillas dobles.
    // `rol` y `pagina` solo se comparan, nunca se escriben en el HTML.

    // Secciones del menú, en orden. `rol` indica a quién se muestra; sin `rol` es para todos.
    const SECCIONES = [
        { clave: 'eventos-seleccion', href: 'eventos-seleccion.html', icono: 'apps', texto: 'Eventos', corto: 'Eventos' },
        {
            clave: 'dashboard', id: 'linkPanelPrincipal', idMovil: 'linkPanelPrincipalMobile',
            href: eventoId ? `dashboard.html?id=${encodeURIComponent(eventoId)}` : 'dashboard.html',
            icono: 'dashboard', texto: 'Resumen', corto: 'Resumen'
        },
        { clave: 'eventos', rol: 'organizacion', soloOrg: true, href: 'eventos.html', icono: 'add_circle', texto: 'Solicitar evento', corto: 'Solicitar', anchoMovil: 82 },
        { clave: 'eventos', rol: 'superadmin', href: 'eventos.html?modo=directo', icono: 'add_circle', texto: 'Crear evento', corto: 'Crear evento', anchoMovil: 82 },
        { clave: 'organizaciones', rol: 'superadmin', href: 'organizaciones.html', icono: 'corporate_fare', texto: 'Organizaciones', corto: 'Organiz.' },
        { clave: 'reportes', href: 'reportes.html', icono: 'bar_chart', texto: 'Reportes', corto: 'Reportes' },
        { clave: 'ventas', href: 'ventas.html', icono: 'payments', texto: 'Ventas', corto: 'Ventas' },
        { clave: 'escaner', href: 'escaner.html', icono: 'qr_code_scanner', texto: 'Escáner', corto: 'Escáner' },
        {
            // Soporte (organización) o Mensajes (superadmin): menu-rol.js lo ajusta con el rol confirmado
            clave: 'soporte-mensajes', soporte: true, soloOrg: true,
            href: esAdmin ? 'mensajes.html' : 'soporte.html',
            icono: esAdmin ? 'chat' : 'support_agent',
            texto: esAdmin ? 'Mensajes' : 'Soporte', corto: esAdmin ? 'Mensajes' : 'Soporte'
        },
        { clave: 'consultas-publicas', rol: 'superadmin', clase: 'link-consultas', badge: 'badge-consultas-publicas', href: 'consultas-publicas.html', icono: 'contact_support', texto: 'Consultas públicas', corto: 'Consultas' },
        { clave: 'ver-como-organizacion', rol: 'superadmin', id: 'btnVerComoOrganizacion', idMovil: 'btnVerComoOrganizacionMobile', href: '#', icono: 'visibility', texto: 'Ver como organización', corto: 'Ver como' }
    ];

    // La página actual: "soporte" y "mensajes" son la misma sección del menú
    function esPaginaActual(seccion) {
        if (seccion.soporte) return pagina === 'soporte' || pagina === 'mensajes';
        return seccion.clave === pagina;
    }

    // Una sección propia de un rol se muestra solo si ya se sabe que el rol coincide
    function visible(seccion) {
        return !seccion.rol || seccion.rol === rolMenu;
    }

    const BADGE_ESCRITORIO = (clase) => `<span class="${clase} hidden ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center">0</span>`;
    const BADGE_MOVIL = (clase) => `<span class="${clase} hidden absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center">0</span>`;

    function enlaceEscritorio(s) {
        const activo = esPaginaActual(s);
        const clases = ['admin-nav-link', s.clase, s.soporte ? 'link-soporte' : '', (s.soporte || s.badge) ? 'relative' : '',
            s.rol && !visible(s) ? 'hidden' : '', 'flex items-center gap-3 px-4 py-3 rounded-lg transition',
            activo ? 'active-link font-medium' : 'text-gray-600 hover:bg-gray-100'].filter(Boolean).join(' ');
        const icono = s.soporte ? `material-symbols-outlined icono-soporte` : 'material-symbols-outlined';
        const texto = s.soporte ? `<span class="texto-soporte">${s.texto}</span>` : `<span>${s.texto}</span>`;
        const badge = s.soporte ? BADGE_ESCRITORIO('badge-no-leidos') : s.badge ? BADGE_ESCRITORIO(s.badge) : '';
        const rolAttr = s.rol ? ` data-role="${s.rol}"` : '';
        const idAttr = s.id ? ` id="${s.id}"` : '';
        const actual = activo ? ' aria-current="page"' : '';
        const limitado = vistaActiva && s.soloOrg ? ` data-solo-organizacion="${s.texto}"` : '';
        return `<a${idAttr}${rolAttr}${limitado} data-nav-key="${s.clave}" href="${s.href}"${actual} class="${clases}"><span class="${icono}">${s.icono}</span>${texto}${badge}</a>`;
    }

    function enlaceMovil(s) {
        const activo = esPaginaActual(s);
        const ancho = s.anchoMovil || 76;
        const clases = ['mobile-nav-link', s.soporte ? 'link-soporte-mobile' : '', s.clase,
            s.rol && !visible(s) ? 'hidden' : '', 'flex flex-shrink-0 flex-col items-center justify-center relative h-full',
            activo ? 'text-violet-600' : 'text-gray-500'].filter(Boolean).join(' ');
        const icono = s.soporte ? 'material-symbols-outlined icono-soporte-mobile' : 'material-symbols-outlined';
        const texto = s.soporte ? `<span class="text-[10px] texto-soporte-mobile">${s.corto}</span>` : `<span class="text-[10px]">${s.corto}</span>`;
        const badge = s.soporte ? BADGE_MOVIL('badge-no-leidos') : s.badge ? BADGE_MOVIL(s.badge) : '';
        const rolAttr = s.rol ? ` data-role="${s.rol}"` : '';
        const idAttr = s.idMovil ? ` id="${s.idMovil}"` : '';
        const actual = activo ? ' aria-current="page"' : '';
        const limitado = vistaActiva && s.soloOrg ? ` data-solo-organizacion="${s.texto}"` : '';
        return `<a${idAttr}${rolAttr}${limitado} data-nav-key="${s.clave}" href="${s.href}"${actual} style="width:${ancho}px" class="${clases}"><span class="${icono}">${s.icono}</span>${texto}${badge}</a>`;
    }

    // Si ya se conoce el rol de una visita anterior, el menú nace visible y completo;
    // si no, queda invisible hasta que menu-rol.js confirme el rol (como siempre).
    const claseInvisible = rolMenu ? '' : ' invisible';

    const aside = `
        <aside class="sidebar-principal hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex-shrink-0">
            <div class="p-6">
                <span class="text-2xl font-bold text-violet-600">Evently</span>
                <span class="block text-xs text-gray-500">Administración</span>
            </div>
            <nav class="admin-role-nav${claseInvisible} flex-1 overflow-y-auto px-4 py-3 space-y-1" aria-label="Navegación principal">
                ${SECCIONES.map(enlaceEscritorio).join('\n                ')}
            </nav>
            <div class="p-4 border-t border-gray-200">
                <a href="#" id="btnCerrarSesion" class="link-logout flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition"><span class="material-symbols-outlined">logout</span><span>Cerrar sesión</span></a>
            </div>
            <button id="btnToggleSidebar" type="button" title="Colapsar / expandir menú" aria-label="Colapsar o expandir el menú"><span class="material-symbols-outlined">${colapsado ? 'chevron_right' : 'chevron_left'}</span></button>
        </aside>`;

    const barraMovil = `
    <nav class="admin-bottom-nav admin-role-nav${claseInvisible} lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex items-center gap-1 h-16 z-50 overflow-x-auto px-2" aria-label="Navegación móvil">
        ${SECCIONES.map(enlaceMovil).join('\n        ')}
        <a href="#" id="btnCerrarSesionMobile" style="width:76px" class="mobile-nav-link flex flex-shrink-0 flex-col items-center justify-center relative h-full text-gray-500"><span class="material-symbols-outlined">logout</span><span class="text-[10px]">Salir</span></a>
    </nav>`;

    // El estado achicado se pone ANTES de dibujar el menú: nace achicado y no hay nada que animar
    if (colapsado) document.body.classList.add('sidebar-colapsado');

    script.insertAdjacentHTML('beforebegin', aside);
    document.body.insertAdjacentHTML('beforeend', barraMovil);

    // Botón de achicar y expandir; recuerda la elección
    const boton = document.getElementById('btnToggleSidebar');
    if (boton) {
        boton.addEventListener('click', () => {
            const achicado = document.body.classList.toggle('sidebar-colapsado');
            try { localStorage.setItem('sidebarColapsado', achicado); } catch (e) { /* sin almacenamiento */ }
            boton.querySelector('span').textContent = achicado ? 'chevron_right' : 'chevron_left';
        });
    }

    // ---- Vista "Ver como organización": aviso fijo arriba, con el botón para volver ----
    if (vistaActiva) {
        document.body.classList.add('vista-organizacion');
        document.body.insertAdjacentHTML('afterbegin', `
    <div id="avisoVistaOrganizacion" role="status" class="fixed top-0 inset-x-0 z-[70] h-10 bg-violet-600 text-white text-sm flex items-center justify-center gap-3 px-3">
        <span id="textoVistaOrganizacion" class="truncate">${TEXTO_VISTA}</span>
        <select id="selectorOrganizacionVista" aria-label="Organización que se mira" class="flex-shrink-0 max-w-[10rem] sm:max-w-[16rem] rounded-full bg-white text-violet-700 text-xs font-semibold px-2 py-0.5 outline-none"><option value="">Elegí una organización…</option></select>
        <button id="btnVolverSuperadmin" type="button" class="flex-shrink-0 bg-white text-violet-700 rounded-full px-3 py-0.5 text-xs font-semibold hover:bg-violet-50">Volver a superadmin</button>
    </div>`);
    }

    // Texto fijo del aviso: si todavía no se eligió organización, lo dice
    function textoFijo() {
        return window.vistaOrganizacion() ? TEXTO_VISTA : `${TEXTO_VISTA}. Elegí una organización`;
    }
    if (vistaActiva) {
        const caja = document.getElementById('textoVistaOrganizacion');
        if (caja) caja.textContent = textoFijo();
    }

    // Desplegable de organizaciones de la barra violeta. Se llena cuando hay sesión, con textContent
    // (el nombre de cada organización lo escribe una persona: nunca se interpreta como HTML).
    function llenarOrganizaciones() {
        const selector = document.getElementById('selectorOrganizacionVista');
        if (!selector || !window.db || !window.auth || !window.onAuthStateChanged) return;
        window.onAuthStateChanged(window.auth, async (user) => {
            if (!user) return;
            try {
                const instantanea = await window.getDocs(window.collection(window.db, 'organizaciones'));
                const lista = [];
                instantanea.forEach((d) => {
                    const datos = d.data();
                    lista.push({ id: d.id, nombre: datos && typeof datos.nombre === 'string' ? datos.nombre : '' });
                });
                lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
                const elegida = window.vistaOrganizacion();
                selector.replaceChildren();
                const primera = document.createElement('option');
                primera.value = '';
                primera.textContent = lista.length ? 'Elegí una organización…' : 'Todavía no hay organizaciones';
                selector.appendChild(primera);
                lista.forEach((o) => {
                    const op = document.createElement('option');
                    op.value = o.id;
                    op.textContent = o.nombre || 'Sin nombre';
                    selector.appendChild(op);
                });
                selector.value = lista.some((o) => o.id === elegida) ? elegida : '';
            } catch (e) {
                console.error('No se pudieron cargar las organizaciones:', e);
                mostrarAviso('No se pudieron cargar las organizaciones.');
            }
        });
    }
    if (vistaActiva) {
        if (window.db) llenarOrganizaciones();
        else window.addEventListener('firebase-ready', llenarOrganizaciones, { once: true });
        const selector = document.getElementById('selectorOrganizacionVista');
        if (selector) {
            selector.addEventListener('change', () => {
                try {
                    if (selector.value) localStorage.setItem('vistaOrganizacionId', selector.value);
                    else localStorage.removeItem('vistaOrganizacionId');
                } catch (e) { /* sin almacenamiento */ }
                location.reload();
            });
        }
    }

    // Texto temporal en el aviso (por ejemplo, cuando se toca algo que solo usa una organización)
    let temporizadorAviso = null;
    function mostrarAviso(texto) {
        const caja = document.getElementById('textoVistaOrganizacion');
        if (!caja) return;
        caja.textContent = texto; // textContent: nunca se interpreta como HTML
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => { caja.textContent = textoFijo(); }, 5000);
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#btnVerComoOrganizacion, #btnVerComoOrganizacionMobile')) {
            e.preventDefault();
            try { localStorage.setItem('vistaComo', 'organizacion'); } catch (x) { /* sin almacenamiento */ }
            if (SOLO_SUPERADMIN.includes(pagina)) location.href = 'eventos-seleccion.html'; else location.reload();
            return;
        }
        if (e.target.closest('#btnVolverSuperadmin')) {
            try { localStorage.removeItem('vistaComo'); } catch (x) { /* sin almacenamiento */ }
            location.reload();
            return;
        }
        const limitado = vistaActiva ? e.target.closest('[data-solo-organizacion]') : null;
        if (limitado) {
            e.preventDefault();
            mostrarAviso(`"${limitado.getAttribute('data-solo-organizacion')}" lo usa una cuenta de organización. En esta vista solo se puede mirar.`);
        }
    });

    // La animación de ancho se activa recién después del primer dibujo
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('menu-listo')));
})();
