# Registro del trabajo automático

Una entrada por tanda, de la más nueva a la más vieja. Cada commit empieza con el número de tarea: se encuentra con
`git log --oneline --grep "tareas 1.1"` y se deshace con `git revert <hash>`.

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
