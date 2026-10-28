## Purpose

Define cómo se calcula y se muestra el estado nuevo / leído / respondido en Mensajes y en Consultas públicas.

## ADDED Requirements

### Requirement: Estado de una conversación
El panel SHALL calcular el estado de cada conversación de Mensajes como nuevo, leído o respondido, a partir de quién escribió el último mensaje y si se abrió.

#### Scenario: Mensaje nuevo de una organización
- **WHEN** el último mensaje lo escribió la organización y el superadmin todavía no abrió la conversación
- **THEN** la conversación está en "Nuevo", con nombre en negrita y marca ámbar

#### Scenario: Conversación abierta sin responder
- **WHEN** el superadmin abre esa conversación y no escribe
- **THEN** pasa a "Leído", en gris y sin marca

#### Scenario: Respondida
- **WHEN** el último mensaje lo escribió el superadmin
- **THEN** la conversación está en "Respondido", con tilde verde

#### Scenario: Conversación vieja
- **WHEN** la conversación no tiene `ultimoDe`
- **THEN** se muestra como "Leído" y no falla

### Requirement: Estado de una consulta pública
Las consultas públicas SHALL mostrar su estado guardado (`nueva`, `leida`, `respondida`) con los mismos colores y etiquetas que Mensajes.

#### Scenario: Abrir una consulta nueva
- **WHEN** el superadmin abre una consulta en estado `nueva`
- **THEN** pasa a `leida` sola

#### Scenario: Marcar como respondida
- **WHEN** el superadmin toca "Marcar como respondida"
- **THEN** la consulta queda en `respondida`, en verde

#### Scenario: Estado desconocido
- **WHEN** una consulta no tiene estado o tiene uno que no existe
- **THEN** se muestra como "Leído" y no falla

### Requirement: Guardar a quién le toca
Al enviar un mensaje, tanto el superadmin como la organización SHALL dejar anotado en la conversación quién escribió el último mensaje y que todavía no se leyó.

#### Scenario: Envía la organización desde Soporte
- **WHEN** la organización envía un mensaje
- **THEN** la conversación guarda `ultimoDe` con su identificador y `ultimoLeido: false`

#### Scenario: Abre el superadmin
- **WHEN** el superadmin abre una conversación con `ultimoLeido` distinto de `true` y `ultimoDe` de la otra persona
- **THEN** la conversación guarda `ultimoLeido: true` una sola vez
