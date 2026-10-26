# Design

## Datos que se guardan

Una solicitud (`solicitudes_eventos`) suma un campo. Los que ya existían no cambian. Al aprobar, `admin/aprobaciones.js` copia la solicitud a `eventos` (que es público), pero **sin `comentarios`**: los comentarios son entre el superadmin y la organización. Por la misma razón, el teléfono de la organización no se guarda en la solicitud: se lee del perfil y se usa solo para armar el enlace.

```
comentarios: [{ texto: "Falta la hora de fin", autor: "superadmin", fecha: "2026-10-26T14:30:00.000Z" }, ...]
```

`fecha` es texto ISO (un `serverTimestamp` no se puede guardar dentro de una lista con `arrayUnion`). Una solicitud sin `comentarios` (todas las viejas) se ve igual que hoy.

## `shared/solicitudes-evento.js`

Módulo de navegador sin dependencias (`export function ...`), como `shared/evento-datos.js`; la prueba le quita los `export` para cargarlo en `node`.

- `armarComentario(texto, ahora)`: devuelve `{ texto, autor: 'superadmin', fecha }` con el texto sin espacios de más y cortado a 500 letras, o `null` si queda vacío. `ahora` es un `Date` (se pasa para poder probarlo).
- `comentariosDeSolicitud(solicitud)`: lista limpia (descarta lo que no tiene texto), del más nuevo al más viejo.
- `ultimoComentario(solicitud)`: el más nuevo o `null`.
- `enlacesDeContacto({ correo, telefono, nombreEvento })`: `{ correo, whatsapp }`; cada uno es un enlace o `''` si falta el dato. El correo lleva asunto y texto inicial con el nombre del evento. El teléfono se limpia a dígitos y se descarta si tiene menos de 8; `wa.me` recibe solo dígitos.

Todos los textos se devuelven como texto: quien los muestre usa `textContent` o los escapa.

## "Crear evento" del superadmin (`admin/eventos.html?modo=directo`)

- Dos pestañas arriba: **Crear evento** (el formulario de hoy) y **Solicitudes** (`#solicitudes`). Solo se ven en el modo directo del superadmin; la organización sigue viendo solo "Solicitar evento".
- La pestaña Solicitudes lleva la sección que hoy está en `superadmin.html`: filtros por estado (Pendientes, Aceptados, Rechazados), buscador, filtro por organización y período, tarjetas agrupadas por organización, y los modales de confirmación (publicar y rechazar) y de edición.
- `admin/aprobaciones.js` sigue siendo el que maneja esa sección; se carga también desde `eventos.html`. Deja de leer `searchInput`, `filtroOrganizacion` y `filtroPeriodo` por id fijo del Panel global: la sección trae sus propios campos (`buscarSolicitud`, `filtroOrganizacionSolicitud`, `filtroPeriodoSolicitud`), que se llenan con las organizaciones que ya carga el script.
- Cada tarjeta suma: **Comentar** (abre un cuadro con el historial y un campo para escribir; guarda con `updateDoc` y `arrayUnion`) y **Contactar** (los dos enlaces de `enlacesDeContacto`). El teléfono sale del perfil de la organización si existe; el correo, de la solicitud.
- Un comentario no cambia el estado de la solicitud (sigue pendiente), y se puede comentar en pendientes, aceptadas y rechazadas.
- Hoy el contador de solicitudes solo está en la sección; se suma el número de pendientes en la pestaña.

## Página de eventos del superadmin (`admin/eventos-seleccion.html`)

- Para el superadmin deja de mostrar la grilla de organizaciones: muestra de entrada todos los eventos, con la misma tarjeta de siempre más el nombre de la organización, y un selector "Todas las organizaciones" junto a la búsqueda y el filtro de estado.
- Los eventos que no se pueden asociar a una organización se muestran igual, con "Organización no identificada".
- Para la organización, la tarjeta de una solicitud pendiente o rechazada suma el último comentario del superadmin (con `escaparHtml`) debajo del estado.
- Se saca el código de la vista de organizaciones (`renderizarOrganizaciones`, `seleccionarOrganizacion`, `volverAOrganizaciones`, el botón "Volver a organizaciones") porque ya no se usa.

## Quitar el Panel global

- `shared/menu-admin.js`: se saca la sección `superadmin` (y su fila del menú de celular).
- `admin/superadmin.html`: queda con una redirección (`location.replace('eventos.html?modo=directo#solicitudes')`) y un enlace de respaldo. Se saca el resto del código de la página (lista de eventos con lo recaudado, modales).
- `admin/consultas-publicas.html` tiene un `prefetch` a `superadmin.html`: se cambia por `eventos.html?modo=directo`.
- `pruebas/13-panel-de-ventas.js`: se saca la sección 5 (Panel global, G1 a G3) y `superadmin` de la lista de G4. La prueba de que las pantallas usan `ventas-utils.js` sigue para las otras tres.

## Roles y permisos

No cambia quién puede qué: las páginas siguen verificando `rol === 'superadmin'` al cargar, y `eventos.html?modo=directo` ya manda a la organización de vuelta a `eventos.html`. Lo que sí hay que decir: los campos nuevos se escriben desde el navegador, y hasta que se publiquen las reglas de Firestore (tarea 10.3 de pagos) la base no impide que otra cuenta escriba en `comentarios`. Queda en `proposal.md` como fuera de alcance.

## Riesgos

- `aprobaciones.js` y `eventos.html` tienen hoy cosas parecidas (carga de usuario y de imagen); hay que cuidar que el script no corra dos veces ni mire elementos que no existen en la otra página.
- No hay navegador en la nube: las pestañas, los modales y los enlaces se verifican a mano o con la skill `auditar-panel`; las funciones de `shared/` se prueban con `node`.
