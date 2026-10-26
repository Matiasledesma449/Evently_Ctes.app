## Purpose

Define qué ve el superadmin al entrar al panel.

## ADDED Requirements

### Requirement: El superadmin ve los eventos directamente
Al entrar, el superadmin SHALL ver la lista de eventos de todas las organizaciones, sin pasar antes por una grilla de organizaciones.

#### Scenario: Entrada
- **WHEN** el superadmin abre "Eventos"
- **THEN** ve las tarjetas de los eventos con el nombre de la organización de cada uno

#### Scenario: Filtrar por organización
- **WHEN** elige una organización en el selector
- **THEN** ve solo sus eventos, y puede volver a "Todas las organizaciones"

#### Scenario: Evento sin organización identificable
- **WHEN** un evento no se puede asociar a ninguna organización
- **THEN** se muestra igual, con "Organización no identificada"

### Requirement: Sin Panel global en el menú
El menú del panel SHALL NOT mostrar "Panel global" a ningún rol.

#### Scenario: Menú del superadmin
- **WHEN** el superadmin mira el menú, en escritorio o en celular
- **THEN** no aparece "Panel global" y siguen "Eventos", "Crear evento", "Mensajes" y "Consultas públicas"
