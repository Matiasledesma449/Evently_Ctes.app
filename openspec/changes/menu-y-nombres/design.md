# Design

## Context

Hoy cada página de `admin/` (10 en total: dashboard, ventas, reportes, eventos, eventos-seleccion, escaner, soporte, mensajes, consultas-publicas y superadmin) trae su propio menú lateral y su menú de celular escritos a mano, casi idénticos. `shared/menu-rol.js` se carga al **final** de cada página y recién ahí: achica el menú (agrega la clase `sidebar-colapsado` al `body`), muestra u oculta secciones según el rol y activa los avisos de no leídos. Los estilos del menú achicado los inyecta ese mismo script. Además `shared/admin-shell.css` activa `@view-transition { navigation: auto; }`, que funde la página vieja con la nueva al navegar.

Resultado: la página nueva se dibuja con el menú ancho (la clase todavía no está puesta), después se achica con una animación de 0,25 s y, con el fundido entre páginas, se ve como "se abre y se cierra". Ver `proposal.md` para el motivo.

El sitio es HTML y JavaScript puros, sin build ni framework (ver `CLAUDE.md`). Este cambio no cambia eso.

## Goals / Non-Goals

**Goals:**
- Un solo lugar donde se define el menú.
- Que el menú nazca en su estado final (achicado o ancho, con las secciones de su rol) en el primer dibujo de cada página.
- Nombres iguales en escritorio, celular y títulos.
- Una vista de superadmin como organización, reversible con un clic.

**Non-Goals:**
- Cambiar permisos, roles guardados o reglas de Firestore.
- Filtrar los datos por la vista de organización: un superadmin que mira "como organización" sigue viendo todo lo que su rol real permite.
- Cambiar el contenido de Dashboard, Ventas y Reportes.

## Decisions

### 1. El menú se arma desde un archivo compartido, de forma síncrona
Se crea un archivo compartido que, al cargarse, escribe el menú lateral y el de celular en el lugar exacto donde está su etiqueta `<script>` dentro de la página (script clásico, sin `type="module"`, para que el navegador lo ejecute en el momento y no después). Cada página lo llama con una línea e indica qué sección es la suya (`data-pagina="ventas"`), así la sección actual sale resaltada sin código extra.

- **Por qué:** un script que se ejecuta en el lugar donde está el menú evita cualquier parpadeo, y deja una sola copia del menú.
- **Alternativas descartadas:** (a) dejar las 10 copias y agregar un script pequeño en cada una para evitar el parpadeo: más rápido, pero los nombres seguirían divergiendo; (b) bajar el menú con `fetch` desde un `.html` aparte: llega tarde y reintroduce el parpadeo; (c) componentes web o un framework: es sumar tecnología, que se decide aparte.

### 2. El estado del menú se decide antes de dibujarlo
El mismo archivo lee `localStorage` (menú achicado o no, rol conocido y vista elegida) **antes** de escribir el menú, y lo escribe ya con el estado correcto. Los estilos del menú achicado pasan de estar inyectados por JavaScript a `shared/admin-shell.css`, que ya se carga en el `<head>`. La animación de ancho solo se activa después del primer dibujo, para que no corra al cargar la página.

- **Por qué:** si el menú nace ya achicado, no hay nada que animar al navegar.

### 3. Fundido entre páginas: el menú queda fijo
Se mantiene el fundido entre páginas que ya existe, pero se le da al menú lateral un nombre de transición propio (`view-transition-name`), así Chrome lo trata aparte y no lo funde. Si aun así se nota parpadeo en la prueba a mano, se quita la regla `@view-transition`: perder el fundido es preferible a ver el menú parpadear.

### 4. Rol conocido desde el primer dibujo
Se sigue guardando el rol en `localStorage` (clave `eventlyRol`, ya existente). El menú se arma con ese rol; cuando Firestore confirma el rol real, el menú solo se rearma si el rol cambió. Si no hay rol guardado (primera visita), el menú muestra las secciones comunes y las propias del rol aparecen al confirmarse. El rol guardado nunca da permisos: lo decide Firestore con las reglas.

### 5. Nombres
| Hoy | Nuevo (escritorio y título) | Celular |
|---|---|---|
| Mis Eventos / Eventos | **Eventos** | Eventos |
| Panel Principal / Dashboard / Panel | **Resumen** | Resumen |
| Ventas | **Ventas** | Ventas |
| Reportes / Reportes - Consultas | **Reportes** | Reportes |
| Escáner | **Escáner** | Escáner |
| Soporte (organización) / Mensajes (superadmin) | **Soporte** / **Mensajes** | igual |
| Consultas públicas | **Consultas públicas** | Consultas |
| Panel Global / Super Admin | **Panel global** | Global |
| Solicitar Evento (organización) | **Solicitar evento** | Solicitar |
| Crear Evento Directo (superadmin) | **Crear evento** | Crear evento |

"Resumen" reemplaza a "Panel Principal" porque la pantalla muestra el resumen de **un** evento; el nombre anterior sugería algo general. Los nombres exactos se pueden ajustar al aprobar las tareas.

### 5 bis. Título de cada página
El título (`<h1>` y la pestaña del navegador) usa el mismo nombre que el menú, seguido del evento cuando corresponde (por ejemplo "Resumen - Dia del Padre").

### 6. "Ver como organización": una vista, no un rol
Se guarda en `localStorage` una clave `vistaComo = organizacion`. Solo se respeta si el rol real, confirmado por Firestore, es superadmin; si no, se ignora y se borra. El menú se arma con el rol "efectivo" (organización) y un aviso fijo arriba dice "Estás viendo el panel como organización" con el botón "Volver a superadmin". Cerrar sesión borra la clave. El rol "efectivo" lo calcula una sola función (`window.rolEfectivo`, definida en `shared/menu-admin.js`) que usan el menú y `shared/menu-rol.js`, para que los dos coincidan.

- **Por qué no cambiar el rol real:** implicaría escribir en `usuarios` y reglas, que está fuera de alcance y es riesgoso.
- **Alternativa descartada:** simplemente documentar "cerrá sesión y entrá con la otra cuenta". Funciona hoy, pero es justo lo que genera la queja.
- **Límite conocido:** `eventos.html` impide que un superadmin envíe solicitudes (son de organizaciones), y `soporte.html` redirige a los superadmin a Mensajes. Por eso, en la vista de organización, "Solicitar evento" y "Soporte" no navegan: el menú intercepta el clic y muestra un aviso en la barra de la vista. Así no hace falta tocar esas páginas ni sus reglas de rol. Las páginas propias de superadmin ya redirigen a quien no es superadmin (verificado en el código: `superadmin.html` y `consultas-publicas.html` van a la lista de Eventos, y `mensajes.html` va a Soporte). Como esas redirecciones miran el rol real, un superadmin en la vista de organización las abre igual; por eso en esa vista el menú no las muestra y, si se abren a mano, la vista las lleva a la lista de Eventos.

## Risks / Trade-offs

- **[Reescribir el menú en 10 páginas a la vez puede romper alguna]** → Se migra una página por vez, se prueba en Chrome con las dos cuentas y recién después se pasa a la siguiente. Cada página migrada es un commit aparte, fácil de deshacer.
- **[Un script síncrono en el cuerpo bloquea un instante el dibujado]** → El archivo es chico y sin red; el costo es despreciable frente al parpadeo que se elimina.
- **[Los avisos de no leídos y los contadores dependen de la estructura actual del menú]** → Se conservan las mismas clases y atributos que usa `menu-rol.js` hoy (`link-soporte`, `badge-no-leidos`, `data-nav-key`, etc.) y se prueba que los números sigan apareciendo.
- **[`view-transition-name` solo funciona en navegadores recientes]** → En los demás simplemente no hay fundido; el menú sigue sin parpadear porque nace en su estado final.
- **[La vista como organización puede confundir si se olvida activada]** → Aviso fijo y visible en todas las páginas hasta volver, y se limpia al cerrar sesión.

## Migration Plan

1. Crear el archivo compartido del menú y migrar **una** página (Ventas) para probar el enfoque.
2. Si funciona, migrar las otras 9, de a una, probando cada una.
3. Pasar los estilos del menú achicado a `admin-shell.css` y limpiar el código viejo de `menu-rol.js`.
4. Agregar "Ver como organización".

Marcha atrás: cada paso es un commit; se deshace con `git revert`. No hay datos que migrar.

## Open Questions

- Si "Resumen" es el mejor nombre o prefieren otro (por ejemplo "Panel del evento"). Se puede decidir al aplicar sin cambiar las tareas.
