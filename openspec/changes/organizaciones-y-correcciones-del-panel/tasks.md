# Tasks

Convención: "se comprueba" dice cómo verificarlo. Los cálculos se prueban con `node` (sin navegador ni Firebase). Lo que necesita navegador se comprueba a mano. Código base: la rama `claude/nube-2026-10-26-0400`. Las pruebas nuevas siguen la numeración de `pruebas/` (la siguiente libre es la 28).

## 1. Funciones compartidas

- [x] 1.1 Crear `shared/organizaciones.js` con `eventosDeOrganizacion`, `eventosParaVer`, `organizacionDeEvento` y `validarOrganizacion` (ver `design.md`). Se comprueba leyendo el archivo: es puro, sin `innerHTML`, y la pertenencia usa solo `organizacionId`.
- [x] 1.2 Crear `pruebas/28-organizaciones.js`: un evento solo de su organización; evento sin `organizacionId` no lo ve ninguna; superadmin sin vista ve todos; vista de organización con y sin organización elegida; nombre vacío, largo o repetido ("Valigroup" y " valigroup "); nombre con etiquetas HTML. Se comprueba con `node pruebas/28-organizaciones.js`.
- [x] 1.3 Hacer que `eventosDeLaPersona` de `shared/ventas-utils.js` delegue en `eventosDeOrganizacion` y reescribir los casos de `pruebas/15-cifras-del-evento.js` que probaban `creadoPor` y correo (E2, E5 y los que dependan). Se comprueba con `node pruebas/15-cifras-del-evento.js`: pasa con el criterio nuevo y sigue probando que una organización no ve eventos ajenos.
- [x] 1.4 En `shared/formas-de-pago.js` agregar `claveDeFormaDePago` y `opcionesDeFiltroDePago`, y hacer que `filtrarVentas` compare por esa clave. Se comprueba leyendo el archivo.
- [x] 1.5 Ampliar `pruebas/18-formas-de-pago.js` (o crear `pruebas/29-filtro-de-formas-de-pago.js`): "Dinero en cuenta" cuenta como Transferencia; el filtro ofrece siempre las tres formas, aun sin ventas; no ofrece "Efectivo"; "Otros" solo aparece si hay ventas de otro método; los totales no cambian. Se comprueba con `node`.

## 2. Ver como organización

- [x] 2.1 En `shared/menu-admin.js` agregar `window.vistaOrganizacion()` (devuelve la organización elegida o `''`) y el desplegable de organizaciones en la barra violeta de la vista, guardando la elección en `localStorage.vistaOrganizacionId`. Se comprueba leyendo el archivo: sin elección se avisa "Elegí una organización" y todo lo que viene de las organizaciones se inserta con `textContent`.
- [x] 2.2 En `admin/eventos-seleccion.html` usar `window.rolEfectivo` para decidir qué se muestra (categorías, filtro de organizaciones, título), y mostrar la lista con `eventosParaVer`. Se comprueba leyendo el archivo: con la vista activa no se muestran las categorías ni el filtro.
- [x] 2.3 Revisar el resto de `admin/*.html` (`eventos`, `dashboard`, `ventas`, `reportes`, `escaner`, `soporte`, `mensajes`, `consultas-publicas`) y pasar a `rolEfectivo` todo lo que decide qué se muestra; dejar el rol real solo donde protege (redirecciones de seguridad). Se comprueba leyendo cada archivo y anotando en el PR qué se cambió y qué se dejó con rol real y por qué.
- [x] 2.4 Que `shared/selector-evento.js` y `admin/reportes.html` usen `eventosParaVer` con la vista activa. Se comprueba leyendo los dos archivos.

## 3. Organizaciones

- [x] 3.1 Crear `admin/organizaciones.html` (solo superadmin real; si no, lleva a Eventos): lista de organizaciones, formulario para crear y para editar el nombre, y el vínculo de un admin por correo. Todo con `textContent`. Se comprueba leyendo el archivo.
- [x] 3.2 Sumar "Organizaciones" al menú del superadmin en `shared/menu-admin.js` (no aparece en la vista de organización). Se comprueba leyendo el archivo.
- [x] 3.3 En `admin/eventos.html?modo=directo`, agregar el desplegable "Organización" (obligatorio) y guardar `organizacionId` en el evento. Se comprueba leyendo el archivo: no se puede guardar sin elegirla.
- [x] 3.4 En `admin/aprobaciones.js`, al aprobar una solicitud, verificar que el evento lleve el `organizacionId` de la solicitud y avisar si falta; usar `eventosDeOrganizacion` para el filtro de organizaciones. Se comprueba leyendo el archivo.
- [x] 3.5 Entregar el texto de las reglas de Firestore de `organizaciones` en el PR para que la persona lo publique. Se comprueba: el texto está en el cuerpo del PR y en `design.md`.

## 4. Categorías de porcentaje en "Crear evento"

- [x] 4.1 Mover el panel de categorías de `admin/eventos-seleccion.html` a `admin/eventos.html?modo=directo`, solo para el superadmin real. Se comprueba leyendo los dos archivos: ya no está en Eventos.
- [x] 4.2 Agregar al formulario de crear evento el desplegable de categoría (por defecto "Sin categoría"), con `comisionCategoriaId` solo si se elige. Se comprueba leyendo el archivo.
- [x] 4.3 Dejar en la lista de Eventos solo el selector de categoría por evento, y solo para el superadmin real sin vista de organización. Se comprueba leyendo el archivo.
- [x] 4.4 Correr `pruebas/24-costo-de-servicio.js` a `27-ingresos-del-organizador.js`: el cálculo del costo no cambia. Se comprueba con `node`.

## 5. Formas de pago en el panel

- [x] 5.1 En `admin/ventas.html` y `admin/reportes.html`, hacer que el filtro de forma de pago use `opcionesDeFiltroDePago` y que cada venta se muestre con `nombreParaMostrar`. Se comprueba leyendo los archivos.
- [x] 5.2 Revisar `admin/dashboard.html` y los gráficos y el PDF de `admin/reportes.html` para que agrupen por `claveDeFormaDePago`. Se comprueba leyendo los archivos: no queda ningún texto "Efectivo" en lo que se muestra.
- [x] 5.3 Correr `node pruebas/13-panel-de-ventas.js`, `14-tarjetas-de-ventas.js` y `15-cifras-del-evento.js`: las cifras no cambian. Se comprueba con `node`.

## 6. Conteos coherentes

- [x] 6.1 Crear `pruebas/30-listas-coherentes.js`: con eventos de dos organizaciones, Resumen (selector), Eventos, Ventas y Reportes devuelven la misma lista para la misma cuenta y para el superadmin con el filtro. Se comprueba con `node pruebas/30-listas-coherentes.js`.

## 7. Limpieza de datos

- [x] 7.1 Crear `herramientas/limpiar-datos.js`: vista previa por defecto, `--borrar` más frase de confirmación, `--solo <colección>`, conserva `usuarios`, `configuracion` y `organizaciones`, informa lo borrado, sin leer ni imprimir la clave. Se comprueba leyendo el archivo; **Claude no la ejecuta**.
- [x] 7.2 Crear `herramientas/LEEME.md` con los pasos para que la persona la corra (dónde guardar su archivo de credenciales, qué comando, qué verá). Se comprueba leyendo el archivo: no contiene rutas personales ni nombres de archivos de claves.
- [x] 7.3 Una prueba con una base falsa (`pruebas/31-limpiar-datos.js`, con su base falsa propia: la de `_ayuda-db-falsa.js` es de los pagos y no se toca) que compruebe la vista previa (no borra), la frase equivocada (no borra) y la confirmación correcta (borra solo las tres colecciones). Se comprueba con `node`.

## 8. Revisión final

- [x] 8.1 Correr `node pruebas/ejecutar-todas.js`: todo pasa.
- [x] 8.2 Actualizar `CLAUDE.md` con `shared/organizaciones.js`, la colección `organizaciones`, la regla de pertenencia por `organizacionId` y la carpeta `herramientas/`. Se comprueba leyendo el archivo.
- [ ] 8.3 Prueba a mano en el navegador (la hace la persona): superadmin viendo como una organización; una cuenta de organización real; crear una organización nueva, vincularle un admin y crear un evento; mirar que Resumen, Eventos, Ventas y Reportes muestran lo mismo. Necesita navegador: no la hace la nube.
- [ ] 8.4 La persona publica las reglas de Firestore de `organizaciones` y recién después corre la limpieza (primero sin confirmar). Necesita a la persona: no la hace la nube.
