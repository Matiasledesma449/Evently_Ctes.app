# Proposal

## Why

El pedido 1 de `openspec/pendientes.md` dice: "Selector de evento sin confusión: banner con el evento activo en cada página del panel; exportar y PDF dicen de qué evento son."

Parte de eso ya está hecho por el change `panel-claro-resumen-reportes`: Resumen, Ventas y Reportes tienen un selector con el evento activo, el evento se recuerda también con `?id=`, y el PDF de Reportes ya escribe "Evento: …" en su texto. Lo que falta, mirando el código:

- **Otras páginas del panel no muestran de qué evento hablan.** El Escáner (`admin/escaner.html`) solo usa el evento recordado para armar el enlace de Resumen; en pantalla no dice cuál es. Mensajes, Soporte, Consultas públicas, Panel global y la lista de Eventos no tienen nada.
- **El archivo del PDF no dice el evento.** Se llama `Evently_Reporte_AAAA-MM-DD.pdf`: con varios eventos, los archivos descargados se confunden.
- **Ventas no tiene ninguna exportación.** Si se quiere sacar un listado, no hay cómo (ver pregunta 3).

## What Changes

- **Franja de "Evento activo"** compartida, que se dibuja igual en todas las pantallas del panel donde el evento importa. Dice el nombre del evento (o "Todos los eventos" en Reportes) y tiene un enlace "Cambiar" que lleva a la lista de Eventos. En Resumen, Ventas y Reportes se mantiene el selector que ya existe; la franja no lo reemplaza.
- **El PDF de Reportes** lleva el evento en el nombre del archivo (ver pregunta 2) y el evento bien visible arriba del documento.
- Ventas no suma exportación (respuesta 3A).
- Los cálculos de texto (nombre de archivo, título de la exportación) pasan a funciones puras de `shared/ventas-utils.js`, con una prueba nueva en `pruebas/`.

## Capabilities

### New Capabilities
- `franja-evento-activo`: qué páginas muestran el evento activo, qué dice la franja y qué pasa si no hay evento.
- `exportaciones-con-evento`: cómo las exportaciones (PDF y, si se aprueba, la de Ventas) dicen de qué evento son.

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene especificaciones principales en openspec/specs/. Se apoya en `evento-activo` de panel-claro-resumen-reportes. -->

## Impact

- Código (previsto): un archivo compartido nuevo para la franja, `admin/escaner.html` y las demás páginas que se elijan en la pregunta 1, `admin/reportes.html` (nombre del PDF), `shared/ventas-utils.js` y una prueba nueva en `pruebas/`.
- No toca: pagos, `api/`, `server/`, reglas de Firestore ni datos.
- Sin dependencias nuevas.

## Fuera de alcance

- Cambiar el selector que ya existe en Resumen, Ventas y Reportes.
- Reglas de Firestore (una organización puede leer ventas de todos los eventos: queda para SHR-71).
- El error conocido de `eventoId` con `?id=`: lo resuelve `panel-claro-resumen-reportes` (el selector lo recuerda); este change no lo vuelve a tocar.

## Preguntas para la persona

**1. ¿En qué páginas va la franja con el evento activo?**
- A (recomendado): en las que trabajan sobre un evento: Escáner, y en Resumen, Ventas y Reportes junto al selector. Mensajes, Soporte, Consultas públicas, Panel global y Eventos quedan como están, porque no hablan de un evento puntual.
- B: en todas las páginas del panel, aunque la página no dependa del evento. Se ve parejo, pero en Mensajes o Soporte mostraría un evento que no tiene que ver con lo que se mira, y puede confundir más.
- C: solo en el Escáner (lo único que hoy no dice nada). Es lo más chico.

**2. ¿Cómo se llama el archivo del PDF?**
- A (recomendado): con el nombre del evento y la fecha, por ejemplo `Evently_Reporte_Fiesta-de-verano_2026-10-25.pdf`. Con "Todos los eventos" dice `Todos-los-eventos`.
- B: dejarlo como está (solo la fecha). El texto del PDF ya dice el evento, pero el archivo no.

**3. ¿Se agrega una exportación en Ventas?**
- A (recomendado): no. Hoy Ventas no exporta y nadie lo pidió; se arregla solo lo que ya existe (el PDF de Reportes).
- B: sí, un botón "Exportar" en Ventas con la lista de ventas confirmadas del evento, que diga el evento en el nombre y arriba del archivo. Es más trabajo y es una función nueva que antes no estaba.

## Respuestas de la persona

2026-10-25: respondió `1A 2A 3A`.
- 1A: la franja va en las páginas que trabajan sobre un evento (Escáner, y junto al selector en Resumen, Ventas y Reportes). Mensajes, Soporte, Consultas públicas, Panel global y Eventos quedan como están.
- 2A: el archivo del PDF lleva el nombre del evento y la fecha.
- 3A: no se agrega exportación en Ventas.

## Por qué esta opción y no otra

- **Una franja compartida en un archivo**, en vez de texto escrito a mano en cada página: ya pasó con el menú que tres copias terminan distintas (ver `menu-y-nombres`).
- **No reemplazar el selector que ya existe**: funciona y está probado; la franja solo agrega el aviso donde no hay selector.

## Cómo se verifica a mano

1. Abrir el Escáner con un evento elegido: la franja muestra su nombre y "Cambiar" lleva a la lista de Eventos.
2. Abrir el Escáner sin evento elegido: la franja invita a elegir uno, sin errores.
3. En Reportes, exportar el PDF con un evento y con "Todos los eventos": el nombre del archivo y el título dicen cuál es.
4. Correr `node pruebas/ejecutar-todas.js`: pasan todas.
