# Proposal

## Why

El pedido 4 de `openspec/pendientes.md` dice: "Superadmin: eliminar 'Panel global'; las solicitudes de evento pasan a 'Crear evento' con aprobar, rechazar, comentar y contacto directo; al entrar ve los eventos directamente."

Lo que se ve en el código hoy:

- **Panel global** (`admin/superadmin.html`, entrada "Panel global" en `shared/menu-admin.js`): lista de eventos de todas las organizaciones con lo recaudado, y debajo las "Solicitudes de eventos" (pendientes, aceptadas, rechazadas, agrupadas por organización) que maneja `admin/aprobaciones.js`.
- **Crear evento** del superadmin es `admin/eventos.html?modo=directo`: solo el formulario para publicar un evento directamente.
- **Al entrar**, el superadmin cae en `admin/eventos-seleccion.html`, que le muestra primero una grilla de organizaciones y recién al tocar una ve sus eventos.
- Las solicitudes se pueden aprobar ("Publicar"), rechazar (con motivo) y editar. No hay forma de dejarle un comentario a la organización ni de contactarla desde la solicitud.

## What Changes

- **Se elimina "Panel global"**: sale la entrada del menú y `admin/superadmin.html` queda como una página mínima que redirige a "Crear evento" (para que un favorito viejo no dé error).
- **"Crear evento" del superadmin suma una pestaña "Solicitudes"** (junto a "Crear evento"): trae las solicitudes de eventos con aprobar, rechazar y editar, que hoy están en el Panel global, más dos cosas nuevas:
  - **Comentar**: el superadmin escribe un comentario en la solicitud (por ejemplo "Falta la hora de fin") y la organización lo ve en su lista de eventos, en la tarjeta de esa solicitud. Se guarda en `comentarios` (lista de `{ texto, autor, fecha }`).
  - **Contacto directo**: en cada solicitud, botones "Escribir por correo" (`mailto:`) y "WhatsApp" (solo si la organización tiene teléfono cargado), con un texto inicial que nombra el evento.
- **Al entrar, el superadmin ve los eventos directamente**: `eventos-seleccion.html` para el superadmin pasa a mostrar la lista de todos los eventos (con el nombre de la organización en cada tarjeta y un filtro por organización) en vez de la grilla de organizaciones.
- **Una lista compartida de funciones** en `shared/solicitudes-evento.js` (armar el comentario, leer los comentarios, armar los enlaces de contacto) con su prueba en `pruebas/`.

## Capabilities

### New Capabilities
- `solicitudes-en-crear-evento`: dónde viven las solicitudes, cómo se comentan y cómo se contacta a la organización.
- `eventos-directo-superadmin`: qué ve el superadmin al entrar y cómo desaparece el Panel global.

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene especificaciones principales en openspec/specs/. -->

## Impact

- Código (previsto): `shared/menu-admin.js` (sacar la entrada), `admin/superadmin.html` (queda como redirección), `admin/eventos.html` (pestañas y sección de solicitudes), `admin/aprobaciones.js` (comentar, contacto, y dejar de depender de los filtros del Panel global), `admin/eventos-seleccion.html` (lista directa del superadmin y comentarios en la tarjeta de la organización), `shared/solicitudes-evento.js` (nuevo), una prueba nueva en `pruebas/`, y `pruebas/13-panel-de-ventas.js` (la sección del Panel global ya no existe).
- No toca: `api/`, `server/`, reglas de Firestore ni datos ya guardados. Las solicitudes viejas (sin `comentarios`) se ven igual.
- Sin dependencias nuevas.

## Fuera de alcance

- Cambiar las reglas de Firestore (tarea 10.3 de pagos): el campo `comentarios` lo escribe solo el superadmin desde el panel, pero hasta que se publiquen las reglas no hay nada que lo impida a nivel de base de datos. Queda anotado, igual que para el resto de las solicitudes.
- "Mensajes" y "Consultas públicas" (pedido 5): el contacto directo no usa el chat interno.
- Borrar datos: las solicitudes y eventos ya guardados no se tocan.

## Decidí por vos (decisiones comunes, sin pregunta)

- **El resumen de dinero del Panel global se va con la página**: lo recaudado por evento ya está en Reportes y Ventas de cada evento. Si prefieren verlo también en la lista de eventos del superadmin, es una tarjeta más (los cálculos ya existen en `shared/ventas-utils.js`).
- **Contacto directo por correo y WhatsApp** en vez del chat interno: no depende de otro pedido y funciona con los datos que ya hay (correo de la solicitud, teléfono del perfil si existe).
- **Comentario como lista** (`comentarios`) y no un solo campo: así se conserva el historial si hay más de un intercambio. La organización ve el último comentario en su tarjeta.
- **`superadmin.html` queda como redirección**, no se borra el archivo, para no romper favoritos ni el enlace de "Consultas públicas".
- **Quién comenta**: solo el superadmin. La organización responde por el contacto directo o por Soporte, que ya existe.

## Por qué esta opción y no otra

- **Pestañas dentro de "Crear evento"** en vez de una página nueva: es lo que pide el pedido ("las solicitudes pasan a Crear evento") y no suma otra entrada al menú.
- **Funciones en `shared/`** igual que el menú, el evento activo y las formas de pago: se prueban con `node` sin navegador.

## Cómo se verifica a mano

1. Entrar como superadmin: se ven los eventos de todas las organizaciones, sin pasar por la grilla de organizaciones; el menú no tiene "Panel global".
2. Abrir "Crear evento": hay dos pestañas, "Crear evento" y "Solicitudes".
3. En "Solicitudes", aprobar una, rechazar otra con motivo, y dejar un comentario en una tercera.
4. Entrar como organización: la solicitud muestra el comentario del superadmin.
5. Probar "Escribir por correo" y "WhatsApp".
6. Correr `node pruebas/ejecutar-todas.js`: pasan todas.
