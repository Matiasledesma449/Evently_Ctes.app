# Design

## Context

Las ventas guardan `metodo_pago` con el nombre que pone `server/confirmacion.js` (`Crédito`, `Débito`, `Prepaga`, `Dinero en cuenta`, `Otro`). `server/mercadopago.js` excluye el efectivo (`ticket`). Ventas y Reportes ya arman sus filtros de método desde los datos (`metodosDePago` en `shared/ventas-utils.js`). El texto del paso de pago en `public/evento.html` lista las formas a mano. El PDF de Reportes (`exportarPDF` en `admin/reportes.html`) arma siempre 5 secciones dentro de `#pdf-content`.

El sitio es HTML y JavaScript puros, sin build (ver `CLAUDE.md`). Este change no cambia eso.

## Goals / Non-Goals

**Goals:**
- Que ninguna pantalla ofrezca ni nombre "Efectivo".
- Que la lista de formas de pago esté escrita en un solo lugar.
- Que quien exporta el PDF elija qué secciones lleva.

**Non-Goals:**
- Cobrar por métodos nuevos (transferencia, efectivo).
- Tocar datos ya guardados.

## Decisions

### 1. Lista de formas de pago en `shared/`
Un archivo nuevo `shared/formas-de-pago.js` (módulo, como `ventas-utils.js`) con la lista (respuesta 2D: Transferencia, Débito, Crédito; cómo se relaciona "Transferencia" con lo que guarda el servidor depende de la pregunta 5, todavía sin responder) y una función que devuelve el texto para mostrar. El texto de `public/evento.html` se arma desde ahí. Como `evento.html` es una página pública y el módulo no depende de Firebase, se importa igual que los demás módulos de `shared/`.
- **Alternativa descartada:** dejar el texto escrito a mano. Ya se desfasó una vez con el "Efectivo".

### 2. Elección de secciones del PDF como función pura
`seccionesDelPdf(elegidas)` (en `shared/ventas-utils.js`) recibe las claves marcadas y devuelve la lista ordenada y numerada de secciones a incluir; claves desconocidas se ignoran. `exportarPDF` arma solo esas secciones y numera 1, 2, 3… según las elegidas (hoy los números están escritos fijos en los títulos). Si no se marca ninguna, no se exporta y se avisa en pantalla.
- **Por qué:** se puede probar con `node`, sin navegador.
- Seguridad: las claves vienen de casillas fijas del HTML; el nombre del evento sigue pasando por `escaparHtml`.

### 3. "Efectivo" en los datos viejos
Respuesta 1B: se borran `public/assets/js/data.js` y `public/assets/css/js/data.js` (nadie los carga). Además, una prueba en `pruebas/` recorre las pantallas (`public/*.html`, `admin/*.html`, `shared/*.js`) y falla si encuentra "Efectivo" como opción para elegir (se permite en comentarios que explican por qué se excluye).

## Risks / Trade-offs

- [No se puede ver si hay eventos con "Efectivo" guardado en Firestore] → es un dato real; si aparece, se avisa y se corrige con aprobación (ver "Bugs conocidos" de `pendientes.md`).
- [Pregunta 2B cambia lo que guarda el servidor] → las ventas viejas seguirían con otro nombre; habría que juntar ambos nombres en los reportes. Por eso A es la recomendada.
- [Numerar secciones según lo elegido] → el título de cada sección cambia de número según la elección; se prueba con la función pura.

## Open Questions

- La pregunta 5 de `proposal.md` (qué es "Transferencia" frente a "Dinero en cuenta" y "Prepaga"). Las preguntas 1, 3 y 4 están respondidas (1B, 3A, 4A).
