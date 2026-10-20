# Spec Delta

## Purpose

Define cómo el comprador consulta el estado de su compra y recibe sus entradas, cómo vencen las ventas que nadie paga y qué muestra la pantalla de confirmación según cada estado.

## ADDED Requirements

### Requirement: Consulta con identificador y token
Para consultar una compra, el sistema SHALL exigir el identificador de la venta y su token de consulta. Si el token no coincide o la venta no existe, MUST responder lo mismo en ambos casos, sin revelar si la venta existe.

#### Scenario: Token correcto
- **WHEN** se consulta una venta con su identificador y su token
- **THEN** el sistema devuelve su estado y sus datos

#### Scenario: Token incorrecto o venta inexistente
- **WHEN** el token no coincide o el identificador no existe
- **THEN** el sistema responde "no encontrada" y no muestra ningún dato de ninguna venta

### Requirement: Qué datos se devuelven
La consulta SHALL devolver el estado, el motivo si lo hay, el nombre, la fecha y el lugar del evento, el lote, la cantidad y el monto. Las entradas con sus códigos MUST devolverse únicamente cuando la venta está `confirmada`. La respuesta MUST NOT incluir el token, datos de otras ventas ni identificadores internos de pago.

#### Scenario: Venta confirmada
- **WHEN** se consulta una venta `confirmada`
- **THEN** la respuesta incluye una entrada por unidad, cada una con su código

#### Scenario: Venta pendiente o rechazada
- **WHEN** se consulta una venta `pendiente` o `rechazada`
- **THEN** la respuesta no incluye ningún código de entrada

### Requirement: Vencimiento al consultar
Si una venta `pendiente` ya pasó su vencimiento de 30 minutos cuando se la consulta, el sistema SHALL pasarla a `rechazada` con motivo `vencida` y devolver ese estado. No debe depender de ningún proceso programado.

#### Scenario: Venta vencida
- **WHEN** se consulta una venta pendiente cuyo vencimiento ya pasó
- **THEN** la venta queda `rechazada` con motivo `vencida`

#### Scenario: Venta todavía vigente
- **WHEN** se consulta una venta pendiente dentro de los 30 minutos
- **THEN** la venta sigue `pendiente`

### Requirement: Pantalla de confirmación
La pantalla de confirmación MUST obtener los datos exclusivamente de la consulta de la venta y no de Firestore directamente, ni de los datos que Mercado Pago agrega a la dirección. Mientras la venta esté `pendiente`, SHALL volver a consultar cada pocos segundos durante un tiempo limitado y avisar si el pago tarda más de lo esperado.

#### Scenario: El aviso todavía no llegó
- **WHEN** el comprador vuelve de Mercado Pago y la venta aún figura pendiente
- **THEN** la pantalla muestra "estamos confirmando tu pago" y se actualiza sola cuando cambia el estado

#### Scenario: Dirección alterada
- **WHEN** alguien cambia a mano los datos de estado que Mercado Pago agrega a la dirección
- **THEN** la pantalla sigue mostrando el estado real de la venta

### Requirement: Mensajes y entradas según el estado
La pantalla SHALL mostrar un mensaje claro para cada estado. Para `confirmada` MUST mostrar un código QR por cada entrada. Para `rechazada` SHALL mostrar el motivo en lenguaje simple y un botón para volver a intentar la compra. No MUST mostrar datos bancarios inventados ni botones de funciones inexistentes.

#### Scenario: Compra confirmada de varias entradas
- **WHEN** la venta confirmada tiene 3 entradas
- **THEN** la pantalla muestra 3 códigos QR distintos y el resumen de la compra

#### Scenario: Compra rechazada
- **WHEN** la venta está `rechazada`
- **THEN** la pantalla explica el motivo y ofrece volver a intentar

#### Scenario: Compra pendiente
- **WHEN** la venta está `pendiente`
- **THEN** la pantalla no muestra ningún código QR

### Requirement: Guardar el enlace de la compra
Como el sistema no envía correos, la pantalla de una compra confirmada SHALL indicar al comprador que guarde el enlace para volver a ver sus entradas.

#### Scenario: Aviso de guardar el enlace
- **WHEN** la pantalla muestra una compra confirmada
- **THEN** incluye una indicación de guardar o copiar el enlace de la compra
