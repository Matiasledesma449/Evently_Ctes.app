## Purpose

Define cuál es el evento que se está mirando en el panel (el evento activo): cómo se elige con un selector visible, cómo se recuerda entre pantallas y qué eventos puede elegir cada persona.

## ADDED Requirements

### Requirement: Selector de evento visible
Las pantallas Resumen, Ventas y Reportes SHALL mostrar arriba un selector con el nombre del evento activo, para que siempre se vea de qué evento hablan las cifras.

#### Scenario: Se ve el evento
- **WHEN** una persona abre Resumen, Ventas o Reportes con un evento activo
- **THEN** arriba aparece un selector que muestra el nombre de ese evento

### Requirement: Eventos que puede elegir cada persona
El selector SHALL listar todos los eventos si la persona es superadmin y, si es organización, solo los eventos propios, con el mismo criterio que la lista de Eventos (creados por ella, de su organización o con su correo).

#### Scenario: Superadmin
- **WHEN** un superadmin abre el selector
- **THEN** ve todos los eventos

#### Scenario: Organización
- **WHEN** una organización abre el selector
- **THEN** ve solo los eventos que creó o que son de su organización, no los de otras

### Requirement: Cambiar de evento
Al elegir otro evento en el selector, la pantalla SHALL volver a cargarse con los datos del evento elegido, con su identificador en el `?id=` de la dirección, y SHALL recordar ese evento como el activo.

#### Scenario: Cambio de evento
- **WHEN** la persona elige otro evento en el selector
- **THEN** la pantalla se vuelve a cargar mostrando los datos del nuevo evento, y la dirección lleva su identificador

### Requirement: El evento activo se recuerda siempre
Un evento SHALL quedar recordado como activo tanto si se lo eligió en el selector o en la lista de Eventos como si se entró con un enlace que lo trae en la dirección. Todas las pantallas del panel y el enlace "Resumen" del menú SHALL usar ese evento.

#### Scenario: Entrar con un enlace con evento
- **WHEN** una persona abre una pantalla con el evento en la dirección y después va a otra pantalla con el menú
- **THEN** la otra pantalla muestra el mismo evento

### Requirement: Sin evento o con un evento que no existe
Si no hay un evento activo o ya no existe o no corresponde a la persona, la pantalla SHALL mostrar el selector y un texto que invite a elegir un evento, sin cifras, sin errores y sin llevar a otra pantalla.

#### Scenario: Evento inexistente
- **WHEN** se abre una pantalla con un identificador de evento que no existe
- **THEN** se muestra el selector y el texto "Elegí un evento para ver sus datos", sin errores en pantalla
