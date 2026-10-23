# Proposal

## Why

El menú del panel (admin y superadmin) tiene tres problemas que se notan todos los días:

- Cada vez que se cambia de página con el menú achicado (solo iconos), la página nueva se dibuja primero con el menú ancho y con los nombres, y recién después se achica. Se ve como un parpadeo.
- El mismo menú está copiado a mano en 10 páginas, y por eso los nombres y detalles ya quedaron distintos entre una y otra ("Panel Principal" en el menú de escritorio, "Panel" en el de celular, "Dashboard" en la pestaña, "Panel Global" y "Super Admin" para lo mismo, "Mis Eventos" y "Eventos").
- No hay forma de pasar de superadmin a organización: hay que cerrar sesión y entrar con la otra cuenta.

Se hace ahora porque es la base de las mejoras siguientes del panel (que Dashboard, Ventas y Reportes se entiendan, y el rediseño): conviene tener un solo menú antes de seguir tocando pantallas.

## What Changes

- Un solo menú lateral (y su versión de celular) que se define en un único archivo compartido, y las 10 páginas del panel lo usan en lugar de tener su propia copia.
- El menú achicado se recuerda y se aplica antes de que la página se dibuje: al navegar no hay parpadeo ni animación de "abrirse y cerrarse".
- Nombres únicos y claros, iguales en escritorio, celular y título de cada página (ver `design.md` para la lista propuesta).
- Un botón para el superadmin, "Ver como organización", que muestra el panel como lo ve una organización y permite volver con un clic. Cambia solo lo que se ve, no los permisos.
- Se mantienen los colores, los íconos, las secciones y la información de hoy.

## Capabilities

### New Capabilities
- `panel-navegacion`: cómo se ve y se comporta el menú del panel (único, achicable sin parpadeo, con nombres consistentes y las secciones que corresponden a cada rol).
- `panel-vista-como-organizacion`: forma de que un superadmin vea el panel como una organización y vuelva, sin cambiar permisos.

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene specs principales en openspec/specs/. -->

## Impact

- Código: `shared/menu-rol.js` (se reordena), `shared/admin-shell.css` (se suman los estilos del menú achicado y se revisa la transición entre páginas), un archivo compartido nuevo para el menú, y las 10 páginas de `admin/` (se les saca su copia del menú).
- No toca: pagos, `api/`, `server/`, reglas de Firestore, datos de Firestore ni el sitio del comprador.
- Sin dependencias nuevas: JavaScript y CSS puros, como el resto del sitio.

## Fuera de alcance

- El contenido de Dashboard, Ventas y Reportes (números, textos, selector de evento): es el cambio siguiente.
- Las imágenes de los eventos y borrar o recrear eventos.
- El diseño de la página del comprador.
- Permisos reales: "Ver como organización" no da ni quita permisos, y las reglas de Firestore siguen decidiendo todo.

## Por qué esta opción y no otra

- **Menú compartido en un archivo, en lugar de arreglar solo el parpadeo en cada página.** Arreglar el parpadeo con un pequeño script en cada página sería más rápido, pero dejaría las 10 copias, que es lo que genera los nombres distintos. Un solo archivo arregla las dos cosas. Se prefiere sobre un framework o un paso de build: el proyecto no los tiene y cambiar de stack es una decisión aparte.
- **"Ver como organización" visual, en lugar de un cambio real de rol.** Cambiar el rol real implicaría tocar datos de usuarios y reglas, que es delicado. Un cambio visual cubre la necesidad (ver lo que ve una organización) sin riesgo para los datos.

## Cómo se verifica a mano

1. Con el menú achicado, entrar a cada página del panel desde el menú: nunca se ve el menú ancho ni se anima al cargar. Probar en Chrome, con superadmin y con organización.
2. Cambiar el tamaño de la ventana al ancho de un celular: el menú de abajo muestra los mismos nombres cortos.
3. Comparar el menú de las 10 páginas: mismas secciones, mismos nombres y la sección actual resaltada.
4. Como superadmin, usar "Ver como organización": el menú muestra solo lo de una organización y hay un aviso con el botón para volver.
5. Confirmar que no cambió ninguna regla ni dato: Ventas, Dashboard y Reportes siguen cargando igual que hoy.
