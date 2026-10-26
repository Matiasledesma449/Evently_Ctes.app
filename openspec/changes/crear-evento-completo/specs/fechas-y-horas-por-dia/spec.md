## Purpose

Define cómo se cargan, guardan y muestran los días de un evento con su horario.

## ADDED Requirements

### Requirement: Uno o más días con hora de inicio y de fin
El formulario de evento SHALL permitir cargar uno o más días, cada uno con fecha, hora de inicio y hora de fin.

#### Scenario: Evento de dos días
- **WHEN** una persona agrega dos días con sus horas y envía el formulario
- **THEN** el evento se guarda con `dias` de dos elementos ordenados por fecha

#### Scenario: Sin ningún día
- **WHEN** una persona intenta enviar sin fecha en el primer día
- **THEN** se muestra el aviso "La fecha es obligatoria" y no se guarda nada

#### Scenario: Termina de madrugada
- **WHEN** la hora de fin es menor que la de inicio
- **THEN** se acepta y se muestra "termina al día siguiente"

### Requirement: `fecha` sigue existiendo
El evento SHALL seguir guardando `fecha` como texto del primer día, para que lo que ya lee esa propiedad no cambie.

#### Scenario: Orden en el inicio
- **WHEN** un evento con `dias` se guarda
- **THEN** `fecha` tiene el formato `15 Diciembre 2026` y `public/index.html` lo ordena como a cualquier otro

### Requirement: Eventos viejos sin cambios
Un evento sin `dias` SHALL mostrarse con su `fecha` de texto, como hasta ahora.

#### Scenario: Evento anterior al cambio
- **WHEN** se abre un evento guardado antes de este cambio
- **THEN** la página muestra un solo renglón con su `fecha`, sin horario ni errores

### Requirement: Cada día se ve con su horario
La página del evento SHALL mostrar un renglón por día con su horario.

#### Scenario: Página de evento
- **WHEN** se abre un evento con dos días
- **THEN** se ven dos renglones, cada uno con día y hora de inicio y fin
