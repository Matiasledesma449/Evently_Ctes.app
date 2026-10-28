# Design

## Context

En `admin/ventas.html` el filtro de estado (botones) y el de método (desplegable con "Aplicar filtros") ya filtran la **tabla**: `aplicarFiltrosYRenderizar` arma la lista `filtradas` y se la pasa a `renderizarVentas` y a `actualizarResumen`. El problema está en `actualizarResumen`, que llama siempre a `resumenDeVentas` de `shared/ventas-utils.js` y escribe las mismas 4 cifras en 4 tarjetas fijas del HTML. Ese archivo ya tiene las reglas de dinero compartidas con Dashboard y Reportes (solo `confirmada` suma recaudación) y helpers como `textoDelMotivo`.

Las ventas del navegador traen `fecha` como marca de tiempo de Firestore (`{ seconds }`). El método de pago lo guarda el servidor al confirmar (`Crédito`, `Débito`, `Prepaga`, `Dinero en cuenta` u `Otro`); las ventas pendientes no tienen método, y las de prueba viejas pueden tener `Efectivo` o `Transferencia`. Algunas ventas viejas tienen `monto_total` no numérico, que ya se trata como 0.

Ver `proposal.md` para el motivo y `specs/panel-ventas-resumen/spec.md` para lo que debe mostrarse.

## Goals / Non-Goals

**Goals:**
- Que las cifras de las tarjetas se calculen en funciones puras, probables con `node`.
- Que tarjetas y tabla usen exactamente la misma lista filtrada.
- Que el desplegable de método nunca deje afuera un método que existe en los datos.

**Non-Goals:**
- Cambiar Dashboard o Reportes, ni la regla de qué es recaudación.
- Cambiar la consulta a Firestore (se sigue escuchando `ventas` del evento).

## Decisions

### 1. Funciones puras nuevas en `shared/ventas-utils.js`
- `filtrarVentas(ventas, estado, metodo)`: devuelve las ventas que cumplen ambos filtros. Hoy esa lógica está dentro de la página; se mueve para que la tabla y las tarjetas no puedan divergir.
- `tarjetasDelFiltro(estado, ventas, ahora)`: devuelve las 4 tarjetas `{ titulo, valor, ayuda, tono }` del estado elegido. El `valor` ya viene como texto listo para mostrar (con `$` y separador de miles, o "—").
- `metodosDePago(ventas)`: lista, sin repetir y ordenada, de los métodos que tienen las ventas (ignora vacíos).
- `tiempoDesde(fecha, ahora)`: "hace 5 min", "hace 3 h", "hace 2 días".
- Para "Motivo más frecuente" se reutiliza `textoDelMotivo`.

**Por qué:** la lógica de dinero ya vive en ese archivo y el repo ya prueba con `node` las funciones puras (`pruebas/13-panel-de-ventas.js`). **Alternativa descartada:** calcular dentro de `ventas.html`: no se puede probar sin navegador.

### 2. Las tarjetas se dibujan desde JavaScript
El contenedor `#resumenVentas` deja de tener 4 tarjetas fijas en el HTML y se llena con lo que devuelve `tarjetasDelFiltro`, escapando cada texto con `escaparHtml` (ya existe). Se mantienen las mismas clases visuales de hoy (borde, fondo blanco, número grande); el color del número sale del `tono`: violeta para dinero cobrado, amarillo para lo pendiente, gris para el resto, como ahora.

### 3. Fechas
Una función auxiliar acepta una fecha de Firestore (`{ seconds }`), un `Date` o un número, y devuelve milisegundos; si no hay fecha, esa venta se ignora para "La más antigua". `ahora` se recibe por parámetro para poder probar sin depender del reloj.

### 4. Desplegable de método desde los datos
En cada actualización de datos se reconstruyen las opciones con `metodosDePago`. Reconstruir un desplegable borra lo elegido, así que se guarda la selección antes y se vuelve a poner si ese método todavía existe; si no existe, queda en "Todos los métodos".

### 5. Los filtros se aplican al instante
Hoy el desplegable exige apretar "Aplicar filtros". Se aplica apenas se cambia (así tabla y tarjetas no se quedan desparejas); el botón se mantiene y hace lo mismo. Es un ajuste pequeño pedido implícitamente por "que todo el filtro tenga sentido".

### 6. Línea de filtro activo y aviso de pendientes
Dos textos simples sobre las tarjetas, con el mismo estilo gris pequeño de la página: "Mostrando: Pendientes · Todos los métodos · 5 ventas", y el aviso de que con un método elegido no entran las ventas sin método de pago. El aviso solo aparece cuando hay un método elegido.

## Risks / Trade-offs

- **[Los números de la tarjeta "Todos" cambian de lugar o texto sin querer]** → La prueba nueva fija los valores del filtro "Todos" con el mismo ejemplo que hoy, para que no se pierdan.
- **[Ventas viejas con datos raros (`monto_total` no numérico, sin `fecha`)]** → Se tratan como 0 o se ignoran, con casos en la prueba.
- **[Tamaño de las tarjetas con textos largos, por ejemplo el motivo]** → Se recorta el texto con puntos suspensivos y el texto completo queda en el título de la tarjeta.
- **[Cambiar el desplegable puede disparar muchas actualizaciones]** → La lista de ventas ya está en memoria; solo se vuelve a filtrar, sin nuevas consultas a Firestore.

## Migration Plan

1. Funciones puras y su prueba, sin tocar la página.
2. Cambiar la página para usarlas, una parte por vez (tarjetas, desplegable, avisos).
3. Probar en el navegador con el evento que tiene ventas de varios estados.

Marcha atrás: cada paso es un commit; se deshace con `git revert`. No hay datos que migrar.
