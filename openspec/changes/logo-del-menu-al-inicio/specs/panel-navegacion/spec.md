## ADDED Requirements

### Requirement: El logo del menú vuelve al inicio
El logo de Evently del menú lateral del panel SHALL ser un enlace a la lista de Eventos, y SHALL verse también con el menú achicado.

#### Scenario: Menú ancho
- **WHEN** la persona toca el logo con el menú ancho
- **THEN** va a la lista de Eventos

#### Scenario: Menú achicado
- **WHEN** el menú está achicado
- **THEN** se ve la versión corta del logo y, al tocarla, va a la lista de Eventos
