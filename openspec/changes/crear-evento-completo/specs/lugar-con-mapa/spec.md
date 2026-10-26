## Purpose

Define las sugerencias de lugar y el mapa del evento. El detalle depende de la pregunta 1 de `proposal.md`; lo de abajo vale para cualquier opción.

## ADDED Requirements

### Requirement: El lugar sigue siendo texto
El evento SHALL guardar siempre `lugar` como texto, aunque se elija una sugerencia.

#### Scenario: Sin sugerencia
- **WHEN** una persona escribe un lugar y no elige ninguna sugerencia
- **THEN** el evento se guarda con ese texto y sin `ubicacion`

#### Scenario: Con sugerencia
- **WHEN** una persona elige una sugerencia
- **THEN** `lugar` queda con el texto elegido y `ubicacion` guarda latitud y longitud

### Requirement: Sin mapa no se rompe nada
Si el servicio de sugerencias o mapa no responde, el formulario SHALL seguir permitiendo escribir el lugar y enviar.

#### Scenario: Sin conexión al servicio
- **WHEN** falla la búsqueda de sugerencias
- **THEN** aparece un aviso corto y el campo sigue funcionando como texto

### Requirement: Mapa en la página del evento
La página del evento SHALL mostrar el mapa (o el botón "Ver en el mapa" si se elige la opción C) solo cuando el evento tiene `ubicacion` o `lugar`.

#### Scenario: Evento viejo
- **WHEN** se abre un evento sin `ubicacion`
- **THEN** no se muestra mapa y el lugar se ve como siempre
