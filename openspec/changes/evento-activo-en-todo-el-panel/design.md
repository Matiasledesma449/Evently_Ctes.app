# Design

## Context

`shared/selector-evento.js` (del change `panel-claro-resumen-reportes`) ya arma un desplegable de eventos en Resumen, Ventas y Reportes, recuerda el evento en `localStorage` (`eventoId`) y lo toma de `?id=`. `shared/menu-admin.js` ya dibuja el menú desde un solo archivo. El Escáner solo lee `eventoId` para el enlace de Resumen. El PDF de Reportes (`exportarPDF` en `admin/reportes.html`) ya escribe "Evento: …" en el texto, pero su archivo se llama `Evently_Reporte_<fecha>.pdf`.

El sitio es HTML y JavaScript puros, sin build (ver `CLAUDE.md`). Este change no cambia eso.

## Goals / Non-Goals

**Goals:**
- Que en las páginas que trabajan sobre un evento siempre se vea cuál es.
- Que lo exportado diga de qué evento es, también en el nombre del archivo.

**Non-Goals:**
- Rehacer el selector, el menú o los permisos.
- Mostrar el evento en páginas que no dependen de uno (según la pregunta 1).

## Decisions

### 1. Una franja compartida, en un archivo
Un archivo nuevo en `shared/` (módulo, como `selector-evento.js`) dibuja la franja dentro de un contenedor `#franjaEvento` que cada página trae arriba. Lee el evento activo con la misma regla del selector (`?id=` y, si no hay, `eventoId`) y busca su nombre en Firestore (un solo `getDoc`). Mientras carga muestra "—", para que nada salte.
- **Por qué:** una sola copia, y el nombre sale de los datos, no de texto escrito en cada página.
- **Alternativa descartada:** guardar el nombre en `localStorage` junto al id. Se desfasa si el organizador renombra el evento.

### 2. La regla de "qué evento es el activo" no se duplica
La función que decide el evento activo (hoy dentro de `selector-evento.js`) pasa a `shared/ventas-utils.js` como función pura, y la usan el selector y la franja. Se prueba con `node`, sin navegador.

### 3. Textos de exportación como funciones puras
`nombreDeArchivoDeReporte(nombreEvento, fecha)` y el título del documento salen de `shared/ventas-utils.js`: pasan el nombre a minúsculas con guiones, sin tildes ni caracteres raros (el nombre lo escribe un organizador), con un largo máximo, y "Todos-los-eventos" para el caso general. Seguridad: el nombre del evento nunca entra a un HTML sin pasar por `escaparHtml`; en la franja se escribe con `textContent`.

### 4. Sin evento o evento inexistente
La franja muestra "Elegí un evento para ver sus datos" y un enlace a la lista de Eventos, igual que el selector, sin errores ni redirecciones.

## Risks / Trade-offs

- [Una lectura más de Firestore por página] → es un solo documento; en Resumen, Ventas y Reportes no hace falta porque el selector ya tiene la lista.
- [Cuál de las páginas lleva la franja depende de la pregunta 1] → las tareas están escritas para la opción A; si la persona elige B o C se ajustan las tareas 2.x.
- [Falta confirmar si el Escáner valida entradas de un evento puntual o de cualquiera] → se revisa en la tarea 2.1 antes de escribir el texto de la franja; si valida de cualquiera, la franja de ese lugar no se pone y se avisa en el PR.

## Open Questions

- Las 3 preguntas de `proposal.md`.
