## Purpose

Define qué cifras muestran las tarjetas de resumen de la pantalla Ventas del panel, según el filtro de estado y el filtro de método de pago, para que cada filtro dé información propia y útil.

## ADDED Requirements

### Requirement: Tarjetas del filtro "Todos"
Con el filtro "Todos", las tarjetas SHALL mostrar: Total recaudado (dinero de ventas confirmadas), Entradas vendidas (entradas de ventas confirmadas), Ventas confirmadas (cantidad) y Pendientes de pago (cantidad de ventas pendientes).

#### Scenario: Evento con ventas de varios estados
- **WHEN** el evento tiene 3 ventas confirmadas de $12 con 1 entrada cada una y 2 pendientes, y el filtro es "Todos"
- **THEN** las tarjetas muestran Total recaudado $36, Entradas vendidas 3, Ventas confirmadas 3 y Pendientes de pago 2

### Requirement: Tarjetas del filtro "Confirmadas"
Con el filtro "Confirmadas", las tarjetas SHALL mostrar: Total recaudado, Entradas vendidas, Ventas confirmadas y Promedio por venta (total recaudado dividido por la cantidad de ventas). Si no hay ventas, el promedio SHALL mostrarse como "—".

#### Scenario: Promedio por venta
- **WHEN** hay 4 ventas confirmadas que suman $48 y el filtro es "Confirmadas"
- **THEN** el Promedio por venta es $12

#### Scenario: Sin ventas confirmadas
- **WHEN** no hay ventas confirmadas
- **THEN** el promedio muestra "—" y las demás tarjetas muestran 0

### Requirement: Tarjetas del filtro "Pendientes"
Con el filtro "Pendientes", las tarjetas SHALL mostrar: Ventas pendientes (cantidad), Entradas en espera (suma de entradas), Dinero en espera (suma de montos, aclarando que todavía no se cobró) y La más antigua (hace cuánto se creó la venta pendiente más vieja, o "—" si no hay).

#### Scenario: Dinero en espera no es recaudación
- **WHEN** hay 2 ventas pendientes de $12 y el filtro es "Pendientes"
- **THEN** la tarjeta dice "Dinero en espera" con $24 y no se llama "recaudado"

#### Scenario: Antigüedad
- **WHEN** la venta pendiente más vieja se creó hace 3 horas
- **THEN** la tarjeta "La más antigua" muestra "hace 3 h"

### Requirement: Tarjetas del filtro "Rechazadas"
Con el filtro "Rechazadas", las tarjetas SHALL mostrar: Ventas rechazadas (cantidad), Entradas que no se vendieron (suma de entradas), Dinero no cobrado (suma de montos) y Motivo más frecuente, con el texto simple del motivo o "—" si no hay.

#### Scenario: Motivo más frecuente
- **WHEN** hay 3 ventas rechazadas, 2 por no pagarse a tiempo y 1 porque Mercado Pago rechazó el pago
- **THEN** "Motivo más frecuente" muestra "No se pagó a tiempo"

### Requirement: Las tarjetas respetan el filtro de método de pago
Todas las tarjetas SHALL calcularse solo con las ventas que cumplen a la vez el filtro de estado y el filtro de método de pago elegidos, las mismas que muestra la tabla.

#### Scenario: Estado y método combinados
- **WHEN** el filtro es "Confirmadas" y el método es "Dinero en cuenta"
- **THEN** las tarjetas y la tabla incluyen solo ventas confirmadas pagadas con dinero en cuenta

### Requirement: Se indica qué filtro está activo
Arriba de las tarjetas, el panel SHALL mostrar una línea con el estado y el método elegidos y la cantidad de ventas que se están mirando.

#### Scenario: Línea del filtro activo
- **WHEN** el filtro es "Pendientes" y el método es "Todos los métodos" y hay 5 ventas
- **THEN** la línea dice que se muestran 5 ventas pendientes de todos los métodos

### Requirement: Las opciones de método salen de los datos
El desplegable de método SHALL ofrecer "Todos los métodos" y, además, un solo ítem por cada método de pago que tengan las ventas del evento, sin repetir. Si el método elegido deja de existir al actualizarse los datos, SHALL volver a "Todos los métodos".

#### Scenario: Métodos que existen
- **WHEN** las ventas del evento usan "Crédito", "Dinero en cuenta" y "Otro"
- **THEN** el desplegable ofrece "Todos los métodos", "Crédito", "Dinero en cuenta" y "Otro", y nada más

### Requirement: Aviso sobre ventas pendientes y método
Mientras se elija un método distinto de "Todos los métodos", el panel SHALL avisar que las ventas pendientes y rechazadas sin método de pago no se incluyen, porque todavía no tienen uno.

#### Scenario: Pendientes con un método elegido
- **WHEN** el filtro es "Pendientes" y el método es "Crédito"
- **THEN** el panel muestra un aviso corto que explica que las ventas pendientes todavía no tienen método de pago y por eso no aparecen

### Requirement: La recaudación cuenta solo ventas confirmadas
En ningún filtro el Total recaudado SHALL incluir dinero de ventas pendientes ni rechazadas.

#### Scenario: Pendientes no suman a la recaudación
- **WHEN** el filtro es "Todos" y hay ventas confirmadas por $36 y pendientes por $24
- **THEN** el Total recaudado es $36
