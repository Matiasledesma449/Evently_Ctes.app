# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Lo que necesita navegador se comprueba a mano o con la skill `auditar-panel`.

## 1. Funciones compartidas

- [x] 1.1 Crear `shared/solicitudes-evento.js` con `armarComentario`, `comentariosDeSolicitud`, `ultimoComentario` y `enlacesDeContacto` (ver `design.md`). Se comprueba con `node pruebas/20-solicitudes-evento.js`.
- [x] 1.2 Crear `pruebas/20-solicitudes-evento.js` con los casos de las especificaciones (comentario vacío, con etiquetas, texto largo, orden, solicitud sin comentarios, teléfono con símbolos, sin teléfono, sin correo). Se comprueba con `node pruebas/ejecutar-todas.js`.

## 2. Quitar el Panel global

- [x] 2.1 En `shared/menu-admin.js`, sacar la sección `superadmin` del menú. Se comprueba leyendo el archivo y con la prueba de menús si existe.
- [x] 2.2 Dejar `admin/superadmin.html` como redirección a `eventos.html?modo=directo#solicitudes` y cambiar el `prefetch` de `admin/consultas-publicas.html`. Se comprueba leyendo los archivos.
- [x] 2.3 En `pruebas/13-panel-de-ventas.js`, sacar la sección del Panel global. Se comprueba con `node pruebas/ejecutar-todas.js`.

## 3. Solicitudes en "Crear evento"

- [x] 3.1 En `admin/eventos.html`: pestañas "Crear evento" y "Solicitudes" (solo en `?modo=directo`), con la sección de solicitudes, sus filtros propios y los modales. Se comprueba leyendo el archivo: el formulario sigue igual y la organización no ve las pestañas.
- [x] 3.2 En `admin/aprobaciones.js`: usar los campos propios de la sección, cargarse desde `eventos.html` sin romper nada, y mostrar el número de pendientes en la pestaña. Se comprueba leyendo el archivo.
- [x] 3.3 En `admin/aprobaciones.js`: botón "Comentar" con historial, guardado con `arrayUnion`, y botones de contacto con `enlacesDeContacto`; todo con `textContent`. Se comprueba leyendo el archivo.

## 4. Eventos del superadmin y comentarios de la organización

- [ ] 4.1 En `admin/eventos-seleccion.html`: para el superadmin, lista directa de eventos con el nombre de la organización y selector de organización; sacar la grilla de organizaciones. Se comprueba leyendo el archivo.
- [ ] 4.2 En `admin/eventos-seleccion.html`: para la organización, mostrar el último comentario del superadmin en la tarjeta de la solicitud, escapado. Se comprueba leyendo el archivo.

## 5. Revisión final

- [ ] 5.1 Probar a mano en el navegador los seis pasos de "Cómo se verifica a mano" de `proposal.md`. (Necesita navegador y una cuenta de superadmin y una de organización: queda para la persona.)
- [ ] 5.2 Correr `node pruebas/ejecutar-todas.js` y la auditoría completa de `auditar-panel`: sin problemas.
- [ ] 5.3 Actualizar `CLAUDE.md` con `shared/solicitudes-evento.js`, la prueba 20 y que ya no existe el Panel global, sin claves, correos ni rutas personales.

## Workflow follow-up

- Archivar el change cuando la persona lo apruebe.
- Para publicar: las reglas de Firestore (tarea 10.3 de pagos) deberían limitar `comentarios` al superadmin.
