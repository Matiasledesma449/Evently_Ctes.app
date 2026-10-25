## Purpose

Define qué páginas del panel muestran el evento activo con una franja, qué dice y qué pasa si no hay evento.

## ADDED Requirements

### Requirement: Franja con el evento activo
Las páginas del panel que trabajan sobre un evento SHALL mostrar arriba una franja con el nombre del evento activo y un enlace "Cambiar" que lleva a la lista de Eventos. En Resumen, Ventas y Reportes SHALL seguir el selector existente; la franja no lo reemplaza.

#### Scenario: Página con evento
- **WHEN** una persona abre el Escáner con un evento activo
- **THEN** arriba aparece el nombre de ese evento y el enlace "Cambiar"

#### Scenario: Mientras carga
- **WHEN** la página todavía no recibió el nombre del evento
- **THEN** la franja muestra "—" y no cambia de tamaño al llegar el nombre

### Requirement: Mismo evento que el resto del panel
La franja SHALL usar el mismo evento activo que el selector: el de la dirección (`?id=`) o, si no hay, el recordado.

#### Scenario: Viene de otra pantalla
- **WHEN** una persona elige un evento en Ventas y después va al Escáner por el menú
- **THEN** la franja del Escáner muestra ese mismo evento

### Requirement: Sin evento o con un evento que no existe
Si no hay evento activo o ya no existe, la franja SHALL mostrar "Elegí un evento para ver sus datos" con el enlace a la lista de Eventos, sin errores y sin redirigir.

#### Scenario: Evento inexistente
- **WHEN** se abre el Escáner con un `?id=` que no existe
- **THEN** la franja muestra "Elegí un evento para ver sus datos" y no aparece ningún error
