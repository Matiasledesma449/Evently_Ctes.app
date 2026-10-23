# Proposal

## Why

En la pantalla Ventas hay 4 tarjetas de resumen (Total recaudado, Entradas vendidas, Ventas confirmadas, Pendientes de pago) que son **siempre las mismas** aunque se cambie el filtro. Si se elige "Pendientes" o "Rechazadas", casi todas muestran 0 y no dicen nada útil sobre lo que se está mirando. El pedido lo hizo el usuario varias veces: que cada filtro muestre cifras propias, y que eso valga para todos los métodos de pago.

Además, el filtro de método de pago tiene solo 4 opciones fijas (Crédito, Débito, Prepaga, Dinero en cuenta). Faltan los que existen en los datos: "Otro", que guarda el servidor cuando Mercado Pago informa un tipo no reconocido, y los viejos "Efectivo" y "Transferencia" de las ventas de prueba.

## What Changes

- Las 4 tarjetas pasan a depender del filtro de estado elegido (cifras propias para Todos, Confirmadas, Pendientes y Rechazadas; ver `specs/panel-ventas-resumen/spec.md` para el detalle).
- Las tarjetas siempre respetan también el filtro de método de pago.
- Arriba de las tarjetas se muestra en una línea qué filtro está activo y cuántas ventas hay.
- El filtro de método arma sus opciones con los métodos que realmente tienen las ventas del evento (más "Todos los métodos").
- Un aviso simple cuando se combina un método con ventas pendientes: esas ventas todavía no tienen método de pago.
- Los cálculos se escriben como funciones puras en `shared/ventas-utils.js`, con una prueba nueva en `pruebas/`.
- Se mantienen los colores, el diseño de tarjetas y la información que ya existía en "Todos".

## Capabilities

### New Capabilities
- `panel-ventas-resumen`: qué cifras muestran las tarjetas de resumen de Ventas según el filtro de estado y de método de pago.

### Modified Capabilities
<!-- Ninguna. El cambio pagos-mercadopago tiene una especificación `panel-de-ventas` que todavía no está archivada como especificación principal, así que no hay nada que modificar acá. Este cambio la respeta: "recaudado" cuenta solo ventas confirmadas. -->

## Impact

- Código: `admin/ventas.html` (las tarjetas y el filtro de método pasan a dibujarse desde JavaScript), `shared/ventas-utils.js` (funciones nuevas), `pruebas/14-tarjetas-de-ventas.js` (prueba nueva).
- No toca: pagos, `api/`, `server/`, reglas de Firestore, datos de Firestore, el menú ni las demás pantallas (Resumen y Reportes quedan para otro cambio).
- Sin dependencias nuevas.

## Fuera de alcance

- Dashboard (Resumen) y Reportes: tienen sus propios números y problemas; se tratan en el cambio del panel claro.
- Cambiar qué cuenta como recaudación: sigue siendo solo las ventas confirmadas.
- El parpadeo del contenido al cargar ("Cargando..." que se reemplaza por datos).
- Guardar el método de pago en las ventas pendientes: eso depende del flujo de pagos.

## Por qué esta opción y no otra

- **Tarjetas distintas por filtro, en vez de ocultarlas o dejarlas en 0.** Ocultar las tarjetas dejaría la pantalla vacía justo cuando se filtra; dejarlas en 0 es el problema actual. Mostrar la cifra que corresponde a lo que se mira (por ejemplo, el dinero que está esperando pagarse en Pendientes) da información nueva y útil.
- **Opciones del método armadas desde los datos, en vez de una lista fija.** Una lista fija vuelve a quedar desactualizada cada vez que aparece un método nuevo (como "Otro"); armarla desde las ventas del evento nunca deja afuera uno que existe.
- **Funciones puras en `shared/ventas-utils.js`.** Ahí ya viven las reglas de dinero de Dashboard, Ventas y Reportes; ponerlas en un solo lugar permite probarlas con `node` sin navegador ni Firebase.

## Cómo se verifica a mano

1. Abrir Ventas del evento con ventas de varios estados y recorrer los 4 filtros: cada uno muestra sus 4 tarjetas propias, con sus títulos, y la línea de "Mostrando: ...".
2. Elegir un método de pago en el desplegable: las tarjetas y la tabla cambian juntas, y el desplegable lista solo métodos que tienen ventas.
3. Combinar "Pendientes" con un método: aparece el aviso de que las pendientes no tienen método todavía.
4. Correr `node pruebas/ejecutar-todas.js`: todas las pruebas pasan, incluida la nueva.
5. Confirmar que "Total recaudado" nunca suma dinero de ventas pendientes ni rechazadas.
