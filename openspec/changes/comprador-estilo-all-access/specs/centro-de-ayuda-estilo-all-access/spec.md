## Purpose

Define el Centro de ayuda del comprador: portada con buscador, tarjetas por tema, contacto y formulario de solicitud.

## ADDED Requirements

### Requirement: Portada con buscador
El Centro de ayuda SHALL abrir con una portada violeta con el título "¿Cómo podemos ayudarte?" y un buscador con botón "Buscar".

#### Scenario: Buscar
- **WHEN** el comprador escribe "tarjeta" y toca "Buscar"
- **THEN** ve las preguntas que hablan de tarjeta, abiertas

### Requirement: Tarjetas por tema
El Centro de ayuda SHALL mostrar una tarjeta por tema con su ícono y una frase, que lleva a las preguntas de ese tema.

#### Scenario: Tocar un tema
- **WHEN** el comprador toca "Mi entrada"
- **THEN** la página baja a las preguntas de "Mi entrada"

### Requirement: Enviar una solicitud
El formulario SHALL pedir correo, asunto, nombre y apellido y descripción, y aceptar DNI, evento y número de compra opcionales, y guardar todo como una consulta pública.

#### Scenario: Solicitud completa
- **WHEN** el comprador completa todo y envía
- **THEN** se guarda una consulta pública nueva cuyo mensaje incluye el asunto, el DNI, el evento, el número de compra y la descripción, y se ve un aviso de que fue recibida

#### Scenario: DNI con puntos
- **WHEN** escribe el DNI como "30.123.456"
- **THEN** se acepta como 30123456

#### Scenario: Texto con etiquetas
- **WHEN** la descripción contiene `<b>hola</b>`
- **THEN** se guarda y se muestra como texto
