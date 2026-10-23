# Proposal

## Why

Resumen, Ventas y Reportes hoy se contradicen y no dicen de qué evento hablan:

- **No hay un selector de evento.** El evento "activo" solo se guarda si se entra desde la lista de Eventos; con un enlace `?id=` se muestra pero no se recuerda. Por eso, al pasar de una pantalla a otra, el menú y las pantallas vuelven al evento viejo.
- **Reportes mezcla todos los eventos** (lee todas las ventas y todos los eventos), mientras Resumen y Ventas miran uno solo. Con los mismos datos, el total recaudado de Reportes no coincide con el de Resumen.
- **Resumen calcula distinto a Ventas.** "Entradas vendidas" toma el mayor entre un contador del lote y las entradas confirmadas; "Prom. entradas/compra" divide ese contador entre las ventas; "Lote más rentable" multiplica precio por contador. Con datos de ejemplo da $84 de "lote más rentable" con $96 recaudados.
- **El "Cargando datos..." se reemplaza de golpe** y la pantalla salta.

Es lo que más te confundía ("no entiendo a qué se refiere esa información"). Lo que pide la práctica con la productora es justamente ver ventas en tiempo real y estadísticas claras, y que sea la misma verdad en todas las pantallas.

## What Changes

- **Selector de evento** compartido, arriba de Resumen, Ventas y Reportes. Muestra el evento actual, lista los eventos que esa persona puede ver y, al cambiarlo, actualiza la dirección y el evento recordado.
- **El evento se recuerda siempre**, también cuando se entra con un enlace `?id=`.
- **Resumen:** todas las cifras salen de las ventas confirmadas del evento, con una línea chica en cada tarjeta que dice qué cuenta, como en Ventas. Los nombres coinciden con los de Ventas.
- **Reportes:** pasa a leer un evento a la vez, con la opción "Todos los eventos". Mismo criterio de dinero que Ventas, con una línea "Mostrando: Evento · Lote · Método". El filtro de método sale de los datos. El PDF exporta lo que se ve.
- **Carga sin saltos:** mientras llegan los datos, las tarjetas muestran "—".
- Los cálculos pasan a funciones puras de `shared/ventas-utils.js`, con una prueba nueva en `pruebas/` y chequeos nuevos en la skill `auditar-panel`.
- Se mantienen la paleta, los colores y la información.

## Capabilities

### New Capabilities
- `evento-activo`: cuál es el evento que se está mirando en el panel, cómo se elige, se recuerda y se muestra.
- `panel-resumen-evento`: qué cifras muestra la pantalla Resumen de un evento y de dónde salen.
- `panel-reportes`: qué evento y qué filtros usa Reportes, y que sus cifras coinciden con las de Resumen y Ventas.

### Modified Capabilities
<!-- Ninguna: el proyecto todavía no tiene especificaciones principales en openspec/specs/. Se respeta la regla de panel-de-ventas (del cambio pagos-mercadopago): la recaudación cuenta solo ventas confirmadas. -->

## Impact

- Código: `admin/dashboard.html`, `admin/reportes.html`, `admin/ventas.html` (solo el selector), un archivo compartido nuevo para el selector, `shared/ventas-utils.js`, `pruebas/15-cifras-del-evento.js` (nueva) y la skill `auditar-panel` (fuera del repositorio).
- No toca: pagos, `api/`, `server/`, reglas de Firestore ni datos.
- Sin dependencias nuevas.

## Fuera de alcance

- **Reglas de Firestore.** Hoy una organización puede leer las ventas de **todos** los eventos, no solo de los suyos. Este cambio filtra por evento en la pantalla, pero eso no es una protección real. Queda anotado como riesgo para el cambio de reglas (SHR-71).
- Imágenes de eventos, diseño de la página del comprador y pagos.
- Rediseñar las pestañas internas de Reportes (Desglose por lote, Transacciones, etc.): se mantienen, pero con los datos del evento elegido.

## Por qué esta opción y no otra

- **Selector compartido en un archivo, en vez de uno por pantalla.** Tres copias volverían a divergir (ya pasó con el menú). Uno solo garantiza que el evento sea el mismo en las tres pantallas.
- **Reportes de un evento a la vez, con "Todos".** Lo eligió el usuario: mantiene la vista general y hace que los números coincidan con Resumen y Ventas cuando se elige el mismo evento.
- **Cifras desde las ventas confirmadas, en vez de los contadores del lote.** Los contadores `vendidas` pueden quedar desfasados (por ventas borradas, ventas de pruebas viejas o el flujo anterior a Mercado Pago). Las ventas confirmadas son la verdad del dinero cobrado y se pueden auditar una por una.

## Cómo se verifica a mano

1. Abrir Resumen, Ventas y Reportes del mismo evento: Total recaudado, entradas vendidas y ventas confirmadas dan lo mismo en las tres.
2. Cambiar de evento en el selector: cambian las tres pantallas, la dirección tiene el `?id=` nuevo y, al ir a otra pantalla por el menú, sigue el mismo evento.
3. En Reportes elegir "Todos los eventos": el total es la suma de los eventos.
4. Recorrer Resumen: ninguna tarjeta tiene "NaN", y el "lote más rentable" nunca supera lo recaudado.
5. Recargar con la conexión lenta: las tarjetas muestran "—" y no saltan al llegar los datos.
6. Correr `node pruebas/ejecutar-todas.js` y la skill `auditar-panel`: sin problemas.
