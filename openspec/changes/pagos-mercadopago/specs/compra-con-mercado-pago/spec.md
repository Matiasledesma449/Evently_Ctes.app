# Spec Delta

## Purpose

Define cómo se inicia una compra de entradas: qué datos da el comprador, qué decide el servidor (precio, stock, estado) y cómo se lo envía a pagar a Mercado Pago sin que el sitio toque datos de tarjeta.

## ADDED Requirements

### Requirement: Datos obligatorios del comprador
El sistema SHALL exigir nombre, apellido y un correo con formato válido antes de iniciar el pago. La cantidad MUST ser un número entero entre 1 y 10.

#### Scenario: Datos completos
- **WHEN** el comprador completa nombre, apellido, un correo válido y una cantidad entre 1 y 10
- **THEN** el sistema inicia el pago y lo lleva a la página de Mercado Pago

#### Scenario: Falta un dato o es inválido
- **WHEN** falta el nombre, el apellido, el correo, el correo no tiene formato válido, o la cantidad es 0, mayor que 10 o no es un número entero
- **THEN** el sistema rechaza el pedido con un mensaje que indica qué corregir y no crea ninguna venta

### Requirement: El servidor decide el precio y el estado
El sistema MUST calcular el precio de cada entrada y el total en el servidor, usando el lote guardado del evento. El pedido del navegador SHALL traer solo el evento, el lote, la cantidad y los datos del comprador, y cualquier precio o estado que traiga MUST ignorarse.

#### Scenario: Precio manipulado en el navegador
- **WHEN** el pedido incluye un precio o un estado distinto del real
- **THEN** la venta se crea con el precio del lote guardado y en estado `pendiente`

### Requirement: Solo se vende lo que existe y está publicado
El sistema SHALL aceptar compras solo de eventos publicados y de lotes que existan. Las entradas disponibles de un lote son su capacidad menos las ya vendidas en ventas confirmadas, y las ventas pendientes no se descuentan.

#### Scenario: Evento no publicado o lote inexistente
- **WHEN** el pedido es de un evento que no está publicado o de un lote que no existe
- **THEN** el sistema responde con un error claro y no crea ninguna venta

#### Scenario: Más entradas que las disponibles
- **WHEN** la cantidad pedida es mayor que las entradas disponibles del lote
- **THEN** el sistema responde indicando cuántas quedan y no crea ninguna venta

### Requirement: La venta nace pendiente con vencimiento y token
Al aceptar un pedido, el sistema SHALL crear una venta en estado `pendiente` con un token de consulta aleatorio que no se pueda adivinar y un vencimiento de 30 minutos. La venta MUST guardar nombre, apellido, correo, evento, lote, cantidad y monto total.

#### Scenario: Venta creada
- **WHEN** el pedido es válido
- **THEN** existe una venta `pendiente` con su token, su vencimiento a 30 minutos y el monto calculado por el servidor, y todavía sin entradas

### Requirement: Preferencia de pago con métodos permitidos
El sistema SHALL crear en Mercado Pago un pago asociado a la venta, que vence a los 30 minutos y vuelve al sitio al terminar. Solo MUST permitir tarjetas de crédito, tarjetas de débito y dinero en cuenta, y MUST excluir efectivo y cualquier otro método. Cuando el pago se aprueba, el comprador vuelve automáticamente a la pantalla de confirmación.

#### Scenario: Pago creado
- **WHEN** la venta se creó correctamente
- **THEN** el sistema devuelve el enlace de pago de Mercado Pago y el navegador lo abre

#### Scenario: Efectivo no disponible
- **WHEN** el comprador está en la página de Mercado Pago
- **THEN** no aparece la opción de pagar en efectivo ni en puntos de pago

#### Scenario: Mercado Pago no responde
- **WHEN** Mercado Pago rechaza la creación del pago o no responde
- **THEN** la venta queda `rechazada` con motivo `error_mercado_pago` y el comprador ve un mensaje para reintentar

### Requirement: El sitio no maneja datos de tarjeta
El sitio de Evently MUST NOT pedir, mostrar ni guardar números de tarjeta, vencimientos ni códigos de seguridad. Esos datos se cargan solo en la página de Mercado Pago.

#### Scenario: Pantalla de compra
- **WHEN** el comprador llega al último paso de la compra en `evento.html`
- **THEN** ve solo sus datos personales, el resumen y el botón para pagar con Mercado Pago, sin campos de tarjeta, billetera ni efectivo

### Requirement: Aviso de modo de prueba
Mientras se use Mercado Pago en modo de prueba, la pantalla de compra SHALL mostrar un aviso visible de que los pagos son de prueba y que no se deben usar datos reales.

#### Scenario: Aviso visible
- **WHEN** el comprador está por pagar
- **THEN** la pantalla muestra el aviso de modo de prueba
