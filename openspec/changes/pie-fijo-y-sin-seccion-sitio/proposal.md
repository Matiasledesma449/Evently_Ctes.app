# Proposal

## Why

Pedidos 18 y 20 de la persona (28/10):
- La sección "Sitio" del panel (logos del pie) no le sirve; prefiere pedir esos cambios cuando haga falta.
- En el pie del sitio, los enlaces cambiaban de orden porque desaparecía el de la página en la que se estaba. Quiere los
  enlaces centrados y siempre en su lugar, el logo de Evently a la izquierda y el año 2026.

## What Changes

- **Sin "Sitio"**: se borran `admin/sitio.html` y `shared/achicar-imagen.js` (solo lo usaba esa página), y sale del menú.
  El pie sigue leyendo logos de `configuracion/sitio` si existen (hoy no hay), para no perder nada guardado.
- **Pie** (`shared/pie-publico.js`, prueba 23): una fila con el logo a la izquierda (también en celular), los seis enlaces
  centrados y siempre en el mismo orden (el de la página actual queda marcado, no desaparece) y los logos de marcas a la
  derecha; abajo, "© 2026 Evently by Bali Group" centrado. `public/confirmacion.html` también dice 2026.
- `CLAUDE.md` y la herramienta local `auditar-panel` sin "Sitio".
