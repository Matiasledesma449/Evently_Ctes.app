# Proposal

## Why

Pedido 11 de la persona (26/10, noche): el superadmin elige una organización y quiere que TODO el panel la use, viéndolo
siempre arriba. Hoy cada página tiene su propio filtro (o ninguno) y el selector de evento ofrece eventos de todas las
organizaciones. Bug visto: en Reportes, con una organización sin eventos elegida, el selector ofrecía eventos de otras.

## What Changes

- **Franja rosa arriba** (la dibuja `shared/menu-admin.js`, sin parpadeo) en Eventos, Resumen, Ventas, Reportes, Escáner y
  Finanzas, solo para el superadmin real (en "Ver como organización" sigue la barra violeta): "Estás viendo:" con un
  desplegable de organización ("Todas las organizaciones" + las activas).
- **Al lado, el selector de evento** de la página (Resumen, Ventas, Reportes): se muda a la franja y ofrece SOLO los
  eventos de la organización elegida. En celular la franja ocupa dos renglones.
- **Una sola elección para todo el panel**: se recuerda en `localStorage.organizacionElegida`. Cambiarla vuelve a cargar la
  página; si el evento activo no es de la organización nueva, pasa al primero de esa organización (o a "Elegí un evento").
- **La misma regla en todas las pantallas**: `eventosParaVer` (shared/organizaciones.js) filtra también al superadmin cuando
  eligió una organización. La usan el selector, Reportes "Todos los eventos" y la lista de Eventos.
- **Eventos y Finanzas** ya no muestran su propio filtro de organización: usan el de la franja (el botón "Crear evento" del
  pedido 10 sigue apareciendo con una organización elegida).
- Cerrar sesión borra la elección.

## Fuera de alcance

- Juntar "Ver sitio" y "Ver como organización" en una sección (pedido 14).
- Escáner: muestra la franja, pero valida entradas como hoy.
