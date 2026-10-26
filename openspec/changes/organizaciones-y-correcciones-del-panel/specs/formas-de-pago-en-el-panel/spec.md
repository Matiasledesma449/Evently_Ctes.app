## Purpose

Define las formas de pago que se ofrecen y se muestran en todo el panel, con una lista fija y los mismos nombres en cada pantalla y en el PDF.

## ADDED Requirements

### Requirement: Lista fija de formas de pago
Todo filtro de forma de pago del panel SHALL ofrecer siempre "Todos", "Transferencia", "Débito" y "Crédito", con independencia de lo que haya en las ventas, y SHALL no ofrecer "Efectivo".

#### Scenario: Sin ventas
- **WHEN** un evento no tiene ventas
- **THEN** el filtro igual ofrece Transferencia, Débito y Crédito

#### Scenario: Datos viejos con Efectivo
- **WHEN** hay ventas antiguas guardadas con "Efectivo"
- **THEN** "Efectivo" no se ofrece como opción del filtro

### Requirement: Mismos nombres en todas las pantallas
Ventas, Reportes, Resumen y el PDF SHALL mostrar cada venta con la misma forma de pago, traducida de lo que guardó el servidor (por ejemplo "Dinero en cuenta" se muestra como "Transferencia").

#### Scenario: Venta con dinero en cuenta
- **WHEN** una venta se guardó con "Dinero en cuenta"
- **THEN** en todas las pantallas y en el PDF figura como "Transferencia"

#### Scenario: Filtrar por una forma
- **WHEN** se elige "Transferencia"
- **THEN** se ven las ventas guardadas como "Transferencia" y como "Dinero en cuenta", en cualquier pantalla con ese filtro

### Requirement: Otros métodos
Una venta con una forma de pago que no es ninguna de las tres SHALL agruparse bajo "Otros", y esa opción SHALL aparecer solo si hay ventas así.

#### Scenario: Aparece Otros
- **WHEN** hay ventas con un método que no es Transferencia, Débito ni Crédito
- **THEN** el filtro suma la opción "Otros" y la muestra con su cantidad

#### Scenario: No aparece Otros
- **WHEN** todas las ventas son de las tres formas
- **THEN** no se ofrece "Otros"

### Requirement: Las cifras no cambian
Cambiar los nombres y el filtro SHALL no cambiar los montos ni las cantidades de ninguna pantalla.

#### Scenario: Mismas cifras
- **WHEN** se compara una pantalla antes y después del cambio, sin filtro de forma de pago
- **THEN** los totales, cantidades y recaudado son los mismos
