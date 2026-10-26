# Registro del trabajo automático

Una entrada por tanda, de la más nueva a la más vieja. Cada commit empieza con el número de tarea: se encuentra con
`git log --oneline --grep "tareas 1.1"` y se deshace con `git revert <hash>`.

## 2026-10-26 · tareas 2.1 a 8.2 · rama auto/organizaciones-y-correcciones-del-panel
- Archivos: `shared/menu-admin.js` (selector de organización en la vista, "Organizaciones" en el menú), `shared/menu-rol.js` y
  `admin/login.html` (borran también `vistaOrganizacionId`), `admin/eventos-seleccion.html` (rol que se mira, colección
  `organizaciones`, sin panel de categorías), `shared/selector-evento.js` y `admin/reportes.html` (`eventosParaVer`),
  `admin/organizaciones.html` (nuevo), `admin/eventos.html` y `admin/crear-evento-superadmin.js` (nuevo: organización
  obligatoria, categoría del evento y panel de categorías), `admin/aprobaciones.js` (agrupa por `organizacionId`, no publica
  sin organización), `admin/ventas.html`, `admin/reportes.html` y `admin/dashboard.html` (formas de pago fijas),
  `shared/ventas-utils.js` (`cifrasDelEvento` acepta cómo agrupar la forma de pago), `herramientas/limpiar-datos.js` y
  `herramientas/LEEME.md` (nuevos), pruebas 13, 18 y 26 adaptadas al diseño nuevo, pruebas 30 y 31 nuevas, `CLAUDE.md`.
- Comprobación: `node pruebas/ejecutar-todas.js` (31 archivos, todo pasa); auditoría del panel con Firebase falso
  (55 combinaciones, sin problemas nuevos: el único aviso, el alto de tarjetas al cargar, no se repite al correrlo solo);
  prueba en el navegador de organizaciones (Eventos del superadmin y su filtro, vista con organización elegida y sin
  elegir, Crear evento con organización obligatoria, Organizaciones: crear, repetido, vincular, correo inexistente, una
  organización no entra, filtro de formas de pago en Ventas y Reportes).
- Decisiones: la base falsa de la limpieza va dentro de la prueba 31 (la de `_ayuda-db-falsa.js` es de los pagos). En
  Crear evento, sin organización el navegador no deja enviar (campo obligatorio) y el código también lo rechaza.
- 2.3: `escaner`, `soporte`, `mensajes`, `consultas-publicas` y `eventos` (redirección al modo directo) siguen con el rol real
  porque ahí el rol solo protege (lleva a otra página a quien no corresponde); lo que se muestra lo decide el menú.
- Aviso sin tocar (ya existía): `admin/aprobaciones.js` arma el título de los cuadros de confirmación con `innerHTML` y el
  nombre de la solicitud sin escapar. Va en un cambio aparte.
- No se hizo: 8.3 y 8.4 (las hace la persona). La herramienta de limpieza NO se ejecutó.
- Push: a la rama de automático; `main` no se toca.

## 2026-10-26 · tareas 1.1 a 1.5 · rama auto/organizaciones-y-correcciones-del-panel
- Archivos: `shared/organizaciones.js` (nuevo), `pruebas/28-organizaciones.js` (nuevo), `shared/ventas-utils.js`
  (`eventosDeLaPersona` solo por `organizacionId`; `filtrarVentas` acepta cómo convertir la forma de pago),
  `pruebas/15-cifras-del-evento.js` (casos E2, E5 y Z reescritos al criterio nuevo), `shared/formas-de-pago.js`
  (`claveDeFormaDePago`, `opcionesDeFiltroDePago`), `pruebas/29-filtro-de-formas-de-pago.js` (nuevo).
- Comprobación: `node pruebas/28-organizaciones.js`, `node pruebas/29-filtro-de-formas-de-pago.js` y
  `node pruebas/ejecutar-todas.js` (29 archivos, todo pasa).
- Decisión: `eventosDeLaPersona` repite la regla en vez de importar `organizaciones.js`, porque las pruebas cargan
  `ventas-utils.js` sin módulos. Una venta sin forma de pago (pendiente) no tiene clave y no cae en "Otros".
- Push: se sube junto con la sección (rama de automático, sin tocar `main`).
