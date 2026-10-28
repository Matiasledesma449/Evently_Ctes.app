# Proposal

## Why

Pedido 13 de la persona (26/10, noche): el superadmin necesita sacar de la venta un evento sin borrarlo (suspender),
volver a ponerlo a la venta y eliminarlo con confirmación, pudiendo recuperarlo (como las organizaciones).

## What Changes

- **Situación de un evento publicado** (funciones puras en `shared/estado-evento.js`): activo, suspendido (`activo: false`)
  o eliminado (`eliminado: true`, que también lo deja `activo: false`). Nada se borra de la base.
- **Eventos (superadmin real)**: en cada tarjeta, "Suspender" o "Volver a activar", y "Eliminar" (con confirmación). Los
  eliminados se ven solo con el filtro "Eliminados" y tienen "Recuperar": vuelven **suspendidos**, para no ponerlos a la
  venta por sorpresa. El filtro suma "Suspendidos" y "Eliminados". Insignia "Suspendido" (ámbar) o "Eliminado" (rojo).
- **Editar** sigue disponible con el evento suspendido; editar no cambia si está activo o suspendido.
- **Organizaciones**: ven su evento suspendido con la insignia, sin botones nuevos. Los eliminados no aparecen en ninguna
  lista del panel (`eventosParaVer` los saca), salvo el filtro "Eliminados" del superadmin.
- **Sitio del comprador**: el inicio no muestra suspendidos ni eliminados; la página del evento dice "Este evento no está
  disponible por el momento.". El servidor (`server/compra.js`) ya rechaza `activo === false` y ahora también
  `eliminado === true`.

## Fuera de alcance

- Borrar de verdad un evento o sus ventas.
