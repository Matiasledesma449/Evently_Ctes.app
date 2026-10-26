## Purpose

Define qué cifra de dinero cuenta el panel como recaudada por la organización cuando las ventas incluyen costo de servicio.

## ADDED Requirements

### Requirement: Lo recaudado no incluye el costo de servicio
Resumen, Ventas y Reportes SHALL contar como recaudado el subtotal de las entradas de las ventas confirmadas, sin el costo de servicio, con el mismo criterio en las tres pantallas y en los PDF.

#### Scenario: Venta con costo de servicio
- **WHEN** una venta confirmada tiene subtotal $4.500, costo de servicio $360 y total $4.860
- **THEN** el panel suma $4.500 a lo recaudado

#### Scenario: Venta anterior al cambio
- **WHEN** una venta confirmada vieja solo tiene `monto_total` de $2.000
- **THEN** el panel suma $2.000

#### Scenario: Pendientes y rechazadas
- **WHEN** hay ventas pendientes o rechazadas con costo de servicio
- **THEN** "dinero en espera" y "dinero no cobrado" también se calculan sobre el subtotal

### Requirement: Detalle de la venta
El detalle de una venta en el panel SHALL mostrar las entradas, el costo de servicio y el total pagado cuando la venta tiene costo de servicio.

#### Scenario: Ver detalle
- **WHEN** el organizador abre una venta con costo de servicio
- **THEN** ve las tres cifras por separado

#### Scenario: Venta vieja
- **WHEN** abre una venta sin costo de servicio
- **THEN** ve solo el monto, como hoy
