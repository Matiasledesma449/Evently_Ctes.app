# Spec Delta

## Purpose

Define cómo el servidor confirma o rechaza una venta a partir del aviso de Mercado Pago, sin confiar en el navegador ni en el contenido del aviso, y cómo se emiten las entradas solo cuando el pago está aprobado.

## ADDED Requirements

### Requirement: Solo se aceptan avisos auténticos
El sistema MUST verificar que cada aviso de Mercado Pago traiga una firma válida calculada con la clave secreta de la aplicación. Un aviso sin firma o con firma incorrecta MUST rechazarse sin modificar ninguna venta.

#### Scenario: Firma incorrecta
- **WHEN** llega un aviso con la firma ausente, vencida o que no coincide
- **THEN** el sistema responde con un error de no autorizado y no cambia ninguna venta

#### Scenario: Firma correcta
- **WHEN** llega un aviso con la firma válida
- **THEN** el sistema continúa con la verificación del pago

### Requirement: El estado del pago se consulta a Mercado Pago
El sistema SHALL tomar del aviso solo el identificador del pago y consultar el pago directamente a Mercado Pago. Nunca MUST confirmar una venta por lo que diga el cuerpo del aviso ni por los datos que vuelven en la dirección del navegador.

#### Scenario: Aviso con datos falsos
- **WHEN** un aviso firmado dice "aprobado" pero la consulta a Mercado Pago muestra otro estado
- **THEN** la venta toma el estado real de la consulta

### Requirement: El pago debe coincidir con la venta
Antes de confirmar, el sistema MUST comprobar que el pago pertenece a una venta existente, que la moneda es pesos argentinos y que el monto del pago coincide con el monto de la venta. Si algo no coincide, MUST NOT confirmar la venta y SHALL registrar el motivo.

#### Scenario: Monto distinto
- **WHEN** el pago está aprobado pero su monto no coincide con el de la venta
- **THEN** la venta no se confirma y queda marcada para revisión

#### Scenario: Venta inexistente
- **WHEN** el pago no corresponde a ninguna venta
- **THEN** el sistema no cambia nada y responde que el aviso fue recibido

### Requirement: Confirmación con emisión de entradas
Cuando el pago está aprobado y coincide con la venta, el sistema SHALL, en una sola operación, pasar la venta a `confirmada`, sumar las entradas vendidas al lote, guardar el método de pago real (Crédito, Débito, Prepaga o Dinero en cuenta) y generar una entrada por cada unidad con un código aleatorio difícil de adivinar y sin usar.

#### Scenario: Pago aprobado
- **WHEN** Mercado Pago informa un pago aprobado que coincide con la venta
- **THEN** la venta queda `confirmada`, el lote suma las unidades vendidas y la venta tiene tantas entradas como cantidad, todas sin usar

#### Scenario: Códigos distintos
- **WHEN** se generan las entradas de una venta
- **THEN** cada entrada tiene un código distinto de las demás

### Requirement: Confirmar es seguro si el aviso se repite
Si el mismo aviso llega más de una vez, el sistema MUST dejar el mismo resultado que si hubiera llegado una sola vez: sin entradas duplicadas ni descuentos de stock repetidos.

#### Scenario: Aviso repetido
- **WHEN** llega otra vez el aviso de un pago ya confirmado
- **THEN** la venta, sus entradas y el stock no cambian y el sistema responde que lo recibió

### Requirement: Pagos pendientes y rechazados
Si Mercado Pago informa que el pago está pendiente o en proceso, la venta SHALL seguir `pendiente`. Si informa que fue rechazado o cancelado, la venta MUST pasar a `rechazada` con el motivo del rechazo. Una venta `rechazada` puede pasar a `confirmada` si después llega un pago aprobado y todavía hay stock.

#### Scenario: Pago pendiente
- **WHEN** el pago queda pendiente o en proceso
- **THEN** la venta sigue `pendiente` y no tiene entradas

#### Scenario: Pago rechazado
- **WHEN** el pago es rechazado o cancelado
- **THEN** la venta queda `rechazada` con su motivo y el stock no cambia

#### Scenario: Reintento aprobado
- **WHEN** una venta `rechazada` recibe un pago aprobado posterior y hay stock
- **THEN** la venta pasa a `confirmada` y se emiten sus entradas

### Requirement: Una venta confirmada no retrocede
El sistema MUST NOT cambiar una venta `confirmada` a otro estado por un aviso posterior.

#### Scenario: Aviso tardío de rechazo
- **WHEN** llega un aviso de rechazo de un pago anterior a una venta que ya está `confirmada`
- **THEN** la venta sigue `confirmada`

### Requirement: Sin stock al confirmar
Si al confirmar un pago aprobado ya no hay entradas suficientes en el lote, el sistema MUST NOT emitir entradas. La venta SHALL quedar `rechazada` con motivo `sin_stock` y marcada para reembolso manual.

#### Scenario: Se agotó entre medio
- **WHEN** dos compradores pagan la última entrada y el segundo aviso llega cuando ya no queda stock
- **THEN** la segunda venta queda `rechazada` con motivo `sin_stock` y `requiereReembolso`, y el lote no vende de más

### Requirement: Respuesta rápida y reintentos
El sistema SHALL responder a Mercado Pago dentro del tiempo permitido (22 segundos). Si ocurre un error temporal al procesar, MUST responder con un error para que Mercado Pago reintente, y no con un éxito.

#### Scenario: Error temporal
- **WHEN** falla una consulta o la base de datos mientras se procesa un aviso válido
- **THEN** el sistema responde con un error, no cambia la venta a medias y Mercado Pago vuelve a avisar
