# Design

## Punto de partida

- `shared/menu-admin.js` dibuja dos entradas del superadmin: "Mensajes" (`mensajes.html`, la misma sección que "Soporte" de la organización, con el aviso `.badge-no-leidos`) y "Consultas públicas" (`consultas-publicas.html`, con el aviso `.badge-consultas-publicas`).
- `shared/menu-rol.js` cuenta los mensajes sin leer (conversaciones) y las consultas públicas nuevas, y pone cada número en su aviso.
- Las dos páginas ya comparten el diseño de lista + detalle (cambio `mensajes-estilo-whatsapp`).

## Decisiones

1. **Una entrada en el menú.** Se quita "Consultas públicas" de `SECCIONES`. La sección "Mensajes" se marca activa en `mensajes.html` y en `consultas-publicas.html` (`esPaginaActual`). Las dos páginas siguen siendo solo del superadmin (`SOLO_SUPERADMIN`).
2. **Barra de pestañas común.** `menu-admin.js` agrega `window.dibujarPestanasMensajes(contenedor)`: dibuja dos enlaces ("Organizaciones" → `mensajes.html`, "Consultas públicas" → `consultas-publicas.html`) con un contador cada uno (`.contador-pestana-mensajes`, `.contador-pestana-consultas`). Todo el HTML es texto fijo del archivo; los números se ponen con `textContent`. Cada página tiene un `<div id="pestanasMensajes">` arriba de su título.
3. **Avisos.** `menu-rol.js` sigue contando lo mismo; además de los avisos de siempre, pone cada número en el contador de su pestaña y en el aviso del menú pone la **suma**. El aviso de consultas deja de estar en el menú (no hay entrada) y vive en la pestaña.
4. **Celular.** La barra de pestañas usa todo el ancho y cada pestaña ocupa la mitad.

## Riesgos

- Que el aviso del menú cuente doble o deje de contar. Se verifica con datos inventados (una conversación sin leer y una consulta nueva → el menú dice 2).
