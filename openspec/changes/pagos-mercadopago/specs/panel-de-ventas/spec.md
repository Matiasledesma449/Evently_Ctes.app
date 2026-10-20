# Spec Delta

## Purpose

Define qué muestra el panel de administración sobre las ventas con pagos reales: estados, filtros, quién es el comprador y cómo se cuenta la recaudación, sin confirmaciones manuales.

## ADDED Requirements

### Requirement: Estados y filtros de ventas
La pantalla de Ventas SHALL permitir filtrar por todos los estados y por `confirmada`, `pendiente` y `rechazada`. No MUST ofrecer el estado `anulada`. Cada venta rechazada SHALL mostrar su motivo en lenguaje simple.

#### Scenario: Filtrar rechazadas
- **WHEN** el usuario del panel elige el filtro "Rechazadas"
- **THEN** ve solo las ventas rechazadas, cada una con su motivo

#### Scenario: Venta vencida
- **WHEN** una venta rechazada tiene motivo `vencida`
- **THEN** el panel muestra un texto como "No se pagó a tiempo"

### Requirement: Los pagos ya no se confirman a mano
El panel MUST NOT ofrecer ningún botón para confirmar o cambiar el estado de una venta. Los estados los define únicamente el servidor a partir de Mercado Pago.

#### Scenario: Detalle de una venta pendiente
- **WHEN** el usuario abre el detalle de una venta pendiente
- **THEN** no hay botón de "Confirmar pago"

### Requirement: Recaudación solo de ventas confirmadas
Las cifras de recaudación y de entradas vendidas en Dashboard, Ventas y Reportes MUST contar únicamente ventas `confirmada`. Las ventas `pendiente` SHALL mostrarse aparte como "pendientes de pago" y las `rechazada` no suman a ninguna cifra de dinero.

#### Scenario: Mezcla de estados
- **WHEN** un evento tiene 2 ventas confirmadas, 1 pendiente y 1 rechazada
- **THEN** la recaudación y las entradas vendidas suman solo las 2 confirmadas, y se informa 1 venta pendiente de pago

### Requirement: Se ve quién compró
El panel SHALL mostrar el nombre, el apellido y el correo reales del comprador en las ventas nuevas. Las ventas viejas de prueba que no tienen esos datos se muestran tal como están guardadas, sin error.

#### Scenario: Venta nueva
- **WHEN** el panel muestra una venta creada con el nuevo flujo
- **THEN** la columna del comprador muestra su nombre y su correo

#### Scenario: Venta vieja de prueba
- **WHEN** el panel muestra una venta creada antes de este cambio
- **THEN** se muestra sin errores aunque falten nombre y apellido

### Requirement: Aviso de reembolso pendiente
Las ventas marcadas con `requiereReembolso` SHALL mostrarse con un aviso visible para el superadmin y las organizaciones que indique que hay que devolver el dinero desde el panel de Mercado Pago.

#### Scenario: Venta sin stock
- **WHEN** una venta quedó rechazada por `sin_stock`
- **THEN** el panel la muestra con el aviso de reembolso pendiente
