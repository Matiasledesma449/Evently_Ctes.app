# Proposal

## Why

Pedido 14 de la persona (26/10, noche): "Ver sitio" y "Ver como organización" estaban sueltos en el menú del superadmin.
Pidió una sola sección para "ver", con un nombre creativo, un filtro "¿Qué organización?" y la opción de ir al inicio de
Evently o a la página de un evento en especial.

## What Changes

- **Sección nueva "Ojo de halcón"** (`admin/ojo-de-halcon.html`, solo superadmin real) en el menú, en lugar de "Ver sitio" y
  "Ver como organización". Las organizaciones siguen viendo "Ver sitio".
- **"¿Qué organización?"**: arranca con la de la franja rosa (si hay una elegida). Filtra los eventos de "Ver el sitio" y
  es la organización de "Ver el panel como organización".
- **Ver el sitio**: "¿Qué página?" con "Inicio de Evently" y cada evento de la organización (los suspendidos dicen
  "(suspendido)"; los eliminados no aparecen). "Abrir" la abre en otra pestaña.
- **Ver el panel como organización**: "Entrar como esta organización" activa la vista violeta de siempre, ya con la
  organización elegida. Sin organización, el botón queda deshabilitado.
- En la vista de organización, abrir Ojo de halcón lleva a Eventos (como las demás páginas solo de superadmin).
- `CLAUDE.md` y la herramienta local `auditar-panel` siguen el menú nuevo.

## Fuera de alcance

- Cambiar cómo funciona la vista violeta por dentro.
