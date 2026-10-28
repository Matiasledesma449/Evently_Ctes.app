## Purpose

Define qué cifras muestra la pantalla Resumen de un evento y de dónde salen, para que sean coherentes entre sí y con las pantallas Ventas y Reportes.

## ADDED Requirements

### Requirement: Las cifras salen de las ventas confirmadas
En Resumen, Total recaudado, Entradas vendidas, Ventas confirmadas y Prom. entradas/compra SHALL calcularse solo con las ventas confirmadas del evento. Entradas vendidas es la suma de sus entradas y Prom. entradas/compra es ese total dividido por la cantidad de ventas confirmadas.

#### Scenario: Cifras de un evento
- **WHEN** el evento tiene 4 ventas confirmadas que suman 8 entradas y $96
- **THEN** Resumen muestra Total recaudado $96, Entradas vendidas 8, Ventas confirmadas 4 y Prom. entradas/compra 2

#### Scenario: Un contador viejo no cambia las cifras
- **WHEN** el contador de entradas vendidas guardado en un lote no coincide con las ventas confirmadas
- **THEN** Resumen muestra el total de las ventas confirmadas

#### Scenario: Sin ventas
- **WHEN** el evento no tiene ventas confirmadas
- **THEN** Total recaudado y Entradas vendidas muestran 0 y Prom. entradas/compra muestra "—"

### Requirement: Capacidad y aforo desde los lotes
Capacidad total SHALL ser la suma de las entradas disponibles de los lotes del evento. Aforo restante SHALL ser la capacidad menos las entradas vendidas, sin bajar de 0, y Tasa de ocupación el porcentaje vendido sobre la capacidad.

#### Scenario: Aforo
- **WHEN** el evento tiene una capacidad de 300 entradas y 8 vendidas
- **THEN** Aforo restante es 292 y Tasa de ocupación es 3%

### Requirement: Lote más vendido y más rentable
Lote más vendido SHALL ser el lote con más entradas en ventas confirmadas y Lote más rentable el que más dinero sumó en ventas confirmadas, ambos calculados con esas ventas. Si no hay ventas confirmadas, ambos SHALL mostrar "—". El dinero de un lote nunca SHALL superar la recaudación total.

#### Scenario: Lote más rentable coherente
- **WHEN** la recaudación total es $96 y el lote con más dinero sumó $84
- **THEN** Lote más rentable muestra ese lote con $84, que es menor o igual a $96

### Requirement: Pendientes de pago y método más usado
Pendientes de pago SHALL mostrar la cantidad de ventas pendientes del evento y NO SHALL sumar dinero. Método más usado SHALL ser el método con más ventas confirmadas y su porcentaje sobre esas ventas, o "—" si no hay.

#### Scenario: Pendientes no suman
- **WHEN** hay ventas pendientes por $24 y confirmadas por $96
- **THEN** Total recaudado es $96 y Pendientes de pago muestra la cantidad de ventas pendientes

### Requirement: Cada tarjeta explica qué cuenta
Cada tarjeta de Resumen SHALL llevar una línea chica que diga qué cuenta, y las que existen también en Ventas SHALL usar el mismo nombre que allí (Total recaudado, Entradas vendidas, Ventas confirmadas, Pendientes de pago).

#### Scenario: Mismos nombres que en Ventas
- **WHEN** se comparan las tarjetas de Resumen y de Ventas con el filtro "Todos"
- **THEN** las que coinciden tienen el mismo nombre y el mismo valor

### Requirement: Carga sin saltos
Mientras llegan los datos del evento, Resumen SHALL mostrar las mismas tarjetas con "—" en lugar de un texto de carga, y al llegar los datos SHALL reemplazar solo los valores.

#### Scenario: Datos que tardan
- **WHEN** la pantalla se abre y los datos todavía no llegaron
- **THEN** se ven las tarjetas con "—" y el contenido no cambia de tamaño al llegar los datos
