## Purpose

Define los campos separados del detalle de un evento y cómo conviven con la descripción vieja.

## ADDED Requirements

### Requirement: Detalle en cuatro campos
El formulario de evento SHALL pedir actividad, tipo de evento, requisitos y edad en campos separados.

#### Scenario: Detalle completo
- **WHEN** una persona completa los cuatro campos y envía
- **THEN** el evento se guarda con `detalle` que tiene `actividad`, `tipo`, `requisitos` y `edad`

#### Scenario: Campos opcionales vacíos
- **WHEN** se dejan vacíos requisitos y edad
- **THEN** `detalle` no los guarda y la página no muestra filas vacías

#### Scenario: Tipo "Otro"
- **WHEN** se elige "Otro" como tipo
- **THEN** se pide escribir cuál y eso es lo que se guarda

### Requirement: La descripción vieja sigue funcionando
Un evento sin `detalle` SHALL mostrar su `descripcion` como hasta ahora.

#### Scenario: Evento anterior al cambio
- **WHEN** se abre un evento con `descripcion` y sin `detalle`
- **THEN** se muestra el texto de siempre

### Requirement: Texto seguro
Los textos del detalle SHALL mostrarse como texto, nunca como HTML.

#### Scenario: Texto con etiquetas
- **WHEN** un campo tiene `<b>hola</b>`
- **THEN** la página muestra las letras `<b>hola</b>` y no negrita
