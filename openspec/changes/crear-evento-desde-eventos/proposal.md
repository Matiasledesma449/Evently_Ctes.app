# Proposal

## Why

Pedido 10 de la persona (26/10, noche): cuando el superadmin filtra la lista de Eventos por una organización, quiere crear
un evento para esa organización sin ir a Crear evento y volver a elegirla a mano.

## What Changes

- En **Eventos** (lista del superadmin), cuando el filtro de organización tiene una organización elegida (no "Todas"),
  aparece el botón **"Crear evento"** junto a los filtros.
- El botón lleva a `eventos.html?modo=directo&organizacion=<id>`: Crear evento se abre con esa organización ya elegida en
  el desplegable "Organización". Se puede cambiar antes de publicar.
- Si el id no corresponde a una organización activa (borrada o inexistente), el desplegable queda en "Elegí la organización",
  como hoy.
- Al editar un evento (`&editar=<id>`) manda la organización del evento, no la de la dirección.

## Fuera de alcance

- La franja rosa "Estás viendo" en todo el panel (pedido 11) y la vista "Ver como organización" (no cambia).
- Admins y cuentas de organización: no ven el botón (ellos usan "Solicitar evento").
