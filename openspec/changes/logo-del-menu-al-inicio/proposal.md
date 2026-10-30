# Logo del menú como botón de inicio

## Por qué
Pedido 8 de `openspec/pendientes.md`. El menú del panel ya se puede achicar y agrandar y ya tiene scroll para secciones nuevas (`shared/menu-admin.js`, `shared/admin-shell.css`). Falta que el logo de Evently sea un botón que vuelva al inicio y que se siga viendo con el menú achicado (hoy se oculta).

## Qué cambia
- El bloque del logo ("Evently / Administración") pasa a ser un enlace al inicio del panel (`eventos-seleccion.html`, la lista de Eventos).
- Con el menú achicado (76 px) se ve una versión corta del logo (la "E"), también como enlace.
- No cambia ningún permiso, dato ni página.

## Decidí por vos
- El "inicio" es la lista de Eventos del panel (no el sitio público): es lo que el panel ya usa como entrada y el sitio público se abre desde "Ojo de halcón". Si preferís el sitio público, se cambia el destino del enlace.

## Cómo se verifica a mano
1. Con el menú ancho, tocar el logo lleva a Eventos.
2. Achicar el menú: se ve la "E" arriba y también lleva a Eventos.
3. La flecha de achicar y los botones del menú siguen respondiendo igual.
