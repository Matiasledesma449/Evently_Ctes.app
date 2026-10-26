## Purpose

Define cómo se calcula, se muestra y se cobra el costo de servicio que paga el comprador, y qué desglose queda guardado en la venta.

## ADDED Requirements

### Requirement: El servidor calcula el costo de servicio
Al crear el pago, el servidor SHALL calcular el costo de servicio como el porcentaje de la categoría del evento sobre el subtotal de las entradas, redondeado a 2 decimales; NO SHALL usar ningún monto ni porcentaje enviado por el navegador.

#### Scenario: Evento con 8%
- **WHEN** se compran 3 entradas de $1.500 en un evento con categoría de 8%
- **THEN** el subtotal es $4.500, el costo de servicio $360 y el total $4.860

#### Scenario: Redondeo
- **WHEN** el subtotal es $1.234 y el porcentaje 7,5
- **THEN** el costo de servicio es $92,55 y el total $1.326,55

#### Scenario: Sin categoría
- **WHEN** el evento no tiene categoría
- **THEN** el costo de servicio es $0 y el total es el subtotal

#### Scenario: El navegador manda un porcentaje
- **WHEN** el pedido incluye un campo `comision` o `porcentaje`
- **THEN** se ignora

### Requirement: No vender si no se puede leer la configuración
Si el servidor no puede leer las categorías, NO SHALL crear la venta ni el pago.

#### Scenario: Falla la lectura
- **WHEN** la lectura de `configuracion/comisiones` da error
- **THEN** el comprador recibe el mensaje genérico de pago no iniciado y no se crea ninguna venta

### Requirement: Cobro en Mercado Pago como renglón aparte
La preferencia de pago SHALL incluir un renglón "Costo de servicio" por el importe calculado cuando sea mayor que cero, y SHALL dejar el renglón de las entradas como hoy; NO SHALL restringir las cuotas.

#### Scenario: Con costo
- **WHEN** el costo de servicio es $360
- **THEN** la preferencia tiene dos renglones y la suma coincide con `monto_total`

#### Scenario: Sin costo
- **WHEN** el costo es $0
- **THEN** la preferencia tiene solo el renglón de las entradas

#### Scenario: Cuotas
- **WHEN** se crea la preferencia
- **THEN** no lleva ninguna restricción de cuotas

### Requirement: La venta guarda el desglose
La venta SHALL guardar `subtotal`, `costo_servicio`, `comision_porcentaje`, `comision_categoria` y `monto_total = subtotal + costo_servicio`; el webhook SHALL seguir comparando el pago contra `monto_total`.

#### Scenario: Pago por el monto correcto
- **WHEN** Mercado Pago aprueba un pago igual a `monto_total`
- **THEN** la venta se confirma

#### Scenario: Pago sin el costo de servicio
- **WHEN** llega un pago igual solo al subtotal en una venta con costo de servicio
- **THEN** la venta no se confirma y queda marcada para revisar

### Requirement: El comprador ve el desglose
La página del evento SHALL mostrar Entradas, Costo de servicio (con su porcentaje) y Total cuando el porcentaje sea mayor que cero, y solo el Total cuando sea cero; la confirmación SHALL mostrar el costo de servicio de la venta si lo tiene.

#### Scenario: Con costo
- **WHEN** la persona elige 2 entradas de $1.000 en un evento con 10%
- **THEN** ve Entradas $2.000, Costo de servicio (10%) $200 y Total $2.200

#### Scenario: Sin costo
- **WHEN** el evento no tiene categoría
- **THEN** ve solo el Total, como antes

#### Scenario: Venta vieja
- **WHEN** se abre la confirmación de una venta anterior a este cambio
- **THEN** se ve como siempre, sin línea de costo de servicio
