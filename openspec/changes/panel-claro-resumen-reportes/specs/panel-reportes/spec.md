## Purpose

Define qué evento y qué filtros usa la pantalla Reportes, y que sus cifras coincidan con las de Resumen y Ventas cuando se mira el mismo evento.

## ADDED Requirements

### Requirement: Reportes usa el evento elegido
Reportes SHALL mostrar los datos del evento activo del selector. El selector de Reportes SHALL ofrecer además la opción "Todos los eventos", y Reportes SHALL arrancar en el evento que se venía mirando.

#### Scenario: Arranque
- **WHEN** una persona que venía mirando un evento abre Reportes
- **THEN** Reportes muestra los datos de ese evento

### Requirement: Coincide con Resumen y Ventas
Con el mismo evento, el total recaudado, las entradas vendidas y las ventas confirmadas de Reportes SHALL ser iguales a los de Resumen y Ventas.

#### Scenario: Mismo evento, mismos números
- **WHEN** se abren Resumen, Ventas y Reportes del mismo evento sin filtros
- **THEN** los tres muestran el mismo total recaudado, las mismas entradas vendidas y las mismas ventas confirmadas

### Requirement: Todos los eventos suma solo los de la persona
Con "Todos los eventos", Reportes SHALL sumar los eventos que la persona puede elegir en el selector, no todos los de la base de datos.

#### Scenario: Organización con "Todos"
- **WHEN** una organización elige "Todos los eventos"
- **THEN** los totales suman solo sus eventos

### Requirement: Se indica qué se está mirando
Arriba de las cifras, Reportes SHALL mostrar una línea "Mostrando: <evento> · <lote> · <método>" con lo elegido en los tres filtros.

#### Scenario: Línea de filtros
- **WHEN** se elige un evento, el lote "Lote 1" y el método "Crédito"
- **THEN** la línea muestra el nombre del evento, "Lote 1" y "Crédito"

### Requirement: Filtros que salen de los datos
El filtro de lote SHALL ofrecer solo los lotes del evento (o de los eventos) elegidos, y el de método SHALL ofrecer solo los métodos que tienen las ventas, sin una lista fija. La capacidad SHALL calcularse con los lotes de lo elegido.

#### Scenario: Métodos que existen
- **WHEN** las ventas del evento usan "Crédito" y "Débito"
- **THEN** el filtro de método ofrece "Todos", "Crédito" y "Débito"

### Requirement: Pendientes de pago aparte
Reportes SHALL contar las ventas confirmadas para dinero y entradas, y SHALL informar aparte las pendientes de pago sin sumarlas a ninguna cifra.

#### Scenario: Pendientes
- **WHEN** hay ventas pendientes en el evento elegido
- **THEN** Reportes las muestra como "Pendientes de pago" y no las suma a la recaudación

### Requirement: El PDF exporta lo que se ve
El PDF exportado SHALL usar el mismo evento, lote y método elegidos y las mismas cifras que la pantalla.

#### Scenario: Exportar
- **WHEN** se exporta el PDF con un evento y un método elegidos
- **THEN** el PDF indica ese evento y ese método y sus totales coinciden con los de la pantalla
