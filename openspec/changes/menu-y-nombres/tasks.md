# Tasks

Convención: "se comprueba" dice cómo verificarlo a mano. Las pruebas en Chrome necesitan una sesión iniciada en el panel; iniciar sesión lo hace el usuario (las contraseñas no las escribe Claude). El sitio no tiene tests automáticos para esto.

## 1. Menú compartido, probado en una sola página (Ventas)

- [x] 1.1 Crear el archivo compartido del menú (menú lateral y menú de celular con todas las secciones, los roles, los avisos de no leídos y el botón de cerrar sesión) conservando las clases y atributos que hoy usa `menu-rol.js`. Se comprueba abriendo el archivo y viendo que contiene las secciones de la tabla de nombres del diseño y ninguna sección que hoy no exista. El archivo se llama `shared/menu-admin.js`.
- [x] 1.2 Mover a `shared/admin-shell.css` los estilos del menú achicado que hoy inyecta `menu-rol.js`, sin cambiar colores ni medidas. Se comprueba comparando los valores del CSS con los del script y que `menu-rol.js` ya no los inyecta.
- [x] 1.3 Migrar solo `admin/ventas.html`: sacar su copia del menú y usar el archivo compartido, indicando que su sección es "ventas". Se comprueba en Chrome (con el usuario ya logueado): Ventas se ve igual que antes, con la sección Ventas resaltada y las demás secciones del rol.
- [x] 1.4 Probar el parpadeo en esa página: con el menú achicado, navegar entre Ventas y otra página que todavía tiene el menú viejo. Se comprueba que Ventas nace achicada, sin mostrar el menú ancho. Si la transición entre páginas sigue molestando, aplicar la decisión 3 del diseño. **Hecho (2026-10-23): se aplicó la decisión 3 (el menú queda fuera del fundido entre páginas); el usuario confirmó que el menú ya no parpadea. Queda un parpadeo del contenido (el "Cargando..." que se reemplaza por los datos), que corresponde al cambio del panel claro.**

## 2. Migrar las otras 9 páginas, de a una

> **Verificación (2026-10-23):** las 9 páginas se migraron juntas con un script que comprobó que lo quitado estaba bien armado; el usuario las recorrió en Chrome (por `localhost`, con su sesión) y confirmó que todas cargan, con el mismo menú y sin ver el menú ancho al navegar (esto último respalda también la 4.1). La 2.7 se comprobó con una búsqueda en el repositorio. No se anotó una prueba aparte por página: el recorrido fue uno solo.

- [x] 2.1 Migrar `admin/dashboard.html` y probarla en Chrome. Se comprueba: mismo menú, sección resaltada, y los KPI del evento siguen cargando igual.
- [x] 2.2 Migrar `admin/reportes.html` y probarla. Se comprueba: mismo menú y los números de Reportes no cambian respecto a hoy.
- [x] 2.3 Migrar `admin/eventos-seleccion.html` y `admin/eventos.html` y probarlas. Se comprueba: se puede elegir un evento y abrir el formulario de crear/solicitar evento.
- [x] 2.4 Migrar `admin/escaner.html`. Se comprueba: el menú es el mismo y el escáner sigue abriendo.
- [x] 2.5 Migrar `admin/soporte.html`, `admin/mensajes.html` y `admin/consultas-publicas.html`. Se comprueba: los avisos de no leídos de Mensajes y Consultas públicas siguen mostrando su número.
- [x] 2.6 Migrar `admin/superadmin.html` (Panel global). Se comprueba: solo la ve el superadmin y su menú es el mismo que el de las demás páginas.
- [x] 2.7 Confirmar que ninguna página de `admin/` conserva su copia del menú. Se comprueba con una búsqueda en el repositorio: la etiqueta `<aside` y la barra inferior solo aparecen en el archivo compartido.

## 3. Nombres y títulos

- [ ] 3.1 Aplicar la tabla de nombres del diseño en el archivo compartido (escritorio y celular). Se comprueba en Chrome: ninguna página muestra "Panel Principal", "Dashboard", "Mis Eventos" ni "Super Admin".
- [ ] 3.2 Actualizar el título de cada página (el `<h1>` y la pestaña del navegador) para usar el mismo nombre que el menú. Se comprueba abriendo las 10 páginas y comparando título y menú; el Resumen muestra el nombre del evento.
- [ ] 3.3 Confirmar los nombres con el usuario si quiere cambiar alguno (por ejemplo "Resumen"). Se comprueba cuando el usuario aprueba la lista final.

## 4. Menú achicado sin parpadeo, en todas las páginas

- [x] 4.1 Hacer que el estado del menú (achicado o ancho) y el rol guardado se lean antes de armar el menú, y que la animación de ancho se active recién después del primer dibujo. Se comprueba en Chrome: con el menú achicado, navegar entre las 10 páginas del menú y no ver nunca el menú ancho ni la animación al cargar.
- [ ] 4.2 Probar el botón de achicar y expandir y que recuerde el último estado al recargar y al volver a entrar. Se comprueba achicando, recargando, cerrando sesión y entrando de nuevo.
- [ ] 4.3 Probar que el menú no cambia de forma cuando llega el rol desde Firestore (entrar con superadmin y con organización). Se comprueba que no aparecen ni desaparecen secciones después de cargar.
- [ ] 4.4 Limpiar `shared/menu-rol.js`: sacar lo que ya no se usa (estilos inyectados, armado de la barra) y dejar solo roles, avisos y cierre de sesión. Se comprueba que el archivo ya no contiene los estilos del menú y que los avisos y el cierre de sesión siguen andando.

## 5. Ver como organización

- [ ] 5.1 Agregar el botón "Ver como organización" (solo para superadmin) y el aviso fijo con "Volver a superadmin", usando la clave `vistaComo` que solo se respeta si el rol real es superadmin. Se comprueba: el superadmin ve el botón, una organización no lo ve, y la clave se ignora si el rol real no es superadmin.
- [ ] 5.2 Mostrar en esa vista el menú y los textos de organización (Soporte en lugar de Mensajes, sin Consultas públicas ni Panel global) y manejar "Solicitar evento" con el aviso del diseño sin crear nada. Se comprueba: en Firestore no aparece ninguna solicitud nueva después de usar el botón.
- [ ] 5.3 Si se abre a mano una página solo de superadmin estando en la vista de organización, llevar a Eventos; y borrar la vista al cerrar sesión. Se comprueba abriendo `superadmin.html` a mano y cerrando sesión.
- [ ] 5.4 Comprobar que los permisos no cambiaron: en la vista de organización, un superadmin sigue pudiendo leer ventas y no se modificó ningún rol ni dato. Se comprueba leyendo `usuarios` en Firestore antes y después (solo lectura).

## 6. Revisión final

- [ ] 6.1 Recorrer las 10 páginas con la cuenta de superadmin y con la de organización, en pantalla ancha y de celular, con el menú achicado y expandido. Se comprueba con la lista: mismo menú, mismos nombres, sección resaltada, sin parpadeo y sin errores en la consola del navegador.
- [ ] 6.2 Confirmar que no cambió nada de pagos, `api/`, `server/` ni reglas. Se comprueba con `git diff --stat` contra `origin/main`: solo cambian archivos de `admin/` y `shared/` (más este change).
- [ ] 6.3 Actualizar `CLAUDE.md` (estructura de `shared/` con el menú compartido) sin incluir datos personales ni claves. Se comprueba leyendo el archivo.

## Workflow follow-up

- Archivar el change cuando el usuario lo apruebe.
- El siguiente change planeado es el del panel claro (Dashboard, Ventas y Reportes con selector de evento y números corregidos).
