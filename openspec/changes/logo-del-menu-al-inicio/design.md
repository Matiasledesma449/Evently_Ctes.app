# Diseño

- `shared/menu-admin.js`: el `<div class="p-6">` del logo pasa a contener un `<a href="eventos-seleccion.html" class="logo-menu">` con el texto actual y una `E` corta (`logo-menu-corto`).
- `shared/admin-shell.css`: con `body.sidebar-colapsado` el bloque del logo ya no se oculta; se muestra solo la `E`, centrada, y el texto largo se esconde. La regla actual `> div:first-child { display: none }` se reemplaza.
- El `nav` achicado tiene `padding-top: 52px` para que la flecha no toque los botones; el logo corto se ubica en ese espacio sin mover los botones.
- Sin librerías ni cambios en `menu-rol.js`.
